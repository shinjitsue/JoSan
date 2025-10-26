import { useState, useEffect } from "react";

interface Stats {
  blockedWords: number;
  pagesScanned: number;
  lastScan: string;
}

interface UsageStats {
  requestsToday: number;
  dailyLimit: number;
  requestsThisMinute: number;
  minuteLimit: number;
}

interface Settings {
  isEnabled: boolean;
  theme: "light" | "dark" | "system";
  stats: Stats;
  useAI: boolean;
  enabledPlatforms: string[];
  groqApiKey: string;
  aiUsage: UsageStats;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({
    isEnabled: true,
    theme: "system",
    stats: { blockedWords: 0, pagesScanned: 0, lastScan: "" },
    useAI: false,
    enabledPlatforms: [],
    groqApiKey: "",
    aiUsage: {
      requestsToday: 0,
      dailyLimit: 14400,
      requestsThisMinute: 0,
      minuteLimit: 30,
    },
  });

  useEffect(() => {
    chrome.storage.local.get(
      {
        enabled: true,
        theme: "system",
        stats: { blockedWords: 0, pagesScanned: 0, lastScan: "" },
        useAI: false,
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
        groqApiKey: "",
        groqUsageStats: {
          requestsToday: 0,
          requestsThisMinute: 0,
        },
      },
      (items) => {
        setSettings({
          isEnabled: items.enabled,
          theme: items.theme,
          stats: items.stats,
          useAI: items.useAI,
          enabledPlatforms: items.enabledPlatforms,
          groqApiKey: items.groqApiKey || "",
          aiUsage: {
            requestsToday: items.groqUsageStats?.requestsToday || 0,
            dailyLimit: 14400,
            requestsThisMinute: items.groqUsageStats?.requestsThisMinute || 0,
            minuteLimit: 30,
          },
        });
      }
    );
  }, []);

  return { settings, setSettings };
}
