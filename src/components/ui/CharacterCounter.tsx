"use client";

import { cn } from "@/lib/utils";
import { PLATFORM_LIMITS } from "@/lib/utils";
import type { Platform } from "@/lib/types";

interface CharacterCounterProps {
  value: string;
  platform: Platform;
  className?: string;
}

export function CharacterCounter({ value, platform, className }: CharacterCounterProps) {
  const limit = PLATFORM_LIMITS[platform] || 280;
  const count = value.length;
  const remaining = limit - count;
  const percentage = (count / limit) * 100;
  const isOver = remaining < 0;
  const isWarning = remaining >= 0 && remaining <= Math.floor(limit * 0.1);

  const circumference = 2 * Math.PI * 10;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Circular progress */}
      <svg width="24" height="24" viewBox="0 0 24 24" className="transform -rotate-90">
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="var(--obsidian-border)"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke={isOver ? "var(--error)" : isWarning ? "var(--warning)" : "var(--indigo)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300"
        />
      </svg>
      {/* Count text */}
      <span
        className={cn(
          "text-xs font-mono tabular-nums",
          isOver ? "text-error font-semibold" : isWarning ? "text-warning" : "text-cream-muted"
        )}
      >
        {remaining}
      </span>
    </div>
  );
}
