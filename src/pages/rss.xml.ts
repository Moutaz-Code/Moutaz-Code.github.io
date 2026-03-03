import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { siteConfig } from "../app/siteConfig";
import { contentSource } from "../app/content";

export async function GET(context: APIContext) {
  const posts = await contentSource.listPosts();

  return rss({
    title: `${siteConfig.siteName} Blog`,
    description: `${siteConfig.siteName} — ${siteConfig.siteTagline}`,
    site: context.site?.href ?? siteConfig.siteUrl,
    items: posts.map((post) => ({
      title: post.title,
      pubDate: post.publishedAt,
      description: post.excerpt,
      link: `/blog/${post.slug}/`,
    })),
  });
}
