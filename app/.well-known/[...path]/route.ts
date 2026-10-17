import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
}
