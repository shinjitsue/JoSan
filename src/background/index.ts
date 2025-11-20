import { BackgroundAIService } from "./BackgroundAIService";

// Initialize background AI processor
let isInitialized = false;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  try {
    if (message.type === "SET_API_KEY") {
      BackgroundAIService.setApiKey(message.apiKey);
      console.log("[JoSan Background] API key configured securely");
      sendResponse({ success: true });
      return true;
    }

    if (message.type === "PROCESS_AI") {
      // Handle AI processing request from content script
      console.log(
        `[JoSan Background] Processing AI request: ${message.data.id}`
      );

      BackgroundAIService.processText(message.data)
        .then((result) => {
          console.log(
            `[JoSan Background] AI request completed: ${result.id} -> ${result.action}`
          );
          sendResponse(result);
        })
        .catch((error) => {
          console.error("[JoSan Background] AI processing error:", error);
          sendResponse({
            id: message.data.id,
            action: "error",
            reason: error.message || "Unknown error",
          });
        });
      return true; // Keep message channel open for async response
    }

    // Handle health check
    if (message.type === "HEALTH_CHECK") {
      sendResponse({
        success: true,
        initialized: isInitialized,
        timestamp: Date.now(),
      });
      return true;
    }

    // Handle other message types
    console.warn("[JoSan Background] Unknown message type:", message.type);
    sendResponse({ success: false, error: "Unknown message type" });
  } catch (error) {
    console.error("[JoSan Background] Message handler error:", error);
    sendResponse({ success: false, error: String(error) });
  }

  return true;
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
  console.log("[JoSan Background] Extension starting up");
  isInitialized = true;
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log(
    "[JoSan Background] Extension installed/updated:",
    details.reason
  );
  isInitialized = true;

  // Set default settings on first install
  if (details.reason === "install") {
    chrome.storage.local.set({
      enabled: true,
      useAI: false, // Start with AI disabled for safety
      filterToxic: true,
      filterMild: false,
      enabledPlatforms: [
        "facebook",
        "twitter",
        "instagram",
        "reddit",
        "linkedin",
        "tiktok",
        "youtube",
        "tumblr",
        "quora",
        "threads",
        "discord",
        "bluesky",
      ],
      customWords: [],
      stats: { blockedWords: 0, pagesScanned: 0, lastScan: "" },
    });
  }
});

// Handle context invalidation
chrome.runtime.onSuspend.addListener(() => {
  console.log("[JoSan Background] Extension suspending");
  isInitialized = false;
});

// Connection handling for content script health checks
chrome.runtime.onConnect.addListener((port) => {
  console.log("[JoSan Background] Content script connected:", port.name);

  port.onDisconnect.addListener(() => {
    console.log("[JoSan Background] Content script disconnected");
  });
});

// Export for debugging (optional)
if (typeof globalThis !== "undefined") {
  (
    globalThis as typeof globalThis & {
      JoSanBackground: {
        processor: typeof BackgroundAIService;
        isInitialized: () => boolean;
        getStats: () => Promise<Record<string, unknown> | null>;
      };
    }
  ).JoSanBackground = {
    processor: BackgroundAIService,
    isInitialized: () => isInitialized,
    getStats: async () => {
      try {
        const stats = await chrome.storage.local.get(["openaiUsageStats"]);
        return stats.openaiUsageStats || null;
      } catch (error) {
        console.error(
          "[JoSan Background] Failed to get OpenAI usage stats:",
          error
        );
        return null;
      }
    },
  };
}

console.log("[JoSan Background] Service worker ready");
