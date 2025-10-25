import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor, Palette } from "lucide-react";

interface ThemeSettingsProps {
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

export function ThemeSettings({ theme, onThemeChange }: ThemeSettingsProps) {
  const themes = [
    {
      id: "light" as const,
      name: "Light",
      icon: Sun,
      gradient: "from-indigo-400 to-purple-500",
    },
    {
      id: "dark" as const,
      name: "Dark",
      icon: Moon,
      gradient: "from-indigo-700 to-purple-800",
    },
    {
      id: "system" as const,
      name: "System",
      icon: Monitor,
      gradient: "from-blue-700 to-cyan-700",
    },
  ];

  return (
    <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
            <Palette className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          Appearance
        </CardTitle>
        <CardDescription className="text-base">
          Choose your preferred theme or follow system settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {themes.map(({ id, name, icon: Icon, gradient }) => (
            <Button
              key={id}
              variant={theme === id ? "default" : "outline"}
              onClick={() => onThemeChange(id)}
              className={`flex flex-col items-center gap-3 h-auto py-6 transition-all duration-300 ${
                theme === id
                  ? `bg-gradient-to-br ${gradient} text-white shadow-lg hover:shadow-xl border-0`
                  : "hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-base font-medium">{name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
