"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const borderColors: Record<ToastType, string> = {
  success: "border-l-success-500",
  error: "border-l-error-500",
  info: "border-l-primary-500",
};

const icons: Record<ToastType, string> = {
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  error: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

const iconColors: Record<ToastType, string> = {
  success: "text-success-500",
  error: "text-error-500",
  info: "text-primary-500",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      },
      type === "error" ? 5000 : 3000,
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[1070] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`bg-white rounded-lg shadow-lg border-l-4 ${borderColors[t.type]} px-4 py-3 flex items-start gap-3 pointer-events-auto`}
            role="alert"
          >
            <svg
              className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColors[t.type]}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={icons[t.type]}
              />
            </svg>
            <p className="text-sm text-neutral-700 flex-1">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
