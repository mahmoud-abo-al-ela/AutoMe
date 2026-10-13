import type { ModelContext } from "./types";

/**
 * The browser's WebMCP, or null where there is none — every browser but a
 * Chrome in the origin trial (or with its testing flag), and the server.
 * Null means the site simply works as it always has: tools are an addition
 * for agents, never something a page depends on.
 *
 * Only `document.modelContext.registerTool` counts. Early previews put a
 * different API on `navigator` (`provideContext`, replacing every tool at
 * once); it is not supported, rather than half-supported.
 */
export function getModelContext(): ModelContext | null {
  if (typeof document === "undefined") return null;
  const context = document.modelContext;
  return context && typeof context.registerTool === "function" ? context : null;
}
