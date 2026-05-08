"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function AuthIllustration() {
  return (
    <div className="hidden lg:flex flex-col h-full bg-neutral-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="w-full h-full bg-neutral-800"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 20% 50%, rgba(14, 165, 233, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(5, 150, 105, 0.12) 0%, transparent 50%),
              radial-gradient(ellipse at 60% 80%, rgba(14, 165, 233, 0.08) 0%, transparent 50%)
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
        <div className="flex-1 flex flex-col justify-center max-w-xs">
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-medium mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-success-500" />
              Smart invoicing for African freelancers
            </div>
            <h2
              className="text-3xl font-bold text-white leading-tight mb-4"
              style={{ letterSpacing: "-1px" }}
            >
              Stop chasing invoices. Start creating.
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Automated follow-ups via Email and WhatsApp. Client intelligence.
              Paystack-powered payments.
            </p>
          </div>
          <div className="space-y-3">
            {[
              {
                icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                text: "Automated payment reminders",
              },
              {
                icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                text: "WhatsApp & Email delivery",
              },
              {
                icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                text: "Client payment intelligence",
              },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <svg
                  className="w-4 h-4 text-success-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={item.icon}
                  />
                </svg>
                <span className="text-white/60 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || user) return null;

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <AuthIllustration />
      <div className="flex flex-col items-center justify-center px-6 py-12 lg:px-12 bg-white">
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
              Welcome back
            </h1>
            <p className="text-sm text-neutral-500">
              Sign in to your account to continue
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
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
              className="w-full mt-2"
            >
              Sign in
            </Button>
          </form>
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <p className="text-center text-sm text-neutral-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
