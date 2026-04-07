import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isConnected, COMPOSIO_APP_MAP } from "@/lib/composio";

/**
 * GET /api/connect/status
 * Get connection status for all platforms for the current user
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const platforms = Object.keys(COMPOSIO_APP_MAP);
    const statuses: Record<string, boolean> = {};

    // Check each platform in parallel
    const results = await Promise.allSettled(
      platforms.map(async (platform) => {
        const connected = await isConnected(platform, user.id);
        return { platform, connected };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        statuses[result.value.platform] = result.value.connected;
      } else {
        // If check fails, report as disconnected
        // Extract platform from the rejection reason if possible
      }
    }

    // Also check DB records as fallback
    const { data: dbAccounts } = await supabase
      .from("connected_accounts")
      .select("platform")
      .eq("user_id", user.id);

    if (dbAccounts) {
      for (const acc of dbAccounts) {
        // DB says connected but Composio might disagree — Composio wins
        if (statuses[acc.platform] === undefined) {
          statuses[acc.platform] = false;
        }
      }
    }

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check status" },
      { status: 500 }
    );
  }
}
