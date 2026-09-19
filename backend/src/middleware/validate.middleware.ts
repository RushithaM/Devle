import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
        .join("; ");
      throw AppError.badRequest(message, "VALIDATION_ERROR");
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".") || "query"}: ${issue.message}`)
        .join("; ");
      throw AppError.badRequest(message, "VALIDATION_ERROR");
    }
    req.query = result.data as typeof req.query;
    next();
  };
}
