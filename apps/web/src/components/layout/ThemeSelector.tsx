"use client";

import { useTheme, THEMES, THEME_META } from "@/contexts/ThemeContext";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1.5">
      {THEMES.map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          title={THEME_META[t].name}
          className={`w-5 h-5 rounded-full transition-all duration-200 ${
            theme === t
              ? "ring-2 ring-offset-1 ring-gray-400 scale-110"
              : "opacity-70 hover:opacity-100 hover:scale-110"
          }`}
          style={{ background: THEME_META[t].swatch }}
        />
      ))}
    </div>
  );
}
