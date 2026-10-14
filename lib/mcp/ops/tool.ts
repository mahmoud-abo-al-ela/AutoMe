import type { z } from "zod";
import type { Redis } from "@upstash/redis";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { AppError, NotFoundError, ValidationError, logError } from "@/lib/utils/errors";

/**
 * One ops MCP tool: its contract and its work, the work a plain function over
 * lib/services/ai-ops, testable without a transport. runOpsTool wraps every
 * call the same way — a time budget, a fixed error code, one audit line.
 */

/** What the server was started with; nothing a caller can change. */
export interface OpsConfig {
  /** A read-only Redis client for the breaker's counters, or none (ledger only). */
  redis: Redis | null;
  /** The evaluation report to read, and the one before it to compare with. */
  evalReport?: string;
  previousEvalReport?: string;
  /** Where each call's audit line goes; stderr in the server. */
  audit: (line: string) => void;
}

export interface OpsTool<Input extends z.ZodRawShape, Output extends z.ZodRawShape> {
  name: string;
  title: string;
  description: string;
  inputSchema: Input;
  outputSchema: Output;
  run: (input: z.output<z.ZodObject<Input>>, config: OpsConfig) => Promise<z.output<z.ZodObject<Output>>>;
}

/** A tool needs something the server was not started with, e.g. a report path. */
export class NotConfiguredError extends Error {
  constructor(variable: string) {
    super(`Set ${variable} when starting the ops server`);
  }
}

class OpsTimeoutError extends Error {}

export type OpsErrorCode = "invalid_input" | "not_found" | "not_configured" | "unavailable" | "internal";

/** Database aggregates over a month of rows can take a while on a laptop. */
const OPS_TOOL_TIMEOUT_MS = 15_000;
const AUDIT_ARGS_CHARS = 200;

function errorOf(error: unknown): { code: OpsErrorCode; message?: string } {
  // These messages are ours and name no secret; anything else stays in the log.
  if (error instanceof NotConfiguredError) return { code: "not_configured", message: error.message };
  if (error instanceof ValidationError) return { code: "invalid_input", message: error.message };
  if (error instanceof NotFoundError) return { code: "not_found", message: error.message };
  if (error instanceof OpsTimeoutError) return { code: "unavailable" };
  return { code: "internal" };
}

function withinBudget<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new OpsTimeoutError()), OPS_TOOL_TIMEOUT_MS);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

export async function runOpsTool<Input extends z.ZodRawShape, Output extends z.ZodRawShape>(
  tool: OpsTool<Input, Output>,
  input: z.output<z.ZodObject<Input>>,
  config: OpsConfig
): Promise<CallToolResult> {
  const started = Date.now();
  let outcome = "ok";
  try {
    const structured = await withinBudget(tool.run(input, config));
    return { structuredContent: structured, content: [{ type: "text", text: JSON.stringify(structured) }] };
  } catch (error) {
    const failure = errorOf(error);
    outcome = failure.code;
    if (failure.code === "internal" || failure.code === "unavailable") {
      logError(`Ops MCP tool ${tool.name} failed (${failure.code})`, error instanceof AppError ? error.message : error);
    }
    const body = { error: failure.code, ...(failure.message && { message: failure.message }) };
    return { isError: true, structuredContent: body, content: [{ type: "text", text: JSON.stringify(body) }] };
  } finally {
    const args = JSON.stringify(input ?? {});
    config.audit(
      `ai-ops: ${new Date(started).toISOString()} ${tool.name} ${args.slice(0, AUDIT_ARGS_CHARS)} ${outcome} ${Date.now() - started}ms`
    );
  }
}
