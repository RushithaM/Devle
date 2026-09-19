/** A deliberate, client-facing error with a known HTTP status — anything else is treated as a 500 and not leaked to the client. */
export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }

  static badRequest(message: string, code = "BAD_REQUEST") {
    return new AppError(400, code, message);
  }
  static unauthorized(message = "Unauthorized", code = "UNAUTHORIZED") {
    return new AppError(401, code, message);
  }
  static forbidden(message = "Forbidden", code = "FORBIDDEN") {
    return new AppError(403, code, message);
  }
  static notFound(message = "Not found", code = "NOT_FOUND") {
    return new AppError(404, code, message);
  }
  static conflict(message: string, code = "CONFLICT") {
    return new AppError(409, code, message);
  }
}
