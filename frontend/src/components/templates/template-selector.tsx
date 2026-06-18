"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { InvoiceTemplate, TemplateItem } from "@/types";
import { formatNaira } from "@/utils/format";

interface TemplateSelectorProps {
  onSelect: (template: InvoiceTemplate) => void;
}

function computeTemplateTotal(
  items: TemplateItem[],
  tax: number,
): number {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  return subtotal + (subtotal * tax) / 100;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const { data: templates = [], isLoading } = useQuery<InvoiceTemplate[]>({
    queryKey: ["templates"],
    queryFn: () => api.listTemplates(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-neutral-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <p className="text-sm text-neutral-400 text-center py-4">
        No templates yet. Save an invoice as a template to use it here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
      {templates.map((template) => {
        const taxNum = Number(template.tax);
        const total = computeTemplateTotal(
          template.items as TemplateItem[],
          taxNum,
        );
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className="text-left flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {template.name}
              </p>
              <p className="text-xs text-neutral-500 truncate mt-0.5">
                {template.title} &middot;{" "}
                {(template.items as TemplateItem[]).length} item
                {(template.items as TemplateItem[]).length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-neutral-900 tabular-nums">
                {formatNaira(total)}
              </p>
              {taxNum > 0 && (
                <p className="text-xs text-neutral-400">incl. {taxNum}% tax</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
