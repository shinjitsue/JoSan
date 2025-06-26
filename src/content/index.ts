import { FilterProcessor } from "./filterProcessor";

// Initialize when the content script loads
const filter = new FilterProcessor();

// Process the page when it loads
const initializeFilter = async () => {
  await filter.loadSettings();
  filter.processPage();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeFilter);
} else {
  initializeFilter();
}

// Monitor for dynamic content changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length > 0) {
      filter.processNodes(mutation.addedNodes);
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "updateFilterState" && message.enabled !== undefined) {
    filter.updateFilterState(message.enabled);

    // If enabling, re-process the page
    if (message.enabled) {
      filter.processPage();
    }

    sendResponse({ success: true });
  }

  if (message.action === "updateFilterStrength" && message.strength) {
    filter
      .updateFilterStrength(message.strength)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error }));
    return true;
  }
});
