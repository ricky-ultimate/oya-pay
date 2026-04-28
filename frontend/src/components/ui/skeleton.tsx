interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-neutral-200 rounded animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}
