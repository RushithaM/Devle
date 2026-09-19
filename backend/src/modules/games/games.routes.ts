import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateBody } from "../../middleware/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import * as gamesController from "./games.controller";
import { createGameSchema, guessSchema } from "./games.schemas";

export const gamesRouter = Router();

gamesRouter.use(requireAuth);

gamesRouter.post("/", validateBody(createGameSchema), asyncHandler(gamesController.createGameHandler));
gamesRouter.get("/:id", asyncHandler(gamesController.getGameHandler));
gamesRouter.post("/:id/guess", validateBody(guessSchema), asyncHandler(gamesController.guessHandler));
gamesRouter.post("/:id/hint", asyncHandler(gamesController.hintHandler));
