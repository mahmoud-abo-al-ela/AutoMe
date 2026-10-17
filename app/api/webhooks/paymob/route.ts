import { handlePaymobCallback } from "@/lib/services/billing/callback";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const hmac = new URL(req.url).searchParams.get("hmac");

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { status, body } = await handlePaymobCallback(payload, hmac);
  return Response.json(body, { status });
}
