import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Lightbulb, RefreshCw } from "lucide-react";
import { RateLimitCard } from "./dashboard/RateLimitCard";
import { DailyUsageCard } from "./dashboard/DailyUsageCard";
import { TotalStatsGrid } from "./dashboard/TotalStatsGrid";
import { CostEstimateCard } from "./dashboard/CostEstimateCard";
import { RequestHistoryCard } from "./dashboard/RequestHistoryCard";
import { QuickLinksCard } from "./dashboard/QuickLinksCard";
import { useDashboardLogic } from "./dashboard/useDashboardLogic";

function UsageDashboard() {
  const {
    stats,
    isRefreshing,
    handleRefresh,
    handleReset,
    dailyPercentage,
    warningLevel,
    minutePercentage,
    tokens,
    cost,
    getProgressBarColor,
    getMinuteProgressBarColor,
    getWarningMessage,
    getMinuteWarningMessage,
    getWarningTextColor,
    getMinuteWarningTextColor,
  } = useDashboardLogic();

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-indigo-950/20 dark:to-purple-950/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span>OpenAI Moderation API Usage</span>
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
        <RateLimitCard
          requestsThisMinute={stats.requestsThisMinute}
          minutePercentage={minutePercentage}
          getMinuteProgressBarColor={getMinuteProgressBarColor}
          getMinuteWarningTextColor={getMinuteWarningTextColor}
          getMinuteWarningMessage={getMinuteWarningMessage}
        />

        <DailyUsageCard
          requestsToday={stats.requestsToday}
          dailyPercentage={dailyPercentage}
          warningLevel={warningLevel}
          getProgressBarColor={getProgressBarColor}
          getWarningTextColor={getWarningTextColor}
          getWarningMessage={getWarningMessage}
        />

        <TotalStatsGrid
          totalRequests={stats.totalRequests}
          estimatedTokens={tokens}
        />

        <CostEstimateCard cost={cost} />

        <RequestHistoryCard requestHistory={stats.requestHistory} />

        <QuickLinksCard />

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <Lightbulb className="h-3 w-3 flex-shrink-0" /> Auto-refreshes every
            10 seconds
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
