"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Client, CreateClientInput } from "@/types";
import { validatePhoneForWhatsApp } from "@/lib/phone.utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ReliabilityBadge } from "@/components/ui/reliability-badge";
import {
  IconWhatsApp,
  IconEdit,
  IconTrash,
  IconChevronRight,
} from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const emptyForm: ClientFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
};

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<ClientFormData>>({});

  const phoneValidation = useMemo(
    () => validatePhoneForWhatsApp(form.phone),
    [form.phone],
  );

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: () => api.getClients(),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q),
    );
  }, [clients, search]);

  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditTarget(client);
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone ?? "",
      address: client.address ?? "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const next: Partial<ClientFormData> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateClientInput) => api.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast("Client created", "success");
      setModalOpen(false);
    },
    onError: () => toast("Failed to create client", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateClientInput>;
    }) => api.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast("Client updated", "success");
      setModalOpen(false);
    },
    onError: () => toast("Failed to update client", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast("Client deleted", "success");
      setDeleteId(null);
    },
    onError: () => toast("Failed to delete client", "error"),
  });

  const handleSubmit = () => {
    if (!validate()) return;
    const payload: CreateClientInput = {
      name: form.name,
      email: form.email,
      ...(form.phone && { phone: form.phone }),
      ...(form.address && { address: form.address }),
    };
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const update =
    (key: keyof ClientFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
          Clients
        </h1>
        <Button onClick={openCreate}>Add Client</Button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200">
        <div className="px-4 py-4 border-b border-neutral-200">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="p-4 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No clients found"
            description={
              search
                ? "Try adjusting your search."
                : "Add your first client to get started."
            }
            action={
              !search ? (
                <Button onClick={openCreate}>Add Client</Button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-neutral-100">
            {filtered.map((client) => (
              <div
                key={client.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors"
              >
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold flex-shrink-0">
                    {client.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {client.name}
                      </p>
                      {client.phone && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-brand-green flex-shrink-0">
                          <IconWhatsApp className="w-3 h-3" /> WA
                        </span>
                      )}
                      {client.reliabilityScore &&
                        client.reliabilityScore !== "no_data" && (
                          <ReliabilityBadge
                            score={client.reliabilityScore}
                            className="hidden sm:inline-flex"
                          />
                        )}
                    </div>
                    <p className="text-xs text-neutral-500 truncate">
                      {client.email}
                    </p>
                  </div>
                </Link>
                <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 flex-shrink-0">
                  <span>
                    {client._count?.invoices ?? 0} invoice
                    {(client._count?.invoices ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(client)}
                    className="p-1.5 rounded text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    aria-label="Edit client"
                  >
                    <IconEdit />
                  </button>
                  <button
                    onClick={() => setDeleteId(client.id)}
                    className="p-1.5 rounded text-neutral-400 hover:text-error-600 hover:bg-error-50 transition-colors"
                    aria-label="Delete client"
                  >
                    <IconTrash />
                  </button>
                  <Link
                    href={`/clients/${client.id}`}
                    className="p-1.5 rounded text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  >
                    <IconChevronRight />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Edit Client" : "Add Client"}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={isSaving}>
              {editTarget ? "Save Changes" : "Add Client"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            value={form.name}
            onChange={update("name")}
            error={errors.name}
            placeholder="Amaka Eze"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={update("email")}
            error={errors.email}
            placeholder="amaka@example.com"
          />
          <div className="flex flex-col gap-1">
            <Input
              label="WhatsApp / Phone (optional)"
              type="tel"
              value={form.phone}
              onChange={update("phone")}
              placeholder="+234 801 000 0000"
            />
            {form.phone && phoneValidation.level !== "none" && (
              <p
                className={[
                  "text-xs px-1",
                  phoneValidation.level === "invalid"
                    ? "text-error-600"
                    : "text-warning-600",
                ].join(" ")}
              >
                {phoneValidation.message}
              </p>
            )}
            {form.phone && phoneValidation.level === "none" && (
              <p className="text-xs text-brand-green px-1">
                WhatsApp delivery enabled for this client.
              </p>
            )}
          </div>
          <Input
            label="Address (optional)"
            value={form.address}
            onChange={update("address")}
            placeholder="Lagos, Nigeria"
          />
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Client"
        message="This client will be deleted. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
