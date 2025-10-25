import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Switch } from "../../components/ui/switch";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Shield, Lock, Eye, Database } from "lucide-react";

interface PrivacySettingsProps {
  filterFeedsOnly: boolean;
  onFilterFeedsOnlyChange: (value: boolean) => void;
}

export function PrivacySettings({
  filterFeedsOnly,
  onFilterFeedsOnlyChange,
}: PrivacySettingsProps) {
  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Privacy & Security
        </CardTitle>
        <CardDescription>Your privacy is our top priority</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Privacy First Design</p>
            <ul className="space-y-1 text-sm">
              <li>✓ Filters only public social media feeds</li>
              <li>✓ Never accesses private messages or DMs</li>
              <li>✓ AI only checks flagged content (not everything)</li>
              <li>✓ Your API key is stored locally in your browser</li>
              <li>✓ No data sent to JoSan servers</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-4 rounded-lg border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label htmlFor="feeds-only" className="font-medium">
                Filter Feeds Only (Recommended)
              </label>
              <p className="text-sm text-muted-foreground">
                Only filter public content, exclude private messages and input
                fields
              </p>
            </div>
            <Switch
              id="feeds-only"
              checked={filterFeedsOnly}
              onCheckedChange={onFilterFeedsOnlyChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
            <Eye className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-green-900">
                What We Filter
              </p>
              <p className="text-xs text-green-700 mt-1">
                Public posts, comments, feeds, timelines
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <Database className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-red-900">
                What We Never Touch
              </p>
              <p className="text-xs text-red-700 mt-1">
                DMs, chats, input fields, passwords
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
