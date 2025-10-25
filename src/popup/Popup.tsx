import { useState, useEffect } from "react";
import {
  Sparkles,
  Settings,
  Globe,
  AlertTriangle,
  Shield,
  Scan,
  CheckCircle2,
  PauseCircle,
  Bot,
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

  // Platform name mapping
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

  // Apply theme based on settings
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

  // Detect current platform
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

  // Load settings when component mounts
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

        // Load AI usage stats
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

  // Toggle filter state
  const toggleFilter = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    chrome.storage.local.set({ enabled: newState });

    // Send message to content script to update filter state
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "updateFilterState",
            enabled: newState,
          },
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

  // Toggle AI
  const toggleAI = () => {
    const newState = !useAI;
    setUseAI(newState);
    chrome.storage.local.set({ useAI: newState });
  };

  // Toggle current platform
  const toggleCurrentPlatform = () => {
    if (currentPlatform === "unknown") return;

    const newPlatforms = enabledPlatforms.includes(currentPlatform)
      ? enabledPlatforms.filter((p) => p !== currentPlatform)
      : [...enabledPlatforms, currentPlatform];

    setEnabledPlatforms(newPlatforms);
    chrome.storage.local.set({ enabledPlatforms: newPlatforms });

    // Reload the current tab to apply changes
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
    <div className="w-96 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-indigo-950/20 dark:to-gray-900 transition-colors duration-300">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                JoSan
                <span
                  className={`w-2 h-2 rounded-full ${
                    isEnabled
                      ? "bg-green-400 shadow-lg shadow-green-400/50"
                      : "bg-gray-400"
                  }`}
                />
              </h1>
              <div className="text-sm text-indigo-100">
                <div className="font-medium flex items-center gap-1.5">
                  {useAI ? (
                    <>
                      AI-Powered Filtering
                      <Bot className="h-3.5 w-3.5" />
                    </>
                  ) : (
                    <>
                      Pattern-Based Filtering
                      <Shield className="h-3.5 w-3.5" />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <div>
            <p className="text-white font-medium">Filter Status</p>
            <p className="text-xs text-indigo-100 flex items-center gap-1.5">
              {isEnabled ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-300" />
                  <span>Active</span>
                </>
              ) : (
                <>
                  <PauseCircle className="h-3.5 w-3.5 text-gray-300" />
                  <span>Paused</span>
                </>
              )}
            </p>
          </div>
          <div className="relative inline-block w-14 h-7 transition duration-200 ease-in-out rounded-full">
            <input
              type="checkbox"
              id="toggle"
              className="absolute w-7 h-7 opacity-0 cursor-pointer"
              checked={isEnabled}
              onChange={toggleFilter}
            />
            <label
              htmlFor="toggle"
              className={`block h-7 overflow-hidden rounded-full cursor-pointer transition-colors duration-300 ease-in-out ${
                isEnabled
                  ? "bg-green-400 shadow-lg shadow-green-400/30"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`block h-7 w-7 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${
                  isEnabled ? "translate-x-7" : "translate-x-0"
                }`}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Blocked Words */}
          <div className="rounded-xl bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border-2 border-red-200 dark:border-red-800 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/50">
                <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs font-medium text-red-900 dark:text-red-200">
                Blocked
              </p>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.blockedWords}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              words filtered
            </p>
          </div>

          {/* Pages Scanned */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-blue-200 dark:border-blue-800 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Scan className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                Scanned
              </p>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.pagesScanned}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              pages checked
            </p>
          </div>
        </div>

        {/* Current Platform Card */}
        {currentPlatform !== "unknown" && (
          <div className="rounded-xl bg-white dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <p className="text-xs font-medium text-gray-900 dark:text-gray-200">
                  Current Platform
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isPlatformEnabled
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {isPlatformEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base">
                {platformDisplayName}
              </span>
              <button
                onClick={toggleCurrentPlatform}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                  isPlatformEnabled
                    ? "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300"
                    : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300"
                }`}
              >
                {isPlatformEnabled ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        )}

        {/* AI Toggle Card */}
        <button
          onClick={toggleAI}
          disabled={!groqApiKey}
          className={`w-full rounded-xl p-4 transition-all duration-300 flex items-center justify-between border-2 ${
            useAI
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg shadow-indigo-500/30"
              : groqApiKey
              ? "bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700"
              : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-60"
          }`}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5" />
            <div className="text-left">
              <p className="font-semibold text-base">AI Mode</p>
              <p className="text-xs opacity-90">
                {!groqApiKey
                  ? "API key required"
                  : useAI
                  ? "Context-aware filtering"
                  : "Enable for better accuracy"}
              </p>
            </div>
          </div>
          <span
            className={`w-2 h-2 rounded-full ${
              useAI
                ? "bg-green-400 shadow-lg shadow-green-400/50"
                : "bg-gray-400"
            }`}
          />
        </button>

        {/* AI Usage Stats */}
        {useAI && groqApiKey && (
          <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-800 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-purple-900 dark:text-purple-200 flex items-center gap-2">
                🤖 AI Usage Today
              </p>
              {dailyUsagePercent >= 90 && (
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
            </div>

            {/* Daily Usage Bar */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-700 dark:text-purple-300">
                  Daily: {aiUsage.requestsToday} / {aiUsage.dailyLimit}
                </span>
                <span className="font-medium text-purple-900 dark:text-purple-200">
                  {dailyUsagePercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-900/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dailyUsagePercent >= 90
                      ? "bg-red-500"
                      : dailyUsagePercent >= 70
                      ? "bg-yellow-500"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600"
                  }`}
                  style={{ width: `${Math.min(dailyUsagePercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Per-Minute Usage Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-purple-700 dark:text-purple-300">
                  This Minute: {aiUsage.requestsThisMinute} /{" "}
                  {aiUsage.minuteLimit}
                </span>
                <span className="font-medium text-purple-900 dark:text-purple-200">
                  {minuteUsagePercent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-purple-200 dark:bg-purple-900/50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    minuteUsagePercent >= 90
                      ? "bg-red-500"
                      : minuteUsagePercent >= 70
                      ? "bg-yellow-500"
                      : "bg-gradient-to-r from-blue-600 to-cyan-600"
                  }`}
                  style={{ width: `${Math.min(minuteUsagePercent, 100)}%` }}
                />
              </div>
            </div>

            {dailyUsagePercent >= 90 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                ⚠️ Approaching daily limit!
              </p>
            )}
          </div>
        )}

        {/* Settings Button */}
        <button
          onClick={openOptions}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 font-medium"
        >
          <Settings className="h-4 w-4" />
          Advanced Settings
        </button>
      </div>
    </div>
  );
}

export default Popup;
