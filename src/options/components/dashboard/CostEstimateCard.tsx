import { RotateCcw } from "lucide-react";

interface CostEstimateCardProps {
  cost: string;
}

export function CostEstimateCard({ cost }: CostEstimateCardProps) {
  // Calculate days until next month
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const daysUntilReset = Math.ceil(
    (nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 border-2 border-green-200 dark:border-green-800">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <span>💰</span>
        Estimated Cost (This Month)
      </h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-green-600 dark:text-green-400">
          ${cost}
        </span>
        <span className="text-sm text-muted-foreground">USD (Free Tier)</span>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        OpenAI Moderation API is free for most usage tiers. No charges for
        content moderation.
      </p>
      <div className="mt-3 p-2 rounded-lg bg-white/50 dark:bg-gray-900/50 border border-green-300 dark:border-green-700">
        <p className="text-xs font-medium text-green-700 dark:text-green-300 flex items-center gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Resets in {daysUntilReset} day{daysUntilReset !== 1 ? "s" : ""} (on
          the 1st)
        </p>
      </div>
    </div>
  );
}
