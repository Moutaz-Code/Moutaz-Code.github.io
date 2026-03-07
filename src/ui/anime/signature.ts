import { createTimeline } from "animejs/timeline";
import { createDrawable } from "animejs/svg";

export interface SignatureOptions {
  duration?: number;
  delay?: number;
}

/**
 * Initialises a page-header signature underline animation.
 * Runs once per page load, then stops — no continuous loops.
 *
 * @param root Element with [data-signature-root]
 * @param opts Duration / delay overrides
 */
export function initSignature(
  root: HTMLElement,
  opts: SignatureOptions = {}
): void {
  const { duration = 550, delay = 80 } = opts;

  // ── Guard: reduced motion ──────────────────────────
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // ── Resolve DOM targets ────────────────────────────
  const svg = root.querySelector<SVGSVGElement>("[data-signature-svg]");
  const pathEl = root.querySelector<SVGPathElement>("[data-signature-path]");

  if (!svg || !pathEl) return;

  // Mark SVG as ready so CSS hides the stroke before animation
  svg.setAttribute("data-ready", "");

  // ── Prepare drawable for stroke animation ──────────
  const drawables = createDrawable(pathEl);
  if (!drawables.length) return;
  const drawable = drawables[0];

  // ── Build timeline ─────────────────────────────────
  createTimeline({
    autoplay: true,
    defaults: { ease: "inOutSine" },
  }).add(
    drawable,
    {
      draw: ["0 0", "0 1"],
      opacity: [0, 0.6],
      duration,
      ease: "inOutSine",
    },
    delay
  );
}
