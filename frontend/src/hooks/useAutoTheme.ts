import { useEffect } from "react";

/**
 * Syncs the `dark` class on <html> with the browser's preferred color scheme.
 * Listens for real-time changes (e.g. user toggles OS dark mode).
 *
 * Usage: call `useAutoTheme()` once at the top of any page component.
 */
export function useAutoTheme() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    function apply(dark: boolean) {
      document.documentElement.classList.toggle("dark", dark);
    }

    // Set on mount
    apply(mq.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
}
