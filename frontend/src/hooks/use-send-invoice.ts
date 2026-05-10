"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, buildDefaultFollowUpSteps } from "@/lib/api";
import type { FollowUpStepConfig, InvoiceType } from "@/types";
import { useToast } from "@/components/ui/toast";

export type SendPhase = "configure" | "confirmed";

interface UseSendInvoiceOptions {
  invoiceId: string;
  hasPhone: boolean;
  dueDate: string;
  invoiceType?: InvoiceType;
  onSuccess?: () => void;
}

export function useSendInvoice({
  invoiceId,
  hasPhone,
  invoiceType = "STANDARD",
  onSuccess,
}: UseSendInvoiceOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [sendModal, setSendModal] = useState(false);
  const [sendPhase, setSendPhase] = useState<SendPhase>("configure");
  const [sendChannels, setSendChannels] = useState<("EMAIL" | "WHATSAPP")[]>(
    hasPhone ? ["WHATSAPP", "EMAIL"] : ["EMAIL"],
  );
  const [followUpSteps, setFollowUpSteps] = useState<FollowUpStepConfig[]>(
    buildDefaultFollowUpSteps(hasPhone, invoiceType),
  );
  const [confirmedSteps, setConfirmedSteps] = useState<FollowUpStepConfig[]>(
    [],
  );
  const [isSending, setIsSending] = useState(false);

  const openSendModal = (phone?: boolean) => {
    const usePhone = phone ?? hasPhone;
    setFollowUpSteps(buildDefaultFollowUpSteps(usePhone, invoiceType));
    setSendChannels(usePhone ? ["WHATSAPP", "EMAIL"] : ["EMAIL"]);
    setSendPhase("configure");
    setSendModal(true);
  };

  const closeSendModal = () => {
    if (isSending) return;
    setSendModal(false);
  };

  const toggleChannel = (ch: "EMAIL" | "WHATSAPP") => {
    setSendChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

  const confirmSend = async () => {
    if (sendChannels.length === 0) return;
    setIsSending(true);
    try {
      await api.sendInvoice(invoiceId, sendChannels, followUpSteps);
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["followups", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setConfirmedSteps(followUpSteps);
      setSendPhase("confirmed");
      onSuccess?.();
    } catch {
      toast("Failed to send invoice", "error");
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendModal,
    sendPhase,
    sendChannels,
    followUpSteps,
    confirmedSteps,
    isSending,
    openSendModal,
    closeSendModal,
    toggleChannel,
    setFollowUpSteps,
    confirmSend,
    setSendModal,
  };
}
