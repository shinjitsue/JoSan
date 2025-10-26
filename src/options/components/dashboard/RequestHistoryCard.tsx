import { DashboardCard } from "./DashboardCard";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface RequestHistoryCardProps {
  requestHistory: { date: string; count: number }[];
}

export function RequestHistoryCard({
  requestHistory,
}: RequestHistoryCardProps) {
  if (requestHistory.length === 0) return null;

  const chartData = requestHistory.slice(-7).map((entry) => ({
    date: new Date(entry.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    requests: entry.count,
  }));

  const chartConfig = {
    requests: {
      label: "API Requests",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  return (
    <DashboardCard>
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <span>📈</span>
        Recent History (Last 7 Days)
      </h3>

      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Area
            dataKey="requests"
            type="natural"
            fill="var(--color-requests)"
            fillOpacity={0.4}
            stroke="var(--color-requests)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Avg/Day</p>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {Math.round(
              chartData.reduce((sum, d) => sum + d.requests, 0) /
                chartData.length
            ).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Peak Day</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {Math.max(...chartData.map((d) => d.requests)).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Total</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {chartData.reduce((sum, d) => sum + d.requests, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
