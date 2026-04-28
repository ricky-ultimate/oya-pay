"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api, Invoice, InvoiceStatus } from "@/lib/api";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

function formatNaira(amount: number): string {
  return `₦${Number(amount).toLocaleString("en-NG")}`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [paymentModal, setPaymentModal] = useState(false);
  const [sendModal, setSendModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [sendChannels, setSendChannels] = useState<("EMAIL" | "WHATSAPP")[]>([
    "EMAIL",
  ]);

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ["invoice", id],
    queryFn: () => api.getInvoice(id),
  });

  const logPaymentMutation = useMutation({
    mutationFn: () =>
      api.logPayment({
        invoiceId: id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        reference: paymentRef || undefined,
        note: paymentNote || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Payment recorded", "success");
      setPaymentModal(false);
      setPaymentAmount("");
      setPaymentRef("");
      setPaymentNote("");
    },
    onError: () => toast("Failed to record payment", "error"),
  });

  const sendMutation = useMutation({
    mutationFn: () => api.sendInvoice(id, sendChannels),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast("Invoice sent successfully", "success");
      setSendModal(false);
    },
    onError: () => toast("Failed to send invoice", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast("Invoice deleted", "success");
      router.push("/invoices");
    },
    onError: () => toast("Failed to delete invoice", "error"),
  });

  const downloadPDF = async () => {
    try {
      const blob = await api.downloadInvoicePDF(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice?.invoiceNumber ?? "invoice"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast("Failed to download PDF", "error");
    }
  };

  const copyPaymentLink = async () => {
    try {
      const result = await api.getPaymentLink(id);
      await navigator.clipboard.writeText(result.authorizationUrl);
      toast("Payment link copied", "success");
    } catch {
      toast("Failed to get payment link", "error");
    }
  };

  const toggleChannel = (channel: "EMAIL" | "WHATSAPP") => {
    setSendChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
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

  if (!invoice) return null;

  const canEdit = invoice.status === "DRAFT";
  const canPay = !["PAID", "CANCELLED"].includes(invoice.status);
  const canSend = !["PAID", "CANCELLED"].includes(invoice.status);
  const hasPhone = !!invoice.client?.phone;
  const remainingAmount =
    Number(invoice.total) -
    (invoice.payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0);

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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-neutral-900">
              {invoice.title}
            </h1>
            <StatusBadge status={invoice.status as InvoiceStatus} />
          </div>
          <p className="text-sm text-neutral-500">{invoice.invoiceNumber}</p>
        </div>
        {canEdit && (
          <Link href={`/invoices/${id}/edit`}>
            <Button variant="secondary" size="sm">
              Edit
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
            Client
          </p>
          <p className="text-sm font-medium text-neutral-900">
            {invoice.client?.name}
          </p>
          <p className="text-xs text-neutral-500">{invoice.client?.email}</p>
          {invoice.client?.phone && (
            <p className="text-xs text-neutral-500">{invoice.client.phone}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
            Dates
          </p>
          <p className="text-xs text-neutral-600">
            Issued: {formatDate(invoice.issueDate)}
          </p>
          <p className="text-xs text-neutral-600">
            Due: {formatDate(invoice.dueDate)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-5 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Description
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Qty
              </th>
              <th className="text-right px-3 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Unit Price
              </th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {invoice.items?.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 text-neutral-900">
                  {item.description}
                </td>
                <td className="px-3 py-3 text-right text-neutral-600 tabular-nums">
                  {Number(item.quantity)}
                </td>
                <td className="px-3 py-3 text-right text-neutral-600 tabular-nums">
                  {formatNaira(Number(item.unitPrice))}
                </td>
                <td className="px-5 py-3 text-right font-medium text-neutral-900 tabular-nums">
                  {formatNaira(Number(item.total))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-neutral-200">
            <tr>
              <td
                colSpan={3}
                className="px-5 py-2.5 text-right text-sm text-neutral-500"
              >
                Subtotal
              </td>
              <td className="px-5 py-2.5 text-right text-sm font-medium tabular-nums">
                {formatNaira(Number(invoice.subtotal))}
              </td>
            </tr>
            {Number(invoice.tax) > 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-5 py-1.5 text-right text-sm text-neutral-500"
                >
                  Tax
                </td>
                <td className="px-5 py-1.5 text-right text-sm tabular-nums">
                  {formatNaira(Number(invoice.tax))}
                </td>
              </tr>
            )}
            <tr className="border-t-2 border-neutral-200">
              <td
                colSpan={3}
                className="px-5 py-3 text-right text-base font-semibold text-neutral-900"
              >
                Total
              </td>
              <td className="px-5 py-3 text-right text-base font-bold text-neutral-900 tabular-nums">
                {formatNaira(Number(invoice.total))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {invoice.notes && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Notes
          </p>
          <p className="text-sm text-neutral-700 whitespace-pre-line">
            {invoice.notes}
          </p>
        </div>
      )}

      {(invoice.payments?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="px-5 py-3.5 border-b border-neutral-200">
            <h2 className="text-sm font-semibold text-neutral-900">
              Payment History
            </h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {invoice.payments?.map((payment) => (
              <div
                key={payment.id}
                className="flex justify-between items-center px-5 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatNaira(Number(payment.amount))}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {payment.method ?? "Unknown"} · {formatDate(payment.paidAt)}
                  </p>
                </div>
                {payment.reference && (
                  <p className="text-xs text-neutral-400 font-mono">
                    {payment.reference}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pb-4">
        {canPay && (
          <Button
            onClick={() => {
              setPaymentAmount(
                String(remainingAmount > 0 ? remainingAmount : ""),
              );
              setPaymentModal(true);
            }}
            className="flex-1"
          >
            Record Payment
          </Button>
        )}
        {canSend && (
          <Button
            variant="secondary"
            onClick={() => setSendModal(true)}
            className="flex-1"
          >
            {invoice.sentAt ? "Send Reminder" : "Send Invoice"}
          </Button>
        )}
        <Button variant="ghost" onClick={downloadPDF} size="md">
          Download PDF
        </Button>
        {!["DRAFT", "CANCELLED"].includes(invoice.status) && (
          <Button variant="ghost" onClick={copyPaymentLink} size="md">
            Copy Link
          </Button>
        )}
        {canEdit && (
          <Button
            variant="ghost"
            onClick={() => setDeleteModal(true)}
            size="md"
            className="text-error-600 hover:bg-error-50"
          >
            Delete
          </Button>
        )}
      </div>

      <Modal
        open={paymentModal}
        onClose={() => setPaymentModal(false)}
        title="Record Payment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPaymentModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => logPaymentMutation.mutate()}
              loading={logPaymentMutation.isPending}
              disabled={!paymentAmount}
            >
              Record Payment
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            prefix="₦"
          />
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="paystack">Paystack</option>
            <option value="other">Other</option>
          </Select>
          <Input
            label="Reference (optional)"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            placeholder="Transaction reference"
          />
          <Textarea
            label="Note (optional)"
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            placeholder="Any additional notes..."
          />
        </div>
      </Modal>

      <Modal
        open={sendModal}
        onClose={() => setSendModal(false)}
        title={invoice.sentAt ? "Send Reminder" : "Send Invoice"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSendModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendMutation.mutate()}
              loading={sendMutation.isPending}
              disabled={sendChannels.length === 0}
            >
              Send
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-sm text-neutral-600">
            Select how to send this invoice to {invoice.client?.name}.
          </p>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
            <input
              type="checkbox"
              checked={sendChannels.includes("EMAIL")}
              onChange={() => toggleChannel("EMAIL")}
              className="w-4 h-4 text-primary-500"
            />
            <span className="text-sm font-medium text-neutral-900">
              Email ({invoice.client?.email})
            </span>
          </label>
          {hasPhone && (
            <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
              <input
                type="checkbox"
                checked={sendChannels.includes("WHATSAPP")}
                onChange={() => toggleChannel("WHATSAPP")}
                className="w-4 h-4 text-primary-500"
              />
              <span className="text-sm font-medium text-neutral-900">
                WhatsApp ({invoice.client?.phone})
              </span>
            </label>
          )}
        </div>
      </Modal>

      <ConfirmModal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Invoice"
        message="This invoice will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
