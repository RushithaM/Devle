import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as authController from "./auth.controller";
import { loginSchema, registerSchema } from "./auth.schemas";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), asyncHandler(authController.registerHandler));
authRouter.post("/login", validateBody(loginSchema), asyncHandler(authController.loginHandler));
authRouter.post("/logout", authController.logoutHandler);
authRouter.get("/me", requireAuth, asyncHandler(authController.meHandler));
