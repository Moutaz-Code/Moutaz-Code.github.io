import type { RenderedContent } from "./RenderedContent";

export type PostSummary = {
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  publishedAt?: Date;
  coverImage?: string;
};

export type PostDetail = PostSummary & {
  content: RenderedContent;
};
