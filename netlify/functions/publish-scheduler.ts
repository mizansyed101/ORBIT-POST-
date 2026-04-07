import type { Config } from "@netlify/functions";

/**
 * Netlify Scheduled Function to trigger the OrbitPost publishing cycle.
 * This function calls the Next.js API route /api/cron/publish securely.
 */
export default async (req: Request) => {
    const { next_run } = await req.json();
    console.log(`[Scheduler] Triggered. Next run scheduled for: ${next_run}`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://orbitpost.netlify.app";
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
        console.error("[Scheduler] CRON_SECRET is not set in environment variables.");
        return new Response("Missing CRON_SECRET", { status: 500 });
    }

    try {
        const publishUrl = `${appUrl}/api/cron/publish`;
        console.log(`[Scheduler] Calling publish endpoint: ${publishUrl}`);

        const response = await fetch(publishUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${cronSecret}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Scheduler] Publish API failed (${response.status}):`, errorText);
            return new Response(`Publish failed: ${response.status}`, { status: 500 });
        }

        const result = await response.json();
        console.log("[Scheduler] Publish cycle completed successfully:", JSON.stringify(result));
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: "Publish cycle triggered",
            details: result 
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("[Scheduler] Exception during publish trigger:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
};

// This configuration is handled in netlify.toml, but can also be defined here
export const config: Config = {
    schedule: "*/15 * * * *" // Every 15 minutes as a default safety
};
