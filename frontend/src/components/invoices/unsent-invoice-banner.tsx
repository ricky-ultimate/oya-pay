"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Invoice } from "@/types";
import { IconBolt } from "@/components/ui/icons";

export function UnsentInvoiceBanner() {
  const { data: drafts = [] } = useQuery<Invoice[]>({
    queryKey: ["invoices", "DRAFT"],
    queryFn: () => api.getInvoices("DRAFT"),
    staleTime: 30_000,
  });

  if (drafts.length === 0) return null;

  const single = drafts.length === 1;
  const target = single
    ? `/invoices/${drafts[0]!.id}?action=send`
    : "/invoices?status=DRAFT";

  return (
    <Link
      href={target}
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-warning-50 border border-warning-200 hover:bg-warning-100 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0">
          <IconBolt className="w-4 h-4 text-warning-700" />
        </div>
        <p className="text-sm font-medium text-warning-800">
          You have {drafts.length} unsent invoice
          {drafts.length !== 1 ? "s" : ""}. Send {single ? "it" : "them"} now.
        </p>
      </div>
      <span className="text-xs font-semibold text-warning-700 flex-shrink-0">
        {single ? "Send" : "View"}
      </span>
    </Link>
  );
}
