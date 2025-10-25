import { useState, useEffect } from "react";
import {
  Sparkles,
  Settings,
  Globe,
  AlertTriangle,
  Shield,
  Scan,
  CheckCircle2,
  Power,
  Bot,
  Zap,
} from "lucide-react";

interface UsageStats {
  requestsToday: number;
  dailyLimit: number;
  requestsThisMinute: number;
  minuteLimit: number;
}

function Popup() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [stats, setStats] = useState({
    blockedWords: 0,
    pagesScanned: 0,
    lastScan: "",
  });
  const [useAI, setUseAI] = useState(false);
  const [enabledPlatforms, setEnabledPlatforms] = useState<string[]>([]);
  const [currentPlatform, setCurrentPlatform] = useState<string>("");
  const [aiUsage, setAIUsage] = useState<UsageStats>({
    requestsToday: 0,
    dailyLimit: 14400,
    requestsThisMinute: 0,
    minuteLimit: 30,
  });
  const [groqApiKey, setGroqApiKey] = useState<string>("");

  const platformNames: { [key: string]: string } = {
    facebook: "Facebook",
    twitter: "Twitter/X",
    instagram: "Instagram",
    reddit: "Reddit",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    youtube: "YouTube",
    tumblr: "Tumblr",
    quora: "Quora",
    threads: "Threads",
    discord: "Discord",
    bluesky: "BlueSky",
  };

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        root.classList.toggle("dark", systemTheme === "dark");
      } else {
        root.classList.toggle("dark", theme === "dark");
      }
    };

    applyTheme();
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  // Detect platform
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

  // Load settings
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
        setIsEnabled(items.enabled);
        setTheme(items.theme);
        setUseAI(items.useAI);
        setEnabledPlatforms(items.enabledPlatforms);
        setGroqApiKey(items.groqApiKey || "");
        if (items.stats) setStats(items.stats);

        if (items.groqUsageStats) {
          setAIUsage({
            requestsToday: items.groqUsageStats.requestsToday || 0,
            dailyLimit: 14400,
            requestsThisMinute: items.groqUsageStats.requestsThisMinute || 0,
            minuteLimit: 30,
          });
        }
      }
    );
  }, []);

  const toggleFilter = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    chrome.storage.local.set({ enabled: newState });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "updateFilterState", enabled: newState },
          (response) => {
            if (chrome.runtime.lastError) {
              console.log(
                "[JoSan Popup] Content script not ready:",
                chrome.runtime.lastError.message
              );
            } else {
              console.log("[JoSan Popup] Filter state updated:", response);
            }
          }
        );
      }
    });
  };

  const toggleAI = () => {
    const newState = !useAI;
    setUseAI(newState);
    chrome.storage.local.set({ useAI: newState });
  };

  const toggleCurrentPlatform = () => {
    if (currentPlatform === "unknown") return;

    const newPlatforms = enabledPlatforms.includes(currentPlatform)
      ? enabledPlatforms.filter((p) => p !== currentPlatform)
      : [...enabledPlatforms, currentPlatform];

    setEnabledPlatforms(newPlatforms);
    chrome.storage.local.set({ enabledPlatforms: newPlatforms });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const isPlatformEnabled = enabledPlatforms.includes(currentPlatform);
  const platformDisplayName =
    platformNames[currentPlatform] || currentPlatform || "Unknown";

  const dailyUsagePercent = (aiUsage.requestsToday / aiUsage.dailyLimit) * 100;
  const minuteUsagePercent =
    (aiUsage.requestsThisMinute / aiUsage.minuteLimit) * 100;

  return (
    <div className="w-96 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-indigo-950/20 dark:to-gray-950 transition-colors duration-300">
      {/* Minimal Header */}
      <div className="p-6 border-b-2 border-indigo-100 dark:border-indigo-900/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                JoSan
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                {useAI ? (
                  <>
                    <Bot className="h-3 w-3" />
                    AI-Powered Filtering
                  </>
                ) : (
                  <>
                    <Shield className="h-3 w-3" />
                    Pattern-Based Filtering
                  </>
                )}
              </p>
            </div>
          </div>
          <div
            className={`h-3 w-3 rounded-full transition-all ${
              isEnabled
                ? "bg-green-500 shadow-lg shadow-green-500/50"
                : "bg-gray-400"
            }`}
          />
        </div>

        {/* Main Toggle */}
        <button
          onClick={toggleFilter}
          className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
            isEnabled
              ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800 shadow-sm"
              : "bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isEnabled
                  ? "bg-indigo-100 dark:bg-indigo-900/50"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <Power
                className={`h-4 w-4 ${
                  isEnabled
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-400"
                }`}
              />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Filter Status</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {isEnabled ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                    Active
                  </>
                ) : (
                  <>Paused</>
                )}
              </p>
            </div>
          </div>
          <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
            {isEnabled ? "On" : "Off"}
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border-2 border-red-100 dark:border-red-900/50 bg-gradient-to-br from-red-50/50 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-xs font-medium text-muted-foreground">
                Blocked
              </p>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.blockedWords}
            </p>
          </div>

          <div className="p-4 rounded-xl border-2 border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center gap-2 mb-2">
              <Scan className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-medium text-muted-foreground">
                Scanned
              </p>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.pagesScanned}
            </p>
          </div>
        </div>

        {/* Current Platform */}
        {currentPlatform !== "unknown" && (
          <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium">
                  {platformDisplayName}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  isPlatformEnabled
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {isPlatformEnabled ? "Active" : "Inactive"}
              </span>
            </div>
            <button
              onClick={toggleCurrentPlatform}
              className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                isPlatformEnabled
                  ? "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300"
                  : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300"
              }`}
            >
              {isPlatformEnabled
                ? "Disable for this site"
                : "Enable for this site"}
            </button>
          </div>
        )}

        {/* AI Mode Toggle */}
        <button
          onClick={toggleAI}
          disabled={!groqApiKey}
          className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
            useAI
              ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800 shadow-sm"
              : groqApiKey
              ? "bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700"
              : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-60"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  useAI
                    ? "bg-indigo-100 dark:bg-indigo-900/50"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <Bot
                  className={`h-4 w-4 ${
                    useAI
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-gray-400"
                  }`}
                />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">AI Context Analysis</p>
                <p className="text-xs text-muted-foreground">
                  {!groqApiKey
                    ? "API key required"
                    : useAI
                    ? "Active"
                    : "Click to enable"}
                </p>
              </div>
            </div>
            <div
              className={`h-2 w-2 rounded-full ${
                useAI ? "bg-indigo-600 dark:bg-indigo-400" : "bg-gray-400"
              }`}
            />
          </div>
        </button>

        {/* AI Usage Stats */}
        {useAI && groqApiKey && (
          <div className="p-4 rounded-xl border-2 border-purple-100 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <p className="text-xs font-medium text-muted-foreground">
                  AI Usage Today
                </p>
              </div>
              {dailyUsagePercent >= 90 && (
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </div>

            {/* Daily Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {aiUsage.requestsToday} / {aiUsage.dailyLimit}
                </span>
                <span className="font-medium">
                  {dailyUsagePercent.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    dailyUsagePercent >= 90
                      ? "bg-red-500"
                      : dailyUsagePercent >= 70
                      ? "bg-yellow-500"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600"
                  }`}
                  style={{ width: `${Math.min(dailyUsagePercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Minute Progress */}
            <div className="space-y-1.5 pt-2 border-t border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  This minute: {aiUsage.requestsThisMinute} /{" "}
                  {aiUsage.minuteLimit}
                </span>
                <span className="font-medium">
                  {minuteUsagePercent.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    minuteUsagePercent >= 90 ? "bg-red-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(minuteUsagePercent, 100)}%` }}
                />
              </div>
            </div>

            {dailyUsagePercent >= 90 && (
              <p className="text-xs text-red-600 dark:text-red-400 font-medium pt-2">
                ⚠️ Approaching daily limit
              </p>
            )}
          </div>
        )}

        {/* Settings Button */}
        <button
          onClick={openOptions}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg font-medium text-sm"
        >
          <Settings className="h-4 w-4" />
          Advanced Settings
        </button>
      </div>
    </div>
  );
}

export default Popup;
