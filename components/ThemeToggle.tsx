"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "./icons";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      aria-label={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
      className="icon-btn !text-white/60 hover:!text-white hover:!bg-white/10"
    >
      {isDark === null ? null : isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
