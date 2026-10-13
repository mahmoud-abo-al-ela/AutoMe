import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { z } from "zod";
import type { WebMcpToolDefinition } from "@/lib/webmcp/define-tool";
import { installModelContext } from "@/test/fixtures/webmcp";
import { useWebMcpTools } from "./use-webmcp-tools";

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

let root: Root | null = null;

function Page({ tools }: { tools: WebMcpToolDefinition[] }) {
  useWebMcpTools(tools);
  return null;
}

async function render(tools: WebMcpToolDefinition[]) {
  if (!root) root = createRoot(document.createElement("div"));
  await act(async () => root!.render(createElement(Page, { tools })));
}

async function unmount() {
  await act(async () => root?.unmount());
  root = null;
}

afterEach(async () => {
  await unmount();
  delete (document as { modelContext?: unknown }).modelContext;
});

const tool = (name: string, run: WebMcpToolDefinition["run"] = async () => ({ ok: true })): WebMcpToolDefinition => ({
  name,
  description: `The ${name} tool.`,
  input: z.object({ page: z.number().int().min(1).max(20) }),
  annotations: { readOnlyHint: true },
  run,
});

describe("useWebMcpTools", () => {
  it("does nothing, and throws nothing, where the browser has no WebMCP", async () => {
    await expect(render([tool("search_cars")])).resolves.toBeUndefined();
    await unmount();
  });

  it("registers a page's tools on mount and unregisters them on unmount", async () => {
    const context = installModelContext();
    await render([tool("search_cars"), tool("open_car")]);
    expect(context.names()).toEqual(["open_car", "search_cars"]);
    await unmount();
    expect(context.names()).toEqual([]);
  });

  it("swaps the tools when the page's set changes, as on navigating to another page", async () => {
    const context = installModelContext();
    await render([tool("search_cars")]);
    await render([tool("get_car_details")]);
    expect(context.names()).toEqual(["get_car_details"]);
  });

  it("runs with the page's latest state, without registering again", async () => {
    const context = installModelContext();
    const registerTool = vi.spyOn(document.modelContext!, "registerTool");
    let filters = "first";
    const make = () => [tool("search_cars", async () => ({ filters }))];
    await render(make());
    filters = "second";
    await render(make());
    expect(await context.call("search_cars", { page: 1 })).toEqual({ filters: "second" });
    expect(registerTool).toHaveBeenCalledTimes(1);
  });

  it("refuses invalid input before the page does anything", async () => {
    const context = installModelContext();
    const run = vi.fn();
    await render([tool("search_cars", run)]);
    expect(await context.call("search_cars", { page: 999 })).toMatchObject({ error: "invalid_input" });
    expect(run).not.toHaveBeenCalled();
  });
});
