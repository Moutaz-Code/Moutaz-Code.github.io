import { getCollection } from "astro:content";
import type {
  ContentSource,
  ProjectListFilters,
  PostListFilters,
  TagCounts,
} from "../../domain/ports/ContentSource";
import type {
  ProjectSummary,
  ProjectDetail,
} from "../../domain/models/view/ProjectView";
import type {
  PostSummary,
  PostDetail,
} from "../../domain/models/view/PostView";

/** Strip file extension from Astro v5 entry ID to get a clean slug. */
function toSlug(id: string): string {
  return id.replace(/\.[^.]+$/, "");
}

/** Derive a display label from a tag slug (basic title-case). */
function tagSlugToLabel(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Ensure a file path starts with `/` (CMS may omit the leading slash). */
function normalizeSrc(src: string): string {
  return src.startsWith("/") ? src : `/${src}`;
}

export class MdxContentSource implements ContentSource {
  // ── Projects ────────────────────────────────────────

  async listProjects(filters?: ProjectListFilters): Promise<ProjectSummary[]> {
    const entries = await getCollection("projects");

    let summaries: ProjectSummary[] = entries.map((e) => {
      const firstImage = e.data.media.find(
        (m) => m.type === "image" || m.type === "gif",
      );
      return {
        title: e.data.title,
        slug: toSlug(e.id),
        summary: e.data.summary,
        status: e.data.status,
        featured: e.data.featured,
        tags: e.data.tags ?? [],
        primaryImage: firstImage
          ? { src: normalizeSrc(firstImage.src), alt: firstImage.alt }
          : undefined,
        dateStart: e.data.dateStart,
        dateEnd: e.data.dateEnd,
      };
    });

    // Apply filters
    if (filters?.featuredOnly) {
      summaries = summaries.filter((p) => p.featured);
    }
    if (filters?.status) {
      summaries = summaries.filter((p) => p.status === filters.status);
    }
    if (filters?.tag) {
      summaries = summaries.filter((p) => p.tags.includes(filters.tag!));
    }

    // Sort: featured first, ongoing before completed, newest dateStart first
    summaries.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      if (a.status !== b.status) return a.status === "ongoing" ? -1 : 1;
      const da = a.dateStart ? a.dateStart.getTime() : 0;
      const db = b.dateStart ? b.dateStart.getTime() : 0;
      return db - da;
    });

    // Pagination
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit;
    if (limit != null) {
      summaries = summaries.slice(offset, offset + limit);
    } else if (offset > 0) {
      summaries = summaries.slice(offset);
    }

    return summaries;
  }

  async getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
    const entries = await getCollection("projects");
    const entry = entries.find((e) => toSlug(e.id) === slug);
    if (!entry) return null;

    const rendered = await entry.render();
    const firstImage = entry.data.media.find(
      (m) => m.type === "image" || m.type === "gif",
    );

    return {
      title: entry.data.title,
      slug: toSlug(entry.id),
      summary: entry.data.summary,
      status: entry.data.status,
      featured: entry.data.featured,
      tags: entry.data.tags ?? [],
      primaryImage: firstImage
        ? { src: normalizeSrc(firstImage.src), alt: firstImage.alt }
        : undefined,
      dateStart: entry.data.dateStart,
      dateEnd: entry.data.dateEnd,
      links: entry.data.links ?? [],
      media: (entry.data.media ?? []).map((m) => ({
        ...m,
        src: normalizeSrc(m.src),
      })),
      content: {
        Content: rendered.Content,
        headings: rendered.headings,
      },
    };
  }

  // ── Posts ────────────────────────────────────────────

  async listPosts(filters?: PostListFilters): Promise<PostSummary[]> {
    const entries = await getCollection("posts");

    let summaries: PostSummary[] = entries.map((e) => ({
      title: e.data.title,
      slug: toSlug(e.id),
      excerpt: e.data.excerpt,
      tags: e.data.tags ?? [],
      publishedAt: e.data.publishedAt,
      coverImage: e.data.coverImage ? normalizeSrc(e.data.coverImage) : undefined,
    }));

    // Filter by tag
    if (filters?.tag) {
      summaries = summaries.filter((p) => p.tags.includes(filters.tag!));
    }

    // Sort newest first
    summaries.sort(
      (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
    );

    // Pagination
    const offset = filters?.offset ?? 0;
    const limit = filters?.limit;
    if (limit != null) {
      summaries = summaries.slice(offset, offset + limit);
    } else if (offset > 0) {
      summaries = summaries.slice(offset);
    }

    return summaries;
  }

  async getPostBySlug(slug: string): Promise<PostDetail | null> {
    const entries = await getCollection("posts");
    const entry = entries.find((e) => toSlug(e.id) === slug);
    if (!entry) return null;

    const rendered = await entry.render();

    return {
      title: entry.data.title,
      slug: toSlug(entry.id),
      excerpt: entry.data.excerpt,
      tags: entry.data.tags ?? [],
      publishedAt: entry.data.publishedAt,
      coverImage: entry.data.coverImage ? normalizeSrc(entry.data.coverImage) : undefined,
      content: {
        Content: rendered.Content,
        headings: rendered.headings,
      },
    };
  }

  // ── Tags ────────────────────────────────────────────

  async listTags(): Promise<TagCounts[]> {
    const [projects, posts] = await Promise.all([
      getCollection("projects"),
      getCollection("posts"),
    ]);

    const map = new Map<
      string,
      { countProjects: number; countPosts: number }
    >();

    for (const p of projects) {
      for (const tag of p.data.tags) {
        const existing = map.get(tag) ?? { countProjects: 0, countPosts: 0 };
        existing.countProjects++;
        map.set(tag, existing);
      }
    }

    for (const p of posts) {
      for (const tag of p.data.tags) {
        const existing = map.get(tag) ?? { countProjects: 0, countPosts: 0 };
        existing.countPosts++;
        map.set(tag, existing);
      }
    }

    const tags: TagCounts[] = [...map.entries()].map(([slug, counts]) => ({
      slug,
      label: tagSlugToLabel(slug),
      countProjects: counts.countProjects,
      countPosts: counts.countPosts,
      countTotal: counts.countProjects + counts.countPosts,
    }));

    // Sort by total count desc, then alphabetically
    tags.sort((a, b) => b.countTotal - a.countTotal || a.slug.localeCompare(b.slug));

    return tags;
  }
}
