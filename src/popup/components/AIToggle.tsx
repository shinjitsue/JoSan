import { Sparkles } from "lucide-react";

interface AIToggleProps {
  useAI: boolean;
  groqApiKey: string;
  onToggle: () => void;
}

export function AIToggle({ useAI, groqApiKey, onToggle }: AIToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={!groqApiKey}
      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 relative overflow-hidden group ${
        useAI
          ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800 shadow-sm"
          : groqApiKey
          ? "bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
          : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-60"
      }`}
    >
      {/* Animated gradient overlay on hover (disabled state) */}
      {!useAI && groqApiKey && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/10 to-indigo-500/0 dark:from-indigo-400/0 dark:via-purple-400/10 dark:to-indigo-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
      )}

      {/* Heartbeat pulse animation when active */}
      {useAI && (
        <div className="absolute inset-0 heartbeat-pulse bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5" />
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg transition-all duration-300 ${
              useAI
                ? "bg-indigo-100 dark:bg-indigo-900/50"
                : groqApiKey
                ? "bg-gray-100 dark:bg-gray-800 group-hover:bg-gradient-to-br group-hover:from-indigo-100 group-hover:to-purple-100 dark:group-hover:from-indigo-900/50 dark:group-hover:to-purple-900/50"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            <Sparkles
              className={`h-4 w-4 transition-all duration-300 ${
                useAI
                  ? "text-indigo-600 dark:text-indigo-400 heartbeat-pulse"
                  : groqApiKey
                  ? "text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] group-hover:scale-110"
                  : "text-gray-400"
              }`}
            />
          </div>
          <div className="text-left">
            <p
              className={`font-semibold text-sm transition-colors duration-300 ${
                groqApiKey && !useAI
                  ? "group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  : ""
              }`}
            >
              AI Context Analysis
            </p>
            <p className="text-xs text-muted-foreground">
              {!groqApiKey
                ? "API key required"
                : useAI
                ? "Active"
                : "Click to enable"}
            </p>
          </div>
        </div>
        <div
          className={`h-2 w-2 rounded-full transition-all duration-300 ${
            useAI
              ? "bg-indigo-600 dark:bg-indigo-400 shadow-lg shadow-indigo-500/50 heartbeat-pulse"
              : groqApiKey
              ? "bg-gray-400 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 group-hover:shadow-lg group-hover:shadow-indigo-500/50 group-hover:scale-150"
              : "bg-gray-400"
          }`}
        />
      </div>
    </button>
  );
}
