import { PlatformDetector } from "../utils/PlatformDetector";
import { ProfanityLoader } from "../utils/ProfanityLoader";

interface FilterSettings {
  useAI: boolean;
  filterMild: boolean;
  filterToxic: boolean;
}

interface RegexSet {
  english: RegExp | null;
  tagalog: RegExp | null;
  cebuano: RegExp | null;
}

export class SettingsManager {
  private profanitySets: Record<string, Set<string>> = {
    en: new Set(),
    tl: new Set(),
    ceb: new Set(),
  };

  private profanityRegexes: RegexSet = {
    english: null,
    tagalog: null,
    cebuano: null,
  };

  private filterSettings: FilterSettings = {
    useAI: false,
    filterMild: false,
    filterToxic: true,
  };

  private isEnabled = true;
  private enabledPlatforms: string[] = [];
  private currentPlatform = "";

  async loadSettings(): Promise<{
    isEnabled: boolean;
    filterSettings: FilterSettings;
    regexes: RegexSet;
    currentPlatform: string;
    isPlatformEnabled: boolean;
  }> {
    try {
      console.log("[JoSan] Loading optimized settings...");

      // Load profanity lists for all languages
      await this.loadMultilingualWordLists();

      // Load settings from storage
      const result = await chrome.storage.local.get({
        enabled: true,
        customWords: [],
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
        openaiApiKey: "",
      });

      this.isEnabled = result.enabled;
      this.enabledPlatforms = result.enabledPlatforms;
      this.filterSettings = {
        useAI: result.useAI,
        filterMild: result.filterMild,
        filterToxic: result.filterToxic,
      };

      // Send API key to background service if AI is enabled
      if (result.openaiApiKey && this.filterSettings.useAI) {
        await this.configureAPIKey(result.openaiApiKey);
      }

      // Detect current platform
      this.currentPlatform = PlatformDetector.detect();
      console.log(`[JoSan] Current platform: ${this.currentPlatform}`);

      const isPlatformEnabled = this.enabledPlatforms.includes(
        this.currentPlatform
      );
      if (!isPlatformEnabled) {
        console.log(
          `[JoSan] Platform ${this.currentPlatform} not enabled, filter disabled`
        );
        this.isEnabled = false;
      }

      // Add custom words
      this.addCustomWords(result.customWords);

      // Compile regexes
      this.compileRegexes();

      const totalWords = Object.values(this.profanitySets).reduce(
        (sum, set) => sum + set.size,
        0
      );
      console.log(
        `[JoSan] Loaded ${totalWords} total words across 3 languages`
      );

      return {
        isEnabled: this.isEnabled,
        filterSettings: this.filterSettings,
        regexes: this.profanityRegexes,
        currentPlatform: this.currentPlatform,
        isPlatformEnabled,
      };
    } catch (error) {
      console.error("[JoSan] Failed to load settings:", error);
      throw error;
    }
  }

  private async loadMultilingualWordLists(): Promise<void> {
    const languages = [
      { code: "en", file: "en.txt" },
      { code: "tl", file: "tl.txt" },
      { code: "ceb", file: "ceb.txt" },
    ];

    for (const lang of languages) {
      try {
        const response = await fetch(
          chrome.runtime.getURL(`data/${lang.file}`)
        );
        if (response.ok) {
          const text = await response.text();
          const words = text
            .split("\n")
            .map((w) => w.trim().toLowerCase())
            .filter((w) => w.length > 0);
          this.profanitySets[lang.code as keyof typeof this.profanitySets] =
            new Set(words);
          console.log(`[JoSan] Loaded ${words.length} ${lang.code} words`);
        }
      } catch (error) {
        console.error(`[JoSan] Failed to load ${lang.code} word list:`, error);
      }
    }
  }

  private async configureAPIKey(apiKey: string): Promise<void> {
    try {
      await chrome.runtime.sendMessage({
        type: "SET_API_KEY",
        apiKey: apiKey,
      });
      console.log("[JoSan] API key configured in background service");
    } catch (error) {
      console.warn("[JoSan] Failed to configure API key:", error);
    }
  }

  private addCustomWords(customWords: string[]): void {
    const words = Array.isArray(customWords) ? customWords : [];
    words.forEach((word: string) => {
      if (typeof word === "string" && word.trim().length > 0) {
        this.profanitySets.en.add(word.toLowerCase());
      }
    });
  }

  private compileRegexes(): void {
    this.profanityRegexes.english = ProfanityLoader.compileRegex(
      this.profanitySets.en
    );
    this.profanityRegexes.tagalog = ProfanityLoader.compileRegex(
      this.profanitySets.tl
    );
    this.profanityRegexes.cebuano = ProfanityLoader.compileRegex(
      this.profanitySets.ceb
    );
  }

  getFilterSettings(): FilterSettings {
    return { ...this.filterSettings };
  }

  getRegexes(): RegexSet {
    return { ...this.profanityRegexes };
  }

  isFilterEnabled(): boolean {
    return this.isEnabled;
  }

  getCurrentPlatform(): string {
    return this.currentPlatform;
  }

  updateFilterState(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`[JoSan] Filter state updated: ${enabled}`);
  }
}
