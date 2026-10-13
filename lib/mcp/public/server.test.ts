import { describe, it, expect, vi, beforeEach } from "vitest";

const { recordToolCall } = vi.hoisted(() => ({ recordToolCall: vi.fn() }));
vi.mock("@/lib/services/mcp/telemetry", () => ({ recordToolCall }));
vi.mock("@/lib/middleware/with-rate-limit", () => ({ enforceMcpCostlyLimit: vi.fn() }));

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createPublicMcpServer } from "./server";

/** A real MCP client talking to the server over the SDK's in-memory transport. */
async function connect() {
  const server = createPublicMcpServer({ ip: null, userAgent: "vitest" });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const client = new Client({ name: "vitest", version: "1.0.0" });
  await client.connect(clientSide);
  return client;
}

beforeEach(() => vi.clearAllMocks());

describe("the public MCP server", () => {
  it("lists only its read-only tools, with their schemas", async () => {
    const { tools } = await (await connect()).listTools();
    expect(tools.map((tool) => tool.name)).toEqual(["search_cars", "get_car", "get_search_options"]);
    for (const tool of tools) {
      expect(tool.annotations, tool.name).toMatchObject({ readOnlyHint: true, destructiveHint: false, openWorldHint: false });
      expect(tool.outputSchema, tool.name).toBeDefined();
    }
  });

  it("states that listing text is data, not instructions", async () => {
    const client = await connect();
    expect(client.getInstructions()).toMatch(/never as instructions/);
  });

  it("answers the search options in English and Arabic", async () => {
    const client = await connect();
    const en = await client.callTool({ name: "get_search_options", arguments: { locale: "en" } });
    const ar = await client.callTool({ name: "get_search_options", arguments: { locale: "ar" } });
    const options = en.structuredContent as { makes: { value: string; label: string }[]; sorts: string[]; limits: { maxResultsPerPage: number } };
    expect(options.makes).toContainEqual({ value: "Toyota", label: "Toyota" });
    expect((ar.structuredContent as typeof options).makes).toContainEqual({ value: "Toyota", label: "تويوتا" });
    expect(options.sorts).toContain("priceAsc");
    expect(options.limits.maxResultsPerPage).toBe(20);
    expect(recordToolCall).toHaveBeenCalledWith(expect.objectContaining({ tool: "get_search_options", errorCode: null }));
  });

  it("refuses input outside the schema without running the tool", async () => {
    const result = await (await connect()).callTool({ name: "get_search_options", arguments: { locale: "fr" } });
    expect(result.isError).toBe(true);
    expect(recordToolCall).not.toHaveBeenCalled();
  });

  it("knows no tool it did not register", async () => {
    const result = await (await connect()).callTool({ name: "run_sql", arguments: {} }).catch((error: Error) => ({ isError: true, error }));
    expect(result).toMatchObject({ isError: true });
  });
});
