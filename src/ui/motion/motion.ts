import { animate, inView } from "motion";

// ── Tokens ──────────────────────────────────────────────

const DURATION = { fast: 0.18, base: 0.28, slow: 0.45 } as const;
const EASE = [0.22, 1, 0.36, 1] as const; // cubic-bezier — smooth deceleration
const REVEAL_Y = 14; // px
const STAGGER_GAP = 0.055; // s between siblings

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── Reveals ─────────────────────────────────────────────

export function initReveals(root: ParentNode = document) {
  if (reduced) {
    // Show everything immediately
    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      el.style.opacity = "1";
    });
    return;
  }

  const elements = root.querySelectorAll<HTMLElement>("[data-reveal]");

  elements.forEach((el) => {
    // Start hidden
    el.style.opacity = "0";

    const shouldStagger = el.dataset.revealStagger === "children";
    const delayMs = parseInt(el.dataset.revealDelay ?? "0", 10);
    const baseDelay = delayMs / 1000;

    inView(el, () => {
      if (shouldStagger) {
        const children = Array.from(el.children) as HTMLElement[];
        children.forEach((child, i) => {
          child.style.opacity = "0";
          animate(
            child,
            { opacity: [0, 1], y: [REVEAL_Y, 0] },
            { duration: DURATION.base, ease: EASE, delay: baseDelay + i * STAGGER_GAP },
          );
        });
        // Reveal the container itself immediately
        animate(el, { opacity: [0, 1] }, { duration: 0.01 });
      } else {
        animate(
          el,
          { opacity: [0, 1], y: [REVEAL_Y, 0] },
          { duration: DURATION.base, ease: EASE, delay: baseDelay },
        );
      }
    }, { amount: 0.15 });
  });
}

// ── Hover micro-interactions ────────────────────────────

export function initHovers(root: ParentNode = document) {
  if (reduced) return;

  const elements = root.querySelectorAll<HTMLElement>("[data-hover='lift']");

  elements.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      animate(el, { y: -3 }, { duration: DURATION.fast, ease: EASE });
    });
    el.addEventListener("mouseleave", () => {
      animate(el, { y: 0 }, { duration: DURATION.fast, ease: EASE });
    });
  });
}

// ── Accent (one per page) ───────────────────────────────

export function initAccent(root: ParentNode = document) {
  if (reduced) return;

  const el = root.querySelector<HTMLElement>("[data-accent]");
  if (!el) return;

  const type = el.dataset.accent ?? "pop";

  switch (type) {
    case "pop":
      animate(
        el,
        { scale: [1, 1.06, 1] },
        { duration: DURATION.slow, ease: EASE, delay: 0.4 },
      );
      break;

    case "glow":
      animate(
        el,
        { boxShadow: ["0 0 0 0 rgba(99,102,241,0)", "0 0 12px 4px rgba(99,102,241,0.3)", "0 0 0 0 rgba(99,102,241,0)"] },
        { duration: 0.9, ease: EASE, delay: 0.5 },
      );
      break;

    case "wiggle":
      animate(
        el,
        { rotate: [0, -2, 2, -1, 0] },
        { duration: 0.5, ease: EASE, delay: 0.6 },
      );
      break;
  }
}
