import { InputHTMLAttributes, forwardRef, ReactNode } from "react";

interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "prefix" | "suffix"
> {
  label?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, prefix, suffix, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

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
            <span className="absolute left-3 text-neutral-500 text-sm pointer-events-none select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              "w-full h-11 border rounded-lg bg-white text-neutral-900 text-sm placeholder-neutral-400 transition-colors duration-100",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              error
                ? "border-error-500"
                : "border-neutral-300 hover:border-neutral-400",
              prefix ? "pl-8" : "pl-3",
              suffix ? "pr-8" : "pr-3",
              className,
            ].join(" ")}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-neutral-500 text-sm pointer-events-none select-none">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-sm text-error-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
