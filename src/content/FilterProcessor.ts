import { StatisticsManager } from "./utils/StatisticsManager";
import { FastLanguageDetector } from "./utils/FastLanguageDetector";
import { SettingsManager } from "./filtering/SettingsManager";
import { FilterEngine } from "./filtering/FilterEngine";
import { ContentAIProxy } from "./filtering/ContentAIProxy";
import { DOMProcessor } from "./filtering/DOMProcessor";

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

interface Language {
  code: string;
  name: string;
  confidence: number;
  scores: Record<string, number>;
}

export class FilterProcessor {
  private statsManager = new StatisticsManager();
  private settingsManager = new SettingsManager();
  private contentAIProxy = new ContentAIProxy();
  private domProcessor = new DOMProcessor();

  private isEnabled = true;
  private isInitialized = false;
  private filterSettings: FilterSettings = {
    useAI: false,
    filterMild: false,
    filterToxic: true,
  };
  private regexes: RegexSet = {
    english: null,
    tagalog: null,
    cebuano: null,
  };
  private currentPlatform = "";
  private enabledPlatforms: string[] = [];

  constructor() {
    console.log("[JoSan FilterProcessor] Optimized instance created");
  }

  async loadSettings(): Promise<void> {
    try {
      const settings = await this.settingsManager.loadSettings();
      this.isEnabled = settings.isEnabled;
      this.filterSettings = settings.filterSettings;
      this.regexes = settings.regexes;
      this.currentPlatform = settings.currentPlatform;
      this.enabledPlatforms = settings.isPlatformEnabled
        ? [settings.currentPlatform]
        : [];

      const result = await chrome.storage.local.get({
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

      this.statsManager.loadStats(result.stats);
      this.enabledPlatforms = result.enabledPlatforms;
      this.isInitialized = true;

      console.log(
        `[JoSan] AI enabled: ${this.filterSettings.useAI}, Filter mild: ${this.filterSettings.filterMild}, Filter toxic: ${this.filterSettings.filterToxic}`
      );
    } catch (error) {
      console.error("[JoSan] Failed to load settings:", error);
    }
  }

  // Main text filtering pipeline
  private async filterTextNode(textNode: Node): Promise<void> {
    try {
      if (!textNode.nodeValue) return;
      const originalText = textNode.nodeValue.trim();
      if (!FilterEngine.shouldProcessText(originalText)) return;

      const analysis = FilterEngine.analyzeText(originalText, this.regexes);
      if (analysis.regexResult.matchCount === 0) return;

      if (!this.filterSettings.useAI || !analysis.needsAI) {
        this.domProcessor.applyRegexFilter(
          textNode,
          analysis.regexResult,
          analysis.language
        );
        this.statsManager.incrementBlockedWords(
          analysis.regexResult.matchCount
        );
        return;
      }

      await this.processWithAI(
        textNode,
        originalText,
        analysis.language,
        analysis.regexResult.matchCount
      );
    } catch (error) {
      console.error("[JoSan] Filter processing error:", error);
    }
  }

  private async processWithAI(
    textNode: Node,
    originalText: string,
    language: Language,
    regexMatches: number
  ): Promise<void> {
    const originalNodeValue = this.domProcessor.setPlaceholder(
      textNode,
      language
    );

    try {
      const aiResult = await this.contentAIProxy.processWithAI(
        textNode,
        originalText,
        language,
        regexMatches
      );

      if (!aiResult || aiResult.action === "error") {
        console.warn("[JoSan] AI processing failed:", aiResult?.reason);
        const regexResult = FastLanguageDetector.applyMultiLangFilter(
          originalText,
          {
            en: this.regexes.english,
            tl: this.regexes.tagalog,
            ceb: this.regexes.cebuano,
          }
        );

        if (regexResult.matchCount > 0) {
          this.domProcessor.applyRegexFilter(textNode, regexResult, language);
          this.statsManager.incrementBlockedWords(regexResult.matchCount);
        } else {
          this.domProcessor.restoreOriginalText(textNode, originalNodeValue);
        }
        return;
      }

      if (aiResult.action === "filter") {
        this.domProcessor.applyAIFilter(
          textNode,
          originalText,
          aiResult,
          language
        );
        this.statsManager.incrementBlockedWords(1);
      } else {
        this.domProcessor.restoreOriginalText(textNode, originalNodeValue);
        console.log(
          `[JoSan AI] Content approved: ${aiResult.classification} (${aiResult.reason})`
        );
      }
    } catch (error) {
      console.error("[JoSan AI] Background processing error:", error);
      this.domProcessor.restoreOriginalText(textNode, originalNodeValue);
    }
  }

  // Public API
  isFilterEnabled(): boolean {
    return this.isEnabled && this.isInitialized;
  }

  async processPage(): Promise<void> {
    if (!this.isEnabled || !this.isInitialized) return;
    if (!chrome.runtime?.id) return;

    console.log(
      `[JoSan] Processing optimized page on ${this.currentPlatform}...`
    );
    this.statsManager.incrementPagesScanned();

    await this.domProcessor.processPage(
      this.enabledPlatforms,
      this.currentPlatform,
      this.filterTextNode.bind(this)
    );
  }

  async processNode(node: Node): Promise<void> {
    await this.domProcessor.processNode(node, this.filterTextNode.bind(this));
  }

  updateFilterState(enabled: boolean): void {
    this.isEnabled = enabled;
    this.settingsManager.updateFilterState(enabled);
  }

  invalidateNode(node: Node): void {
    this.domProcessor.invalidate(node);
  }

  getStats() {
    return this.statsManager.getStats();
  }

  cleanup(): void {
    this.domProcessor.cleanup();
    this.contentAIProxy.cleanup();
  }
}
