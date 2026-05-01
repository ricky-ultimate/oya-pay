"use client";

import { useState, useEffect, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UpdateProfileInput } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

function PayoutSetupCard({
  subaccountCode,
  isActive,
  onSave,
  isSaving,
}: {
  subaccountCode: string;
  isActive: boolean;
  onSave: (code: string) => void;
  isSaving: boolean;
}) {
  const [code, setCode] = useState(subaccountCode);

  useEffect(() => {
    setCode(subaccountCode);
  }, [subaccountCode]);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Paystack Payout Account
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Enter your Paystack subaccount code so clients can pay you directly.
            Create one at{" "}
            <a
              href="https://dashboard.paystack.com/#/subaccounts"
              target="_blank"
              rel="noreferrer"
              className="text-primary-600 hover:underline"
            >
              dashboard.paystack.com
            </a>
            .
          </p>
        </div>
        {isActive && (
          <span className="inline-flex items-center h-5 px-2 rounded-full bg-success-50 text-success-700 text-xs font-semibold border border-success-200 flex-shrink-0">
            Active
          </span>
        )}
      </div>
      {!isActive && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-warning-50 border border-warning-100">
          <svg
            className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <p className="text-xs text-warning-800">
            Set up your Paystack subaccount to receive client payments directly.
            Without this, payment links in invoices and follow-ups will not be
            generated.
          </p>
        </div>
      )}
      <div className="flex gap-3">
        <Input
          label="Subaccount Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ACCT_xxxxxxxxxxxx"
          className="flex-1"
        />
        <div className="flex items-end">
          <Button
            onClick={() => onSave(code)}
            loading={isSaving}
            disabled={!code.trim() || code === subaccountCode}
            size="md"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function WhatsAppStatusCard({ instanceId }: { instanceId: string | null }) {
  const configured = !!instanceId;
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            WhatsApp Delivery
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {configured
              ? "Your WhatsApp instance is active. Follow-ups will be sent via your number."
              : "WhatsApp instance not yet configured. Contact support or re-register with a valid phone number."}
          </p>
        </div>
        <span
          className={[
            "inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold border flex-shrink-0",
            configured
              ? "bg-success-50 text-success-700 border-success-200"
              : "bg-neutral-100 text-neutral-500 border-neutral-200",
          ].join(" ")}
        >
          {configured ? "Connected" : "Not connected"}
        </span>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    businessName: "",
    phone: "",
    logoUrl: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      businessName: user.businessName ?? "",
      phone: user.phone ?? "",
      logoUrl: user.logoUrl ?? "",
    });
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileInput) => api.updateProfile(data),
    onSuccess: (updated) => {
      setUser(updated);
      toast("Profile updated", "success");
    },
    onError: () => toast("Failed to update profile", "error"),
  });

  const subaccountMutation = useMutation({
    mutationFn: (paystackSubaccountCode: string) =>
      api.updateProfile({ paystackSubaccountCode }),
    onSuccess: (updated) => {
      setUser(updated);
      toast("Paystack subaccount saved", "success");
    },
    onError: (err: Error) =>
      toast(err.message ?? "Invalid subaccount code", "error"),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      name: form.name || undefined,
      businessName: form.businessName || undefined,
      phone: form.phone || undefined,
      logoUrl: form.logoUrl || undefined,
    });
  };

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
        Profile
      </h1>

      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-semibold">
          {user?.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div className="text-center">
          <p className="font-semibold text-neutral-900">{user?.name}</p>
          <p className="text-sm text-neutral-500">{user?.email}</p>
        </div>
      </div>

      <PayoutSetupCard
        subaccountCode={user?.paystackSubaccountCode ?? ""}
        isActive={user?.paystackSubaccountActive ?? false}
        onSave={(code) => subaccountMutation.mutate(code)}
        isSaving={subaccountMutation.isPending}
      />

      <WhatsAppStatusCard instanceId={user?.ultramsgInstanceId ?? null} />

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4"
      >
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
          Account Details
        </h2>
        <Input
          label="Full Name"
          value={form.name}
          onChange={update("name")}
          placeholder="Chidi Okeke"
        />
        <Input
          label="Email"
          value={user?.email ?? ""}
          readOnly
          className="bg-neutral-50 cursor-not-allowed text-neutral-400"
        />
        <Input
          label="Business Name"
          value={form.businessName}
          onChange={update("businessName")}
          placeholder="Okeke Designs"
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={update("phone")}
          placeholder="+234 800 000 0000"
        />
        <Input
          label="Logo URL"
          type="url"
          value={form.logoUrl}
          onChange={update("logoUrl")}
          placeholder="https://example.com/logo.png"
        />
        <Button
          type="submit"
          loading={updateMutation.isPending}
          className="w-full mt-2"
        >
          Save Changes
        </Button>
      </form>

      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide mb-4">
          Account Actions
        </h2>
        <button
          onClick={logout}
          className="text-sm font-medium text-error-600 hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
