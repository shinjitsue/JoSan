import { AlertTriangle, CheckCircle } from "lucide-react";
import { DashboardCard } from "./DashboardCard";

interface DailyUsageCardProps {
  requestsToday: number;
  dailyPercentage: number;
  warningLevel: "safe" | "warning" | "critical";
  getProgressBarColor: () => string;
  getWarningTextColor: () => string;
  getWarningMessage: () => string;
  dailyLimit: number;
}

export function DailyUsageCard({
  requestsToday,
  dailyPercentage,
  warningLevel,
  getProgressBarColor,
  getWarningTextColor,
  getWarningMessage,
  dailyLimit,
}: DailyUsageCardProps) {
  return (
    <DashboardCard>
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
            {requestsToday.toLocaleString()} / {dailyLimit.toLocaleString()}{" "}
            requests
          </span>
          <span className="font-medium">{dailyPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`${getProgressBarColor()} h-3 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Free tier limit: {dailyLimit.toLocaleString()} requests/day • Resets
        daily at midnight UTC
      </p>
    </DashboardCard>
  );
}
