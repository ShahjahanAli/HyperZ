// ──────────────────────────────────────────────────────────────
// HyperZ Framework — HTTP Exception
// ──────────────────────────────────────────────────────────────

export class HttpException extends Error {
    public readonly statusCode: number;
    public readonly errors: Record<string, string[]> | null;

    constructor(
        statusCode: number,
        message: string,
        errors: Record<string, string[]> | null = null
    ) {
        super(message);
        this.name = 'HttpException';
        this.statusCode = statusCode;
        this.errors = errors;
    }

    toJSON() {
        return {
            success: false,
            status: this.statusCode,
            message: this.message,
            ...(this.errors ? { errors: this.errors } : {}),
        };
    }
}

// ── Pre-built exceptions ─────────────────────────────────────

export class NotFoundException extends HttpException {
    constructor(message = 'Resource not found') {
        super(404, message);
        this.name = 'NotFoundException';
    }
}

export class UnauthorizedException extends HttpException {
    constructor(message = 'Unauthorized') {
        super(401, message);
        this.name = 'UnauthorizedException';
    }
}

export class ForbiddenException extends HttpException {
    constructor(message = 'Forbidden') {
        super(403, message);
        this.name = 'ForbiddenException';
    }
}

export class ValidationException extends HttpException {
    constructor(errors: Record<string, string[]>, message = 'Validation failed') {
        super(422, message, errors);
        this.name = 'ValidationException';
    }
}

export class ConflictException extends HttpException {
    constructor(message = 'Conflict') {
        super(409, message);
        this.name = 'ConflictException';
    }
}

export class TooManyRequestsException extends HttpException {
    constructor(message = 'Too many requests') {
        super(429, message);
        this.name = 'TooManyRequestsException';
    }
}

export class InternalServerException extends HttpException {
    constructor(message = 'Internal server error') {
        super(500, message);
        this.name = 'InternalServerException';
    }
}
