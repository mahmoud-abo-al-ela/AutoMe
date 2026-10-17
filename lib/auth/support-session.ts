import { AuthorizationError } from "@/lib/utils/errors";

// isImpersonated comes only from a DB-verified support session, never a cookie or header.
export function refuseDuringSupportSession(ctx: { user: { isImpersonated?: boolean } }): void {
  if (ctx.user.isImpersonated) {
    throw new AuthorizationError("Not available during a support session", {
      key: "errors.superAdmin.notInSupportSession",
    });
  }
}
