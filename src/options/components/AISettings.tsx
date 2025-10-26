import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { GroqService } from "@/content/utils/GroqService";

interface AISettingsProps {
  useAI: boolean;
  filterMild: boolean;
  filterToxic: boolean;
  groqApiKey: string;
  onUseAIChange: (useAI: boolean) => void;
  onFilterMildChange: (filterMild: boolean) => void;
  onFilterToxicChange: (filterToxic: boolean) => void;
  onApiKeyChange: (apiKey: string) => void;
}

type ApiKeyStatus = "unchecked" | "validating" | "valid" | "invalid";

export function AISettings({
  useAI,
  filterMild,
  filterToxic,
  groqApiKey,
  onUseAIChange,
  onFilterMildChange,
  onFilterToxicChange,
  onApiKeyChange,
}: AISettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>("unchecked");

  const validateApiKey = async () => {
    if (!groqApiKey) {
      setApiKeyStatus("invalid");
      return;
    }

    setApiKeyStatus("validating");
    GroqService.setApiKey(groqApiKey);

    const isValid = await GroqService.validateApiKey();
    setApiKeyStatus(isValid ? "valid" : "invalid");

    if (isValid) {
      setTimeout(() => setApiKeyStatus("unchecked"), 3000);
    }
  };

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-indigo-950/20 dark:to-purple-950/20 relative overflow-hidden group">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 animate-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 relative overflow-hidden group/icon glow-pulse">
            {/* Pulsing glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl blur-md opacity-50 heartbeat-pulse" />
            <Sparkles className="h-5 w-5 text-white relative z-10 heartbeat-pulse" />
          </div>
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent animate-gradient">
            AI-Powered Context Analysis
          </span>
        </CardTitle>
        <CardDescription className="text-base">
          Use Llama-3.1 8B via Groq for intelligent content classification
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 relative z-10">
        {/* AI Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-800">
          <div className="space-y-1">
            <label
              htmlFor="ai-toggle"
              className="font-semibold text-lg cursor-pointer flex items-center gap-2"
            >
              Enable AI Double-Check
              {useAI && (
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 heartbeat-pulse inline-block" />
              )}
            </label>
            <p className="text-sm text-muted-foreground">
              Context-aware analysis for flagged content
            </p>
          </div>
          <Switch
            id="ai-toggle"
            checked={useAI}
            onCheckedChange={onUseAIChange}
          />
        </div>

        {useAI && (
          <div className="space-y-6 animate-fade-in-up">
            {/* API Key Section */}
            <div className="space-y-4 rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
              <label className="text-base font-semibold flex items-center gap-2">
                Groq API Key{" "}
                <span className="text-red-500 heartbeat-pulse">*</span>
              </label>

              <div className="flex gap-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={groqApiKey}
                  onChange={(e) => {
                    onApiKeyChange(e.target.value);
                    setApiKeyStatus("unchecked");
                  }}
                  placeholder="gsk_..."
                  className="font-mono text-sm transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="hover:scale-110 transition-transform duration-300"
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={validateApiKey}
                  disabled={apiKeyStatus === "validating"}
                  className="min-w-[100px] hover:scale-105 transition-all duration-300"
                >
                  {apiKeyStatus === "validating" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {apiKeyStatus === "validating" ? "Checking..." : "Validate"}
                </Button>
              </div>

              {/* Status Messages with animations */}
              {apiKeyStatus === "valid" && (
                <div className="flex items-center gap-2 text-sm text-green-600 animate-fade-in-up">
                  <CheckCircle className="h-4 w-4 heartbeat-pulse" />
                  API key is valid
                </div>
              )}
              {apiKeyStatus === "invalid" && (
                <div className="flex items-center gap-2 text-sm text-red-600 animate-shake">
                  <XCircle className="h-4 w-4" />
                  Invalid API key or network error
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Get your free API key at{" "}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline hover:text-indigo-600 transition-colors duration-300"
                >
                  console.groq.com/keys
                </a>
              </p>

              {/* Privacy Notice */}
              <Alert className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 hover:shadow-lg transition-all duration-300">
                <AlertDescription>
                  <p className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-lg heartbeat-pulse">🔒</span>
                    Your API Key is Safe
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li className="hover:translate-x-1 transition-transform duration-200">
                      • Stored locally in your browser only
                    </li>
                    <li className="hover:translate-x-1 transition-transform duration-200">
                      • Never sent to JoSan servers
                    </li>
                    <li className="hover:translate-x-1 transition-transform duration-200">
                      • Direct communication with Groq API
                    </li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>

            {/* Filter Classifications */}
            <div className="space-y-4 rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 heartbeat-pulse" />
                </div>
                Filter These AI Classifications:
              </h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-red-200 dark:hover:border-red-800 group">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="destructive"
                      className="hover:scale-110 transition-transform duration-300"
                    >
                      Toxic
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Harassment, insults, hate speech
                    </span>
                  </div>
                  <Switch
                    checked={filterToxic}
                    onCheckedChange={onFilterToxicChange}
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-950/20 transition-all duration-300 hover:scale-[1.02] border-2 border-transparent hover:border-yellow-200 dark:hover:border-yellow-800 group">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-500 hover:bg-yellow-600 hover:scale-110 transition-all duration-300">
                      Mild
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Emotional, frustrated, not abusive
                    </span>
                  </div>
                  <Switch
                    checked={filterMild}
                    onCheckedChange={onFilterMildChange}
                  />
                </label>

                <div className="flex items-center gap-3 p-3 rounded-lg opacity-50">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200"
                  >
                    Clean
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Harmless content (never filtered)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
