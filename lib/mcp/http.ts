import { NextResponse } from "next/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { reportMcpFailure } from "@/lib/services/mcp/monitoring";
import { RateLimitError, ServiceUnavailableError, logError } from "@/lib/utils/errors";

/**
 * What AutoMe's two MCP endpoints share over HTTP — the public one
 * (app/api/mcp) and the signed-in one (app/api/mcp/account): stateless,
 * JSON-only Streamable HTTP, small bodies, fixed error codes, nothing cached.
 */

/** The largest call is under 2 KB; anything near this is not a real client. */
export const MAX_BODY_BYTES = 16 * 1024;

export const NO_STORE = { "Cache-Control": "no-store" };

export function refuse(status: number, error: string, headers: Record<string, string> = {}) {
  return NextResponse.json({ error }, { status, headers: { ...NO_STORE, ...headers } });
}

/** A JSON-RPC error for a body that is not JSON-RPC at all. */
export function parseError() {
  return NextResponse.json({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }, { status: 400, headers: NO_STORE });
}

/**
 * The request as the transport should see it. Streamable HTTP asks clients to
 * accept JSON and an event stream, and the SDK refuses one that accepts only
 * JSON (406) — but these servers only ever answer in JSON, so a client that can
 * read JSON is served. Anything that accepts neither is still refused.
 */
export function forTransport(request: Request): Request {
  const accept = request.headers.get("accept") ?? "";
  const readsJson = accept === "" || accept.includes("application/json") || accept.includes("*/*");
  if (!readsJson || accept.includes("text/event-stream")) return request;
  const headers = new Headers(request.headers);
  headers.set("accept", "application/json, text/event-stream");
  return new Request(request.url, { method: request.method, headers });
}

/** The caller's address, for the daily-salted hash in the measures only — never stored as is. */
export function callerIp(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
}

/**
 * The body, measured — the declared length can lie or be absent — and parsed.
 * A Response to send back instead when it is too large or not JSON.
 */
export async function readJsonBody(request: Request): Promise<{ body: unknown } | { refused: Response }> {
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return { refused: refuse(413, "too_large") };
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { refused: parseError() };
  }
}

/** Stateless and JSON-only: there is no stream to open and no session to end. */
export function methodNotAllowed() {
  return refuse(405, "method_not_allowed", { Allow: "POST" });
}

/**
 * The answer to a request a limiter stopped: 429 when over the limit, 503
 * when the limiter itself could not decide (reported — every call is refused
 * until it can), 403 for the shield or any other denial, without saying why.
 */
export async function limitRefusal(error: unknown): Promise<Response> {
  if (error instanceof RateLimitError) {
    return refuse(429, "rate_limited", error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {});
  }
  if (error instanceof ServiceUnavailableError) {
    await reportMcpFailure({ tool: "(rate-limit)", code: "unavailable", error });
    return refuse(503, "unavailable");
  }
  return refuse(403, "forbidden");
}

/** Run one JSON-RPC request through a fresh server and the stateless transport. */
export async function serveMcp(server: McpServer, request: Request, body: unknown): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(forTransport(request), { parsedBody: body });
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    logError("MCP request failed", error);
    await reportMcpFailure({ tool: "(request)", code: "internal", error });
    return refuse(500, "internal");
  } finally {
    await server.close();
  }
}
