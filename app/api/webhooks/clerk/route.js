import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/lib/prisma";

// Disable body parsing for webhook verification
export const runtime = "nodejs";

export async function POST(req) {
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
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    let evt;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error("Error verifying webhook:", err);
        return new Response("Error occurred", {
            status: 400,
        });
    }

    // Handle the webhook
    const eventType = evt.type;
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    console.log(`Webhook received: ${eventType}`);

    try {
        switch (eventType) {
            case "user.created":
                // User is created via checkUser function, but we can update if needed
                await handleUserCreated(id, email_addresses, first_name, last_name, image_url);
                break;

            case "user.updated":
                await handleUserUpdated(id, email_addresses, first_name, last_name, image_url);
                break;

            case "user.deleted":
                await handleUserDeleted(id);
                break;

            default:
                console.log(`Unhandled event type: ${eventType}`);
        }

        return new Response("Webhook processed successfully", { status: 200 });
    } catch (error) {
        console.error(`Error processing webhook ${eventType}:`, error);
        return new Response("Error processing webhook", { status: 500 });
    }
}

// Handle GET requests (for webhook verification)
export async function GET() {
    return new Response("Webhook endpoint is active", { status: 200 });
}

async function handleUserCreated(clerkId, emailAddresses, firstName, lastName, imageUrl) {
    const email = emailAddresses?.[0]?.email_address;
    const name = `${firstName || ""} ${lastName || ""}`.trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
        where: { clerkId },
    });

    if (existingUser) {
        console.log(`User ${clerkId} already exists, skipping creation`);
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

    console.log(`User created: ${clerkId}`);
}

async function handleUserUpdated(clerkId, emailAddresses, firstName, lastName, imageUrl) {
    const email = emailAddresses?.[0]?.email_address;
    const name = `${firstName || ""} ${lastName || ""}`.trim();

    // Update user
    await db.user.update({
        where: { clerkId },
        data: {
            name,
            email,
            imageUrl,
        },
    });

    console.log(`User updated: ${clerkId}`);
}

async function handleUserDeleted(clerkId) {
    // Delete user and all related data (cascading deletes should handle relationships)
    const user = await db.user.findUnique({
        where: { clerkId },
    });

    if (!user) {
        console.log(`User ${clerkId} not found in database, skipping deletion`);
        return;
    }

    // Delete the user (cascade deletes will handle related records)
    await db.user.delete({
        where: { clerkId },
    });

    console.log(`User deleted: ${clerkId}`);
}
