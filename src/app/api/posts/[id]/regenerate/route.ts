import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateTrendPost, generateProductPost, PostArchetype } from "@/lib/ai/groq";
import { getTrendContext } from "@/lib/ai/trends";
import { scrapeUrl, formatProductInfo } from "@/lib/ai/scraper";
import type { Platform } from "@/lib/types";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: postId } = await params;

    // Fetch the post and its campaign
    const { data: post } = await supabase
      .from("posts")
      .select("*, campaign:campaigns(*)")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    const campaign = post.campaign;

    // Get fresh context
    let context = "";
    if (campaign.type === "trend") {
      context = await getTrendContext(campaign.input_text);
    } else {
      const product = await scrapeUrl(campaign.url);
      context = formatProductInfo(product);
    }

    // Archetypes for random selection
    const archetypes: PostArchetype[] = [
      "viral_hook",
      "actionable_tip",
      "thought_leader",
      "community_question",
      "benefit_lead",
    ];
    const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];

    // Regenerate
    const generated = campaign.type === "trend"
      ? await generateTrendPost(post.platform as Platform, campaign.input_text, context, archetype)
      : await generateProductPost(post.platform as Platform, context, archetype);

    // Update post
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        content: generated.content,
        hashtags: generated.hashtags,
        status: "pending_review",
      })
      .eq("id", postId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, content: generated.content });
  } catch (error) {
    console.error("Regeneration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Regeneration failed" },
      { status: 500 }
    );
  }
}
