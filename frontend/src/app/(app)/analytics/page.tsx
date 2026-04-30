"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FollowUpAnalytics } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { IconWhatsApp, IconEmail } from "@/components/ui/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Line,
  Legend,
} from "recharts";
import { formatNaira, formatNairaCompact, formatMonth } from "@/utils/format";
import { TEMPLATE_LABELS_SHORT, TEMPLATE_LABELS_BEST } from "@/utils/constants";

function StatCard({
  label,
  value,
  subtext,
  accent = false,
}: {
  label: string;
  value: string;
  subtext?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 flex flex-col gap-2 ${accent ? "bg-success-50 border-success-200" : "bg-white border-neutral-200"}`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-success-700" : "text-neutral-500"}`}
      >
        {label}
      </p>
      <p
        className={`text-2xl font-bold tabular-nums leading-none ${accent ? "text-success-800" : "text-neutral-900"}`}
      >
        {value}
      </p>
      {subtext && (
        <p
          className={`text-xs ${accent ? "text-success-600" : "text-neutral-400"}`}
        >
          {subtext}
        </p>
      )}
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
    <div className="mb-5">
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      {description && (
        <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
      )}
    </div>
  );
}

function TemplateTable({ data }: { data: FollowUpAnalytics["templateStats"] }) {
  if (data.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100">
        <SectionHeader
          title="Template performance"
          description="How each message type converts to payments within 48 hours of sending"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Template
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Sent
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Unique invoices
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Converted
              </th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((row) => (
              <tr
                key={row.template}
                className="hover:bg-neutral-50 transition-colors"
              >
                <td className="px-5 py-3.5 font-medium text-neutral-900">
                  {TEMPLATE_LABELS_SHORT[row.template] ?? row.template}
                </td>
                <td className="px-4 py-3.5 text-right text-neutral-600 tabular-nums">
                  {row.sentCount}
                </td>
                <td className="px-4 py-3.5 text-right text-neutral-600 tabular-nums">
                  {row.uniqueInvoicesSent}
                </td>
                <td className="px-4 py-3.5 text-right text-neutral-600 tabular-nums">
                  {row.conversions}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span
                    className={`inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold tabular-nums ${row.conversionRate >= 50 ? "bg-success-50 text-success-700" : row.conversionRate >= 25 ? "bg-warning-50 text-warning-700" : "bg-neutral-100 text-neutral-600"}`}
                  >
                    {row.conversionRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TemplateChart({ data }: { data: FollowUpAnalytics["templateStats"] }) {
  const chartData = data.map((s) => ({
    name: TEMPLATE_LABELS_SHORT[s.template] ?? s.template,
    Sent: s.uniqueInvoicesSent,
    Converted: s.conversions,
    rate: s.conversionRate,
  }));

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={4} barCategoryGap="30%">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F3F4F6"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #E5E7EB",
            }}
            formatter={(value, name) => [
              value,
              name === "Converted" ? "Paid within 48h" : "Unique invoices",
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            iconType="square"
            iconSize={8}
          />
          <Bar
            dataKey="Sent"
            name="Unique invoices"
            fill="#BAE6FD"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="Converted"
            name="Paid within 48h"
            fill="#0EA5E9"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChannelRow({
  stat,
}: {
  stat: FollowUpAnalytics["channelStats"][number];
}) {
  const isWhatsApp = stat.channel === "WHATSAPP";
  const color = isWhatsApp ? "bg-brand-green" : "bg-primary-500";
  const iconColor = isWhatsApp ? "text-brand-green" : "text-primary-500";
  const bgColor = isWhatsApp ? "bg-success-50" : "bg-primary-50";

  return (
    <div className="flex items-center gap-5 py-4 border-b border-neutral-100 last:border-0">
      <div
        className={`w-9 h-9 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}
      >
        {isWhatsApp ? (
          <IconWhatsApp className={`w-5 h-5 ${iconColor}`} />
        ) : (
          <IconEmail className={`w-5 h-5 ${iconColor}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-semibold text-neutral-900">
            {isWhatsApp ? "WhatsApp" : "Email"}
          </p>
          <span className="text-xs font-bold text-neutral-700 tabular-nums">
            {stat.conversionRate}% conversion
          </span>
        </div>
        <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${color}`}
            style={{ width: `${Math.min(stat.conversionRate, 100)}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="text-xs text-neutral-500">
            {stat.sentCount} sent
          </span>
          {!isWhatsApp && (
            <span className="text-xs text-neutral-500">
              {stat.openCount} opens
            </span>
          )}
          <span className="text-xs text-neutral-500">
            {stat.clickCount} link clicks
          </span>
          <span className="text-xs font-medium text-neutral-700">
            {stat.conversions} converted
          </span>
        </div>
      </div>
    </div>
  );
}

function MonthlyTrendChart({
  data,
}: {
  data: FollowUpAnalytics["monthlyTrend"];
}) {
  const chartData = data.map((d) => ({ ...d, month: formatMonth(d.month) }));
  const hasRevenue = chartData.some((d) => d.paymentsRecovered > 0);

  return (
    <div className="h-52">
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
            width={24}
          />
          {hasRevenue && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#9CA3AF" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatNairaCompact(v)}
              width={48}
            />
          )}
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: "1px solid #E5E7EB",
            }}
            formatter={(value, name) => {
              if (name === "paymentsRecovered")
                return [formatNaira(Number(value)), "Recovered"];
              return [value, "Follow-ups sent"];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            formatter={(v: string) =>
              v === "paymentsRecovered" ? "Recovered (₦)" : "Follow-ups sent"
            }
            iconType="square"
            iconSize={8}
          />
          <Bar
            yAxisId="left"
            dataKey="followUpsSent"
            fill="#E0F2FE"
            radius={[3, 3, 0, 0]}
          />
          {hasRevenue && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="paymentsRecovered"
              stroke="#22C55E"
              strokeWidth={2}
              dot={{ r: 3, fill: "#22C55E", strokeWidth: 0 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyAnalytics() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 px-5 py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-6 h-6 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-neutral-700 mb-1">No data yet</p>
      <p className="text-sm text-neutral-400">
        Send your first invoice to start tracking follow-up performance.
      </p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
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

  if (isLoading) return <AnalyticsSkeleton />;

  const hasData = (data?.totalFollowUpsSent ?? 0) > 0;

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
          Analytics
        </h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          Follow-up performance and payment recovery
        </p>
      </div>

      {!hasData ? (
        <EmptyAnalytics />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Recovered this month"
              value={formatNaira(data?.recoveredThisMonth ?? 0)}
              subtext="Payments within 48h of a reminder"
              accent
            />
            <StatCard
              label="Total recovered"
              value={formatNaira(data?.totalRecovered ?? 0)}
              subtext="All time via automated reminders"
            />
            <StatCard
              label="Total follow-ups sent"
              value={String(data?.totalFollowUpsSent ?? 0)}
              subtext="All time across all channels"
            />
          </div>

          {data?.bestPerformingTemplate && (
            <div className="bg-warning-50 border border-warning-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-warning-800">
                  Best performing message
                </p>
                <p className="text-sm text-warning-700 mt-0.5">
                  Your{" "}
                  <span className="font-semibold">
                    {TEMPLATE_LABELS_BEST[data.bestPerformingTemplate] ??
                      data.bestPerformingTemplate}
                  </span>{" "}
                  has the highest payment conversion rate among templates with
                  sufficient data.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(data?.templateStats?.length ?? 0) > 0 && (
              <div className="bg-white rounded-xl border border-neutral-200 p-5">
                <SectionHeader
                  title="Conversion by template"
                  description="Unique invoices sent vs payments within 48h"
                />
                <TemplateChart data={data!.templateStats} />
              </div>
            )}

            {(data?.channelStats?.length ?? 0) > 0 && (
              <div className="bg-white rounded-xl border border-neutral-200 p-5">
                <SectionHeader
                  title="Channel breakdown"
                  description="Delivery and conversion by channel"
                />
                <div>
                  {data!.channelStats.map((stat) => (
                    <ChannelRow key={stat.channel} stat={stat} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {(data?.templateStats?.length ?? 0) > 0 && (
            <TemplateTable data={data!.templateStats} />
          )}

          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <SectionHeader
              title="Monthly trend"
              description="Follow-ups sent and revenue recovered over 6 months"
            />
            <MonthlyTrendChart data={data?.monthlyTrend ?? []} />
          </div>
        </>
      )}
    </div>
  );
}
