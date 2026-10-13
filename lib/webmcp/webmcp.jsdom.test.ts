import { describe, it, expect, vi, afterEach } from "vitest";
import { z } from "zod";

const { logError } = vi.hoisted(() => ({ logError: vi.fn() }));
vi.mock("@/lib/utils/errors", async (importOriginal) => ({ ...(await importOriginal<object>()), logError }));

import { WEBMCP_BUDGETS, toDescriptor } from "@/lib/webmcp/define-tool";
import { registerWebMcpTools } from "@/lib/webmcp/register";
import { getModelContext } from "@/lib/webmcp/support";
import { NotFoundError } from "@/lib/utils/errors";
import { installModelContext } from "@/test/fixtures/webmcp";

afterEach(() => {
  vi.clearAllMocks();
  delete (document as { modelContext?: unknown }).modelContext;
  delete (navigator as { modelContext?: unknown }).modelContext;
});

describe("getModelContext", () => {
  it("is null where the browser has no WebMCP", () => {
    expect(getModelContext()).toBeNull();
  });

  it("finds Chrome's document.modelContext", () => {
    installModelContext();
    expect(getModelContext()).not.toBeNull();
  });

  it("ignores the early previews' navigator API and anything without registerTool", () => {
    Object.defineProperty(navigator, "modelContext", { value: { provideContext: vi.fn() }, configurable: true });
    expect(getModelContext()).toBeNull();
    Object.defineProperty(document, "modelContext", { value: { provideContext: vi.fn() }, configurable: true });
    expect(getModelContext()).toBeNull();
  });
});

describe("toDescriptor", () => {
  const run = vi.fn();
  const tool = toDescriptor({
    name: "find_cars",
    description: "Find cars.",
    input: z.object({ make: z.string().max(40).describe("A make, e.g. Toyota."), maxPrice: z.number().int().positive().optional() }),
    annotations: { readOnlyHint: true },
    run,
  });

  it("describes its input as JSON Schema", () => {
    expect(tool.inputSchema).toEqual({
      type: "object",
      properties: {
        make: { type: "string", maxLength: 40, description: "A make, e.g. Toyota." },
        maxPrice: { type: "integer", exclusiveMinimum: 0 },
      },
      required: ["make"],
      additionalProperties: false,
    });
    expect(tool.annotations).toEqual({ readOnlyHint: true });
  });

  it("refuses input outside the schema before doing anything", async () => {
    for (const args of [{}, { make: 7 }, { make: "Kia", maxPrice: -1 }, "not json", null]) {
      const reply = JSON.parse(await tool.execute(args));
      expect(reply.error, JSON.stringify(args)).toBe("invalid_input");
    }
    expect(JSON.parse(await tool.execute({})).issues).toEqual([{ field: "make", message: "Required" }]);
    expect(run).not.toHaveBeenCalled();
  });

  it("runs valid input — given as an object or, as older Chrome does, a JSON string — and returns JSON", async () => {
    run.mockResolvedValue({ cars: 3 });
    expect(await tool.execute({ make: "Kia" })).toBe('{"cars":3}');
    expect(await tool.execute('{"make":"Kia","maxPrice":900000}')).toBe('{"cars":3}');
    expect(run).toHaveBeenLastCalledWith({ make: "Kia", maxPrice: 900000 }, {});
  });

  it("answers a failure with a code; only an unexpected one is logged", async () => {
    run.mockRejectedValueOnce(new NotFoundError("Car"));
    expect(JSON.parse(await tool.execute({ make: "Kia" }))).toEqual({ error: "not_found" });
    expect(logError).not.toHaveBeenCalled();

    run.mockRejectedValueOnce(new Error("boom: secret detail"));
    const reply = await tool.execute({ make: "Kia" });
    expect(JSON.parse(reply)).toEqual({ error: "failed" });
    expect(reply).not.toContain("secret");
    expect(logError).toHaveBeenCalledOnce();
  });

  it("keeps to Chrome's budgets", () => {
    expect(tool.name.length).toBeLessThanOrEqual(WEBMCP_BUDGETS.name);
    expect(tool.description.length).toBeLessThanOrEqual(WEBMCP_BUDGETS.description);
  });
});

describe("registerWebMcpTools", () => {
  const descriptor = (name: string) => toDescriptor({ name, description: name, input: z.object({}), run: async () => "ok" });

  it("registers until the signal aborts", async () => {
    const context = installModelContext();
    const controller = new AbortController();
    await registerWebMcpTools(getModelContext()!, [descriptor("a"), descriptor("b")], controller.signal);
    expect(context.names()).toEqual(["a", "b"]);
    controller.abort();
    expect(context.names()).toEqual([]);
  });

  it("logs a tool the browser refuses and registers the rest, without throwing", async () => {
    const context = installModelContext();
    await registerWebMcpTools(getModelContext()!, [descriptor("a")], new AbortController().signal);
    await expect(
      registerWebMcpTools(getModelContext()!, [descriptor("a"), descriptor("c")], new AbortController().signal)
    ).resolves.toBeUndefined();
    expect(context.names()).toEqual(["a", "c"]);
    expect(logError).toHaveBeenCalledWith("WebMCP could not register the tool a", expect.anything());
  });
});
