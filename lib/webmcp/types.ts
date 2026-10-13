/**
 * WebMCP as Chrome exposes it in its origin trial (Chrome 149–156), checked
 * against Chrome's docs on 2026-10-13 (plans/mcp D-25): `document.modelContext`
 * with one `registerTool` call per tool, unregistered by aborting the signal
 * passed with it. Only what AutoMe uses is typed; the API is still a draft,
 * so everything is optional at the edge and feature-detected (./support.ts).
 */

/** A JSON Schema object, as `inputSchema` takes it. */
export interface JsonSchemaObject {
  type: "object";
  properties?: Record<string, unknown>;
  required?: string[];
  [keyword: string]: unknown;
}

export interface WebMcpAnnotations {
  /** Only reads: an agent may call it without asking. */
  readOnlyHint?: boolean;
  /** The output carries text others wrote (listings, reviews): data, not instructions. */
  untrustedContentHint?: boolean;
  /** Significant or irreversible: an agent or the browser should ask the user first. */
  consequentialHint?: boolean;
}

/** A tool as registered with the browser. */
export interface WebMcpToolDescriptor {
  name: string;
  description: string;
  inputSchema: JsonSchemaObject;
  annotations?: WebMcpAnnotations;
  execute: (args: unknown, options?: { signal?: AbortSignal }) => Promise<string>;
}

export interface ModelContext {
  registerTool(tool: WebMcpToolDescriptor, options?: { signal?: AbortSignal; exposedTo?: string[] }): Promise<unknown>;
}

declare global {
  interface Document {
    /** WebMCP, where the browser offers it (Chrome's origin trial or its testing flag). */
    readonly modelContext?: ModelContext;
  }
}
