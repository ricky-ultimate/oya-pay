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
} from "recharts";
import { formatNaira, formatNairaCompact, formatMonth } from "@/utils/format";
import { TEMPLATE_LABELS_SHORT, TEMPLATE_LABELS_BEST } from "@/utils/constants";

interface StatCardProps {
  label: string;
  value: string;
  subtext?: string;
  accent?: boolean;
}

function StatCard({ label, value, subtext, accent }: StatCardProps) {
  return (
    <div
      className={[
        "rounded-xl border p-5 h-24 flex flex-col justify-between",
        accent
          ? "bg-success-50 border-success-200"
          : "bg-white border-neutral-200",
      ].join(" ")}
    >
      <p
        className={[
          "text-xs font-medium uppercase tracking-wide",
          accent ? "text-success-700" : "text-neutral-500",
        ].join(" ")}
      >
        {label}
      </p>
      <div>
        <p
          className={[
            "text-2xl font-bold tabular-nums",
            accent ? "text-success-800" : "text-neutral-900",
          ].join(" ")}
        >
          {value}
        </p>
        {subtext && (
          <p
            className={[
              "text-xs mt-0.5",
              accent ? "text-success-600" : "text-neutral-400",
            ].join(" ")}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

function EmptyAnalytics() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 px-5 py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3">
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-neutral-700">No data yet</p>
      <p className="text-sm text-neutral-500 mt-1">
        Send your first invoice to start tracking follow-up performance.
      </p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
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

function TemplatePerformanceChart({
  data,
}: {
  data: FollowUpAnalytics["templateStats"];
}) {
  const chartData = data.map((s) => ({
    name: TEMPLATE_LABELS_SHORT[s.template] ?? s.template,
    Sent: s.uniqueInvoicesSent,
    Converted: s.conversions,
    rate: s.conversionRate,
  }));

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <h2 className="text-base font-semibold text-neutral-900 mb-1">
        Template Performance
      </h2>
      <p className="text-xs text-neutral-500 mb-4">
        Invoices sent per template vs payments within 48h
      </p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
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
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
              }}
              formatter={(value, name) => {
                const numValue = Number(value);
                if (name === "Converted") {
                  const rate =
                    chartData.find((d) => d.Converted === numValue)?.rate ?? 0;
                  return [`${numValue} (${rate}%)`, name];
                }
                return [numValue, name];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="square"
              iconSize={10}
            />
            <Bar dataKey="Sent" fill="#BAE6FD" radius={[3, 3, 0, 0]} />
            <Bar dataKey="Converted" fill="#0EA5E9" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ChannelCard({
  stat,
}: {
  stat: FollowUpAnalytics["channelStats"][number];
}) {
  const isWhatsApp = stat.channel === "WHATSAPP";
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {isWhatsApp ? (
          <IconWhatsApp className="w-5 h-5 text-brand-green" />
        ) : (
          <IconEmail className="w-5 h-5 text-primary-500" />
        )}
        <h3 className="text-sm font-semibold text-neutral-900">
          {isWhatsApp ? "WhatsApp" : "Email"}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-neutral-500">Sent</p>
          <p className="text-lg font-bold text-neutral-900 tabular-nums">
            {stat.sentCount}
          </p>
        </div>
        {!isWhatsApp && (
          <div>
            <p className="text-xs text-neutral-500">Opens</p>
            <p className="text-lg font-bold text-neutral-900 tabular-nums">
              {stat.openCount}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-neutral-500">Link Clicks</p>
          <p className="text-lg font-bold text-neutral-900 tabular-nums">
            {stat.clickCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Conversions</p>
          <p className="text-lg font-bold tabular-nums">
            <span className="text-success-700">{stat.conversions}</span>
            <span className="text-sm font-normal text-neutral-400 ml-1">
              ({stat.conversionRate}%)
            </span>
          </p>
        </div>
      </div>
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={[
            "h-full rounded-full transition-all",
            isWhatsApp ? "bg-brand-green" : "bg-primary-500",
          ].join(" ")}
          style={{ width: `${Math.min(stat.conversionRate, 100)}%` }}
        />
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

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <h2 className="text-base font-semibold text-neutral-900 mb-1">
        Monthly Trend
      </h2>
      <p className="text-xs text-neutral-500 mb-4">
        Follow-ups sent vs payments recovered over 6 months
      </p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={30}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatNairaCompact(v)}
              width={52}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
              }}
              formatter={(value, name) => {
                const numValue = Number(value);
                if (name === "paymentsRecovered")
                  return [formatNaira(numValue), "Recovered"];
                return [numValue, "Follow-ups Sent"];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value: string) =>
                value === "paymentsRecovered"
                  ? "Recovered (₦)"
                  : "Follow-ups Sent"
              }
              iconType="square"
              iconSize={10}
            />
            <Bar
              yAxisId="left"
              dataKey="followUpsSent"
              fill="#BAE6FD"
              radius={[3, 3, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="paymentsRecovered"
              stroke="#22C55E"
              strokeWidth={2}
              dot={{ r: 3, fill: "#22C55E" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
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
  const currentMonth = new Date().toISOString().substring(0, 7);
  const currentMonthData = data?.monthlyTrend.find(
    (m) => m.month === currentMonth,
  );
  const followUpsThisMonth = currentMonthData?.followUpsSent ?? 0;
  const recoveredThisMonth = data?.recoveredThisMonth ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
          Analytics
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
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
              value={formatNaira(recoveredThisMonth)}
              subtext="Payments within 48h of follow-up"
              accent
            />
            <StatCard
              label="Total recovered"
              value={formatNaira(data?.totalRecovered ?? 0)}
              subtext="All time via automated reminders"
            />
            <StatCard
              label="Follow-ups sent"
              value={String(data?.totalFollowUpsSent ?? 0)}
              subtext="All time"
            />
          </div>

          {(followUpsThisMonth > 0 || recoveredThisMonth > 0) && (
            <div className="bg-white rounded-xl border border-neutral-200 px-5 py-4">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                This month
              </p>
              <div className="flex items-center gap-6 flex-wrap">
                <p className="text-sm font-medium text-neutral-900 tabular-nums">
                  {followUpsThisMonth} follow-up
                  {followUpsThisMonth !== 1 ? "s" : ""} sent
                </p>
                {recoveredThisMonth > 0 && (
                  <>
                    <div className="w-px h-8 bg-neutral-200 hidden sm:block" />
                    <div>
                      <p className="text-sm font-semibold text-success-700 tabular-nums">
                        {formatNaira(recoveredThisMonth)} recovered
                      </p>
                      <p className="text-xs text-success-600">
                        via automated reminders
                      </p>
                    </div>
                  </>
                )}
                {unprotectedOutstanding > 0 && (
                  <>
                    <div className="w-px h-8 bg-neutral-200 hidden sm:block" />
                    <div>
                      <p className="text-sm font-semibold text-warning-700 tabular-nums">
                        {formatNaira(unprotectedOutstanding)} at risk
                      </p>
                      <p className="text-xs text-warning-600">
                        outstanding with no active follow-up
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {data?.bestPerformingTemplate && (
            <div className="bg-warning-50 border border-warning-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <IconBolt className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning-800">
                  Best performing message
                </p>
                <p className="text-sm text-warning-700 mt-0.5">
                  Your{" "}
                  <span className="font-medium">
                    {TEMPLATE_LABELS_BEST[data.bestPerformingTemplate] ??
                      data.bestPerformingTemplate}
                  </span>{" "}
                  has the highest payment conversion rate among templates with
                  sufficient data.
                </p>
              </div>
            </div>
          )}

          {(data?.templateStats?.length ?? 0) > 0 && (
            <TemplatePerformanceChart data={data!.templateStats} />
          )}

          {(data?.channelStats?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-base font-semibold text-neutral-900 mb-3">
                Channel Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data!.channelStats.map((stat) => (
                  <ChannelCard key={stat.channel} stat={stat} />
                ))}
              </div>
            </div>
          )}

          <MonthlyTrendChart data={data?.monthlyTrend ?? []} />
        </>
      )}
    </div>
  );
}
