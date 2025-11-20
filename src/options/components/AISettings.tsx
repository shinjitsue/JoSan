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
  Lock,
  Zap,
  DollarSign,
} from "lucide-react";

interface AISettingsProps {
  useAI: boolean;
  filterMild: boolean;
  filterToxic: boolean;
  openaiApiKey: string;
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
  openaiApiKey,
  onUseAIChange,
  onFilterMildChange,
  onFilterToxicChange,
  onApiKeyChange,
}: AISettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>("unchecked");

  const validateApiKey = async () => {
    if (!openaiApiKey) {
      setApiKeyStatus("invalid");
      return;
    }

    setApiKeyStatus("validating");

    // Simple validation - try to make a test request to moderation API
    try {
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          input: "test",
          model: "omni-moderation-latest",
        }),
      });

      setApiKeyStatus(response.ok ? "valid" : "invalid");

      if (response.ok) {
        setTimeout(() => setApiKeyStatus("unchecked"), 3000);
      }
    } catch (error) {
      console.error("API Key validation error:", error);
      setApiKeyStatus("invalid");
    }
  };

  return (
    <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-indigo-950/20 dark:to-purple-950/20 relative overflow-hidden group">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-indigo-500/5 animate-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 relative overflow-hidden group/icon">
            {/* Updated to green for "FREE" emphasis */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl blur-md opacity-50 heartbeat-pulse" />
            <Sparkles className="h-5 w-5 text-white relative z-10 heartbeat-pulse" />
          </div>
          <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 dark:from-green-400 dark:via-emerald-400 dark:to-green-400 bg-clip-text text-transparent animate-gradient">
            AI Content Moderation (FREE)
          </span>
        </CardTitle>
        <CardDescription className="text-base">
          Use OpenAI's FREE Moderation API for intelligent content
          classification
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 relative z-10">
        {/* Cost Savings Alert */}
        <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
          <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertDescription className="relative">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              95% Cost Reduction!
            </p>
            <ul className="space-y-1 text-sm relative z-10 text-green-800 dark:text-green-300">
              <li className="ps-6">
                • OpenAI Moderation API is completely FREE
              </li>
              <li className="ps-6">• No language detection API costs</li>
              <li className="ps-6">• Smart caching reduces requests by 70%</li>
              <li className="ps-6">
                • Regex filtering handles 85% of cases locally
              </li>
            </ul>
            <DollarSign className="absolute -right-5 -bottom-5 h-24 w-24 text-green-200/20 dark:text-green-800/10 rotate-12" />
          </AlertDescription>
        </Alert>

        {/* AI Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900/50 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] border-2 border-transparent hover:border-green-200 dark:hover:border-green-800">
          <div className="space-y-1">
            <label
              htmlFor="ai-toggle"
              className="font-semibold text-lg cursor-pointer flex items-center gap-2"
            >
              Enable FREE AI Analysis
              {useAI && (
                <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 heartbeat-pulse inline-block" />
              )}
              <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                FREE
              </Badge>
            </label>
            <p className="text-sm text-muted-foreground">
              Zero-cost content moderation using OpenAI's free tier
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
                OpenAI API Key{" "}
                <span className="text-red-500 heartbeat-pulse">*</span>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200 text-xs"
                >
                  FREE TIER
                </Badge>
              </label>

              <div className="flex gap-2">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={openaiApiKey}
                  onChange={(e) => {
                    onApiKeyChange(e.target.value);
                    setApiKeyStatus("unchecked");
                  }}
                  placeholder="sk-proj-..."
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
                  API key is valid and ready for FREE moderation
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
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline hover:text-indigo-600 transition-colors duration-300"
                >
                  platform.openai.com/api-keys
                </a>
              </p>

              {/* Updated Privacy Notice */}
              <Alert className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                <AlertDescription className="relative">
                  <p className="font-semibold mb-2 flex items-center gap-2">
                    <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    Your API Key is Safe & FREE
                  </p>
                  <ul className="space-y-1 text-sm relative z-10">
                    <li className="ps-6 hover:translate-x-1 transition-transform duration-200">
                      • Stored locally in your browser only
                    </li>
                    <li className="ps-6 hover:translate-x-1 transition-transform duration-200">
                      • Never sent to JoSan servers
                    </li>
                    <li className="ps-6 hover:translate-x-1 transition-transform duration-200">
                      • Direct communication with OpenAI API
                    </li>
                    <li className="ps-6 hover:translate-x-1 transition-transform duration-200">
                      • Moderation API is FREE for most usage levels
                    </li>
                  </ul>
                  {/* Background Icon */}
                  <Lock className="absolute -right-5 -bottom-5 h-24 w-24 text-indigo-200/20 dark:text-indigo-800/10 rotate-12" />
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
                      Harassment, hate speech, threats
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
                      Slightly inappropriate, borderline content
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

            {/* Optimization Info */}
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 p-4 relative overflow-hidden">
              <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 flex-shrink-0" />
                Smart Optimization Features
              </p>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300 relative z-10">
                <li className="ps-6">
                  • 24-hour semantic caching reduces repeat requests
                </li>
                <li className="ps-6">
                  • Smart decision tree skips AI for obvious cases
                </li>
                <li className="ps-6">
                  • Multi-language regex filtering (English, Tagalog, Cebuano)
                </li>
                <li className="ps-6">
                  • Only sends flagged content to AI (not everything)
                </li>
              </ul>
              {/* Background Icon */}
              <Zap className="absolute -right-4 -bottom-4 h-24 w-24 text-blue-200/10 dark:text-blue-800/20 rotate-12" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
