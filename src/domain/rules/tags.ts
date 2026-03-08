import { slugify } from "./slug";
import { TAG_BY_SLUG, ALIAS_TO_SLUG } from "../../app/tagsRegistry";

/** Normalize a raw tag string to a kebab-case slug. */
export function normalizeTagInput(raw: string): string {
  return slugify(raw);
}

/** Canonicalize a raw tag: normalize → resolve alias → return canonical slug. */
export function canonicalizeTag(raw: string): string {
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
