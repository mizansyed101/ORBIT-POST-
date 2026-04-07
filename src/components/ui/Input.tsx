"use client";

import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, suffix, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-cream-muted uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cream-faint">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-obsidian-raised border border-obsidian-border rounded-lg px-4 py-2.5",
              "text-sm text-cream placeholder:text-cream-faint",
              "transition-all duration-200",
              "focus:outline-none focus:border-indigo focus:ring-1 focus:ring-indigo/30",
              "hover:border-cream-faint",
              icon && "pl-10",
              suffix && "pr-10",
              error && "border-error/50 focus:border-error focus:ring-error/30",
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-faint text-xs">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        {hint && !error && <p className="text-xs text-cream-faint">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input, type InputProps };
