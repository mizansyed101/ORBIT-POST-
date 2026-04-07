"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "indigo" | "mint" | "none";
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ children, className, hover = false, glow = "none", onClick, style }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={cn(
        "bg-obsidian-raised border border-obsidian-border rounded-xl",
        "transition-all duration-200",
        hover && "cursor-pointer hover:bg-obsidian-hover hover:border-cream-faint/20",
        hover && "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20",
        glow === "indigo" && "glow-indigo",
        glow === "mint" && "glow-mint",
        className
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("px-5 py-4 border-b border-obsidian-border", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
