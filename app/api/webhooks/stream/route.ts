import { after } from "next/server";
import { z } from "zod";
import { getStreamServerClient } from "@/lib/stream-chat";
import { moderateMessage } from "@/lib/services/chat/moderation";
import { logError } from "@/lib/utils/errors";

// Raw body for the signature, and Node crypto.
export const runtime = "nodejs";
// The moderation itself runs after the response (see below); this is its time.
export const maxDuration = 60;

/** Events that carry a message worth checking. Everything else is acknowledged and ignored. */
const MODERATED_EVENTS = new Set(["message.new", "message.updated"]);

/** Only the envelope is checked here; the message is Stream's shape, read defensively by the service. */
const eventSchema = z.object({
  type: z.string(),
  message: z.record(z.unknown()).optional(),
});

/**
 * Stream Chat's webhook — every new or edited chat message, for moderation.
 *
 * Public (under /api/webhooks), so it authenticates itself: Stream signs the
 * raw body with the app's secret (HMAC-SHA256, X-Signature), checked in
 * constant time by the SDK. Without the secret it refuses everything rather
 * than trusting anyone.
 *
 * It answers at once and moderates after the response (`after`): Stream
 * retries a webhook that is slow, and a message is already delivered by the
 * time this runs — a check can never hold one up. A retried event is
 * harmless: moderation is idempotent and its model call is cached.
 */
export async function POST(req: Request) {
  if (!process.env.STREAM_API_SECRET || !process.env.NEXT_PUBLIC_STREAM_API_KEY) {
    logError("Stream credentials are not configured; rejecting webhook.");
    return new Response("Webhook not configured", { status: 500 });
  }

  const signature = req.headers.get("x-signature");
  if (!signature) return new Response("Missing signature", { status: 401 });

  const body = await req.text();
  if (!getStreamServerClient().verifyWebhook(body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let parsed;
  try {
    parsed = eventSchema.safeParse(JSON.parse(body));
  } catch {
    return new Response("Invalid body", { status: 400 });
  }
  if (!parsed.success) return new Response("Invalid body", { status: 400 });

  const event = parsed.data;
  if (MODERATED_EVENTS.has(event.type) && event.message) {
    after(async () => {
      try {
        await moderateMessage(event.message as Parameters<typeof moderateMessage>[0]);
      } catch (error) {
        // No warning is the only cost of a failure; the message is already out.
        logError("Chat moderation failed", error);
      }
    });
  }

  return new Response("ok", { status: 200 });
}
