"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data, error: sessionError } =
        await supabaseBrowser.auth.getSession();

      if (!mounted) return;

      if (sessionError || !data.session) {
        router.replace("/login");
        return;
      }

      setCheckingSession(false);
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error: updateError } =
      await supabaseBrowser.auth.updateUser({
        password,
      });

    if (updateError) {
      setError(
        updateError.message ||
          "Unable to update your password. Please try again."
      );
      setLoading(false);
      return;
    }

    setSuccess(
      "Your password has been updated successfully. Redirecting to sign in..."
    );

    await supabaseBrowser.auth.signOut();

    setTimeout(() => {
      router.replace("/login");
    }, 1500);
  }

  if (checkingSession) {
    return null;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4f8f6] px-4 py-8 text-slate-950">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-emerald-200/30 blur-[120px]" />
        <div className="absolute -bottom-48 -right-40 h-[600px] w-[600px] rounded-full bg-teal-100/40 blur-[130px]" />
        <div className="absolute left-[48%] top-[30%] h-[280px] w-[280px] rounded-full bg-white/80 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[470px]">
        <div className="rounded-[32px] border border-white/80 bg-white/85 p-6 shadow-[0_30px_90px_rgba(15,45,35,0.10)] backdrop-blur-2xl sm:p-10">
          {/* Brand */}
          <div className="mb-9 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#103d34] text-base font-bold text-white shadow-[0_8px_24px_rgba(16,61,52,0.18)]">
              M
            </div>

            <div>
              <p className="text-[18px] font-bold tracking-[-0.03em]">
                MoveWell
              </p>
              <p className="text-[11px] font-medium text-slate-500">
                Physiotherapy patient portal
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[13px] bg-emerald-50 text-emerald-700">
              <LockKeyhole className="h-[18px] w-[18px]" />
            </div>

            <h1 className="text-[30px] font-bold leading-tight tracking-[-0.045em]">
              Create a new password
            </h1>

            <p className="mt-2 text-[14px] leading-6 text-slate-500">
              Choose a new password to secure your MoveWell account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2.5 block text-[13px] font-semibold text-slate-800"
              >
                New password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" />

                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  required
                  className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-[14px] font-medium text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-[17px] w-[17px]" />
                  ) : (
                    <Eye className="h-[17px] w-[17px]" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-new-password"
                className="mb-2.5 block text-[13px] font-semibold text-slate-800"
              >
                Confirm new password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-slate-400" />

                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  required
                  className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-[14px] font-medium text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-[17px] w-[17px]" />
                  ) : (
                    <Eye className="h-[17px] w-[17px]" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-3 text-[11px] leading-5 text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                Your password must contain at least 8 characters.
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
              disabled={loading || !!success}
              className="group flex h-[53px] w-full items-center justify-center gap-2 rounded-2xl bg-[#103d34] px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(16,61,52,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0c322b] hover:shadow-[0_14px_30px_rgba(16,61,52,0.20)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-60"
            >
              {loading ? "Updating password..." : "Update password"}

              {!loading && !success && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-center text-[10px] font-medium text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Secure patient authentication
          </div>
        </div>
      </div>
    </main>
  );
}