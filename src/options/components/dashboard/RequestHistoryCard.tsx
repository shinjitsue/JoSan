import { DashboardCard } from "./DashboardCard";

interface RequestHistoryCardProps {
  requestHistory: { date: string; count: number }[];
}

export function RequestHistoryCard({
  requestHistory,
}: RequestHistoryCardProps) {
  if (requestHistory.length === 0) return null;

  return (
    <DashboardCard>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span>📈</span>
        Recent History (Last 7 Days)
      </h3>
      <div className="space-y-3">
        {requestHistory
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
                      width: `${Math.min((entry.count / 14400) * 100, 100)}%`,
                    }}
                  />
                </div>
                <span className="font-medium w-20 text-right">
                  {entry.count.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
      </div>
    </DashboardCard>
  );
}
