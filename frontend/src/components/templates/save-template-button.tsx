"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { TemplateItem } from "@/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface SaveTemplateButtonProps {
  title: string;
  items: TemplateItem[];
  tax: number;
  notes: string | null;
  currency: string;
}

export function SaveTemplateButton({
  title,
  items,
  tax,
  notes,
  currency,
}: SaveTemplateButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.createTemplate({
        name: name.trim(),
        title,
        items,
        tax,
        notes: notes ?? undefined,
        currency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast("Template saved", "success");
      setOpen(false);
      setName("");
    },
    onError: () => toast("Failed to save template", "error"),
  });

  const handleOpen = () => {
    setName(title);
    setNameError("");
    setOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setNameError("Template name is required");
      return;
    }
    mutation.mutate();
  };

  const handleClose = () => {
    if (mutation.isPending) return;
    setOpen(false);
    setName("");
    setNameError("");
  };

  return (
    <>
      <Button variant="ghost" size="md" onClick={handleOpen}>
        Save as Template
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        title="Save as Template"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} loading={mutation.isPending}>
              Save Template
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-500 leading-relaxed">
            Save this invoice as a reusable template. The title, line items,
            tax, and notes will be stored.
          </p>
          <Input
            label="Template Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            placeholder="e.g. Monthly Retainer"
            error={nameError}
          />
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
              Will be saved
            </p>
            <div className="flex flex-col gap-1.5 text-sm text-neutral-700">
              <p>
                <span className="font-medium">Title:</span> {title}
              </p>
              <p>
                <span className="font-medium">Items:</span> {items.length} line
                item{items.length !== 1 ? "s" : ""}
              </p>
              {tax > 0 && (
                <p>
                  <span className="font-medium">Tax:</span> {tax}%
                </p>
              )}
              {notes && (
                <p>
                  <span className="font-medium">Notes:</span> included
                </p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
