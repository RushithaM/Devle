import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { prisma } from "../../database/prisma";
import { resetDatabase, seedChallenge, seedTopic } from "../../test/helpers";

const app = createApp();

async function register(email = "player@example.com") {
  const res = await request(app).post("/api/auth/register").send({
    name: "Player One",
    email,
    password: "correct-horse",
  });
  return { token: res.body.token as string, userId: res.body.user.id as string };
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/users/me", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("returns the profile, default preference, empty streak, and zeroed statistics", async () => {
    const { token } = await register();
    const res = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: "Player One", email: "player@example.com" });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.preference).toEqual({ difficulty: "MEDIUM", topicId: null });
    expect(res.body.streak).toMatchObject({ currentStreak: 0, bestStreak: 0, hasCompletedToday: false });
    expect(res.body.statistics).toMatchObject({ gamesPlayed: 0, gamesWon: 0, winRate: 0, averageAttempts: null });
  });
});

describe("PATCH /api/users/me/preferences", () => {
  it("persists the selected difficulty", async () => {
    const { token } = await register();
    await seedTopic("dsa");

    const res = await request(app)
      .patch("/api/users/me/preferences")
      .set("Authorization", `Bearer ${token}`)
      .send({ difficulty: "HARD" });

    expect(res.status).toBe(200);
    expect(res.body.difficulty).toBe("HARD");

    const profile = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(profile.body.preference.difficulty).toBe("HARD");
  });

  it("rejects an unknown topic", async () => {
    const { token } = await register();
    const res = await request(app)
      .patch("/api/users/me/preferences")
      .set("Authorization", `Bearer ${token}`)
      .send({ topicId: "not-a-topic" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/users/me/migrate-local", () => {
  it("imports local streak and statistics onto a pristine account", async () => {
    const { token } = await register();

    const res = await request(app)
      .post("/api/users/me/migrate-local")
      .set("Authorization", `Bearer ${token}`)
      .send({
        streak: { current: 4, best: 7, lastCompletedDateKey: "2026-09-19" },
        statistics: { gamesPlayed: 10, gamesWon: 6, totalAttemptsOnWins: 18 },
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ migratedStreak: true, migratedStatistics: true });

    const profile = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(profile.body.streak.bestStreak).toBe(7);
    expect(profile.body.statistics.gamesPlayed).toBe(10);
    expect(profile.body.statistics.gamesWon).toBe(6);
  });

  it("does not overwrite real server-side progress on a second import", async () => {
    await seedTopic("dsa");
    await seedChallenge("dsa", "MEDIUM", { answer: "STACK" });
    const { token } = await register();

    await request(app).post("/api/games").set("Authorization", `Bearer ${token}`).send({ mode: "DAILY", difficulty: "MEDIUM" }).then((created) =>
      request(app).post(`/api/games/${created.body.id}/guess`).set("Authorization", `Bearer ${token}`).send({ guess: "STACK" }),
    );

    const res = await request(app)
      .post("/api/users/me/migrate-local")
      .set("Authorization", `Bearer ${token}`)
      .send({
        streak: { current: 99, best: 99, lastCompletedDateKey: "2026-01-01" },
        statistics: { gamesPlayed: 99, gamesWon: 99, totalAttemptsOnWins: 99 },
      });

    expect(res.body).toEqual({ migratedStreak: false, migratedStatistics: false });

    const profile = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(profile.body.streak.currentStreak).toBe(1);
    expect(profile.body.statistics.gamesPlayed).toBe(1);
  });
});
