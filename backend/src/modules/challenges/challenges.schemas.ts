import { z } from "zod";

export const dailyQuerySchema = z.object({
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
});

export const practiceQuerySchema = z.object({
  topic: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});
