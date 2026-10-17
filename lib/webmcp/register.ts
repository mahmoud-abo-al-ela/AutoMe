import { logError } from "@/lib/utils/errors";
import type { ModelContext, WebMcpToolDescriptor } from "./types";

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
