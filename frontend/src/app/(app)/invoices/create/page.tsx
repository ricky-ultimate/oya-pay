"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Client, CreateInvoiceInput } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function CreateInvoicePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(searchParams.get("clientId") ?? "");
  const [dueDate, setDueDate] = useState("");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);
  const [sendAfter, setSendAfter] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => api.getClients(),
  });

  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const taxAmount = (subtotal * (parseFloat(tax) || 0)) / 100;
  const total = subtotal + taxAmount;

  const createMutation = useMutation({
    mutationFn: (data: CreateInvoiceInput) => api.createInvoice(data),
    onSuccess: async (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      if (sendAfter) {
        await api.sendInvoice(invoice.id, ["EMAIL"]);
        toast("Invoice created and sent", "success");
      } else {
        toast("Invoice saved as draft", "success");
      }
      router.push(`/invoices/${invoice.id}`);
    },
    onError: () => toast("Failed to create invoice", "error"),
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!title.trim()) next["title"] = "Title is required";
    if (!clientId) next["clientId"] = "Select a client";
    if (!dueDate) next["dueDate"] = "Due date is required";
    if (items.some((i) => !i.description || !i.unitPrice))
      next["items"] = "All items must have a description and price";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (send: boolean) => {
    if (!validate()) return;
    setSendAfter(send);
    createMutation.mutate({
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

  const minDate = new Date().toISOString().split("T")[0] as string;

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
        <h1 className="text-2xl font-bold text-neutral-900">New Invoice</h1>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Invoice Details
        </h2>
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Website Design"
          error={errors["title"]}
        />
        <Select
          label="Client"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          error={errors["clientId"]}
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
          min={minDate}
          error={errors["dueDate"]}
        />
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Line Items
        </h2>
        {errors["items"] && (
          <p className="text-sm text-error-600">{errors["items"]}</p>
        )}
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
          placeholder="Payment terms, bank details, or any other notes..."
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
          onClick={() => handleSubmit(false)}
          loading={createMutation.isPending && !sendAfter}
          className="flex-1"
        >
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          loading={createMutation.isPending && sendAfter}
          className="flex-1"
        >
          Send Now
        </Button>
      </div>
    </div>
  );
}

export default function CreateInvoicePage() {
  return (
    <Suspense>
      <CreateInvoicePageInner />
    </Suspense>
  );
}
