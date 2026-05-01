import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-sm text-neutral-400 pointer-events-none select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              "w-full h-9 rounded-lg border text-sm text-neutral-900 bg-white placeholder-neutral-400 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              "disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed",
              "read-only:bg-neutral-50 read-only:cursor-default",
              error
                ? "border-error-500 focus:ring-error-500"
                : "border-neutral-200 hover:border-neutral-300",
              prefix ? "pl-7" : "pl-3",
              suffix ? "pr-7" : "pr-3",
              className,
            ].join(" ")}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-sm text-neutral-400 pointer-events-none select-none">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-error-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
