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
      className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
        useAI
          ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800 shadow-sm"
          : groqApiKey
          ? "bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700"
          : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-60"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              useAI
                ? "bg-indigo-100 dark:bg-indigo-900/50"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            <Sparkles
              className={`h-4 w-4 ${
                useAI ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"
              }`}
            />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">AI Context Analysis</p>
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
          className={`h-2 w-2 rounded-full ${
            useAI ? "bg-indigo-600 dark:bg-indigo-400" : "bg-gray-400"
          }`}
        />
      </div>
    </button>
  );
}
