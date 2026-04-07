import { COMPOSIO_API_KEY } from "@/lib/env";

// Map our platform names to Composio app names
export const COMPOSIO_APP_MAP: Record<string, string> = {
  twitter: "twitter",
  x: "twitter",
  linkedin: "linkedin",
  instagram: "instagram",
  facebook: "facebook",
  threads: "threads",
};

// Map our platform names to Composio tool slugs for posting
export const COMPOSIO_POST_TOOL_MAP: Record<string, string> = {
  twitter: "TWITTER_CREATION_OF_A_POST",
  linkedin: "LINKEDIN_CREATE_A_LINKEDIN_POST",
  instagram: "INSTAGRAM_CREATE_MEDIA_CONTAINER",
  facebook: "FACEBOOK_CREATE_A_PAGE_POST",
  threads: "THREADS_CREATE_A_THREAD",
};

/**
 * Helper to make authenticated requests to Composio REST API
 */
async function composioFetch(endpoint: string, options: RequestInit = {}) {
    if (!COMPOSIO_API_KEY) {
        throw new Error("COMPOSIO_API_KEY is not configured");
    }

    const url = `https://backend.composio.dev/api/v1${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            "x-api-key": COMPOSIO_API_KEY,
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Composio API Error (${response.status}): ${errorText}`);
    }

    return response.json();
}

/**
 * Ensure an integration exists for the given platform.
 */
async function ensureIntegrationExists(appName: string): Promise<void> {
  try {
    const appsData = await composioFetch("/apps");
    const targetApp = appsData.items?.find((a: any) => a.key === appName);
    
    if (!targetApp) {
        console.error(`[Composio] App with key '${appName}' not found in registry.`);
        return;
    }

    const integrationsData = await composioFetch("/connectors");
    const integrations = integrationsData.items || [];
    
    const exists = integrations.some((i: any) => i.appName === appName);
    if (!exists) {
        console.log(`[Composio] Creating managed integration for ${appName}...`);
        await composioFetch("/appConnector/createConnector", {
            method: "POST",
            body: JSON.stringify({
                app: { uniqueKey: appName },
                config: {
                    name: `${appName.charAt(0).toUpperCase() + appName.slice(1)} Managed`,
                    useComposioAuth: true
                }
            })
        });
    }
  } catch (error) {
    console.error(`[Composio] Error in ensureIntegrationExists for ${appName}:`, error);
  }
}

/**
 * Initiate a connection for a user and platform.
 */
export async function initiateConnection(
  platform: string,
  userId: string,
  redirectUrl?: string
): Promise<{ redirectUrl: string; connectionId: string }> {
  const appName = COMPOSIO_APP_MAP[platform] || platform;
  
  // Ensure the integration exists
  await ensureIntegrationExists(appName);
  
  console.log(`[Composio] Initiating ${platform} (${appName}) for user ${userId}`);
  
  try {
      const data = await composioFetch(`/entities/${userId}/connect/initiate`, {
          method: "POST",
          body: JSON.stringify({
              appName,
              redirectUri: redirectUrl,
          })
      });

      return {
          redirectUrl: data.redirectUrl,
          connectionId: data.connectionId || data.connectedAccountId || "",
      };
  } catch (error) {
      console.error(`[Composio] REST API Connection error for ${platform}:`, error);
      throw error;
  }
}

/**
 * Check if a specific platform is connected for a user.
 */
export async function isConnected(
  platform: string,
  userId: string
): Promise<boolean> {
  try {
    const appName = COMPOSIO_APP_MAP[platform] || platform;
    const data = await composioFetch(`/entities/${userId}/connections`);
    
    const activeAppNames = (data.items || [])
      .filter((c: any) => c.status === "ACTIVE")
      .map((c: any) => c.appName);

    return activeAppNames.includes(appName);
  } catch (err) {
    console.error(`[Composio] Error checking connections for ${platform}:`, err);
    return false;
  }
}

/**
 * Execute a post on a social platform via Composio.
 */
export async function executePost(
  platform: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const actionName = COMPOSIO_POST_TOOL_MAP[platform];
    if (!actionName) {
      return { success: false, error: `Unsupported platform: ${platform}` };
    }

    const result = await composioFetch(`/entities/${userId}/execute`, {
        method: "POST",
        body: JSON.stringify({
            actionName,
            params: { text: content },
        })
    });

    // Check the result
    const isSuccess = result.successfull || result.successful || false;

    if (!isSuccess) {
      return {
        success: false,
        error: result.error || "Composio execution failed",
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
    const appName = COMPOSIO_APP_MAP[platform] || platform;
    const connections = await composioFetch(`/entities/${userId}/connections`);
    
    const targetConnection = (connections.items || []).find(
      (c: any) => c.appName === appName && c.status === "ACTIVE"
    );

    if (targetConnection) {
        await composioFetch(`/connections/${targetConnection.id}/delete`, {
            method: "DELETE"
        });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Disconnection failed",
    };
  }
}
