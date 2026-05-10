"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Client,
  ClientStats,
  Invoice,
  InvoiceStatus,
  InvoiceType,
} from "@/types";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReliabilityBadge } from "@/components/ui/reliability-badge";
import { formatNaira } from "@/utils/format";
import { INVOICE_TYPE_CONFIG, INVOICE_TYPE_ORDER } from "@/utils/constants";

function InvoiceTypeBadge({ type }: { type: InvoiceType }) {
  const config = INVOICE_TYPE_CONFIG[type];
  if (!config) return null;
  return (
    <span
      className={`inline-flex items-center h-4 px-1.5 rounded text-[10px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
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

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  return (
    <Link
      href={`/invoices/${invoice.id}`}
      className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <StatusBadge status={invoice.status as InvoiceStatus} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-medium text-neutral-900 truncate">
              {invoice.title}
            </p>
            <InvoiceTypeBadge type={invoice.invoiceType} />
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
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

  const allInvoices = (client.invoices ?? []) as Invoice[];

  const projectMap = new Map<
    string,
    { id: string; name: string; invoices: Invoice[] }
  >();
  const standaloneInvoices: Invoice[] = [];

  for (const invoice of allInvoices) {
    if (invoice.projectId && invoice.project) {
      const existing = projectMap.get(invoice.projectId);
      if (existing) {
        existing.invoices.push(invoice);
      } else {
        projectMap.set(invoice.projectId, {
          id: invoice.projectId,
          name: invoice.project.name,
          invoices: [invoice],
        });
      }
    } else {
      standaloneInvoices.push(invoice);
    }
  }

  const projectGroups = Array.from(projectMap.values());

  const sortByType = (invoices: Invoice[]) =>
    [...invoices].sort(
      (a, b) =>
        (INVOICE_TYPE_ORDER[a.invoiceType] ?? 3) -
          (INVOICE_TYPE_ORDER[b.invoiceType] ?? 3) ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

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
          href={`/projects/create?clientId=${client.id}`}
          className="flex-1"
        >
          <Button variant="secondary" className="w-full">
            New Project
          </Button>
        </Link>
        <Link
          href={`/invoices/create?clientId=${client.id}`}
          className="flex-1"
        >
          <Button className="w-full">New Invoice</Button>
        </Link>
      </div>

      {projectGroups.length > 0 && (
        <div className="flex flex-col gap-3">
          {projectGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/60">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
                    />
                  </svg>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    {group.name}
                  </h3>
                  <span className="text-xs text-neutral-400">
                    {group.invoices.length} invoice
                    {group.invoices.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <Link
                  href={`/projects/${group.id}`}
                  className="text-xs text-primary-600 font-semibold hover:underline"
                >
                  View project
                </Link>
              </div>
              <div className="divide-y divide-neutral-100">
                {sortByType(group.invoices).map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {standaloneInvoices.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-900">
              {projectGroups.length > 0
                ? "Standalone Invoices"
                : "Invoice History"}
            </h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {standaloneInvoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </div>
      )}

      {allInvoices.length === 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 px-5 py-10 text-center text-sm text-neutral-500">
          No invoices yet for this client.
        </div>
      )}
    </div>
  );
}
