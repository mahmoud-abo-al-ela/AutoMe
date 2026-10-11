import { sentryEnabled } from "@/lib/sentry-enabled";

/**
 * Spans around AI work, so a slow request in Sentry shows where its time went:
 * which feature, which models were tried, how long each took, what it spent.
 *
 * Attribute names follow OpenTelemetry's generative-AI conventions
 * (`gen_ai.*`), which Sentry reads for its AI views. Metadata only — model,
 * tokens, outcome. **Never prompts, replies or image bytes**: spans leave the
 * building, and the content lives in AiTrace, redacted, under our control.
 *
 * Sentry is imported lazily and only when enabled, like telemetry.ts: in
 * development the SDK is not loaded at all and a span is a plain call.
 */

export type SpanAttributes = Record<string, string | number | boolean | undefined>;

export interface AiSpan {
  set(attributes: SpanAttributes): void;
}

const NO_SPAN: AiSpan = { set: () => {} };

function defined(attributes: SpanAttributes): Record<string, string | number | boolean> {
  return Object.fromEntries(Object.entries(attributes).filter(([, value]) => value !== undefined)) as Record<
    string,
    string | number | boolean
  >;
}

/**
 * Run `work` inside a span. A thrown error marks the span failed and is
 * rethrown untouched; tracing itself can never fail the work.
 */
export async function aiSpan<T>(
  op: string,
  name: string,
  attributes: SpanAttributes,
  work: (span: AiSpan) => Promise<T>
): Promise<T> {
  if (!sentryEnabled) return work(NO_SPAN);

  let Sentry: typeof import("@sentry/nextjs");
  try {
    Sentry = await import("@sentry/nextjs");
  } catch {
    return work(NO_SPAN);
  }
  return Sentry.startSpan({ op, name, attributes: defined(attributes) }, (span) =>
    work({
      set: (more) => {
        try {
          span.setAttributes(defined(more));
        } catch {
          // A span is a nicety; the call it describes is not.
        }
      },
    })
  );
}
