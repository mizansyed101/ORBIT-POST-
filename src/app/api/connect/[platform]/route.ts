import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { initiateConnection, isConnected, COMPOSIO_APP_MAP } from "@/lib/composio";
import { APP_URL } from "@/lib/env";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!COMPOSIO_APP_MAP[platform]) {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      );
    }

    // Check if already connected
    const alreadyConnected = await isConnected(platform, user.id);
    console.log(`[API] Connection check for ${platform}: alreadyConnected=${alreadyConnected}`);

    if (alreadyConnected) {
      console.log(`[API] User ${user.id} is already connected to ${platform}. Returning status.`);
      return NextResponse.json({
        success: true,
        already_connected: true,
        platform,
      });
    }

    // Debug logging for environment (Don't log the actual key!)
    console.log(`[API] Connecting ${platform} for user ${user.id}`);
    console.log(`[API] APP_URL: ${APP_URL}`);
    console.log(`[API] COMPOSIO_API_KEY exists: ${!!process.env.COMPOSIO_API_KEY}`);

    // Failsafe: if APP_URL is localhost but we're on production, 
    // try to infer from request URL
    let baseRedirectUrl = `${APP_URL}/settings`;
    if (APP_URL.includes("localhost") && !request.url.includes("localhost")) {
      const origin = new URL(request.url).origin;
      console.warn(`[API] APP_URL looks local but request is remote. Using inferred origin: ${origin}`);
      baseRedirectUrl = `${origin}/settings`;
    }

    // Initiate new connection using the canonical baseRedirectUrl
    const { redirectUrl, connectionId } = await initiateConnection(
      platform, 
      user.id, 
      baseRedirectUrl
    );

    console.log(`[API] Connection initiated: ${connectionId}, Redirect: ${redirectUrl}`);

    // Store a pending record in connected_accounts
    if (connectionId) {
      const { error: upsertError } = await supabase.from("connected_accounts").upsert(
        {
          user_id: user.id,
          platform,
          composio_account_id: connectionId,
          account_name: platform,
        },
        { onConflict: "user_id,platform,composio_account_id" }
      );
      
      if (upsertError) {
        console.error(`[API] Upsert error for ${platform}:`, upsertError);
      }
    }

    console.log(`[API] Successfully initiated connection for ${platform}. Redirecting to: ${redirectUrl}`);
    return NextResponse.json({
      success: true,
      redirectUrl,
      connectionId,
      platform,
    });
  } catch (error: any) {
    console.error(`[API] CRITICAL FAILURE while connecting ${platform}:`, error);
    console.error(`[API] Error Message: ${error.message}`);
    console.error(`[API] Error Stack: ${error.stack}`);
    
    // Log more metadata for Threads failure
    if (platform === "threads") {
      console.warn(`[API] Threads failure metadata: message="${error.message}", stack="${error.stack}"`);
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Connection failed",
        details: error instanceof Error ? error.stack : undefined,
        platform
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Check connection status for a platform
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { platform } = await params;
    const connected = await isConnected(platform, user.id);

    return NextResponse.json({ platform, connected });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status check failed" },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Disconnect a platform
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { platform } = await params;
    
    // 1. Perform the disconnection in Composio
    const { disconnectPlatform } = await import("@/lib/composio");
    const result = await disconnectPlatform(platform, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to disconnect from platform" },
        { status: 500 }
      );
    }

    // 2. Clear the local record in connected_accounts
    const { error: deleteError } = await supabase
      .from("connected_accounts")
      .delete()
      .match({ user_id: user.id, platform });

    if (deleteError) {
      console.warn(`[API] Local record deletion error for ${platform}:`, deleteError);
    }

    return NextResponse.json({ success: true, platform });
  } catch (error) {
    console.error("Disconnection error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Disconnection failed" },
      { status: 500 }
    );
  }
}
