import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface PlatformSettingsProps {
  enabledPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
}

const PLATFORMS = [
  { id: "facebook", name: "Facebook", color: "bg-blue-600" },
  { id: "twitter", name: "Twitter/X", color: "bg-sky-500" },
  { id: "instagram", name: "Instagram", color: "bg-pink-600" },
  { id: "reddit", name: "Reddit", color: "bg-orange-600" },
  { id: "linkedin", name: "LinkedIn", color: "bg-blue-700" },
  { id: "tiktok", name: "TikTok", color: "bg-black" },
  { id: "youtube", name: "YouTube", color: "bg-red-600" },
  { id: "tumblr", name: "Tumblr", color: "bg-indigo-900" },
  { id: "quora", name: "Quora", color: "bg-red-700" },
  { id: "threads", name: "Threads", color: "bg-gray-800" },
  { id: "discord", name: "Discord", color: "bg-indigo-600" },
  { id: "bluesky", name: "BlueSky", color: "bg-sky-600" },
];

export function PlatformSettings({
  enabledPlatforms,
  onPlatformsChange,
}: PlatformSettingsProps) {
  const togglePlatform = (platformId: string) => {
    const newPlatforms = enabledPlatforms.includes(platformId)
      ? enabledPlatforms.filter((p) => p !== platformId)
      : [...enabledPlatforms, platformId];
    onPlatformsChange(newPlatforms);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Platforms</CardTitle>
        <CardDescription>
          Choose which social media platforms should have filtering enabled
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PLATFORMS.map((platform) => (
            <label
              key={platform.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${platform.color}`} />
                <span className="font-medium">{platform.name}</span>
              </div>
              <Switch
                checked={enabledPlatforms.includes(platform.id)}
                onCheckedChange={() => togglePlatform(platform.id)}
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary">
            {enabledPlatforms.length} of {PLATFORMS.length} active
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
