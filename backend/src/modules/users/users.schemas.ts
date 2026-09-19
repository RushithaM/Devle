import { z } from "zod";

export const updatePreferenceSchema = z
  .object({
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
    topicId: z.string().min(1).nullable().optional(),
  })
  .refine((data) => data.difficulty !== undefined || data.topicId !== undefined, {
    message: "Provide at least one of difficulty or topicId",
  });

/** Matches the shape the original localStorage-only MVP used, so migrating a browser's progress is a direct pass-through. */
export const migrateLocalSchema = z.object({
  streak: z
    .object({
      current: z.number().int().min(0),
      best: z.number().int().min(0),
      lastCompletedDateKey: z.string().nullable(),
    })
    .optional(),
  statistics: z
    .object({
      gamesPlayed: z.number().int().min(0),
      gamesWon: z.number().int().min(0),
      totalAttemptsOnWins: z.number().int().min(0),
    })
    .optional(),
});

export type UpdatePreferenceInput = z.infer<typeof updatePreferenceSchema>;
export type MigrateLocalInput = z.infer<typeof migrateLocalSchema>;
