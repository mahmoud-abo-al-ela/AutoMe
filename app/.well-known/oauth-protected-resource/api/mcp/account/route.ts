import { NextResponse } from "next/server";
import { accountMcpEnabled, accountResourceMetadata } from "@/lib/services/mcp/account";
import { logError } from "@/lib/utils/errors";

/**
 * OAuth Protected Resource Metadata (RFC 9728) for the signed-in MCP endpoint
 * (app/api/mcp/account): where an MCP client signs the person in — the Clerk
 * instance — and how to present the token. Public by design, readable from
 * any origin (browser-based clients), and not found while the endpoint is off.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export function GET() {
  if (!accountMcpEnabled()) return NextResponse.json({ error: "not_found" }, { status: 404, headers: CORS });
  try {
    return NextResponse.json(accountResourceMetadata(), {
      headers: { ...CORS, "Cache-Control": "public, max-age=3600" },
    });
  } catch (error) {
    logError("Account MCP metadata unavailable", error);
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: CORS });
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}
