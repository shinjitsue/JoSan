import { Sparkles, Bot, Shield } from "lucide-react";

interface HeaderProps {
  useAI: boolean;
  isEnabled: boolean;
}

export function Header({ useAI, isEnabled }: HeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            JoSan
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            {useAI ? (
              <>
                <Bot className="h-3 w-3" />
                AI-Powered Filtering
              </>
            ) : (
              <>
                <Shield className="h-3 w-3" />
                Pattern-Based Filtering
              </>
            )}
          </p>
        </div>
      </div>
      <div
        className={`h-3 w-3 rounded-full transition-all ${
          isEnabled
            ? "bg-green-500 shadow-lg shadow-green-500/50"
            : "bg-gray-400"
        }`}
      />
    </div>
  );
}
