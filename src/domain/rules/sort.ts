import type { Project } from "../models/Project";
import type { Post } from "../models/Post";

/**
 * Default project sort: featured first, then ongoing before completed,
 * then by dateStart descending (newest first).
 */
export function sortProjectsDefault(
  a: Pick<Project, "featured" | "status" | "dateStart">,
  b: Pick<Project, "featured" | "status" | "dateStart">,
): number {
  // Featured first
  if (a.featured !== b.featured) return a.featured ? -1 : 1;

  // Ongoing before completed
  if (a.status !== b.status) return a.status === "ongoing" ? -1 : 1;

  // Newest dateStart first (entries without date go last)
  const da = a.dateStart ? new Date(a.dateStart).getTime() : 0;
  const db = b.dateStart ? new Date(b.dateStart).getTime() : 0;
  return db - da;
}

/** Default post sort: newest publishedAt first. */
export function sortPostsDefault(
  a: Pick<Post, "publishedAt">,
  b: Pick<Post, "publishedAt">,
): number {
  return (
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
