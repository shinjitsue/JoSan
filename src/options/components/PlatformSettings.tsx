import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Globe } from "lucide-react";
import {
  FaFacebook,
  FaInstagram,
  FaReddit,
  FaLinkedin,
  FaTiktok,
  FaYoutube,
  FaTumblr,
  FaQuora,
  FaDiscord,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { SiThreads, SiBluesky } from "react-icons/si";
import type { IconType } from "react-icons";

interface PlatformSettingsProps {
  enabledPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
}

interface Platform {
  id: string;
  name: string;
  color: string;
  icon: IconType;
}

const PLATFORMS: Platform[] = [
  { id: "facebook", name: "Facebook", color: "bg-blue-600", icon: FaFacebook },
  {
    id: "twitter",
    name: "Twitter/X",
    color: "bg-black ",
    icon: FaXTwitter,
  },
  {
    id: "instagram",
    name: "Instagram",
    color: "bg-pink-600",
    icon: FaInstagram,
  },
  { id: "reddit", name: "Reddit", color: "bg-orange-600", icon: FaReddit },
  { id: "linkedin", name: "LinkedIn", color: "bg-blue-700", icon: FaLinkedin },
  { id: "tiktok", name: "TikTok", color: "bg-black", icon: FaTiktok },
  { id: "youtube", name: "YouTube", color: "bg-red-600", icon: FaYoutube },
  { id: "tumblr", name: "Tumblr", color: "bg-indigo-900", icon: FaTumblr },
  { id: "quora", name: "Quora", color: "bg-red-700", icon: FaQuora },
  { id: "threads", name: "Threads", color: "bg-gray-800", icon: SiThreads },
  { id: "discord", name: "Discord", color: "bg-indigo-600", icon: FaDiscord },
  { id: "bluesky", name: "BlueSky", color: "bg-sky-600", icon: SiBluesky },
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
    <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
            <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          Active Platforms
        </CardTitle>
        <CardDescription className="text-base">
          Choose which social media platforms should have filtering enabled
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PLATFORMS.map((platform) => {
            const Icon = platform.icon;
            const isEnabled = enabledPlatforms.includes(platform.id);

            return (
              <label
                key={platform.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 hover:shadow-md cursor-pointer transition-all duration-300 ${
                  isEnabled
                    ? "border-indigo-300 dark:border-indigo-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 shadow-sm"
                    : "border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-white dark:bg-gray-900/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full ${
                      platform.color
                    } shadow-md flex items-center justify-center transition-transform duration-300 ${
                      isEnabled ? "scale-110" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-base">{platform.name}</span>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => togglePlatform(platform.id)}
                />
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
