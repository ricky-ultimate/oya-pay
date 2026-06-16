"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    href: "/invoices",
    label: "Invoices",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    href: "/clients",
    label: "Clients",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className="hidden lg:flex flex-col w-56 h-screen bg-white border-r border-neutral-100 fixed left-0 top-0 z-[1020]"
      style={{ boxShadow: "1px 0 0 0 #F3F4F6" }}
    >
      <div className="px-5 h-16 flex items-center border-b border-neutral-100">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center transition-transform group-hover:scale-105">
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
            className="text-base font-bold tracking-tight text-neutral-900"
            style={{ letterSpacing: "-0.4px" }}
          >
            OyaPay
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <p className="px-3 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-1">
          Menu
        </p>
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800",
              ].join(" ")}
            >
              <svg
                className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? "text-white" : "text-neutral-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={active ? 2 : 1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={item.icon}
                />
              </svg>
              {item.label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/40" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-neutral-100">
        <Link
          href="/profile"
          className={[
            "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-150",
            pathname.startsWith("/profile")
              ? "bg-neutral-100"
              : "hover:bg-neutral-50",
          ].join(" ")}
        >
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-primary-100">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-neutral-800 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
          </div>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-neutral-400 hover:text-error-600 hover:bg-error-50 transition-all duration-150"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
