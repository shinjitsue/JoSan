chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed:", details.reason);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message, "from:", sender);
  sendResponse({ status: "received" });
});

export {};
