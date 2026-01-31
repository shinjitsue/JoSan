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
} from "lucide-react";

interface AISettingsProps {
  useAI: boolean;
  filterMild: boolean;
  filterToxic: boolean;
  filterMode: "interactive" | "strict";
  openaiApiKey: string;
  onUseAIChange: (useAI: boolean) => void;
  onFilterMildChange: (filterMild: boolean) => void;
  onFilterToxicChange: (filterToxic: boolean) => void;
  onFilterModeChange: (mode: "interactive" | "strict") => void;
  onApiKeyChange: (apiKey: string) => void;
}

type ApiKeyStatus = "unchecked" | "validating" | "valid" | "invalid";

export function AISettings({
  useAI,
  filterMild,
  filterToxic,
  filterMode,
  openaiApiKey,
  onUseAIChange,
  onFilterMildChange,
  onFilterToxicChange,
  onFilterModeChange,
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
        // Immediately push key to background
        chrome.runtime.sendMessage({
          type: "SET_API_KEY",
          apiKey: openaiApiKey,
        });
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
          Use OpenAI's Moderation API for intelligent content classification
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
                OpenAI API Key{" "}
                <span className="text-red-500 heartbeat-pulse">*</span>
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
                Get your API key at{" "}
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
                    Your API Key is Safe
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

            {/* Filtering Mode */}
            <div className="space-y-4 rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
                  <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                Content Visibility Mode
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose how filtered content is displayed on the page
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Interactive Mode Card */}
                <button
                  type="button"
                  onClick={() => onFilterModeChange("interactive")}
                  className={`relative cursor-pointer p-5 rounded-xl border-2 transition-all duration-300 text-left group hover:shadow-lg ${
                    filterMode === "interactive"
                      ? "border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 shadow-md ring-2 ring-indigo-200 dark:ring-indigo-800"
                      : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                >
                  {/* Selection indicator */}
                  <div
                    className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      filterMode === "interactive"
                        ? "border-indigo-500 bg-indigo-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {filterMode === "interactive" && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                      filterMode === "interactive"
                        ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
                        : "bg-gray-100 dark:bg-gray-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30"
                    }`}
                  >
                    <Eye
                      className={`h-6 w-6 transition-colors duration-300 ${
                        filterMode === "interactive"
                          ? "text-white"
                          : "text-gray-500 group-hover:text-indigo-500"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-lg transition-colors duration-300 ${
                          filterMode === "interactive"
                            ? "text-indigo-700 dark:text-indigo-300"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        Interactive
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                        Default
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Filtered content shows a badge. Click to reveal the
                      original text, and hide it again anytime.
                    </p>
                  </div>

                  {/* Features list */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Click eye icon to reveal content
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Hide content again with one click
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      Full control over what you see
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-4 p-3 rounded-lg bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-muted-foreground mb-2 block">
                      Preview:
                    </span>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 border border-red-200 dark:border-red-800">
                      <span className="text-red-600 dark:text-red-400 font-semibold text-sm">
                        Harmful Content Blocked
                      </span>
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-700">
                        <Eye className="h-3 w-3 text-red-500" />
                      </span>
                    </div>
                  </div>
                </button>

                {/* Strict Mode Card */}
                <button
                  type="button"
                  onClick={() => onFilterModeChange("strict")}
                  className={`relative cursor-pointer p-5 rounded-xl border-2 transition-all duration-300 text-left group hover:shadow-lg ${
                    filterMode === "strict"
                      ? "border-red-400 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/40 dark:to-orange-950/40 shadow-md ring-2 ring-red-200 dark:ring-red-800"
                      : "border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700"
                  }`}
                >
                  {/* Selection indicator */}
                  <div
                    className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                      filterMode === "strict"
                        ? "border-red-500 bg-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {filterMode === "strict" && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                      filterMode === "strict"
                        ? "bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/30"
                        : "bg-gray-100 dark:bg-gray-800 group-hover:bg-red-100 dark:group-hover:bg-red-900/30"
                    }`}
                  >
                    <EyeOff
                      className={`h-6 w-6 transition-colors duration-300 ${
                        filterMode === "strict"
                          ? "text-white"
                          : "text-gray-500 group-hover:text-red-500"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-lg transition-colors duration-300 ${
                          filterMode === "strict"
                            ? "text-red-700 dark:text-red-300"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        Strict
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
                        Maximum Protection
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Permanently blocks harmful content. No option to reveal
                      filtered text.
                    </p>
                  </div>

                  {/* Features list */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      Content is permanently hidden
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      No reveal option available
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      Best for sensitive users
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-4 p-3 rounded-lg bg-white/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-muted-foreground mb-2 block">
                      Preview:
                    </span>
                    <span className="inline-block px-3 py-1.5 rounded-md bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 font-semibold text-sm">
                      Harmful Content Blocked
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
