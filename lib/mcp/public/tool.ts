import type { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/server";
import { enforceMcpCostlyLimit } from "@/lib/middleware/with-rate-limit";
import { recordToolCall } from "@/lib/services/mcp/telemetry";
import { ToolTimeoutError, logToolError, toolErrorCode } from "./errors";

export interface PublicTool<
  Input extends z.ZodRawShape,
  Output extends z.ZodRawShape,
  /** Who is calling: the address alone here; the signed-in user too on the account endpoint. */
  Caller extends CallerContext = CallerContext,
> {
  name: string;
  title: string;
  description: string;
  inputSchema: Input;
  outputSchema: Output;
  /** Whether a call spends the costly-call window (free text, deep pages, comparisons). */
  costly?: (input: z.output<z.ZodObject<Input>>) => boolean;
  run: (input: z.output<z.ZodObject<Input>>, caller: Caller) => Promise<ToolOutput<Output>>;
}

export interface ToolOutput<Output extends z.ZodRawShape> {
  structured: z.output<z.ZodObject<Output>>;
  /** How many results the answer holds, for the measures; omit when not a list. */
  count?: number;
}

/** Who is calling, as far as the measures may know. */
export interface CallerContext {
  ip: string | null;
  userAgent: string | null;
}

/** A tool's whole time budget; the route's own limit is above it. */
export const TOOL_TIMEOUT_MS = 5_000;

function withinBudget<T>(tool: string, work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ToolTimeoutError(tool)), TOOL_TIMEOUT_MS);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

export async function runTool<Input extends z.ZodRawShape, Output extends z.ZodRawShape, Caller extends CallerContext>(
  tool: PublicTool<Input, Output, Caller>,
  input: z.output<z.ZodObject<Input>>,
  caller: Caller
): Promise<CallToolResult> {
  const started = Date.now();
  let resultCount: number | null = null;
  let errorCode: string | null = null;
  try {
    if (tool.costly?.(input)) await enforceMcpCostlyLimit();
    const output = await withinBudget(tool.name, tool.run(input, caller));
    resultCount = output.count ?? null;
    return {
      structuredContent: output.structured,
      // For clients that read text only; the same data as the structured content.
      content: [{ type: "text", text: JSON.stringify(output.structured) }],
    };
  } catch (error) {
    errorCode = toolErrorCode(error);
    await logToolError(tool.name, error);
    return {
      isError: true,
      structuredContent: { error: errorCode },
      content: [{ type: "text", text: JSON.stringify({ error: errorCode }) }],
    };
  } finally {
    // Awaited: a detached write can be cut off when the function returns. It
    // never throws — recordToolCall swallows its own failures.
    await recordToolCall({
      tool: tool.name,
      durationMs: Date.now() - started,
      resultCount,
      errorCode,
      userAgent: caller.userAgent,
      ip: caller.ip,
    });
  }
}
