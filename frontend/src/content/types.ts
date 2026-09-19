export type Difficulty = "easy" | "medium" | "hard";

export const TOPIC_IDS = [
  "dsa",
  "dbms",
  "os",
  "networks",
  "system-design",
  "javascript",
  "typescript",
  "git",
  "angular",
  "react",
  "nodejs",
] as const;

export type TopicId = (typeof TOPIC_IDS)[number];

export interface Topic {
  id: TopicId;
  name: string;
  shortName: string;
  description: string;
}

export type ChallengeType =
  | "WORD"
  | "MULTIPLE_CHOICE"
  | "CODE_OUTPUT"
  | "DEBUGGING"
  | "SQL"
  | "SYSTEM_DESIGN";

export interface Challenge {
  id: string;
  type: ChallengeType;
  topic: TopicId;
  question: string;
  answer: string;
  difficulty: Difficulty;
  hints: [string, string];
  explanation: string;
  relatedConcepts: string[];
  interviewTip?: string;
  tags: string[];
}
