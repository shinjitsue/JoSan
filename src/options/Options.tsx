import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle, RefreshCw } from "lucide-react";
import { BasicSettings } from "./components/BasicSettings";
import { AISettings } from "./components/AISettings";
import { PlatformSettings } from "./components/PlatformSettings";
import { CustomWords } from "./components/CustomWords";
import { PrivacySettings } from "./components/PrivacySettings";
import { ThemeSettings } from "./components/ThemeSettings";
import UsageDashboard from "./components/UsageDashboard";

interface Settings {
  enabled: boolean;
  theme: "light" | "dark" | "system";
  customWords: string[];
  filterFeedsOnly: boolean;
  enabledPlatforms: string[];
  useAI: boolean;
  filterMild: boolean;
  filterToxic: boolean;
  groqApiKey: string;
}

function Options() {
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    theme: "system",
    customWords: [],
    filterFeedsOnly: true,
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
    useAI: false,
    filterMild: false,
    filterToxic: true,
    groqApiKey: "",
  });
  const [saved, setSaved] = useState(false);

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;

      if (settings.theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        root.classList.toggle("dark", systemTheme === "dark");
      } else {
        root.classList.toggle("dark", settings.theme === "dark");
      }
    };

    applyTheme();

    // Listen for system theme changes if using system theme
    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [settings.theme]);

  useEffect(() => {
    chrome.storage.local.get(
      {
        enabled: true,
        theme: "system",
        customWords: [],
        filterFeedsOnly: true,
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
        useAI: false,
        filterMild: false,
        filterToxic: true,
        groqApiKey: "",
      },
      (items) => {
        setSettings(items as Settings);
      }
    );
  }, []);

  const handleSave = () => {
    chrome.storage.local.set(settings, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      console.log("[JoSan] Settings saved. Please reload affected tabs.");
    });
  };

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-200">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
              JoSan Settings
            </h1>
            <Button onClick={handleSave} size="lg" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
          <p className="text-muted-foreground">
            Configure your profanity filtering preferences
          </p>
        </div>

        {/* Success Message */}
        {saved && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <p className="font-medium">Settings saved successfully!</p>
              <p className="text-sm mt-1">
                Please reload social media tabs for changes to take effect.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          <BasicSettings
            enabled={settings.enabled}
            onEnabledChange={(enabled) => updateSetting("enabled", enabled)}
          />

          <ThemeSettings
            theme={settings.theme}
            onThemeChange={(theme) => updateSetting("theme", theme)}
          />

          <AISettings
            useAI={settings.useAI}
            filterMild={settings.filterMild}
            filterToxic={settings.filterToxic}
            groqApiKey={settings.groqApiKey}
            onUseAIChange={(useAI) => updateSetting("useAI", useAI)}
            onFilterMildChange={(filterMild) =>
              updateSetting("filterMild", filterMild)
            }
            onFilterToxicChange={(filterToxic) =>
              updateSetting("filterToxic", filterToxic)
            }
            onApiKeyChange={(apiKey) => updateSetting("groqApiKey", apiKey)}
          />

          {settings.useAI && settings.groqApiKey && <UsageDashboard />}

          <PlatformSettings
            enabledPlatforms={settings.enabledPlatforms}
            onPlatformsChange={(platforms) =>
              updateSetting("enabledPlatforms", platforms)
            }
          />

          <CustomWords
            customWords={settings.customWords}
            onAddWord={(word) =>
              updateSetting("customWords", [...settings.customWords, word])
            }
            onRemoveWord={(word) =>
              updateSetting(
                "customWords",
                settings.customWords.filter((w) => w !== word)
              )
            }
          />

          <PrivacySettings
            filterFeedsOnly={settings.filterFeedsOnly}
            onFilterFeedsOnlyChange={(value) =>
              updateSetting("filterFeedsOnly", value)
            }
          />
        </div>
      </div>
    </div>
  );
}

export default Options;
