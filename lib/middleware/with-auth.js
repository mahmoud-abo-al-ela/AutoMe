import { auth } from "@clerk/nextjs/server";
import { resolveAuthContext, resolveTenantContext } from "@/lib/auth";
import { createErrorResponse } from "@/lib/utils/response";
import { logError } from "@/lib/utils/errors";
import { requireSuperAdmin } from "@/lib/services/super-admin/auth";

export function withAuth(action) {
    return async (...args) => {
        try {
            const ctx = await resolveAuthContext();
            return await action(ctx, ...args);
        } catch (error) {
            logError(error);
            return createErrorResponse(error);
        }
    };
}

export function withOrgAuth(action) {
    return async (...args) => {
        try {
            const ctx = await resolveTenantContext();
            return await action(ctx, ...args);
        } catch (error) {
            logError(error);
            return createErrorResponse(error);
        }
    };
}

export function withSuperAdmin(action) {
    return async (...args) => {
        try {
            const { userId: clerkId } = await auth();
            const admin = await requireSuperAdmin(clerkId);
            return await action(admin, ...args);
        } catch (error) {
            logError(error);
            return createErrorResponse(error);
        }
    };
}


export function withErrorHandling(action) {
    return async (...args) => {
        try {
            return await action(...args);
        } catch (error) {
            logError(error);
            return createErrorResponse(error);
        }
    };
}
