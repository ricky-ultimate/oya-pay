"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { WhatsAppStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

function QrDisplay({
  qrCode,
  loading,
}: {
  qrCode: string | null;
  loading: boolean;
}) {
  if (loading) {
    return <Skeleton className="w-56 h-56 rounded-xl mx-auto" />;
  }
  if (!qrCode) {
    return (
      <div className="w-56 h-56 rounded-xl bg-neutral-100 border border-dashed border-neutral-300 flex items-center justify-center mx-auto">
        <p className="text-xs text-neutral-400 text-center px-4">
          QR code not available. Try restarting the instance.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <img
        src={qrCode}
        alt="WhatsApp QR code"
        className="w-56 h-56 rounded-xl border border-neutral-200 shadow-sm mx-auto"
      />
      <p className="text-xs text-neutral-500 text-center max-w-xs">
        Open WhatsApp on your phone, go to Linked Devices, and scan this code.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    authenticated: {
      label: "Connected",
      className: "bg-success-50 text-success-700 border-success-200",
    },
    not_configured: {
      label: "Not set up",
      className: "bg-neutral-100 text-neutral-500 border-neutral-200",
    },
    qr: {
      label: "Awaiting scan",
      className: "bg-warning-50 text-warning-700 border-warning-200",
    },
    loading: {
      label: "Loading",
      className: "bg-neutral-100 text-neutral-500 border-neutral-200",
    },
  };
  const config = configs[status] ?? {
    label: status,
    className: "bg-neutral-100 text-neutral-500 border-neutral-200",
  };

  return (
    <span
      className={`inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold border ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export default function WhatsAppSetupPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [provisioning, setProvisioning] = useState(false);

  const {
    data: status,
    isLoading: statusLoading,
    refetch,
  } = useQuery<WhatsAppStatus>({
    queryKey: ["whatsapp-status"],
    queryFn: () => api.getWhatsAppStatus(),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "qr" || data?.status === "loading") return 5000;
      return false;
    },
  });

  const provisionMutation = useMutation({
    mutationFn: () => api.provisionWhatsApp(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
    },
    onError: () =>
      toast("Failed to set up WhatsApp. Contact support.", "error"),
  });

  const restartMutation = useMutation({
    mutationFn: () => api.restartWhatsApp(),
    onSuccess: () => {
      toast("Instance restarting...", "info");
      setTimeout(() => refetch(), 3000);
    },
    onError: () => toast("Failed to restart", "error"),
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.logoutWhatsApp(),
    onSuccess: () => {
      toast("WhatsApp logged out. Scan the QR to reconnect.", "success");
      refetch();
    },
    onError: () => toast("Failed to logout", "error"),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.disconnectWhatsApp(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-status"] });
      toast("WhatsApp disconnected", "success");
      router.push("/profile");
    },
    onError: () => toast("Failed to disconnect", "error"),
  });

  const handleProvision = async () => {
    setProvisioning(true);
    await provisionMutation.mutateAsync().catch(() => null);
    setProvisioning(false);
  };

  const isConnected = status?.connected;
  const showQr = status?.status === "qr" || status?.status === "loading";
  const notConfigured = !status?.instanceId;

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <div>
          <h1 className="text-xl font-bold text-neutral-900">WhatsApp Setup</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Connect your WhatsApp to send automated follow-ups
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Connection Status
          </h2>
          {statusLoading ? (
            <Skeleton className="h-5 w-20 rounded-full" />
          ) : (
            <StatusBadge status={status?.status ?? "not_configured"} />
          )}
        </div>

        {statusLoading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : notConfigured ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600">
              OyaPay will create a dedicated WhatsApp instance for your account.
              You will scan a QR code to link your WhatsApp number.
            </p>
            <Button
              onClick={handleProvision}
              loading={provisioning || provisionMutation.isPending}
              className="w-full"
            >
              Set up WhatsApp
            </Button>
          </div>
        ) : isConnected ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-success-50 border border-success-100">
              <svg
                className="w-5 h-5 text-success-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-success-900">
                  WhatsApp connected
                </p>
                {status?.phoneConnected && (
                  <p className="text-xs text-success-700 mt-0.5">
                    {status.phoneConnected}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : showQr ? (
          <div className="flex flex-col gap-4">
            <QrDisplay qrCode={status?.qrCode ?? null} loading={false} />
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200">
              <div className="w-2 h-2 rounded-full bg-warning-500 animate-pulse flex-shrink-0" />
              <p className="text-xs text-neutral-600">
                Waiting for QR scan. This page auto-refreshes every 5 seconds.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-neutral-600">
              Instance status:{" "}
              <span className="font-medium">{status?.status}</span>
            </p>
            <p className="text-xs text-neutral-500">
              Try restarting the instance or logging out and scanning again.
            </p>
          </div>
        )}
      </div>

      {!notConfigured && (
        <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Troubleshooting
          </h2>
          <p className="text-xs text-neutral-500">
            If messages are not being delivered, try these actions in order.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => restartMutation.mutate()}
              loading={restartMutation.isPending}
              className="w-full justify-start"
            >
              Restart instance
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              loading={logoutMutation.isPending}
              className="w-full justify-start"
            >
              Log out and re-scan QR
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => disconnectMutation.mutate()}
              loading={disconnectMutation.isPending}
              className="w-full justify-start text-error-600 hover:bg-error-50"
            >
              Disconnect WhatsApp
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
