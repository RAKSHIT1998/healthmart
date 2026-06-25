export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly errors?: Array<{ field: string; message: string }>;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code = 'ERROR',
    errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static badRequest(message: string, errors?: Array<{ field: string; message: string }>) {
    return new ApiError(400, message, 'BAD_REQUEST', errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string) {
    return new ApiError(409, message, 'CONFLICT');
  }

  static unprocessable(message: string, errors?: Array<{ field: string; message: string }>) {
    return new ApiError(422, message, 'UNPROCESSABLE_ENTITY', errors);
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(429, message, 'TOO_MANY_REQUESTS');
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, message, 'INTERNAL_ERROR');
  }
}
