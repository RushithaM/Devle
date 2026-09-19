import { apiRequest } from "./client";
import type { Topic } from "./types";

export function listTopics() {
  return apiRequest<{ topics: Topic[] }>("/api/topics");
}
