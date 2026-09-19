import type { Request, Response } from "express";
import { getStreakSummary } from "../streaks/streak.service";
import { getStatisticsSummary } from "../statistics/statistics.service";
import { AppError } from "../../utils/AppError";
import * as usersService from "./users.service";

export async function getProfileHandler(req: Request, res: Response) {
  const userId = req.userId!;
  const [user, preference, streak, statistics] = await Promise.all([
    usersService.findUserById(userId),
    usersService.getPreference(userId),
    getStreakSummary(userId),
    getStatisticsSummary(userId),
  ]);

  if (!user) {
    throw AppError.notFound("User not found");
  }

  res.json({
    user: usersService.toPublicUser(user),
    preference: { difficulty: preference.difficulty, topicId: preference.topicId },
    streak,
    statistics,
  });
}

export async function getStatisticsHandler(req: Request, res: Response) {
  res.json(await getStatisticsSummary(req.userId!));
}

export async function getStreakHandler(req: Request, res: Response) {
  res.json(await getStreakSummary(req.userId!));
}

export async function updatePreferenceHandler(req: Request, res: Response) {
  const preference = await usersService.updatePreference(req.userId!, req.body);
  res.json({ difficulty: preference.difficulty, topicId: preference.topicId });
}

export async function migrateLocalHandler(req: Request, res: Response) {
  const result = await usersService.importLocalProgress(req.userId!, req.body);
  res.json(result);
}
