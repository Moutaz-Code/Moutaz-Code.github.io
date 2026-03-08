/**
 * Performance rules check: ensure heavy modules are only imported in allowed locations.
 * Run: node scripts/check-perf-rules.mjs
 */

import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const SRC = new URL("../src", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");

// ── Rules ────────────────────────────────────────────────────
// Each rule: { pattern, allowed, label }
// `pattern` is tested against each line of code.
// `allowed` is a list of relative file path prefixes where the import IS allowed.
const rules = [
  {
    label: "animejs",
    pattern: /from\s+["']animejs/,
    allowed: [
      "src/ui/anime/",
    ],
  },
  {
    label: "constellation module",
    pattern: /["'].*\/constellation["']/,
    allowed: [
      "src/ui/components/home/",
      "src/ui/motion/constellation.ts",
    ],
  },
  {
    label: "lenis",
    pattern: /from\s+["']lenis["']/,
    allowed: [
      "src/ui/scroll/",
    ],
  },
];

// ── File walker ──────────────────────────────────────────────

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".astro" || entry.name === "dist") continue;
      yield* walk(full);
    } else if (/\.(ts|astro|mjs|js|tsx|jsx)$/.test(entry.name)) {
      yield full;
    }
  }
}

// ── Check ────────────────────────────────────────────────────

let violations = 0;

for await (const filePath of walk(SRC)) {
  const rel = relative(join(SRC, ".."), filePath).replace(/\\/g, "/");

  const rl = createInterface({ input: createReadStream(filePath) });
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;

    for (const rule of rules) {
      if (!rule.pattern.test(line)) continue;

      // Check if this file is in an allowed path
      const isAllowed = rule.allowed.some((prefix) => rel.startsWith(prefix) || rel === prefix);
      if (isAllowed) continue;

      console.error(`VIOLATION [${rule.label}]: ${rel}:${lineNum}`);
      console.error(`  ${line.trim()}`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} performance rule violation(s) found.`);
  process.exit(1);
} else {
  console.log("No performance rule violations. Heavy modules are properly scoped.");
}
