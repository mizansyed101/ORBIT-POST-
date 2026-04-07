"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PostSkeleton } from "@/components/ui/Skeleton";
import { PostDrawer } from "@/components/dashboard/PostDrawer";
import { PostCard } from "@/components/dashboard/PostCard";
import { cn, formatDate, groupPostsByDay } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  Play,
  Pause,
  Trash2,
  TrendingUp,
  Link as LinkIcon,
  CheckCheck,
  CalendarDays,
  Target,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Campaign, Post, Schedule } from "@/lib/types";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);
  
  // Accordion state - stores date strings (toDateString format)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [campResult, postsResult, schedResult] = await Promise.all([
        supabase.from("campaigns").select("*").eq("id", id).eq("user_id", user.id).single(),
        supabase.from("posts").select("*").eq("campaign_id", id).order("scheduled_at", { ascending: true }),
        supabase.from("schedules").select("*").eq("campaign_id", id).single(),
      ]);

      if (campResult.data) setCampaign(campResult.data);
      if (postsResult.data) {
        setPosts(postsResult.data);
        // By default, expand "Today" if any posts exist for today
        const today = new Date().toDateString();
        const hasTodayPosts = postsResult.data.some(p => new Date(p.scheduled_at).toDateString() === today);
        if (hasTodayPosts) {
          setExpandedDays(new Set([today]));
        } else if (postsResult.data.length > 0) {
          // Otherwise expand the FIRST day in the schedule
          const firstDay = new Date(postsResult.data[0].scheduled_at).toDateString();
          setExpandedDays(new Set([firstDay]));
        }
      }
      if (schedResult.data) setSchedule(schedResult.data);
      setLoading(false);
    };
    fetchData();
  }, [id, supabase]);

  const handleToggleDay = (dateStr: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: id }),
      });
      const data = await res.json();
      if (data.success) {
        const { data: newPosts } = await supabase
          .from("posts")
          .select("*")
          .eq("campaign_id", id)
          .order("scheduled_at", { ascending: true });
        if (newPosts) setPosts(newPosts);
      }
    } catch (err) {
      console.error("Generation failed:", err);
    }
    setGenerating(false);
  };

  const handleToggleActive = async () => {
    if (!campaign) return;
    await supabase.from("campaigns").update({ active: !campaign.active }).eq("id", campaign.id);
    setCampaign({ ...campaign, active: !campaign.active });
  };

  const handleDeleteCampaign = async () => {
    if (!campaign) return;
    setDeleting(true);
    await supabase.from("posts").delete().eq("campaign_id", campaign.id);
    await supabase.from("schedules").delete().eq("campaign_id", campaign.id);
    await supabase.from("campaigns").delete().eq("id", campaign.id);
    router.push("/campaigns");
  };

  const handleBulkApprove = async () => {
    const pendingPosts = posts.filter((p) => p.status === "pending_review" || p.status === "generated");
    if (pendingPosts.length === 0) return;
    setBulkApproving(true);
    const ids = pendingPosts.map((p) => p.id);
    await supabase.from("posts").update({ status: "approved" }).in("id", ids);
    setPosts((prev) => prev.map((p) => (ids.includes(p.id) ? { ...p, status: "approved" } : p)));
    
    // Automatically trigger the publisher
    try {
      await fetch("/api/posts/publish", { method: "POST" });
      await refreshPosts();
    } catch (err) {
      console.error("Auto-publish trigger failed", err);
    }
    
    setBulkApproving(false);
  };

  const handlePostUpdate = async (postId: string, updates: Partial<Post>) => {
    await supabase.from("posts").update(updates).eq("id", postId);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, ...updates } : p)));
    if (selectedPost?.id === postId) setSelectedPost({ ...selectedPost, ...updates });
    
    if (updates.status === "approved") {
      try {
        await fetch("/api/posts/publish", { method: "POST" });
        await refreshPosts();
      } catch (err) {
        console.error("Auto-publish trigger failed", err);
      }
    }
  };

  const refreshPosts = async () => {
    const { data } = await supabase.from("posts").select("*").eq("campaign_id", id).order("scheduled_at", { ascending: true });
    if (data) setPosts(data);
  };

  const statusCounts = useMemo(() => posts.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>), [posts]);

  const groupedPosts = useMemo(() => groupPostsByDay(posts), [posts]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
      </div>
    );
  }

  if (!campaign) return <div className="text-center py-20 text-cream-muted">Campaign not found</div>;

  return (
    <div className="animate-fade-in pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/campaigns")} className="p-2 rounded-lg text-cream-muted hover:text-cream hover:bg-obsidian-hover transition-all">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", campaign.type === "trend" ? "bg-mint/10 text-mint" : "bg-indigo/10 text-indigo")}>
              {campaign.type === "trend" ? <TrendingUp size={18} /> : <LinkIcon size={18} />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-cream leading-tight">{campaign.name}</h1>
              <p className="text-[10px] text-cream-muted uppercase tracking-widest font-bold">Campaign Dashboard</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant={campaign.active ? "ghost" : "mint"} size="sm" onClick={handleToggleActive}>
            {campaign.active ? <Pause size={14} /> : <Play size={14} />}
            {campaign.active ? "Pause" : "Resume"}
          </Button>
          <Button onClick={handleGenerate} loading={generating} size="sm">
            {generating ? <Loader2 size={14} className="animate-spin" /> : null}
            Generate Posts
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Main Feed Column */}
        <div className="lg:col-span-8 space-y-4">
          {posts.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="text-center py-20 text-cream-faint">
                <Loader2 size={32} className="opacity-10 animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium">Your campaign is ready. Let's create some content!</p>
                <Button size="sm" variant="secondary" className="mt-4" onClick={handleGenerate}>First Generation →</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {groupedPosts.map(([date, dayPosts]) => {
                const isExpanded = expandedDays.has(date);
                const isToday = date === new Date().toDateString();
                
                return (
                  <div key={date} className={cn(
                    "rounded-3xl border transition-all duration-500 overflow-hidden",
                    isExpanded ? "bg-obsidian-raised/30 border-obsidian-border" : "bg-transparent border-transparent hover:bg-obsidian-hover/40"
                  )}>
                    {/* Interactive Header Toggle */}
                    <button 
                      onClick={() => handleToggleDay(date)}
                      className="w-full text-left px-6 py-5 flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                          isExpanded ? "bg-indigo text-white scale-110" : "bg-obsidian-border/40 text-cream-faint"
                        )}>
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </div>
                        <div>
                          <h2 className={cn(
                            "text-[13px] font-bold uppercase tracking-widest transition-colors",
                            isExpanded ? "text-cream" : "text-cream-muted group-hover:text-cream-faint"
                          )}>
                            {isToday ? "Today • " : ""}
                            {new Date(date).toLocaleDateString("en-US", { weekday: 'long', month: 'long', day: 'numeric' })}
                          </h2>
                          <p className="text-[10px] text-cream-faint/40 font-medium uppercase mt-0.5">
                            {dayPosts.length} post{dayPosts.length !== 1 ? 's' : ''} scheduled
                          </p>
                        </div>
                      </div>
                      
                      {!isExpanded && (
                        <div className="flex -space-x-1 justify-end mr-2">
                           {dayPosts.slice(0, 3).map((_, i) => (
                             <div key={i} className="w-2 h-2 rounded-full bg-indigo/40 border border-indigo/20" />
                           ))}
                        </div>
                      )}
                    </button>

                    {/* Collapsible Content */}
                    {isExpanded && (
                      <div className="px-6 pb-6 space-y-4 animate-slide-down">
                        {dayPosts.map((post, i) => (
                          <PostCard key={post.id} post={post} onClick={setSelectedPost} index={i} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 sticky top-6 space-y-6">
          <Card className="bg-obsidian-raised/50 border-indigo/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Target size={120} className="text-indigo" />
            </div>
            <CardContent className="p-6 space-y-6 relative">
              <h3 className="text-xs font-bold text-cream-muted uppercase tracking-widest flex items-center gap-2">
                <Target size={14} className="text-indigo" /> Insights
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-cream">{posts.length}</p>
                  <p className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Total</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-warning">{statusCounts["pending_review"] || 0}</p>
                  <p className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Pending</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-indigo">{(statusCounts["approved"] || 0) + (statusCounts["scheduled"] || 0)}</p>
                  <p className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Queued</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-mint">{statusCounts["posted"] || 0}</p>
                  <p className="text-[10px] uppercase font-bold text-cream-muted tracking-wider">Posted</p>
                </div>
              </div>
              
              {(statusCounts["pending_review"] || 0) + (statusCounts["generated"] || 0) > 0 && (
                <Button className="w-full" variant="secondary" onClick={handleBulkApprove} loading={bulkApproving}>
                  <CheckCheck size={16} />
                  Bulk Approve Batch
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-obsidian-raised/30 border-obsidian-border/50">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xs font-bold text-cream-muted uppercase tracking-widest flex items-center gap-2">
                <CalendarDays size={14} className="text-indigo" /> Configuration
              </h3>
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-cream-muted font-medium">Daily Frequency</span>
                  <span className="text-cream font-bold px-2 py-0.5 rounded bg-obsidian-hover">{schedule?.times_per_day}x Posts</span>
                </div>
                <div className="flex justify-between items-start text-[11px]">
                  <span className="text-cream-muted font-medium">Time Schedule</span>
                  <div className="text-right space-y-1">
                    {schedule?.time_slots.map((t, i) => (
                      <p key={i} className="text-cream font-bold bg-indigo/10 text-indigo-light px-2 py-0.5 rounded">{t}</p>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center text-[11px] pt-2 border-t border-obsidian-border/20">
                  <span className="text-cream-muted font-medium">Schedule Start</span>
                  <span className="text-cream font-bold">{schedule && formatDate(schedule.start_date)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-obsidian-raised border border-obsidian-border rounded-[2.5rem] p-10 max-w-md w-full mx-4 space-y-8 shadow-2xl relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-3xl bg-error/20 text-error flex items-center justify-center border border-error/30 shadow-xl">
              <Trash2 size={32} />
            </div>
            <div className="text-center pt-4">
              <h3 className="text-2xl font-bold text-cream">Destroy campaign?</h3>
              <p className="text-sm text-cream-muted mt-3 leading-relaxed">
                You're about to permanently delete <strong className="text-white">{campaign.name}</strong>. All {posts.length} generated posts will be erased. This cannot be reversed.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="ghost" className="h-12 rounded-2xl" onClick={() => setShowDeleteConfirm(false)}>Go back</Button>
              <Button variant="danger" className="h-12 rounded-2xl font-bold" onClick={handleDeleteCampaign} loading={deleting}>Burn it down</Button>
            </div>
          </div>
        </div>
      )}

      <PostDrawer
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onUpdate={handlePostUpdate}
        onRefresh={refreshPosts}
      />
    </div>
  );
}
