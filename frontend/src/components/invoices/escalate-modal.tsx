"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

type FollowUpTemplate =
  | "PRE_DUE_REMINDER"
  | "FIRST_OVERDUE"
  | "SECOND_OVERDUE"
  | "FINAL_NOTICE";

type Channel = "EMAIL" | "WHATSAPP";

const TEMPLATE_OPTIONS: { value: FollowUpTemplate; label: string }[] = [
  { value: "PRE_DUE_REMINDER", label: "Pre-due Reminder" },
  { value: "FIRST_OVERDUE", label: "First Overdue Notice" },
  { value: "SECOND_OVERDUE", label: "Second Overdue Notice" },
  { value: "FINAL_NOTICE", label: "Final Notice" },
];

interface EscalateModalProps {
  invoiceId: string;
  hasPhone: boolean;
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}

export function EscalateModal({
  invoiceId,
  hasPhone,
  open,
  onClose,
  onSent,
}: EscalateModalProps) {
  const [template, setTemplate] = useState<FollowUpTemplate>("FIRST_OVERDUE");
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [note, setNote] = useState("");
  const [activeTab, setActiveTab] = useState<"email" | "whatsapp">("email");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ["followup-preview", invoiceId, template, channel],
    queryFn: () => api.previewFollowUp(invoiceId, template, channel),
    enabled: open,
    staleTime: 300_000,
  });

  const escalateMutation = useMutation({
    mutationFn: () =>
      api.escalateFollowUp(
        invoiceId,
        template,
        channel,
        note.trim() || undefined,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      toast("Follow-up sent", "success");
      setNote("");
      onSent();
    },
    onError: () => toast("Failed to send follow-up", "error"),
  });

  const handleClose = () => {
    if (escalateMutation.isPending) return;
    setNote("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Send Follow-up Now"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={escalateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => escalateMutation.mutate()}
            loading={escalateMutation.isPending}
          >
            Send
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Template"
            value={template}
            onChange={(e) => setTemplate(e.target.value as FollowUpTemplate)}
          >
            {TEMPLATE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            label="Channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value as Channel)}
          >
            <option value="EMAIL">Email</option>
            {hasPhone && <option value="WHATSAPP">WhatsApp</option>}
          </Select>
        </div>

        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="flex gap-0 border-b border-neutral-200 bg-neutral-50">
            <button
              type="button"
              onClick={() => setActiveTab("email")}
              className={[
                "px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
                activeTab === "email"
                  ? "border-primary-500 text-primary-600 bg-white"
                  : "border-transparent text-neutral-500",
              ].join(" ")}
            >
              Email preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("whatsapp")}
              className={[
                "px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors",
                activeTab === "whatsapp"
                  ? "border-primary-500 text-primary-600 bg-white"
                  : "border-transparent text-neutral-500",
              ].join(" ")}
            >
              WhatsApp preview
            </button>
          </div>

          <div className="p-3 min-h-24">
            {previewLoading ? (
              <p className="text-xs text-neutral-400 text-center py-6">
                Loading preview...
              </p>
            ) : preview ? (
              <>
                {activeTab === "email" && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-2">
                      Subject:{" "}
                      <span className="font-medium text-neutral-900">
                        {preview.email.subject}
                      </span>
                    </p>
                    <div
                      className="text-sm leading-relaxed max-h-40 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: preview.email.html }}
                    />
                  </div>
                )}
                {activeTab === "whatsapp" && (
                  <div className="flex justify-end">
                    <div className="max-w-xs bg-green-100 rounded-lg rounded-tr-none px-3 py-2">
                      <p className="text-sm text-neutral-900 whitespace-pre-wrap">
                        {preview.whatsapp}
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-700">
            Personal note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Appended to the message..."
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </Modal>
  );
}
