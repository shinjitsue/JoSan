import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Switch } from "../../components/ui/switch";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Shield, Lock, Eye, Database, ShieldCheck } from "lucide-react";

export function PrivacySettings() {
  return (
    <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
            <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          Privacy & Security
        </CardTitle>
        <CardDescription className="text-base">
          Your privacy is our top priority
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Privacy Notice */}
        <Alert className="border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 relative overflow-hidden">
          <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400 " />
          <AlertDescription className="relative">
            <p className="font-semibold mb-3 text-base text-indigo-900 dark:text-indigo-200">
              Privacy First Design
            </p>
            <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-300">
              <li>✓ Filters only public social media feeds</li>
              <li>✓ Never accesses private messages or DMs</li>
              <li>✓ AI only checks flagged content (not everything)</li>
              <li>✓ Your API key is stored locally in your browser</li>
              <li>✓ No data sent to JoSan servers</li>
            </ul>
            {/* Background Icon */}
            <Lock className="absolute -right-4 -bottom-4 h-32 w-32 text-indigo-200/20 dark:text-indigo-800/10 rotate-12" />
          </AlertDescription>
        </Alert>

        {/* Filter Feeds Only Toggle */}
        <div className="rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm opacity-75">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <label
                htmlFor="feeds-only"
                className="font-semibold text-lg flex items-center gap-2"
              >
                Filter Feeds Only (Always Enabled)
              </label>
              <p className="text-sm text-muted-foreground pr-4">
                Only filter public content, exclude private messages and input
                fields.
              </p>
            </div>
            <Switch
              id="feeds-only"
              checked={true}
              onCheckedChange={() => {}}
              disabled={true}
              className="cursor-not-allowed pointer-events-none"
            />
          </div>
        </div>

        {/* What We Filter vs What We Don't */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-base text-green-900 dark:text-green-200 mb-2">
                  What We Filter
                </p>
                <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
                  <li>• Public posts</li>
                  <li>• Comments & replies</li>
                  <li>• News feeds</li>
                  <li>• Timeline content</li>
                </ul>
              </div>
            </div>
            {/* Background Icon */}
            <Eye className="absolute -right-4 -bottom-4 h-32 w-32 text-green-200/20 dark:text-green-800/10 rotate-12" />
          </div>

          <div className="rounded-xl border-2 border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-start gap-3 relative z-10">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                <Database className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-base text-red-900 dark:text-red-200 mb-2">
                  What We Never Touch
                </p>
                <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                  <li>• Direct messages</li>
                  <li>• Private chats</li>
                  <li>• Input fields</li>
                  <li>• Passwords</li>
                </ul>
              </div>
            </div>
            {/* Background Icon */}
            <Database className="absolute -right-4 -bottom-4 h-32 w-32 text-red-200/20 dark:text-red-800/10 rotate-12" />
          </div>
        </div>

        {/* Security Features */}
        <div className="rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            Security Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              <p className="font-medium text-sm mb-1">Local Processing</p>
              <p className="text-xs text-muted-foreground">
                All regex filtering happens on your device
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              <p className="font-medium text-sm mb-1">Encrypted Storage</p>
              <p className="text-xs text-muted-foreground">
                Settings stored securely in your browser
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              <p className="font-medium text-sm mb-1">No Tracking</p>
              <p className="text-xs text-muted-foreground">
                Zero analytics or data collection
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              <p className="font-medium text-sm mb-1">Open Source</p>
              <p className="text-xs text-muted-foreground">
                Fully auditable code on GitHub
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
