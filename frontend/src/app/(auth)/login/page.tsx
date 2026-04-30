"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-neutral-900"
            style={{ letterSpacing: "-0.5px" }}
          >
            OyaPay
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-neutral-900 tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
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
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          {error && (
            <p className="text-sm text-error-600 bg-error-50 px-3 py-2.5 rounded-lg">
              {error}
            </p>
          )}
          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="w-full mt-1"
          >
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-primary-600 font-semibold hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
