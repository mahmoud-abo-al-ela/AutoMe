import * as userRepository from "@/lib/repositories/user";
import { claimWebhookEvent, releaseWebhookEvent } from "@/lib/repositories/webhook";
import { logError } from "@/lib/utils/errors";

/**
 * Keeps the local User row in step with Clerk, from Clerk's user.* webhooks
 * (app/api/webhooks/clerk verifies the signature, then hands the event here).
 */

export type ClerkUserEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: { email_address: string }[];
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    username?: string | null;
    /** Set by AutoMe on an account copied from another Clerk instance: its ID there. */
    external_id?: string | null;
  };
};

type ClerkUserData = ClerkUserEvent["data"];

// Safe because only AutoMe sets external_id, through Clerk's Backend API with the secret key.
export async function relinkMigratedUser(clerkId: string, externalId: string | null | undefined): Promise<boolean> {
  if (!externalId || externalId === clerkId) return false;
  return userRepository.relinkClerkId(externalId, clerkId);
}

/** First and last name, else the username, else "User". */
function displayName({ first_name, last_name, username }: ClerkUserData) {
  const name = `${first_name || ""} ${last_name || ""}`.trim();
  return name || username || "User";
}

async function handleUserCreated(data: ClerkUserData) {
  const email = data.email_addresses?.[0]?.email_address;

  // User is usually created by checkUser on the first request already.
  if (await userRepository.findUserByClerkId(data.id)) return;

  // A copied account takes over its old row instead of getting a second one —
  // which the unique email would refuse anyway.
  if (await relinkMigratedUser(data.id, data.external_id)) {
    await handleUserUpdated(data);
    return;
  }

  await userRepository.createUser({
    clerkId: data.id,
    name: displayName(data),
    email: email ?? null,
    imageUrl: data.image_url,
  });
}

async function handleUserUpdated(data: ClerkUserData) {
  const count = await userRepository.updateUsersByClerkId(data.id, {
    name: displayName(data),
    // undefined leaves the column alone: a partial event must not wipe a known address.
    email: data.email_addresses?.[0]?.email_address,
    imageUrl: data.image_url,
  });

  if (count === 0) {
    logError(`Clerk user.updated for ${data.id} matched no local user; nothing to update.`);
  }
}

async function handleUserDeleted(clerkId: string) {
  if (!(await userRepository.findUserByClerkId(clerkId))) return;
  // Cascade deletes take the user's related rows with it.
  await userRepository.deleteUserByClerkId(clerkId);
}

export async function applyClerkUserEvent(eventId: string, event: ClerkUserEvent): Promise<"processed" | "duplicate"> {
  const claimed = await claimWebhookEvent({ id: eventId, provider: "clerk", type: event.type });
  if (!claimed) return "duplicate";

  try {
    switch (event.type) {
      case "user.created":
        await handleUserCreated(event.data);
        break;
      case "user.updated":
        await handleUserUpdated(event.data);
        break;
      case "user.deleted":
        await handleUserDeleted(event.data.id);
        break;
      default:
        break;
    }
    return "processed";
  } catch (error) {
    await releaseWebhookEvent(eventId).catch((releaseErr) =>
      logError("Failed to release webhook claim:", releaseErr)
    );
    throw error;
  }
}
