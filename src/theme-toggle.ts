// Theme handling for the demo page, copied from the Moorhen docs site: the
// stylesheet follows the OS preference unless data-theme is set on <html>.
//
// This module owns the light/dark state. Other modules can follow it with
// currentTheme() and onThemeChange(), which is how src/main.ts keeps the
// Moorhen viewport background in step with the page (see the bottom of that
// file). index.html also loads this module directly, for the toggle button,
// but a module is only evaluated once, so both get the same state.

const STORAGE_KEY = "moorhen-demo-theme";

export type Theme = "light" | "dark";

/** RGB (0 to 1) plus alpha, as expected by sceneSettings.setBackgroundColor. */
export type SceneColour = [number, number, number, number];

/** Viewport background for each theme: white, or the dark page background. */
export const THEME_BACKGROUNDS: Record<Theme, SceneColour> = {
    light: [1, 1, 1, 255],
    dark: [27 / 255, 30 / 255, 34 / 255, 255], // #1b1e22
};

const listeners = new Set<(theme: Theme) => void>();

function systemTheme(): Theme {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** The theme currently in force, whether chosen by the user or by the OS. */
export function currentTheme(): Theme {
    const attribute = document.documentElement.getAttribute("data-theme");
    return attribute === "light" || attribute === "dark" ? attribute : systemTheme();
}

/** Call `callback` on every later theme change. Returns an unsubscribe function. */
export function onThemeChange(callback: (theme: Theme) => void): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

function apply(theme: Theme): void {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
    for (const listener of listeners) {
        listener(theme);
    }
}

// Restore the saved choice, if the user ever made one.
const saved = localStorage.getItem(STORAGE_KEY);
if (saved === "light" || saved === "dark") {
    document.documentElement.setAttribute("data-theme", saved);
}

/** Switch to the other theme. */
export function toggleTheme(): void {
    apply(currentTheme() === "dark" ? "light" : "dark");
    updateLabel();
}

const button = document.getElementById("theme-toggle");

function updateLabel(): void {
    if (button) {
        button.textContent = currentTheme() === "dark" ? "\u2600 Light mode" : "\u{1F319} Dark mode";
    }
}

updateLabel();

button?.addEventListener("click", toggleTheme);
