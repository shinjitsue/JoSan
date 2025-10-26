import { Globe } from "lucide-react";

interface PlatformStatusProps {
  platformDisplayName: string;
  isPlatformEnabled: boolean;
  onToggle: () => void;
}

export function PlatformStatus({
  platformDisplayName,
  isPlatformEnabled,
  onToggle,
}: PlatformStatusProps) {
  return (
    <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-medium">{platformDisplayName}</span>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            isPlatformEnabled
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}
        >
          {isPlatformEnabled ? "Active" : "Inactive"}
        </span>
      </div>
      <button
        onClick={onToggle}
        className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all ${
          isPlatformEnabled
            ? "bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300"
            : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-300"
        }`}
      >
        {isPlatformEnabled ? "Disable for this site" : "Enable for this site"}
      </button>
    </div>
  );
}
