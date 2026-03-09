import React, { useState, useEffect, Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAutoTheme } from "@/hooks/useAutoTheme";

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
  useAutoTheme();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState<
    "dispatcher" | "driver" | "superadmin"
  >("dispatcher");
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

    // Clear previous session identity to avoid stale cross-role data
    localStorage.removeItem("dc_company_id");
    localStorage.removeItem("dc_user_id");
    localStorage.removeItem("dc_driver_id");
    localStorage.removeItem("dc_company_name");
    localStorage.removeItem("dc_user_name");
    localStorage.removeItem("dc_driver_name");
    localStorage.removeItem("dc_user_role");
    localStorage.removeItem("dc_user_email");

    // Store credentials (CE-02: replace with JWT auth)
    localStorage.setItem("dc_user_email", email);
    localStorage.setItem("dc_user_role", activeRole);

    let targetRoute = "/dashboard";

    try {
      // Look up user by email
      const res = await fetch(
        `${API_URL}/users?email=${encodeURIComponent(email)}`,
      );
      const data = await res.json();

      if (!data.success || !data.data) {
        setError("User not found. Check your email or sign up.");
        setLoading(false);
        return;
      }

      const user = data.data;
      localStorage.setItem("dc_user_id", String(user.id));
      localStorage.setItem("dc_user_name", user.name);

      if (activeRole === "dispatcher") {
        // ── Dispatcher login (company-level admin) ──
        // The user must belong to a company
        if (!user.company_id) {
          setError("This account is not associated with a company.");
          setLoading(false);
          return;
        }
        localStorage.setItem("dc_company_id", String(user.company_id));

        // Fetch company name
        try {
          const compRes = await fetch(`${API_URL}/companies`, {
            headers: { "x-company-id": String(user.company_id) },
          });
          const compData = await compRes.json();
          if (compData.success && compData.data?.length) {
            const company =
              compData.data.find(
                (c: { id: number }) => c.id === user.company_id,
              ) || compData.data[0];
            localStorage.setItem("dc_company_name", company.name);
          }
        } catch {
          /* ignore */
        }

        targetRoute = "/dashboard";
      } else if (activeRole === "driver") {
        // ── Driver login ──
        if (user.driverProfile) {
          localStorage.setItem("dc_driver_id", String(user.driverProfile.id));
          localStorage.setItem("dc_driver_name", user.name);

          if (user.company_id && user.driverProfile.type === "EMPLOYED") {
            // Employed driver — belongs to a company
            localStorage.setItem("dc_company_id", String(user.company_id));
            targetRoute = "/employed-driver/dashboard";

            // Fetch company name
            try {
              const compRes = await fetch(`${API_URL}/companies`, {
                headers: { "x-company-id": String(user.company_id) },
              });
              const compData = await compRes.json();
              if (compData.success && compData.data?.length) {
                const company =
                  compData.data.find(
                    (c: { id: number }) => c.id === user.company_id,
                  ) || compData.data[0];
                localStorage.setItem("dc_company_name", company.name);
              }
            } catch {
              /* ignore */
            }

            // Set driver status to AVAILABLE
            try {
              await fetch(
                `${API_URL}/drivers/${user.driverProfile.id}/status`,
                {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    "x-company-id": String(user.company_id),
                  },
                  body: JSON.stringify({ status: "AVAILABLE" }),
                },
              );
            } catch {
              /* ignore */
            }
          } else {
            // Independent driver — no company
            targetRoute = "/driver/dashboard";
          }
        } else {
          setError("No driver profile found for this account.");
          setLoading(false);
          return;
        }
      } else if (activeRole === "superadmin") {
        // ── SuperAdmin login ──
        // Only the hardcoded platform admin email is allowed
        if (user.role !== "superadmin") {
          setError("This account does not have SuperAdmin privileges.");
          setLoading(false);
          return;
        }
        targetRoute = "/superadmin";
      }
    } catch {
      setError("Could not connect to server. Is the backend running?");
      setLoading(false);
      return;
    }

    setTimeout(() => {
      setLoading(false);
      navigate(targetRoute);
    }, 300);
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
                Log in to your dashboard
              </p>
            </div>

            {/* Form */}
            <form className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <input
                    placeholder="you@company.com"
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
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" /> Logging
                    in...
                  </>
                ) : (
                  "Log In"
                )}
              </button>
            </form>

            {/* Separator */}
            <div className="flex w-full items-center justify-center py-1">
              <div className="bg-border h-px w-full" />
              <span className="text-muted-foreground px-3 text-xs whitespace-nowrap">
                or continue with
              </span>
              <div className="bg-border h-px w-full" />
            </div>

            {/* Google SSO */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-full border border-input bg-card px-4 py-[10px] text-sm font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring relative"
            >
              <GoogleIcon className="size-4 absolute left-5" />
              Sign in with Google
            </button>

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

            {/* Role selector chips */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2.5 text-center">
                Logging in as:
              </p>
              <div className="flex gap-2 justify-center">
                {(["dispatcher", "driver", "superadmin"] as const).map(
                  (role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setActiveRole(role)}
                      className={`px-5 py-2 rounded-full text-xs font-medium transition-all duration-200 border capitalize ${
                        activeRole === role
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-transparent text-muted-foreground border-border hover:border-foreground/30 hover:bg-muted"
                      }`}
                    >
                      {role}
                    </button>
                  ),
                )}
              </div>
            </div>
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

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <g>
      <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
    </g>
  </svg>
);
