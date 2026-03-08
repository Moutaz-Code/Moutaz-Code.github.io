/** Centralised user-preference / capability queries — cached at module load. */

const reducedMql =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

const coarseMql =
  typeof window !== "undefined"
    ? window.matchMedia("(pointer: coarse)")
    : null;

/** True when the user has requested reduced motion. */
export function prefersReducedMotion(): boolean {
  return reducedMql?.matches ?? false;
}

/** True on touch-primary devices (phones, tablets). */
export function isCoarsePointer(): boolean {
  return coarseMql?.matches ?? false;
}
