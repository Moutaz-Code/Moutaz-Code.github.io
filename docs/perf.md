# Performance Audit

## RAF Loop Audit

| Module | Type | Visibility Pause | Offscreen Pause | Lazy Init |
|---|---|---|---|---|
| Cursor (`CursorInit.astro`) | Continuous lerp | visibilitychange | N/A (fixed overlay) | First pointermove |
| Ambient (`AmbientInit.astro`) | Continuous drift | visibilitychange | N/A (fixed overlay) | Immediate |
| Lenis (`lenis.ts`) | Continuous smooth scroll | visibilitychange | N/A (global scroll) | On initLenis() |
| Constellation (`constellation.ts`) | Continuous drift | visibilitychange | IntersectionObserver | On init |
| Magnetic (`magnetic.ts`) | On-demand (hover) | Auto-stops when settled | N/A | On pointerenter |
| Motion.js (`motion.ts`) | Fire-and-forget | N/A | inView() | N/A |
| Anime.js (`signature.ts`, `heroSignature.ts`) | Fire-and-forget timelines | N/A | N/A | Dynamic import |

## Reduced Motion

All motion modules import from `src/ui/runtime/prefs.ts` which caches `matchMedia("(prefers-reduced-motion: reduce)")` at module load time.

**Exception:** `PageTransitionInit.astro` uses its own inline check (event-based, no RAF, no perf concern).

## Import Discipline

Enforced by `scripts/check-perf-rules.mjs` (run via `npm run check:perf`):

- `animejs/*` imports restricted to `src/ui/anime/`
- `constellation` module restricted to `src/ui/components/home/` and `src/ui/motion/`
- `lenis` import restricted to `src/ui/scroll/` and `SmoothScrollInit.astro`

## LCP / CLS

- **LCP**: Homepage = hero text (fast). Detail pages use `ResponsiveImage` with `loading="eager"` + `fetchpriority="high"`.
- **CLS**: All overlays use `position: fixed`. Cards have aspect-ratio wrappers. No dynamic injection above fold.

## Lighthouse Baseline

| Metric | Score |
|---|---|
| Performance | _TBD_ |
| Accessibility | _TBD_ |
| Best Practices | _TBD_ |
| SEO | _TBD_ |
