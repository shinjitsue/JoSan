import { useState, useEffect } from "react";
import { UsageTracker } from "../../content/utils/UsageTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

interface UsageStats {
  totalRequests: number;
  requestsToday: number;
  lastResetDate: string;
  requestHistory: { date: string; count: number }[];
  requestsThisMinute: number;
  lastMinuteReset: string;
}

function UsageDashboard() {
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

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-indigo-950/20 dark:to-purple-950/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span>Groq API Usage Dashboard</span>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Per-Minute Rate Limit */}
        <div className="rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-lg">
                Current Minute (Rate Limit)
              </h3>
            </div>
            <span
              className={`text-sm font-medium ${getMinuteWarningTextColor()}`}
            >
              {getMinuteWarningMessage()}
            </span>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {stats.requestsThisMinute} / 30 requests
              </span>
              <span className="font-medium">
                {minutePercentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`${getMinuteProgressBarColor()} h-3 rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(minutePercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Free tier limit: 30 requests/minute • Resets every minute
          </p>
        </div>

        {/* Today's Usage */}
        <div className="rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {warningLevel === "critical" ? (
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              )}
              <h3 className="font-semibold text-lg">Today's Usage</h3>
            </div>
            <span className={`text-sm font-medium ${getWarningTextColor()}`}>
              {getWarningMessage()}
            </span>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {stats.requestsToday.toLocaleString()} / 14,400 requests
              </span>
              <span className="font-medium">{dailyPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`${getProgressBarColor()} h-3 rounded-full transition-all duration-300`}
                style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Free tier limit: 14,400 requests/day • Resets daily at midnight UTC
          </p>
        </div>

        {/* Total Usage Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 p-4 border-2 border-indigo-200 dark:border-indigo-800">
            <div className="text-sm text-muted-foreground mb-1">
              Total Requests
            </div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalRequests.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">All time</div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 p-4 border-2 border-purple-200 dark:border-purple-800">
            <div className="text-sm text-muted-foreground mb-1">
              Estimated Tokens
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(tokens / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              ~150 per request
            </div>
          </div>
        </div>

        {/* Cost Estimate */}
        <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 border-2 border-green-200 dark:border-green-800">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>💰</span>
            Estimated Cost
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${cost}
            </span>
            <span className="text-sm text-muted-foreground">
              USD (if paid tier)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Free tier: First 100K requests/day. Estimates based on Groq pricing:
            $0.05 per 1M input tokens, $0.08 per 1M output tokens
            (Llama-3.1-8B-Instant).
          </p>
        </div>

        {/* Recent History */}
        {stats.requestHistory.length > 0 && (
          <div className="rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <span>📈</span>
              Recent History (Last 7 Days)
            </h3>
            <div className="space-y-3">
              {stats.requestHistory
                .slice(-7)
                .reverse()
                .map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground font-medium">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (entry.count / 14400) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="font-medium w-20 text-right">
                        {entry.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <span>🔗</span>
            Groq Console
          </h3>
          <div className="space-y-2">
            <a
              href="https://console.groq.com/usage"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors group"
            >
              <span className="text-sm font-medium">View Official Usage</span>
              <svg
                className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            <a
              href="https://console.groq.com/settings/limits"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors group"
            >
              <span className="text-sm font-medium">Rate Limits & Quotas</span>
              <svg
                className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
            <a
              href="https://groq.com/pricing/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors group"
            >
              <span className="text-sm font-medium">Upgrade to Paid Tier</span>
              <svg
                className="w-4 h-4 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            💡 Auto-refreshes every 10 seconds
          </p>
          <Button
            onClick={handleReset}
            variant="destructive"
            size="sm"
            className="shadow-sm"
          >
            Reset Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default UsageDashboard;
