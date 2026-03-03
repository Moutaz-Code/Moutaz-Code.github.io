/**
 * Coupling check: ensure `astro:content` is only imported in allowed files.
 * Run: node scripts/check-coupling.mjs
 */

import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const SRC = new URL("../src", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const ALLOWED = [
  "src/content/config.ts",
  "src/adapters/content-mdx/MdxContentSource.ts",
];

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".astro") continue;
      yield* walk(full);
    } else if (/\.(ts|astro|mjs|js|tsx|jsx)$/.test(entry.name)) {
      yield full;
    }
  }
}

let violations = 0;

for await (const filePath of walk(SRC)) {
  const rel = relative(join(SRC, ".."), filePath).replace(/\\/g, "/");
  if (ALLOWED.some((a) => rel === a)) continue;

  const rl = createInterface({ input: createReadStream(filePath) });
  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (line.includes("astro:content")) {
      console.error(`VIOLATION: ${rel}:${lineNum} — imports astro:content`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} coupling violation(s) found.`);
  process.exit(1);
} else {
  console.log("No coupling violations. Only allowed files import astro:content.");
}
