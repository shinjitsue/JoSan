import { UsageTracker } from "./UsageTracker";

interface GroqClassification {
  classification: "clean" | "mild" | "toxic";
  confidence: number;
  reason?: string;
}

interface CacheEntry {
  result: GroqClassification;
  timestamp: number;
}

export class GroqService {
  private static readonly API_URL =
    "https://api.groq.com/openai/v1/chat/completions";
  private static apiKey: string = "";
  private static isValidated: boolean = false;

  // Caching mechanism
  private static cache = new Map<string, CacheEntry>();
  private static readonly CACHE_TTL = 5 * 60 * 1000;
  private static readonly MAX_CACHE_SIZE = 500;

  // Helper method to generate cache key
  private static getCacheKey(text: string): string {
    return text.trim().toLowerCase().substring(0, 200);
  }

  // Cache cleanup method
  private static cleanCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    });

    // If still too large, remove oldest entries
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

  // Validate API key before use
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
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "user",
              content: "test",
            },
          ],
          max_tokens: 5,
        }),
      });

      this.isValidated = response.ok;
      return this.isValidated;
    } catch {
      return false;
    }
  }

  static async classifyText(text: string): Promise<GroqClassification | null> {
    if (!this.apiKey) {
      console.warn("[JoSan] Groq API key not configured");
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
        `[JoSan] Rate limit exceeded (${stats.requestsThisMinute}/30 per minute). Skipping AI check.`
      );
      return null;
    }

    // Warn if approaching rate limit
    if (UsageTracker.isRateLimitApproaching(stats.requestsThisMinute)) {
      console.warn(
        `[JoSan] Approaching rate limit (${stats.requestsThisMinute}/30 per minute)`
      );
    }

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `Classify text as: clean, mild, toxic. Reply JSON only: {"classification":"clean|mild|toxic","confidence":0.0-1.0,"reason":"brief"}`,
            },
            {
              role: "user",
              content: text.substring(0, 200),
            },
          ],
          temperature: 0.1,
          max_tokens: 50,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("[JoSan AI] Invalid API key");
          this.isValidated = false;
        } else if (response.status === 429) {
          console.error("[JoSan AI] Rate limit exceeded (429 from Groq API)");
        }
        throw new Error(`Groq API error: ${response.status}`);
      }

      // Track successful API call
      await UsageTracker.incrementUsage();

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No response from Groq API");
      }

      // Parse JSON response
      const result = JSON.parse(content) as GroqClassification;

      // Cache the result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });
      this.cleanCache();

      console.log(
        `[JoSan AI] Classification: ${result.classification} (${result.confidence})`
      );
      return result;
    } catch (error) {
      console.error("[JoSan AI] Classification error:", error);
      return null;
    }
  }

  static async batchClassify(
    texts: string[]
  ): Promise<Map<string, GroqClassification>> {
    const results = new Map<string, GroqClassification>();

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

    // Respect per-minute rate limit
    const stats = await UsageTracker.getStats();
    const remainingRequests =
      UsageTracker["FREE_TIER_PER_MINUTE"] - stats.requestsThisMinute;

    if (remainingRequests <= 0) {
      console.warn("[JoSan] Rate limit exceeded. Batch processing skipped.");
      return results;
    }

    // Limit batch size to remaining requests
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

      // Check if we've hit the limit
      const updatedStats = await UsageTracker.getStats();
      if (UsageTracker.isRateLimitExceeded(updatedStats.requestsThisMinute)) {
        console.warn("[JoSan] Rate limit reached during batch processing");
        break;
      }
    }

    return results;
  }
}
