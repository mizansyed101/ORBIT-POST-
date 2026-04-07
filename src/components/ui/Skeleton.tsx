"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "card" | "circle" | "rectangle";
}

export function Skeleton({ className, variant = "text" }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-obsidian-hover rounded animate-shimmer",
        "bg-gradient-to-r from-obsidian-hover via-obsidian-border/30 to-obsidian-hover",
        "bg-[length:400%_100%]",
        variant === "text" && "h-4 w-full rounded",
        variant === "card" && "h-32 w-full rounded-xl",
        variant === "circle" && "h-10 w-10 rounded-full",
        variant === "rectangle" && "h-20 w-full rounded-lg",
        className
      )}
    />
  );
}

export function PostSkeleton() {
  return (
    <div className="bg-obsidian-raised border border-obsidian-border rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="h-8 w-8" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-2.5 w-20" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}
