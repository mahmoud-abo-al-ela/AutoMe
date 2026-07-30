import { headers } from "next/headers";
import Stripe from "stripe";
import * as webhookService from "@/lib/services/webhook";
import { claimWebhookEvent, releaseWebhookEvent } from "@/lib/repositories/webhook";
import { logError } from "@/lib/utils/errors";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key_for_build");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Registry of handled event types → handler. Adding a new event = one entry here,
// not a bigger switch. Unhandled types fall through to a 200 no-op so Stripe stops
// retrying them.
const EVENT_HANDLERS = {
    "customer.subscription.created": webhookService.handleSubscriptionEvent,
    "customer.subscription.updated": webhookService.handleSubscriptionEvent,
    "customer.subscription.deleted": webhookService.handleSubscriptionEvent,
    "invoice.paid": webhookService.handleInvoicePaid,
    "invoice.payment_failed": webhookService.handleInvoicePaymentFailed,
    "payment_intent.succeeded": webhookService.handlePaymentIntentSucceeded,
    "checkout.session.completed": webhookService.handleCheckoutSessionCompleted,
};

export async function POST(req) {
    // Fail closed: without the signing secret we cannot verify authenticity, so
    // never fall through to processing unverified input.
    if (!webhookSecret) {
        logError("STRIPE_WEBHOOK_SECRET is not configured; rejecting webhook.");
        return new Response("Webhook not configured", { status: 500 });
    }

    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
        return new Response("No signature", { status: 400 });
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        logError("Webhook signature verification failed:", err);
        return new Response("Invalid signature", { status: 400 });
    }

    // Idempotency: atomically claim this event id. Stripe retries and can deliver
    // duplicates/out-of-order — a claim that loses the race is a duplicate we ack
    // without re-running side effects.
    const claimed = await claimWebhookEvent({
        id: event.id,
        provider: "stripe",
        type: event.type,
    });
    if (!claimed) {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
            status: 200,
        });
    }

    const handler = EVENT_HANDLERS[event.type];
    if (!handler) {
        // Not an event we act on — ack so Stripe stops retrying.
        return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    try {
        await handler(event);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (error) {
        // Processing failed after claiming — release the claim so Stripe's retry
        // can re-process, and return non-2xx to trigger that retry.
        await releaseWebhookEvent(event.id).catch((releaseErr) =>
            logError("Failed to release webhook claim:", releaseErr)
        );
        logError(`Webhook handler error (${event.type}):`, error);
        return new Response("Webhook handler error", { status: 500 });
    }
}
