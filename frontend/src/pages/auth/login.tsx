import { useState, useEffect, useRef, Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAutoTheme } from "@/hooks/app/useAutoTheme";
import { useAuth } from "@/hooks/auth/useAuth";
import type { ConfirmationResult } from "firebase/auth";

import {
  AtSignIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  PhoneIcon,
} from "lucide-react";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({
    default: mod.Dithering,
  })),
);

type LoginMethod = "email" | "phone";

export function AuthPage() {
  const REMEMBER_ME_KEY = "dc_remember_me";
  const REMEMBERED_EMAIL_KEY = "dc_remembered_email";

  useAutoTheme();
  const navigate = useNavigate();
  const { signInEmail, signInGoogle, startPhoneSignIn, verifyPhoneOtp } = useAuth();

  const [isHovered, setIsHovered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  // Login method
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Phone form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // UI state
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

  // ── Email Sign-In ──
  const handleEmailLogin = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, "true");
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
      const session = await signInEmail(email, password);
      navigate(session.targetRoute);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Incorrect email or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-In ──
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const session = await signInGoogle();
      navigate(session.targetRoute);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Google sign-in failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Phone Sign-In ──
  const handleSendOtp = async () => {
    setError("");
    if (!phoneNumber) {
      setError("Please enter your phone number.");
      return;
    }
    if (!recaptchaRef.current) return;

    setLoading(true);
    try {
      const result = await startPhoneSignIn(phoneNumber, recaptchaRef.current);
      setConfirmationResult(result);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to send OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (!otp || !confirmationResult) {
      setError("Please enter the OTP.");
      return;
    }
    setLoading(true);
    try {
      const session = await verifyPhoneOtp(confirmationResult, otp);
      navigate(session.targetRoute);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Invalid OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loginMethod === "email") {
      void handleEmailLogin();
    } else if (confirmationResult) {
      void handleVerifyOtp();
    } else {
      void handleSendOtp();
    }
  };

  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    if (!checked) {
      const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      if (email === rememberedEmail) setEmail("");
    }
  };

  return (
    <main
      className="relative min-h-screen md:h-screen md:overflow-hidden bg-background"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ─── Dithering animation ─── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          maskImage: "linear-gradient(to right, black 0%, black 0%, transparent 55%)",
          WebkitMaskImage: "linear-gradient(to right, black 0%, black 0%, transparent 55%)",
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
        {/* LEFT: Brand */}
        <div className="relative hidden h-full flex-col lg:flex overflow-hidden">
          <div className="relative z-10 p-10 flex items-center gap-2.5">
            <p className="text-xl font-semibold text-foreground">dispatchCore</p>
          </div>
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

        {/* RIGHT: Login form */}
        <div className="relative flex min-h-screen flex-col justify-center p-6">
          <div className="flex items-center gap-2 lg:hidden absolute top-6 left-6 z-10">
            <img src="/logo.png" alt="dispatchCore" className="h-6 w-auto" />
            <p className="text-lg font-semibold">dispatchCore</p>
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[420px] space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
              <p className="text-muted-foreground text-sm">Sign in to your dashboard</p>
            </div>

            {/* ── Google Sign-In ── */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-full border border-border bg-card px-6 py-4 text-sm font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            {/* ── Divider ── */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* ── Email / Phone Toggle ── */}
            <div className="relative grid grid-cols-2 rounded-full border border-border bg-card p-1">
              <div
                className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full border border-primary bg-primary/10 shadow-sm transition-transform duration-300 ease-in-out"
                style={{
                  transform: loginMethod === "email" ? "translateX(4px)" : "translateX(calc(100% + 4px))",
                }}
              />
              <button
                type="button"
                onClick={() => { setLoginMethod("email"); setError(""); }}
                className="relative z-[1] flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-300"
              >
                <AtSignIcon className={`size-4 transition-colors duration-300 ${loginMethod === "email" ? "text-primary" : "text-muted-foreground"}`} />
                Email
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod("phone"); setError(""); setConfirmationResult(null); setOtp(""); }}
                className="relative z-[1] flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors duration-300"
              >
                <PhoneIcon className={`size-4 transition-colors duration-300 ${loginMethod === "phone" ? "text-primary" : "text-muted-foreground"}`} />
                Phone
              </button>
            </div>

            {/* ── Form ── */}
            <form className="space-y-4" onSubmit={handleLoginSubmit}>
              {loginMethod === "email" ? (
                <>
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
                        {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                      </button>
                    </div>
                  </div>

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
                    <a href="#" className="text-sm text-primary hover:underline underline-offset-4 font-medium">
                      Forgot password?
                    </a>
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {confirmationResult ? "Verification Code" : "Phone Number"}
                  </label>
                  <div className="relative">
                    {confirmationResult ? (
                      <input
                        placeholder="123456"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        className="w-full rounded-full border border-border bg-card px-6 py-[18px] ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors tracking-[0.3em] text-center font-mono"
                      />
                    ) : (
                      <input
                        placeholder="+91 98765 43210"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full rounded-full border border-border bg-card px-6 py-[18px] ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                      />
                    )}
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                      <PhoneIcon className="size-4" aria-hidden="true" />
                    </div>
                  </div>
                  {confirmationResult && (
                    <button
                      type="button"
                      onClick={() => { setConfirmationResult(null); setOtp(""); }}
                      className="text-xs text-primary hover:underline underline-offset-4"
                    >
                      ← Change phone number
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {loading ? (
                  <><Loader2Icon className="size-4 animate-spin" /> Signing in...</>
                ) : loginMethod === "email" ? (
                  "Sign In"
                ) : confirmationResult ? (
                  "Verify OTP"
                ) : (
                  "Send OTP"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline underline-offset-4">
                Sign Up
              </Link>
            </p>
          </div>

          {/* Recaptcha container (invisible) */}
          <div ref={recaptchaRef} id="recaptcha-container" />

          <p className="relative z-10 mt-8 text-center text-xs text-muted-foreground/60">
            © 2026 dispatchCore. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
