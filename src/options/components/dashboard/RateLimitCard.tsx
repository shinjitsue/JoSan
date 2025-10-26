import { Clock } from "lucide-react";
import { DashboardCard } from "./DashboardCard";

interface RateLimitCardProps {
  requestsThisMinute: number;
  minutePercentage: number;
  getMinuteProgressBarColor: () => string;
  getMinuteWarningTextColor: () => string;
  getMinuteWarningMessage: () => string;
}

export function RateLimitCard({
  requestsThisMinute,
  minutePercentage,
  getMinuteProgressBarColor,
  getMinuteWarningTextColor,
  getMinuteWarningMessage,
}: RateLimitCardProps) {
  return (
    <DashboardCard>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-lg">Current Minute (Rate Limit)</h3>
        </div>
        <span className={`text-sm font-medium ${getMinuteWarningTextColor()}`}>
          {getMinuteWarningMessage()}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {requestsThisMinute} / 30 requests
          </span>
          <span className="font-medium">{minutePercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`${getMinuteProgressBarColor()} h-3 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(minutePercentage, 100)}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Free tier limit: 30 requests/minute • Resets every minute
      </p>
    </DashboardCard>
  );
}
