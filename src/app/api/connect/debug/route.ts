import { NextResponse } from "next/server";
import { getComposioClient } from "@/lib/composio";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    const composio = getComposioClient();
    
    let connections: any[] = [];
    if (user) {
        const entity = composio.getEntity(user.id);
        connections = await entity.getConnections();
    }

    return NextResponse.json({
        success: true,
        user: user?.id,
        connections
    });
  } catch (error: any) {
    console.error("[Debug] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
