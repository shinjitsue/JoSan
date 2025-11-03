interface UsageStats {
  totalRequests: number;
  requestsToday: number;
  lastResetDate: string;
  requestHistory: { date: string; count: number }[];
  requestsThisMinute: number;
  lastMinuteReset: string;
}

export class UsageTracker {
  private static readonly STORAGE_KEY = "groqUsageStats";
  private static readonly FREE_TIER_DAILY_LIMIT = 14400;
  private static readonly FREE_TIER_PER_MINUTE = 30;

  static async getStats(): Promise<UsageStats> {
    const result = await chrome.storage.local.get({
      [this.STORAGE_KEY]: {
        totalRequests: 0,
        requestsToday: 0,
        lastResetDate: new Date().toISOString().split("T")[0],
        requestHistory: [],
        requestsThisMinute: 0,
        lastMinuteReset: new Date().toISOString().slice(0, 16), //  (YYYY-MM-DDTHH:MM)
      },
    });

    const stats = result[this.STORAGE_KEY];

    // Reset daily count if it's a new day
    const today = new Date().toISOString().split("T")[0];
    if (stats.lastResetDate !== today) {
      // Archive yesterday's count
      if (stats.requestsToday > 0) {
        stats.requestHistory.push({
          date: stats.lastResetDate,
          count: stats.requestsToday,
        });

        // Keep only last 30 days
        if (stats.requestHistory.length > 30) {
          stats.requestHistory = stats.requestHistory.slice(-30);
        }
      }

      stats.requestsToday = 0;
      stats.lastResetDate = today;
      await chrome.storage.local.set({ [this.STORAGE_KEY]: stats });
    }

    // Reset per-minute count if it's a new minute
    const currentMinute = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
    if (stats.lastMinuteReset !== currentMinute) {
      stats.requestsThisMinute = 0;
      stats.lastMinuteReset = currentMinute;
      await chrome.storage.local.set({ [this.STORAGE_KEY]: stats });
    }

    return stats;
  }

  static async incrementUsage(): Promise<void> {
    const result = await chrome.storage.local.get([this.STORAGE_KEY]);
    const stats = result[this.STORAGE_KEY] || {
      totalRequests: 0,
      requestsToday: 0,
      lastResetDate: new Date().toISOString().split("T")[0],
      requestHistory: [],
      requestsThisMinute: 0,
      lastMinuteReset: new Date().toISOString().slice(0, 16),
    };

    // Check and reset if needed
    const today = new Date().toISOString().split("T")[0];
    if (stats.lastResetDate !== today) {
      if (stats.requestsToday > 0) {
        stats.requestHistory.push({
          date: stats.lastResetDate,
          count: stats.requestsToday,
        });
        if (stats.requestHistory.length > 30) {
          stats.requestHistory = stats.requestHistory.slice(-30);
        }
      }
      stats.requestsToday = 0;
      stats.lastResetDate = today;
    }

    const currentMinute = new Date().toISOString().slice(0, 16);
    if (stats.lastMinuteReset !== currentMinute) {
      stats.requestsThisMinute = 0;
      stats.lastMinuteReset = currentMinute;
    }

    // Increment counters
    stats.totalRequests += 1;
    stats.requestsToday += 1;
    stats.requestsThisMinute += 1;

    // Write atomically
    await chrome.storage.local.set({ [this.STORAGE_KEY]: stats });
  }

  static async resetStats(): Promise<void> {
    const emptyStats: UsageStats = {
      totalRequests: 0,
      requestsToday: 0,
      lastResetDate: new Date().toISOString().split("T")[0],
      requestHistory: [],
      requestsThisMinute: 0,
      lastMinuteReset: new Date().toISOString().slice(0, 16),
    };
    await chrome.storage.local.set({ [this.STORAGE_KEY]: emptyStats });
  }

  static getDailyLimitPercentage(requestsToday: number): number {
    return (requestsToday / this.FREE_TIER_DAILY_LIMIT) * 100;
  }

  // : Get per-minute limit percentage
  static getMinuteLimitPercentage(requestsThisMinute: number): number {
    return (requestsThisMinute / this.FREE_TIER_PER_MINUTE) * 100;
  }

  static getWarningLevel(
    requestsToday: number
  ): "safe" | "warning" | "critical" {
    const percentage = this.getDailyLimitPercentage(requestsToday);
    if (percentage >= 90) return "critical";
    if (percentage >= 70) return "warning";
    return "safe";
  }

  // : Get per-minute warning level
  static getMinuteWarningLevel(
    requestsThisMinute: number
  ): "safe" | "warning" | "critical" {
    const percentage = this.getMinuteLimitPercentage(requestsThisMinute);
    if (percentage >= 90) return "critical";
    if (percentage >= 70) return "warning";
    return "safe";
  }

  // : Check if rate limit is approaching
  static isRateLimitApproaching(requestsThisMinute: number): boolean {
    return requestsThisMinute >= this.FREE_TIER_PER_MINUTE * 0.8;
  }

  // : Check if rate limit is exceeded
  static isRateLimitExceeded(requestsThisMinute: number): boolean {
    return requestsThisMinute >= this.FREE_TIER_PER_MINUTE;
  }

  static estimateCost(totalRequests: number): { tokens: number; cost: string } {
    // Llama-3.1-8B-Instant token breakdown based on actual GroqService prompts:
    // System prompt: ~70 tokens (JSON classifier instructions)
    // User input: ~50 tokens average (max 200 chars sent)
    // Output: ~30 tokens (JSON response with classification/confidence/reason)
    const avgInputTokensPerRequest = 120; // System + User
    const avgOutputTokensPerRequest = 30;

    const totalInputTokens = totalRequests * avgInputTokensPerRequest;
    const totalOutputTokens = totalRequests * avgOutputTokensPerRequest;

    // Groq pricing for Llama-3.1-8B-Instant
    // Free tier: First 100K requests per day OR 30 requests/minute (whichever hits first)
    // After free tier: $0.05 per 1M input tokens, $0.08 per 1M output tokens

    // Note: This is cumulative cost estimate if ALL requests were paid
    // In reality, free tier applies per-day, so actual cost is much lower
    const inputCostPerMillion = 0.05;
    const outputCostPerMillion = 0.08;

    const inputCost = (totalInputTokens / 1_000_000) * inputCostPerMillion;
    const outputCost = (totalOutputTokens / 1_000_000) * outputCostPerMillion;
    const totalCost = inputCost + outputCost;

    return {
      tokens: totalInputTokens + totalOutputTokens,
      cost: totalCost.toFixed(4),
    };
  }
}
