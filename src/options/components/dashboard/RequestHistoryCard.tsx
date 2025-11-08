import { DashboardCard } from "./DashboardCard";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ChartSpline } from "lucide-react";

interface RequestHistoryCardProps {
  requestHistory: { date: string; count: number }[];
}

export function RequestHistoryCard({
  requestHistory,
}: RequestHistoryCardProps) {
  if (requestHistory.length === 0) return null;

  // Generate last 7 days (excluding today)
  const getLast7Days = () => {
    const days = [];
    const today = new Date();

    // Start from yesterday (i = 1) and go back 7 days
    for (let i = 7; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      days.push(dateStr);
    }

    return days;
  };

  // Create a map of existing data
  const historyMap = new Map(
    requestHistory.map((entry) => [entry.date, entry.count])
  );

  // Fill in missing days with 0
  const last7Days = getLast7Days();
  const chartData = last7Days.map((date) => ({
    date: new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    requests: historyMap.get(date) || 0,
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
        <ChartSpline className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
        Recent History (Last 7 Days)
      </h3>

      <ChartContainer config={chartConfig} className="h-[200px] w-full">
        <AreaChart
          accessibilityLayer
          data={chartData}
          margin={{ left: 12, right: 12 }}
        >
          <defs>
            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--chart-1))"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--chart-1))"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
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
            fill="url(#colorRequests)"
            fillOpacity={1}
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
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
