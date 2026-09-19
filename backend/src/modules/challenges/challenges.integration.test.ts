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
  return res.body.token as string;
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/topics", () => {
  it("returns topics in sort order without requiring auth", async () => {
    await seedTopic("dsa", { sortOrder: 0 });
    await seedTopic("git", { name: "Git", shortName: "Git", description: "Version control", sortOrder: 1 });

    const res = await request(app).get("/api/topics");
    expect(res.status).toBe(200);
    expect(res.body.topics.map((t: { id: string }) => t.id)).toEqual(["dsa", "git"]);
  });
});

describe("GET /api/challenges/daily", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/challenges/daily");
    expect(res.status).toBe(401);
  });

  it("returns the same challenge for the same difficulty and never exposes the answer", async () => {
    await seedTopic("dsa");
    for (let i = 0; i < 4; i++) await seedChallenge("dsa", "HARD", { question: `Hard Q ${i}` });

    const a = await register("a@example.com");
    const b = await register("b@example.com");

    const previewA = await request(app)
      .get("/api/challenges/daily?difficulty=HARD")
      .set("Authorization", `Bearer ${a}`);
    const previewB = await request(app)
      .get("/api/challenges/daily?difficulty=HARD")
      .set("Authorization", `Bearer ${b}`);

    expect(previewA.status).toBe(200);
    expect(previewA.body.difficulty).toBe("HARD");
    expect(previewA.body.challenge.question).toBe(previewB.body.challenge.question);
    expect(previewA.body.challenge.answer).toBeUndefined();
    expect(previewA.body.challenge.answerLength).toBeGreaterThan(0);
    expect(typeof previewA.body.date).toBe("string");
    expect(typeof previewA.body.dayNumber).toBe("number");
  });

  it("filters the daily challenge by the requested difficulty", async () => {
    await seedTopic("dsa");
    await seedChallenge("dsa", "EASY", { question: "Easy only", answer: "STACK" });
    await seedChallenge("dsa", "HARD", { question: "Hard only", answer: "HEAPX" });

    const token = await register();
    const easy = await request(app)
      .get("/api/challenges/daily?difficulty=EASY")
      .set("Authorization", `Bearer ${token}`);
    const hard = await request(app)
      .get("/api/challenges/daily?difficulty=HARD")
      .set("Authorization", `Bearer ${token}`);

    expect(easy.body.challenge.question).toBe("Easy only");
    expect(hard.body.challenge.question).toBe("Hard only");
    expect(easy.body.challenge.answerLength).toBe(5);
    expect(hard.body.challenge.answerLength).toBe(5);
    expect(easy.body.completedTopicIds).toEqual([]);
    expect(hard.body.completedTopicIds).toEqual([]);
  });

  it("marks a topic complete for that day's difficulty after the game is finished", async () => {
    await seedTopic("dsa", { sortOrder: 0 });
    await seedTopic("git", { name: "Git", shortName: "Git", description: "Version control", sortOrder: 1 });
    await seedChallenge("dsa", "MEDIUM", { answer: "STACK" });
    await seedChallenge("dsa", "EASY", { answer: "QUEUE" });
    await seedChallenge("git", "MEDIUM", { answer: "COMMIT" });
    await seedChallenge("git", "EASY", { answer: "BRANCH" });
    const token = await register();

    const before = await request(app)
      .get("/api/challenges/daily?difficulty=MEDIUM")
      .set("Authorization", `Bearer ${token}`);
    expect(before.body.completedTopicIds).toEqual([]);

    const topicGame = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${token}`)
      .send({ mode: "DAILY", topicId: "git", difficulty: "MEDIUM" });
    await request(app)
      .post(`/api/games/${topicGame.body.id}/guess`)
      .set("Authorization", `Bearer ${token}`)
      .send({ guess: "COMMIT" });

    const after = await request(app)
      .get("/api/challenges/daily?difficulty=MEDIUM")
      .set("Authorization", `Bearer ${token}`);
    expect(after.body.completedTopicIds).toEqual(["git"]);

    const otherDifficulty = await request(app)
      .get("/api/challenges/daily?difficulty=EASY")
      .set("Authorization", `Bearer ${token}`);
    expect(otherDifficulty.body.completedTopicIds).toEqual([]);
  });

  it("gives every user the same topic question for the same day and difficulty", async () => {
    await seedTopic("git", { name: "Git", shortName: "Git", description: "Version control" });
    for (let i = 0; i < 4; i++) await seedChallenge("git", "HARD", { question: `Git Q ${i}` });

    const a = await register("a@example.com");
    const b = await register("b@example.com");

    const gameA = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${a}`)
      .send({ mode: "DAILY", topicId: "git", difficulty: "HARD" });
    const gameB = await request(app)
      .post("/api/games")
      .set("Authorization", `Bearer ${b}`)
      .send({ mode: "DAILY", topicId: "git", difficulty: "HARD" });

    expect(gameA.body.question).toBe(gameB.body.question);
    expect(gameA.body.id).not.toBe(gameB.body.id);
  });
});

describe("GET /api/challenges/practice", () => {
  it("returns a challenge in the requested topic and difficulty without the answer", async () => {
    await seedTopic("git", { name: "Git", shortName: "Git", description: "Version control" });
    await seedChallenge("git", "MEDIUM", { question: "Practice Q", answer: "COMMIT" });
    const token = await register();

    const res = await request(app)
      .get("/api/challenges/practice?topic=git&difficulty=MEDIUM")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.challenge.question).toBe("Practice Q");
    expect(res.body.challenge.topicId).toBe("git");
    expect(res.body.challenge.difficulty).toBe("MEDIUM");
    expect(res.body.challenge.answer).toBeUndefined();
    expect(res.body.challenge.answerLength).toBe(6);
  });
});
