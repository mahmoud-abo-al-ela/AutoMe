import { auth } from "@clerk/nextjs/server";
import { checkUser } from "@/lib/checkUser";
import {
    getCurrentOrganization,
    getDashboardOrganizationSlug,
    getOrganizationById,
    getOrganizationBySlug,
} from "@/lib/getOrganization";
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

// Access needs a membership or a DB-verified support session for this exact dealership; slug, header and subdomain only select.
export async function resolveTenantContext(
    options: { organizationSlug?: string | null } = {},
): Promise<TenantContext> {
    const { user, userId } = await resolveAuthContext();
    const impersonation = user.isImpersonated ? user.impersonation ?? null : null;
    const requestedSlug = options.organizationSlug || (await getDashboardOrganizationSlug());

    let organization: OrganizationWithPlan | null;
    if (impersonation) {
        organization = (await getOrganizationById(impersonation.targetOrganizationId)) as OrganizationWithPlan | null;
        // A session is for one dealership. A page or request naming another
        // is refused rather than quietly acting on the session's.
        if (organization && requestedSlug && requestedSlug !== organization.slug) {
            throw new AuthorizationError("No access to this organization");
        }
    } else if (requestedSlug) {
        organization = (await getOrganizationBySlug(requestedSlug)) as OrganizationWithPlan | null;
        if (!organization) {
            throw new AuthorizationError("No access to this organization");
        }
    } else {
        organization = (await getCurrentOrganization()) as OrganizationWithPlan | null;
    }

    // Fallback: the user's own membership, when no URL named a dealership.
    // Sorted so a user of several is at least given the same one every time.
    if (!organization && !impersonation && !requestedSlug && user.memberships && user.memberships.length > 0) {
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
