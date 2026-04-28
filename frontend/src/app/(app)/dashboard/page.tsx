"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api, DashboardStats, InvoiceStatus } from "@/lib/api";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("en-NG", { month: "short" });
}

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
}

function StatCard({ label, value, subtext }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 h-24 flex flex-col justify-between">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <div>
        <p className="text-2xl font-bold text-neutral-900 tabular-nums">
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-neutral-400 mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => api.getDashboardStats(),
  });

  if (isLoading) return <DashboardSkeleton />;

  const overview = data?.overview;
  const recentInvoices = data?.recentInvoices ?? [];
  const monthlyRevenue = data?.monthlyRevenue ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
          Dashboard
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {new Date().toLocaleDateString("en-NG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Invoices"
          value={String(overview?.totalInvoices ?? 0)}
        />
        <StatCard
          label="Total Revenue"
          value={formatNaira(overview?.totalRevenue ?? 0)}
        />
        <StatCard
          label="Outstanding"
          value={formatNaira(overview?.outstandingAmount ?? 0)}
        />
        <StatCard
          label="Overdue"
          value={String(overview?.statusBreakdown.overdue ?? 0)}
        />
      </div>

      {monthlyRevenue.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="text-base font-semibold text-neutral-900 mb-4">
            Monthly Revenue
          </h2>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyRevenue.map((d) => ({
                  ...d,
                  month: formatMonth(d.month),
                }))}
              >
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [formatNaira(value), "Revenue"]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">
            Recent Invoices
          </h2>
          <Link
            href="/invoices"
            className="text-sm text-primary-600 font-medium hover:underline"
          >
            View all
          </Link>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-neutral-500">
            No invoices yet.{" "}
            <Link
              href="/invoices/create"
              className="text-primary-600 font-medium hover:underline"
            >
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoices/${invoice.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={invoice.status as InvoiceStatus} />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {invoice.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {invoice.client.name} · {invoice.invoiceNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-semibold text-neutral-900 tabular-nums">
                    {formatNaira(Number(invoice.total))}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Due{" "}
                    {new Date(invoice.dueDate).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
