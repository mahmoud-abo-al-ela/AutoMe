import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { checkUser } from "@/lib/checkUser";
import { getCurrentOrganization } from "@/lib/getOrganization";
import { AuthenticationError } from "@/lib/utils/errors";

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

    // Fallback: get from user's first membership
    if (!organization && user.memberships?.length > 0) {
        organization = user.memberships[0].organization;
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

    return {
        user,
        userId,
        organization,
        membership,
        isImpersonating: isImpersonating || !!user.isImpersonated,
        actualUser: user.actualUser ?? null,
    };
}
