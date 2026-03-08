import type { ProjectStatus } from "../Project";
import type { Link } from "../Link";
import type { Media } from "../Media";
import type { RenderedContent } from "./RenderedContent";

export type ProjectSummary = {
  title: string;
  slug: string;
  summary: string;
  status: ProjectStatus;
  featured: boolean;
  tags: string[];
  primaryImage?: { src: string; alt?: string };
  dateStart?: Date;
  dateEnd?: Date;
};

export type ProjectDetail = ProjectSummary & {
  links: Link[];
  media: Media[];
  content: RenderedContent;
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
