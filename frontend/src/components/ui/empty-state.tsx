import { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="w-12 h-12 mb-4 text-neutral-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-neutral-700 mb-2">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}
