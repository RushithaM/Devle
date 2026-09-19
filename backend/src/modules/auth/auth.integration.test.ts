import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { resetDatabase } from "../../test/helpers";

const app = createApp();

beforeEach(async () => {
  await resetDatabase();
});

describe("POST /api/auth/register", () => {
  it("creates a user and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-horse",
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: "Ada Lovelace", email: "ada@example.com" });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(typeof res.body.token).toBe("string");
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: "dup@example.com",
      password: "correct-horse",
    });

    const res = await request(app).post("/api/auth/register").send({
      name: "Someone Else",
      email: "dup@example.com",
      password: "another-password",
    });

    expect(res.status).toBe(409);
  });

  it("rejects a short password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: "ada2@example.com",
      password: "short",
    });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Ada",
      email: "not-an-email",
      password: "correct-horse",
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/auth/register").send({
      name: "Grace Hopper",
      email: "grace@example.com",
      password: "compiler-1952",
    });
  });

  it("logs in with correct credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "grace@example.com", password: "compiler-1952" });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("grace@example.com");
    expect(typeof res.body.token).toBe("string");
  });

  it("rejects an incorrect password without revealing which field was wrong", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "grace@example.com", password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("rejects an unknown email with the same generic error", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "whatever123" });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user with a valid token", async () => {
    const registerRes = await request(app).post("/api/auth/register").send({
      name: "Margaret Hamilton",
      email: "margaret@example.com",
      password: "apollo-guidance",
    });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${registerRes.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("margaret@example.com");
  });

  it("returns 401 for a malformed token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });
});
