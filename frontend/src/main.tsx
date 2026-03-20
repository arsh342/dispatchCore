import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { useTheme } from "./hooks/app/useTheme";

function applyInitialTheme() {
  try {
    const stored = localStorage.getItem("dc_theme");
    const mode =
      stored === "dark" || stored === "light" || stored === "system"
        ? stored
        : "system";
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = mode === "system" ? systemDark : mode === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  } catch {
    // Ignore bootstrap theme failures and fall back to CSS defaults.
  }
}

function ThemeController() {
  useTheme();
  return null;
}

applyInitialTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeController />
    <App />
  </StrictMode>,
);
