// Standardized API response helpers
import { isOperationalError } from "./errors";

/**
 * The code an error response carries when what was thrown was not one of our
 * own AppErrors — a Prisma failure, a third-party SDK error, a bug. Its
 * message is not passed on (see createErrorResponse), and the client shows
 * its own contextual fallback for it rather than any server text.
 */
export const UNEXPECTED_ERROR_CODE = "UNEXPECTED_ERROR";

export interface SuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
}

export interface ErrorResponse {
    success: false;
    error: {
        /** Developer-facing fallback. Prefer messageKey for anything a user reads. */
        message: string;
        messageKey?: string;
        messageParams?: Record<string, string | number>;
        code: string;
        resource?: string;
        planType?: string;
        limit?: number;
        currentUsage?: number;
        upgradeUrl?: string;
        /** Seconds until a rate-limited request may be retried; the page counts it down. */
        retryAfter?: number;
        stack?: string;
        field?: string | null;
        statusCode?: number;
    };
}

/**
 * Discriminated union every server action returns. Callers must narrow on
 * `.success` before reading `.data`, which the compiler now enforces.
 */
export type ActionResponse<T> = SuccessResponse<T> | ErrorResponse;

// Loose view of a thrown value — createErrorResponse reads these fields off
// whatever was caught (AppError, Error, or anything).
interface ErrorLike {
    message?: string;
    messageKey?: string;
    messageParams?: Record<string, string | number>;
    code?: string;
    resource?: string;
    planType?: string;
    limit?: number;
    currentUsage?: number;
    upgradeUrl?: string;
    retryAfter?: number;
    stack?: string;
    field?: string | null;
    statusCode?: number;
}

interface PaginationInput {
    total: number;
    page: number;
    limit: number;
}

export function createSuccessResponse<T>(data: T, message: string | null = null): SuccessResponse<T> {
    const response: SuccessResponse<T> = {
        success: true,
        data,
    };

    if (message) {
        response.message = message;
    }

    return response;
}

export function createErrorResponse(error: unknown): ErrorResponse {
    const err = (error ?? {}) as ErrorLike;

    // Only an AppError's message was written to be read. Anything else is
    // whatever the failing library said — a Prisma error quotes the query
    // and the column, a Paymob or Supabase one names our account's objects,
    // and its `code` ("P2002") is theirs, not ours. Every wrapper logs the
    // original before calling this, so nothing is lost by withholding it.
    if (!isOperationalError(error)) {
        const response: ErrorResponse = {
            success: false,
            error: {
                message:
                    process.env.NODE_ENV === "development" && err.message
                        ? err.message
                        : "An unexpected error occurred",
                code: UNEXPECTED_ERROR_CODE,
            },
        };
        if (process.env.NODE_ENV === "development") response.error.stack = err.stack;
        return response;
    }

    const response: ErrorResponse = {
        success: false,
        error: {
            message: err.message || "An error occurred",
            code: err.code || "UNKNOWN_ERROR",
        },
    };

    // The key and params are what the client renders; message is the fallback
    // for anything thrown outside the AppError hierarchy.
    if (err.messageKey) {
        response.error.messageKey = err.messageKey;
        if (err.messageParams) response.error.messageParams = err.messageParams;
    }

    // Add plan limit fields
    if (err.code === "PLAN_LIMIT_EXCEEDED") {
        response.error.resource = err.resource;
        response.error.planType = err.planType;
        response.error.limit = err.limit;
        response.error.currentUsage = err.currentUsage;
        response.error.upgradeUrl = err.upgradeUrl;
    }

    if (err.code === "RATE_LIMIT_EXCEEDED" && typeof err.retryAfter === "number") {
        response.error.retryAfter = err.retryAfter;
    }

    // Include additional error details in development
    if (process.env.NODE_ENV === "development") {
        response.error.stack = err.stack;

        if (err.field) {
            response.error.field = err.field;
        }

        if (err.statusCode) {
            response.error.statusCode = err.statusCode;
        }
    }

    return response;
}

export function createPaginatedResponse<T>(items: T[], pagination: PaginationInput) {
    return createSuccessResponse({
        items,
        pagination: {
            total: pagination.total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(pagination.total / pagination.limit),
            hasMore: pagination.page * pagination.limit < pagination.total,
        },
    });
}
