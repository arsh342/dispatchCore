import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { useTheme } from "./hooks/app/useTheme";

function installApiFetchAuthFallback() {
  const nativeFetch = window.fetch.bind(window);
  const fallbackUrl = "http://localhost:8000/api";
  const configuredApiBase = (import.meta.env.VITE_API_URL ?? fallbackUrl)
    .trim()
    .replace(/\/$/, "");

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const isApiRequest = requestUrl.startsWith(configuredApiBase);
    if (!isApiRequest) {
      return nativeFetch(input, init);
    }

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    const accessToken = localStorage.getItem("dc_access_token");
    if (accessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const nextInit: RequestInit = {
      ...init,
      headers,
      credentials: init?.credentials ?? "include",
    };

    return nativeFetch(input, nextInit);
  };
}

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
installApiFetchAuthFallback();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeController />
    <App />
  </StrictMode>,
);
