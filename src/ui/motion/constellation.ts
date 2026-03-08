// ── Project Constellation — client-side animation ───
// Gentle sin/cos drift + pointer repulsion for constellation nodes.
// Respects prefers-reduced-motion and coarse pointer (touch).
// Exposes start()/stop() on root element for IntersectionObserver control.

interface ConstellationNodeData {
  slug: string;
  baseX: number;
  baseY: number;
  phase: number;
  freqX: number;
  freqY: number;
}

interface NodeState {
  el: HTMLAnchorElement;
  data: ConstellationNodeData;
  currentOffsetX: number;
  currentOffsetY: number;
  targetPointerX: number;
  targetPointerY: number;
}

const DRIFT_AMP = 10;
const POINTER_MAX = 12;
const POINTER_RADIUS = 250;
const POINTER_LERP = 0.08;

export function initConstellation(root: HTMLElement): () => void {
  const reduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;

  // Read node data from embedded JSON
  const dataScript = root.querySelector<HTMLScriptElement>(
    "[data-constellation-data]",
  );
  if (!dataScript) return () => {};

  const nodesData: ConstellationNodeData[] = JSON.parse(
    dataScript.textContent ?? "[]",
  );

  // Map DOM nodes to state objects
  const nodeEls = root.querySelectorAll<HTMLAnchorElement>(
    "[data-constellation-node]",
  );
  const states: NodeState[] = [];

  nodeEls.forEach((el) => {
    const slug = el.dataset.slug;
    const data = nodesData.find((d) => d.slug === slug);
    if (!data) return;
    states.push({
      el,
      data,
      currentOffsetX: 0,
      currentOffsetY: 0,
      targetPointerX: 0,
      targetPointerY: 0,
    });
  });

  // ── Card highlight on hover ──────────────────────────
  function onNodeEnter(e: Event) {
    const slug = (e.currentTarget as HTMLElement).dataset.slug;
    if (!slug) return;
    const card = document.querySelector<HTMLElement>(
      `[data-project-slug="${slug}"]`,
    );
    if (card) card.classList.add("constellation-highlight");
  }

  function onNodeLeave(e: Event) {
    const slug = (e.currentTarget as HTMLElement).dataset.slug;
    if (!slug) return;
    const card = document.querySelector<HTMLElement>(
      `[data-project-slug="${slug}"]`,
    );
    if (card) card.classList.remove("constellation-highlight");
  }

  states.forEach((s) => {
    s.el.addEventListener("pointerenter", onNodeEnter);
    s.el.addEventListener("pointerleave", onNodeLeave);
  });

  // If reduced motion or touch, skip animation (static layout works)
  if (reduced || isCoarse) {
    return () => {
      states.forEach((s) => {
        s.el.removeEventListener("pointerenter", onNodeEnter);
        s.el.removeEventListener("pointerleave", onNodeLeave);
      });
    };
  }

  // ── Pointer tracking ─────────────────────────────────
  let pointerX = -9999;
  let pointerY = -9999;

  function onPointerMove(e: PointerEvent) {
    const rect = root.getBoundingClientRect();
    pointerX = e.clientX - rect.left;
    pointerY = e.clientY - rect.top;
  }

  function onPointerLeave() {
    pointerX = -9999;
    pointerY = -9999;
    for (const state of states) {
      state.targetPointerX = 0;
      state.targetPointerY = 0;
    }
  }

  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerleave", onPointerLeave);

  // ── Animation loop ───────────────────────────────────
  let rafId: number | null = null;
  let startTime: number | null = null;

  function tick(timestamp: number) {
    if (startTime === null) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;

    const rootRect = root.getBoundingClientRect();

    for (const state of states) {
      const { data, el } = state;

      // Sin/cos drift
      const driftX = Math.sin(elapsed * data.freqX + data.phase) * DRIFT_AMP;
      const driftY =
        Math.cos(elapsed * data.freqY + data.phase * 1.3) * DRIFT_AMP;

      // Pointer repulsion
      const nodeCenterX = (data.baseX / 100) * rootRect.width;
      const nodeCenterY = (data.baseY / 100) * rootRect.height;

      if (pointerX > -9000) {
        const dx = pointerX - nodeCenterX;
        const dy = pointerY - nodeCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < POINTER_RADIUS && dist > 0) {
          const strength = 1 - dist / POINTER_RADIUS;
          state.targetPointerX = -(dx / dist) * POINTER_MAX * strength;
          state.targetPointerY = -(dy / dist) * POINTER_MAX * strength;
        } else {
          state.targetPointerX = 0;
          state.targetPointerY = 0;
        }
      }

      // Lerp toward target offset
      state.currentOffsetX +=
        (driftX + state.targetPointerX - state.currentOffsetX) * POINTER_LERP;
      state.currentOffsetY +=
        (driftY + state.targetPointerY - state.currentOffsetY) * POINTER_LERP;

      el.style.transform = `translate3d(calc(-50% + ${state.currentOffsetX.toFixed(1)}px), calc(-50% + ${state.currentOffsetY.toFixed(1)}px), 0)`;
    }

    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (rafId !== null) return;
    startTime = null;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // Expose start/stop for IntersectionObserver in ConstellationInit
  (root as any).__constellation = { start, stop };

  return () => {
    stop();
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", onPointerLeave);
    states.forEach((s) => {
      s.el.removeEventListener("pointerenter", onNodeEnter);
      s.el.removeEventListener("pointerleave", onNodeLeave);
    });
    delete (root as any).__constellation;
  };
}
