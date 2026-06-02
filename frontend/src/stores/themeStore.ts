import { create } from "zustand";

type Theme = "dark" | "light";

const STORAGE_KEY = "fj_theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function initialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved === "dark" || saved === "light") return saved;
  // Default to dark (the app is dark-first), but honour OS preference if light.
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
  init: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  init: () => {
    const theme = initialTheme();
    applyTheme(theme);
    set({ theme });
  },
  setTheme: (theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },
  toggle: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));
