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
  bisaya: RegExp | null;
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

  private approvedNodes = new WeakSet<Node>();
  private recentTextHashes = new Set<string>();
  private activeAiRequests = new Map<Node, string>();

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
    bisaya: null,
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

  private hashText(text: string): string {
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
    return h.toString(36);
  }

  private async filterTextNode(textNode: Node): Promise<void> {
    try {
      if (!textNode.nodeValue) return;
      // Skip nodes already approved clean
      if (this.approvedNodes.has(textNode)) return;
      // Skip while analyzing placeholder
      if (textNode.nodeValue.startsWith("[Analyzing ")) return;

      const originalTextUntrimmed = textNode.nodeValue;
      const originalText = originalTextUntrimmed.trim();
      if (!FilterEngine.shouldProcessText(originalText)) return;

      const textHash = this.hashText(originalText);
      // If we have seen this exact text and previously approved clean -> skip
      if (
        this.recentTextHashes.has(textHash) &&
        this.approvedNodes.has(textNode)
      ) {
        return;
      }

      const analysis = FilterEngine.analyzeText(originalText, this.regexes);
      if (analysis.regexResult.matchCount === 0) return;

      // If AI disabled or not needed -> normal regex path
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
        analysis.regexResult.matchCount,
        originalTextUntrimmed
      );
    } catch (error) {
      console.error("[JoSan] Filter processing error:", error);
    }
  }

  private async processWithAI(
    textNode: Node,
    originalText: string,
    language: Language,
    regexMatches: number,
    originalTextUntrimmed?: string
  ): Promise<void> {
    const fullOriginal = originalTextUntrimmed ?? originalText;

    // Guard: if already approved skip entirely
    if (this.approvedNodes.has(textNode)) return;

    // Register AI request id
    const requestId = `req_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    this.activeAiRequests.set(textNode, requestId);

    this.domProcessor.setPlaceholder(textNode, language);

    try {
      const aiResult = await this.contentAIProxy.processWithAI(
        textNode,
        originalText,
        language,
        regexMatches
      );

      // Ignore stale result (another newer request started meanwhile)
      if (this.activeAiRequests.get(textNode) !== requestId) {
        return;
      }
      this.activeAiRequests.delete(textNode);

      if (!aiResult || aiResult.action === "error") {
        console.warn("[JoSan] AI processing failed:", aiResult?.reason);

        const isContextualSingle =
          regexMatches === 1 &&
          (language.code === "mixed" || language.confidence < 0.6) &&
          originalText.length > 40;

        if (isContextualSingle) {
          this.domProcessor.restoreOriginalText(textNode, fullOriginal);
          // Mark as approved (clean by fallback) to prevent loops
          this.approvedNodes.add(textNode);
          this.recentTextHashes.add(this.hashText(originalText));
          return;
        }

        const regexResult = FastLanguageDetector.applyMultiLangFilter(
          originalText,
          {
            en: this.regexes.english,
            tl: this.regexes.tagalog,
            bis: this.regexes.bisaya,
          }
        );

        if (regexResult.matchCount > 0) {
          this.domProcessor.applyRegexFilter(textNode, regexResult, language);
          this.statsManager.incrementBlockedWords(regexResult.matchCount);
        } else {
          this.domProcessor.restoreOriginalText(textNode, fullOriginal);
          this.approvedNodes.add(textNode);
          this.recentTextHashes.add(this.hashText(originalText));
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
        // Clean or keep -> restore original and mark approved
        this.domProcessor.restoreOriginalText(textNode, fullOriginal);
        this.approvedNodes.add(textNode);
        this.recentTextHashes.add(this.hashText(originalText));
        console.log(
          `[JoSan AI] Content approved: ${aiResult.classification} (${aiResult.reason})`
        );
      }
    } catch (error) {
      console.error("[JoSan AI] Background processing error:", error);
      this.domProcessor.restoreOriginalText(textNode, fullOriginal);
      this.approvedNodes.add(textNode);
      this.recentTextHashes.add(this.hashText(originalText));
    } finally {
      // Final safety: if still placeholder (race) restore
      if (textNode.nodeValue?.startsWith("[Analyzing ")) {
        this.domProcessor.restoreOriginalText(textNode, fullOriginal);
        this.approvedNodes.add(textNode);
        this.recentTextHashes.add(this.hashText(originalText));
      }
    }
  }
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
    // Do not invalidate nodes already approved clean
    if (this.approvedNodes.has(node)) return;
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
