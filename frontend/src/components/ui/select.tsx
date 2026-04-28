import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={[
              "w-full h-11 border rounded-lg bg-white text-neutral-900 text-sm appearance-none pl-3 pr-10 transition-colors duration-100",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              error
                ? "border-error-500"
                : "border-neutral-300 hover:border-neutral-400",
              className,
            ].join(" ")}
            {...props}
          >
            {children}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 w-4 h-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        {error && <p className="text-sm text-error-600">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
