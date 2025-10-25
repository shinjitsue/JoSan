import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Power, CheckCircle2, PauseCircle } from "lucide-react";

interface BasicSettingsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export function BasicSettings({
  enabled,
  onEnabledChange,
}: BasicSettingsProps) {
  return (
    <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-2xl">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                enabled
                  ? "bg-indigo-100 dark:bg-indigo-900/30"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <Power
                className={`h-5 w-5 ${
                  enabled
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-400"
                }`}
              />
            </div>
            <span>Filter Status</span>
          </div>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </CardTitle>
        <CardDescription className="text-base">
          Enable or disable content filtering globally
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <div className="px-2">
            <p className="font-semibold text-lg flex items-center gap-2">
              {enabled ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span>Active</span>
                </>
              ) : (
                <>
                  <PauseCircle className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span>Inactive</span>
                </>
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {enabled
                ? "Content filtering is enabled"
                : "Content filtering is disabled"}
            </p>
          </div>
          <div
            className={`h-4 w-4 rounded-full ${
              enabled
                ? "bg-green-500 shadow-lg shadow-green-500/50"
                : "bg-gray-400"
            } transition-all duration-300`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
