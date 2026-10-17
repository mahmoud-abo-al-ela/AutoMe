import { AuthorizationError } from "@/lib/utils/errors";
import {
  buyerBlockReason,
  toBuyerViewer,
  type BuyerAction,
  type BuyerViewerSource,
} from "./buyer-policy";

// targetOrgId must come from the database row acted on, never from the client.
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

export function assertNotImpersonating(user: BuyerViewerSource): void {
  if (user.isImpersonated) {
    throw new AuthorizationError("Buyer action not allowed while impersonating", {
      key: "errors.buyer.impersonating",
    });
  }
}
