"use client";

import { Input } from "@/components/ui/input";
import { IconX } from "@/components/ui/icons";

export interface LineItem {
  description: string;
  quantity: string;
  unitPrice: string;
}

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  error?: string;
}

export function LineItemsEditor({
  items,
  onChange,
  error,
}: LineItemsEditorProps) {
  const updateItem = (idx: number, field: keyof LineItem, value: string) => {
    onChange(
      items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const addItem = () => {
    onChange([...items, { description: "", quantity: "1", unitPrice: "" }]);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-error-600">{error}</p>}
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <div className="flex-1">
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(idx, "description", e.target.value)}
            />
          </div>
          <div className="w-16">
            <Input
              placeholder="Qty"
              type="number"
              min="0.01"
              step="0.01"
              value={item.quantity}
              onChange={(e) => updateItem(idx, "quantity", e.target.value)}
            />
          </div>
          <div className="w-28">
            <Input
              placeholder="Unit Price"
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
              prefix="₦"
            />
          </div>
          {items.length > 1 && (
            <button
              onClick={() => removeItem(idx)}
              className="h-11 w-9 flex items-center justify-center rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 flex-shrink-0 transition-colors"
            >
              <IconX />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={addItem}
        className="text-sm text-primary-600 font-medium hover:underline text-left"
      >
        + Add item
      </button>
    </div>
  );
}
