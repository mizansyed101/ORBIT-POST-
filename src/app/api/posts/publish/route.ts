import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { executePost, isConnected } from "@/lib/composio";
import { sendPublishSummaryEmail, sendFailureAlertEmail } from "@/lib/email";
import type { Platform, PostStatus } from "@/lib/types";

/**
 * POST /api/posts/publish
 * Publish approved posts that are due (scheduled_at <= now)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Auth: either user-initiated or cron with service role
    const { data: { user } } = await supabase.auth.getUser();

    // Check for cron secret header (for automated scheduling)
    const cronSecret = request.headers.get("x-cron-secret");
    const isCron = cronSecret === process.env.CRON_SECRET;

    if (!user && !isCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Fetch approved posts that are due
    let query = supabase
      .from("posts")
      .select("*, campaign:campaigns(*)")
      .in("status", ["approved", "scheduled"])
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(20); // Process in batches

    // If user-initiated, only process their posts
    if (user && !isCron) {
      query = query.eq("user_id", user.id);
    }

    const { data: posts, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        success: true,
        published: 0,
        message: "No posts due for publishing",
      });
    }

    const results: Array<{
      postId: string;
      platform: string;
      status: "posted" | "failed";
      error?: string;
    }> = [];

    for (const post of posts) {
      const platform = post.platform as Platform;
      const userId = post.user_id;

      // Mark as scheduled (in-flight)
      await supabase
        .from("posts")
        .update({ status: "scheduled" as PostStatus })
        .eq("id", post.id);

      // Check if platform is connected
      const connected = await isConnected(platform, userId);
      if (!connected) {
        await supabase
          .from("posts")
          .update({
            status: "failed" as PostStatus,
            error_msg: `${platform} account not connected. Please connect it in Settings.`,
          })
          .eq("id", post.id);

        results.push({
          postId: post.id,
          platform,
          status: "failed",
          error: "Account not connected",
        });

        // Create notification
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "post_failed",
          message: `Failed to post to ${platform}: account not connected.`,
          metadata: { post_id: post.id, campaign_name: post.campaign?.name },
        });

        continue;
      }

      // Execute the post via Composio
      const result = await executePost(platform, userId, post.content);

      if (result.success) {
        await supabase
          .from("posts")
          .update({
            status: "posted" as PostStatus,
            posted_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        results.push({ postId: post.id, platform, status: "posted" });

        // Success notification
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "post_published",
          message: `Successfully posted to ${platform}!`,
          metadata: { post_id: post.id, campaign_name: post.campaign?.name },
        });
      } else {
        await supabase
          .from("posts")
          .update({
            status: "failed" as PostStatus,
            error_msg: result.error || "Publishing failed",
          })
          .eq("id", post.id);

        results.push({
          postId: post.id,
          platform,
          status: "failed",
          error: result.error,
        });

        // Failure notification
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "post_failed",
          message: `Failed to post to ${platform}: ${result.error}`,
          metadata: { post_id: post.id, campaign_name: post.campaign?.name },
        });
      }
    }

    const published = results.filter((r) => r.status === "posted").length;
    const failed = results.filter((r) => r.status === "failed").length;

    // ── Send email notifications per user ──
    const userIds = [...new Set(posts.map((p) => p.user_id))];
    for (const uid of userIds) {
      const userResults = results.filter(
        (r) => posts.find((p) => p.id === r.postId)?.user_id === uid
      );
      const userPosted = userResults.filter((r) => r.status === "posted").length;
      const userFailed = userResults.filter((r) => r.status === "failed").length;

      if (userPosted + userFailed === 0) continue;

      // Fetch user email
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", uid)
        .single();

      if (profile?.email) {
        // Summary email
        await sendPublishSummaryEmail(profile.email, {
          posted: userPosted,
          failed: userFailed,
          failures: userResults
            .filter((r) => r.status === "failed")
            .map((r) => ({ platform: r.platform, error: r.error || "Unknown" })),
        });

        // Individual failure alerts
        for (const failResult of userResults.filter((r) => r.status === "failed")) {
          const failPost = posts.find((p) => p.id === failResult.postId);
          if (failPost) {
            await sendFailureAlertEmail(
              profile.email,
              failResult.platform,
              failPost.content,
              failResult.error || "Unknown error"
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      published,
      failed,
      total: results.length,
      results,
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publishing failed" },
      { status: 500 }
    );
  }
}
