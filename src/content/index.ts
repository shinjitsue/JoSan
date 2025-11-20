import { FilterProcessor } from "./FilterProcessor";

let filter: FilterProcessor | null = null;
let observer: MutationObserver | null = null;

const initializeFilter = async () => {
  try {
    console.log("[JoSan] Initializing content script...");
    if (!filter) filter = new FilterProcessor();
    await filter.loadSettings();
    await filter.processPage();
    startObserver();
    console.log("[JoSan] Content script initialized");
  } catch (error) {
    console.error("[JoSan] Initialization error:", error);
  }
};

const startObserver = () => {
  if (!filter) return;
  if (observer) observer.disconnect();

  observer = new MutationObserver((mutations) => {
    try {
      if (!filter || !filter.isFilterEnabled()) return;

      for (const mutation of mutations) {
        // Handle in-place text changes
        if (mutation.type === "characterData") {
          const target = mutation.target;
          filter.invalidateNode(target);
          filter.processNode(target); // async (fire-and-forget)
          continue;
        }

        // New nodes added
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            // Skip filtered spans
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              node instanceof Element &&
              node.hasAttribute("data-josan-filtered")
            ) {
              return;
            }
            filter?.processNode(node);
          });
        }
      }
    } catch (error) {
      console.error("[JoSan] Observer error:", error);
    }
  });

  setTimeout(() => {
    if (document.body) {
      observer?.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        characterDataOldValue: false,
      });
      console.log(
        "[JoSan] MutationObserver started (childList + characterData)"
      );
    }
  }, 100);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeFilter);
} else {
  initializeFilter();
}

window.addEventListener("load", () => {
  if (filter) {
    console.log("[JoSan] Page load event, re-processing...");
    filter.processPage();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  try {
    if (
      message.action === "updateFilterState" &&
      message.enabled !== undefined
    ) {
      if (!filter) {
        sendResponse({ success: false, error: "Filter not initialized" });
        return true;
      }
      filter.updateFilterState(message.enabled);
      if (message.enabled) filter.processPage();
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

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (!filter) return;

  if (
    changes.enabledPlatforms ||
    changes.customWords ||
    changes.openaiApiKey ||
    changes.useAI ||
    changes.filterMild ||
    changes.filterToxic
  ) {
    console.log("[JoSan] Settings changed (AI/platform), reloading...");
    filter
      .loadSettings()
      .then(() => filter?.processPage())
      .catch((e) => console.error("[JoSan] Reload error:", e));
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && filter) {
    if (!chrome.runtime?.id) {
      console.warn("[JoSan] Context invalid, cannot re-process");
      return;
    }
    filter.processPage();
  }
});

window.addEventListener("beforeunload", () => {
  if (observer) observer.disconnect();
  if (filter && chrome?.runtime?.id) {
    try {
      const stats = filter.getStats?.();
      if (stats) chrome.storage.local.set({ stats });
    } catch (e) {
      console.error("[JoSan] Failed to persist stats before unload:", e);
    }
  }
});

if (typeof chrome !== "undefined" && chrome.runtime) {
  chrome.runtime.onSuspend?.addListener(() => {
    if (observer) observer.disconnect();
    filter = null;
  });
}

declare global {
  interface Window {
    JoSanDebug: {
      getFilter: () => FilterProcessor | null;
      reprocess: () => void;
      getStats: () => void;
      invalidateSelection: () => void;
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
    invalidateSelection: () => {
      const sel = window.getSelection();
      if (sel && sel.anchorNode && filter) {
        filter.invalidateNode(sel.anchorNode);
        filter.processNode(sel.anchorNode);
      }
    },
  };
}
