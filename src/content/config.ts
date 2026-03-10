import { defineCollection, z } from "astro:content";

const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

const mediaSchema = z.object({
  type: z.enum(["image", "gif", "video", "embed"]).default("image"),
  src: z.string().min(1),
  alt: z.string().optional(),
  caption: z.string().optional(),
});

const projects = defineCollection({
  type: "content",
  schema: z
    .object({
      title: z.string().min(1),
      summary: z.string().default(""),
      tags: z.array(z.string().min(1)).default([]),
      status: z.enum(["ongoing", "completed"]).default("ongoing"),
      featured: z.boolean().default(false),

      slug: z.string().min(1).optional(),

      dateStart: z.coerce.date().optional(),
      dateEnd: z.coerce.date().optional(),

      links: z.array(linkSchema).default([]),
      media: z.array(mediaSchema).default([]),

      // Case study fields (all optional — backward compatible)
      role: z.string().optional(),
      timeframe: z.string().optional(),
      stack: z.array(z.string()).default([]),
      highlights: z.array(z.string()).default([]),
      results: z.array(z.string()).default([]),
      problem: z.string().optional(),
      constraints: z.array(z.string()).default([]),
      approach: z.array(z.string()).default([]),
      architecture: z.array(z.string()).default([]),
      challenges: z.array(z.string()).default([]),
      lessons: z.array(z.string()).default([]),
      nextSteps: z.array(z.string()).default([]),

      // GitHub integration (optional — format: "owner/repo")
      githubRepo: z.string().min(3).optional(),
    })
    .refine(
      (d) => !(d.dateStart && d.dateEnd) || d.dateEnd >= d.dateStart,
      { message: "dateEnd must be >= dateStart", path: ["dateEnd"] },
    ),
});

const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().min(1),
    excerpt: z.string().default(""),
    tags: z.array(z.string().min(1)).default([]),
    publishedAt: z.coerce.date().optional(),
    slug: z.string().min(1).optional(),
    coverImage: z.string().min(1).optional(),
  }),
});

export const collections = { projects, posts };
