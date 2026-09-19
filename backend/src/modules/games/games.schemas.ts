import { z } from "zod";

export const createGameSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("DAILY"),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    topicId: z.string().min(1).optional(),
  }),
  z.object({
    mode: z.literal("PRACTICE"),
    topicId: z.string().min(1),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  }),
]);

export const guessSchema = z.object({
  guess: z.string().trim().min(1).max(30),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type GuessInput = z.infer<typeof guessSchema>;
