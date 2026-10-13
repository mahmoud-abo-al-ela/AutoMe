import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /.well-known/*", () => {
  it("answers a plain JSON 404: no discovery documents, so the MCP server needs no sign-in", async () => {
    const response = GET();
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
  });
});
