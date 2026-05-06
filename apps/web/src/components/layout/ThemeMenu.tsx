"use client";

import { useRef, useState, useEffect } from "react";
import { Palette, Sun, Moon } from "lucide-react";
import { useTheme, THEMES, THEME_META } from "@/contexts/ThemeContext";

export function ThemeMenu() {
  const { theme, setTheme, darkMode, toggleDarkMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-7 border-2 border-gray-400 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 dark:border-gray-600"
        title="Personalizar tema"
      >
        <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">

          {/* Apariencia */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Apariencia
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => darkMode && toggleDarkMode()}
                className={`flex-1 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors ${
                  !darkMode
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold"
                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Claro
              </button>
              <button
                onClick={() => !darkMode && toggleDarkMode()}
                className={`flex-1 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors ${
                  darkMode
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold"
                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Oscuro
              </button>
            </div>
          </div>

          {/* Color */}
          <div className="p-3">
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Color
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {THEMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  title={THEME_META[t].name}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors ${
                    theme === t
                      ? "bg-gray-100 dark:bg-gray-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full shadow-sm transition-transform ${
                      theme === t ? "scale-110 ring-2 ring-offset-1 ring-gray-300 dark:ring-gray-600" : ""
                    }`}
                    style={{ background: THEME_META[t].swatch }}
                  />
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-tight text-center">
                    {THEME_META[t].name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
