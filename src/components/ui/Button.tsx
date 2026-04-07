"use client";

import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "mint";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus-ring rounded-lg",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Variants
          variant === "primary" && [
            "bg-indigo text-white hover:bg-indigo-hover",
            "hover:shadow-[0_0_20px_rgba(91,94,255,0.3)]",
            "active:scale-[0.98]",
          ],
          variant === "secondary" && [
            "bg-obsidian-raised text-cream border border-obsidian-border",
            "hover:bg-obsidian-hover hover:border-cream-faint",
            "active:scale-[0.98]",
          ],
          variant === "ghost" && [
            "bg-transparent text-cream-muted",
            "hover:bg-obsidian-hover hover:text-cream",
          ],
          variant === "danger" && [
            "bg-error/10 text-error border border-error/20",
            "hover:bg-error/20 hover:border-error/40",
            "active:scale-[0.98]",
          ],
          variant === "mint" && [
            "bg-mint/10 text-mint border border-mint/20",
            "hover:bg-mint/20 hover:border-mint/40",
            "active:scale-[0.98]",
          ],
          // Sizes
          size === "sm" && "text-xs px-3 py-1.5 gap-1.5",
          size === "md" && "text-sm px-4 py-2 gap-2",
          size === "lg" && "text-base px-6 py-3 gap-2.5",
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button, type ButtonProps };
