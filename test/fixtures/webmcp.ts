import type { WebMcpToolDescriptor } from "@/lib/webmcp/types";

/**
 * A stand-in for Chrome's `document.modelContext`, for jsdom tests: it keeps
 * what was registered, drops a tool when its signal aborts — as Chrome does —
 * and lets a test call a tool the way an agent would.
 */
export function installModelContext() {
  const tools = new Map<string, WebMcpToolDescriptor>();
  const registerTool = async (tool: WebMcpToolDescriptor, options?: { signal?: AbortSignal }) => {
    if (tools.has(tool.name)) throw new DOMException(`A tool named ${tool.name} is already registered`, "InvalidStateError");
    if (options?.signal?.aborted) return;
    tools.set(tool.name, tool);
    options?.signal?.addEventListener("abort", () => tools.delete(tool.name), { once: true });
  };
  Object.defineProperty(document, "modelContext", { value: { registerTool }, configurable: true });

  return {
    tools,
    names: () => [...tools.keys()].sort(),
    /** Call a registered tool as an agent would; the reply, parsed when it is JSON. */
    async call(name: string, args: unknown): Promise<unknown> {
      const tool = tools.get(name);
      if (!tool) throw new Error(`No tool named ${name} is registered`);
      const reply = await tool.execute(args, { signal: new AbortController().signal });
      try {
        return JSON.parse(reply);
      } catch {
        return reply;
      }
    },
    uninstall() {
      delete (document as { modelContext?: unknown }).modelContext;
    },
  };
}
