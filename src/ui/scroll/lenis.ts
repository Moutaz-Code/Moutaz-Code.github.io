import Lenis from "lenis";

let lenis: Lenis | null = null;

const reduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initLenis(): void {
  if (reduced) return;

  lenis = new Lenis({
    lerp: 0.08,
    wheelMultiplier: 1,
    smoothWheel: true,
  });

  function raf(time: number) {
    lenis!.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

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
