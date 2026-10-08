import { AuthorizationError } from "@/lib/utils/errors";
import {
  buyerBlockReason,
  toBuyerViewer,
  type BuyerAction,
  type BuyerViewerSource,
} from "./buyer-policy";

/**
 * Throw unless `user` may take `action` on the dealership `targetOrgId`.
 *
 * `targetOrgId` must come from the database row being acted on (the car's
 * organizationId), never from what the client sent, or a caller could name a
 * dealership they are not a member of to get past the own-dealership check.
 */
export function assertBuyerAllowed(
  user: BuyerViewerSource,
  targetOrgId: string,
  action: BuyerAction,
): void {
  const reason = buyerBlockReason(toBuyerViewer(user), targetOrgId, action);
  if (reason) {
    throw new AuthorizationError(`Buyer action "${action}" not allowed: ${reason}`, {
      key: `errors.buyer.${reason}`,
    });
  }
}

/**
 * Throw while a super admin is impersonating. For buyer-side actions that are
 * not tied to one dealership (editing or cancelling one's own booking): under
 * impersonation the session user is the dealer but the Clerk id is the admin's,
 * so any write would mix the two.
 */
export function assertNotImpersonating(user: BuyerViewerSource): void {
  if (user.isImpersonated) {
    throw new AuthorizationError("Buyer action not allowed while impersonating", {
      key: "errors.buyer.impersonating",
    });
  }
}
