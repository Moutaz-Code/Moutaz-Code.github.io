/** Sound-effect persistence + Web Audio synthesis — pure logic, no UI. */

export type SoundChoice = "on" | "off";
const STORAGE_KEY = "sound";

// ── Persistence ──────────────────────────────────────

/** Read the stored sound preference, defaulting to "on". */
export function getStoredSound(): SoundChoice {
  if (typeof localStorage === "undefined") return "on";
  return (localStorage.getItem(STORAGE_KEY) as SoundChoice) ?? "on";
}

/** Persist a sound preference. */
export function setStoredSound(choice: SoundChoice): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, choice);
}

/** Whether sound is currently enabled. */
export function isEnabled(): boolean {
  return getStoredSound() === "on";
}

/** Toggle sound on ↔ off. Returns the new state. */
export function toggleSound(): SoundChoice {
  const next: SoundChoice = isEnabled() ? "off" : "on";
  setStoredSound(next);
  return next;
}

// ── Web Audio synthesis ──────────────────────────────

let ctx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!ctx || ctx.state === "closed") ctx = new AudioContext();
  return ctx;
}

const sounds = {
  toggle(ac: AudioContext) {
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.06);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  },

  click(ac: AudioContext) {
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, now);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  },
} as const;

/** Play a named micro-sound if sound is enabled. Lazy-inits AudioContext. */
export function play(name: keyof typeof sounds): void {
  if (!isEnabled()) return;
  const ac = getContext();
  ac.resume().then(() => sounds[name](ac));
}
