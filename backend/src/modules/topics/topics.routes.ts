import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as topicsController from "./topics.controller";

export const topicsRouter = Router();

topicsRouter.get("/", asyncHandler(topicsController.listTopicsHandler));
