import { TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

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
          className={[
            "w-full border rounded-lg bg-white text-neutral-900 text-sm placeholder-neutral-400 p-3 transition-colors duration-100 min-h-24 resize-y",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
            error
              ? "border-error-500"
              : "border-neutral-300 hover:border-neutral-400",
            className,
          ].join(" ")}
          {...props}
        />
        {error && <p className="text-sm text-error-600">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
