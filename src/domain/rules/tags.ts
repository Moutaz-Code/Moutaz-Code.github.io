import { slugify } from "./slug";
import { TAG_BY_SLUG, ALIAS_TO_SLUG } from "../../app/tagsRegistry";

/** Normalize a raw tag string to a kebab-case slug. */
export function normalizeTagInput(raw: string): string {
  return slugify(raw);
}

/** Canonicalize a raw tag: resolve alias → normalize → return canonical slug.
 *  Checks raw lowercase first (to handle labels with special chars like "C#", ".NET"),
 *  then falls back to slugified form. */
export function canonicalizeTag(raw: string): string {
  const lower = raw.toLowerCase().trim();
  // Try raw lowercase first (catches aliases like "c#", ".net", "c++")
  const fromRaw = ALIAS_TO_SLUG.get(lower);
  if (fromRaw) return fromRaw;
  // Fall back to slugified form
  const slug = normalizeTagInput(raw);
  return ALIAS_TO_SLUG.get(slug) ?? slug;
}

/** Canonicalize an array of raw tags: normalize, resolve aliases, dedupe, preserve order. */
export function canonicalizeTagArray(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const slug = canonicalizeTag(raw);
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      result.push(slug);
    }
  }
  return result;
}

/** Get display label for a tag slug. Registry label if known, else title-case fallback. */
export function tagLabel(slug: string): string {
  const def = TAG_BY_SLUG.get(slug);
  if (def) return def.label;
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
