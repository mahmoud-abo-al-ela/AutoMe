/**
 * Who may act as a buyer: save a car, message a dealership, book a test drive,
 * or review a dealership.
 *
 * A signed-in account is not the same as a buyer. Platform staff and the
 * dealership's own people browse the storefront too, and if they could act on
 * it their activity would land in the dealer's leads, inbox and rating as if a
 * customer had done it. So the identity is checked against the dealership being
 * acted on, not only for being signed in.
 *
 * Pure and free of server imports: the server actions enforce it
 * (assert-buyer.ts) and the storefront uses the same answer to decide which
 * buttons to show, so the two cannot drift.
 */

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

/**
 * Why `viewer` may not take `action` on the dealership `targetOrgId`, or null
 * when they may. A signed-out viewer is never blocked here: the sign-in flows
 * already handle them, and the actions require a session anyway.
 *
 * Order matters: the first reason that applies is the one shown.
 */
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
