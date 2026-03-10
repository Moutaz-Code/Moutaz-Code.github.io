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
  // General / meta
  "projects", "portfolio", "case-study", "writing", "tutorial", "notes",
  // University / studies
  "university", "coursework", "studies", "assignments", "capstone",
  // Research
  "research", "experiments", "paper-review",
  // Languages
  "c", "cpp", "csharp", "java", "kotlin", "python", "rust", "go",
  "typescript", "javascript", "sql",
  // Web
  "web-development", "html", "css", "tailwind", "nodejs", "api",
  "react", "nextjs", "vue", "nuxt", "svelte", "astro", "vite", "angular",
  "animejs", "motion", "threejs",
  // .NET
  "dotnet", "aspnet", "wpf", "winui", "xaml", "entity-framework",
  // Game dev
  "game-dev", "unity", "unreal", "gameplay", "tools-dev", "technical-art", "vfx",
  // Graphics
  "graphics-programming", "shaders", "glsl", "hlsl", "shaderlab",
  "webgl", "opengl", "directx", "vulkan", "metal",
  // Rendering
  "rendering", "pbr", "npr", "ray-tracing", "global-illumination",
  "ssao", "ssr", "taa", "msaa", "fxaa", "post-processing",
  "lighting", "materials", "shadows",
  // 2D/3D
  "2d", "3d", "animation", "rigging",
  // Security
  "cybersecurity", "digital-forensics", "incident-response", "threat-modeling",
  "crypto", "network-security", "appsec", "reverse-engineering",
  // AI / ML
  "ai", "machine-learning", "deep-learning", "nlp", "computer-vision", "llm", "onnx",
  // IT
  "it", "systems", "operating-systems", "databases", "linux", "windows", "networking",
  // Tools
  "git", "github", "vercel", "docker", "ci-cd",
]);

// Map of alias → canonical slug (lowercase keys)
const KNOWN_ALIASES = new Map([
  // General
  ["case-studies", "case-study"], ["case_study", "case-study"],
  ["blog", "writing"], ["post", "writing"], ["posts", "writing"],
  ["how-to", "tutorial"], ["howto", "tutorial"], ["guide", "tutorial"],
  ["note", "notes"],
  // University
  ["uni", "university"], ["college", "university"],
  ["university-work", "coursework"], ["uni-work", "coursework"], ["classwork", "coursework"],
  ["study", "studies"], ["studying", "studies"],
  ["assignment", "assignments"],
  ["graduation-project", "capstone"], ["final-year-project", "capstone"], ["fyp", "capstone"],
  // Research
  ["r-and-d", "research"], ["rnd", "research"], ["investigation", "research"],
  ["experiment", "experiments"],
  ["paper", "paper-review"], ["papers", "paper-review"], ["literature-review", "paper-review"], ["lit-review", "paper-review"],
  // Languages
  ["c++", "cpp"], ["cplusplus", "cpp"],
  ["c#", "csharp"], ["cs", "csharp"], ["c-sharp", "csharp"],
  ["golang", "go"],
  ["ts", "typescript"], ["js", "javascript"], ["ecmascript", "javascript"],
  // Web
  ["web-dev", "web-development"], ["web", "web-development"], ["frontend", "web-development"], ["backend", "web-development"], ["fullstack", "web-development"],
  ["tailwindcss", "tailwind"],
  ["node", "nodejs"], ["node-js", "nodejs"],
  ["rest", "api"], ["rest-api", "api"], ["graphql", "api"],
  ["next", "nextjs"], ["vuejs", "vue"], ["nuxtjs", "nuxt"], ["sveltekit", "svelte"],
  ["anime-js", "animejs"],
  ["motion-dev", "motion"], ["motionone", "motion"], ["motion-one", "motion"],
  ["three", "threejs"], ["three-js", "threejs"],
  // .NET
  [".net", "dotnet"], ["dot-net", "dotnet"], ["dot_net", "dotnet"], ["net", "dotnet"],
  ["asp.net", "aspnet"], ["aspnetcore", "aspnet"], ["asp-net", "aspnet"], ["asp-net-core", "aspnet"],
  ["winui3", "winui"], ["win-ui", "winui"],
  ["ef", "entity-framework"], ["ef-core", "entity-framework"], ["entityframework", "entity-framework"], ["entity-framework-core", "entity-framework"],
  // Game dev
  ["gamedev", "game-dev"], ["game-development", "game-dev"],
  ["unity3d", "unity"],
  ["ue", "unreal"], ["ue5", "unreal"], ["unreal-engine", "unreal"],
  ["tooling", "tools-dev"],
  ["tech-art", "technical-art"],
  ["visual-effects", "vfx"],
  // Graphics
  ["graphics", "graphics-programming"], ["gpu", "graphics-programming"], ["rendering-code", "graphics-programming"],
  ["shader", "shaders"], ["shader-programming", "shaders"],
  ["unity-shaderlab", "shaderlab"],
  ["web-gl", "webgl"], ["gl", "opengl"],
  ["dx", "directx"], ["d3d", "directx"], ["direct3d", "directx"],
  // Rendering
  ["physically-based-rendering", "pbr"], ["physically-based", "pbr"],
  ["non-photorealistic-rendering", "npr"], ["toon", "npr"], ["cel-shading", "npr"], ["celshading", "npr"],
  ["raytracing", "ray-tracing"], ["rtx", "ray-tracing"],
  ["gi", "global-illumination"],
  ["screen-space-reflections", "ssr"],
  ["temporal-aa", "taa"],
  ["postprocess", "post-processing"], ["postfx", "post-processing"],
  // 2D/3D
  ["2d-rendering", "2d"], ["2d-animation", "2d"],
  ["3d-rendering", "3d"], ["3d-animation", "3d"],
  ["anim", "animation"],
  // Security
  ["cyber-security", "cybersecurity"], ["infosec", "cybersecurity"], ["info-sec", "cybersecurity"], ["information-security", "cybersecurity"],
  ["forensics", "digital-forensics"],
  ["ir", "incident-response"],
  ["cryptography", "crypto"],
  ["application-security", "appsec"],
  ["reversing", "reverse-engineering"],
  // AI
  ["artificial-intelligence", "ai"],
  ["ml", "machine-learning"],
  ["dl", "deep-learning"],
  ["natural-language-processing", "nlp"],
  ["cv", "computer-vision"],
  ["large-language-models", "llm"], ["large-language-model", "llm"],
  // IT
  ["information-technology", "it"],
  ["systems-programming", "systems"],
  ["os", "operating-systems"],
  ["database", "databases"],
  // Tools
  ["cicd", "ci-cd"], ["ci", "ci-cd"], ["cd", "ci-cd"],
]);

// Also add label → slug mappings (lowercase labels)
const LABEL_TO_SLUG = new Map([
  ["projects", "projects"], ["portfolio", "portfolio"], ["case study", "case-study"],
  ["writing", "writing"], ["tutorial", "tutorial"], ["notes", "notes"],
  ["university", "university"], ["coursework", "coursework"], ["studies", "studies"],
  ["assignments", "assignments"], ["capstone", "capstone"],
  ["research", "research"], ["experiments", "experiments"], ["paper review", "paper-review"],
  ["c", "c"], ["c++", "cpp"], ["c#", "csharp"], ["java", "java"], ["kotlin", "kotlin"],
  ["python", "python"], ["rust", "rust"], ["go", "go"],
  ["typescript", "typescript"], ["javascript", "javascript"], ["sql", "sql"],
  ["web development", "web-development"], ["html", "html"], ["css", "css"],
  ["tailwind css", "tailwind"], ["node.js", "nodejs"], ["apis", "api"],
  ["react", "react"], ["next.js", "nextjs"], ["vue", "vue"], ["nuxt", "nuxt"],
  ["svelte", "svelte"], ["astro", "astro"], ["vite", "vite"], ["angular", "angular"],
  ["anime.js", "animejs"], ["motion", "motion"], ["three.js", "threejs"],
  [".net", "dotnet"], ["asp.net", "aspnet"], ["wpf", "wpf"], ["winui", "winui"],
  ["xaml", "xaml"], ["entity framework", "entity-framework"],
  ["game dev", "game-dev"], ["unity", "unity"], ["unreal engine", "unreal"],
  ["gameplay", "gameplay"], ["tools dev", "tools-dev"], ["technical art", "technical-art"],
  ["vfx", "vfx"],
  ["graphics programming", "graphics-programming"], ["shaders", "shaders"],
  ["glsl", "glsl"], ["hlsl", "hlsl"], ["shaderlab", "shaderlab"],
  ["webgl", "webgl"], ["opengl", "opengl"], ["directx", "directx"],
  ["vulkan", "vulkan"], ["metal", "metal"],
  ["rendering", "rendering"], ["pbr", "pbr"], ["npr", "npr"],
  ["ray tracing", "ray-tracing"], ["global illumination", "global-illumination"],
  ["ssao", "ssao"], ["ssr", "ssr"], ["taa", "taa"], ["msaa", "msaa"], ["fxaa", "fxaa"],
  ["post processing", "post-processing"], ["lighting", "lighting"],
  ["materials", "materials"], ["shadows", "shadows"],
  ["2d", "2d"], ["3d", "3d"], ["animation", "animation"], ["rigging", "rigging"],
  ["cybersecurity", "cybersecurity"], ["digital forensics", "digital-forensics"],
  ["incident response", "incident-response"], ["threat modeling", "threat-modeling"],
  ["cryptography", "crypto"], ["network security", "network-security"],
  ["appsec", "appsec"], ["reverse engineering", "reverse-engineering"],
  ["ai", "ai"], ["machine learning", "machine-learning"], ["deep learning", "deep-learning"],
  ["nlp", "nlp"], ["computer vision", "computer-vision"], ["llms", "llm"], ["onnx", "onnx"],
  ["it", "it"], ["systems", "systems"], ["operating systems", "operating-systems"],
  ["databases", "databases"], ["linux", "linux"], ["windows", "windows"], ["networking", "networking"],
  ["git", "git"], ["github", "github"], ["vercel", "vercel"], ["docker", "docker"],
  ["ci/cd", "ci-cd"],
]);

function slugify(input) {
  return input.toLowerCase().trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function canonicalize(raw) {
  const lower = raw.toLowerCase().trim();
  // Try raw lowercase first (catches "C#", ".NET", "C++", etc.)
  const fromLabel = LABEL_TO_SLUG.get(lower) ?? KNOWN_ALIASES.get(lower);
  if (fromLabel) return fromLabel;
  // Fall back to slugified form
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
