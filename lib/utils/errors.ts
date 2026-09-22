// Standardized error handling

export type MessageParams = Record<string, string | number>;

/**
 * How a thrown error names its user-facing text without choosing a language.
 *
 * Server actions run per-request but their responses are cached and shared, so
 * an English sentence baked into one is wrong for the next reader. The key and
 * params travel instead, and the client translates them; `message` stays as the
 * developer-facing fallback that logs and Sentry already rely on.
 */
export interface ErrorI18n {
    key?: string;
    params?: MessageParams;
}

export class AppError extends Error {
    statusCode: number;
    code: string;
    isOperational: boolean;
    messageKey?: string;
    messageParams?: MessageParams;

    constructor(
        message: string,
        statusCode = 500,
        code = "INTERNAL_ERROR",
        i18n: ErrorI18n = {}
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.messageKey = i18n.key;
        this.messageParams = i18n.params;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    field: string | null;

    constructor(
        message: string,
        field: string | null = null,
        i18n: ErrorI18n = {}
    ) {
        // No default key: these carry field-specific wording, so a generic
        // "validation failed" would lose the only useful part. Sites that
        // matter to a reader pass their own key; the rest fall back to message.
        super(message, 400, "VALIDATION_ERROR", i18n);
        this.field = field;
    }
}

export class AuthenticationError extends AppError {
    constructor(message = "Unauthorized", i18n: ErrorI18n = {}) {
        super(message, 401, "AUTHENTICATION_ERROR", {
            key: "errors.unauthorized",
            ...i18n,
        });
    }
}

export class AuthorizationError extends AppError {
    constructor(message = "Forbidden", i18n: ErrorI18n = {}) {
        super(message, 403, "AUTHORIZATION_ERROR", {
            key: "errors.forbidden",
            ...i18n,
        });
    }
}

export class NotFoundError extends AppError {
    resource: string;

    constructor(resource = "Resource", i18n: ErrorI18n = {}) {
        // The resource is passed as a param rather than interpolated into the
        // key, so the client can look it up in errors.resources and fall back
        // to the raw English noun when it is one we have not translated.
        super(`${resource} not found`, 404, "NOT_FOUND", {
            key: "errors.notFound",
            params: { resource },
            ...i18n,
        });
        this.resource = resource;
    }
}

export class ConflictError extends AppError {
    constructor(message = "Resource already exists", i18n: ErrorI18n = {}) {
        super(message, 409, "CONFLICT", { key: "errors.conflict", ...i18n });
    }
}

export class RateLimitError extends AppError {
    constructor(message = "Too many requests", i18n: ErrorI18n = {}) {
        super(message, 429, "RATE_LIMIT_EXCEEDED", {
            key: "errors.rateLimit",
            ...i18n,
        });
    }
}

/**
 * A protection layer could not reach a verdict, so the request is refused
 * rather than allowed through unchecked. Used by the Arcjet guards, which fail
 * closed: an unreachable Arcjet or an unconfigured key must not silently
 * disable shield, bot detection and rate limiting.
 */
export class ServiceUnavailableError extends AppError {
    constructor(
        message = "Service temporarily unavailable. Please try again.",
        i18n: ErrorI18n = {}
    ) {
        super(message, 503, "SERVICE_UNAVAILABLE", {
            key: "errors.serviceUnavailable",
            ...i18n,
        });
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
        super(message || `Plan limit exceeded for ${resource}`, 403, "PLAN_LIMIT_EXCEEDED", {
            key: "errors.planLimit",
            params: { resource: resource ?? "" },
        });
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
