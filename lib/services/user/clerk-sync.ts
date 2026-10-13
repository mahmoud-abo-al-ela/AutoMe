import * as userRepository from "@/lib/repositories/user";
import { claimWebhookEvent, releaseWebhookEvent } from "@/lib/repositories/webhook";
import { logError } from "@/lib/utils/errors";

/**
 * Keeps the local User row in step with Clerk, from Clerk's user.* webhooks
 * (app/api/webhooks/clerk verifies the signature, then hands the event here).
 */

/**
 * The subset of Clerk's user.* webhook payload this reads. The signature
 * check proves the body is authentically from Clerk but cannot type it: the
 * shape is Clerk's contract.
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

/**
 * Give an account copied into this Clerk instance (the one-off move to the
 * production instance, 2026-10-14; the copy script is in git history:
 * scripts/clerk/migrate-users.ts)
 * the row it had under its old ID. The copy carries that ID as its
 * external_id, which only AutoMe sets — through Clerk's Backend API with the
 * secret key — so a user cannot claim someone else's row with it. True if
 * the row was moved to `clerkId`. Called wherever a new Clerk ID would
 * otherwise get a new row: the user.created webhook and checkUser.
 */
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

  // Clerk can legitimately deliver a user.created with no email address at
  // all — phone-only and some passwordless signups. `User.email` is nullable
  // for exactly that reason, so the row is created either way and stays in
  // step with Clerk. No placeholder address is synthesised: it would occupy
  // the unique index, reach audit logs and pending-owner lookups, and could
  // be delivered to.
  await userRepository.createUser({
    clerkId: data.id,
    name: displayName(data),
    email: email ?? null,
    imageUrl: data.image_url,
  });
}

async function handleUserUpdated(data: ClerkUserData) {
  // A miss is not an error: user.updated can arrive for a Clerk user we never
  // saw created (webhook configured after signup, a replayed event, a purged
  // row); checkUser() creates the row on the user's first authenticated
  // request.
  //
  // `email: undefined` when Clerk sends none leaves the column alone rather
  // than nulling it: a partial update must not wipe a known address just
  // because this event did not carry one.
  const count = await userRepository.updateUsersByClerkId(data.id, {
    name: displayName(data),
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

/**
 * Apply one verified Clerk event, once. `eventId` (Svix's message id) is
 * stable across retries of the same event, so a retry of a processed event is
 * a "duplicate"; if applying fails, the claim is released before the error is
 * rethrown, so Svix's retry can process the event again.
 */
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
