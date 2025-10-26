import { useState, useEffect } from "react";

export function usePlatform() {
  const [currentPlatform, setCurrentPlatform] = useState<string>("");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url;
      if (!url) {
        setCurrentPlatform("unknown");
        return;
      }

      try {
        const hostname = new URL(url).hostname;
        let platform = "unknown";

        if (hostname.includes("facebook.com")) platform = "facebook";
        else if (hostname.includes("twitter.com") || hostname.includes("x.com"))
          platform = "twitter";
        else if (hostname.includes("instagram.com")) platform = "instagram";
        else if (hostname.includes("reddit.com")) platform = "reddit";
        else if (hostname.includes("linkedin.com")) platform = "linkedin";
        else if (hostname.includes("tiktok.com")) platform = "tiktok";
        else if (hostname.includes("youtube.com")) platform = "youtube";
        else if (hostname.includes("tumblr.com")) platform = "tumblr";
        else if (hostname.includes("quora.com")) platform = "quora";
        else if (hostname.includes("threads.net")) platform = "threads";
        else if (hostname.includes("discord.com")) platform = "discord";
        else if (hostname.includes("bsky.app")) platform = "bluesky";

        setCurrentPlatform(platform);
      } catch (error) {
        console.error("[JoSan Popup] Error parsing URL:", error);
        setCurrentPlatform("unknown");
      }
    });
  }, []);

  return currentPlatform;
}
