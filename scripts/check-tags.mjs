/**
 * Tag check: scan MDX frontmatter for unknown tags.
 * Reports warnings for tags not in the registry but does NOT fail the build.
 * Run: node scripts/check-tags.mjs
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const CONTENT_DIRS = [
  join(ROOT, "src", "content", "projects"),
  join(ROOT, "src", "content", "posts"),
];

// ── Inline the registry slugs so we don't need to import TS ──
const KNOWN_SLUGS = new Set([
  "astro", "tailwind", "typescript", "javascript", "react", "nextjs", "node", "mdx",
  "dotnet", "csharp", "wpf",
  "unity", "shader", "webgl", "opengl", "threejs", "stylized-rendering",
  "vercel", "github", "docker", "git",
  "forensics", "security", "ai",
  "case-study", "bezier-curves",
]);

const KNOWN_ALIASES = new Map([
  ["tailwindcss", "tailwind"], ["tailwind-css", "tailwind"],
  ["ts", "typescript"], ["js", "javascript"],
  ["reactjs", "react"], ["next", "nextjs"], ["nodejs", "node"],
  ["dot-net", "dotnet"], ["net", "dotnet"],
  ["c-sharp", "csharp"], ["cs", "csharp"],
  ["unity3d", "unity"], ["shaders", "shader"], ["three", "threejs"],
  ["artificial-intelligence", "ai"], ["machine-learning", "ai"], ["ml", "ai"],
]);

function slugify(input) {
  return input.toLowerCase().trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function canonicalize(raw) {
  const slug = slugify(raw);
  return KNOWN_ALIASES.get(slug) ?? slug;
}

/** Extract tags array from YAML frontmatter. */
function extractTags(content) {
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return [];

  const fm = fmMatch[1];
  const tagsMatch = fm.match(/^tags:\s*$/m);
  if (!tagsMatch) {
    // Inline tags: `tags: [a, b, c]`
    const inlineMatch = fm.match(/^tags:\s*\[([^\]]*)\]/m);
    if (inlineMatch) {
      return inlineMatch[1].split(",").map((t) => t.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    }
    return [];
  }

  // Multi-line tags
  const lines = fm.slice(tagsMatch.index + tagsMatch[0].length).split(/\r?\n/);
  const tags = [];
  for (const line of lines) {
    const m = line.match(/^\s+-\s+(.+)/);
    if (m) {
      tags.push(m[1].trim().replace(/^["']|["']$/g, ""));
    } else if (/^\S/.test(line)) {
      break;
    }
  }
  return tags;
}

async function* walkMdx(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkMdx(full);
    } else if (entry.name.endsWith(".mdx")) {
      yield full;
    }
  }
}

let unknownCount = 0;

for (const dir of CONTENT_DIRS) {
  for await (const filePath of walkMdx(dir)) {
    const content = await readFile(filePath, "utf-8");
    const rawTags = extractTags(content);

    for (const raw of rawTags) {
      const slug = canonicalize(raw);
      if (!KNOWN_SLUGS.has(slug)) {
        const rel = filePath.replace(ROOT, "").replace(/\\/g, "/");
        console.warn(`WARNING: unknown tag "${raw}" (slug: "${slug}") in ${rel}`);
        unknownCount++;
      }
    }
  }
}

if (unknownCount > 0) {
  console.warn(`\n${unknownCount} unknown tag(s) found. Add them to src/app/tagsRegistry.ts if intentional.`);
} else {
  console.log("All tags are registered.");
}

// Always exit 0 — warnings only, never block the build.
process.exit(0);
