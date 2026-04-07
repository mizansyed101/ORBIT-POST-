"use client";

import { cn } from "@/lib/utils";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import type { Platform } from "@/lib/types";
import { Heart, MessageCircle, Repeat2, Share, ThumbsUp, Send, Bookmark } from "lucide-react";

interface PlatformPreviewProps {
  platform: Platform;
  content: string;
  authorName: string;
  className?: string;
}

export function PlatformPreview({ platform, content, authorName, className }: PlatformPreviewProps) {
  return (
    <div className={cn("rounded-xl border border-obsidian-border overflow-hidden", className)}>
      {platform === "twitter" && <TwitterPreview content={content} author={authorName} />}
      {platform === "linkedin" && <LinkedInPreview content={content} author={authorName} />}
      {platform === "instagram" && <InstagramPreview content={content} author={authorName} />}
      {platform === "facebook" && <FacebookPreview content={content} author={authorName} />}
      {platform === "threads" && <ThreadsPreview content={content} author={authorName} />}
    </div>
  );
}

function TwitterPreview({ content, author }: { content: string; author: string }) {
  return (
    <div className="bg-black p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-700 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm font-bold text-white">{author}</span>
            <span className="text-sm text-gray-500">@{author.toLowerCase().replace(/\s/g, "")} · 1m</span>
          </div>
          <p className="text-[15px] text-white whitespace-pre-wrap break-words leading-5">{content}</p>
          <div className="flex items-center justify-between mt-3 max-w-[300px] text-gray-500">
            <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
              <MessageCircle size={14} /><span className="text-xs">0</span>
            </button>
            <button className="flex items-center gap-1 hover:text-green-400 transition-colors">
              <Repeat2 size={14} /><span className="text-xs">0</span>
            </button>
            <button className="flex items-center gap-1 hover:text-pink-400 transition-colors">
              <Heart size={14} /><span className="text-xs">0</span>
            </button>
            <button className="hover:text-blue-400 transition-colors">
              <Share size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInPreview({ content, author }: { content: string; author: string }) {
  return (
    <div className="bg-[#1B1F23] p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gray-700 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">{author}</p>
          <p className="text-xs text-gray-400">Professional · 1m</p>
        </div>
      </div>
      <p className="text-sm text-gray-200 whitespace-pre-wrap break-words leading-5">{content}</p>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-700 text-gray-400 text-xs">
        <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
          <ThumbsUp size={14} /> Like
        </button>
        <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
          <MessageCircle size={14} /> Comment
        </button>
        <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
          <Repeat2 size={14} /> Repost
        </button>
        <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
          <Send size={14} /> Send
        </button>
      </div>
    </div>
  );
}

function InstagramPreview({ content, author }: { content: string; author: string }) {
  return (
    <div className="bg-black p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-500 p-0.5">
          <div className="w-full h-full rounded-full bg-black" />
        </div>
        <span className="text-sm font-semibold text-white">{author.toLowerCase().replace(/\s/g, "")}</span>
      </div>
      <div className="w-full h-48 bg-gray-800 rounded-lg mb-3 flex items-center justify-center text-gray-500 text-xs">
        Image placeholder
      </div>
      <div className="flex items-center gap-3 mb-2 text-white">
        <Heart size={20} />
        <MessageCircle size={20} />
        <Send size={20} />
        <Bookmark size={20} className="ml-auto" />
      </div>
      <p className="text-sm text-white">
        <span className="font-semibold mr-1">{author.toLowerCase().replace(/\s/g, "")}</span>
        <span className="whitespace-pre-wrap break-words">{content}</span>
      </p>
    </div>
  );
}

function FacebookPreview({ content, author }: { content: string; author: string }) {
  return (
    <div className="bg-[#242526] p-4">
      <div className="flex items-start gap-2 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">{author}</p>
          <p className="text-xs text-gray-400">Just now · 🌐</p>
        </div>
      </div>
      <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{content}</p>
      <div className="flex items-center justify-around mt-4 pt-3 border-t border-gray-600 text-gray-400 text-sm">
        <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
          <ThumbsUp size={16} /> Like
        </button>
        <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
          <MessageCircle size={16} /> Comment
        </button>
        <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
          <Share size={16} /> Share
        </button>
      </div>
    </div>
  );
}

function ThreadsPreview({ content, author }: { content: string; author: string }) {
  return (
    <div className="bg-[#101010] p-4">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-700 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="text-sm font-semibold text-white">{author.toLowerCase().replace(/\s/g, "")}</span>
            <span className="text-xs text-gray-500">1m</span>
          </div>
          <p className="text-[15px] text-white whitespace-pre-wrap break-words leading-5">{content}</p>
          <div className="flex items-center gap-4 mt-3 text-gray-500">
            <Heart size={16} />
            <MessageCircle size={16} />
            <Repeat2 size={16} />
            <Send size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
