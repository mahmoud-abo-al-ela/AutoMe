import { NextResponse } from "next/server";
import { accountMcpEnabled, accountResourceMetadata } from "@/lib/services/mcp/account";
import { logError } from "@/lib/utils/errors";

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
