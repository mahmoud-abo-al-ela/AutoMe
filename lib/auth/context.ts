import { auth } from "@clerk/nextjs/server";
import { checkUser } from "@/lib/checkUser";
import { getCurrentOrganization, getOrganizationById } from "@/lib/getOrganization";
import { AuthenticationError, AuthorizationError } from "@/lib/utils/errors";
import type { ActiveImpersonation } from "@/lib/services/impersonation/active";
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
 * impersonation fields layered on in resolveImpersonation — `impersonation` is
 * the support session the database verified, present only while an admin is
 * signed in as someone else.
 */
export type SessionUser = User & {
    memberships?: Array<Membership & { organization: OrganizationWithPlan }>;
    isImpersonated?: boolean;
    impersonation?: ActiveImpersonation;
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

    const user = (await checkUser()) as SessionUser | null;
    if (!user) {
        throw new AuthenticationError("User not found");
    }

    return { user, userId };
}

/**
 * The dealership this request acts on, and the caller's right to act there.
 *
 * Access is a membership of that dealership, or a support session the
 * database verified (checkUser) whose target is exactly that dealership.
 * Nothing else: not a cookie, not a header, and not the platform ADMIN role —
 * admins reach a tenant through a session, which is time-boxed, has a reason
 * and is audited, and see across tenants only on the super-admin pages.
 */
export async function resolveTenantContext(): Promise<TenantContext> {
    const { user, userId } = await resolveAuthContext();
    const impersonation = user.isImpersonated ? user.impersonation ?? null : null;

    // During a support session the session's dealership is the tenant,
    // whatever the subdomain says. Otherwise: the subdomain (set by
    // middleware), then the user's own membership.
    let organization = impersonation
        ? ((await getOrganizationById(impersonation.targetOrganizationId)) as OrganizationWithPlan | null)
        : ((await getCurrentOrganization()) as OrganizationWithPlan | null);

    // Fallback: the user's own membership. Sort deterministically so that when a
    // user belongs to several orgs and no subdomain selected one, the chosen org
    // is at least predictable rather than arbitrary Prisma insertion order.
    if (!organization && !impersonation && user.memberships && user.memberships.length > 0) {
        const [firstMembership] = [...user.memberships].sort((a, b) =>
            a.organizationId.localeCompare(b.organizationId),
        );
        organization = firstMembership.organization;
    }

    if (!organization) {
        throw new AuthenticationError("No organization found");
    }
    const org = organization; // non-null from here (also stable inside closures)

    const membership =
        user.memberships?.find((m) => m.organizationId === org.id) ?? null;

    const inSessionForThisOrg = impersonation?.targetOrganizationId === org.id;
    if (!membership && !inSessionForThisOrg) {
        throw new AuthorizationError("No access to this organization");
    }

    return {
        user,
        userId,
        organization: org,
        membership,
        isImpersonating: !!impersonation,
        actualUser: user.actualUser ?? null,
    };
}
