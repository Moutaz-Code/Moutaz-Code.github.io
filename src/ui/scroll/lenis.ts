import Lenis from "lenis";
import { prefersReducedMotion } from "../runtime/prefs";

let lenis: Lenis | null = null;
let rafId: number | null = null;
let running = false;

function startLoop() {
  if (!running && lenis) {
    running = true;
    rafId = requestAnimationFrame(raf);
  }
}

function stopLoop() {
  if (running) {
    running = false;
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
}

function raf(time: number) {
  lenis!.raf(time);
  rafId = requestAnimationFrame(raf);
}

export function initLenis(): void {
  if (prefersReducedMotion()) return;

  lenis = new Lenis({
    lerp: 0.08,
    wheelMultiplier: 1,
    smoothWheel: true,
  });

  startLoop();

  // Pause RAF when tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopLoop();
    } else {
      startLoop();
    }
  });

  // Intercept anchor-link clicks so Lenis handles the scroll
  document.addEventListener("click", (e) => {
    const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='#']");
    if (!anchor) return;

    const hash = anchor.getAttribute("href")!;
    const target = document.querySelector(hash);
    if (!target) return;

    e.preventDefault();

    // Account for a potential sticky header
    const header = document.querySelector("header");
    const offset = header ? -(header.getBoundingClientRect().height + 16) : 0;

    lenis!.scrollTo(target as HTMLElement, { offset });

    // Update URL hash without native jump
    history.pushState(null, "", hash);
  });
}

export function destroyLenis(): void {
  stopLoop();
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
}

export function scrollTo(
  target: string | HTMLElement,
  options?: { offset?: number },
): void {
  lenis?.scrollTo(target, options);
}
