"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UpdateProfileInput, WhatsAppStatus } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface BankOption {
  name: string;
  code: string;
}

interface SubaccountFormData {
  businessName: string;
  settlementBank: string;
  accountNumber: string;
  primaryContactEmail: string;
  primaryContactName: string;
  primaryContactPhone: string;
}

const emptySubaccountForm: SubaccountFormData = {
  businessName: "",
  settlementBank: "",
  accountNumber: "",
  primaryContactEmail: "",
  primaryContactName: "",
  primaryContactPhone: "",
};

function PayoutSetupCard({
  user,
  onSaved,
}: {
  user: ReturnType<typeof useAuth>["user"];
  onSaved: (code: string) => void;
}) {
  const { toast } = useToast();
  const [mode, setMode] = useState<"idle" | "create" | "manual">("idle");
  const [form, setForm] = useState<SubaccountFormData>(emptySubaccountForm);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState(
    user?.paystackSubaccountCode ?? "",
  );
  const isActive = user?.paystackSubaccountActive ?? false;

  const { data: banks = [], isLoading: banksLoading } = useQuery<BankOption[]>({
    queryKey: ["paystack-banks"],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"}/api/paystack/banks`,
      );
      const json = (await res.json()) as { data: BankOption[] };
      return json.data;
    },
    staleTime: 60 * 60 * 1000,
    enabled: mode === "create",
  });

  const resolveMutation = useMutation({
    mutationFn: async ({
      accountNumber,
      bankCode,
    }: {
      accountNumber: string;
      bankCode: string;
    }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001"}/api/paystack/resolve-account?account_number=${accountNumber}&bank_code=${bankCode}`,
      );
      const json = (await res.json()) as {
        data: { accountName: string };
        success: boolean;
        message: string;
      };
      if (!json.success) throw new Error(json.message);
      return json.data;
    },
    onSuccess: (data) => setResolvedName(data.accountName),
    onError: () => {
      setResolvedName(null);
      toast("Could not verify account number", "error");
    },
  });

  const createMutation = useMutation({
    mutationFn: () => api.createSubaccount(form),
    onSuccess: (data) => {
      toast("Paystack subaccount created", "success");
      onSaved(data.subaccountCode);
      setMode("idle");
    },
    onError: (err: Error) =>
      toast(err.message ?? "Failed to create subaccount", "error"),
  });

  const verifyManualMutation = useMutation({
    mutationFn: () => api.verifyAndSaveSubaccount(manualCode),
    onSuccess: () => {
      toast("Subaccount verified and saved", "success");
      onSaved(manualCode);
      setMode("idle");
    },
    onError: () => toast("Invalid subaccount code", "error"),
  });

  const update =
    (key: keyof SubaccountFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
      if (key === "accountNumber" || key === "settlementBank") {
        setResolvedName(null);
      }
    };

  const handleResolve = () => {
    if (form.accountNumber.length === 10 && form.settlementBank) {
      resolveMutation.mutate({
        accountNumber: form.accountNumber,
        bankCode: form.settlementBank,
      });
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
            Connect your bank account so clients can pay you directly through
            invoices.
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
            Payment links will not be generated until you connect a payout
            account.
          </p>
        </div>
      )}

      {mode === "idle" && (
        <div className="flex flex-col gap-2">
          <Button onClick={() => setMode("create")} className="w-full">
            {isActive ? "Update payout account" : "Connect bank account"}
          </Button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="text-xs text-neutral-500 hover:text-neutral-700 text-center"
          >
            Already have a subaccount code? Enter it manually
          </button>
        </div>
      )}

      {mode === "create" && (
        <div className="flex flex-col gap-3">
          <Input
            label="Business / Trading Name"
            value={form.businessName}
            onChange={update("businessName")}
            placeholder="Okeke Designs"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-neutral-700">
              Settlement Bank
            </label>
            <Select
              value={form.settlementBank}
              onChange={update("settlementBank")}
              disabled={banksLoading}
            >
              <option value="">
                {banksLoading ? "Loading banks..." : "Select a bank"}
              </option>
              {banks.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Input
              label="Account Number"
              value={form.accountNumber}
              onChange={update("accountNumber")}
              placeholder="0123456789"
              maxLength={10}
            />
            {form.accountNumber.length === 10 && form.settlementBank && (
              <div className="flex items-center gap-2">
                {resolvedName ? (
                  <p className="text-xs text-success-700 font-medium">
                    {resolvedName}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={resolveMutation.isPending}
                    className="text-xs text-primary-600 font-medium hover:underline disabled:opacity-50"
                  >
                    {resolveMutation.isPending
                      ? "Verifying..."
                      : "Verify account name"}
                  </button>
                )}
              </div>
            )}
          </div>
          <Input
            label="Contact Name (optional)"
            value={form.primaryContactName}
            onChange={update("primaryContactName")}
            placeholder="Chidi Okeke"
          />
          <Input
            label="Contact Email (optional)"
            type="email"
            value={form.primaryContactEmail}
            onChange={update("primaryContactEmail")}
            placeholder="chidi@example.com"
          />
          <Input
            label="Contact Phone (optional)"
            type="tel"
            value={form.primaryContactPhone}
            onChange={update("primaryContactPhone")}
            placeholder="08012345678"
          />
          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              onClick={() => setMode("idle")}
              className="flex-1"
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={
                !form.businessName ||
                !form.settlementBank ||
                !form.accountNumber ||
                !resolvedName
              }
              className="flex-1"
            >
              Create Subaccount
            </Button>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <div className="flex flex-col gap-3">
          <Input
            label="Subaccount Code"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="ACCT_xxxxxxxxxxxx"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setMode("idle")}
              className="flex-1"
              disabled={verifyManualMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => verifyManualMutation.mutate()}
              loading={verifyManualMutation.isPending}
              disabled={!manualCode.trim()}
              className="flex-1"
            >
              Verify and Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsAppStatusCard() {
  const { data: status, isLoading } = useQuery<WhatsAppStatus>({
    queryKey: ["whatsapp-platform-status"],
    queryFn: () => api.getWhatsAppStatus(),
    staleTime: 60_000,
  });

  const connected = status?.connected ?? false;
  const configured = status?.configured ?? false;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            WhatsApp Delivery
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {isLoading
              ? "Checking status..."
              : connected
                ? `Platform instance active. Reminders will be sent from the OyaPay shared number.`
                : configured
                  ? "Platform instance is configured but not connected. Contact support."
                  : "WhatsApp is not configured on this platform."}
          </p>
        </div>
        {!isLoading && (
          <span
            className={[
              "inline-flex items-center h-5 px-2 rounded-full text-xs font-semibold border flex-shrink-0",
              connected
                ? "bg-success-50 text-success-700 border-success-200"
                : "bg-neutral-100 text-neutral-500 border-neutral-200",
            ].join(" ")}
          >
            {connected ? "Active" : "Inactive"}
          </span>
        )}
      </div>
      {status?.phoneConnected && (
        <p className="text-xs text-neutral-400 mt-3">
          Connected number: {status.phoneConnected}
        </p>
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

  const handleSubaccountSaved = (code: string) => {
    if (user) {
      setUser({
        ...user,
        paystackSubaccountCode: code,
        paystackSubaccountActive: true,
      });
    }
  };

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

      <PayoutSetupCard user={user} onSaved={handleSubaccountSaved} />

      <WhatsAppStatusCard />

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
