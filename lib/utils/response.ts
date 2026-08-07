// Standardized API response helpers

export interface SuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
}

export interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code: string;
        resource?: string;
        planType?: string;
        limit?: number;
        currentUsage?: number;
        upgradeUrl?: string;
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
    code?: string;
    resource?: string;
    planType?: string;
    limit?: number;
    currentUsage?: number;
    upgradeUrl?: string;
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

    const response: ErrorResponse = {
        success: false,
        error: {
            message: err.message || "An error occurred",
            code: err.code || "UNKNOWN_ERROR",
        },
    };

    // Add plan limit fields
    if (err.code === "PLAN_LIMIT_EXCEEDED") {
        response.error.resource = err.resource;
        response.error.planType = err.planType;
        response.error.limit = err.limit;
        response.error.currentUsage = err.currentUsage;
        response.error.upgradeUrl = err.upgradeUrl;
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
