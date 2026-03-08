import type { Link } from "./Link";
import type { Media } from "./Media";

export type ProjectStatus = "ongoing" | "completed";

export type Project = {
  title: string;
  slug: string;
  summary: string;
  tags: string[];
  status: ProjectStatus;
  featured: boolean;
  dateStart?: string;
  dateEnd?: string;
  links: Link[];
  media: Media[];
  body: string;
  updatedAt?: string;
  role?: string;
  timeframe?: string;
  stack: string[];
  highlights: string[];
  results: string[];
  problem?: string;
  constraints: string[];
  approach: string[];
  architecture: string[];
  challenges: string[];
  lessons: string[];
  nextSteps: string[];
};
