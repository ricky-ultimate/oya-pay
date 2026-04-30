import { formatNaira } from "@/utils/format";

interface InvoiceTotalsProps {
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
}

export function InvoiceTotals({
  subtotal,
  taxPercent,
  taxAmount,
  total,
}: InvoiceTotalsProps) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <div className="flex justify-between text-neutral-600">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatNaira(subtotal)}</span>
      </div>
      {taxPercent > 0 && (
        <div className="flex justify-between text-neutral-600">
          <span>Tax ({taxPercent}%)</span>
          <span className="tabular-nums">{formatNaira(taxAmount)}</span>
        </div>
      )}
      <div className="flex justify-between font-semibold text-neutral-900 text-base border-t-2 border-neutral-200 pt-2 mt-1">
        <span>Total</span>
        <span className="tabular-nums">{formatNaira(total)}</span>
      </div>
    </div>
  );
}
