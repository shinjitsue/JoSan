import { PlatformDetector } from "./utils/PlatformDetector";
import { ProfanityLoader } from "./utils/ProfanityLoader";
import { PrivacyFilter } from "./utils/PrivacyFilter";
import { StatisticsManager } from "./utils/StatisticsManager";
import { FEED_SELECTORS } from "./config/SelectorConfig";

export class FilterProcessor {
  // State properties
  private profanitySet: Set<string> = new Set();
  private profanityRegex: RegExp | null = null;
  private isEnabled = true;
  private isInitialized = false;
  private enabledPlatforms: string[] = [];
  private currentPlatform = "";
  private statsManager = new StatisticsManager();

  constructor() {
    console.log("[JoSan FilterProcessor] Instance created");
  }

  // Initialization & Configuration
  async loadSettings(): Promise<void> {
    try {
      console.log("[JoSan] Loading settings...");

      // Load profanity list
      this.profanitySet = await ProfanityLoader.loadWordList();
      console.log(
        `[JoSan] Loaded ${this.profanitySet.size} base profanity words`
      );

      // Load settings from storage
      const result = await chrome.storage.local.get({
        enabled: true,
        customWords: [] as string[],
        stats: { blockedWords: 0, pagesScanned: 0, lastScan: "" },
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
      });

      this.isEnabled = result.enabled;
      this.statsManager.loadStats(result.stats);
      this.enabledPlatforms = result.enabledPlatforms;

      // Detect current platform
      this.currentPlatform = PlatformDetector.detect();
      console.log(`[JoSan] Current platform: ${this.currentPlatform}`);

      // Check if current platform is enabled
      if (!this.enabledPlatforms.includes(this.currentPlatform)) {
        console.log(
          `[JoSan] Platform '${this.currentPlatform}' is disabled. Filter will not run.`
        );
        this.isEnabled = false;
        this.isInitialized = true;
        return;
      }

      // Add custom words
      if (result.customWords && result.customWords.length > 0) {
        result.customWords.forEach((w: string) =>
          this.profanitySet.add(w.toLowerCase())
        );
        console.log(`[JoSan] Added ${result.customWords.length} custom words`);
      }

      // Compile regex
      this.profanityRegex = ProfanityLoader.compileRegex(this.profanitySet);
      this.isInitialized = true;

      console.log(
        `[JoSan] Loaded ${this.profanitySet.size} total profanity words for ${this.currentPlatform}`
      );
      console.log(`[JoSan] Filter enabled: ${this.isEnabled}`);
    } catch (error) {
      console.error("[JoSan] Failed to load settings:", error);
      this.isInitialized = false;
    }
  }

  // State Getters
  isFilterEnabled(): boolean {
    return this.isEnabled && this.isInitialized;
  }

  // Main Processing Entry Point
  processPage(): void {
    if (!this.isEnabled || !this.isInitialized) {
      console.log(
        `[JoSan] Skipping page process - enabled: ${this.isEnabled}, initialized: ${this.isInitialized}`
      );
      return;
    }

    if (!chrome.runtime?.id) {
      console.warn(
        "[JoSan] Extension context invalidated, stopping processing"
      );
      return;
    }

    if (!this.enabledPlatforms.includes(this.currentPlatform)) {
      console.log(`[JoSan] Platform '${this.currentPlatform}' is disabled`);
      return;
    }

    console.log(`[JoSan] Processing page on ${this.currentPlatform}...`);

    this.statsManager.incrementPagesScanned();
    this.processFeedAreas();
  }

  // DOM Processing Methods
  private processFeedAreas(): void {
    try {
      const feedContainers = FEED_SELECTORS.map((selector) => {
        try {
          return Array.from(document.querySelectorAll(selector));
        } catch {
          return [];
        }
      }).flat();

      console.log(`[JoSan] Found ${feedContainers.length} feed containers`);

      if (feedContainers.length === 0) {
        console.log(
          "[JoSan] No feed containers found, processing body with exclusions"
        );
        this.processNodeSafely(document.body);
        return;
      }

      feedContainers.forEach((container) => {
        this.processNodeSafely(container);
      });

      console.log(`[JoSan] Processed ${feedContainers.length} feed containers`);
    } catch (error) {
      console.error("[JoSan] Error processing feed areas:", error);
    }
  }

  // Safe Node Processing with Privacy Checks
  private processNodeSafely(node: Node): void {
    try {
      if (PrivacyFilter.isPrivateContent(node)) {
        return;
      }
      this.processNode(node);
    } catch (error) {
      console.error("[JoSan] Error processing node safely:", error);
    }
  }

  // Recursive Node Processing
  processNode(node: Node): void {
    try {
      if (node.nodeType === Node.TEXT_NODE) {
        this.filterText(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        if (tagName === "script" || tagName === "style") return;
        if (PrivacyFilter.isPrivateContent(element)) return;

        element.childNodes.forEach((child) => {
          this.processNode(child);
        });
      }
    } catch (error) {
      console.error("[JoSan] Error processing node:", error);
    }
  }

  // Text Filtering Logic
  filterText(textNode: Node): void {
    if (!this.profanityRegex) return;

    try {
      const originalText = textNode.nodeValue || "";
      if (!originalText.trim()) return;

      const matches = originalText.match(this.profanityRegex);

      if (matches) {
        const filteredText = originalText.replace(
          this.profanityRegex,
          (match) => "*".repeat(match.length)
        );

        textNode.nodeValue = filteredText;
        this.statsManager.incrementBlockedWords(matches.length);

        console.log(`[JoSan] Blocked ${matches.length} word(s):`, matches);
      }
    } catch (error) {
      console.error("[JoSan] Error filtering text:", error);
    }
  }

  // State Update Methods
  updateFilterState(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`[JoSan] Filter state updated: ${enabled}`);
  }

  // Custom Word Management
  async addCustomWord(word: string): Promise<void> {
    const result = await chrome.storage.local.get({ customWords: [] });
    const customWords = [...result.customWords, word];

    await chrome.storage.local.set({ customWords });
    this.profanitySet.add(word.toLowerCase());
    this.profanityRegex = ProfanityLoader.compileRegex(this.profanitySet);
  }

  async removeCustomWord(word: string): Promise<void> {
    const result = await chrome.storage.local.get({ customWords: [] });
    const customWords = result.customWords.filter((w: string) => w !== word);

    await chrome.storage.local.set({ customWords });
    this.profanitySet.delete(word.toLowerCase());
    this.profanityRegex = ProfanityLoader.compileRegex(this.profanitySet);
  }
}
