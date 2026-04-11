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
  UserIcon,
  PhoneIcon,
  BuildingIcon,
  UsersIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  Loader2Icon,
  ChevronDownIcon,
} from "lucide-react";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({
    default: mod.Dithering,
  })),
);

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,16}$/;

type AccountType = "company" | "driver";

export function SignupPage() {
  useAutoTheme();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("company");
  const [step, setStep] = useState(1);
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains("dark"),
  );

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

  const handleSubmit = async () => {
    setError("");

    // Basic validation
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }
    if (accountType === "driver" && !fullName) {
      setError("Please enter your full name.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setError(
        "Password must be 8-16 chars with uppercase, lowercase, number, and special character.",
      );
      return;
    }
    if (!agreedToTerms) {
      setError("You must agree to the Terms of Service.");
      return;
    }

    if (accountType === "company" && !companyName) {
      setError("Please enter your company name.");
      return;
    }
    if (accountType === "company" && !location) {
      setError("Please enter your company location.");
      return;
    }

    setSubmitting(true);

    try {
      if (accountType === "company") {
        const res = await fetch(`${API_BASE}/companies`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: companyName,
            email,
            password,
            location,
            address: location,
            phone,
            plan_type:
              companySize === "large"
                ? "ENTERPRISE"
                : companySize === "medium"
                  ? "GROWTH"
                  : "STARTER",
          }),
        });

        const data = await res.json();
        redirectForServerStatus(res.status);

        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Registration failed");
        }
      } else {
        const res = await fetch(`${API_BASE}/drivers/signup`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName,
            email,
            phone,
            password,
          }),
        });

        const data = await res.json();
        redirectForServerStatus(res.status);

        if (!res.ok || !data.success) {
          throw new Error(data.error?.message || "Registration failed");
        }
      }

      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      redirectForServerStatus(loginRes.status);
      const loginBody = await loginRes.json();
      if (!loginRes.ok || !loginBody.success || !loginBody.data) {
        throw new Error(loginBody.error?.message || "Signup succeeded but login failed");
      }

      const auth = loginBody.data as AuthLoginResponse;
      applyAuthSession(auth);
      navigate(auth.targetRoute);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepOneSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStep(2);
  };

  const handleStepTwoSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit();
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
            speed={isHovered ? 0.5 : 0.1}
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

          {/* Center content — hero copy + benefits */}
          <div className="relative z-10 flex-1 flex flex-col items-start justify-end px-12 pb-16 text-left">
            {/* Hero headline */}
            <h2 className="text-5xl lg:text-6xl font-medium tracking-tight text-foreground mb-6 leading-[1.1]">
              Start Dispatching
              <br />
              <span className="text-foreground/60">In Minutes, Not Days.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-md leading-relaxed mb-12">
              Set up your fleet, invite your team, and start managing deliveries
              — all from one powerful platform.
            </p>
          </div>
        </div>

        {/* RIGHT: Registration form with frosted glass */}
        <div className="relative flex min-h-screen flex-col justify-center p-6 overflow-y-auto">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden absolute top-6 left-6 z-10">
            <img src="/logo.png" alt="dispatchCore" className="h-6 w-auto" />
            <p className="text-lg font-semibold">dispatchCore</p>
          </div>

          {/* Form */}
          <div className="relative z-10 mx-auto w-full max-w-[480px] space-y-5 py-12 lg:py-0">
            {/* Header */}
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight">
                Create Your Account
              </h1>
              <p className="text-muted-foreground text-sm">
                {step === 1
                  ? "Choose your account type and enter your details"
                  : "Set up your credentials to get started"}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-3">
              <div
                className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step >= 1 ? "bg-primary" : "bg-border"}`}
              />
              <div
                className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step >= 2 ? "bg-primary" : "bg-border"}`}
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Step {step} of 2
              </span>
            </div>

            {/* ── STEP 1: Account type + basic info ── */}
            {step === 1 && (
              <form className="space-y-5" onSubmit={handleStepOneSubmit}>
                {/* Account type selector — segmented control */}
                <div className="relative grid grid-cols-2 rounded-full border border-border bg-card p-1">
                  {/* Sliding pill */}
                  <div
                    className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full border border-primary bg-primary/10 shadow-sm transition-transform duration-300 ease-in-out"
                    style={{
                      transform: accountType === "company" ? "translateX(4px)" : "translateX(calc(100% + 4px))",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setAccountType("company")}
                    className="relative z-[1] flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors duration-300"
                  >
                    <BuildingIcon
                      className={`size-4 transition-colors duration-300 ${accountType === "company" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    Delivery Company
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("driver")}
                    className="relative z-[1] flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors duration-300"
                  >
                    <UsersIcon
                      className={`size-4 transition-colors duration-300 ${accountType === "driver" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    Independent Driver
                  </button>
                </div>

                {/* Basic fields */}
                <div className="space-y-3">
                  {accountType === "driver" ? (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Full Name</label>
                      <div className="relative">
                        <input
                          placeholder="John Doe"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full rounded-full border border-border bg-card px-6 py-[18px] ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                        />
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                          <UserIcon className="size-4" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Company Name</label>
                      <div className="relative">
                        <input
                          placeholder="Your Company Inc."
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full rounded-full border border-border bg-card px-6 py-[18px] ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                        />
                        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                          <BuildingIcon className="size-4" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative">
                      <input
                        placeholder={accountType === "company" ? "you@company.com" : "you@email.com"}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-full border border-border bg-card px-6 py-[18px] ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                      />
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                        <AtSignIcon className="size-4" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Phone Number</label>
                    <div className="relative">
                      <input
                        placeholder={accountType === "company" ? "+91 98765 43210" : "+91 98765 43210"}
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-full border border-border bg-card px-6 py-[18px] ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                      />
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                        <PhoneIcon className="size-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Continue button */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  Continue
                  <ArrowRightIcon className="size-4" />
                </button>

                {/* Login link */}
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary font-medium hover:underline underline-offset-4"
                  >
                    Log In
                  </Link>
                </p>
              </form>
            )}

            {/* ── STEP 2: Company fields + password + terms ── */}
            {step === 2 && (
              <div className="space-y-5">
                <form className="space-y-3" onSubmit={handleStepTwoSubmit}>
                  {/* Company-specific fields */}
                  {accountType === "company" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">
                          Company Size
                        </label>
                      <div className="relative">
                        <select
                          value={companySize}
                          onChange={(e) => setCompanySize(e.target.value)}
                          className="w-full rounded-full border border-border bg-card px-6 pe-12 py-[18px] text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors appearance-none cursor-pointer"
                        >
                          <option value="">Select fleet size</option>
                          <option value="small">1–10 drivers</option>
                          <option value="medium">11–50 drivers</option>
                          <option value="large">50+ drivers</option>
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Location</label>
                        <div className="relative">
                          <input
                            placeholder="San Francisco, CA"
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full rounded-full border border-border bg-card px-6 py-[18px] ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                          />
                          <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                            <BuildingIcon className="size-4" />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Password */}
                  <div className="space-y-1">
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
                        <LockIcon className="size-4" />
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
                    <div className="flex gap-1 pt-1 px-8">
                      {(() => {
                        let score = 0;
                        if (password.length >= 6) score++;
                        if (password.length >= 10) score++;
                        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
                        if (/\d/.test(password)) score++;
                        if (/[^A-Za-z0-9]/.test(password)) score++;

                        const strength = password.length === 0 ? 0 : Math.min(Math.ceil(score * 3 / 5), 3);
                        const barColors = ["bg-border", "bg-red-500", "bg-yellow-400", "bg-green-500"];

                        return [1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? barColors[strength] : "bg-border"}`}
                          />
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-full border border-border bg-card px-6 py-[18px] ps-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                      />
                      <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                        <LockIcon className="size-4" />
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-2.5 text-sm cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="size-4 rounded border-input accent-primary mt-0.5 bg-white dark:bg-card border appearance-none checked:appearance-auto"
                    />
                    <span className="text-muted-foreground leading-tight">
                      I agree to the{" "}
                      <a
                        href="#"
                        className="text-primary hover:underline underline-offset-4"
                      >
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="text-primary hover:underline underline-offset-4"
                      >
                        Privacy Policy
                      </a>
                    </span>
                  </label>

                  {/* Error message */}
                  {error && (
                    <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      disabled={submitting}
                      className="flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-4 text-sm font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                      <ArrowLeftIcon className="size-4" />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2Icon className="size-4 animate-spin" />{" "}
                          Creating...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </button>
                  </div>
                </form>

                {/* Login link */}
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-primary font-medium hover:underline underline-offset-4"
                  >
                    Log In
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
