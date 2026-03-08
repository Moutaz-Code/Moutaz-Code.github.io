/**
 * Magnetic hover — subtle magnetic pull effect on elements.
 * On pointermove the element translates slightly toward the cursor.
 * On pointerleave it lerps back to center. Uses RAF only while active.
 */

import { prefersReducedMotion } from "../runtime/prefs";

const MAX_OFFSET = 6; // px — maximum translation
const LERP_SPEED = 0.15; // smoothing factor (0–1, lower = smoother)
const RETURN_SPEED = 0.1; // lerp speed when returning to center

export function initMagnetic(el: HTMLElement): () => void {
  if (prefersReducedMotion()) {
    return () => {};
  }

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId: number | null = null;
  let isHovered = false;

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  function tick() {
    const speed = isHovered ? LERP_SPEED : RETURN_SPEED;
    currentX = lerp(currentX, targetX, speed);
    currentY = lerp(currentY, targetY, speed);

    // Stop RAF when close enough to target
    if (Math.abs(currentX - targetX) < 0.1 && Math.abs(currentY - targetY) < 0.1) {
      currentX = targetX;
      currentY = targetY;
      el.style.transform = currentX === 0 && currentY === 0
        ? ""
        : `translate(${currentX}px, ${currentY}px)`;
      rafId = null;
      return;
    }

    el.style.transform = `translate(${currentX}px, ${currentY}px)`;
    rafId = requestAnimationFrame(tick);
  }

  function startRAF() {
    if (rafId === null) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function onPointerMove(e: PointerEvent) {
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    // Normalise offset relative to element size, clamped to MAX_OFFSET
    targetX = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dx * 0.3));
    targetY = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dy * 0.3));

    startRAF();
  }

  function onPointerEnter() {
    isHovered = true;
  }

  function onPointerLeave() {
    isHovered = false;
    targetX = 0;
    targetY = 0;
    startRAF();
  }

  el.addEventListener("pointerenter", onPointerEnter);
  el.addEventListener("pointermove", onPointerMove);
  el.addEventListener("pointerleave", onPointerLeave);

  // Return cleanup function
  return () => {
    el.removeEventListener("pointerenter", onPointerEnter);
    el.removeEventListener("pointermove", onPointerMove);
    el.removeEventListener("pointerleave", onPointerLeave);
    if (rafId !== null) cancelAnimationFrame(rafId);
    el.style.transform = "";
  };
}
