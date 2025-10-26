interface TotalStatsGridProps {
  totalRequests: number;
  estimatedTokens: number;
}

export function TotalStatsGrid({
  totalRequests,
  estimatedTokens,
}: TotalStatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/30 p-4 border-2 border-indigo-200 dark:border-indigo-800">
        <div className="text-sm text-muted-foreground mb-1">Total Requests</div>
        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {totalRequests.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">All time</div>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 p-4 border-2 border-purple-200 dark:border-purple-800">
        <div className="text-sm text-muted-foreground mb-1">
          Estimated Tokens
        </div>
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {(estimatedTokens / 1000).toFixed(1)}K
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          ~150 per request
        </div>
      </div>
    </div>
  );
}
