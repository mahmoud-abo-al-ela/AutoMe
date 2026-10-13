"use client";

import { useEffect, useRef } from "react";
import { toDescriptor, type WebMcpToolDefinition } from "@/lib/webmcp/define-tool";
import { registerWebMcpTools } from "@/lib/webmcp/register";
import { getModelContext } from "@/lib/webmcp/support";

/**
 * Offer a page's WebMCP tools while the page is mounted. Where the browser
 * has no WebMCP this does nothing at all. Tools are registered on mount and
 * unregistered on unmount — which in the App Router includes navigating to
 * another page — and when the set of tool names changes.
 *
 * A call always runs the definitions from the latest render, so a tool sees
 * the page's current state (its filters, its loaded car) without being
 * registered again each time that state changes.
 */
export function useWebMcpTools(definitions: readonly WebMcpToolDefinition[]): void {
  const latest = useRef(definitions);
  useEffect(() => {
    latest.current = definitions;
  });

  const names = definitions.map((definition) => definition.name).join("\n");

  useEffect(() => {
    const context = getModelContext();
    if (!context) return;

    const controller = new AbortController();
    const descriptors = latest.current.map((definition) =>
      toDescriptor({
        ...definition,
        run: (input, options) => {
          const current = latest.current.find((candidate) => candidate.name === definition.name) ?? definition;
          return current.run(input, options);
        },
      })
    );
    void registerWebMcpTools(context, descriptors, controller.signal);
    return () => controller.abort();
  }, [names]);
}
