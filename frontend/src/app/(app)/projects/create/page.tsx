"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Client } from "@/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { SectionCard, SectionCardBody } from "@/components/ui/section-card";
import { useToast } from "@/components/ui/toast";

function CreateProjectPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [clientId, setClientId] = useState(searchParams.get("clientId") ?? "");
  const [name, setName] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [paymentTermsDays, setPaymentTermsDays] = useState("14");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => api.getClients(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createProject({
        clientId,
        name,
        ...(totalValue ? { totalValue: parseFloat(totalValue) } : {}),
        paymentTermsDays: parseInt(paymentTermsDays, 10) || 14,
      }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast("Project created", "success");
      router.push(`/projects/${project.id}`);
    },
    onError: (err: Error) =>
      toast(err.message ?? "Failed to create project", "error"),
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next["name"] = "Project name is required";
    if (!clientId) next["clientId"] = "Select a client";
    const terms = parseInt(paymentTermsDays, 10);
    if (isNaN(terms) || terms < 1 || terms > 365)
      next["paymentTermsDays"] = "Must be between 1 and 365";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    createMutation.mutate();
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold text-neutral-900">New Project</h1>
      </div>

      <SectionCard>
        <SectionCardBody className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Project Details
          </h2>
          <Input
            label="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Zenith Bank Website Redesign"
            error={errors["name"]}
          />
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            error={errors["clientId"]}
          >
            <option value="">Select a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </SectionCardBody>
      </SectionCard>

      <SectionCard>
        <SectionCardBody className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">
            Payment Terms
          </h2>
          <Input
            label="Default Payment Terms (days)"
            type="number"
            min="1"
            max="365"
            value={paymentTermsDays}
            onChange={(e) => setPaymentTermsDays(e.target.value)}
            suffix="days"
            error={errors["paymentTermsDays"]}
          />
          <p className="text-xs text-neutral-400 -mt-2">
            Milestone and final invoices will default to this due date window.
            Deposit invoices always default to 5 days regardless.
          </p>
          <Input
            label="Estimated Project Value (optional)"
            type="number"
            min="0"
            step="0.01"
            value={totalValue}
            onChange={(e) => setTotalValue(e.target.value)}
            prefix="₦"
            error={errors["totalValue"]}
          />
          <p className="text-xs text-neutral-400 -mt-2">
            Used to track collection progress. Leave blank if the total is not
            yet fixed.
          </p>
        </SectionCardBody>
      </SectionCard>

      <div className="flex gap-3 pb-4">
        <Button
          variant="secondary"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={createMutation.isPending}
          className="flex-1"
        >
          Create Project
        </Button>
      </div>
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <Suspense>
      <CreateProjectPageInner />
    </Suspense>
  );
}
