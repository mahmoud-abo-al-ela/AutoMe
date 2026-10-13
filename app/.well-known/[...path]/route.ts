import { NextResponse } from "next/server";

/**
 * No discovery documents are published. A plain JSON 404 — not a redirect to
 * a localized HTML page — is what tells an MCP client that the public server
 * at /api/mcp needs no sign-in (no OAuth protected-resource metadata).
 */
export function GET() {
  return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
}
