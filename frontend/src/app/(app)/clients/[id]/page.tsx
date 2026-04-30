// frontend/src/app/(app)/clients/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, Client, ClientStats, InvoiceStatus } from "@/lib/api";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReliabilityBadge } from "@/components/ui/reliability-badge";

function formatNaira(amount: number): string {
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-lg font-bold text-neutral-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-neutral-400">{sub}</p>}
    </div>
  );
}

function PaymentIntelligencePanel({ stats }: { stats: ClientStats }) {
  const avgLabel =
    stats.avgDaysToPayment === null
      ? "No paid invoices yet"
      : stats.avgDaysToPayment <= 0
        ? `${Math.abs(stats.avgDaysToPayment)} days early on average`
        : `${stats.avgDaysToPayment} days after due date on average`;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Payment Intelligence
        </h2>
        <ReliabilityBadge score={stats.reliabilityScore} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <StatTile
          label="Invoices"
          value={String(stats.totalInvoices)}
          sub="total"
        />
        <StatTile
          label="Paid"
          value={String(stats.paidInvoices)}
          sub={
            stats.totalInvoices > 0
              ? `${Math.round((stats.paidInvoices / stats.totalInvoices) * 100)}%`
              : undefined
          }
        />
        <StatTile
          label="Overdue"
          value={String(stats.overdueInvoices)}
          sub="currently"
        />
        <StatTile
          label="Times chased"
          value={String(stats.totalChases)}
          sub="follow-ups sent"
        />
      </div>

      <div className="bg-neutral-50 rounded-lg px-4 py-3 text-sm text-neutral-700">
        {avgLabel}
      </div>
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: client, isLoading } = useQuery<Client>({
    queryKey: ["client", id],
    queryFn: () => api.getClient(id),
  });

  const { data: stats } = useQuery<ClientStats>({
    queryKey: ["client-stats", id],
    queryFn: () => api.getClientStats(id),
    enabled: !!client,
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
            {client.name[0]?.toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-neutral-900">
                {client.name}
              </h1>
              {stats && stats.reliabilityScore !== "no_data" && (
                <ReliabilityBadge score={stats.reliabilityScore} />
              )}
            </div>
            <p className="text-sm text-neutral-500">{client.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-3">
          Contact Details
        </h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex gap-2">
            <span className="text-neutral-500 w-16 flex-shrink-0">Email</span>
            <a
              href={`mailto:${client.email}`}
              className="text-primary-600 hover:underline"
            >
              {client.email}
            </a>
          </div>
          {client.phone && (
            <div className="flex gap-2">
              <span className="text-neutral-500 w-16 flex-shrink-0">Phone</span>
              <a
                href={`tel:${client.phone}`}
                className="text-neutral-900 hover:underline"
              >
                {client.phone}
              </a>
            </div>
          )}
          {client.address && (
            <div className="flex gap-2">
              <span className="text-neutral-500 w-16 flex-shrink-0">
                Address
              </span>
              <span className="text-neutral-900">{client.address}</span>
            </div>
          )}
        </div>
      </div>

      {stats && <PaymentIntelligencePanel stats={stats} />}

      <div className="flex gap-3">
        <Link
          href={`/invoices/create?clientId=${client.id}`}
          className="flex-1"
        >
          <Button className="w-full">Create Invoice</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="px-5 py-3.5 border-b border-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-900">
            Invoice History
          </h2>
        </div>
        {!client.invoices?.length ? (
          <div className="px-5 py-10 text-center text-sm text-neutral-500">
            No invoices yet for this client.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {client.invoices.map((invoice) => (
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
                      {invoice.invoiceNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatNaira(Number(invoice.total))}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {new Date(invoice.dueDate).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
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
