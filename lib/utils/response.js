// Standardized API response helpers

/**
 * Create a success response
 * @param {*} data - Response data
 * @param {string} [message] - Optional success message
 * @returns {Object} Standardized success response
 */
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

/**
 * Create an error response
 * @param {Error} error - Error object
 * @returns {Object} Standardized error response
 */
export function createErrorResponse(error) {
    const response = {
        success: false,
        error: {
            message: error.message || "An error occurred",
            code: error.code || "UNKNOWN_ERROR",
        },
    };

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

/**
 * Create a paginated response
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination metadata
 * @returns {Object} Standardized paginated response
 */
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

/**
 * Wrap async action with error handling
 * @param {Function} action - Async function to wrap
 * @returns {Function} Wrapped function with error handling
 */
export function withErrorHandling(action) {
    return async (...args) => {
        try {
            return await action(...args);
        } catch (error) {
            console.error("Action error:", error);
            return createErrorResponse(error);
        }
    };
}
