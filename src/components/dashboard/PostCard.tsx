"use client";

import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { cn, formatDateTimeDetailed, STATUS_COLORS, STATUS_LABELS } from "@/lib/utils";
import type { Post, Platform } from "@/lib/types";

interface PostCardProps {
  post: Post;
  onClick: (post: Post) => void;
  index?: number;
}

export function PostCard({ post, onClick, index = 0 }: PostCardProps) {
  const statusColor = STATUS_COLORS[post.status] || "var(--cream-muted)";
  const statusLabel = STATUS_LABELS[post.status] || post.status;

  return (
    <button
      onClick={() => onClick(post)}
      className={cn(
        "w-full text-left group transition-all duration-300",
        "bg-obsidian-raised border border-obsidian-border/40 rounded-2xl p-6",
        "hover:border-indigo/40 hover:bg-obsidian-hover hover:shadow-xl hover:shadow-indigo/5 hover:-translate-y-1",
        "animate-stagger"
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex flex-col gap-6">
        {/* Header - Simple Platform Icon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-obsidian-hover border border-obsidian-border/50 group-hover:border-indigo/30 transition-colors">
              <PlatformIcon 
                platform={post.platform as Platform} 
                size={14} 
                className="text-cream-faint group-hover:text-indigo-light transition-colors" 
              />
            </div>
            <span className="text-[11px] font-medium tracking-wide text-cream-faint opacity-50 uppercase group-hover:opacity-100 transition-opacity">
              Scheduled
            </span>
          </div>
          
          {/* Status Dot - Subtle */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-obsidian-hover border border-obsidian-border/30">
            <div 
              className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
              style={{ backgroundColor: statusColor }}
            />
            <span className="text-[10px] font-bold text-cream-faint uppercase tracking-tighter">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Content Body - Heroic Typography */}
        <div className="relative">
          <p className="text-[15px] leading-relaxed text-cream/90 group-hover:text-cream transition-colors line-clamp-4">
            {post.content}
          </p>
        </div>

        {/* Footer - Unified Metadata */}
        <div className="flex items-center justify-between text-[11px] font-medium text-cream-faint/60 group-hover:text-cream-faint transition-colors pt-2 border-t border-obsidian-border/20">
          <div className="flex items-center gap-4">
            <span>{formatDateTimeDetailed(post.scheduled_at)}</span>
            <span className="w-1 h-1 rounded-full bg-obsidian-border/40" />
            <span className="capitalize">{post.platform} Post</span>
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
            <span className="text-indigo-light font-bold">Edit Details →</span>
          </div>
        </div>
      </div>
    </button>
  );
}
