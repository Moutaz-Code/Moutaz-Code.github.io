# Performance Audit

## Lighthouse Baseline

> Run `npx lighthouse <url> --output=json` or use Chrome DevTools Lighthouse tab.

| Page | Perf Score | LCP | TBT | CLS |
|------|-----------|-----|-----|-----|
| `/` (home) | — | — | — | — |
| `/projects` | — | — | — | — |
| `/projects/<slug>` | — | — | — | — |

## RAF Audit

All continuous RAF loops pause on `visibilitychange` (tab hidden/visible).

| System | File | Continuous? | Pauses on hidden tab | Offscreen pause | Lazy init |
|--------|------|-------------|---------------------|-----------------|-----------|
| Cursor | `CursorInit.astro` | Yes | Yes | N/A (global) | First pointermove |
| Ambient | `AmbientInit.astro` | Yes | Yes | N/A (fixed bg) | Immediate |
| Lenis | `lenis.ts` | Yes | Yes | N/A (global) | Immediate |
| Constellation | `ConstellationInit.astro` | Yes | Yes | IntersectionObserver | Dynamic import |
| Magnetic | `magnetic.ts` | On hover | Self-stopping | N/A | Hover event |
| Motion.js | `motion.ts` | No | N/A | inView() | N/A |
| Anime.js | `heroSignature.ts` / `signature.ts` | No | N/A | One-shot | Dynamic import |

## Import Discipline

Enforced via `npm run check:perf`:

- `animejs` imports only in `src/ui/anime/`
- `constellation` module only in `src/ui/components/home/` and `src/ui/motion/`
- `lenis` import only in `src/ui/scroll/`

## Preference Centralisation

All motion/pointer checks use `src/ui/runtime/prefs.ts`:
- `prefersReducedMotion()` — cached media query
- `isCoarsePointer()` — cached media query

## LCP Status

- Homepage: LCP = hero text (no image). Fast.
- Detail pages: Hero images use `loading="eager"` + `fetchpriority="high"`.

## CLS Status

- All overlays use `position:fixed` (cursor, ambient)
- Cards use `aspect-video` wrappers
- Theme/sound toggles use `position:absolute` icons (no layout shift)
- Page transitions only animate opacity
