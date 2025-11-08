import { useSettings } from "./hooks/useSettings";
import { useTheme } from "./hooks/useTheme";
import { usePlatform } from "./hooks/usePlatform";
import { Header } from "./components/Header";
import { FilterToggle } from "./components/FilterToggle";
import { StatsGrid } from "./components/StatsGrid";
import { PlatformStatus } from "./components/PlatformStatus";
import { AIToggle } from "./components/AIToggle";
import { AIUsageStats } from "./components/AIUsageStats";
import { SettingsButton } from "./components/SettingsButton";
import {
  FaFacebook,
  FaInstagram,
  FaReddit,
  FaLinkedin,
  FaTiktok,
  FaYoutube,
  FaTumblr,
  FaQuora,
  FaDiscord,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiThreads, SiBluesky } from "react-icons/si";
import type { IconType } from "react-icons";

const PLATFORM_CONFIG: Record<string, { name: string; icon: IconType }> = {
  facebook: { name: "Facebook", icon: FaFacebook },
  twitter: { name: "Twitter/X", icon: FaXTwitter },
  instagram: { name: "Instagram", icon: FaInstagram },
  reddit: { name: "Reddit", icon: FaReddit },
  linkedin: { name: "LinkedIn", icon: FaLinkedin },
  tiktok: { name: "TikTok", icon: FaTiktok },
  youtube: { name: "YouTube", icon: FaYoutube },
  tumblr: { name: "Tumblr", icon: FaTumblr },
  quora: { name: "Quora", icon: FaQuora },
  threads: { name: "Threads", icon: SiThreads },
  discord: { name: "Discord", icon: FaDiscord },
  bluesky: { name: "BlueSky", icon: SiBluesky },
};

function Popup() {
  const { settings, setSettings } = useSettings();
  const currentPlatform = usePlatform();
  useTheme(settings.theme);

  const toggleFilter = () => {
    const newState = !settings.isEnabled;
    setSettings({ ...settings, isEnabled: newState });
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
    const newState = !settings.useAI;
    setSettings({ ...settings, useAI: newState });
    chrome.storage.local.set({ useAI: newState });
  };

  const toggleCurrentPlatform = () => {
    if (currentPlatform === "unknown") return;

    const newPlatforms = settings.enabledPlatforms.includes(currentPlatform)
      ? settings.enabledPlatforms.filter((p) => p !== currentPlatform)
      : [...settings.enabledPlatforms, currentPlatform];

    setSettings({ ...settings, enabledPlatforms: newPlatforms });
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

  const isPlatformEnabled = settings.enabledPlatforms.includes(currentPlatform);
  const platformConfig = PLATFORM_CONFIG[currentPlatform];
  const platformDisplayName =
    platformConfig?.name || currentPlatform || "Unknown";
  const PlatformIcon = platformConfig?.icon;

  return (
    <div className="w-96 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-indigo-950/20 dark:to-gray-950 transition-colors duration-300">
      {/* Header section */}
      <div className="p-6 border-b-2 border-indigo-100 dark:border-indigo-900/50">
        <Header useAI={settings.useAI} isEnabled={settings.isEnabled} />
        <FilterToggle isEnabled={settings.isEnabled} onToggle={toggleFilter} />
      </div>

      {/* Main content */}
      <div className="p-6 space-y-4">
        <StatsGrid
          blockedWords={settings.stats.blockedWords}
          pagesScanned={settings.stats.pagesScanned}
        />

        {currentPlatform !== "unknown" && (
          <PlatformStatus
            platformDisplayName={platformDisplayName}
            platformIcon={PlatformIcon}
            isPlatformEnabled={isPlatformEnabled}
            onToggle={toggleCurrentPlatform}
            platformId={currentPlatform}
          />
        )}

        <AIToggle
          useAI={settings.useAI}
          groqApiKey={settings.groqApiKey}
          onToggle={toggleAI}
        />

        {settings.useAI && settings.groqApiKey && (
          <AIUsageStats
            requestsToday={settings.aiUsage.requestsToday}
            dailyLimit={settings.aiUsage.dailyLimit}
            requestsThisMinute={settings.aiUsage.requestsThisMinute}
            minuteLimit={settings.aiUsage.minuteLimit}
          />
        )}

        <SettingsButton onClick={openOptions} />
      </div>
    </div>
  );
}

export default Popup;
