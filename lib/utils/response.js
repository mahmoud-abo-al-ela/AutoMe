// Standardized API response helpers

export function createSuccessResponse(data, message = null) {
    const response = {
        success: true,
        data,
    };

    if (message) {
        response.message = message;
    }

    return response;
}

export function createErrorResponse(error) {
    const response = {
        success: false,
        error: {
            message: error.message || "An error occurred",
            code: error.code || "UNKNOWN_ERROR",
        },
    };

    // Add plan limit fields
    if (error.code === "PLAN_LIMIT_EXCEEDED") {
        response.error.resource = error.resource;
        response.error.planType = error.planType;
        response.error.limit = error.limit;
        response.error.currentUsage = error.currentUsage;
        response.error.upgradeUrl = error.upgradeUrl;
    }

    // Include additional error details in development
    if (process.env.NODE_ENV === "development") {
        response.error.stack = error.stack;

        if (error.field) {
            response.error.field = error.field;
        }

        if (error.statusCode) {
            response.error.statusCode = error.statusCode;
        }
    }

    return response;
}

export function createPaginatedResponse(items, pagination) {
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


