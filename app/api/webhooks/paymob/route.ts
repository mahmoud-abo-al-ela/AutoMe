import { handlePaymobCallback } from "@/lib/services/billing/callback";

export const runtime = "nodejs";

/**
 * Paymob's transaction processed callback: the source of truth for a payment.
 * Authenticated by the HMAC in the `hmac` query parameter (see
 * lib/services/billing/callback.ts); public in middleware, like every webhook.
 *
 * Must be reachable over public HTTPS: Paymob cannot call localhost, so test
 * it on a preview deployment.
 */
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
