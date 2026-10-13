import { logError } from "@/lib/utils/errors";
import type { ModelContext, WebMcpToolDescriptor } from "./types";

/**
 * Offer tools to the browser until `signal` aborts — aborting is how WebMCP
 * unregisters, so the caller's cleanup is a single `abort()`. Never throws:
 * a tool the browser refuses (a duplicate name, a schema it rejects) is
 * logged and the page carries on, since the page must work without it.
 */
export async function registerWebMcpTools(
  context: ModelContext,
  tools: readonly WebMcpToolDescriptor[],
  signal: AbortSignal
): Promise<void> {
  await Promise.all(
    tools.map((tool) =>
      context.registerTool(tool, { signal }).catch((error: unknown) => {
        // Unmounted while registering: the refusal is the abort, not a fault.
        if (!signal.aborted) logError(`WebMCP could not register the tool ${tool.name}`, error);
      })
    )
  );
}
