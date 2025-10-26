import { Shield, Scan } from "lucide-react";

interface StatsGridProps {
  blockedWords: number;
  pagesScanned: number;
}

export function StatsGrid({ blockedWords, pagesScanned }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="p-4 rounded-xl border-2 border-red-100 dark:border-red-900/50 bg-gradient-to-br from-red-50/50 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/20">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
          <p className="text-xs font-medium text-muted-foreground">Blocked</p>
        </div>
        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
          {blockedWords.toLocaleString()}
        </p>
      </div>

      <div className="p-4 rounded-xl border-2 border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="flex items-center gap-2 mb-2">
          <Scan className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <p className="text-xs font-medium text-muted-foreground">Scanned</p>
        </div>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {pagesScanned.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
