import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function formatDateTimeDetailed(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  
  const dateStr = isToday ? "Today" : d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateStr} @ ${timeStr}`;
}

export function groupPostsByDay<T extends { scheduled_at: string | Date }>(posts: T[]) {
  const groups: Record<string, T[]> = {};
  
  posts.forEach(post => {
    const date = new Date(post.scheduled_at).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(post);
  });

  return Object.entries(groups).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
}

export function formatRelative(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  linkedin: 3000,
  instagram: 2200,
  facebook: 500,
  threads: 500,
};

export const PLATFORM_LABELS: Record<string, string> = {
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  threads: "Threads",
};

export const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  instagram: "#E4405F",
  facebook: "#1877F2",
  threads: "#FFFFFF",
};

export const STATUS_LABELS: Record<string, string> = {
  generated: "Generated",
  pending_review: "Pending Review",
  approved: "Approved",
  scheduled: "Scheduled",
  posted: "Posted",
  failed: "Failed",
  skipped: "Skipped",
};

export const STATUS_COLORS: Record<string, string> = {
  generated: "var(--info)",
  pending_review: "var(--warning)",
  approved: "var(--indigo)",
  scheduled: "var(--indigo)",
  posted: "var(--mint)",
  failed: "var(--error)",
  skipped: "var(--cream-muted)",
};
