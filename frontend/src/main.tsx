import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import ThemeController from "./components/providers/ThemeController";
import { AuthProvider } from "./components/providers/AuthProvider";

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

applyInitialTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <ThemeController />
      <App />
    </AuthProvider>
  </StrictMode>,
);
