"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function AuthAwareNav() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-9 w-28 rounded-lg bg-neutral-100 animate-pulse" />;
  }

  if (user) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex items-center h-9 px-4 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <nav className="flex items-center gap-6">
      <Link
        href="/login"
        className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="inline-flex items-center h-9 px-4 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
      >
        Get started
      </Link>
    </nav>
  );
}
