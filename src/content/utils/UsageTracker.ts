interface UsageStats {
  totalRequests: number;
  requestsToday: number;
  lastResetDate: string;
  requestHistory: { date: string; count: number }[];
  requestsThisMinute: number;
  lastMinuteReset: string;
  monthlyResetDate: string;
  monthlyRequests: number;
}

export class UsageTracker {
  private static readonly STORAGE_KEY = "openaiUsageStats";
  // Updated for OpenAI Moderation API (these are generous estimates - check actual limits)
  private static readonly FREE_TIER_DAILY_LIMIT = 14400; // 14,400/day
  private static readonly FREE_TIER_PER_MINUTE = 30; // 30/min

  static async getStats(): Promise<UsageStats> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const today = new Date().toISOString().split("T")[0];
    const currentMinute = new Date().toISOString().slice(0, 16);

    const result = await chrome.storage.local.get({
      [this.STORAGE_KEY]: {
        totalRequests: 0,
        requestsToday: 0,
        lastResetDate: today,
        requestHistory: [],
        requestsThisMinute: 0,
        lastMinuteReset: currentMinute,
        monthlyResetDate: currentMonth,
        monthlyRequests: 0,
      },
    });

    const stats = result[this.STORAGE_KEY];

    // Reset monthly count if it's a new month
    if (stats.monthlyResetDate !== currentMonth) {
      stats.totalRequests = 0; // Reset total requests
      stats.monthlyRequests = 0;
      stats.monthlyResetDate = currentMonth;
      stats.requestHistory = []; // Clear history on new month
      await chrome.storage.local.set({ [this.STORAGE_KEY]: stats });
    }

    // Reset daily count if it's a new day
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
    if (stats.lastMinuteReset !== currentMinute) {
      stats.requestsThisMinute = 0;
      stats.lastMinuteReset = currentMinute;
      await chrome.storage.local.set({ [this.STORAGE_KEY]: stats });
    }

    return stats;
  }

  static async incrementUsage(): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().split("T")[0];
    const currentMinute = new Date().toISOString().slice(0, 16);

    const result = await chrome.storage.local.get([this.STORAGE_KEY]);
    const stats = result[this.STORAGE_KEY] || {
      totalRequests: 0,
      requestsToday: 0,
      lastResetDate: today,
      requestHistory: [],
      requestsThisMinute: 0,
      lastMinuteReset: currentMinute,
      monthlyResetDate: currentMonth,
      monthlyRequests: 0,
    };

    // Check and reset monthly if needed
    if (stats.monthlyResetDate !== currentMonth) {
      stats.totalRequests = 0;
      stats.monthlyRequests = 0;
      stats.monthlyResetDate = currentMonth;
      stats.requestHistory = [];
    }

    // Check and reset daily if needed
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

    // Check and reset per-minute if needed
    if (stats.lastMinuteReset !== currentMinute) {
      stats.requestsThisMinute = 0;
      stats.lastMinuteReset = currentMinute;
    }

    // Increment counters
    stats.totalRequests += 1;
    stats.monthlyRequests += 1;
    stats.requestsToday += 1;
    stats.requestsThisMinute += 1;

    // Write atomically
    await chrome.storage.local.set({ [this.STORAGE_KEY]: stats });
  }

  static async resetStats(): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().split("T")[0];
    const currentMinute = new Date().toISOString().slice(0, 16);

    const emptyStats: UsageStats = {
      totalRequests: 0,
      requestsToday: 0,
      lastResetDate: today,
      requestHistory: [],
      requestsThisMinute: 0,
      lastMinuteReset: currentMinute,
      monthlyResetDate: currentMonth,
      monthlyRequests: 0,
    };
    await chrome.storage.local.set({ [this.STORAGE_KEY]: emptyStats });
  }

  static getDailyLimit(): number {
    return this.FREE_TIER_DAILY_LIMIT;
  }

  static getMinuteLimit(): number {
    return this.FREE_TIER_PER_MINUTE;
  }

  static getDailyLimitPercentage(requestsToday: number): number {
    return (requestsToday / this.FREE_TIER_DAILY_LIMIT) * 100;
  }

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

  static getMinuteWarningLevel(
    requestsThisMinute: number
  ): "safe" | "warning" | "critical" {
    const percentage = this.getMinuteLimitPercentage(requestsThisMinute);
    if (percentage >= 90) return "critical";
    if (percentage >= 70) return "warning";
    return "safe";
  }

  static isRateLimitApproaching(requestsThisMinute: number): boolean {
    return requestsThisMinute >= this.FREE_TIER_PER_MINUTE * 0.8;
  }

  static isRateLimitExceeded(requestsThisMinute: number): boolean {
    return requestsThisMinute >= this.FREE_TIER_PER_MINUTE;
  }

  // Updated for OpenAI Moderation API - which is FREE
  static estimateCost(totalRequests: number): { tokens: number; cost: string } {
    // OpenAI Moderation API is FREE for most usage tiers
    // No token-based pricing, just request-based rate limiting

    // For display purposes, we can estimate "equivalent tokens" but it's not charged
    // Each moderation request processes the input text (~50-500 chars average)
    const avgCharsPerRequest = 150; // Estimated average input length
    const estimatedTokens = totalRequests * Math.ceil(avgCharsPerRequest / 4); // ~4 chars per token

    return {
      tokens: estimatedTokens,
      cost: "0.00", // Free tier - no cost for moderation requests
    };
  }

  // Additional helper methods for OpenAI Moderation API
  static getServiceName(): string {
    return "OpenAI Moderation API";
  }

  static getModelName(): string {
    return "omni-moderation-latest";
  }

  static getPricingInfo(): string {
    return "Free for most usage tiers";
  }

  static getApiDocumentationUrl(): string {
    return "https://platform.openai.com/docs/guides/moderation";
  }

  // Get formatted usage summary for display
  static getUsageSummary(stats: UsageStats): string {
    const dailyPercent = this.getDailyLimitPercentage(stats.requestsToday);
    const minutePercent = this.getMinuteLimitPercentage(
      stats.requestsThisMinute
    );

    return `Today: ${stats.requestsToday.toLocaleString()} requests (${dailyPercent.toFixed(
      1
    )}%) | This minute: ${
      stats.requestsThisMinute
    } requests (${minutePercent.toFixed(1)}%)`;
  }

  // Check if service is within healthy usage limits
  static isUsageHealthy(stats: UsageStats): boolean {
    const dailyWarning = this.getWarningLevel(stats.requestsToday);
    const minuteWarning = this.getMinuteWarningLevel(stats.requestsThisMinute);

    return dailyWarning === "safe" && minuteWarning === "safe";
  }

  // Get recommendations based on current usage
  static getUsageRecommendation(stats: UsageStats): string {
    const dailyWarning = this.getWarningLevel(stats.requestsToday);
    const minuteWarning = this.getMinuteWarningLevel(stats.requestsThisMinute);

    if (minuteWarning === "critical") {
      return "Rate limit nearly exceeded. Consider reducing AI checks temporarily.";
    }

    if (dailyWarning === "critical") {
      return "Daily limit nearly reached. Monitor usage closely.";
    }

    if (dailyWarning === "warning" || minuteWarning === "warning") {
      return "Usage is elevated. Consider optimizing AI check frequency.";
    }

    return "Usage is within normal limits.";
  }
}
