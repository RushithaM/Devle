import type { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { findUserById, toPublicUser } from "../users/users.service";
import * as authService from "./auth.service";

export async function registerHandler(req: Request, res: Response) {
  const result = await authService.register(req.body);
  res.status(201).json(result);
}

export async function loginHandler(req: Request, res: Response) {
  const result = await authService.login(req.body);
  res.status(200).json(result);
}

export function logoutHandler(_req: Request, res: Response) {
  // JWTs are stateless — logging out is the client discarding its token.
  // This endpoint exists for a symmetrical API and a future token-blocklist.
  res.status(204).send();
}

export async function meHandler(req: Request, res: Response) {
  const user = await findUserById(req.userId!);
  if (!user) {
    throw AppError.notFound("User not found");
  }
  res.json({ user: toPublicUser(user) });
}
