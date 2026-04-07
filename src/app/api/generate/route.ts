import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateTrendPost, generateProductPost, PostArchetype } from "@/lib/ai/groq";
import { getTrendContext } from "@/lib/ai/trends";
import { scrapeUrl, formatProductInfo } from "@/lib/ai/scraper";
import { addDays, setHours, setMinutes, isAfter, startOfDay } from "date-fns";
import type { Platform } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId } = await request.json();
    if (!campaignId) return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });

    // Fetch campaign, schedule, and EXISTING posts to avoid gaps/overlaps
    const [campResult, schedResult, postsResult] = await Promise.all([
      supabase.from("campaigns").select("*").eq("id", campaignId).eq("user_id", user.id).single(),
      supabase.from("schedules").select("*").eq("campaign_id", campaignId).single(),
      supabase.from("posts").select("scheduled_at").eq("campaign_id", campaignId).order("scheduled_at", { ascending: true })
    ]);

    if (!campResult.data) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    const { data: campaign } = campResult;
    
    if (!schedResult.data) return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    const { data: schedule } = schedResult;

    const existingTimes = new Set(postsResult.data?.map(p => new Date(p.scheduled_at).getTime()) || []);

    // Get context based on campaign type
    let context = "";
    if (campaign.type === "trend") {
      context = await getTrendContext(campaign.input_text);
    } else {
      const product = await scrapeUrl(campaign.url);
      context = formatProductInfo(product);
    }

    // High-Variety Assets
    const archetypes: PostArchetype[] = [
      "viral_hook", "actionable_tip", "thought_leader", "community_question", 
      "benefit_lead", "the_skeptic", "practical_how_to", "future_vision", 
      "hidden_gem", "myth_buster", "quick_win", "personal_story"
    ];
    
    const creativeAngles = [
      "Ask a controversial industry question", "Explain as a 3-step actionable list",
      "Focus on a visionary 5-year outlook", "Debunk a popular industry myth",
      "Write from a skeptic's point of view", "Deep emotional pain point",
      "Hidden expert tip", "Short 'Aha!' moment", "Cautionary story",
      "Quick win for beginners", "Compare to historical events", "Bold high-impact hook",
      "Cost of inaction", "Transformative benefit", "Inquisitive tone"
    ];

    const postsToInsert = [];
    const platforms = campaign.platforms as Platform[];
    
    // --- SMART REFILL LOGIC ---
    // Generate enough to fill the next 3 days of the schedule
    const BATCH_SIZE = schedule.times_per_day * 3;
    let dayOffset = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 100; // Look up to 100 slots ahead
    const now = new Date();

    while (postsToInsert.length < BATCH_SIZE && attempts < MAX_ATTEMPTS) {
      const date = addDays(startOfDay(now), dayOffset);
      
      for (const timeSlot of schedule.time_slots) {
        if (postsToInsert.length >= BATCH_SIZE) break;
        attempts++;

        const [hours, minutes] = timeSlot.split(":").map(Number);
        const jitter = Math.floor(Math.random() * 25) - 12; 
        const scheduledTime = setMinutes(setHours(date, hours), minutes + jitter);

        // Skip if this time has passed OR if a post already exists in this window (approx)
        if (isAfter(now, scheduledTime)) continue;
        
        // Exact overlap check (ignoring jitter for existence check)
        const baseTime = setMinutes(setHours(date, hours), minutes).getTime();
        const alreadyExists = Array.from(existingTimes).some(et => 
          Math.abs(et - baseTime) < 30 * 60 * 1000 // 30 min window
        );

        if (alreadyExists) continue;

        // Generate the post
        const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
        const angle = creativeAngles[Math.floor(Math.random() * creativeAngles.length)];
        const platform = platforms[attempts % platforms.length];

        try {
          const gen = campaign.type === "trend"
            ? await generateTrendPost(platform, campaign.input_text, context, archetype, angle)
            : await generateProductPost(platform, context, archetype, angle);

          postsToInsert.push({
            user_id: user.id,
            campaign_id: campaignId,
            platform,
            content: gen.content,
            hashtags: gen.hashtags,
            status: "pending_review",
            scheduled_at: scheduledTime.toISOString(),
          });
          
          existingTimes.add(scheduledTime.getTime());
        } catch (err) {
          console.error("Gen failed:", err);
        }
      }
      dayOffset++;
    }

    // Insert posts
    if (postsToInsert.length > 0) {
      const { error: insertError } = await supabase.from("posts").insert(postsToInsert);
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      generated: postsToInsert.length,
      message: `Successfully filled your schedule for the next 3 days with ${postsToInsert.length} new posts.`,
    });
  } catch (error) {
    console.error("Critical generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
