"use client";

import { useQuery } from "@tanstack/react-query";
import { api, FollowUpAnalytics } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
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

const TEMPLATE_LABELS: Record<string, string> = {
  INVOICE_SENT: "Invoice Sent",
  PRE_DUE_REMINDER: "Pre-due",
  FIRST_OVERDUE: "1st Overdue",
  SECOND_OVERDUE: "2nd Overdue",
  FINAL_NOTICE: "Final Notice",
};

const BEST_TEMPLATE_LABELS: Record<string, string> = {
  PRE_DUE_REMINDER: "Pre-due Reminder",
  FIRST_OVERDUE: "First Overdue Notice",
  SECOND_OVERDUE: "Second Overdue Notice",
  FINAL_NOTICE: "Final Notice",
};

function formatNaira(amount: number): string {
  if (amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `₦${(amount / 1_000).toFixed(0)}k`;
  }
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

interface TemplateChartProps {
  data: FollowUpAnalytics["templateStats"];
}

function TemplatePerformanceChart({ data }: TemplateChartProps) {
  const chartData = data.map((s) => ({
    name: TEMPLATE_LABELS[s.template] ?? s.template,
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

interface ChannelCardProps {
  stat: FollowUpAnalytics["channelStats"][number];
}

function ChannelCard({ stat }: ChannelCardProps) {
  const isWhatsApp = stat.channel === "WHATSAPP";
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {isWhatsApp ? (
          <svg
            className="w-5 h-5 text-brand-green"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 text-primary-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
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
          style={{
            width: `${Math.min(stat.conversionRate, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

interface TrendChartProps {
  data: FollowUpAnalytics["monthlyTrend"];
}

function MonthlyTrendChart({ data }: TrendChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    month: formatMonth(d.month),
  }));

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
              tickFormatter={(v: number) => formatNaira(v)}
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
                if (name === "paymentsRecovered") {
                  return [`₦${numValue.toLocaleString("en-NG")}`, "Recovered"];
                }
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

  if (isLoading) return <AnalyticsSkeleton />;

  const hasData = (data?.totalFollowUpsSent ?? 0) > 0;

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
              value={`₦${Number(data?.recoveredThisMonth ?? 0).toLocaleString("en-NG")}`}
              subtext="Payments within 48h of follow-up"
              accent
            />
            <StatCard
              label="Total recovered"
              value={`₦${Number(data?.totalRecovered ?? 0).toLocaleString("en-NG")}`}
              subtext="All time"
            />
            <StatCard
              label="Follow-ups sent"
              value={String(data?.totalFollowUpsSent ?? 0)}
              subtext="All time"
            />
          </div>

          {data?.bestPerformingTemplate && (
            <div className="bg-warning-50 border border-warning-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5"
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
              <div>
                <p className="text-sm font-semibold text-warning-800">
                  Best performing message
                </p>
                <p className="text-sm text-warning-700 mt-0.5">
                  Your{" "}
                  <span className="font-medium">
                    {BEST_TEMPLATE_LABELS[data.bestPerformingTemplate] ??
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
