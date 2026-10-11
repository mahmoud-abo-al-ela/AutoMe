import { Webhook } from "svix";
import { headers } from "next/headers";
import { applyClerkUserEvent, type ClerkUserEvent } from "@/lib/services/user/clerk-sync";
import { logError } from "@/lib/utils/errors";

// Disable body parsing for webhook verification
export const runtime = "nodejs";

const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
    // Fail closed: without the signing secret we cannot verify authenticity.
    if (!clerkWebhookSecret) {
        logError("CLERK_WEBHOOK_SECRET is not configured; rejecting webhook.");
        return new Response("Webhook not configured", { status: 500 });
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Error occurred -- no svix headers", {
            status: 400,
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your webhook secret
    const wh = new Webhook(clerkWebhookSecret);

    let evt: ClerkUserEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as ClerkUserEvent;
    } catch (err) {
        logError("Error verifying webhook:", err);
        return new Response("Error occurred", {
            status: 400,
        });
    }

    // Idempotency: the Svix message id is stable across retries of the same
    // event; on failure the service releases its claim so the retry can run.
    try {
        const outcome = await applyClerkUserEvent(svix_id, evt);
        if (outcome === "duplicate") {
            return new Response("Webhook already processed", { status: 200 });
        }
        return new Response("Webhook processed successfully", { status: 200 });
    } catch (error) {
        logError(`Error processing webhook ${evt.type}:`, error);
        return new Response("Error processing webhook", { status: 500 });
    }
}

// Handle GET requests (for webhook verification)
export async function GET() {
    return new Response("Webhook endpoint is active", { status: 200 });
}
