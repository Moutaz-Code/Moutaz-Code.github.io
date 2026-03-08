export type TagDef = {
  slug: string;
  label: string;
  aliases?: string[];
};

export const TAGS: TagDef[] = [
  // Web
  { slug: "astro", label: "Astro" },
  { slug: "tailwind", label: "Tailwind CSS", aliases: ["tailwindcss", "tailwind-css"] },
  { slug: "typescript", label: "TypeScript", aliases: ["ts"] },
  { slug: "javascript", label: "JavaScript", aliases: ["js"] },
  { slug: "react", label: "React", aliases: ["reactjs"] },
  { slug: "nextjs", label: "Next.js", aliases: ["next"] },
  { slug: "node", label: "Node.js", aliases: ["nodejs"] },
  { slug: "mdx", label: "MDX" },
  // .NET
  { slug: "dotnet", label: ".NET", aliases: ["dot-net", "net"] },
  { slug: "csharp", label: "C#", aliases: ["c-sharp", "cs"] },
  { slug: "wpf", label: "WPF" },
  // Game / Graphics
  { slug: "unity", label: "Unity", aliases: ["unity3d"] },
  { slug: "shader", label: "Shader", aliases: ["shaders"] },
  { slug: "webgl", label: "WebGL" },
  { slug: "opengl", label: "OpenGL" },
  { slug: "threejs", label: "Three.js", aliases: ["three"] },
  { slug: "stylized-rendering", label: "Stylized Rendering" },
  // Infra / Tools
  { slug: "vercel", label: "Vercel" },
  { slug: "github", label: "GitHub" },
  { slug: "docker", label: "Docker" },
  { slug: "git", label: "Git" },
  // Domain
  { slug: "forensics", label: "Forensics" },
  { slug: "security", label: "Security" },
  { slug: "ai", label: "AI", aliases: ["artificial-intelligence", "machine-learning", "ml"] },
  // General
  { slug: "case-study", label: "Case Study" },
  { slug: "bezier-curves", label: "Bezier Curves" },
];

/** Lookup a tag definition by its canonical slug. */
export const TAG_BY_SLUG: Map<string, TagDef> = new Map(
  TAGS.map((t) => [t.slug, t]),
);

/** Resolve an alias slug to its canonical slug. */
export const ALIAS_TO_SLUG: Map<string, string> = new Map(
  TAGS.flatMap((t) => (t.aliases ?? []).map((a) => [a, t.slug])),
);
