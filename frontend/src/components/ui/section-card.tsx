import { ReactNode } from "react";

interface SectionCardProps {
  children: ReactNode;
  title?: string;
  headerRight?: ReactNode;
  className?: string;
}

export function SectionCard({
  children,
  title,
  headerRight,
  className = "",
}: SectionCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-200 overflow-hidden ${className}`}
    >
      {(title || headerRight) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          {title && (
            <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
          )}
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

export function SectionCardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>;
}
