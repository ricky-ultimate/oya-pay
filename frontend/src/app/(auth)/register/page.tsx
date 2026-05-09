"use client";

import { useState, FormEvent, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Phase = "form" | "verify";

function AuthIllustration() {
  return (
    <div className="hidden lg:flex flex-col h-full bg-neutral-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 30% 30%, rgba(5, 150, 105, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 70%, rgba(14, 165, 233, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 10%, rgba(234, 179, 8, 0.08) 0%, transparent 50%),
              linear-gradient(180deg, #111827 0%, #0f172a 100%)
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.5) 39px, rgba(255,255,255,0.5) 40px)`,
          }}
        />
      </div>
      <div className="relative z-10 flex flex-col h-full p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <span
            className="text-white font-bold text-lg tracking-tight"
            style={{ letterSpacing: "-0.4px" }}
          >
            OyaPay
          </span>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-medium mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-success-500" />
              Join freelancers across Africa
            </div>
            <h2
              className="text-3xl font-bold text-white leading-tight mb-4"
              style={{ letterSpacing: "-1px" }}
            >
              Get paid faster. Every time.
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Set up your account in 60 seconds. Your first invoice in under 2
              minutes.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "48h", label: "Avg payment time" },
              { value: "94%", label: "Collection rate" },
              { value: "2M+", label: "Monthly recovered" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className="text-white font-bold text-lg tabular-nums"
                  style={{ letterSpacing: "-0.5px" }}
                >
                  {stat.value}
                </p>
                <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationPhase({
  email,
  onSuccess,
}: {
  email: string;
  onSuccess: () => void;
}) {
  const { verifyEmail } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await verifyEmail({ email, code });
      onSuccess();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Verification failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResendMessage("");
    setError("");
    setResending(true);
    try {
      await api.resendVerificationCode(email);
      setResendMessage("A new code has been sent to your email.");
      setCode("");
      inputRef.current?.focus();
      startCooldown(60);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to resend code.";
      if (message.startsWith("Please wait")) {
        const match = message.match(/(\d+) second/);
        if (match?.[1]) startCooldown(parseInt(match[1], 10));
      }
      setError(message);
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    if (error) setError("");
  };

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1***$2");

  return (
    <div className="w-full max-w-sm">
      <div className="lg:hidden flex items-center gap-2 mb-10">
        <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <span
          className="font-bold text-lg text-neutral-900 tracking-tight"
          style={{ letterSpacing: "-0.4px" }}
        >
          OyaPay
        </span>
      </div>

      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
          <svg
            className="w-6 h-6 text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <h1
          className="text-2xl font-bold text-neutral-900 tracking-tight mb-1.5"
          style={{ letterSpacing: "-0.5px" }}
        >
          Check your email
        </h1>
        <p className="text-sm text-neutral-500 leading-relaxed">
          We sent a 6-digit verification code to{" "}
          <span className="font-semibold text-neutral-700">{maskedEmail}</span>.
          Enter it below to activate your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-neutral-700">
            Verification code
          </label>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            maxLength={6}
            className={[
              "w-full h-14 rounded-xl border text-center text-3xl font-bold tabular-nums tracking-widest text-neutral-900 bg-white placeholder-neutral-200 transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              error
                ? "border-error-400 focus:ring-error-500 bg-error-50/30"
                : "border-neutral-200 hover:border-neutral-300",
            ].join(" ")}
            style={{ letterSpacing: "0.5em" }}
          />
          <p className="text-xs text-neutral-400 text-right">
            {code.length}/6 digits
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-error-50 border border-error-100">
            <svg
              className="w-4 h-4 text-error-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <p className="text-sm text-error-700">{error}</p>
          </div>
        )}

        {resendMessage && !error && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-success-50 border border-success-100">
            <svg
              className="w-4 h-4 text-success-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            <p className="text-sm text-success-700">{resendMessage}</p>
          </div>
        )}

        <Button
          type="submit"
          loading={submitting}
          disabled={code.length !== 6}
          size="lg"
          className="w-full mt-2"
        >
          Verify email
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-neutral-100 flex items-center justify-between">
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || resending}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors disabled:text-neutral-400 disabled:cursor-not-allowed"
        >
          {resending
            ? "Sending..."
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend code"}
        </button>
        <Link
          href="/register"
          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
          onClick={() => window.location.reload()}
        >
          Start over
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    businessName: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim()) {
      setError("A phone number is required for WhatsApp delivery.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const result = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        ...(form.businessName && { businessName: form.businessName }),
      });
      setPendingEmail(result.email);
      setPhase("verify");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || user) return null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthIllustration />
      <div className="flex flex-col items-center justify-center px-6 py-12 lg:px-12 bg-white overflow-y-auto">
        {phase === "verify" ? (
          <VerificationPhase
            email={pendingEmail}
            onSuccess={() => router.push("/dashboard")}
          />
        ) : (
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center gap-2 mb-10">
              <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <span
                className="font-bold text-lg text-neutral-900 tracking-tight"
                style={{ letterSpacing: "-0.4px" }}
              >
                OyaPay
              </span>
            </div>
            <div className="mb-8">
              <h1
                className="text-2xl font-bold text-neutral-900 tracking-tight mb-1.5"
                style={{ letterSpacing: "-0.5px" }}
              >
                Create your account
              </h1>
              <p className="text-sm text-neutral-500">
                Start getting paid on time. Free forever.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input
                label="Full name"
                type="text"
                value={form.name}
                onChange={update("name")}
                placeholder="Chidi Okeke"
                required
                autoComplete="name"
              />
              <Input
                label="Email address"
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={update("password")}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
                minLength={8}
              />
              <Input
                label="WhatsApp number"
                type="tel"
                value={form.phone}
                onChange={update("phone")}
                placeholder="08012345678"
                autoComplete="tel"
                required
              />
              <div className="pt-1 border-t border-neutral-100">
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide mb-3">
                  Optional details
                </p>
                <Input
                  label="Business name"
                  type="text"
                  value={form.businessName}
                  onChange={update("businessName")}
                  placeholder="Okeke Designs"
                  autoComplete="organization"
                />
              </div>
              {error && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-error-50 border border-error-100">
                  <svg
                    className="w-4 h-4 text-error-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                  </svg>
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              )}
              <Button
                type="submit"
                loading={submitting}
                size="lg"
                className="w-full mt-1"
              >
                Continue
              </Button>
            </form>
            <div className="mt-6 pt-6 border-t border-neutral-100">
              <p className="text-center text-sm text-neutral-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
