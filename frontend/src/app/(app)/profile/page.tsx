"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  onManualSave,
  isSaving,
}: {
  subaccountCode: string;
  isActive: boolean;
  onManualSave: (code: string) => void;
  isSaving: boolean;
}) {
  const [code, setCode] = useState(subaccountCode);
  const [launching, setLaunching] = useState(false);
  const isDirty = code !== subaccountCode;

  useEffect(() => {
    setCode(subaccountCode);
  }, [subaccountCode]);

  const handleLaunchPaystack = async () => {
    setLaunching(true);
    try {
      const result = await api.getPaystackOnboardingUrl();
      window.location.href = result.url;
    } catch {
      setLaunching(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Paystack Payout Account
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Connect your Paystack subaccount so clients can pay you directly
            through invoices.
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
            Payment links will not be generated until you connect a Paystack
            subaccount.
          </p>
        </div>
      )}

      <Button
        onClick={handleLaunchPaystack}
        loading={launching}
        variant={isActive ? "secondary" : "primary"}
        className="w-full"
      >
        {isActive ? "Reconnect via Paystack" : "Connect Paystack Account"}
      </Button>

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-xs text-neutral-400 flex-shrink-0">
          or enter code manually
        </span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>

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
            onClick={() => onManualSave(code)}
            loading={isSaving}
            disabled={!code.trim() || !isDirty}
            size="md"
            variant="secondary"
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
              : "WhatsApp not connected. Go to the WhatsApp setup page to scan your QR code."}
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
      {!configured && (
        <a
          href="/profile/whatsapp"
          className="mt-3 inline-flex items-center h-9 px-4 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#128C7E] transition-colors"
        >
          Set up WhatsApp
        </a>
      )}
    </div>
  );
}

interface ProfileForm {
  name: string;
  businessName: string;
  phone: string;
  logoUrl: string;
}

function ProfileInner() {
  const { user, setUser, logout } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    businessName: "",
    phone: "",
    logoUrl: "",
  });
  const [formHydrated, setFormHydrated] = useState(false);

  useEffect(() => {
    const paystackStatus = searchParams.get("paystack");
    if (paystackStatus === "success") {
      toast("Paystack account connected successfully", "success");
      router.replace("/profile");
    } else if (paystackStatus === "error") {
      const reason = searchParams.get("reason");
      const messages: Record<string, string> = {
        missing_params: "Paystack returned incomplete data.",
        invalid_code: "The subaccount code could not be verified.",
        server_error: "An error occurred. Please try again.",
      };
      toast(messages[reason ?? ""] ?? "Paystack connection failed.", "error");
      router.replace("/profile");
    }
  }, [searchParams, toast, router]);

  useEffect(() => {
    if (!user || formHydrated) return;
    setForm({
      name: user.name ?? "",
      businessName: user.businessName ?? "",
      phone: user.phone ?? "",
      logoUrl: user.logoUrl ?? "",
    });
    setFormHydrated(true);
  }, [user, formHydrated]);

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
    (key: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
        onManualSave={(code) => subaccountMutation.mutate(code)}
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

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileInner />
    </Suspense>
  );
}
