import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/lib/prisma";
import { claimWebhookEvent, releaseWebhookEvent } from "@/lib/repositories/webhook";
import { logError } from "@/lib/utils/errors";

// Disable body parsing for webhook verification
export const runtime = "nodejs";

const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req) {
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

    let evt;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        logError("Error verifying webhook:", err);
        return new Response("Error occurred", {
            status: 400,
        });
    }

    // Idempotency: the Svix message id is stable across retries of the same event.
    const claimed = await claimWebhookEvent({
        id: svix_id,
        provider: "clerk",
        type: evt.type,
    });
    if (!claimed) {
        return new Response("Webhook already processed", { status: 200 });
    }

    // Handle the webhook
    const eventType = evt.type;
    const { id, email_addresses, first_name, last_name, image_url, username } = evt.data;

    try {
        switch (eventType) {
            case "user.created":
                // User is created via checkUser function, but we can update if needed
                await handleUserCreated(id, email_addresses, first_name, last_name, image_url, username);
                break;

            case "user.updated":
                await handleUserUpdated(id, email_addresses, first_name, last_name, image_url, username);
                break;

            case "user.deleted":
                await handleUserDeleted(id);
                break;

            default:
                break;
        }

        return new Response("Webhook processed successfully", { status: 200 });
    } catch (error) {
        // Release the claim so Svix's retry can re-process this event.
        await releaseWebhookEvent(svix_id).catch((releaseErr) =>
            logError("Failed to release webhook claim:", releaseErr)
        );
        logError(`Error processing webhook ${eventType}:`, error);
        return new Response("Error processing webhook", { status: 500 });
    }
}

// Handle GET requests (for webhook verification)
export async function GET() {
    return new Response("Webhook endpoint is active", { status: 200 });
}

async function handleUserCreated(clerkId, emailAddresses, firstName, lastName, imageUrl, username) {
    const email = emailAddresses?.[0]?.email_address;

    // Get name from firstName/lastName, or fallback to username if not available
    let name = `${firstName || ""} ${lastName || ""}`.trim();
    if (!name && username) {
        name = username;
    }
    if (!name) {
        name = "User"; // Final fallback
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
        where: { clerkId },
    });

    if (existingUser) {
        return;
    }

    // Create user
    await db.user.create({
        data: {
            clerkId,
            name,
            email,
            imageUrl,
        },
    });

}

async function handleUserUpdated(clerkId, emailAddresses, firstName, lastName, imageUrl, username) {
    const email = emailAddresses?.[0]?.email_address;

    // Get name from firstName/lastName, or fallback to username if not available
    let name = `${firstName || ""} ${lastName || ""}`.trim();
    if (!name && username) {
        name = username;
    }
    if (!name) {
        name = "User"; // Final fallback
    }

    // Update user
    await db.user.update({
        where: { clerkId },
        data: {
            name,
            email,
            imageUrl,
        },
    });

}

async function handleUserDeleted(clerkId) {
    // Delete user and all related data (cascading deletes should handle relationships)
    const user = await db.user.findUnique({
        where: { clerkId },
    });

    if (!user) {
        return;
    }

    // Delete the user (cascade deletes will handle related records)
    await db.user.delete({
        where: { clerkId },
    });

}
