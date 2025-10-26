import { Power, CheckCircle2 } from "lucide-react";

interface FilterToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export function FilterToggle({ isEnabled, onToggle }: FilterToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
        isEnabled
          ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800 shadow-sm"
          : "bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            isEnabled
              ? "bg-indigo-100 dark:bg-indigo-900/50"
              : "bg-gray-100 dark:bg-gray-800"
          }`}
        >
          <Power
            className={`h-4 w-4 ${
              isEnabled
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-gray-400"
            }`}
          />
        </div>
        <div className="text-left">
          <p className="font-semibold text-sm">Filter Status</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {isEnabled ? (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                Active
              </>
            ) : (
              <>Paused</>
            )}
          </p>
        </div>
      </div>
      <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
        {isEnabled ? "On" : "Off"}
      </div>
    </button>
  );
}
