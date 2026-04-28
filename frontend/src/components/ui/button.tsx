import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:bg-primary-200",
  secondary:
    "bg-white text-primary-500 border border-primary-500 hover:bg-primary-50 active:bg-primary-100 disabled:opacity-50",
  ghost:
    "bg-transparent text-primary-500 hover:bg-neutral-100 active:bg-neutral-200 disabled:opacity-50",
  danger:
    "bg-error-500 text-white hover:bg-error-600 active:bg-error-700 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-md",
  md: "h-11 px-5 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none select-none",
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
