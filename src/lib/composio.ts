import { Composio } from "composio-core";
import { COMPOSIO_API_KEY } from "@/lib/env";

// Singleton Composio client
let client: Composio | null = null;

export function getComposioClient(): Composio {
  if (!COMPOSIO_API_KEY) {
    throw new Error("COMPOSIO_API_KEY is not configured");
  }
  if (!client) {
    client = new Composio({ apiKey: COMPOSIO_API_KEY });
  }
  return client;
}

// Map our platform names to Composio app names
export const COMPOSIO_APP_MAP: Record<string, string> = {
  twitter: "twitter",
  linkedin: "linkedin",
  instagram: "instagram",
  facebook: "facebook",
  threads: "threads", // Let's use the first-party slug as default
  _threads_fallback: "instagram", // Keep it as a potential fallback
};

// Map our platform names to Composio tool slugs for posting
export const COMPOSIO_POST_TOOL_MAP: Record<string, string> = {
  twitter: "TWITTER_CREATION_OF_A_POST",
  linkedin: "LINKEDIN_CREATE_A_LINKEDIN_POST",
  instagram: "INSTAGRAM_CREATE_MEDIA_CONTAINER", // Base for Instagram/Threads usually
  facebook: "FACEBOOK_CREATE_A_PAGE_POST",
  threads: "THREADS_CREATE_A_THREAD", // Placeholder
};

/**
 * Initiate a connection for a user and platform.
 * Returns an authorization URL for OAuth.
 */
export async function initiateConnection(
  platform: string,
  userId: string,
  redirectUrl?: string
): Promise<{ redirectUrl: string; connectionId: string }> {
  const composio = getComposioClient();
  const appName = COMPOSIO_APP_MAP[platform];
  if (!appName) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const entity = composio.getEntity(userId);
  
  // Potential app slugs for Threads.net (Composio updates these often)
  const threadsSlugs = ["threads", "threads_net", "threads.net", "instagram_threads"];
  
  try {
    console.log(`[Composio] Initiating ${platform} (${appName}) for user ${userId}`);
    
    // For threads, we might want to try multiple known slugs if the first one fails
    if (platform === "threads") {
      let lastError: any = null;
      for (const slug of threadsSlugs) {
        try {
          console.log(`[Composio] Trying Threads slug: ${slug}`);
          const connectionRequest = await entity.initiateConnection({ 
            appName: slug, 
            redirectUri: redirectUrl, // Try redirectUri first (as suggested by lint)
            config: {
              redirectUrl: redirectUrl // Backup if redirectUri is not it
            }
          });
          
          console.log(`[Composio] Connection initiated successfully with ${slug}:`, JSON.stringify(connectionRequest, null, 2));
      
          return {
            redirectUrl: connectionRequest.redirectUrl || "",
            connectionId: connectionRequest.connectedAccountId || "",
          };
        } catch (e: any) {
          lastError = e;
          if (e.message?.includes("Toolkit not found")) {
            console.warn(`[Composio] Slug '${slug}' not found. Trying next...`);
            continue;
          }
          throw e; // If it's a different error (e.g. auth), stop and throw
        }
      }
      throw lastError; // Re-throw the last error if all slugs failed
    }

    const connectionRequest = await entity.initiateConnection({ 
      appName, 
      redirectUri: redirectUrl,
      config: {
        redirectUrl: redirectUrl
      }
    });
    
    console.log(`[Composio] Connection initiated successfully for ${appName}:`, JSON.stringify(connectionRequest, null, 2));

    return {
      redirectUrl: connectionRequest.redirectUrl || "",
      connectionId: connectionRequest.connectedAccountId || "",
    };
  } catch (err) {
    console.error(`[Composio] Final error initiating connection for ${platform}:`, err);
    throw err;
  }
}

/**
 * Check if a specific platform is connected for a user.
 * Uses Entity.getConnections() to check for an active connection.
 */
export async function isConnected(
  platform: string,
  userId: string
): Promise<boolean> {
  try {
    const composio = getComposioClient();
    const entity = composio.getEntity(userId);
    const connections = await entity.getConnections();
    let appName = COMPOSIO_APP_MAP[platform];

    console.log(`[Composio] Checking connections for ${platform} (${appName})`);
    
    const activeAppNames = connections
      .filter((c: any) => c.status === "ACTIVE")
      .map((c: any) => c.appName);

    console.log(`[Composio] Active connections:`, activeAppNames.join(', '));

    // Special check for Threads which might use multiple slugs
    if (platform === "threads") {
      const threadsSlugs = ["threads", "threads_net", "threads.net", "instagram_threads"];
      return threadsSlugs.some(slug => activeAppNames.includes(slug));
    }

    return activeAppNames.includes(appName);
  } catch (err) {
    console.error(`[Composio] Error checking connections for ${platform}:`, err);
    return false;
  }
}

/**
 * Execute a post on a social platform via Composio.
 * Uses Entity.execute() for action execution.
 */
export async function executePost(
  platform: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const composio = getComposioClient();
    const entity = composio.getEntity(userId);
    const actionName = COMPOSIO_POST_TOOL_MAP[platform];

    if (!actionName) {
      return { success: false, error: `Unsupported platform: ${platform}` };
    }

    const result = await entity.execute({
      actionName,
      params: { text: content },
    });

    // Check the result — Composio's response has `successfull` (their spelling)
    const isSuccess =
      (result as Record<string, unknown>)?.successfull ??
      (result as Record<string, unknown>)?.successful ??
      false;

    if (!isSuccess) {
      return {
        success: false,
        error:
          ((result as Record<string, unknown>)?.error as string) ||
          "Composio execution failed",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Posting failed",
    };
  }
}

/**
 * Disconnect a social platform for a user.
 */
export async function disconnectPlatform(
  platform: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const composio = getComposioClient();
    const entity = composio.getEntity(userId);
    const connections = await entity.getConnections();
    
    let appName = COMPOSIO_APP_MAP[platform];
    const threadsSlugs = ["threads", "threads_net", "threads.net", "instagram_threads"];

    // Find the connection for this platform
    const connection = connections.find((c: any) => {
      if (platform === "threads") {
        return threadsSlugs.includes(c.appName) && c.status === "ACTIVE";
      }
      return c.appName === appName && c.status === "ACTIVE";
    });

    if (!connection) {
      return { success: false, error: "No active connection found for this platform" };
    }

    console.log(`[Composio] Disconnecting ${platform} (ID: ${(connection as any).id || (connection as any).connectedAccountId})`);
    
    // Use the confirmed SDK method which expects an object
    await (composio as any).connectedAccounts.delete({ 
      connectedAccountId: (connection as any).id || (connection as any).connectedAccountId 
    });

    return { success: true };
  } catch (error) {
    console.error(`[Composio] Error disconnecting ${platform}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Disconnection failed",
    };
  }
}
