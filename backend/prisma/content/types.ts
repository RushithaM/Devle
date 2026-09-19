/** Topic catalog lives in topics.ts. Challenge questions live in PostgreSQL. */
export type Difficulty = "easy" | "medium" | "hard";

export interface Topic {
  id: string;
  name: string;
  shortName: string;
  description: string;
}
