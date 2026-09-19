import type { Request, Response } from "express";
import { toGameSessionDTO } from "./games.dto";
import * as gamesService from "./games.service";

export async function createGameHandler(req: Request, res: Response) {
  const userId = req.userId!;
  const body = req.body as { mode: "DAILY" | "PRACTICE"; difficulty?: "EASY" | "MEDIUM" | "HARD"; topicId?: string };

  const session =
    body.mode === "DAILY"
      ? await gamesService.createOrResumeDailyGame(userId, body.difficulty, body.topicId)
      : await gamesService.createPracticeGame(userId, body.topicId!, body.difficulty!);

  res.status(201).json(toGameSessionDTO(session));
}

export async function getGameHandler(req: Request, res: Response) {
  const session = await gamesService.getGameOrThrow(req.userId!, req.params.id!);
  res.json(toGameSessionDTO(session));
}

export async function guessHandler(req: Request, res: Response) {
  const session = await gamesService.submitGuess(req.userId!, req.params.id!, req.body.guess);
  res.json(toGameSessionDTO(session));
}

export async function hintHandler(req: Request, res: Response) {
  const hint = await gamesService.useHint(req.userId!, req.params.id!);
  res.json(hint);
}
