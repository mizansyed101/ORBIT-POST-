"use client";

import { cn } from "@/lib/utils";
import type { PostStatus } from "@/lib/types";

interface BadgeProps {
  status: PostStatus;
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
}

const statusConfig: Record<PostStatus, { label: string; bg: string; text: string; dot: string }> = {
  generated: {
    label: "Generated",
    bg: "bg-info/10",
    text: "text-info",
    dot: "bg-info",
  },
  pending_review: {
    label: "Pending Review",
    bg: "bg-warning/10",
    text: "text-warning",
    dot: "bg-warning",
  },
  approved: {
    label: "Approved",
    bg: "bg-indigo/10",
    text: "text-indigo",
    dot: "bg-indigo",
  },
  scheduled: {
    label: "Scheduled",
    bg: "bg-indigo/10",
    text: "text-indigo",
    dot: "bg-indigo",
  },
  posted: {
    label: "Posted",
    bg: "bg-mint/10",
    text: "text-mint",
    dot: "bg-mint",
  },
  failed: {
    label: "Failed",
    bg: "bg-error/10",
    text: "text-error",
    dot: "bg-error",
  },
  skipped: {
    label: "Skipped",
    bg: "bg-cream-faint/10",
    text: "text-cream-muted",
    dot: "bg-cream-muted",
  },
};

export function Badge({ status, size = "sm", pulse, className }: BadgeProps) {
  const config = statusConfig[status];
  const shouldPulse = pulse ?? (status === "scheduled" || status === "pending_review");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-mono font-medium",
        config.bg,
        config.text,
        size === "sm" && "text-[10px] px-2 py-0.5",
        size === "md" && "text-xs px-2.5 py-1",
        className
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full",
          config.dot,
          size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
          shouldPulse && "animate-pulse-mint"
        )}
      />
      {config.label}
    </span>
  );
}
