/**
 * useTheme — Persistent dark/light mode hook
 *
 * Reads the initial theme from localStorage (key: "dc_theme").
 * Toggles the "dark" class on <html> and persists changes.
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "dc_theme";

function getInitialDark(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark") return true;
    if (stored === "light") return false;
    // Fall back to system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function useTheme() {
  const [isDark, setIsDarkState] = useState(getInitialDark);

  // Apply dark class to <html> on mount and changes
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [isDark]);

  const setIsDark = useCallback((value: boolean) => {
    setIsDarkState(value);
  }, []);

  return { isDark, setIsDark } as const;
}
