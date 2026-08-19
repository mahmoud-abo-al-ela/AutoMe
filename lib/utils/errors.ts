// Standardized error handling

export class AppError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;

    constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR") {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    field: string | null;

    constructor(message: string, field: string | null = null) {
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
    resource: string;

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

/**
 * A protection layer could not reach a verdict, so the request is refused
 * rather than allowed through unchecked. Used by the Arcjet guards, which fail
 * closed: an unreachable Arcjet or an unconfigured key must not silently
 * disable shield, bot detection and rate limiting.
 */
export class ServiceUnavailableError extends AppError {
    constructor(message = "Service temporarily unavailable. Please try again.") {
        super(message, 503, "SERVICE_UNAVAILABLE");
    }
}

export interface PlanLimitErrorInput {
    resource?: string;
    planType?: string;
    limit?: number;
    currentUsage?: number;
    upgradeUrl?: string;
    message?: string;
}

export class PlanLimitError extends AppError {
    resource?: string;
    planType?: string;
    limit?: number;
    currentUsage?: number;
    upgradeUrl?: string;

    constructor({ resource, planType, limit, currentUsage, upgradeUrl, message }: PlanLimitErrorInput) {
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
export function isOperationalError(error: unknown): boolean {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}

/**
 * Log error with appropriate level
 */
export function logError(errorOrMessage: unknown, ...args: unknown[]): void {
    let actualError: unknown = errorOrMessage;
    let context: string | undefined = undefined;

    if (typeof errorOrMessage === 'string') {
        context = errorOrMessage;
        const foundError = args.find((arg) => arg instanceof Error);
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

    const details = args.filter((arg) => arg !== actualError);

    if (isOperationalError(actualError)) {
        const opError = actualError as AppError;
        console.warn(context || "Operational error:", {
            message: opError.message,
            code: opError.code,
            statusCode: opError.statusCode,
            ...(details.length > 0 ? { details } : {})
        });
    } else {
        const err = actualError as Error;
        console.error(context || "Programming error:", {
            message: err.message || String(actualError),
            stack: err.stack,
            ...(details.length > 0 ? { details } : {})
        });
    }
}
