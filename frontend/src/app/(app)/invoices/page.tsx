"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Invoice, InvoiceStatus } from "@/lib/api";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

const tabs: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Draft", value: "DRAFT" },
];

function formatNaira(amount: number): string {
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: () => api.getInvoices(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast("Invoice deleted", "success");
      setDeleteId(null);
    },
    onError: () => toast("Failed to delete invoice", "error"),
  });

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesTab = activeTab === "all" || inv.status === activeTab;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        inv.title.toLowerCase().includes(q) ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.client?.name.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [invoices, activeTab, search]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
          Invoices
        </h1>
        <Link href="/invoices/create">
          <Button size="md">New Invoice</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="px-4 pt-4 pb-0 border-b border-neutral-200">
          <div className="mb-3 px-1">
            <Input
              placeholder="Search by client, title, or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-0 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={[
                  "px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                  activeTab === tab.value
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-800",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description={
              search
                ? "Try adjusting your search."
                : "Create your first invoice to get started."
            }
            action={
              !search ? (
                <Link href="/invoices/create">
                  <Button>Create Invoice</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-neutral-500 border-b border-neutral-100">
              <span>Invoice</span>
              <span>Status</span>
              <span>Amount</span>
              <span>Due Date</span>
              <span></span>
            </div>
            <div className="divide-y divide-neutral-100">
              {filtered.map((invoice) => (
                <div
                  key={invoice.id}
                  className="group flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors"
                >
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={invoice.status as InvoiceStatus} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {invoice.title}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {invoice.client?.name} · {invoice.invoiceNumber}
                        </p>
                      </div>
                    </div>
                  </Link>
                  <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
                    <span className="text-sm font-semibold text-neutral-900 tabular-nums w-28 text-right">
                      {formatNaira(Number(invoice.total))}
                    </span>
                    <span className="text-sm text-neutral-500 w-24 text-right">
                      {new Date(invoice.dueDate).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {invoice.status === "DRAFT" && (
                      <button
                        onClick={() => setDeleteId(invoice.id)}
                        className="p-1.5 rounded text-neutral-400 hover:text-error-600 hover:bg-error-50 transition-colors"
                        aria-label="Delete invoice"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="p-1.5 rounded text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Invoice"
        message="This invoice will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
