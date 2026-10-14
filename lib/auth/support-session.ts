import { AuthorizationError } from "@/lib/utils/errors";

/**
 * Refuse an action an admin must not take while signed in as a dealer.
 *
 * A support session lets an admin see and fix what the dealer sees — edit a
 * listing, answer a buyer, set opening hours. Money, ownership and deletions
 * stay the dealership's own decisions: changing or paying for a plan, starting
 * a signup, managing the team, deleting a car. Those refuse here, in the
 * action, before anything runs.
 *
 * `isImpersonated` is set by checkUser only from a support session the
 * database verified (lib/services/impersonation/active.ts), so this costs no
 * extra read and cannot be switched on by a cookie or header.
 */
export function refuseDuringSupportSession(ctx: { user: { isImpersonated?: boolean } }): void {
  if (ctx.user.isImpersonated) {
    throw new AuthorizationError("Not available during a support session", {
      key: "errors.superAdmin.notInSupportSession",
    });
  }
}
