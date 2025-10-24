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
    const stats = await this.getStats();
    stats.totalRequests += 1;
    stats.requestsToday += 1;
    stats.requestsThisMinute += 1;
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
    // Updated: Optimized to ~100 tokens per request (was 200)
    // System prompt: ~40 tokens, User input: ~35 tokens, Response: ~25 tokens
    const avgTokensPerRequest = 100;
    const totalTokens = totalRequests * avgTokensPerRequest;

    // Free tier first 100k requests, then paid
    const freeTokens = 100000 * avgTokensPerRequest;
    const paidTokens = Math.max(0, totalTokens - freeTokens);

    // Average cost calculation ($0.065 per 1M tokens average)
    const costPerMillion = 0.065;
    const estimatedCost = (paidTokens / 1000000) * costPerMillion;

    return {
      tokens: totalTokens,
      cost: estimatedCost.toFixed(4),
    };
  }
}
