import type { ModelContext } from "./types";

export function getModelContext(): ModelContext | null {
  if (typeof document === "undefined") return null;
  const context = document.modelContext;
  return context && typeof context.registerTool === "function" ? context : null;
}
