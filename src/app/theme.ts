/** Theme persistence — pure logic, no UI. */

export type ThemeChoice = "light" | "dark" | "system";
const STORAGE_KEY = "theme";
const DARK_CLASS = "theme-dark";

/** Read the stored preference, defaulting to "system". */
export function getStoredTheme(): ThemeChoice {
  if (typeof localStorage === "undefined") return "system";
  return (localStorage.getItem(STORAGE_KEY) as ThemeChoice) ?? "system";
}

/** Persist a theme choice. */
export function setStoredTheme(choice: ThemeChoice): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, choice);
}

/** Resolve to an effective "light" or "dark" value. */
export function resolveTheme(choice: ThemeChoice): "light" | "dark" {
  if (choice !== "system") return choice;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Apply the effective theme to the document. */
export function applyTheme(effective: "light" | "dark"): void {
  document.documentElement.classList.toggle(DARK_CLASS, effective === "dark");
}

/** Convenience: read stored → resolve → apply. Returns effective theme. */
export function initTheme(): "light" | "dark" {
  const choice = getStoredTheme();
  const effective = resolveTheme(choice);
  applyTheme(effective);
  return effective;
}

/** Toggle between light ↔ dark (explicit, not system). */
export function toggleTheme(): "light" | "dark" {
  const current = document.documentElement.classList.contains(DARK_CLASS)
    ? "dark"
    : "light";
  const next = current === "dark" ? "light" : "dark";
  setStoredTheme(next);
  applyTheme(next);
  return next;
}
