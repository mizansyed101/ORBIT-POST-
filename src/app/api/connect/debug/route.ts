import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { COMPOSIO_API_KEY } from "@/lib/env";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!COMPOSIO_API_KEY) {
        return NextResponse.json({ success: false, error: "COMPOSIO_API_KEY is not configured" }, { status: 500 });
    }

    // Use pure fetch to check connections for the debug endpoint
    const res = await fetch(`https://backend.composio.dev/api/v1/entities/${user.id}/connections`, {
        headers: {
            "x-api-key": COMPOSIO_API_KEY
        }
    });

    const data = await res.json();

    return NextResponse.json({
        success: true,
        user: user.id,
        connections: data.items || []
    });
  } catch (error: any) {
    console.error("[Debug] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
