import type { Request, Response } from "express";
import { dateKeyUTC, dayNumberUTC } from "../../utils/date";
import { findExistingDailySession } from "../games/games.service";
import { getPreference } from "../users/users.service";
import { toPublicChallenge } from "./challenges.dto";
import * as challengesService from "./challenges.service";

export async function getDailyPreviewHandler(req: Request, res: Response) {
  const now = new Date();
  const query = req.query as { difficulty?: "EASY" | "MEDIUM" | "HARD" };
  const difficulty = query.difficulty ?? (await getPreference(req.userId!)).difficulty;

  const topic = await challengesService.getFeaturedTopic(now);
  const [daily, completedTopicIds] = await Promise.all([
    challengesService.resolveDailyChallenge(now, topic.id, difficulty),
    challengesService.listCompletedTopicIds(req.userId!, difficulty, now),
  ]);
  const existingSession = await findExistingDailySession(req.userId!, daily.id);

  res.json({
    date: dateKeyUTC(now),
    dayNumber: dayNumberUTC(now),
    topic: { id: topic.id, name: topic.name, shortName: topic.shortName },
    difficulty,
    challenge: toPublicChallenge(daily.challenge),
    completedTopicIds,
    gameSession: existingSession
      ? {
          id: existingSession.id,
          status: existingSession.status,
          attempts: existingSession.attempts,
          maxAttempts: existingSession.maxAttempts,
          hintsUsed: existingSession.hintsUsed,
        }
      : null,
  });
}

export async function getPracticePreviewHandler(req: Request, res: Response) {
  const { topic: topicId, difficulty } = req.query as {
    topic: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
  };
  const challenge = await challengesService.pickPracticeChallenge(topicId, difficulty);
  res.json({ challenge: toPublicChallenge(challenge) });
}
