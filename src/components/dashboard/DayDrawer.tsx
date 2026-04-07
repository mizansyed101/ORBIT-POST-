"use client";

import { Drawer } from "@/components/ui/Drawer";
import { Badge } from "@/components/ui/Badge";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { formatDateShort, formatTime } from "@/lib/utils";
import { Clock, Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import type { Post, Platform } from "@/lib/types";

interface DayDrawerProps {
  day: Date | null;
  posts: Post[];
  onClose: () => void;
  onPostClick: (post: Post) => void;
}

export function DayDrawer({ day, posts, onClose, onPostClick }: DayDrawerProps) {
  if (!day) return null;

  return (
    <Drawer
      open={!!day}
      onClose={onClose}
      title={`Posts for ${formatDateShort(day)}`}
      width="w-[520px]"
    >
      <div className="px-6 py-4 space-y-4">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-obsidian-hover flex items-center justify-center mb-4 text-cream-faint">
              <CalendarIcon size={24} />
            </div>
            <p className="text-sm text-cream-muted">No posts scheduled for this day.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <button
                key={post.id}
                onClick={() => onPostClick(post)}
                className="w-full bg-obsidian-raised border border-obsidian-border rounded-xl p-4 text-left transition-all duration-200 hover:border-indigo/50 hover:bg-obsidian-hover group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-obsidian-hover border border-obsidian-border flex items-center justify-center text-cream">
                      <PlatformIcon platform={post.platform as Platform} size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-cream capitalize">
                        {post.platform}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-cream-faint">
                        <Clock size={10} />
                        {formatTime(post.scheduled_at)}
                      </div>
                    </div>
                  </div>
                  <Badge status={post.status} size="sm" />
                </div>

                <p className="text-xs text-cream-muted leading-relaxed line-clamp-3 mb-3 font-mono">
                  {post.content}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-obsidian-border/50">
                  <span className="text-[10px] text-cream-faint uppercase tracking-wider font-semibold">
                    {post.campaign?.name || "No Campaign"}
                  </span>
                  <span className="text-[10px] text-indigo flex items-center gap-1 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View Details
                    <ChevronRight size={10} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
