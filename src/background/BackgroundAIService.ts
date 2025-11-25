import { UsageTracker } from "../content/utils/UsageTracker";

interface AIProcessingRequest {
  id: string;
  text: string;
  language: { code: string; confidence: number };
  regexMatches: number;
  timestamp: number;
}

interface AIProcessingResponse {
  id: string;
  action: "filter" | "keep" | "error";
  classification?: string;
  confidence?: number;
  language?: string;
  reason?: string;
}

interface OmniModerationResult {
  classification: "clean" | "mild" | "toxic" | "ambiguous";
  confidence: number;
  needsContextualCheck: boolean;
  categories?: string[];
}

interface ContextualResult {
  classification: "clean" | "mild" | "toxic";
  confidence: number;
  reason: string;
}

interface OpenAIModerationData {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface LanguageContext {
  en: string;
  tl: string;
  bis: string;
  mixed: string;
}

export class BackgroundAIService {
  private static processingQueue: Map<
    string,
    (response: AIProcessingResponse) => void
  > = new Map();
  private static batchTimeout: NodeJS.Timeout | null = null;
  private static pendingBatch: AIProcessingRequest[] = [];
  private static apiKey: string = "";
  private static resultCache: Map<
    string,
    { result: AIProcessingResponse; timestamp: number }
  > = new Map();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 1000;
  private static readonly BATCH_SIZE = 5;
  private static readonly BATCH_TIMEOUT = 100; // ms
  private static consecutiveFailures = 0;
  private static cooldownUntil = 0;
  private static readonly FAILURE_THRESHOLD = 5;
  private static readonly COOLDOWN_MS = 5_000;

  static setApiKey(key: string): void {
    this.apiKey = key;
  }

  static async processText(
    request: AIProcessingRequest
  ): Promise<AIProcessingResponse> {
    if (Date.now() < this.cooldownUntil) {
      return {
        id: request.id,
        action: "error",
        reason: "AI temporarily cooling down after repeated failures",
      };
    }
    return new Promise((resolve) => {
      // Check cache first
      const cacheKey = this.getCacheKey(request.text, request.language.code);
      const cached = this.resultCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log("[JoSan AI] Cache hit for request");
        resolve({ ...cached.result, id: request.id });
        return;
      }

      this.processingQueue.set(request.id, resolve);
      this.pendingBatch.push(request);

      // Clear existing timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      // Process immediately if batch is full, otherwise wait for timeout
      if (this.pendingBatch.length >= this.BATCH_SIZE) {
        this.processBatch();
      } else {
        this.batchTimeout = setTimeout(
          () => this.processBatch(),
          this.BATCH_TIMEOUT
        );
      }
    });
  }

  private static async processBatch(): Promise<void> {
    if (this.pendingBatch.length === 0) return;

    const batch = [...this.pendingBatch];
    this.pendingBatch = [];
    this.batchTimeout = null;

    console.log(`[JoSan AI] Processing batch of ${batch.length} requests`);

    // Group by language for better processing
    const languageGroups = this.groupByLanguage(batch);

    // Process each language group in parallel
    const results = await Promise.allSettled(
      Object.entries(languageGroups).map(([languageCode, requests]) =>
        this.processLanguageGroup(languageCode, requests)
      )
    );

    // Handle results and notify callbacks
    results.forEach((result, groupIndex) => {
      const [, requests] = Object.entries(languageGroups)[groupIndex];

      if (result.status === "fulfilled") {
        result.value.forEach((response, requestIndex) => {
          const request = requests[requestIndex];
          const callback = this.processingQueue.get(request.id);
          if (callback) {
            callback(response);
            this.processingQueue.delete(request.id);

            // Cache successful results
            if (response.action !== "error") {
              this.cacheResult(request.text, request.language.code, response);
            }
          }
        });
      } else {
        // Handle failed group
        requests.forEach((request) => {
          const callback = this.processingQueue.get(request.id);
          if (callback) {
            callback({ id: request.id, action: "error" });
            this.processingQueue.delete(request.id);
          }
        });
      }
    });

    this.cleanCache();
  }

  private static groupByLanguage(
    requests: AIProcessingRequest[]
  ): Record<string, AIProcessingRequest[]> {
    const groups: Record<string, AIProcessingRequest[]> = {};

    requests.forEach((request) => {
      const lang = request.language.code;
      if (!groups[lang]) {
        groups[lang] = [];
      }
      groups[lang].push(request);
    });

    return groups;
  }

  private static async processLanguageGroup(
    language: string,
    requests: AIProcessingRequest[]
  ): Promise<AIProcessingResponse[]> {
    console.log(
      `[JoSan AI] Processing language group "${language}" (${requests.length} request(s))`
    );
    const results: AIProcessingResponse[] = [];

    for (const request of requests) {
      try {
        const result = await this.processSingleRequest(request);
        results.push(result);

        // Small delay between requests to respect rate limits
        if (requests.indexOf(request) < requests.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      } catch (error) {
        console.error(
          `[JoSan AI] Error processing request ${request.id}:`,
          error
        );
        results.push({ id: request.id, action: "error" });
      }
    }

    return results;
  }

  private static async processSingleRequest(
    request: AIProcessingRequest
  ): Promise<AIProcessingResponse> {
    try {
      // Step 1: Quick heuristics to skip obvious cases
      if (
        this.shouldSkipAI(request.text, request.regexMatches, request.language)
      ) {
        return {
          id: request.id,
          action: "filter",
          classification: "toxic",
          confidence: 0.8,
          reason: "High-confidence regex match",
        };
      }

      // Step 2: Use omni-moderation-latest
      const omniResult = await this.omniModerationCheck(request.text);

      // Step 3: Use gpt-5-mini for ambiguous cases only
      let finalResult = omniResult;
      if (
        omniResult.needsContextualCheck &&
        this.shouldUseContextualCheck(request)
      ) {
        const contextualResult = await this.contextualCheck(
          request.text,
          request.language,
          omniResult
        );
        finalResult = {
          ...contextualResult,
          needsContextualCheck: false,
        };
      }

      // Step 4: Determine action based on user settings
      const shouldFilter = await this.shouldFilterBasedOnSettings(
        finalResult.classification
      );

      this.consecutiveFailures = 0;

      return {
        id: request.id,
        action: shouldFilter ? "filter" : "keep",
        classification: finalResult.classification,
        confidence: finalResult.confidence,
        language: request.language.code,
        reason: `${request.language.code.toUpperCase()}: ${
          finalResult.classification
        }`,
      };
    } catch (error) {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
        this.cooldownUntil = Date.now() + this.COOLDOWN_MS;
        console.warn(
          `[JoSan AI] Entering cooldown ${this.COOLDOWN_MS / 1000}s (failures=${
            this.consecutiveFailures
          })`
        );
      }
      return {
        id: request.id,
        action: "error",
        reason: (error as Error).message || "AI processing error",
      };
    }
  }

  private static shouldSkipAI(
    text: string,
    regexMatches: number,
    language: { code: string; confidence: number }
  ): boolean {
    if (text.length < 15) return true;
    if (regexMatches >= 3) return true; // Obviously profane
    if (language.confidence > 0.8 && regexMatches >= 2) return true;

    const alphanumericRatio =
      (text.match(/[a-zA-Z\u00C0-\u017F\u1E00-\u1EFF]/g) || []).length /
      text.length;
    if (alphanumericRatio < 0.3) return true;

    return false;
  }

  private static shouldUseContextualCheck(
    request: AIProcessingRequest
  ): boolean {
    return (
      request.text.length > 30 &&
      (request.language.code === "mixed" || request.language.confidence < 0.7)
    );
  }

  private static async omniModerationCheck(
    text: string
  ): Promise<OmniModerationResult> {
    try {
      // Rate limiting check
      const stats = await UsageTracker.getStats();
      if (UsageTracker.isRateLimitExceeded(stats.requestsThisMinute)) {
        throw new Error("Rate limit exceeded");
      }

      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: text.substring(0, 2000),
          model: "omni-moderation-latest",
        }),
      });

      if (!response.ok) {
        throw new Error(`Omni-moderation API error: ${response.status}`);
      }

      await UsageTracker.incrementUsage();
      const data = await response.json();
      const result = data.results?.[0] as OpenAIModerationData;

      if (!result) {
        throw new Error("No omni-moderation result");
      }

      return this.parseOmniResult(result);
    } catch (error) {
      console.error("[JoSan AI] Omni-moderation error:", error);
      throw error;
    }
  }

  private static parseOmniResult(
    omniData: OpenAIModerationData
  ): OmniModerationResult {
    const scores = omniData.category_scores || {};
    const categories = omniData.categories || {};

    const maxScore = Math.max(
      scores.hate || 0,
      scores["hate/threatening"] || 0,
      scores.harassment || 0,
      scores["harassment/threatening"] || 0,
      scores.violence || 0,
      scores["violence/graphic"] || 0,
      scores.sexual || 0,
      scores["sexual/minors"] || 0,
      scores["self-harm"] || 0,
      scores["self-harm/intent"] || 0,
      scores["self-harm/instructions"] || 0
    );

    let classification: "clean" | "mild" | "toxic" | "ambiguous" = "clean";
    let needsContextualCheck = false;

    if (omniData.flagged) {
      if (
        maxScore > 0.8 ||
        categories["hate/threatening"] ||
        categories["violence"] ||
        categories["sexual/minors"]
      ) {
        classification = "toxic";
      } else if (maxScore > 0.4) {
        classification = "ambiguous";
        needsContextualCheck = true;
      } else {
        classification = "mild";
      }
    } else {
      if (maxScore > 0.2) {
        classification = "ambiguous";
        needsContextualCheck = true;
      }
    }

    const flaggedCategories = Object.keys(categories).filter(
      (k) => categories[k]
    );

    return {
      classification,
      confidence: maxScore,
      needsContextualCheck,
      categories: flaggedCategories,
    };
  }

  private static async contextualCheck(
    text: string,
    language: { code: string; confidence: number },
    omniResult: OmniModerationResult
  ): Promise<ContextualResult> {
    try {
      const prompt = this.buildContextualPrompt(text, language, omniResult);

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-5-mini",
            messages: [
              { role: "system", content: prompt.system },
              { role: "user", content: prompt.user },
            ],
            max_tokens: 50,
            temperature: 0.1,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Contextual check API error: ${response.status}`);
      }

      await UsageTracker.incrementUsage();
      const data = (await response.json()) as OpenAIChatResponse;
      const gptResponse = data.choices[0]?.message?.content?.trim();

      if (!gptResponse) {
        throw new Error("No contextual analysis result");
      }

      return this.parseContextualResult(gptResponse, omniResult);
    } catch (error) {
      console.error("[JoSan AI] Contextual check error:", error);
      return {
        classification:
          omniResult.classification === "ambiguous"
            ? "mild"
            : (omniResult.classification as "clean" | "mild" | "toxic"),
        confidence: omniResult.confidence,
        reason: "Contextual check failed, using base result",
      };
    }
  }

  private static buildContextualPrompt(
    text: string,
    language: { code: string; confidence: number },
    omniResult: OmniModerationResult
  ): { system: string; user: string } {
    const languageContext: LanguageContext = {
      en: "English",
      tl: "Tagalog/Filipino - Consider cultural context, honorifics (po, opo), and indirect speech patterns",
      bis: "Bisaya - Consider regional expressions, cultural nuances, and local context",
      mixed: "Mixed languages - Analyze each language component",
    };

    const langName =
      languageContext[language.code as keyof LanguageContext] ||
      "Unknown language";

    return {
      system: `You are an expert content moderator for ${langName} content. Classify as CLEAN, MILD, or TOXIC only. Consider cultural context and intent. Respond with just the classification.`,
      user: `Text: "${text}"\nInitial assessment: ${
        omniResult.classification
      } (${omniResult.confidence.toFixed(2)})\nClassification:`,
    };
  }

  private static parseContextualResult(
    gptResponse: string,
    fallback: OmniModerationResult
  ): ContextualResult {
    const cleanResponse = gptResponse.toUpperCase().trim();

    if (cleanResponse.includes("TOXIC")) {
      return {
        classification: "toxic",
        confidence: 0.9,
        reason: "Contextually harmful",
      };
    } else if (cleanResponse.includes("MILD")) {
      return {
        classification: "mild",
        confidence: 0.7,
        reason: "Mildly inappropriate",
      };
    } else if (cleanResponse.includes("CLEAN")) {
      return {
        classification: "clean",
        confidence: 0.8,
        reason: "Contextually acceptable",
      };
    }

    return {
      classification:
        fallback.classification === "ambiguous"
          ? "mild"
          : (fallback.classification as "clean" | "mild" | "toxic"),
      confidence: fallback.confidence,
      reason: "Parsing failed, using fallback",
    };
  }

  private static async shouldFilterBasedOnSettings(
    classification: string
  ): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get({
        filterToxic: true,
        filterMild: false,
      });

      if (classification === "toxic" && result.filterToxic) return true;
      if (classification === "mild" && result.filterMild) return true;

      return false;
    } catch (error) {
      console.error("[JoSan AI] Error retrieving filter settings:", error);
      return classification === "toxic";
    }
  }

  // Cache management methods...
  private static getCacheKey(text: string, language: string): string {
    const normalized = text
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 200);
    return `${language}:${this.simpleHash(normalized)}`;
  }

  private static cacheResult(
    text: string,
    language: string,
    result: AIProcessingResponse
  ): void {
    const cacheKey = this.getCacheKey(text, language);
    this.resultCache.set(cacheKey, {
      result: { ...result, id: "" },
      timestamp: Date.now(),
    });
  }

  private static cleanCache(): void {
    if (this.resultCache.size <= this.MAX_CACHE_SIZE) return;

    const entries = Array.from(this.resultCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.resultCache.delete(entries[i][0]);
    }

    console.log(
      `[JoSan AI] Cache cleaned, ${this.resultCache.size} entries remaining`
    );
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
