import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BasicSettingsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export function BasicSettings({
  enabled,
  onEnabledChange,
}: BasicSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Basic Settings</span>
          <Switch checked={enabled} onCheckedChange={onEnabledChange} />
        </CardTitle>
        <CardDescription>
          Enable or disable the profanity filter globally
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Filter Status</p>
            <p className="text-sm text-muted-foreground">
              {enabled
                ? "Active - Filtering enabled"
                : "Inactive - Filtering disabled"}
            </p>
          </div>
          <div
            className={`h-3 w-3 rounded-full ${
              enabled ? "bg-green-500" : "bg-gray-400"
            }`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
