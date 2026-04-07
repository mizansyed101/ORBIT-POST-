"use client";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-8",
        "animate-fade-in",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-obsidian-hover border border-obsidian-border flex items-center justify-center text-cream-faint mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-cream mb-2">{title}</h3>
      <p className="text-sm text-cream-muted max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
