"use client";

import { cn } from "@/lib/utils";
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  width?: string;
}

export function Drawer({ open, onClose, title, children, className, width = "w-[480px]" }: DrawerProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full z-50",
          width,
          "max-w-[90vw]",
          "bg-obsidian border-l border-obsidian-border",
          "animate-slide-in-right",
          "flex flex-col",
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-obsidian-border">
            <h2 className="text-lg font-semibold text-cream">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-obsidian-hover text-cream-muted hover:text-cream transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
