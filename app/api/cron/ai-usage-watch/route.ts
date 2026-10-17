import { NextResponse } from "next/server";
import { refuseCronRequest } from "@/lib/auth/cron-secret";
import { watchAiUsage } from "@/lib/services/ai/usage-watch";
import { logError } from "@/lib/utils/errors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const refused = refuseCronRequest(request, "the AI usage watch");
  if (refused) return refused;

  try {
    return NextResponse.json(await watchAiUsage());
  } catch (error) {
    logError("AI usage watch failed", error);
    return NextResponse.json({ error: "Usage watch failed" }, { status: 500 });
  }
}
