import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { checkUser } from "@/lib/checkUser";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";
import type {
    User,
    Organization,
    Subscription,
    Plan,
    Membership,
} from "@/lib/generated/prisma";

/** An organization with its subscription + plan eagerly loaded (as resolve.js selects). */
export type OrganizationWithPlan = Organization & {
    subscription?: (Subscription & { plan: Plan }) | null;
};

/**
 * What `checkUser()` returns: the user row with memberships joined, plus the
 * impersonation fields layered on in resolveImpersonation. Declared here because
 * checkUser.js is still JavaScript; this is the shape resolveTenantContext relies on.
 */
export type SessionUser = User & {
    memberships?: Array<Membership & { organization: OrganizationWithPlan }>;
    isImpersonated?: boolean;
    actualUser?: Pick<User, "id" | "email" | "name" | "role"> | null;
};

export interface AuthContext {
    user: SessionUser;
    userId: string;
}

export interface TenantContext extends AuthContext {
    organization: OrganizationWithPlan;
    membership: Membership | null;
    isImpersonating: boolean;
    actualUser: Pick<User, "id" | "email" | "name" | "role"> | null;
}

export async function resolveAuthContext(): Promise<AuthContext> {
    const { userId } = await auth();
    if (!userId) {
        throw new AuthenticationError();
    }

    // checkUser is still JS — assert the shape we depend on at this boundary.
    const user = (await checkUser()) as SessionUser | null;
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    return { user, userId };
}

export async function resolveTenantContext(): Promise<TenantContext> {
    const { user, userId } = await resolveAuthContext();

    // Try to get organization from subdomain (set by middleware)
    let organization = (await getCurrentOrganization()) as OrganizationWithPlan | null;

    // Fallback: the user's own membership. Sort deterministically so that when a
    // user belongs to several orgs and no subdomain selected one, the chosen org
    // is at least predictable rather than arbitrary Prisma insertion order.
    if (!organization && user.memberships && user.memberships.length > 0) {
        const [firstMembership] = [...user.memberships].sort((a, b) =>
            a.organizationId.localeCompare(b.organizationId),
        );
        organization = firstMembership.organization;
    }

    if (!organization) {
        throw new AuthenticationError("No organization found");
    }
    const org = organization; // non-null from here (also stable inside closures)

    // Find user's membership in this organization
    const membership =
        user.memberships?.find((m) => m.organizationId === org.id) ?? null;

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
        organization: org,
        membership,
        isImpersonating: isImpersonating || !!user.isImpersonated,
        actualUser: user.actualUser ?? null,
    };
}
