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
    <Card className="border-2 border-indigo-200 dark:border-indigo-800 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 dark:from-gray-900 dark:via-indigo-950/20 dark:to-purple-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          AI-Powered Context Analysis
        </CardTitle>
        <CardDescription className="text-base">
          Use Llama-3.1 8B via Groq for intelligent content classification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-900/50 shadow-sm">
          <div className="space-y-1">
            <label htmlFor="ai-toggle" className="font-semibold text-lg">
              Enable AI Double-Check
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
          <>
            {/* API Key Section */}
            <div className="space-y-4 rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm">
              <label className="text-base font-semibold flex items-center gap-2">
                Groq API Key <span className="text-red-500">*</span>
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
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
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
                  className="min-w-[100px]"
                >
                  {apiKeyStatus === "validating" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {apiKeyStatus === "validating" ? "Checking..." : "Validate"}
                </Button>
              </div>

              {/* Status Messages */}
              {apiKeyStatus === "valid" && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  API key is valid
                </div>
              )}
              {apiKeyStatus === "invalid" && (
                <div className="flex items-center gap-2 text-sm text-red-600">
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
                  className="text-blue-600 hover:underline"
                >
                  console.groq.com/keys
                </a>
              </p>

              {/* Privacy Notice */}
              <Alert className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30">
                <AlertDescription>
                  <p className="font-semibold mb-2">🔒 Your API Key is Safe</p>
                  <ul className="space-y-1 text-sm">
                    <li>• Stored locally in your browser only</li>
                    <li>• Never sent to JoSan servers</li>
                    <li>• Direct communication with Groq API</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>

            {/* Filter Classifications */}
            <div className="space-y-4 rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm">
              <h3 className="font-semibold text-lg">
                Filter These AI Classifications:
              </h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">Toxic</Badge>
                    <span className="text-sm text-muted-foreground">
                      Harassment, insults, hate speech
                    </span>
                  </div>
                  <Switch
                    checked={filterToxic}
                    onCheckedChange={onFilterToxicChange}
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">
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

                <div className="flex items-center gap-3 opacity-50">
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
