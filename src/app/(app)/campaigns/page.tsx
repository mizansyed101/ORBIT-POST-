"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostSkeleton } from "@/components/ui/Skeleton";
import { PlatformIcon } from "@/components/ui/PlatformIcon";
import { cn, formatDate } from "@/lib/utils";
import { Megaphone, Plus, TrendingUp, Link as LinkIcon, ArrowRight } from "lucide-react";
import type { Campaign, Platform } from "@/lib/types";

export default function CampaignsPage() {
  const supabase = createClient();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setCampaigns(data);
      setLoading(false);
    };

    fetchCampaigns();
  }, [supabase]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cream font-[family-name:var(--font-playfair)]">
            Campaigns
          </h1>
          <p className="text-sm text-cream-muted mt-1">
            Manage your content generation campaigns
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button>
            <Plus size={14} />
            New Campaign
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => <PostSkeleton key={i} />)}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={28} />}
          title="No campaigns yet"
          description="Create your first campaign to start generating AI-powered social media content."
          action={
            <Link href="/campaigns/new">
              <Button>
                <Plus size={14} />
                Create Your First Campaign
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign, i) => (
            <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
              <Card
                hover
                className={cn("animate-stagger")}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        campaign.type === "trend"
                          ? "bg-mint/10 text-mint"
                          : "bg-indigo/10 text-indigo"
                      )}
                    >
                      {campaign.type === "trend" ? (
                        <TrendingUp size={18} />
                      ) : (
                        <LinkIcon size={18} />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-cream">{campaign.name}</h3>
                      <p className="text-xs text-cream-muted mt-0.5">
                        {campaign.type === "trend" ? "Trend Mode" : "Product Mode"} ·{" "}
                        {formatDate(campaign.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {campaign.platforms.map((p) => (
                        <PlatformIcon
                          key={p}
                          platform={p as Platform}
                          size={14}
                          className="text-cream-faint"
                        />
                      ))}
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono",
                        campaign.active
                          ? "bg-mint/10 text-mint"
                          : "bg-cream-faint/10 text-cream-muted"
                      )}
                    >
                      {campaign.active ? "Active" : "Paused"}
                    </span>
                    <ArrowRight size={14} className="text-cream-faint" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
