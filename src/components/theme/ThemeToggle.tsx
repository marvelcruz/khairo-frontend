"use client";

import {
  Moon,
  Sun,
} from "lucide-react";

import {
  useTheme,
} from "@/context/ThemeContext";

export function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const {
    toggleTheme,
  } = useTheme();

  return (
    <button
      type="button"
      onClick={
        toggleTheme
      }
      className={`theme-toggle grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-colors ${className}`}
      aria-label="Toggle light and dark mode"
      title="Light / dark mode"
    >
      <Sun
        size={17}
        className="theme-icon-light"
        aria-hidden
      />

      <Moon
        size={17}
        className="theme-icon-dark"
        aria-hidden
      />
    </button>
  );
}
