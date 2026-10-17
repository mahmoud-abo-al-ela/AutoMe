export type BuyerAction = "save" | "message" | "testDrive" | "review";

export type BuyerBlockReason =
  /** A super admin acting as a dealer: buyer writes would mix two identities. */
  | "impersonating"
  /** Platform staff observe the marketplace; they do not take part in it. */
  | "platformAdmin"
  /** A member acting on their own dealership: self-dealing. */
  | "ownDealership"
  /** Any dealership member reviewing a dealership: competitors' reviews. */
  | "dealerReview";

export const BUYER_ACTIONS: readonly BuyerAction[] = ["save", "message", "testDrive", "review"];

/** The few facts about the viewer the policy reads. */
export interface BuyerViewer {
  role: string;
  isImpersonated: boolean;
  organizationIds: string[];
}

/** The parts of a session user the policy needs; a full `checkUser()` row fits. */
export interface BuyerViewerSource {
  role: string;
  isImpersonated?: boolean;
  memberships?: Array<{ organizationId: string }> | null;
}

export function toBuyerViewer(user: BuyerViewerSource | null | undefined): BuyerViewer | null {
  if (!user) return null;
  return {
    role: user.role,
    isImpersonated: user.isImpersonated === true,
    organizationIds: (user.memberships ?? []).map((m) => m.organizationId),
  };
}

export function buyerBlockReason(
  viewer: BuyerViewer | null,
  targetOrgId: string,
  action: BuyerAction,
): BuyerBlockReason | null {
  if (!viewer) return null;
  if (viewer.isImpersonated) return "impersonating";
  if (viewer.role === "ADMIN") return "platformAdmin";
  if (viewer.organizationIds.includes(targetOrgId)) return "ownDealership";
  if (action === "review" && viewer.organizationIds.length > 0) return "dealerReview";
  return null;
}
