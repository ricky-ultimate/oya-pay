"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type {
  DashboardStats,
  InvoiceStatus,
  NeedsAttentionEntry,
} from "@/types";
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
import { useToast } from "@/components/ui/toast";
import { formatNaira, formatMonth } from "@/utils/format";
import {
  TEMPLATE_LABELS,
  NEEDS_ATTENTION_REASON_LABELS,
} from "@/utils/constants";

function MetricCard({
  label,
  value,
  subtext,
  variant = "default",
}: {
  label: string;
  value: string;
  subtext?: string;
  variant?: "default" | "success" | "warning" | "error" | "neutral";
}) {
  const styles = {
    default: {
      container: "bg-white border-neutral-200",
      label: "text-neutral-500",
      value: "text-neutral-900",
      subtext: "text-neutral-400",
    },
    success: {
      container: "bg-success-50 border-success-200",
      label: "text-success-700",
      value: "text-success-800",
      subtext: "text-success-600",
    },
    warning: {
      container: "bg-warning-50 border-warning-200",
      label: "text-warning-700",
      value: "text-warning-800",
      subtext: "text-warning-600",
    },
    error: {
      container: "bg-error-50 border-error-200",
      label: "text-error-700",
      value: "text-error-800",
      subtext: "text-error-600",
    },
    neutral: {
      container: "bg-neutral-50 border-neutral-200",
      label: "text-neutral-500",
      value: "text-neutral-700",
      subtext: "text-neutral-400",
    },
  }[variant];

  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-3 ${styles.container}`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${styles.label}`}
      >
        {label}
      </p>
      <div>
        <p
          className={`text-2xl font-bold tabular-nums leading-none ${styles.value}`}
        >
          {value}
        </p>
        {subtext && (
          <p className={`text-xs mt-1.5 ${styles.subtext}`}>{subtext}</p>
        )}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

function NeedsAttentionRow({
  entry,
  onAction,
  isLoading,
}: {
  entry: NeedsAttentionEntry;
  onAction: (entry: NeedsAttentionEntry) => void;
  isLoading: boolean;
}) {
  const router = useRouter();
  const isPaused = entry.reason === "sequence_paused";

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors">
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={() => router.push(`/invoices/${entry.invoiceId}`)}
      >
        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 text-xs font-bold flex-shrink-0">
          {entry.clientName[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {entry.clientName}
            </p>
            {entry.daysOverdue > 0 && (
              <span className="text-xs text-error-600 font-semibold flex-shrink-0">
                {entry.daysOverdue}d overdue
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-neutral-500 truncate">{entry.title}</p>
            <span className="text-xs bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded font-medium flex-shrink-0 hidden sm:inline">
              {NEEDS_ATTENTION_REASON_LABELS[entry.reason]}
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm font-semibold text-neutral-900 tabular-nums flex-shrink-0">
        {formatNaira(entry.amount)}
      </p>
      <button
        onClick={() => onAction(entry)}
        disabled={isLoading}
        className={[
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 disabled:opacity-50",
          isPaused
            ? "bg-success-50 text-success-700 hover:bg-success-100"
            : "bg-primary-50 text-primary-700 hover:bg-primary-100",
        ].join(" ")}
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        {isPaused ? "Resume" : "Chase"}
      </button>
    </div>
  );
}

function RecentInvoiceRow({
  invoice,
  onChase,
  isLoading,
}: {
  invoice: DashboardStats["recentInvoices"][number];
  onChase: (id: string) => void;
  isLoading: boolean;
}) {
  const isActionable = !["PAID", "CANCELLED", "DRAFT"].includes(invoice.status);
  const hasActiveSequence = (invoice.followUpSchedules?.length ?? 0) > 0;

  return (
    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50 transition-colors group">
      <Link
        href={`/invoices/${invoice.id}`}
        className="flex items-center gap-3 min-w-0 flex-1"
      >
        <StatusBadge status={invoice.status as InvoiceStatus} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">
            {invoice.title}
          </p>
          <p className="text-xs text-neutral-500 truncate">
            {invoice.client.name} · {invoice.invoiceNumber}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
        <div className="text-right hidden sm:block">
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
        {isActionable && !hasActiveSequence && (
          <button
            onClick={() => onChase(invoice.id)}
            disabled={isLoading}
            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold hover:bg-primary-100 disabled:opacity-50"
          >
            Chase
          </button>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => api.getDashboardStats(),
  });

  const resumeMutation = useMutation({
    mutationFn: (invoiceId: string) => api.resumeFollowUps(invoiceId),
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      toast("Follow-up sequence resumed", "success");
    },
    onError: () => toast("Failed to resume follow-ups", "error"),
  });

  const handleNeedsAttentionAction = (entry: NeedsAttentionEntry) => {
    if (entry.reason === "sequence_paused") {
      resumeMutation.mutate(entry.invoiceId);
    } else {
      router.push(`/invoices/${entry.invoiceId}/followups`);
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  const overview = data?.overview;
  const recentInvoices = data?.recentInvoices ?? [];
  const monthlyRevenue = data?.monthlyRevenue ?? [];
  const needsAttention = data?.needsAttention ?? [];
  const nextFollowUp = data?.nextFollowUp ?? null;
  const totalRecovered = overview?.totalRecovered ?? 0;
  const agentsActive = overview?.agentsActive ?? 0;
  const pendingCollection = overview?.pendingCollection ?? 0;
  const atRiskAmount = overview?.atRiskAmount ?? 0;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          {new Date().toLocaleDateString("en-NG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="To collect"
          value={formatNaira(pendingCollection)}
          subtext={`${(overview?.statusBreakdown.pending ?? 0) + (overview?.statusBreakdown.partial ?? 0) + (overview?.statusBreakdown.overdue ?? 0)} invoices outstanding`}
        />
        <MetricCard
          label="At risk"
          value={formatNaira(atRiskAmount)}
          subtext="Overdue 14+ days"
          variant={atRiskAmount > 0 ? "error" : "neutral"}
        />
        <MetricCard
          label="Active agents"
          value={String(agentsActive)}
          subtext="Sequences running"
          variant={agentsActive > 0 ? "success" : "neutral"}
        />
        <MetricCard
          label="Recovered"
          value={formatNaira(totalRecovered)}
          subtext="Via automated reminders"
          variant={totalRecovered > 0 ? "success" : "neutral"}
        />
      </div>

      {nextFollowUp && (
        <Link
          href={`/invoices/${nextFollowUp.invoiceId}/followups`}
          className="bg-primary-50 border border-primary-100 rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:bg-primary-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-900">
                Next:{" "}
                {TEMPLATE_LABELS[nextFollowUp.template] ??
                  nextFollowUp.template}{" "}
                → {nextFollowUp.clientName}
              </p>
              <p className="text-xs text-primary-600 mt-0.5">
                {nextFollowUp.invoiceNumber} · {nextFollowUp.channel} ·{" "}
                {new Date(nextFollowUp.scheduledAt).toLocaleDateString(
                  "en-NG",
                  { weekday: "short", day: "numeric", month: "short" },
                )}
              </p>
            </div>
          </div>
          <svg
            className="w-4 h-4 text-primary-400 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      )}

      {needsAttention.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-neutral-900">
                Needs attention
              </h2>
              <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-error-50 text-error-700 text-xs font-bold">
                {needsAttention.length}
              </span>
            </div>
            <Link
              href="/invoices"
              className="text-xs text-primary-600 font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {needsAttention.map((entry) => (
              <NeedsAttentionRow
                key={entry.invoiceId}
                entry={entry}
                onAction={handleNeedsAttentionAction}
                isLoading={resumeMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {monthlyRevenue.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">
            Monthly revenue
          </h2>
          <div className="h-48">
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
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                  width={44}
                />
                <Tooltip
                  formatter={(value) => [formatNaira(Number(value)), "Revenue"]}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900">
            Recent invoices
          </h2>
          <Link
            href="/invoices"
            className="text-xs text-primary-600 font-medium hover:underline"
          >
            View all
          </Link>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-neutral-500 mb-3">No invoices yet.</p>
            <Link
              href="/invoices/create"
              className="text-sm font-semibold text-primary-600 hover:underline"
            >
              Create your first invoice
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentInvoices.map((invoice) => (
              <RecentInvoiceRow
                key={invoice.id}
                invoice={invoice}
                onChase={(id) => router.push(`/invoices/${id}/followups`)}
                isLoading={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
