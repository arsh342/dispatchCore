/**
 * Custom Error Classes
 *
 * Structured error hierarchy for clean, consistent error handling.
 * All custom errors extend AppError and carry a status code + error code
 * that the global errorHandler middleware uses to build the response.
 */

class AppError extends Error {
    /**
     * @param {string} message - Human-readable error description
     * @param {number} status - HTTP status code
     * @param {string} code - Machine-readable error code (e.g. 'NOT_FOUND')
     */
    constructor(message, status = 500, code = 'INTERNAL_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message = 'Validation failed', details = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.details = details;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(message, 403, 'FORBIDDEN');
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT');
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

class LockTimeoutError extends AppError {
    constructor(message = 'Resource is currently locked, please try again') {
        super(message, 408, 'LOCK_TIMEOUT');
    }
}

module.exports = {
    AppError,
    ValidationError,
    NotFoundError,
    ForbiddenError,
    ConflictError,
    UnauthorizedError,
    LockTimeoutError,
};
