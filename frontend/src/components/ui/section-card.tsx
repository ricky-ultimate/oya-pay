import { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}

export function SectionCard({
  title,
  children,
  className = "",
  headerRight,
}: SectionCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-neutral-200 ${className}`}
    >
      {title && (
        <div className="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
          {headerRight}
        </div>
      )}
      {children}
    </div>
  );
}

interface SectionCardBodyProps {
  children: ReactNode;
  className?: string;
}

export function SectionCardBody({
  children,
  className = "",
}: SectionCardBodyProps) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
