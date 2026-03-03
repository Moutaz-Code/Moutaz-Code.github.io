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
      summary: z.string().min(1),
      tags: z.array(z.string().min(1)).default([]),
      status: z.enum(["ongoing", "completed"]),
      featured: z.boolean().default(false),

      slug: z.string().min(1).optional(),

      dateStart: z.coerce.date().optional(),
      dateEnd: z.coerce.date().optional(),

      links: z.array(linkSchema).default([]),
      media: z.array(mediaSchema).default([]),
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
    excerpt: z.string().min(1),
    tags: z.array(z.string().min(1)).default([]),
    publishedAt: z.coerce.date(),
    slug: z.string().min(1).optional(),
    coverImage: z.string().min(1).optional(),
  }),
});

export const collections = { projects, posts };
