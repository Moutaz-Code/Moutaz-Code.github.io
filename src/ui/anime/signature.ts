import { createTimeline } from "animejs/timeline";
import { createDrawable } from "animejs/svg";
import { animate } from "animejs/animation";

export interface SignatureOptions {
  duration?: number;
  delay?: number;
  targetOpacity?: number;
}

/**
 * Initialises a signature stroke-draw animation on a single root.
 * Runs once per page load, then stops — no continuous loops.
 *
 * @param root Element with [data-signature-root]
 * @param opts Duration / delay / opacity overrides
 */
export function initSignature(
  root: HTMLElement,
  opts: SignatureOptions = {}
): void {
  const { duration = 550, delay = 80, targetOpacity = 0.6 } = opts;

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
      opacity: [0, targetOpacity],
      duration,
      ease: "outCubic",
    },
    delay
  );
}

/**
 * Animates corner spark dots — tiny accent dots that fade in, drift
 * outward, then fade out near a corner flourish. Fire-and-forget.
 *
 * @param container Element with [data-corner-spark]
 * @param startDelay ms before the first dot fires (lets corner draw begin first)
 */
export function initSpark(
  container: HTMLElement,
  startDelay = 300
): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const dots = container.querySelectorAll<HTMLElement>("[data-spark-dot]");
  if (!dots.length) return;

  // Randomised positions near the corner (offsets in px)
  const offsets = [
    { x: 6, y: 10 },
    { x: 14, y: 4 },
    { x: 10, y: 18 },
    { x: 20, y: 12 },
  ];

  dots.forEach((dot, i) => {
    const off = offsets[i % offsets.length];
    // Set initial position near the corner
    dot.style.top = `${off.y}px`;
    dot.style.left = `${off.x}px`;

    animate(dot, {
      opacity: [0, 0.7, 0],
      translateX: [0, (i % 2 === 0 ? 1 : -1) * (4 + Math.random() * 4)],
      translateY: [0, -(3 + Math.random() * 5)],
      scale: [0.5, 1, 0.3],
      duration: 400 + Math.random() * 150,
      delay: startDelay + i * 60,
      ease: "outCubic",
    });
  });
}
