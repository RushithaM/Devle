import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    throw AppError.unauthorized("Missing bearer token");
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    throw AppError.unauthorized("Invalid or expired token");
  }
}
