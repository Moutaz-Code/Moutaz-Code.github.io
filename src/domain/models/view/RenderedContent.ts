/**
 * Opaque rendered content handle.
 * UI receives this from the adapter and renders `<Content />` without
 * knowing the underlying framework (Astro MDX, Markdoc, etc.).
 */
export type RenderedContent = {
  /** Component that renders the content body. */
  Content: any;
  /** Optional heading tree extracted during rendering. */
  headings?: { depth: number; slug: string; text: string }[];
};
