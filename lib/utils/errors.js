// Standardized error handling

export class AppError extends Error {
    constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message, field = null) {
        super(message, 400, "VALIDATION_ERROR");
        this.field = field;
    }
}

export class AuthenticationError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401, "AUTHENTICATION_ERROR");
    }
}

export class AuthorizationError extends AppError {
    constructor(message = "Forbidden") {
        super(message, 403, "AUTHORIZATION_ERROR");
    }
}

export class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} not found`, 404, "NOT_FOUND");
        this.resource = resource;
    }
}

export class ConflictError extends AppError {
    constructor(message = "Resource already exists") {
        super(message, 409, "CONFLICT");
    }
}

export class RateLimitError extends AppError {
    constructor(message = "Too many requests") {
        super(message, 429, "RATE_LIMIT_EXCEEDED");
    }
}

export class PlanLimitError extends AppError {
    constructor({ resource, planType, limit, currentUsage, upgradeUrl, message }) {
        super(message || `Plan limit exceeded for ${resource}`, 403, "PLAN_LIMIT_EXCEEDED");
        this.resource = resource;
        this.planType = planType;
        this.limit = limit;
        this.currentUsage = currentUsage;
        this.upgradeUrl = upgradeUrl;
    }
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error) {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}

/**
 * Log error with appropriate level
 */
export function logError(errorOrMessage, ...args) {
    let actualError = errorOrMessage;
    let context = undefined;

    if (typeof errorOrMessage === 'string') {
        context = errorOrMessage;
        const foundError = args.find(arg => arg instanceof Error);
        if (foundError) {
            actualError = foundError;
        } else {
            actualError = new Error(errorOrMessage);
        }
    }

    // Ensure actualError is always defined
    if (!actualError) {
        actualError = new Error("Unknown error logged");
    }

    const details = args.filter(arg => arg !== actualError);

    if (isOperationalError(actualError)) {
        console.warn(context || "Operational error:", {
            message: actualError.message,
            code: actualError.code,
            statusCode: actualError.statusCode,
            ...(details.length > 0 ? { details } : {})
        });
    } else {
        console.error(context || "Programming error:", {
            message: actualError.message || String(actualError),
            stack: actualError.stack,
            ...(details.length > 0 ? { details } : {})
        });
    }
}
