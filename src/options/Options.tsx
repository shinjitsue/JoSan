import { useState, useEffect, lazy, Suspense } from "react";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import { BasicSettings } from "./components/BasicSettings";
import { AISettings } from "./components/AISettings";
import { PlatformSettings } from "./components/PlatformSettings";
import { CustomWords } from "./components/CustomWords";
import { PrivacySettings } from "./components/PrivacySettings";
import { ThemeSettings } from "./components/ThemeSettings";
import { GiAngryEyes } from "react-icons/gi";

const UsageDashboard = lazy(() => import("./components/UsageDashboard"));

interface Settings {
  enabled: boolean;
  theme: "light" | "dark" | "system";
  customWords: string[];
  filterFeedsOnly: boolean;
  enabledPlatforms: string[];
  useAI: boolean;
  filterMild: boolean;
  filterToxic: boolean;
  filterMode: "interactive" | "strict";
  openaiApiKey: string;
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
    filterMode: "interactive",
    openaiApiKey: "",
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
        filterMode: "interactive",
        openaiApiKey: "",
      },
      (items) => {
        // Sanitize enabledPlatforms
        const raw = items.enabledPlatforms;
        const enabledPlatforms = Array.isArray(raw)
          ? Array.from(
              new Set(
                raw.filter(
                  (p: unknown) => typeof p === "string" && p.trim().length > 0
                )
              )
            )
          : [
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
            ];

        // Apply sanitized settings
        const itemsTyped = items as Partial<Settings>;
        const merged: Settings = {
          ...(items as Settings),
          enabledPlatforms,
          filterMode:
            itemsTyped.filterMode === "strict" ? "strict" : "interactive",
        };
        setSettings(merged);
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
    // Ensure enabledPlatforms stays unique
    if (key === "enabledPlatforms") {
      const unique = Array.isArray(value)
        ? Array.from(new Set((value as unknown as string[]).filter(Boolean)))
        : value;
      setSettings({ ...settings, [key]: unique } as Settings);
      return;
    }

    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-indigo-950/20 dark:to-gray-950 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Modern Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                  <GiAngryEyes className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  JoSan Settings
                </h1>
              </div>
              <p className="text-muted-foreground ml-16 text-lg">
                Configure your intelligent content moderation preferences
              </p>
            </div>
            <Button
              onClick={handleSave}
              size="lg"
              className="gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <RefreshCw className="h-5 w-5" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {saved && (
          <Alert className="mb-8 border-green-500/50 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 shadow-lg">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <p className="font-semibold text-base">
                Settings saved successfully!
              </p>
              <p className="text-sm mt-1">
                Please reload social media tabs for changes to take effect.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Settings Grid */}
        <div className="grid gap-8">
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
            filterMode={settings.filterMode}
            openaiApiKey={settings.openaiApiKey}
            onUseAIChange={(useAI) => updateSetting("useAI", useAI)}
            onFilterMildChange={(filterMild) =>
              updateSetting("filterMild", filterMild)
            }
            onFilterToxicChange={(filterToxic) =>
              updateSetting("filterToxic", filterToxic)
            }
            onFilterModeChange={(mode) => updateSetting("filterMode", mode)}
            onApiKeyChange={(apiKey) => updateSetting("openaiApiKey", apiKey)}
          />

          {settings.useAI && settings.openaiApiKey && (
            <Suspense
              fallback={
                <div className="rounded-xl border-2 bg-white dark:bg-gray-900/50 p-12 shadow-sm flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                  <span className="ml-3 text-muted-foreground">
                    Loading dashboard...
                  </span>
                </div>
              }
            >
              <UsageDashboard />
            </Suspense>
          )}

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
            onClearAll={() => updateSetting("customWords", [])}
          />

          <PrivacySettings />
        </div>
      </div>
    </div>
  );
}

export default Options;
