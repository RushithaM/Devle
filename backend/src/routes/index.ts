import { Router } from "express";
import { authRouter } from "../modules/auth/auth.routes";
import { challengesRouter } from "../modules/challenges/challenges.routes";
import { gamesRouter } from "../modules/games/games.routes";
import { topicsRouter } from "../modules/topics/topics.routes";
import { usersRouter } from "../modules/users/users.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/topics", topicsRouter);
apiRouter.use("/challenges", challengesRouter);
apiRouter.use("/games", gamesRouter);
apiRouter.use("/users", usersRouter);
