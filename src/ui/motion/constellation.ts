// ── Project Constellation — client-side animation ───
// Gentle sin/cos drift + pointer repulsion for constellation nodes.
// Dynamic curved lines follow nodes with subtle wave.
// Respects prefers-reduced-motion and coarse pointer (touch).
// Exposes start()/stop() on root element for IntersectionObserver control.

import { prefersReducedMotion, isCoarsePointer } from "../runtime/prefs";

interface ConstellationNodeData {
  slug: string;
  baseX: number;
  baseY: number;
  phase: number;
  freqX: number;
  freqY: number;
}

interface ConstellationLineData {
  from: string;
  to: string;
  phase: number;
}

interface ConstellationData {
  nodes: ConstellationNodeData[];
  lines: ConstellationLineData[];
}

interface NodeState {
  el: HTMLAnchorElement;
  data: ConstellationNodeData;
  currentOffsetX: number;
  currentOffsetY: number;
  targetPointerX: number;
  targetPointerY: number;
}

interface LineState {
  pathEl: SVGPathElement;
  fromState: NodeState;
  toState: NodeState;
  phase: number;
}

const DRIFT_AMP = 10;
const POINTER_MAX = 12;
const POINTER_RADIUS = 250;
const POINTER_LERP = 0.08;
const WAVE_AMP = 32;
const WAVE_FREQ = 0.8;

const SVG_NS = "http://www.w3.org/2000/svg";

export function initConstellation(root: HTMLElement): () => void {
  const reduced = prefersReducedMotion();
  const isCoarse = isCoarsePointer();

  // Read data from embedded JSON
  const dataScript = root.querySelector<HTMLScriptElement>(
    "[data-constellation-data]",
  );
  if (!dataScript) return () => {};

  const parsed: ConstellationData = JSON.parse(
    dataScript.textContent ?? '{"nodes":[],"lines":[]}',
  );

  // Map DOM nodes to state objects
  const nodeEls = root.querySelectorAll<HTMLAnchorElement>(
    "[data-constellation-node]",
  );
  const states: NodeState[] = [];

  nodeEls.forEach((el) => {
    const slug = el.dataset.slug;
    const data = parsed.nodes.find((d) => d.slug === slug);
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

  // ── Build dynamic line paths ───────────────────────────
  const svg = root.querySelector<SVGSVGElement>(".constellation-lines");
  const staticLines = svg
    ? Array.from(svg.querySelectorAll<SVGLineElement>("line"))
    : [];
  const lineStates: LineState[] = [];

  if (svg) {
    // Hide static fallback lines
    staticLines.forEach((l) => (l.style.display = "none"));

    // Create animated <path> elements
    const stateBySlug = new Map<string, NodeState>();
    states.forEach((s) => stateBySlug.set(s.data.slug, s));

    for (const lineData of parsed.lines) {
      const fromState = stateBySlug.get(lineData.from);
      const toState = stateBySlug.get(lineData.to);
      if (!fromState || !toState) continue;

      const pathEl = document.createElementNS(SVG_NS, "path");
      pathEl.classList.add("constellation-line");
      svg.appendChild(pathEl);

      lineStates.push({
        pathEl,
        fromState,
        toState,
        phase: lineData.phase,
      });
    }
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
    const rootW = rootRect.width;
    const rootH = rootRect.height;

    for (const state of states) {
      const { data, el } = state;

      // Sin/cos drift
      const driftX = Math.sin(elapsed * data.freqX + data.phase) * DRIFT_AMP;
      const driftY =
        Math.cos(elapsed * data.freqY + data.phase * 1.3) * DRIFT_AMP;

      // Pointer repulsion
      const nodeCenterX = (data.baseX / 100) * rootW;
      const nodeCenterY = (data.baseY / 100) * rootH;

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

    // ── Update line paths ───────────────────────────────
    for (const line of lineStates) {
      // Compute animated endpoint positions in pixels
      const x1 =
        (line.fromState.data.baseX / 100) * rootW +
        line.fromState.currentOffsetX;
      const y1 =
        (line.fromState.data.baseY / 100) * rootH +
        line.fromState.currentOffsetY;
      const x2 =
        (line.toState.data.baseX / 100) * rootW +
        line.toState.currentOffsetX;
      const y2 =
        (line.toState.data.baseY / 100) * rootH +
        line.toState.currentOffsetY;

      // Midpoint
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;

      // Perpendicular direction for wave
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);

      if (len > 0) {
        const perpX = -dy / len;
        const perpY = dx / len;
        const wave = Math.sin(elapsed * WAVE_FREQ + line.phase) * WAVE_AMP;
        const cx = mx + perpX * wave;
        const cy = my + perpY * wave;
        line.pathEl.setAttribute(
          "d",
          `M${x1.toFixed(1)},${y1.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`,
        );
      } else {
        line.pathEl.setAttribute(
          "d",
          `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`,
        );
      }
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
    // Remove dynamic paths, restore static lines
    lineStates.forEach((l) => l.pathEl.remove());
    staticLines.forEach((l) => (l.style.display = ""));
    delete (root as any).__constellation;
  };
}
