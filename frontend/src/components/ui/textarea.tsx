import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={3}
          className={[
            "w-full rounded-lg border text-sm text-neutral-900 bg-white px-3 py-2.5 placeholder-neutral-400 transition-colors resize-none",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
            "disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed",
            error
              ? "border-error-500"
              : "border-neutral-200 hover:border-neutral-300",
            className,
          ].join(" ")}
          {...props}
        />
        {error && <p className="text-xs text-error-600">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
