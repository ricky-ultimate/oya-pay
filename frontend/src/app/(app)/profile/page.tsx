"use client";

import { useState, useEffect, FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, UpdateProfileInput } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

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
