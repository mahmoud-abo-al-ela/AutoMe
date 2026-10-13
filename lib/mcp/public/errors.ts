import {
  AppError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError,
  ValidationError,
  logError,
} from "@/lib/utils/errors";
import { reportMcpFailure } from "@/lib/services/mcp/monitoring";

/**
 * What a public MCP caller is told when a tool fails: one of a few fixed codes,
 * never a message, stack or query. The detail stays in the server log.
 */
export type ToolErrorCode = "invalid_input" | "not_found" | "rate_limited" | "unavailable" | "internal";

/** A tool ran past its time budget; reported as "unavailable". */
export class ToolTimeoutError extends Error {
  constructor(tool: string) {
    super(`MCP tool ${tool} ran past its time budget`);
  }
}

export function toolErrorCode(error: unknown): ToolErrorCode {
  if (error instanceof ValidationError) return "invalid_input";
  if (error instanceof NotFoundError) return "not_found";
  if (error instanceof RateLimitError) return "rate_limited";
  if (error instanceof ServiceUnavailableError || error instanceof ToolTimeoutError) return "unavailable";
  return "internal";
}

/**
 * Log what the caller will not see, unless it is an ordinary refusal, and
 * report it to Sentry (surface: mcp). Awaited by the caller: a report left
 * running can be cut off when the function returns.
 */
export async function logToolError(tool: string, error: unknown): Promise<void> {
  const code = toolErrorCode(error);
  if (code === "internal" || code === "unavailable") {
    logError(`MCP tool ${tool} failed (${code})`, error instanceof AppError ? error.message : error);
    await reportMcpFailure({ tool, code, error });
  }
}
