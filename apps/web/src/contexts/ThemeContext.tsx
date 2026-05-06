"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  "esmeralda", "verde",
  "cian",      "azul",
  "indigo",    "violeta",
  "morado",    "rosa",
  "rojo",      "naranja",
] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_META: Record<Theme, { name: string; swatch: string }> = {
  esmeralda: { name: "Esmeralda", swatch: "oklch(0.627 0.168 152)" },
  verde:     { name: "Verde",     swatch: "oklch(0.722 0.211 142)" },
  cian:      { name: "Cian",      swatch: "oklch(0.714 0.193 193)" },
  azul:      { name: "Azul",      swatch: "oklch(0.623 0.214 259)" },
  indigo:    { name: "Índigo",    swatch: "oklch(0.585 0.233 271)" },
  violeta:   { name: "Violeta",   swatch: "oklch(0.578 0.228 286)" },
  morado:    { name: "Morado",    swatch: "oklch(0.627 0.264 303)" },
  rosa:      { name: "Rosa",      swatch: "oklch(0.656 0.213 347)" },
  rojo:      { name: "Rojo",      swatch: "oklch(0.628 0.258 27)"  },
  naranja:   { name: "Naranja",   swatch: "oklch(0.714 0.219 53)"  },
};

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("esmeralda");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("teams-theme") as Theme | null;
    const resolvedTheme =
      storedTheme && (THEMES as readonly string[]).includes(storedTheme)
        ? (storedTheme as Theme)
        : "esmeralda";
    setThemeState(resolvedTheme);
    document.documentElement.setAttribute("data-theme", resolvedTheme);

    const storedDark = localStorage.getItem("teams-dark") === "1";
    setDarkMode(storedDark);
    document.documentElement.classList.toggle("dark", storedDark);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("teams-theme", t);
    document.documentElement.setAttribute("data-theme", t);
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("teams-dark", next ? "1" : "0");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
