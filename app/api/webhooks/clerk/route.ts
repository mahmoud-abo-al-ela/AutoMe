import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/lib/prisma";
import { claimWebhookEvent, releaseWebhookEvent } from "@/lib/repositories/webhook";
import { logError } from "@/lib/utils/errors";

// Disable body parsing for webhook verification
export const runtime = "nodejs";

const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

/**
 * The subset of Clerk's user.* webhook payload this route reads. svix.verify
 * proves the body is authentically from Clerk but returns unknown, since the
 * shape is Clerk's contract rather than something we can derive.
 */
type ClerkUserEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: { email_address: string }[];
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    username?: string | null;
  };
};

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

type ClerkUserData = ClerkUserEvent["data"];

async function handleUserCreated(
    clerkId: string,
    emailAddresses: ClerkUserData["email_addresses"],
    firstName: ClerkUserData["first_name"],
    lastName: ClerkUserData["last_name"],
    imageUrl: ClerkUserData["image_url"],
    username: ClerkUserData["username"]
) {
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

    // Clerk can legitimately deliver a user.created with no email address at
    // all — phone-only and some passwordless signups. `User.email` is nullable
    // for exactly that reason, so the row is created either way and stays in
    // step with Clerk. No placeholder address is synthesised: it would occupy
    // the unique index, reach audit logs and pending-owner lookups, and could
    // be delivered to.
    await db.user.create({
        data: {
            clerkId,
            name,
            email: email ?? null,
            imageUrl,
        },
    });
}

async function handleUserUpdated(
    clerkId: string,
    emailAddresses: ClerkUserData["email_addresses"],
    firstName: ClerkUserData["first_name"],
    lastName: ClerkUserData["last_name"],
    imageUrl: ClerkUserData["image_url"],
    username: ClerkUserData["username"]
) {
    const email = emailAddresses?.[0]?.email_address;

    // Get name from firstName/lastName, or fallback to username if not available
    let name = `${firstName || ""} ${lastName || ""}`.trim();
    if (!name && username) {
        name = username;
    }
    if (!name) {
        name = "User"; // Final fallback
    }

    // `updateMany`, not `update`: `update` throws P2025 when no row matches,
    // which would 500 and put Svix back into its retry loop. A miss is not
    // hypothetical — user.updated can arrive for a Clerk user we never saw
    // created (webhook configured after signup, a replayed event, a purged
    // row). Zero rows updated is fine; `checkUser()` creates the row on the
    // user's first authenticated request.
    //
    // `email: undefined` when Clerk sends none means Prisma leaves the column
    // alone rather than nulling it, which is what we want on a partial update:
    // it avoids wiping a known address just because this particular event did
    // not carry one.
    const { count } = await db.user.updateMany({
        where: { clerkId },
        data: {
            name,
            email,
            imageUrl,
        },
    });

    if (count === 0) {
        logError(
            `Clerk user.updated for ${clerkId} matched no local user; nothing to update.`
        );
    }
}

async function handleUserDeleted(clerkId: string) {
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
