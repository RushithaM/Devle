import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateQuery } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as challengesController from "./challenges.controller";
import { dailyQuerySchema, practiceQuerySchema } from "./challenges.schemas";

export const challengesRouter = Router();

challengesRouter.use(requireAuth);

challengesRouter.get(
  "/daily",
  validateQuery(dailyQuerySchema),
  asyncHandler(challengesController.getDailyPreviewHandler),
);
challengesRouter.get(
  "/practice",
  validateQuery(practiceQuerySchema),
  asyncHandler(challengesController.getPracticePreviewHandler),
);
