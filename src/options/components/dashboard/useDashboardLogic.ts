import { useState, useEffect } from "react";
import { UsageTracker } from "@/content/utils/UsageTracker";

interface UsageStats {
  totalRequests: number;
  requestsToday: number;
  lastResetDate: string;
  requestHistory: { date: string; count: number }[];
  requestsThisMinute: number;
  lastMinuteReset: string;
}

export function useDashboardLogic() {
  const [stats, setStats] = useState<UsageStats>({
    totalRequests: 0,
    requestsToday: 0,
    lastResetDate: "",
    requestHistory: [],
    requestsThisMinute: 0,
    lastMinuteReset: "",
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadStats();

    const interval = setInterval(() => {
      loadStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  const loadStats = async () => {
    const startTime = Date.now();
    const usageStats = await UsageTracker.getStats();
    setStats(usageStats);

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 500 - elapsed);

    setTimeout(() => {
      setIsRefreshing(false);
    }, remaining);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
  };

  const handleReset = async () => {
    if (confirm("Reset all usage statistics? This cannot be undone.")) {
      await UsageTracker.resetStats();
      setRefreshKey((prev) => prev + 1);
    }
  };

  // Computed values
  const dailyPercentage = UsageTracker.getDailyLimitPercentage(
    stats.requestsToday
  );
  const warningLevel = UsageTracker.getWarningLevel(stats.requestsToday);
  const minutePercentage = UsageTracker.getMinuteLimitPercentage(
    stats.requestsThisMinute
  );
  const minuteWarningLevel = UsageTracker.getMinuteWarningLevel(
    stats.requestsThisMinute
  );
  const { tokens, cost } = UsageTracker.estimateCost(stats.totalRequests);

  // Helper functions
  const getProgressBarColor = () => {
    if (warningLevel === "critical") return "bg-red-500 dark:bg-red-600";
    if (warningLevel === "warning") return "bg-yellow-500 dark:bg-yellow-600";
    return "bg-green-500 dark:bg-green-600";
  };

  const getMinuteProgressBarColor = () => {
    if (minuteWarningLevel === "critical") return "bg-red-500 dark:bg-red-600";
    if (minuteWarningLevel === "warning")
      return "bg-yellow-500 dark:bg-yellow-600";
    return "bg-blue-500 dark:bg-blue-600";
  };

  const getWarningMessage = () => {
    if (warningLevel === "critical")
      return "⚠️ Critical: Approaching daily limit!";
    if (warningLevel === "warning") return "⚡ Warning: High usage today";
    return "✅ Usage is healthy";
  };

  const getMinuteWarningMessage = () => {
    if (minuteWarningLevel === "critical") return "🚨 Rate limit critical!";
    if (minuteWarningLevel === "warning") return "⚡ Approaching rate limit";
    return "✅ Rate limit OK";
  };

  const getWarningTextColor = () => {
    if (warningLevel === "critical") return "text-red-600 dark:text-red-400";
    if (warningLevel === "warning")
      return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getMinuteWarningTextColor = () => {
    if (minuteWarningLevel === "critical")
      return "text-red-600 dark:text-red-400";
    if (minuteWarningLevel === "warning")
      return "text-yellow-600 dark:text-yellow-400";
    return "text-blue-600 dark:text-blue-400";
  };

  return {
    stats,
    isRefreshing,
    handleRefresh,
    handleReset,
    dailyPercentage,
    warningLevel,
    minutePercentage,
    minuteWarningLevel,
    tokens,
    cost,
    getProgressBarColor,
    getMinuteProgressBarColor,
    getWarningMessage,
    getMinuteWarningMessage,
    getWarningTextColor,
    getMinuteWarningTextColor,
  };
}
