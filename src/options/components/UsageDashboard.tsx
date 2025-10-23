import { useState, useEffect } from "react";
import { UsageTracker } from "../../content/utils/UsageTracker";

interface UsageStats {
  totalRequests: number;
  requestsToday: number;
  lastResetDate: string;
  requestHistory: { date: string; count: number }[];
  requestsThisMinute: number; //
  lastMinuteReset: string; //
}

function UsageDashboard() {
  const [stats, setStats] = useState<UsageStats>({
    totalRequests: 0,
    requestsToday: 0,
    lastResetDate: "",
    requestHistory: [],
    requestsThisMinute: 0, //
    lastMinuteReset: "", //
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadStats();

    // : Auto-refresh every 10 seconds to show real-time per-minute usage
    const interval = setInterval(() => {
      loadStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  const loadStats = async () => {
    const usageStats = await UsageTracker.getStats();
    setStats(usageStats);
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

  // : Per-minute stats
  const minutePercentage = UsageTracker.getMinuteLimitPercentage(
    stats.requestsThisMinute
  );
  const minuteWarningLevel = UsageTracker.getMinuteWarningLevel(
    stats.requestsThisMinute
  );

  const { tokens, cost } = UsageTracker.estimateCost(stats.totalRequests);

  const getProgressBarColor = () => {
    if (warningLevel === "critical") return "bg-red-500";
    if (warningLevel === "warning") return "bg-yellow-500";
    return "bg-green-500";
  };

  // : Get per-minute progress bar color
  const getMinuteProgressBarColor = () => {
    if (minuteWarningLevel === "critical") return "bg-red-500";
    if (minuteWarningLevel === "warning") return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getWarningMessage = () => {
    if (warningLevel === "critical")
      return "⚠️ Critical: Approaching daily limit!";
    if (warningLevel === "warning") return "⚡ Warning: High usage today";
    return "✅ Usage is healthy";
  };

  // : Get per-minute warning message
  const getMinuteWarningMessage = () => {
    if (minuteWarningLevel === "critical") return "🚨 Rate limit critical!";
    if (minuteWarningLevel === "warning") return "⚡ Approaching rate limit";
    return "✅ Rate limit OK";
  };

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center">
          <span className="mr-2">📊</span>
          Groq API Usage Dashboard
        </h2>
        <button
          onClick={() => setRefreshKey((prev) => prev + 1)}
          className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      {/* : Per-Minute Rate Limit */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Current Minute (Rate Limit)</h3>
          <span
            className={`text-sm font-medium ${
              minuteWarningLevel === "critical"
                ? "text-red-600"
                : minuteWarningLevel === "warning"
                ? "text-yellow-600"
                : "text-blue-600"
            }`}
          >
            {getMinuteWarningMessage()}
          </span>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>{stats.requestsThisMinute} / 30 requests</span>
            <span className="font-medium">{minutePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`${getMinuteProgressBarColor()} h-3 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(minutePercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Free tier limit: 30 requests/minute • Resets every minute
        </p>
      </div>

      {/* Today's Usage */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Today's Usage</h3>
          <span
            className={`text-sm font-medium ${
              warningLevel === "critical"
                ? "text-red-600"
                : warningLevel === "warning"
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {getWarningMessage()}
          </span>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>
              {stats.requestsToday.toLocaleString()} / 14,400 requests
            </span>
            <span className="font-medium">{dailyPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`${getProgressBarColor()} h-3 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Free tier limit: 14,400 requests/day • Resets daily at midnight UTC
        </p>
      </div>

      {/* Total Usage Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4">
          <div className="text-sm text-gray-500">Total Requests</div>
          <div className="text-2xl font-bold text-indigo-600">
            {stats.totalRequests.toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-1">All time</div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="text-sm text-gray-500">Estimated Tokens</div>
          <div className="text-2xl font-bold text-purple-600">
            {(tokens / 1000).toFixed(1)}K
          </div>
          <div className="text-xs text-gray-400 mt-1">~200 per request</div>
        </div>
      </div>

      {/* Cost Estimate */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-2">💰 Estimated Cost</h3>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-green-600">${cost}</span>
          <span className="ml-2 text-sm text-gray-500">USD (if paid tier)</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          First 100K requests are free. Estimates based on Groq pricing: $0.05
          per 1M input tokens, $0.08 per 1M output tokens.
        </p>
      </div>

      {/* Recent History */}
      {stats.requestHistory.length > 0 && (
        <div className="bg-white rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-3">
            📈 Recent History (Last 7 Days)
          </h3>
          <div className="space-y-2">
            {stats.requestHistory
              .slice(-7)
              .reverse()
              .map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (entry.count / 14400) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="font-medium w-16 text-right">
                      {entry.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <h3 className="font-semibold mb-3">🔗 Groq Console</h3>
        <div className="space-y-2">
          <a
            href="https://console.groq.com/usage"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
          >
            <span className="text-sm">View Official Usage</span>
            <svg
              className="w-4 h-4 text-gray-400"
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
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
          >
            <span className="text-sm">Rate Limits & Quotas</span>
            <svg
              className="w-4 h-4 text-gray-400"
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
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
          >
            <span className="text-sm">Upgrade to Paid Tier</span>
            <svg
              className="w-4 h-4 text-gray-400"
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
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          💡 Auto-refreshes every 10 seconds
        </p>
        <button
          onClick={handleReset}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
        >
          Reset Stats
        </button>
      </div>
    </div>
  );
}

export default UsageDashboard;
