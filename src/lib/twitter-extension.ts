"use client";

const STORAGE_KEY = "orbitpost_twitter_extension_id";

declare global {
  interface Window {
    chrome: any;
  }
}

/**
 * Get the saved extension ID from localStorage or a default
 */
export function getExtensionId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEY) || "fjapjlelndhjfomkknmpicnnjonadgeb";
}

/**
 * Save the extension ID to localStorage
 */
export function setExtensionId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
}

// --- Auto-Discovery Logic ---
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    // Only accept messages from the same window source
    if (event.source !== window) return;

    if (event.data?.type === "ORBITPOST_EXTENSION_DISCOVERED" && event.data?.extensionId) {
      const discoveredId = event.data.extensionId;
      const currentId = getExtensionId();

      if (discoveredId !== currentId) {
        console.log("[OrbitPost] Auto-discovered extension:", discoveredId);
        setExtensionId(discoveredId);
        // Dispatch custom event to notify UI
        window.dispatchEvent(new CustomEvent("orbitpost_extension_synced"));
      }
    }
  });
}

/**
 * Check if the extension is installed and responsive
 */
export async function checkExtensionInstalled(): Promise<boolean> {
  const extensionId = getExtensionId();
  if (!extensionId) return false;

  try {
    // We can't easily ping without chrome.runtime.sendMessage which is NOT available 
    // to the web page directly UNLESS we are in the externally_connectable list.
    // If we are, we can use window.chrome?.runtime?.sendMessage
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 1000);
      
      // @ts-ignore
      window.chrome?.runtime?.sendMessage(extensionId, { type: 'PING' }, (response) => {
        clearTimeout(timeout);
        if (window.chrome?.runtime?.lastError) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  } catch {
    return false;
  }
}

/**
 * Send a tweet request to the extension
 */
export async function postViaExtension(content: string): Promise<{ success: boolean; error?: string }> {
  const extensionId = getExtensionId();
  if (!extensionId) {
    return { success: false, error: "Extension ID not configured. Please set it in Settings." };
  }

  return new Promise((resolve) => {
    // @ts-ignore
    if (!window.chrome?.runtime?.sendMessage) {
      return resolve({ success: false, error: "Browser does not support extension messaging." });
    }

    // @ts-ignore
    window.chrome.runtime.sendMessage(extensionId, { type: 'POST_TWEET', content }, (response) => {
      if (window.chrome?.runtime?.lastError) {
        resolve({ success: false, error: "Extension not found or inactive. Check your Extension ID." });
      } else {
        resolve({ success: response?.success || false });
      }
    });
  });
}
