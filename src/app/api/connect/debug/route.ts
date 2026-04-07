import { NextResponse } from "next/server";
import { getComposioClient } from "@/lib/composio";

export async function GET() {
  try {
    const composio = getComposioClient();
    
    // Attempt to list all toolkits/apps using various potential methods
    let apps: any = [];
    
    // 1. Try getApps()
    try {
      apps = await (composio as any).getApps();
    } catch (e1) {
      console.warn("[Debug] getApps() failed, trying getToolkits()");
      // 2. Try getToolkits()
      try {
        apps = await (composio as any).getToolkits();
      } catch (e2) {
        console.warn("[Debug] getToolkits() failed, trying direct list from REST if possible");
        // We'll return the error if all fails
        throw new Error("Could not find a method to list apps. Methods tried: getApps, getToolkits");
      }
    }
    
    const filteredApps = Array.isArray(apps) ? apps.map((a: any) => ({
      name: a.name || a.title || a.appName,
      slug: a.id || a.slug || a.appName || a.tool_slug,
      status: a.status
    })) : apps;

    return NextResponse.json({
      success: true,
      message: "Check the 'slug' field for anything related to Threads or Meta.",
      apps: filteredApps
    });
  } catch (error: any) {
    console.error("[Debug] Error fetching Composio apps:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
