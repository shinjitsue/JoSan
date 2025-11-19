import { UsageTracker } from "./UsageTracker";

interface ModerationClassification {
  classification: "clean" | "mild" | "toxic";
  confidence: number;
  reason?: string;
}

interface CacheEntry {
  result: ModerationClassification;
  timestamp: number;
}

export class OpenAIService {
  private static readonly API_URL = "https://api.openai.com/v1/moderations";
  private static apiKey: string = "";
  private static isValidated: boolean = false;

  // Caching mechanism (same as before)
  private static cache = new Map<string, CacheEntry>();
  private static readonly CACHE_TTL = 5 * 60 * 1000;
  private static readonly MAX_CACHE_SIZE = 500;

  private static getCacheKey(text: string): string {
    return text.trim().toLowerCase().substring(0, 500);
  }

  private static cleanCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    });

    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const sortedEntries = entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, this.cache.size - this.MAX_CACHE_SIZE);

      sortedEntries.forEach(([key]) => this.cache.delete(key));
    }
  }

  static setApiKey(key: string): void {
    this.apiKey = key;
    this.isValidated = false;
  }

  static hasApiKey(): boolean {
    return this.apiKey.length > 0;
  }

  static async validateApiKey(): Promise<boolean> {
    if (!this.apiKey) return false;
    if (this.isValidated) return true;

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "omni-moderation-latest",
          input: "test content",
        }),
      });

      // Handle different response statuses
      if (response.ok) {
        this.isValidated = true;
        return true;
      } else if (response.status === 429) {
        // Rate limit exceeded - but API key is likely valid
        console.warn(
          "[JoSan AI] Rate limit exceeded during validation, but key appears valid"
        );
        this.isValidated = true; // Assume valid if we got rate limited
        return true;
      } else if (response.status === 401) {
        // Invalid API key
        console.error("[JoSan AI] Invalid API key");
        this.isValidated = false;
        return false;
      } else {
        // Other error - network issue, etc.
        console.error(`[JoSan AI] API validation error: ${response.status}`);
        this.isValidated = false;
        return false;
      }
    } catch (error) {
      console.error("[JoSan AI] Network error during validation:", error);
      return false;
    }
  }

  static async classifyText(
    text: string
  ): Promise<ModerationClassification | null> {
    if (!this.apiKey) {
      console.warn("[JoSan] OpenAI API key not configured");
      return null;
    }

    // Check cache first
    const cacheKey = this.getCacheKey(text);
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log("[JoSan AI] Using cached result");
      return cached.result;
    }

    // Check rate limit before making request
    const stats = await UsageTracker.getStats();
    if (UsageTracker.isRateLimitExceeded(stats.requestsThisMinute)) {
      console.warn(
        `[JoSan] Rate limit exceeded (${
          stats.requestsThisMinute
        }/${UsageTracker.getMinuteLimit()} per minute). Skipping AI check.`
      );
      return null;
    }

    try {
      await UsageTracker.incrementUsage();

      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "omni-moderation-latest",
          input: text.substring(0, 2000),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("[JoSan AI] Invalid API key");
          this.isValidated = false;
        } else if (response.status === 429) {
          console.error("[JoSan AI] Rate limit exceeded (429 from OpenAI API)");
          // Don't invalidate the key - just return null to skip this request
        } else {
          console.error(`[JoSan AI] API error: ${response.status}`);
        }
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.results[0];

      if (!result) {
        throw new Error("No response from OpenAI Moderation API");
      }

      // Map OpenAI categories to JoSan classification system
      let classification: "clean" | "mild" | "toxic" = "clean";
      let confidence = 0;
      let reason = "Content appears clean";

      if (result.flagged) {
        const scores = result.category_scores;
        const categories = result.categories;

        // Calculate maximum score for confidence
        const maxScore = Math.max(
          scores.hate || 0,
          scores["hate/threatening"] || 0,
          scores.harassment || 0,
          scores["harassment/threatening"] || 0,
          scores.violence || 0,
          scores["violence/graphic"] || 0,
          scores["self-harm"] || 0,
          scores["self-harm/intent"] || 0,
          scores["self-harm/instructions"] || 0,
          scores.sexual || 0,
          scores["sexual/minors"] || 0
        );

        confidence = maxScore;

        // Determine severity based on categories and scores
        if (
          categories["hate/threatening"] ||
          categories["harassment/threatening"] ||
          categories["violence"] ||
          categories["violence/graphic"] ||
          categories["sexual/minors"] ||
          maxScore > 0.8
        ) {
          classification = "toxic";
          reason = this.buildReason(categories, "high severity");
        } else if (
          categories.hate ||
          categories.harassment ||
          categories["self-harm"] ||
          categories.sexual ||
          maxScore > 0.3
        ) {
          // Determine if it's mild or toxic based on score threshold
          if (maxScore > 0.6) {
            classification = "toxic";
            reason = this.buildReason(categories, "moderate-high severity");
          } else {
            classification = "mild";
            reason = this.buildReason(categories, "moderate severity");
          }
        } else {
          // Low confidence flags - treat as mild
          classification = "mild";
          reason = this.buildReason(categories, "low severity");
        }
      }

      const moderationResult: ModerationClassification = {
        classification,
        confidence,
        reason,
      };

      // Cache the result
      this.cache.set(cacheKey, {
        result: moderationResult,
        timestamp: Date.now(),
      });
      this.cleanCache();

      console.log(
        `[JoSan AI] Classification: ${
          moderationResult.classification
        } (${moderationResult.confidence.toFixed(3)})`
      );
      return moderationResult;
    } catch (error) {
      console.error("[JoSan AI] Classification error:", error);
      return null;
    }
  }

  private static buildReason(
    categories: Record<string, boolean>,
    severity: string
  ): string {
    const flaggedCategories = Object.keys(categories).filter(
      (k) => categories[k]
    );
    if (flaggedCategories.length === 0) return `Flagged content (${severity})`;

    // Map OpenAI categories to user-friendly names
    const categoryMap: Record<string, string> = {
      hate: "hate speech",
      "hate/threatening": "threatening hate speech",
      harassment: "harassment",
      "harassment/threatening": "threatening harassment",
      "self-harm": "self-harm content",
      "self-harm/intent": "self-harm intent",
      "self-harm/instructions": "self-harm instructions",
      sexual: "sexual content",
      "sexual/minors": "inappropriate sexual content",
      violence: "violence",
      "violence/graphic": "graphic violence",
    };

    const friendlyNames = flaggedCategories.map(
      (cat) => categoryMap[cat] || cat
    );
    return `Flagged: ${friendlyNames.join(", ")} (${severity})`;
  }

  static async batchClassify(
    texts: string[]
  ): Promise<Map<string, ModerationClassification>> {
    const results = new Map<string, ModerationClassification>();

    // Check cache first
    const uncachedTexts: string[] = [];
    texts.forEach((text) => {
      const cacheKey = this.getCacheKey(text);
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        results.set(text, cached.result);
      } else {
        uncachedTexts.push(text);
      }
    });

    if (uncachedTexts.length === 0) {
      console.log("[JoSan] All results from cache");
      return results;
    }

    // OpenAI Moderation API supports batch processing
    const stats = await UsageTracker.getStats();
    const remainingRequests =
      UsageTracker.getMinuteLimit() - stats.requestsThisMinute;

    if (remainingRequests <= 0) {
      console.warn("[JoSan] Rate limit exceeded. Batch processing skipped.");
      return results;
    }

    // Process in smaller batches to respect rate limits
    const maxBatchSize = Math.min(5, remainingRequests);

    for (let i = 0; i < uncachedTexts.length; i += maxBatchSize) {
      const batch = uncachedTexts.slice(i, i + maxBatchSize);
      const promises = batch.map(async (text) => {
        const result = await this.classifyText(text);
        if (result) {
          results.set(text, result);
        }
      });

      await Promise.all(promises);

      const updatedStats = await UsageTracker.getStats();
      if (UsageTracker.isRateLimitExceeded(updatedStats.requestsThisMinute)) {
        console.warn("[JoSan] Rate limit reached during batch processing");
        break;
      }
    }

    return results;
  }
}
