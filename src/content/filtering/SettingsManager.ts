import { PlatformDetector } from "../utils/PlatformDetector";
import { ProfanityLoader, type WordListData } from "../utils/ProfanityLoader";

interface FilterSettings {
  useAI: boolean;
  filterMild: boolean;
  filterToxic: boolean;
  filterMode: "interactive" | "strict";
}

interface WordListSet {
  english: WordListData | null;
  tagalog: WordListData | null;
  bisaya: WordListData | null;
}

export class SettingsManager {
  private wordLists: WordListSet = {
    english: null,
    tagalog: null,
    bisaya: null,
  };

  private customWordList: WordListData | null = null;

  private filterSettings: FilterSettings = {
    useAI: false,
    filterMild: false,
    filterToxic: true,
    filterMode: "interactive",
  };

  private isEnabled = true;
  private enabledPlatforms: string[] = [];
  private currentPlatform = "";

  async loadSettings(): Promise<{
    isEnabled: boolean;
    filterSettings: FilterSettings;
    wordLists: WordListSet;
    customWordList: WordListData | null;
    currentPlatform: string;
    isPlatformEnabled: boolean;
  }> {
    try {
      console.log("[JoSan] Loading enhanced settings with Bloom+Trie...");

      // Load all language word lists concurrently
      const [englishData, tagalogData, bisayaData] = await Promise.all([
        ProfanityLoader.loadWordList("en", "en.txt"),
        ProfanityLoader.loadWordList("tl", "tl.txt"),
        ProfanityLoader.loadWordList("bis", "bis.txt"),
      ]);

      this.wordLists = {
        english: englishData,
        tagalog: tagalogData,
        bisaya: bisayaData,
      };

      // Print memory usage stats
      console.log("[JoSan] Memory usage:");
      Object.values(this.wordLists).forEach((wordList) => {
        if (wordList) {
          const stats = ProfanityLoader.getStats(wordList);
          console.log(
            `  ${stats.language}: ${stats.wordCount} words, ${(
              stats.totalMemoryBytes / 1024
            ).toFixed(1)}KB`
          );
        }
      });

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
        filterMode: "interactive",
        openaiApiKey: "",
      });

      this.isEnabled = result.enabled;
      this.enabledPlatforms = result.enabledPlatforms;
      this.filterSettings = {
        useAI: result.useAI,
        filterMild: result.filterMild,
        filterToxic: result.filterToxic,
        filterMode: result.filterMode === "strict" ? "strict" : "interactive",
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

      // Create custom word list
      await this.updateCustomWords(result.customWords);

      const totalWords =
        Object.values(this.wordLists).reduce(
          (sum, wordList) => sum + (wordList?.wordCount || 0),
          0
        ) + (this.customWordList?.wordCount || 0);

      console.log(
        `[JoSan] Loaded ${totalWords} total words across all languages`
      );

      return {
        isEnabled: this.isEnabled,
        filterSettings: this.filterSettings,
        wordLists: this.wordLists,
        customWordList: this.customWordList,
        currentPlatform: this.currentPlatform,
        isPlatformEnabled,
      };
    } catch (error) {
      console.error("[JoSan] Failed to load settings:", error);
      throw error;
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

  async updateCustomWords(customWords: string[]): Promise<void> {
    const words = Array.isArray(customWords) ? customWords : [];
    const validWords = words
      .filter(
        (word: string) => typeof word === "string" && word.trim().length > 0
      )
      .map((word: string) => word.toLowerCase().trim());

    if (validWords.length > 0) {
      this.customWordList = {
        bloom: new (await import("../utils/BloomFilter")).BloomFilter(
          validWords.length,
          0.01
        ),
        trie: new (await import("../utils/TrieFilter")).TrieFilter(),
        wordCount: validWords.length,
        language: "custom",
      };

      validWords.forEach((word) => {
        this.customWordList!.bloom.add(word);
        this.customWordList!.trie.addWord(word, "custom");
      });

      console.log(
        `[JoSan] Created custom word list with ${validWords.length} words`
      );
    } else {
      this.customWordList = null;
    }
  }

  getFilterSettings(): FilterSettings {
    return { ...this.filterSettings };
  }

  getWordLists(): WordListSet {
    return { ...this.wordLists };
  }

  getCustomWordList(): WordListData | null {
    return this.customWordList;
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

  // Performance monitoring
  getMemoryUsage(): { totalBytes: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {};
    let totalBytes = 0;

    Object.entries(this.wordLists).forEach(([lang, wordList]) => {
      if (wordList) {
        const stats = ProfanityLoader.getStats(wordList);
        breakdown[lang] = stats.totalMemoryBytes;
        totalBytes += stats.totalMemoryBytes;
      }
    });

    if (this.customWordList) {
      const stats = ProfanityLoader.getStats(this.customWordList);
      breakdown.custom = stats.totalMemoryBytes;
      totalBytes += stats.totalMemoryBytes;
    }

    return { totalBytes, breakdown };
  }
}
