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

interface PipelineCardProps {
  label: string;
  value: string;
  subtext?: string;
  variant?: "default" | "success" | "warning" | "error" | "neutral";
  size?: "normal" | "large";
}

function PipelineCard({
  label,
  value,
  subtext,
  variant = "default",
  size = "normal",
}: PipelineCardProps) {
  const containerClass = {
    default: "bg-white border-neutral-200",
    success: "bg-success-50 border-success-200",
    warning: "bg-warning-50 border-warning-200",
    error: "bg-error-50 border-error-200",
    neutral: "bg-neutral-50 border-neutral-200",
  }[variant];

  const labelClass = {
    default: "text-neutral-500",
    success: "text-success-700",
    warning: "text-warning-700",
    error: "text-error-700",
    neutral: "text-neutral-500",
  }[variant];

  const valueClass = {
    default: "text-neutral-900",
    success: "text-success-800",
    warning: "text-warning-800",
    error: "text-error-800",
    neutral: "text-neutral-700",
  }[variant];

  const subtextClass = {
    default: "text-neutral-400",
    success: "text-success-600",
    warning: "text-warning-600",
    error: "text-error-600",
    neutral: "text-neutral-400",
  }[variant];

  return (
    <div
      className={`rounded-xl border p-5 flex flex-col justify-between ${containerClass} ${size === "large" ? "h-28" : "h-24"}`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide ${labelClass}`}
      >
        {label}
      </p>
      <div>
        <p
          className={`font-bold tabular-nums ${valueClass} ${size === "large" ? "text-3xl" : "text-2xl"}`}
        >
          {value}
        </p>
        {subtext && (
          <p className={`text-xs mt-0.5 ${subtextClass}`}>{subtext}</p>
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
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}

interface NeedsAttentionRowProps {
  entry: NeedsAttentionEntry;
  onChaseNow: (invoiceId: string) => void;
  isChasing: boolean;
}

function NeedsAttentionRow({
  entry,
  onChaseNow,
  isChasing,
}: NeedsAttentionRowProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-colors">
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={() => router.push(`/invoices/${entry.invoiceId}`)}
      >
        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 text-sm font-semibold flex-shrink-0">
          {entry.clientName[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">
            {entry.clientName}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-neutral-500 truncate">{entry.title}</p>
            <span className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
              {NEEDS_ATTENTION_REASON_LABELS[entry.reason]}
            </span>
            {entry.daysOverdue > 0 && (
              <span className="text-xs text-error-600 font-medium flex-shrink-0">
                {entry.daysOverdue}d overdue
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right flex-shrink-0 mr-2">
        <p className="text-sm font-semibold text-neutral-900 tabular-nums">
          {formatNaira(entry.amount)}
        </p>
      </div>
      <button
        onClick={() => onChaseNow(entry.invoiceId)}
        disabled={isChasing}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
        Chase now
      </button>
    </div>
  );
}

interface OverdueClientRowProps {
  entry: DashboardStats["topOverdueClients"][number];
}

function OverdueClientRow({ entry }: OverdueClientRowProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50 transition-colors">
      <Link
        href={`/clients/${entry.clientId}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <div className="w-8 h-8 rounded-full bg-error-50 flex items-center justify-center text-error-700 text-sm font-semibold flex-shrink-0">
          {entry.name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">
            {entry.name}
          </p>
          <p className="text-xs text-neutral-500">
            {entry.invoiceCount} invoice{entry.invoiceCount !== 1 ? "s" : ""}{" "}
            &middot;{" "}
            {entry.oldestDueDays > 0
              ? `${entry.oldestDueDays}d overdue`
              : "due soon"}
          </p>
        </div>
      </Link>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-error-700 tabular-nums">
          {formatNaira(entry.totalOutstanding)}
        </p>
      </div>
      <button
        onClick={() =>
          router.push(`/invoices/${entry.mostOverdueInvoiceId}/followups`)
        }
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning-50 text-warning-700 text-xs font-medium hover:bg-warning-100 transition-colors flex-shrink-0"
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
        Remind
      </button>
    </div>
  );
}

interface RecentInvoiceRowProps {
  invoice: DashboardStats["recentInvoices"][number];
  onChaseNow: (invoiceId: string) => void;
  isChasing: boolean;
}

function RecentInvoiceRow({
  invoice,
  onChaseNow,
  isChasing,
}: RecentInvoiceRowProps) {
  const isActionable =
    invoice.status !== "PAID" &&
    invoice.status !== "CANCELLED" &&
    invoice.status !== "DRAFT";
  const hasActiveSequence = (invoice.followUpSchedules?.length ?? 0) > 0;

  return (
    <div className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50 transition-colors group">
      <Link
        href={`/invoices/${invoice.id}`}
        className="flex items-center gap-3 min-w-0 flex-1"
      >
        <StatusBadge status={invoice.status as InvoiceStatus} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900">
            {invoice.title}
          </p>
          <p className="text-xs text-neutral-500">
            {invoice.client.name} &middot; {invoice.invoiceNumber}
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
            onClick={() => onChaseNow(invoice.id)}
            disabled={isChasing}
            className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-xs font-medium hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-3 h-3"
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

  const handleChaseNow = (
    invoiceId: string,
    reason?: NeedsAttentionEntry["reason"],
  ) => {
    if (reason === "sequence_paused") {
      resumeMutation.mutate(invoiceId);
    } else {
      router.push(`/invoices/${invoiceId}/followups`);
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  const overview = data?.overview;
  const recentInvoices = data?.recentInvoices ?? [];
  const monthlyRevenue = data?.monthlyRevenue ?? [];
  const topOverdueClients = data?.topOverdueClients ?? [];
  const needsAttention = data?.needsAttention ?? [];
  const nextFollowUp = data?.nextFollowUp ?? null;
  const totalRecovered = overview?.totalRecovered ?? 0;
  const agentsActive = overview?.agentsActive ?? 0;
  const pendingCollection = overview?.pendingCollection ?? 0;
  const atRiskAmount = overview?.atRiskAmount ?? 0;

  const isChasing = resumeMutation.isPending;

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
        <PipelineCard
          label="Pending collection"
          value={formatNaira(pendingCollection)}
          subtext={`${(overview?.statusBreakdown.pending ?? 0) + (overview?.statusBreakdown.partial ?? 0) + (overview?.statusBreakdown.overdue ?? 0)} invoices outstanding`}
        />
        <PipelineCard
          label="At risk"
          value={formatNaira(atRiskAmount)}
          subtext="Overdue more than 14 days"
          variant={atRiskAmount > 0 ? "error" : "neutral"}
        />
        <PipelineCard
          label="Agents active"
          value={String(agentsActive)}
          subtext="Invoices with live sequences"
          variant={agentsActive > 0 ? "success" : "neutral"}
        />
        <PipelineCard
          label="Recovered"
          value={formatNaira(totalRecovered)}
          subtext="Via automated reminders"
          variant={totalRecovered > 0 ? "success" : "neutral"}
        />
      </div>

      {nextFollowUp && (
        <Link
          href={`/invoices/${nextFollowUp.invoiceId}/followups`}
          className="bg-primary-50 border border-primary-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:bg-primary-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
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
                to {nextFollowUp.clientName}
              </p>
              <p className="text-xs text-primary-700 mt-0.5">
                {nextFollowUp.invoiceNumber} &middot; {nextFollowUp.channel}{" "}
                &middot;{" "}
                {new Date(nextFollowUp.scheduledAt).toLocaleDateString(
                  "en-NG",
                  {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  },
                )}
              </p>
            </div>
          </div>
          <svg
            className="w-4 h-4 text-primary-500 flex-shrink-0"
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-900">
                Needs attention
              </h2>
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-error-50 text-error-700 text-xs font-medium">
                {needsAttention.length}
              </span>
            </div>
            <Link
              href="/invoices"
              className="text-sm text-primary-600 font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {needsAttention.map((entry) => (
              <NeedsAttentionRow
                key={entry.invoiceId}
                entry={entry}
                onChaseNow={(id) => handleChaseNow(id, entry.reason)}
                isChasing={isChasing}
              />
            ))}
          </div>
        </div>
      )}

      {topOverdueClients.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-neutral-900">
                Overdue clients
              </h2>
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-error-50 text-error-700 text-xs font-medium">
                {topOverdueClients.length}
              </span>
            </div>
            <Link
              href="/invoices?status=OVERDUE"
              className="text-sm text-primary-600 font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {topOverdueClients.map((entry) => (
              <OverdueClientRow key={entry.clientId} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {totalRecovered > 0 && (
        <div className="bg-success-50 border border-success-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-success-100 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-success-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-success-900">
                {formatNaira(totalRecovered)} recovered via automated follow-ups
              </p>
              <p className="text-xs text-success-700 mt-0.5">
                Payments received within 48 hours of a reminder
              </p>
            </div>
          </div>
          <Link
            href="/analytics"
            className="text-xs font-medium text-success-700 hover:text-success-900 flex-shrink-0 hover:underline"
          >
            View details
          </Link>
        </div>
      )}

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
                  formatter={(value) => [formatNaira(Number(value)), "Revenue"]}
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
              <RecentInvoiceRow
                key={invoice.id}
                invoice={invoice}
                onChaseNow={(id) => handleChaseNow(id, "no_sequence")}
                isChasing={isChasing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
