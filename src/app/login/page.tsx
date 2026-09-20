"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type AuthMode = "signin" | "signup" | "forgot";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>("signin");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
  }

  function validateEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!validateEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    const { error: authError } =
      await supabaseBrowser.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (authError) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      setLoading(false);
      return;
    }

    if (!cleanPhone) {
      setError("Please enter your phone number.");
      setLoading(false);
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { data, error: authError } =
      await supabaseBrowser.auth.signUp({
        email: cleanEmail,
        password,
        options: {
  emailRedirectTo: `${window.location.origin}/auth/confirm?next=/`,
  data: {
    full_name: cleanName,
    phone: cleanPhone,
  },
},
      });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setSuccess(
      "Account created successfully. Please check your email to confirm your account before signing in."
    );

    setPassword("");
    setConfirmPassword("");
  }

  async function handleForgotPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!validateEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    const { error: resetError } =
  await supabaseBrowser.auth.resetPasswordForEmail(
    cleanEmail,
    {
      redirectTo: `${window.location.origin}/auth/confirm?next=/auth/reset-password`,
    }
  );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(
      "If an account exists for this email, you’ll receive a password reset link shortly."
    );

    setLoading(false);
  }

  function renderPasswordField(
    id: string,
    label: string,
    value: string,
    setValue: (value: string) => void,
    visible: boolean,
    setVisible: (value: boolean) => void,
    autoComplete: string
  ) {
    return (
      <div>
        <label
          htmlFor={id}
          className="mb-2.5 block text-[13px] font-semibold tracking-[-0.01em] text-slate-800"
        >
          {label}
        </label>

        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" />

          <input
            id={id}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={
              label === "Confirm password"
                ? "Re-enter your password"
                : "Enter your password"
            }
            autoComplete={autoComplete}
            required
            className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-[14px] font-medium text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
          />

          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? `Hide ${label}` : `Show ${label}`}
            className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            {visible ? (
              <EyeOff className="h-[17px] w-[17px]" />
            ) : (
              <Eye className="h-[17px] w-[17px]" />
            )}
          </button>
        </div>
      </div>
    );
  }

  const isSignIn = mode === "signin";
  const isSignUp = mode === "signup";
  const isForgot = mode === "forgot";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f8f6] text-slate-950">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-emerald-200/30 blur-[120px]" />
        <div className="absolute -bottom-48 -right-40 h-[600px] w-[600px] rounded-full bg-teal-100/40 blur-[130px]" />
        <div className="absolute left-[48%] top-[30%] h-[280px] w-[280px] rounded-full bg-white/80 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at center, black 10%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 10%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] items-center px-4 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/80 bg-white/70 shadow-[0_30px_90px_rgba(15,45,35,0.10)] backdrop-blur-2xl lg:min-h-[720px] lg:grid-cols-[0.95fr_1.05fr]">
          {/* Brand / value panel */}
          <section className="relative hidden overflow-hidden bg-[#103d34] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-32 -top-32 h-[440px] w-[440px] rounded-full bg-emerald-300/15 blur-[100px]" />
              <div className="absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-teal-200/10 blur-[110px]" />
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
                  backgroundSize: "42px 42px",
                }}
              />
            </div>

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[15px] border border-white/10 bg-white/10 text-base font-bold shadow-lg backdrop-blur-xl">
                  M
                </div>
                <div>
                  <p className="text-[17px] font-bold tracking-[-0.03em]">
                    MoveWell
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-emerald-100/70">
                    Physiotherapy care, simplified
                  </p>
                </div>
              </div>
            </div>

            <div className="relative -mt-4">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-50 backdrop-blur-xl">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/15">
                  <Sparkles className="h-3 w-3 text-emerald-200" />
                </span>
                AI-powered patient support
              </div>

              <h2 className="max-w-[500px] text-[3.3rem] font-bold leading-[1.02] tracking-[-0.055em] xl:text-[3.75rem]">
                Your care.
                <br />
                <span className="text-emerald-200">Your next step.</span>
              </h2>

              <p className="mt-5 max-w-[460px] text-[14px] leading-6 text-emerald-50/70">
                Get help exploring physiotherapy services, understanding
                common concerns, and managing your appointments with
                MoveWell&apos;s patient assistant.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  {
                    icon: CalendarCheck2,
                    title: "Simple appointment management",
                    text: "Find suitable times and request visits.",
                  },
                  {
                    icon: HeartPulse,
                    title: "Guidance when you need it",
                    text: "Explore physiotherapy information with AI.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Private patient access",
                    text: "Your account keeps appointment information protected.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.055] px-3.5 py-3 backdrop-blur-md"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                        <Icon className="h-4 w-4 text-emerald-200" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-white">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-4 text-emerald-50/55">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative flex items-center gap-2 text-[11px] text-emerald-50/50">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure patient portal
            </div>
          </section>

          {/* Authentication panel */}
          <section className="flex items-center justify-center bg-white/85 p-5 sm:p-8 lg:p-10 xl:p-12">
            <div className="w-full max-w-[470px]">
              {/* Mobile brand */}
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#103d34] text-base font-bold text-white shadow-[0_8px_24px_rgba(16,61,52,0.18)]">
                  M
                </div>
                <div>
                  <p className="text-[18px] font-bold tracking-[-0.03em] text-slate-950">
                    MoveWell
                  </p>
                  <p className="text-[11px] font-medium text-slate-500">
                    Physiotherapy patient portal
                  </p>
                </div>
              </div>

              {/* Sign in */}
              {isSignIn && (
                <>
                  <div className="mb-8">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[13px] bg-emerald-50 text-emerald-700 lg:flex">
                      <LockKeyhole className="h-[18px] w-[18px]" />
                    </div>

                    <h1 className="text-[30px] font-bold leading-tight tracking-[-0.045em] text-slate-950 sm:text-[32px]">
                      Welcome back
                    </h1>

                    <p className="mt-2 text-[14px] leading-6 text-slate-500">
                      Sign in to securely manage your MoveWell appointments.
                    </p>
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2.5 block text-[13px] font-semibold tracking-[-0.01em] text-slate-800"
                      >
                        Email address
                      </label>

                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-[14px] font-medium text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                      />
                    </div>

                    {renderPasswordField(
                      "password",
                      "Password",
                      password,
                      setPassword,
                      showPassword,
                      setShowPassword,
                      "current-password"
                    )}

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-[13px] font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-5 text-red-700"
                      >
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="group flex h-[53px] w-full items-center justify-center gap-2 rounded-2xl bg-[#103d34] px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(16,61,52,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0c322b] hover:shadow-[0_14px_30px_rgba(16,61,52,0.20)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
                    >
                      {loading ? "Signing in..." : "Sign in"}
                      {!loading && (
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </button>
                  </form>

                  <div className="my-7 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-[11px] font-medium text-slate-400">
                      New to MoveWell?
                    </span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="flex h-[51px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[14px] font-semibold text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
                  >
                    Create an account
                  </button>

                  <div className="mt-7 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Secure patient authentication
                  </div>
                </>
              )}

              {/* Sign up */}
              {isSignUp && (
                <>
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="mb-7 inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                  </button>

                  <div className="mb-7">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[13px] bg-emerald-50 text-emerald-700">
                      <HeartPulse className="h-[18px] w-[18px]" />
                    </div>

                    <h1 className="text-[29px] font-bold leading-tight tracking-[-0.045em] text-slate-950">
                      Create your account
                    </h1>

                    <p className="mt-2 text-[14px] leading-6 text-slate-500">
                      Set up your secure MoveWell patient profile.
                    </p>
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-4.5">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-2 block text-[13px] font-semibold text-slate-800"
                      >
                        Full name
                      </label>

                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your full name"
                        autoComplete="name"
                        required
                        className="h-[50px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-[14px] font-medium text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-[13px] font-semibold text-slate-800"
                      >
                        Phone number
                      </label>

                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        placeholder="+33 6 00 00 00 00"
                        autoComplete="tel"
                        required
                        className="h-[50px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-[14px] font-medium text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="signup-email"
                        className="mb-2 block text-[13px] font-semibold text-slate-800"
                      >
                        Email address
                      </label>

                      <input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        className="h-[50px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-[14px] font-medium text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                      />
                    </div>

                    {renderPasswordField(
                      "signup-password",
                      "Password",
                      password,
                      setPassword,
                      showPassword,
                      setShowPassword,
                      "new-password"
                    )}

                    {renderPasswordField(
                      "confirm-password",
                      "Confirm password",
                      confirmPassword,
                      setConfirmPassword,
                      showConfirmPassword,
                      setShowConfirmPassword,
                      "new-password"
                    )}

                    <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-3 text-[11px] leading-5 text-slate-500">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>
                        Use at least 8 characters. You&apos;ll need to confirm
                        your email before accessing your account.
                      </span>
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-5 text-red-700"
                      >
                        {error}
                      </div>
                    )}

                    {success && (
                      <div
                        role="status"
                        className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] leading-5 text-emerald-800"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{success}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="group mt-1 flex h-[53px] w-full items-center justify-center gap-2 rounded-2xl bg-[#103d34] px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(16,61,52,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0c322b] hover:shadow-[0_14px_30px_rgba(16,61,52,0.20)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
                    >
                      {loading ? "Creating account..." : "Create account"}
                      {!loading && (
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </button>
                  </form>

                  <p className="mt-7 text-center text-[13px] text-slate-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      Sign in
                    </button>
                  </p>
                </>
              )}

              {/* Forgot password */}
              {isForgot && (
                <>
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="mb-7 inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to sign in
                  </button>

                  <div className="mb-8">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[13px] bg-emerald-50 text-emerald-700">
                      <LockKeyhole className="h-[18px] w-[18px]" />
                    </div>

                    <h1 className="text-[30px] font-bold leading-tight tracking-[-0.045em] text-slate-950">
                      Reset your password
                    </h1>

                    <p className="mt-2 text-[14px] leading-6 text-slate-500">
                      Enter your email and we&apos;ll send you a secure reset
                      link.
                    </p>
                  </div>

                  <div className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-slate-800">
                          Secure password recovery
                        </p>
                        <p className="mt-1 text-[11px] leading-4.5 text-slate-500">
                          We&apos;ll only send a reset link to the email
                          associated with your account.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form
                    onSubmit={handleForgotPassword}
                    className="space-y-5"
                  >
                    <div>
                      <label
                        htmlFor="forgot-email"
                        className="mb-2.5 block text-[13px] font-semibold text-slate-800"
                      >
                        Email address
                      </label>

                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                        className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 text-[14px] font-medium text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                      />
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-5 text-red-700"
                      >
                        {error}
                      </div>
                    )}

                    {success && (
                      <div
                        role="status"
                        className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] leading-5 text-emerald-800"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{success}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="group flex h-[53px] w-full items-center justify-center gap-2 rounded-2xl bg-[#103d34] px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(16,61,52,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0c322b] hover:shadow-[0_14px_30px_rgba(16,61,52,0.20)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
                    >
                      {loading ? "Sending reset link..." : "Send reset link"}
                      {!loading && (
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </button>
                  </form>

                  <p className="mt-7 text-center text-[13px] text-slate-500">
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signin")}
                      className="font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      Sign in
                    </button>
                  </p>
                </>
              )}

              <div className="mt-9 flex items-center justify-center gap-2 text-center text-[10px] font-medium text-slate-400">
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                Your account helps keep appointment information private and
                secure.
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
