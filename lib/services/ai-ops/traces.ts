import { redactText } from "@/lib/ai/redact";
import * as aiTraceRepository from "@/lib/repositories/ai-trace";
import { NotFoundError } from "@/lib/utils/errors";
import { OPS_LIMITS } from "./usage";

/**
 * AI traces for an operator: what a call was sent and what came back, kept
 * 14 days (repositories/ai-trace). Stored redacted, and redacted again on the
 * way out — a pattern added to redact.ts since a trace was written still
 * applies to it — then capped, so one large reply cannot flood a listing.
 */

type StoredTrace = Awaited<ReturnType<typeof aiTraceRepository.findTraceById>> & {};

function cap(text: string, chars: number): string {
  return text.length > chars ? `${text.slice(0, chars)}…[truncated]` : text;
}

function present(trace: StoredTrace, fieldChars?: number) {
  const clean = (text: string) => (fieldChars === undefined ? redactText(text) : cap(redactText(text), fieldChars));
  return {
    id: trace.id,
    aiUsageId: trace.aiUsageId,
    createdAt: trace.createdAt.toISOString(),
    feature: trace.feature,
    model: trace.model,
    promptVersion: trace.promptVersion,
    errorCode: trace.errorCode,
    input: clean(trace.input),
    output: trace.output === null ? null : clean(trace.output),
  };
}

export async function listRecentTraces(filter: { limit: number; feature?: string; errorsOnly?: boolean }) {
  const limit = Math.min(Math.max(Math.trunc(filter.limit), 1), OPS_LIMITS.maxTraces);
  const traces = await aiTraceRepository.findRecentTraces({ ...filter, limit });
  return traces.map((trace) => present(trace, OPS_LIMITS.traceListFieldChars));
}

export async function getTrace(id: string) {
  const trace = await aiTraceRepository.findTraceById(id);
  if (!trace) throw new NotFoundError("Trace");
  return present(trace);
}
