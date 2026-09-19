import type { Topic, TopicId } from "./types";

export const TOPICS: Record<TopicId, Topic> = {
  dsa: {
    id: "dsa",
    name: "Data Structures & Algorithms",
    shortName: "DSA",
    description: "Core structures and algorithmic thinking",
  },
  dbms: {
    id: "dbms",
    name: "Database Management",
    shortName: "DBMS",
    description: "Relational concepts, indexing, and transactions",
  },
  os: {
    id: "os",
    name: "Operating Systems",
    shortName: "OS",
    description: "Processes, memory, and concurrency",
  },
  networks: {
    id: "networks",
    name: "Computer Networks",
    shortName: "Networks",
    description: "Protocols and how data moves",
  },
  "system-design": {
    id: "system-design",
    name: "System Design",
    shortName: "Sys Design",
    description: "Scaling, reliability, and architecture",
  },
  javascript: {
    id: "javascript",
    name: "JavaScript",
    shortName: "JS",
    description: "The language behind the web",
  },
  typescript: {
    id: "typescript",
    name: "TypeScript",
    shortName: "TS",
    description: "Types, generics, and safer JavaScript",
  },
  git: {
    id: "git",
    name: "Git",
    shortName: "Git",
    description: "Version control in practice",
  },
  angular: {
    id: "angular",
    name: "Angular",
    shortName: "Angular",
    description: "Components, RxJS, and the Angular way",
  },
  react: {
    id: "react",
    name: "React",
    shortName: "React",
    description: "Components, hooks, and rendering",
  },
  nodejs: {
    id: "nodejs",
    name: "Node.js",
    shortName: "Node",
    description: "Server-side JavaScript and its runtime",
  },
};

export const TOPIC_LIST: Topic[] = Object.values(TOPICS);
