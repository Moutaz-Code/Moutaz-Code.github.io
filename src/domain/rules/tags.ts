import { slugify } from "./slug";

export function normalizeTagLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ");
}

export function toTagSlug(label: string): string {
  return slugify(label);
}

/** Deduplicate and sort tag slugs alphabetically. */
export function normalizeTagArray(tags: string[]): string[] {
  const slugs = tags.map(toTagSlug);
  return [...new Set(slugs)].sort();
}
