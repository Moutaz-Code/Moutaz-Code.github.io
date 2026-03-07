import { createTimeline } from "animejs/timeline";
import { createDrawable } from "animejs/svg";

/**
 * Initialises the hero signature animation timeline.
 * Runs once, then stops — no continuous loops.
 *
 * @param root The element with [data-hero-signature-root]
 */
export function initHeroSignature(root: HTMLElement): void {
  // ── Guard: reduced motion ──────────────────────────
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // ── Guard: already ran this session ────────────────
  const SESSION_KEY = "heroSignatureRan";
  if (sessionStorage.getItem(SESSION_KEY) === "1") return;

  // ── Resolve DOM targets ────────────────────────────
  const svg = root.querySelector<SVGSVGElement>("[data-hero-signature-svg]");
  const pathEl = root.querySelector<SVGPathElement>(
    "[data-hero-signature-path]"
  );
  const bloom = root.querySelector<HTMLElement>("[data-hero-bloom]");

  if (!svg || !pathEl) return;

  // Mark SVG as ready so CSS hides the stroke before animation
  svg.setAttribute("data-ready", "");

  // ── Prepare drawable for stroke animation ──────────
  const drawables = createDrawable(pathEl);
  if (!drawables.length) return;
  const drawable = drawables[0];

  // ── Build timeline ─────────────────────────────────
  const tl = createTimeline({
    autoplay: true,
    defaults: { ease: "inOutSine" },
  });

  // Part A — Signature stroke draw (900ms, starts 150ms in)
  tl.add(
    drawable,
    {
      draw: ["0 0", "0 1"],
      opacity: [0, 0.6],
      duration: 900,
      ease: "inOutSine",
    },
    150
  );

  // Part B — Bloom expand (starts 600ms into timeline)
  if (bloom) {
    tl.add(
      bloom,
      {
        opacity: [0, 0.18, 0.08],
        scale: [0.92, 1.05, 1.0],
        duration: 700,
        ease: "outCubic",
      },
      600
    );
  }

  // Mark session so it doesn't replay on SPA navigation
  tl.then(() => {
    sessionStorage.setItem(SESSION_KEY, "1");
  });
}
