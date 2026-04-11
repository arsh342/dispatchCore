import { useState, useEffect, Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAutoTheme } from "@/hooks/app/useAutoTheme";
import { applyAuthSession, type AuthLoginResponse } from "@/lib/session";
import { API_BASE, redirectForServerStatus } from "@/lib/api";

import {
  AtSignIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
} from "lucide-react";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({
    default: mod.Dithering,
  })),
);

export function AuthPage() {
  const REMEMBER_ME_KEY = "dc_remember_me";
  const REMEMBERED_EMAIL_KEY = "dc_remembered_email";

  useAutoTheme();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_ME_KEY) === "true";
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";

    setRememberMe(remembered);
    if (remembered && rememberedEmail) {
      setEmail(rememberedEmail);
    }
  }, []);

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.status !== 401) {
        redirectForServerStatus(res.status);
      }
      const body = await res.json();

      if (!res.ok || !body.success || !body.data) {
        setError(body.error?.message || "Incorrect email or password.");
        setLoading(false);
        return;
      }

      const auth = body.data as AuthLoginResponse;

      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, "true");
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      applyAuthSession(auth);
      navigate(auth.targetRoute);
    } catch {
      setError("Could not connect to server. Is the backend running?");
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleLogin();
  };

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);

    if (!checked) {
      const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);

      // Clear only prefetched remembered value, not newly typed edits.
      if (email === rememberedEmail) {
        setEmail("");
      }
    }
  };

  return (
    <main
      className="relative min-h-screen md:h-screen md:overflow-hidden bg-background"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ─── Dithering animation with CSS mask fade ─── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          maskImage:
            "linear-gradient(to right, black 0%, black 0%, transparent 55%)",
          WebkitMaskImage:
            "linear-gradient(to right, black 0%, black 0%, transparent 55%)",
        }}
      >
        <Suspense fallback={<div className="absolute inset-0 bg-background" />}>
          <Dithering
            colorBack="#00000000"
            colorFront={isDark ? "#5c2d0e" : "#92400e"}
            shape="warp"
            type="4x4"
            speed={isHovered ? 0.6 : 0.15}
            className="size-full"
            minPixelRatio={1}
          />
        </Suspense>
      </div>

      {/* ─── Content layer ─── */}
      <div className="relative z-[2] min-h-screen md:h-screen lg:grid lg:grid-cols-2">
        {/* LEFT: Brand content over animation */}
        <div className="relative hidden h-full flex-col lg:flex overflow-hidden">
          {/* Logo */}
          <div className="relative z-10 p-10 flex items-center gap-2.5">
            <p className="text-xl font-semibold text-foreground">
              dispatchCore
            </p>
          </div>

          {/* Center content */}
          <div className="relative z-10 flex-1 flex flex-col items-start justify-end px-12 pb-16 text-left">
            <h2 className="text-5xl lg:text-6xl font-medium tracking-tight text-foreground mb-6 leading-[1.1]">
              Real-Time Delivery
              <br />
              <span className="text-foreground/60">Dispatch, Done Right.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-md leading-relaxed">
              Coordinate your fleet, manage independent drivers, and give
              customers live tracking — all from one platform.
            </p>
          </div>
        </div>

        {/* RIGHT: Login form with frosted glass */}
        <div className="relative flex min-h-screen flex-col justify-center p-6">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden absolute top-6 left-6 z-10">
            <img src="/logo.png" alt="dispatchCore" className="h-6 w-auto" />
            <p className="text-lg font-semibold">dispatchCore</p>
          </div>

          {/* Login card */}
          <div className="relative z-10 mx-auto w-full max-w-[420px] space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome Back
              </h1>
              <p className="text-muted-foreground text-sm">
                Sign in to your dashboard
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <input
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-full border border-border bg-card px-6 py-[18px] ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  />
                  <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                    <AtSignIcon className="size-4" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <input
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-full border border-border bg-card px-6 py-[18px] ps-11 pe-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  />
                  <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                    <LockIcon className="size-4" aria-hidden="true" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 end-0 flex items-center pe-4 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => handleRememberMeChange(e.target.checked)}
                    className="size-4 rounded border-input accent-primary bg-white dark:bg-card border appearance-none checked:appearance-auto"
                  />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <a
                  href="#"
                  className="text-sm text-primary hover:underline underline-offset-4 font-medium"
                >
                  Forgot password?
                </a>
              </div>

              {/* Error message */}
              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" /> Signing
                    in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
            {/* Sign up link */}
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                Sign Up
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="relative z-10 mt-8 text-center text-xs text-muted-foreground/60">
            © 2026 dispatchCore. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
