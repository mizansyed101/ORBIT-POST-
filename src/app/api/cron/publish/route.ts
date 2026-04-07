import { NextResponse } from "next/server";

// GET /api/cron/publish
//
// Cron endpoint to be triggered by Vercel Cron Jobs or an external service.
// Calls the publish API to process all due posts across all users.
//
// Vercel Cron Setup — add to vercel.json:
//   { "crons": [{ "path": "/api/cron/publish", "schedule": "every 5 minutes" }] }
//
// Set CRON_SECRET in environment variables for security.
export async function GET(request: Request) {
  try {
    // Verify cron authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Allow Vercel's cron (which sends authorization header) or our custom header
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call the publish endpoint internally
    const publishUrl = new URL("/api/posts/publish", request.url);
    const res = await fetch(publishUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": cronSecret || "",
      },
    });

    const data = await res.json();

    return NextResponse.json({
      cron: true,
      timestamp: new Date().toISOString(),
      ...data,
    });
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 }
    );
  }
}
