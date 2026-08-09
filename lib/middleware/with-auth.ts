import { auth } from "@clerk/nextjs/server";
import { resolveAuthContext, resolveTenantContext } from "@/lib/auth";
import type { AuthContext, TenantContext } from "@/lib/auth/context";
import { createErrorResponse, type ErrorResponse } from "@/lib/utils/response";
import { logError } from "@/lib/utils/errors";
import { requireSuperAdmin } from "@/lib/services/super-admin/auth";
import type { User } from "@/lib/generated/prisma";

export function withAuth<TArgs extends unknown[], TResult>(
    action: (ctx: AuthContext, ...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult | ErrorResponse> {
    return async (...args: TArgs) => {
        try {
            const ctx = await resolveAuthContext();
            return await action(ctx, ...args);
        } catch (error) {
            logError(error);
            return createErrorResponse(error);
        }
    };
}

export function withOrgAuth<TArgs extends unknown[], TResult>(
    action: (ctx: TenantContext, ...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult | ErrorResponse> {
    return async (...args: TArgs) => {
        try {
            const ctx = await resolveTenantContext();
            return await action(ctx, ...args);
        } catch (error) {
            logError(error);
            return createErrorResponse(error);
        }
    };
}

export function withSuperAdmin<TArgs extends unknown[], TResult>(
    action: (admin: User, ...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult | ErrorResponse> {
    return async (...args: TArgs) => {
        try {
            const { userId: clerkId } = await auth();
            const admin: User = await requireSuperAdmin(clerkId);
            return await action(admin, ...args);
        } catch (error) {
            logError(error);
            return createErrorResponse(error);
        }
    };
}

export function withErrorHandling<TArgs extends unknown[], TResult>(
    action: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult | ErrorResponse> {
    return async (...args: TArgs) => {
        try {
            return await action(...args);
        } catch (error) {
            logError(error);
            return createErrorResponse(error);
        }
    };
}
