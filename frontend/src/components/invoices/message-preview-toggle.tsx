"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { IconWhatsApp, IconEmail } from "@/components/ui/icons";
import { WhatsAppMockup } from "@/components/ui/whatsapp-mockup";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface MessagePreviewToggleProps {
  invoiceId: string;
  template: string;
  hasPhone: boolean;
  senderName: string;
  alreadySent: boolean;
}

export function MessagePreviewToggle({
  invoiceId,
  template,
  hasPhone,
  senderName,
  alreadySent,
}: MessagePreviewToggleProps) {
  const [activeChannel, setActiveChannel] = useState<"EMAIL" | "WHATSAPP">(
    hasPhone ? "WHATSAPP" : "EMAIL",
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preview, isLoading } = useQuery({
    queryKey: ["followup-preview", invoiceId, template],
    queryFn: () => api.previewFollowUp(invoiceId, template, "EMAIL"),
    staleTime: 300_000,
  });

  const resendMutation = useMutation({
    mutationFn: () => api.escalateFollowUp(invoiceId, template, "EMAIL"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      toast("Email resent", "success");
    },
    onError: () => toast("Failed to resend email", "error"),
  });

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
          Message preview
        </p>
        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
          {hasPhone && (
            <button
              type="button"
              onClick={() => setActiveChannel("WHATSAPP")}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                activeChannel === "WHATSAPP"
                  ? "bg-white text-brand-green shadow-xs"
                  : "text-neutral-500 hover:text-neutral-700",
              ].join(" ")}
            >
              <IconWhatsApp className="w-3.5 h-3.5" />
              WhatsApp
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveChannel("EMAIL")}
            className={[
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
              activeChannel === "EMAIL"
                ? "bg-white text-primary-600 shadow-xs"
                : "text-neutral-500 hover:text-neutral-700",
            ].join(" ")}
          >
            <IconEmail className="w-3.5 h-3.5" />
            Email
          </button>
        </div>
      </div>

      {activeChannel === "WHATSAPP" ? (
        <WhatsAppMockup
          message={preview?.whatsapp ?? ""}
          loading={isLoading}
          senderName={senderName}
        />
      ) : (
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200 flex flex-col gap-1">
            <p className="text-xs text-neutral-500">
              From{" "}
              <span className="font-medium text-neutral-900">{senderName}</span>
            </p>
            <p className="text-xs text-neutral-500">
              Subject:{" "}
              <span className="font-medium text-neutral-900">
                {isLoading ? "Loading..." : (preview?.email.subject ?? "")}
              </span>
            </p>
            <p className="text-xs text-neutral-400">
              Includes a PDF attachment of this invoice
            </p>
          </div>
          <div className="p-4 min-h-24">
            {isLoading ? (
              <div className="h-20 animate-pulse bg-neutral-100 rounded" />
            ) : (
              <div
                className="text-sm leading-relaxed max-h-72 overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: preview?.email.html ?? "",
                }}
              />
            )}
          </div>
        </div>
      )}

      {activeChannel === "EMAIL" && alreadySent && (
        <div className="mt-4 flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => resendMutation.mutate()}
            loading={resendMutation.isPending}
          >
            Resend email
          </Button>
        </div>
      )}
    </div>
  );
}
