import { Zap, AlertTriangle } from "lucide-react";

interface AIUsageStatsProps {
  requestsToday: number;
  dailyLimit: number;
  requestsThisMinute: number;
  minuteLimit: number;
}

export function AIUsageStats({
  requestsToday,
  dailyLimit,
  requestsThisMinute,
  minuteLimit,
}: AIUsageStatsProps) {
  const dailyUsagePercent = (requestsToday / dailyLimit) * 100;
  const minuteUsagePercent = (requestsThisMinute / minuteLimit) * 100;

  return (
    <div className="p-4 rounded-xl border-2 border-purple-100 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <p className="text-xs font-medium text-muted-foreground">
            AI Usage Today
          </p>
        </div>
        {dailyUsagePercent >= 90 && (
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        )}
      </div>

      {/* Daily Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {requestsToday} / {dailyLimit}
          </span>
          <span className="font-medium">{dailyUsagePercent.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              dailyUsagePercent >= 90
                ? "bg-red-500"
                : dailyUsagePercent >= 70
                ? "bg-yellow-500"
                : "bg-gradient-to-r from-indigo-500 to-purple-600"
            }`}
            style={{ width: `${Math.min(dailyUsagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Minute Progress */}
      <div className="space-y-1.5 pt-2 border-t border-purple-200 dark:border-purple-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            This minute: {requestsThisMinute} / {minuteLimit}
          </span>
          <span className="font-medium">{minuteUsagePercent.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              minuteUsagePercent >= 90 ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(minuteUsagePercent, 100)}%` }}
          />
        </div>
      </div>

      {dailyUsagePercent >= 90 && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium pt-2">
          ⚠️ Approaching daily limit
        </p>
      )}
    </div>
  );
}
