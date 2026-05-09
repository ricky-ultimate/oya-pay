"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FollowUpAnalytics, DashboardStats } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { IconWhatsApp, IconEmail, IconBolt } from "@/components/ui/icons";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { formatNaira, formatNairaCompact, formatMonth } from "@/utils/format";
import { TEMPLATE_LABELS_SHORT, TEMPLATE_LABELS_BEST } from "@/utils/constants";

function KpiCard({
  label,
  value,
  subtext,
  accent,
  delta,
}: {
  label: string;
  value: string;
  subtext?: string;
  accent?: boolean;
  delta?: { value: string; positive: boolean };
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-5 flex flex-col justify-between h-28",
        accent
          ? "bg-success-50 border-success-200"
          : "bg-white border-neutral-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between">
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-success-700" : "text-neutral-500"}`}
        >
          {label}
        </p>
        {delta && (
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${delta.positive ? "bg-success-50 text-success-700" : "bg-error-50 text-error-700"}`}
          >
            {delta.positive ? "+" : ""}
            {delta.value}
          </span>
        )}
      </div>
      <div>
        <p
          className={`text-2xl font-bold tabular-nums tracking-tight ${accent ? "text-success-800" : "text-neutral-900"}`}
          style={{ letterSpacing: "-0.5px" }}
        >
          {value}
        </p>
        {subtext && (
          <p
            className={`text-xs mt-0.5 ${accent ? "text-success-600" : "text-neutral-400"}`}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

function InsightCard({
  title,
  value,
  description,
  color = "primary",
}: {
  title: string;
  value: string;
  description: string;
  color?: "primary" | "success" | "warning" | "error";
}) {
  const colors = {
    primary: {
      bg: "bg-primary-50",
      border: "border-primary-100",
      title: "text-primary-700",
      value: "text-primary-900",
      desc: "text-primary-600",
      dot: "bg-primary-500",
    },
    success: {
      bg: "bg-success-50",
      border: "border-success-100",
      title: "text-success-700",
      value: "text-success-900",
      desc: "text-success-600",
      dot: "bg-success-500",
    },
    warning: {
      bg: "bg-warning-50",
      border: "border-warning-100",
      title: "text-warning-700",
      value: "text-warning-900",
      desc: "text-warning-600",
      dot: "bg-warning-500",
    },
    error: {
      bg: "bg-error-50",
      border: "border-error-100",
      title: "text-error-700",
      value: "text-error-900",
      desc: "text-error-600",
      dot: "bg-error-500",
    },
  }[color];

  return (
    <div className={`rounded-2xl border p-5 ${colors.bg} ${colors.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${colors.title}`}
        >
          {title}
        </p>
      </div>
      <p
        className={`text-3xl font-bold tabular-nums mb-1 tracking-tight ${colors.value}`}
        style={{ letterSpacing: "-1px" }}
      >
        {value}
      </p>
      <p className={`text-xs leading-relaxed ${colors.desc}`}>{description}</p>
    </div>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-neutral-900 tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      )}
    </div>
  );
}

function EmptyAnalytics() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 px-5 py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-7 h-7 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <p className="text-base font-bold text-neutral-900 mb-1">No data yet</p>
      <p className="text-sm text-neutral-500 max-w-xs mx-auto leading-relaxed">
        Send your first invoice with follow-ups enabled to start tracking
        collection performance.
      </p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

const TEMPLATE_COLORS: Record<string, string> = {
  INVOICE_SENT: "#94A3B8",
  PRE_DUE_REMINDER: "#0EA5E9",
  FIRST_OVERDUE: "#F59E0B",
  SECOND_OVERDUE: "#EF4444",
  FINAL_NOTICE: "#7C3AED",
};

function ConversionFunnel({
  data,
}: {
  data: FollowUpAnalytics["templateStats"];
}) {
  if (data.length === 0) return null;

  const maxSent = Math.max(...data.map((d) => d.uniqueInvoicesSent), 1);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <SectionHeader
        title="Collection Funnel"
        description="Invoices sent vs payments recovered per reminder stage"
      />
      <div className="space-y-3">
        {data.map((stat) => {
          const color = TEMPLATE_COLORS[stat.template] ?? "#94A3B8";
          const sentWidth = (stat.uniqueInvoicesSent / maxSent) * 100;
          const convWidth =
            stat.uniqueInvoicesSent > 0
              ? (stat.conversions / stat.uniqueInvoicesSent) * sentWidth
              : 0;

          return (
            <div key={stat.template} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-semibold text-neutral-700">
                    {TEMPLATE_LABELS_SHORT[stat.template] ?? stat.template}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-neutral-500">
                  <span className="tabular-nums">
                    {stat.uniqueInvoicesSent} sent
                  </span>
                  <span className="font-semibold text-success-700 tabular-nums">
                    {stat.conversions} paid ({stat.conversionRate}%)
                  </span>
                </div>
              </div>
              <div className="relative h-6 bg-neutral-100 rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-lg opacity-20 transition-all"
                  style={{ width: `${sentWidth}%`, backgroundColor: color }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-lg transition-all"
                  style={{ width: `${convWidth}%`, backgroundColor: color }}
                />
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-xs font-bold text-white drop-shadow-sm">
                    {stat.conversionRate}% conversion
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChannelComparisonCard({
  stat,
}: {
  stat: FollowUpAnalytics["channelStats"][number];
}) {
  const isWhatsApp = stat.channel === "WHATSAPP";
  const conversionColor =
    stat.conversionRate >= 50
      ? "text-success-700"
      : stat.conversionRate >= 25
        ? "text-warning-700"
        : "text-neutral-600";

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${isWhatsApp ? "bg-success-50" : "bg-primary-50"}`}
          >
            {isWhatsApp ? (
              <IconWhatsApp className="w-5 h-5 text-brand-green" />
            ) : (
              <IconEmail className="w-5 h-5 text-primary-500" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              {isWhatsApp ? "WhatsApp" : "Email"}
            </h3>
            <p className="text-xs text-neutral-400">
              {stat.sentCount} messages sent
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className={`text-2xl font-bold tabular-nums tracking-tight ${conversionColor}`}
            style={{ letterSpacing: "-0.5px" }}
          >
            {stat.conversionRate}%
          </p>
          <p className="text-xs text-neutral-400">conversion</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-neutral-50 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-neutral-900 tabular-nums">
            {stat.sentCount}
          </p>
          <p className="text-xs text-neutral-500 mt-0.5">Sent</p>
        </div>
        {!isWhatsApp && (
          <div className="bg-neutral-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-neutral-900 tabular-nums">
              {stat.openCount}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">Opens</p>
          </div>
        )}
        {isWhatsApp && (
          <div className="bg-neutral-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-neutral-900 tabular-nums">
              {stat.clickCount}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">Link clicks</p>
          </div>
        )}
        <div className="bg-success-50 rounded-xl p-3 text-center border border-success-100">
          <p className="text-lg font-bold text-success-700 tabular-nums">
            {stat.conversions}
          </p>
          <p className="text-xs text-success-600 mt-0.5">Converted</p>
        </div>
        {!isWhatsApp && (
          <div className="bg-neutral-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-neutral-900 tabular-nums">
              {stat.clickCount}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">Link clicks</p>
          </div>
        )}
        {isWhatsApp && (
          <div className="bg-neutral-50 rounded-xl p-3 text-center opacity-0 pointer-events-none" />
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-neutral-500">
          <span>Conversion rate</span>
          <span className="font-semibold">{stat.conversionRate}%</span>
        </div>
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isWhatsApp ? "bg-brand-green" : "bg-primary-500"}`}
            style={{ width: `${Math.min(stat.conversionRate, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MonthlyPerformanceChart({
  data,
}: {
  data: FollowUpAnalytics["monthlyTrend"];
}) {
  const chartData = data.map((d) => ({ ...d, month: formatMonth(d.month) }));

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <SectionHeader
        title="Monthly Performance"
        description="Follow-ups sent and revenue recovered over the last 6 months"
      />
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F3F4F6"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={28}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatNairaCompact(v)}
              width={56}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              }}
              formatter={(value, name) => {
                const numValue = Number(value);
                if (name === "paymentsRecovered")
                  return [formatNaira(numValue), "Recovered"];
                return [numValue, "Follow-ups sent"];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value: string) =>
                value === "paymentsRecovered"
                  ? "Recovered (₦)"
                  : "Follow-ups sent"
              }
              iconType="square"
              iconSize={10}
            />
            <Bar
              yAxisId="left"
              dataKey="followUpsSent"
              fill="#E0F2FE"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="paymentsRecovered"
              stroke="#22C55E"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#22C55E", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TemplateBarChart({
  data,
}: {
  data: FollowUpAnalytics["templateStats"];
}) {
  const chartData = data.map((s) => ({
    name: TEMPLATE_LABELS_SHORT[s.template] ?? s.template,
    Sent: s.uniqueInvoicesSent,
    Converted: s.conversions,
    rate: s.conversionRate,
    color: TEMPLATE_COLORS[s.template] ?? "#94A3B8",
  }));

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <SectionHeader
        title="Template Comparison"
        description="Invoices sent vs payments by reminder type"
      />
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={6}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F3F4F6"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={24}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              }}
              formatter={(value, name) => {
                const numValue = Number(value);
                if (name === "Converted")
                  return [`${numValue} invoices paid`, "Converted"];
                return [`${numValue} invoices`, String(name)];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="square"
              iconSize={10}
            />
            <Bar dataKey="Sent" fill="#E0F2FE" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`sent-${index}`} fill="#E0F2FE" />
              ))}
            </Bar>
            <Bar dataKey="Converted" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`conv-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatusBreakdown({
  data,
}: {
  data: DashboardStats["overview"]["statusBreakdown"];
}) {
  const total = Object.values(data).reduce((s, v) => s + v, 0);
  if (total === 0) return null;

  const segments = [
    { label: "Paid", value: data.paid, color: "#22C55E" },
    { label: "Pending", value: data.pending, color: "#F59E0B" },
    { label: "Overdue", value: data.overdue, color: "#EF4444" },
    { label: "Partial", value: data.partial, color: "#0EA5E9" },
    { label: "Draft", value: data.draft, color: "#D1D5DB" },
    { label: "Cancelled", value: data.cancelled, color: "#E5E7EB" },
  ].filter((s) => s.value > 0);

  const pieData = segments.map((s) => ({
    name: s.label,
    value: s.value,
    color: s.color,
  }));

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5">
      <SectionHeader
        title="Invoice Status"
        description="Distribution across all invoice states"
      />
      <div className="flex items-center gap-6">
        <div className="w-36 h-36 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                }}
                formatter={(value) => [`${value} invoices`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-xs font-medium text-neutral-600">
                  {seg.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(seg.value / total) * 100}%`,
                      backgroundColor: seg.color,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-neutral-900 tabular-nums w-6 text-right">
                  {seg.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<FollowUpAnalytics>({
    queryKey: ["analytics-followups"],
    queryFn: () => api.getFollowUpAnalytics(),
    staleTime: 120_000,
  });

  const { data: dashboardData } = useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: () => api.getDashboardStats(),
    staleTime: 120_000,
  });

  if (isLoading) return <AnalyticsSkeleton />;

  const hasData = (data?.totalFollowUpsSent ?? 0) > 0;
  const unprotectedOutstanding =
    dashboardData?.overview.unprotectedOutstanding ?? 0;
  const totalRevenue = dashboardData?.overview.totalRevenue ?? 0;
  const totalInvoices = dashboardData?.overview.totalInvoices ?? 0;

  const conversionRate =
    data && data.totalFollowUpsSent > 0
      ? Math.round(
          (data.templateStats.reduce((s, t) => s + t.conversions, 0) /
            Math.max(
              1,
              data.templateStats.reduce((s, t) => s + t.uniqueInvoicesSent, 0),
            )) *
            100,
        )
      : 0;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-start justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-neutral-900 tracking-tight"
            style={{ letterSpacing: "-0.5px" }}
          >
            Analytics
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Collection performance and payment intelligence
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 text-neutral-500 text-xs font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-success-500" />
          Live data
        </div>
      </div>

      {!hasData ? (
        <EmptyAnalytics />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Recovered this month"
              value={formatNaira(data?.recoveredThisMonth ?? 0)}
              subtext="Via automated follow-ups"
              accent
            />
            <KpiCard
              label="Total recovered"
              value={formatNaira(data?.totalRecovered ?? 0)}
              subtext="All time"
            />
            <KpiCard
              label="Follow-ups sent"
              value={String(data?.totalFollowUpsSent ?? 0)}
              subtext="All time total"
            />
            <KpiCard
              label="Conversion rate"
              value={`${conversionRate}%`}
              subtext="Reminders that led to payment"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InsightCard
              title="Revenue collected"
              value={formatNaira(totalRevenue)}
              description={`Across ${totalInvoices} invoices total`}
              color="primary"
            />
            <InsightCard
              title="To collect"
              value={formatNaira(
                dashboardData?.overview.pendingCollection ?? 0,
              )}
              description="Net outstanding across open invoices"
              color="warning"
            />
            <InsightCard
              title="At risk"
              value={formatNaira(unprotectedOutstanding)}
              description="Outstanding with no active follow-up sequence"
              color={unprotectedOutstanding > 0 ? "error" : "success"}
            />
          </div>

          {data?.bestPerformingTemplate && (
            <div className="bg-warning-50 border border-warning-200 rounded-2xl px-5 py-4 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-warning-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconBolt className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-warning-900">
                  Best performing template
                </p>
                <p className="text-sm text-warning-700 mt-0.5">
                  Your{" "}
                  <span className="font-semibold">
                    {TEMPLATE_LABELS_BEST[data.bestPerformingTemplate] ??
                      data.bestPerformingTemplate}
                  </span>{" "}
                  has the highest payment conversion rate with sufficient data.
                  Consider sending more of these.
                </p>
              </div>
            </div>
          )}

          {(data?.templateStats?.length ?? 0) > 0 && (
            <>
              <ConversionFunnel data={data!.templateStats} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TemplateBarChart data={data!.templateStats} />
                {dashboardData && (
                  <StatusBreakdown
                    data={dashboardData.overview.statusBreakdown}
                  />
                )}
              </div>
            </>
          )}

          {(data?.channelStats?.length ?? 0) > 0 && (
            <div>
              <SectionHeader
                title="Channel Performance"
                description="Email vs WhatsApp delivery and conversion breakdown"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data!.channelStats.map((stat) => (
                  <ChannelComparisonCard key={stat.channel} stat={stat} />
                ))}
              </div>
            </div>
          )}

          <MonthlyPerformanceChart data={data?.monthlyTrend ?? []} />
        </>
      )}
    </div>
  );
}
