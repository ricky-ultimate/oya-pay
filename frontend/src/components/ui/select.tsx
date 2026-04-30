import { SelectHTMLAttributes, forwardRef } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className = "", id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

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
        <select
          ref={ref}
          id={selectId}
          className={[
            "w-full h-9 rounded-lg border text-sm text-neutral-900 bg-white px-3 transition-colors appearance-none",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
            "disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed",
            error
              ? "border-error-500"
              : "border-neutral-200 hover:border-neutral-300",
            className,
          ].join(" ")}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            backgroundSize: "16px",
            paddingRight: "32px",
          }}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-error-600">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
