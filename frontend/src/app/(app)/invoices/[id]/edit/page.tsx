"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Invoice, Client, UpdateInvoiceInput } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

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

  const subtotal = items.reduce((sum, item) => {
    return (
      sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
    );
  }, 0);
  const taxAmount = (subtotal * (parseFloat(tax) || 0)) / 100;
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
      tax: parseFloat(tax) > 0 ? taxAmount : 0,
      notes: notes || undefined,
      items: items.map((i) => ({
        description: i.description,
        quantity: parseFloat(i.quantity) || 1,
        unitPrice: parseFloat(i.unitPrice) || 0,
      })),
    });
  };

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { description: "", quantity: "1", unitPrice: "" },
    ]);
  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof LineItem, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
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
        <h1 className="text-2xl font-bold text-neutral-900">Edit Invoice</h1>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
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
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Line Items
        </h2>
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(idx, "description", e.target.value)
                  }
                />
              </div>
              <div className="w-16">
                <Input
                  placeholder="Qty"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                />
              </div>
              <div className="w-28">
                <Input
                  placeholder="Unit Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                  prefix="₦"
                />
              </div>
              {items.length > 1 && (
                <button
                  onClick={() => removeItem(idx)}
                  className="h-11 w-9 flex items-center justify-center rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 flex-shrink-0 transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addItem}
          className="text-sm text-primary-600 font-medium hover:underline text-left"
        >
          + Add item
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
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
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-neutral-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatNaira(subtotal)}</span>
          </div>
          {parseFloat(tax) > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>Tax ({tax}%)</span>
              <span className="tabular-nums">{formatNaira(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-neutral-900 text-base border-t-2 border-neutral-200 pt-2 mt-1">
            <span>Total</span>
            <span className="tabular-nums">{formatNaira(total)}</span>
          </div>
        </div>
      </div>

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
