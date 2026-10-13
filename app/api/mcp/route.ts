import { NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { enforceMcpPublicLimit } from "@/lib/middleware/with-rate-limit";
import { createPublicMcpServer } from "@/lib/mcp/public/server";
import { RateLimitError, ServiceUnavailableError, logError } from "@/lib/utils/errors";

/**
 * AutoMe's public MCP endpoint (Streamable HTTP, stateless, JSON responses):
 * read-only search of public listings for AI clients. No sign-in — it serves
 * only what any visitor can see (repositories/car/visibility.ts).
 *
 * Off unless MCP_PUBLIC_ENABLED is "true": a deploy never opens it by
 * accident, and turning it off needs no deploy. Every request is size-checked
 * and rate-limited before its body is read; see plans/mcp (SECURITY §3) for the
 * layers and their provisional values.
 */

export const runtime = "nodejs";
export const maxDuration = 10;

/** The largest call is under 2 KB; anything near this is not a real client. */
const MAX_BODY_BYTES = 16 * 1024;

const NEVER = { "Cache-Control": "no-store" };

const enabled = () => process.env.MCP_PUBLIC_ENABLED === "true";

function refuse(status: number, error: string, headers: Record<string, string> = {}) {
  return NextResponse.json({ error }, { status, headers: { ...NEVER, ...headers } });
}

/** A JSON-RPC error for a body that is not JSON-RPC at all. */
function parseError() {
  return NextResponse.json({ jsonrpc: "2.0", error: { code: -32700, message: "Parse error" }, id: null }, { status: 400, headers: NEVER });
}

/**
 * The request as the transport should see it. Streamable HTTP asks clients to
 * accept JSON and an event stream, and the SDK refuses one that accepts only
 * JSON (406) — but this server only ever answers in JSON, so a client that can
 * read JSON is served. Anything that accepts neither is still refused.
 */
function forTransport(request: Request): Request {
  const accept = request.headers.get("accept") ?? "";
  const readsJson = accept === "" || accept.includes("application/json") || accept.includes("*/*");
  if (!readsJson || accept.includes("text/event-stream")) return request;
  const headers = new Headers(request.headers);
  headers.set("accept", "application/json, text/event-stream");
  return new Request(request.url, { method: request.method, headers });
}

/** The caller's address, for the daily-salted hash in the measures only — never stored as is. */
function callerIp(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
}

export async function POST(request: Request) {
  if (!enabled()) return refuse(503, "disabled");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return refuse(413, "too_large");

  try {
    await enforceMcpPublicLimit();
  } catch (error) {
    if (error instanceof RateLimitError) {
      return refuse(429, "rate_limited", error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {});
    }
    if (error instanceof ServiceUnavailableError) return refuse(503, "unavailable");
    // Shield or a denied request: refused without saying why.
    return refuse(403, "forbidden");
  }

  // The declared length can lie or be absent; the body itself is measured.
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return refuse(413, "too_large");
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return parseError();
  }

  const server = createPublicMcpServer({ ip: callerIp(request), userAgent: request.headers.get("user-agent") });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    const response = await transport.handleRequest(forTransport(request), { parsedBody: body });
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    return new Response(response.body, { status: response.status, headers });
  } catch (error) {
    logError("MCP request failed", error);
    return refuse(500, "internal");
  } finally {
    await server.close();
  }
}

/** Stateless and JSON-only: there is no stream to open and no session to end. */
function methodNotAllowed() {
  return refuse(405, "method_not_allowed", { Allow: "POST" });
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;
