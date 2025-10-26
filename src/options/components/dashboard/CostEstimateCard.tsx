interface CostEstimateCardProps {
  cost: string;
}

export function CostEstimateCard({ cost }: CostEstimateCardProps) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 border-2 border-green-200 dark:border-green-800">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <span>💰</span>
        Estimated Cost
      </h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-green-600 dark:text-green-400">
          ${cost}
        </span>
        <span className="text-sm text-muted-foreground">
          USD (if paid tier)
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Free tier: First 100K requests/day. Estimates based on Groq pricing:
        $0.05 per 1M input tokens, $0.08 per 1M output tokens
        (Llama-3.1-8B-Instant).
      </p>
    </div>
  );
}
