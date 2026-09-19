import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as usersController from "./users.controller";
import { migrateLocalSchema, updatePreferenceSchema } from "./users.schemas";

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get("/me", asyncHandler(usersController.getProfileHandler));
usersRouter.get("/me/statistics", asyncHandler(usersController.getStatisticsHandler));
usersRouter.get("/me/streak", asyncHandler(usersController.getStreakHandler));
usersRouter.patch(
  "/me/preferences",
  validateBody(updatePreferenceSchema),
  asyncHandler(usersController.updatePreferenceHandler),
);
usersRouter.post(
  "/me/migrate-local",
  validateBody(migrateLocalSchema),
  asyncHandler(usersController.migrateLocalHandler),
);
