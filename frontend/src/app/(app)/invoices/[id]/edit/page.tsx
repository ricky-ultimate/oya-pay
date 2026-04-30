"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Invoice, Client, UpdateInvoiceInput } from "@/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BackButton } from "@/components/ui/back-button";
import { SectionCard, SectionCardBody } from "@/components/ui/section-card";
import {
  LineItemsEditor,
  LineItem,
} from "@/components/invoices/line-items-editor";
import { InvoiceTotals } from "@/components/invoices/invoice-totals";
import { useToast } from "@/components/ui/toast";

export default function EditInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ["invoice", id],
    queryFn: () => api.getInvoice(id),
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => api.getClients(),
  });

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);

  useEffect(() => {
    if (!invoice) return;
    setTitle(invoice.title);
    setClientId(invoice.clientId);
    setDueDate(invoice.dueDate.split("T")[0]);
    setTax(String(Number(invoice.tax)));
    setNotes(invoice.notes ?? "");
    setItems(
      invoice.items?.map((i) => ({
        description: i.description,
        quantity: String(Number(i.quantity)),
        unitPrice: String(Number(i.unitPrice)),
      })) ?? [],
    );
  }, [invoice]);

  const taxPercent = parseFloat(tax) || 0;
  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0),
    0,
  );
  const taxAmount = (subtotal * taxPercent) / 100;
  const total = subtotal + taxAmount;

  const updateMutation = useMutation({
    mutationFn: (data: UpdateInvoiceInput) => api.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast("Invoice updated", "success");
      router.push(`/invoices/${id}`);
    },
    onError: () => toast("Failed to update invoice", "error"),
  });

  const handleSave = () => {
    updateMutation.mutate({
      title,
      clientId,
      dueDate: new Date(dueDate).toISOString(),
      tax: taxPercent > 0 ? taxAmount : 0,
      notes: notes || undefined,
      items: items.map((i) => ({
        description: i.description,
        quantity: parseFloat(i.quantity) || 1,
        unitPrice: parseFloat(i.unitPrice) || 0,
      })),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (invoice?.status !== "DRAFT") {
    return (
      <div className="max-w-2xl mx-auto pt-12 text-center">
        <p className="text-neutral-600">Only draft invoices can be edited.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary-600 text-sm font-medium hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold text-neutral-900">Edit Invoice</h1>
      </div>

      <SectionCard>
        <SectionCardBody className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Invoice Details
          </h2>
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Select a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </SectionCardBody>
      </SectionCard>

      <SectionCard>
        <SectionCardBody className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Line Items
          </h2>
          <LineItemsEditor items={items} onChange={setItems} />
        </SectionCardBody>
      </SectionCard>

      <SectionCard>
        <SectionCardBody className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Additional
          </h2>
          <Input
            label="Tax (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            suffix="%"
          />
          <Textarea
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </SectionCardBody>
      </SectionCard>

      <SectionCard>
        <SectionCardBody>
          <InvoiceTotals
            subtotal={subtotal}
            taxPercent={taxPercent}
            taxAmount={taxAmount}
            total={total}
          />
        </SectionCardBody>
      </SectionCard>

      <div className="flex gap-3 pb-4">
        <Button
          variant="secondary"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          loading={updateMutation.isPending}
          className="flex-1"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
