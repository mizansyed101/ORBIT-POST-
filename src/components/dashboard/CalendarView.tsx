"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Post, Platform } from "@/lib/types";

interface CalendarViewProps {
  posts: Post[];
  view: "week" | "month";
  onPostClick: (post: Post) => void;
  onDayClick: (day: Date, posts: Post[]) => void;
}

export function CalendarView({ posts, view, onPostClick, onDayClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigate = (direction: "prev" | "next") => {
    if (view === "month") {
      setCurrentDate(direction === "next" ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === "next" ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    }
  };

  const days = useMemo(() => {
    if (view === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const start = startOfWeek(monthStart, { weekStartsOn: 1 });
      const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      const daysArray = [];
      let day = start;
      while (day <= end) {
        daysArray.push(day);
        day = addDays(day, 1);
      }
      return daysArray;
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }
  }, [currentDate, view]);

  const postsByDate = useMemo(() => {
    const map: Record<string, Post[]> = {};
    posts.forEach((post) => {
      const key = format(new Date(post.scheduled_at), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(post);
    });
    return map;
  }, [posts]);

  const weekDayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cream font-[family-name:var(--font-playfair)]">
          {view === "month"
            ? format(currentDate, "MMMM yyyy")
            : `Week of ${format(days[0], "MMM d")} – ${format(days[6], "MMM d, yyyy")}`}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("prev")}
            className="p-1.5 rounded-lg text-cream-muted hover:text-cream hover:bg-obsidian-hover transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-xs font-medium text-cream-muted hover:text-cream hover:bg-obsidian-hover rounded-lg transition-all"
          >
            Today
          </button>
          <button
            onClick={() => navigate("next")}
            className="p-1.5 rounded-lg text-cream-muted hover:text-cream hover:bg-obsidian-hover transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekDayHeaders.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium uppercase tracking-wider text-cream-faint py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={cn("grid grid-cols-7 gap-1", view === "week" && "min-h-[300px]")}>
        {days.map((day, i) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDate[dateKey] || [];
          const inMonth = view === "month" ? isSameMonth(day, currentDate) : true;
          const today = isToday(day);

          return (
            <div
              key={i}
              onClick={() => onDayClick(day, dayPosts)}
              className={cn(
                "rounded-lg border border-obsidian-border/50 p-2 min-h-[100px]",
                "transition-all duration-200",
                inMonth ? "bg-obsidian-raised/50" : "bg-obsidian/50 opacity-40",
                today && "border-indigo/40 bg-indigo/5",
                "hover:border-indigo/40 hover:bg-obsidian-hover/50 cursor-pointer",
                "animate-stagger group/day",
              )}
              style={{ animationDelay: `${(i % 7) * 30}ms` }}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={cn(
                    "text-xs font-medium",
                    today
                      ? "text-indigo font-bold"
                      : inMonth
                        ? "text-cream-muted"
                        : "text-cream-faint"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayPosts.length > 0 && (
                  <span className="text-[9px] font-mono text-cream-faint">
                    {dayPosts.length}
                  </span>
                )}
              </div>

              {/* Post blocks */}
              <div className="space-y-1">
                {dayPosts.slice(0, view === "week" ? 6 : 3).map((post) => (
                  <button
                    key={post.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPostClick(post);
                    }}
                    className={cn(
                      "w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md",
                      "text-left transition-all duration-150",
                      "hover:bg-indigo/10 hover:scale-[1.02]",
                      "group cursor-pointer"
                    )}
                  >
                    <PlatformIcon
                      platform={post.platform as Platform}
                      size={10}
                      className="shrink-0 text-cream-faint group-hover:text-cream"
                    />
                    <span className="text-[10px] text-cream-muted truncate flex-1 group-hover:text-cream">
                      {post.content.slice(0, 30)}
                    </span>
                  </button>
                ))}
                {dayPosts.length > (view === "week" ? 6 : 3) && (
                  <div className="flex items-center justify-between px-1.5">
                    <span className="text-[9px] text-cream-faint">
                      +{dayPosts.length - (view === "week" ? 6 : 3)} more
                    </span>
                    <span className="text-[8px] text-indigo font-medium opacity-0 group-hover/day:opacity-100 transition-opacity">
                      View all
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status legend */}
      <div className="flex items-center gap-4 pt-2">
        {(["pending_review", "approved", "scheduled", "posted", "failed"] as const).map((status) => (
          <Badge key={status} status={status} size="sm" />
        ))}
      </div>
    </div>
  );
}
