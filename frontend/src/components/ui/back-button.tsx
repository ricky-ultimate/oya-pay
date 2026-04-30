"use client";

import { useRouter } from "next/navigation";
import { IconChevronLeft } from "./icons";

interface BackButtonProps {
  href?: string;
}

export function BackButton({ href }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
      aria-label="Go back"
    >
      <IconChevronLeft />
    </button>
  );
}
