"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, Invoice, InvoiceStatus } from "@/lib/api";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

function formatNaira(amount: number): string {
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIAL", label: "Partial" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
];

function InvoicesPageInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState(searchParams.get("status") ?? "");

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices", status],
    queryFn: () => api.getInvoices(status || undefined),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
          Invoices
        </h1>
        <Link href="/invoices/create">
          <Button>New Invoice</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="px-4 py-3 border-b border-neutral-200 flex gap-2 overflow-x-auto">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={[
                "flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                status === opt.value
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-4 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description={
              status
                ? "No invoices match this filter."
                : "Create your first invoice to get started."
            }
            action={
              !status ? (
                <Link href="/invoices/create">
                  <Button>New Invoice</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-neutral-100">
            {invoices.map((invoice) => {
              const pendingFollowUps =
                invoice.followUpSchedules?.filter((s) => s.status === "PENDING")
                  .length ?? 0;

              return (
                <Link
                  key={invoice.id}
                  href={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusBadge status={invoice.status as InvoiceStatus} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {invoice.title}
                        </p>
                        {pendingFollowUps > 0 && (
                          <span className="hidden sm:inline-flex items-center h-4 px-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium flex-shrink-0">
                            {pendingFollowUps} follow-up
                            {pendingFollowUps !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 truncate">
                        {invoice.client?.name} · {invoice.invoiceNumber}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense>
      <InvoicesPageInner />
    </Suspense>
  );
}
