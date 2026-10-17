import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { refreshSearchVocabulary } from "@/lib/services/car/search-vocabulary";
import { logError } from "@/lib/utils/errors";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const refused = refuseCronRequest(request, "the search vocabulary refresh");
  if (refused) return refused;

  try {
    await refreshSearchVocabulary();
    return NextResponse.json({ refreshed: true });
  } catch (error) {
    logError("Search vocabulary refresh failed", error);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
