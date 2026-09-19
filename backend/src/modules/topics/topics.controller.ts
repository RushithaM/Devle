import type { Request, Response } from "express";
import * as topicsService from "./topics.service";

export async function listTopicsHandler(_req: Request, res: Response) {
  const topics = await topicsService.listTopics();
  res.json({ topics });
}
