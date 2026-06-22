import { headers } from "next/headers";
import Stripe from "stripe";
import * as webhookService from "@/lib/services/webhook";
import { logError } from "@/lib/utils/errors";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "dummy_key_for_build");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
    try {
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

        // Handle the event
        switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
                await webhookService.handleSubscriptionEvent(event);
                break;

            case "invoice.paid":
                await webhookService.handleInvoicePaid(event);
                break;

            case "invoice.payment_failed":
                await webhookService.handleInvoicePaymentFailed(event);
                break;

            case "payment_intent.succeeded":
                await webhookService.handlePaymentIntentSucceeded(event);
                break;

            case "checkout.session.completed":
                await webhookService.handleCheckoutSessionCompleted(event);
                break;

            default:
                break;
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (error) {
        logError("Webhook error:", error);
        return new Response("Webhook error", { status: 500 });
    }
}
