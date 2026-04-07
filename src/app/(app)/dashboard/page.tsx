"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CalendarView } from "@/components/dashboard/CalendarView";
import { PostDrawer } from "@/components/dashboard/PostDrawer";
import { DayDrawer } from "@/components/dashboard/DayDrawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { CalendarDays, Plus } from "lucide-react";
import Link from "next/link";
import type { Post } from "@/lib/types";

export default function DashboardPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayPosts, setDayPosts] = useState<Post[]>([]);
  const [view, setView] = useState<"week" | "month">("month");

  const fetchPosts = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("posts")
      .select("*, campaign:campaigns(name, type)")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true });

    if (data) setPosts(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostUpdate = async (postId: string, updates: Partial<Post>) => {
    const { error } = await supabase
      .from("posts")
      .update(updates)
      .eq("id", postId);

    if (!error) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
      );
      if (selectedPost?.id === postId) {
        setSelectedPost({ ...selectedPost, ...updates });
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cream font-[family-name:var(--font-playfair)]">
            Dashboard
          </h1>
          <p className="text-sm text-cream-muted mt-1">
            Overview of your scheduled and published posts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-obsidian-raised border border-obsidian-border rounded-lg p-0.5">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "week"
                  ? "bg-indigo text-white"
                  : "text-cream-muted hover:text-cream"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                view === "month"
                  ? "bg-indigo text-white"
                  : "text-cream-muted hover:text-cream"
              }`}
            >
              Month
            </button>
          </div>

          <Link href="/campaigns/new">
            <Button size="sm">
              <Plus size={14} />
              New Campaign
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <CalendarSkeleton />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={28} />}
          title="No posts scheduled yet"
          description="Create your first campaign to start generating and scheduling AI-powered social media posts."
          action={
            <Link href="/campaigns/new">
              <Button>
                <Plus size={14} />
                Create Campaign
              </Button>
            </Link>
          }
        />
      ) : (
        <CalendarView
          posts={posts}
          view={view}
          onPostClick={setSelectedPost}
          onDayClick={(day, posts) => {
            setSelectedDay(day);
            setDayPosts(posts);
          }}
        />
      )}

      {/* Post detail drawer */}
      <PostDrawer
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onUpdate={handlePostUpdate}
        onRefresh={fetchPosts}
      />

      {/* Day detail drawer */}
      <DayDrawer
        day={selectedDay}
        posts={dayPosts}
        onClose={() => setSelectedDay(null)}
        onPostClick={(post) => {
          setSelectedDay(null); // Close day view
          setSelectedPost(post); // Open post view
        }}
      />
    </div>
  );
}
