import { IconBolt } from "@/components/ui/icons";

interface EscalateButtonProps {
  onClick: () => void;
  label?: string;
}

export function EscalateButton({
  onClick,
  label = "Escalate",
}: EscalateButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning-50 text-warning-700 text-xs font-medium hover:bg-warning-100 transition-colors"
    >
      <IconBolt className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
