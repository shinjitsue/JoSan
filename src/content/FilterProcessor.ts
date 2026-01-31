import { StatisticsManager } from "./utils/StatisticsManager";
import { SettingsManager } from "./filtering/SettingsManager";
import { ContentAIProxy } from "./filtering/ContentAIProxy";
import { DOMProcessor } from "./filtering/DOMProcessor";
import { FilterEngine } from "./filtering/FilterEngine";
import type { WordListData } from "./utils/ProfanityLoader";

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
    filterMode: "interactive",
  };
  private wordLists: WordListSet = {
    english: null,
    tagalog: null,
    bisaya: null,
  };
  private customWordList: WordListData | null = null;
  private currentPlatform = "";
  private enabledPlatforms: string[] = [];

  // Performance monitoring
  private performanceStats = {
    bloomChecks: 0,
    bloomTime: 0,
    trieChecks: 0,
    trieTime: 0,
    aiRequests: 0,
    totalProcessed: 0,
  };

  constructor() {
    console.log("[JoSan FilterProcessor] Enhanced Bloom+Trie instance created");
  }

  async loadSettings(): Promise<void> {
    try {
      const settings = await this.settingsManager.loadSettings();
      this.isEnabled = settings.isEnabled;
      this.filterSettings = settings.filterSettings;
      this.wordLists = settings.wordLists;
      this.customWordList = settings.customWordList;
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

      // Log memory usage
      const memUsage = this.settingsManager.getMemoryUsage();
      console.log(
        `[JoSan] Total memory usage: ${(memUsage.totalBytes / 1024).toFixed(
          1
        )}KB`
      );

      console.log(
        `[JoSan] AI enabled: ${this.filterSettings.useAI}, Filter mild: ${this.filterSettings.filterMild}, Filter toxic: ${this.filterSettings.filterToxic}`
      );
      // Set latency baseline timestamp right after settings are loaded/logged
      this.domProcessor.setStartTimestamp(performance.now());
      // Set filter mode for DOM processor
      this.domProcessor.setFilterMode(this.filterSettings.filterMode);
      console.log(`[JoSan] Filter mode: ${this.filterSettings.filterMode}`);
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

      this.performanceStats.totalProcessed++;

      const textHash = this.hashText(originalText);

      // If we have seen this exact text and previously approved clean -> skip
      if (
        this.recentTextHashes.has(textHash) &&
        this.approvedNodes.has(textNode)
      ) {
        return;
      }

      // Enhanced analysis with Bloom+Trie
      const startTime = performance.now();
      const analysis = FilterEngine.analyzeText(
        originalText,
        this.wordLists,
        this.customWordList
      );

      const analysisTime = performance.now() - startTime;
      this.performanceStats.bloomChecks++;
      this.performanceStats.bloomTime += analysisTime;

      // If no matches found, approve node as clean
      if (analysis.filterResult.matchCount === 0) {
        this.approvedNodes.add(textNode);
        this.recentTextHashes.add(textHash);
        return;
      }

      console.log(
        `[JoSan] Found ${
          analysis.filterResult.matchCount
        } matches in ${analysis.filterResult.detectedLanguages.join(
          ", "
        )} (${analysisTime.toFixed(2)}ms)`
      );

      // If AI disabled or not needed -> apply filtering directly
      if (!this.filterSettings.useAI || !analysis.needsAI) {
        this.domProcessor.applyRegexFilter(
          textNode,
          {
            filteredText: analysis.filterResult.filteredText,
            matchCount: analysis.filterResult.matchCount,
            detectedLanguages: analysis.filterResult.detectedLanguages,
          },
          analysis.language
        );
        this.statsManager.incrementBlockedWords(
          analysis.filterResult.matchCount
        );
        return;
      }

      // AI processing needed
      await this.processWithAI(
        textNode,
        originalText,
        analysis.language,
        analysis.filterResult.matchCount,
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
    matchCount: number,
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
    this.performanceStats.aiRequests++;

    // Immediately mask content (no "Analyzing" placeholder) while AI runs
    try {
      this.domProcessor.applyAIFilter(
        textNode,
        fullOriginal,
        {
          id: requestId,
          action: "filter",
          classification: "pending",
          confidence: 1,
          language: language.code,
          reason: "Pending AI analysis",
        },
        language
      );
    } catch (e) {
      console.warn("[JoSan] Failed to set immediate mask:", e);
    }

    try {
      const aiResult = await this.contentAIProxy.processWithAI(
        textNode,
        originalText,
        language,
        matchCount
      );

      // Ignore stale result (another newer request started meanwhile)
      if (this.activeAiRequests.get(textNode) !== requestId) {
        return;
      }
      this.activeAiRequests.delete(textNode);

      if (!aiResult || aiResult.action === "error") {
        console.warn("[JoSan] AI processing failed:", aiResult?.reason);

        const isContextualSingle =
          matchCount === 1 &&
          (language.code === "mixed" || language.confidence < 0.6) &&
          originalText.length > 40;

        if (isContextualSingle) {
          this.domProcessor.restoreOriginalText(textNode, fullOriginal);
          this.approvedNodes.add(textNode);
          this.recentTextHashes.add(this.hashText(originalText));
          return;
        }

        // Fallback to Bloom+Trie filtering
        const fallbackResult = FilterEngine.analyzeText(
          originalText,
          this.wordLists,
          this.customWordList
        );

        if (fallbackResult.filterResult.matchCount > 0) {
          // Keep the immediate masked element; update it to strict/interactive generic
          this.domProcessor.applyAIFilter(
            textNode,
            fullOriginal,
            {
              id: requestId,
              action: "filter",
              classification: "mild", // fallback to a safe label
              confidence: 0.5,
              language: language.code,
              reason: "Regex fallback",
            },
            language
          );
          this.statsManager.incrementBlockedWords(
            fallbackResult.filterResult.matchCount
          );
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
          fullOriginal,
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
      `[JoSan] Processing enhanced page on ${this.currentPlatform}...`
    );
    this.statsManager.incrementPagesScanned();

    const startTime = performance.now();
    await this.domProcessor.processPage(
      this.enabledPlatforms,
      this.currentPlatform,
      this.filterTextNode.bind(this)
    );
    const processTime = performance.now() - startTime;

    console.log(`[JoSan] Page processed in ${processTime.toFixed(2)}ms`);
    this.logPerformanceStats();
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

  private logPerformanceStats(): void {
    const stats = this.performanceStats;
    if (stats.totalProcessed === 0) return;

    const avgBloomTime = stats.bloomTime / stats.bloomChecks;
    const avgTrieTime =
      stats.trieChecks > 0 ? stats.trieTime / stats.trieChecks : 0;

    console.log(`[JoSan Performance] Processed ${stats.totalProcessed} nodes:`);
    console.log(
      `  Bloom checks: ${stats.bloomChecks} (${avgBloomTime.toFixed(2)}ms avg)`
    );
    console.log(
      `  Trie checks: ${stats.trieChecks} (${avgTrieTime.toFixed(2)}ms avg)`
    );
    console.log(`  AI requests: ${stats.aiRequests}`);
  }

  getPerformanceStats() {
    return { ...this.performanceStats };
  }

  cleanup(): void {
    this.domProcessor.cleanup();
    this.contentAIProxy.cleanup();

    // Reset performance stats
    this.performanceStats = {
      bloomChecks: 0,
      bloomTime: 0,
      trieChecks: 0,
      trieTime: 0,
      aiRequests: 0,
      totalProcessed: 0,
    };
  }
}
