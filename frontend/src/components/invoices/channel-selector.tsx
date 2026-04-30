"use client";

import { IconWhatsApp, IconEmail } from "@/components/ui/icons";
import { WhatsAppMockup } from "@/components/ui/whatsapp-mockup";

interface ChannelSelectorProps {
  clientName: string;
  clientEmail: string | undefined;
  clientPhone: string | null | undefined;
  selectedChannels: ("EMAIL" | "WHATSAPP")[];
  onToggle: (channel: "EMAIL" | "WHATSAPP") => void;
  whatsAppPreviewMessage?: string;
  whatsAppPreviewLoading?: boolean;
}

export function ChannelSelector({
  clientName,
  clientEmail,
  clientPhone,
  selectedChannels,
  onToggle,
  whatsAppPreviewMessage,
  whatsAppPreviewLoading,
}: ChannelSelectorProps) {
  const hasPhone = !!clientPhone;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-neutral-700">
        Deliver invoice to{" "}
        <span className="text-neutral-900">{clientName}</span> via:
      </p>

      {hasPhone ? (
        <label className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
          <input
            type="checkbox"
            checked={selectedChannels.includes("WHATSAPP")}
            onChange={() => onToggle("WHATSAPP")}
            className="w-4 h-4 text-success-600 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <IconWhatsApp className="w-4 h-4 text-brand-green flex-shrink-0" />
              <p className="text-sm font-medium text-neutral-900">WhatsApp</p>
              <span className="text-xs bg-success-50 text-success-700 px-1.5 py-0.5 rounded font-medium">
                Recommended
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">{clientPhone}</p>
            {selectedChannels.includes("WHATSAPP") &&
              whatsAppPreviewMessage !== undefined && (
                <div className="mt-3">
                  <WhatsAppMockup
                    message={whatsAppPreviewMessage}
                    loading={whatsAppPreviewLoading}
                    senderName={clientName}
                  />
                </div>
              )}
          </div>
        </label>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200">
          <IconWhatsApp className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          <p className="text-xs text-neutral-500">
            Add a phone number to this client to enable WhatsApp delivery.
          </p>
        </div>
      )}

      <label className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50">
        <input
          type="checkbox"
          checked={selectedChannels.includes("EMAIL")}
          onChange={() => onToggle("EMAIL")}
          className="w-4 h-4 text-primary-500"
        />
        <div>
          <div className="flex items-center gap-2">
            <IconEmail className="w-4 h-4 text-primary-500 flex-shrink-0" />
            <p className="text-sm font-medium text-neutral-900">Email</p>
          </div>
          {clientEmail && (
            <p className="text-xs text-neutral-500">{clientEmail}</p>
          )}
        </div>
      </label>
    </div>
  );
}
