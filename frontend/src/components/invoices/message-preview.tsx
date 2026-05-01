"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { FollowUpChannelType } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { IconEye } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { TEMPLATE_LABELS } from "@/utils/constants";

interface MessagePreviewButtonProps {
  invoiceId: string;
  scheduleId: string;
  template: string;
  channel: FollowUpChannelType;
  onSent?: () => void;
}

export function MessagePreviewButton({
  invoiceId,
  scheduleId,
  template,
  channel,
  onSent,
}: MessagePreviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"email" | "whatsapp">(
    channel === "WHATSAPP" ? "whatsapp" : "email",
  );
  const [note, setNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preview, isLoading } = useQuery({
    queryKey: ["followup-preview", invoiceId, template, channel],
    queryFn: () => api.previewFollowUp(invoiceId, template, channel),
    enabled: open,
    staleTime: 300_000,
  });

  const triggerMutation = useMutation({
    mutationFn: () =>
      api.triggerFollowUp(invoiceId, scheduleId, note.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups", invoiceId] });
      toast("Follow-up sent", "success");
      setOpen(false);
      setNote("");
      onSent?.();
    },
    onError: () => toast("Failed to send follow-up", "error"),
  });

  const handleClose = () => {
    if (!triggerMutation.isPending) {
      setOpen(false);
      setNote("");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        aria-label="Preview and send"
        title="Preview message"
      >
        <IconEye />
      </button>

      <Modal
        open={open}
        onClose={handleClose}
        title={`Preview: ${TEMPLATE_LABELS[template] ?? template}`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={triggerMutation.isPending}
            >
              Close
            </Button>
            <Button
              onClick={() => triggerMutation.mutate()}
              loading={triggerMutation.isPending}
            >
              Send Now
            </Button>
          </>
        }
      >
        {isLoading ? (
          <div className="h-40 flex items-center justify-center text-sm text-neutral-400">
            Loading preview...
          </div>
        ) : preview ? (
          <div className="flex flex-col gap-4">
            <div className="flex gap-0 border-b border-neutral-200">
              {(["email", "whatsapp"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors capitalize",
                    activeTab === tab
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-neutral-500 hover:text-neutral-700",
                  ].join(" ")}
                >
                  {tab === "whatsapp" ? "WhatsApp" : "Email"}
                </button>
              ))}
            </div>

            {activeTab === "email" && (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="bg-neutral-50 px-4 py-2.5 border-b border-neutral-200">
                  <p className="text-xs text-neutral-500">
                    Subject:{" "}
                    <span className="font-medium text-neutral-900">
                      {preview.email.subject}
                    </span>
                  </p>
                </div>
                <div
                  className="p-4 text-sm leading-relaxed max-h-64 overflow-y-auto"
                  dangerouslySetInnerHTML={{
                    __html:
                      preview.email.html +
                      (note.trim()
                        ? `<p style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:14px;">${note.trim()}</p>`
                        : ""),
                  }}
                />
              </div>
            )}

            {activeTab === "whatsapp" && (
              <div className="bg-neutral-50 rounded-lg p-4">
                <div className="flex justify-end">
                  <div className="max-w-xs bg-green-100 rounded-lg rounded-tr-none px-3 py-2 shadow-sm">
                    <p className="text-sm text-neutral-900 whitespace-pre-wrap">
                      {preview.whatsapp}
                      {note.trim() ? `\n\n${note.trim()}` : ""}
                    </p>
                    <p className="text-right text-xs text-neutral-400 mt-1">
                      Preview
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-700">
                Add a personal note (optional)
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
        ) : null}
      </Modal>
    </>
  );
}
