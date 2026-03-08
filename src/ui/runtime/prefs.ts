/** Centralised user-preference / capability queries — cached at module load. */

const reducedMql =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : null;

const coarseMql =
  typeof window !== "undefined"
    ? window.matchMedia("(pointer: coarse)")
    : null;

export function prefersReducedMotion(): boolean {
  return reducedMql?.matches ?? false;
}

export function isCoarsePointer(): boolean {
  return coarseMql?.matches ?? false;
}
