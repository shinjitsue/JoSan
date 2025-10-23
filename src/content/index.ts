import { FilterProcessor } from "./filterProcessor";

// Initialize filter instance
let filter: FilterProcessor | null = null;
let observer: MutationObserver | null = null;

// Initialize the filter
const initializeFilter = async () => {
  try {
    console.log("[JoSan] Initializing content script...");

    if (!filter) {
      filter = new FilterProcessor();
    }

    await filter.loadSettings();

    // Initial page processing
    filter.processPage();

    console.log("[JoSan] Content script initialized successfully");

    // Start monitoring for dynamic content changes
    startObserver();
  } catch (error) {
    console.error("[JoSan] Initialization error:", error);
  }
};

// Start the MutationObserver
const startObserver = () => {
  if (!filter) return;

  // Disconnect existing observer if any
  if (observer) {
    observer.disconnect();
  }

  observer = new MutationObserver((mutations) => {
    try {
      // Check if filter is enabled before processing
      if (!filter || !filter.isFilterEnabled()) {
        return;
      }

      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (filter) {
              filter.processNode(node);
            }
          });
        }
      });
    } catch (error) {
      console.error("[JoSan] Observer error:", error);
    }
  });

  // Start observing after a short delay to ensure DOM is ready
  setTimeout(() => {
    if (document.body) {
      observer?.observe(document.body, {
        childList: true,
        subtree: true,
      });
      console.log("[JoSan] MutationObserver started");
    }
  }, 100);
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeFilter);
} else {
  initializeFilter();
}

// Re-initialize on page navigation (for SPAs)
window.addEventListener("load", () => {
  if (filter) {
    console.log("[JoSan] Page loaded, re-processing...");
    filter.processPage();
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  try {
    if (
      message.action === "updateFilterState" &&
      message.enabled !== undefined
    ) {
      if (!filter) {
        console.error("[JoSan] Filter not initialized");
        sendResponse({ success: false, error: "Filter not initialized" });
        return true;
      }

      filter.updateFilterState(message.enabled);

      if (message.enabled) {
        filter.processPage();
      }

      sendResponse({ success: true, enabled: message.enabled });
      return true;
    }

    sendResponse({ success: false, error: "Unknown action" });
  } catch (error) {
    console.error("[JoSan] Message handler error:", error);
    sendResponse({ success: false, error: String(error) });
  }

  return true;
});

// Listen for storage changes (when user changes platform settings)
chrome.storage.onChanged.addListener((changes, areaName) => {
  try {
    if (areaName === "local") {
      if (changes.enabledPlatforms) {
        console.log("[JoSan] Platform settings changed, reloading...");

        if (filter) {
          filter.loadSettings().then(() => {
            if (filter) {
              filter.processPage();
            }
          });
        }
      }

      if (changes.customWords) {
        console.log("[JoSan] Custom words changed, reloading...");
        if (filter) {
          filter.loadSettings().then(() => {
            if (filter) {
              filter.processPage();
            }
          });
        }
      }
    }
  } catch (error) {
    console.error("[JoSan] Storage change handler error:", error);
  }
});

// Handle page visibility changes (when user switches tabs)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && filter) {
    if (!chrome.runtime?.id) {
      console.warn("[JoSan] Extension context invalidated, cannot re-process");
      return;
    }
    console.log("[JoSan] Tab became visible, re-processing...");
    filter.processPage();
  }
});

// Cleanup on unload
window.addEventListener("beforeunload", () => {
  if (observer) {
    observer.disconnect();
    console.log("[JoSan] Observer disconnected");
  }
});

// Export for debugging (optional)
declare global {
  interface Window {
    JoSanDebug: {
      getFilter: () => FilterProcessor | null;
      reprocess: () => void;
      getStats: () => void;
    };
  }
}

if (typeof window !== "undefined") {
  window.JoSanDebug = {
    getFilter: () => filter,
    reprocess: () => {
      filter?.processPage();
    },
    getStats: () => {
      chrome.storage.local.get("stats", (result) => {
        console.log("[JoSan] Stats:", result.stats);
      });
    },
  };
}
