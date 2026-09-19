import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { prisma } from "../../database/prisma";
import { resetDatabase, seedChallenge, seedTopic } from "../../test/helpers";

const app = createApp();

async function registerUser(email = "player@example.com") {
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

describe("POST /api/games (practice)", () => {
  it("creates a practice session and never exposes the answer while playing", async () => {
    await seedTopic("dsa");
    await seedChallenge("dsa", "EASY", { answer: "STACK", question: "LIFO structure?" });
    const { token } = await registerUser();

    const res = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({ mode: "PRACTICE", topicId: "dsa", difficulty: "EASY" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("PLAYING");
    expect(res.body.question).toBe("LIFO structure?");
    expect(res.body.answer).toBeUndefined();
    expect(res.body.explanation).toBeUndefined();
  });

  it("404s for a topic/difficulty with no challenges", async () => {
    await seedTopic("dsa");
    const { token } = await registerUser();

    const res = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({ mode: "PRACTICE", topicId: "dsa", difficulty: "HARD" });

    expect(res.status).toBe(404);
  });
});

describe("POST /api/games/:id/guess", () => {
  async function startGame(answer: string) {
    await seedTopic("dsa");
    await seedChallenge("dsa", "EASY", { answer });
    const { token } = await registerUser();
    const created = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({ mode: "PRACTICE", topicId: "dsa", difficulty: "EASY" });
    return { token, gameId: created.body.id as string };
  }

  it("evaluates a wrong guess and keeps the game playing", async () => {
    const { token, gameId } = await startGame("STACK");

    const res = await request(app)
      .post(`/api/games/${gameId}/guess`)
      .set("Authorization", `Bearer ${token}`)
      .send({ guess: "TRACK" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("PLAYING");
    expect(res.body.attempts).toBe(1);
    expect(res.body.guesses[0].result).toHaveLength(5);
    expect(res.body.answer).toBeUndefined(); // still hidden — game not over
  });

  it("reveals the answer and explanation only once the game is won", async () => {
    const { token, gameId } = await startGame("STACK");

    const res = await request(app)
      .post(`/api/games/${gameId}/guess`)
      .set("Authorization", `Bearer ${token}`)
      .send({ guess: "STACK" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("WON");
    expect(res.body.answer).toBe("STACK");
    expect(res.body.explanation).toBeDefined();
    expect(res.body.guesses[0].result.every((r: { status: string }) => r.status === "correct")).toBe(true);
  });

  it("rejects a guess of the wrong length", async () => {
    const { token, gameId } = await startGame("STACK");

    const res = await request(app)
      .post(`/api/games/${gameId}/guess`)
      .set("Authorization", `Bearer ${token}`)
      .send({ guess: "TOOLONGWORD" });

    expect(res.status).toBe(400);
  });

  it("ends the game as LOST after max attempts without a win", async () => {
    const { token, gameId } = await startGame("STACK");
    const wrongGuesses = ["TRACK", "CRACK", "BLACK", "WRACK", "SNACK", "PLACK"];

    let last;
    for (const guess of wrongGuesses) {
      last = await request(app)
        .post(`/api/games/${gameId}/guess`)
        .set("Authorization", `Bearer ${token}`)
        .send({ guess });
    }

    expect(last!.body.status).toBe("LOST");
    expect(last!.body.attempts).toBe(6);
    expect(last!.body.answer).toBe("STACK");
  });

  it("refuses further guesses once the game is finished", async () => {
    const { token, gameId } = await startGame("STACK");
    await request(app).post(`/api/games/${gameId}/guess`).set("Authorization", `Bearer ${token}`).send({ guess: "STACK" });

    const res = await request(app)
      .post(`/api/games/${gameId}/guess`)
      .set("Authorization", `Bearer ${token}`)
      .send({ guess: "STACK" });

    expect(res.status).toBe(400);
  });

  it("returns 404 when guessing on another user's game", async () => {
    const { gameId } = await startGame("STACK");
    const { token: otherToken } = await registerUser("intruder@example.com");

    const res = await request(app)
      .post(`/api/games/${gameId}/guess`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ guess: "STACK" });

    expect(res.status).toBe(404);
  });
});

describe("POST /api/games/:id/hint", () => {
  it("returns hint 1 then hint 2, and refuses a third", async () => {
    await seedTopic("dsa");
    await seedChallenge("dsa", "EASY", { answer: "STACK" });
    const { token } = await registerUser();
    const created = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({ mode: "PRACTICE", topicId: "dsa", difficulty: "EASY" });
    const gameId = created.body.id;

    const hint1 = await request(app).post(`/api/games/${gameId}/hint`).set("Authorization", `Bearer ${token}`);
    expect(hint1.status).toBe(200);
    expect(hint1.body.hintNumber).toBe(1);
    expect(hint1.body.text).toBe("Test hint one");

    const hint2 = await request(app).post(`/api/games/${gameId}/hint`).set("Authorization", `Bearer ${token}`);
    expect(hint2.body.hintNumber).toBe(2);
    expect(hint2.body.text).toBe("Test hint two");

    const hint3 = await request(app).post(`/api/games/${gameId}/hint`).set("Authorization", `Bearer ${token}`);
    expect(hint3.status).toBe(400);
  });
});

describe("daily game + streak/statistics integration", () => {
  it("resolves the same daily challenge for the same difficulty across two different users", async () => {
    await seedTopic("dsa");
    for (let i = 0; i < 5; i++) await seedChallenge("dsa", "MEDIUM");

    const a = await registerUser("a@example.com");
    const b = await registerUser("b@example.com");

    await request(app).patch("/api/users/me/preferences").set("Authorization", `Bearer ${a.token}`).send({ difficulty: "MEDIUM" });
    await request(app).patch("/api/users/me/preferences").set("Authorization", `Bearer ${b.token}`).send({ difficulty: "MEDIUM" });

    const gameA = await request(app).post("/api/games").set("Authorization", `Bearer ${a.token}`).send({ mode: "DAILY" });
    const gameB = await request(app).post("/api/games").set("Authorization", `Bearer ${b.token}`).send({ mode: "DAILY" });

    expect(gameA.body.question).toBe(gameB.body.question);
    expect(gameA.body.difficulty).toBe("MEDIUM");
  });

  it("concurrent daily starts for the same user return the same session", async () => {
    await seedTopic("dsa");
    await seedChallenge("dsa", "MEDIUM", { answer: "STACK" });
    const { token } = await registerUser();

    const [first, second] = await Promise.all([
      request(app).post("/api/games").set("Authorization", `Bearer ${token}`).send({ mode: "DAILY", difficulty: "MEDIUM" }),
      request(app).post("/api/games").set("Authorization", `Bearer ${token}`).send({ mode: "DAILY", difficulty: "MEDIUM" }),
    ]);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.id).toBe(second.body.id);
  });

  it("resuming the daily game returns the same session instead of creating a new one", async () => {
    await seedTopic("dsa");
    await seedChallenge("dsa", "MEDIUM", { answer: "STACK" });
    const { token } = await registerUser();

    const first = await request(app).post("/api/games").set("Authorization", `Bearer ${token}`).send({ mode: "DAILY", difficulty: "MEDIUM" });
    const second = await request(app).post("/api/games").set("Authorization", `Bearer ${token}`).send({ mode: "DAILY", difficulty: "MEDIUM" });

    expect(first.body.id).toBe(second.body.id);
  });

  it("winning the daily game increments the streak and statistics, practice does not touch the streak", async () => {
    await seedTopic("dsa");
    await seedChallenge("dsa", "MEDIUM", { answer: "STACK" });
    await seedChallenge("dsa", "EASY", { answer: "QUEUE" });
    const { token } = await registerUser();

    const daily = await request(app).post("/api/games").set("Authorization", `Bearer ${token}`).send({ mode: "DAILY", difficulty: "MEDIUM" });
    await request(app).post(`/api/games/${daily.body.id}/guess`).set("Authorization", `Bearer ${token}`).send({ guess: "STACK" });

    const streakRes = await request(app).get("/api/users/me/streak").set("Authorization", `Bearer ${token}`);
    expect(streakRes.body.currentStreak).toBe(1);
    expect(streakRes.body.hasCompletedToday).toBe(true);

    const practice = await request(app).post("/api/games").set("Authorization", `Bearer ${token}`).send({ mode: "PRACTICE", topicId: "dsa", difficulty: "EASY" });
    await request(app).post(`/api/games/${practice.body.id}/guess`).set("Authorization", `Bearer ${token}`).send({ guess: "QUEUE" });

    const streakAfterPractice = await request(app).get("/api/users/me/streak").set("Authorization", `Bearer ${token}`);
    expect(streakAfterPractice.body.currentStreak).toBe(1); // unchanged by practice

    const stats = await request(app).get("/api/users/me/statistics").set("Authorization", `Bearer ${token}`);
    expect(stats.body.gamesPlayed).toBe(2); // both daily and practice count toward stats
    expect(stats.body.gamesWon).toBe(2);
  });

  it("a lost daily game still counts toward the streak, matching the original MVP behavior", async () => {
    await seedTopic("dsa");
    await seedChallenge("dsa", "MEDIUM", { answer: "STACK" });
    const { token } = await registerUser();

    const daily = await request(app).post("/api/games").set("Authorization", `Bearer ${token}`).send({ mode: "DAILY", difficulty: "MEDIUM" });
    for (const guess of ["TRACK", "CRACK", "BLACK", "WRACK", "SNACK", "PLACK"]) {
      await request(app).post(`/api/games/${daily.body.id}/guess`).set("Authorization", `Bearer ${token}`).send({ guess });
    }

    const streakRes = await request(app).get("/api/users/me/streak").set("Authorization", `Bearer ${token}`);
    expect(streakRes.body.currentStreak).toBe(1);
  });
});

describe("GET /api/challenges/daily", () => {
  it("reflects an in-progress daily session without exposing the answer", async () => {
    await seedTopic("dsa");
    await seedChallenge("dsa", "MEDIUM", { answer: "STACK" });
    const { token } = await registerUser();

    const preview1 = await request(app).get("/api/challenges/daily?difficulty=MEDIUM").set("Authorization", `Bearer ${token}`);
    expect(preview1.body.gameSession).toBeNull();

    await request(app).post("/api/games").set("Authorization", `Bearer ${token}`).send({ mode: "DAILY", difficulty: "MEDIUM" });

    const preview2 = await request(app).get("/api/challenges/daily?difficulty=MEDIUM").set("Authorization", `Bearer ${token}`);
    expect(preview2.body.gameSession).not.toBeNull();
    expect(preview2.body.gameSession.status).toBe("PLAYING");
    expect(preview2.body.challenge.answer).toBeUndefined();
  });
});

afterAllTeardown();

function afterAllTeardown() {
  // Ensures the Prisma connection pool closes so vitest can exit cleanly.
  process.on("beforeExit", () => {
    void prisma.$disconnect();
  });
}
