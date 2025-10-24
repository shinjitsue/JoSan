import { PlatformDetector } from "./utils/PlatformDetector";
import { ProfanityLoader } from "./utils/ProfanityLoader";
import { PrivacyFilter } from "./utils/PrivacyFilter";
import { StatisticsManager } from "./utils/StatisticsManager";
import { GroqService } from "./utils/GroqService";
import { FEED_SELECTORS } from "./config/SelectorConfig";

interface FilterSettings {
  useAI: boolean;
  filterMild: boolean;
  filterToxic: boolean;
}

export class FilterProcessor {
  // State properties
  private profanitySet: Set<string> = new Set();
  private profanityRegex: RegExp | null = null;
  private isEnabled = true;
  private isInitialized = false;
  private enabledPlatforms: string[] = [];
  private currentPlatform = "";
  private statsManager = new StatisticsManager();
  private filterSettings: FilterSettings = {
    useAI: false,
    filterMild: false,
    filterToxic: true,
  };
  private readonly MIN_TEXT_LENGTH = 10;

  // Track processed nodes to avoid reprocessing
  private processedNodes = new WeakSet<Node>();

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
        useAI: false,
        filterMild: false,
        filterToxic: true,
        groqApiKey: "",
      });

      this.isEnabled = result.enabled;
      this.statsManager.loadStats(result.stats);
      this.enabledPlatforms = result.enabledPlatforms;
      this.filterSettings = {
        useAI: result.useAI,
        filterMild: result.filterMild,
        filterToxic: result.filterToxic,
      };

      // Configure Groq API
      if (result.groqApiKey) {
        GroqService.setApiKey(result.groqApiKey);
        console.log("[JoSan] Groq API configured");
      }

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
      console.log(
        `[JoSan] AI filtering: ${
          this.filterSettings.useAI ? "enabled" : "disabled"
        }`
      );
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
      if (this.processedNodes.has(node)) {
        return; // Skip already processed nodes
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue || "";
        if (text.trim().length > 5) {
          console.log(
            `[JoSan] Processing text node: "${text.substring(0, 50)}..."`
          );
        }
        this.filterTextNode(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const tagName = element.tagName.toLowerCase();

        if (tagName === "script" || tagName === "style") return;
        if (PrivacyFilter.isPrivateContent(element)) {
          console.log("[JoSan] Skipping private content");
          return;
        }

        element.childNodes.forEach((child) => {
          this.processNode(child);
        });
      }

      this.processedNodes.add(node);
    } catch (error) {
      console.error("[JoSan] Error processing node:", error);
    }
  }

  // Heuristic to skip unnecessary AI checks
  private shouldSkipAICheck(text: string): boolean {
    // Skip if too short (likely not meaningful)
    if (text.length < this.MIN_TEXT_LENGTH) return true;

    // Skip if mostly emojis/special chars (not worth AI check)
    const alphanumericRatio =
      (text.match(/[a-zA-Z0-9]/g) || []).length / text.length;
    if (alphanumericRatio < 0.3) return true;

    // Skip if URL-heavy
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urlMatches = text.match(urlPattern) || [];
    if (urlMatches.length > 2 || urlMatches.join("").length > text.length * 0.5)
      return true;

    return false;
  }

  // Two-stage filtering: Regex → AI
  private async filterTextNode(textNode: Node): Promise<void> {
    if (!this.profanityRegex) return;

    try {
      const originalText = textNode.nodeValue || "";
      if (!originalText.trim() || originalText.length < 3) return;

      // Stage 1: Fast regex check
      const regexMatches = originalText.match(this.profanityRegex);

      if (regexMatches) {
        // Found profanity via regex

        if (this.filterSettings.useAI) {
          // Check if text is worth AI processing
          if (this.shouldSkipAICheck(originalText)) {
            console.log("[JoSan] Skipping AI check (low-value text)");
            this.applyRegexFilter(textNode, originalText, regexMatches);
            return;
          }

          // Stage 2: AI context check for flagged content
          console.log("[JoSan] Suspicious text found, checking with AI...");
          const classification = await GroqService.classifyText(originalText);

          if (classification) {
            this.applyFilterByClassification(
              textNode,
              originalText,
              classification
            );
          } else {
            // AI failed, fall back to regex filtering
            this.applyRegexFilter(textNode, originalText, regexMatches);
          }
        } else {
          // AI disabled, use regex only
          this.applyRegexFilter(textNode, originalText, regexMatches);
        }
      }
    } catch (error) {
      console.error("[JoSan] Error filtering text:", error);
    }
  }

  // Apply filter based on AI classification
  private applyFilterByClassification(
    textNode: Node,
    originalText: string,
    classification: {
      classification: string;
      confidence: number;
      reason?: string;
    }
  ): void {
    const { classification: level, confidence, reason } = classification;

    console.log(
      `[JoSan AI] Text classified as "${level}" (confidence: ${confidence})`
    );

    let shouldFilter = false;

    if (level === "toxic" && this.filterSettings.filterToxic) {
      shouldFilter = true;
    } else if (level === "mild" && this.filterSettings.filterMild) {
      shouldFilter = true;
    }

    if (shouldFilter) {
      // Create a wrapper element for visual feedback
      const parent = textNode.parentElement;
      if (parent) {
        const wrapper = document.createElement("span");
        wrapper.style.cssText = this.getFilterStyle(level);
        wrapper.textContent = this.getFilteredText(originalText, level);
        wrapper.title = `Filtered: ${level} content${
          reason ? ` - ${reason}` : ""
        }`;

        parent.replaceChild(wrapper, textNode);

        this.statsManager.incrementBlockedWords(1);
        console.log(`[JoSan AI] Filtered ${level} content`);
      }
    } else {
      console.log(`[JoSan AI] Content classified as "${level}", not filtering`);
    }
  }

  // Apply regex-based filtering (fallback)
  private applyRegexFilter(
    textNode: Node,
    originalText: string,
    matches: RegExpMatchArray
  ): void {
    if (!this.profanityRegex) return;

    const filteredText = originalText.replace(this.profanityRegex, (match) =>
      "*".repeat(match.length)
    );

    textNode.nodeValue = filteredText;
    this.statsManager.incrementBlockedWords(matches.length);

    console.log(`[JoSan] Blocked ${matches.length} word(s) via regex`);
  }

  // Get filtered text based on severity
  private getFilteredText(text: string, level: string): string {
    if (level === "toxic") {
      return "[Content Hidden: Toxic]";
    } else if (level === "mild") {
      return "[Content Filtered: Mild]";
    }
    return text;
  }

  // Get visual style based on severity
  private getFilterStyle(level: string): string {
    if (level === "toxic") {
      return "background-color: #fee; color: #c00; padding: 2px 6px; border-radius: 4px; font-weight: 500;";
    } else if (level === "mild") {
      return "background-color: #fef3cd; color: #856404; padding: 2px 6px; border-radius: 4px;";
    }
    return "";
  }

  // Legacy method for compatibility
  filterText(textNode: Node): void {
    this.filterTextNode(textNode);
  }

  // State Update Methods
  updateFilterState(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`[JoSan] Filter state updated: ${enabled}`);
  }

  getStats() {
    return this.statsManager.getStats();
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
