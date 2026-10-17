"use client";

import { useEffect, useRef } from "react";
import { toDescriptor, type WebMcpToolDefinition } from "@/lib/webmcp/define-tool";
import { registerWebMcpTools } from "@/lib/webmcp/register";
import { getModelContext } from "@/lib/webmcp/support";

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
