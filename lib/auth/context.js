import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { checkUser } from "@/lib/checkUser";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";

export async function resolveAuthContext() {
    const { userId } = await auth();
    if (!userId) {
        throw new AuthenticationError();
    }

    const user = await checkUser();
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    return { user, userId };
}

export async function resolveTenantContext() {
    const { user, userId } = await resolveAuthContext();

    // Try to get organization from subdomain (set by middleware)
    let organization = await getCurrentOrganization();

    // Fallback: the user's own membership. Sort deterministically so that when a
    // user belongs to several orgs and no subdomain selected one, the chosen org
    // is at least predictable rather than arbitrary Prisma insertion order.
    if (!organization && user.memberships?.length > 0) {
        const [firstMembership] = [...user.memberships].sort((a, b) =>
            a.organizationId.localeCompare(b.organizationId),
        );
        organization = firstMembership.organization;
    }

    if (!organization) {
        throw new AuthenticationError("No organization found");
    }

    // Find user's membership in this organization
    const membership =
        user.memberships?.find((m) => m.organizationId === organization.id) ?? null;

    // Check impersonation context
    const headersList = await headers();
    const isImpersonating =
        headersList.get("x-impersonation-active") === "true";

    // The header must not be the only thing standing between a caller and a
    // tenant. If the resolved org is one the user has no membership in — e.g. a
    // forged x-organization-slug for an org they don't belong to — reject.
    // Impersonation (verified in checkUser against the ADMIN role) and platform
    // ADMINs are the only ways to act without a membership.
    if (!membership && !isImpersonating && !user.isImpersonated && user.role !== "ADMIN") {
        throw new AuthorizationError("No access to this organization");
    }

    return {
        user,
        userId,
        organization,
        membership,
        isImpersonating: isImpersonating || !!user.isImpersonated,
        actualUser: user.actualUser ?? null,
    };
}
