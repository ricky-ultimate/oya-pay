"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FollowUpChannelType } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { WhatsAppMockup } from "@/components/ui/whatsapp-mockup";
import { useToast } from "@/components/ui/toast";

type FollowUpTemplate =
  | "PRE_DUE_REMINDER"
  | "FIRST_OVERDUE"
  | "SECOND_OVERDUE"
  | "FINAL_NOTICE";

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
  initialChannel?: FollowUpChannelType;
  initialTemplate?: FollowUpTemplate;
}

export function EscalateModal({
  invoiceId,
  hasPhone,
  open,
  onClose,
  onSent,
  initialChannel,
  initialTemplate,
}: EscalateModalProps) {
  const defaultChannel: FollowUpChannelType =
    initialChannel ?? (hasPhone ? "WHATSAPP" : "EMAIL");
  const [template, setTemplate] = useState<FollowUpTemplate>(
    initialTemplate ?? "FIRST_OVERDUE",
  );
  const [channel, setChannel] = useState<FollowUpChannelType>(defaultChannel);
  const [note, setNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    const nextTemplate = initialTemplate ?? "FIRST_OVERDUE";
    const nextChannel = initialChannel ?? (hasPhone ? "WHATSAPP" : "EMAIL");
    Promise.resolve().then(() => {
      setTemplate(nextTemplate);
      setChannel(nextChannel);
      setNote("");
    });
  }, [open, initialChannel, initialTemplate, hasPhone]);

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
      onSent();
    },
    onError: () => toast("Failed to send follow-up", "error"),
  });

  const handleClose = () => {
    if (escalateMutation.isPending) return;
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
            onChange={(e) => setChannel(e.target.value as FollowUpChannelType)}
          >
            {hasPhone && <option value="WHATSAPP">WhatsApp</option>}
            <option value="EMAIL">Email</option>
          </Select>
        </div>

        {channel === "WHATSAPP" ? (
          <WhatsAppMockup
            message={preview?.whatsapp ?? ""}
            loading={previewLoading}
          />
        ) : (
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200">
              <p className="text-xs text-neutral-500">
                Subject:{" "}
                <span className="font-medium text-neutral-900">
                  {previewLoading
                    ? "Loading..."
                    : (preview?.email.subject ?? "")}
                </span>
              </p>
            </div>
            <div className="p-3 min-h-20">
              {previewLoading ? (
                <div className="h-16 animate-pulse bg-neutral-100 rounded" />
              ) : preview ? (
                <div
                  className="text-sm leading-relaxed max-h-40 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: preview.email.html }}
                />
              ) : null}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-neutral-700">
            Personal note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Appended to the message before sending..."
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-neutral-400 text-right">
            {note.length}/500
          </p>
        </div>
      </div>
    </Modal>
  );
}
