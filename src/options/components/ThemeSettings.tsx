import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";

interface ThemeSettingsProps {
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

export function ThemeSettings({ theme, onThemeChange }: ThemeSettingsProps) {
  const themes = [
    { id: "light" as const, name: "Light", icon: Sun },
    { id: "dark" as const, name: "Dark", icon: Moon },
    { id: "system" as const, name: "System", icon: Monitor },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Choose your preferred theme or follow system settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ id, name, icon: Icon }) => (
            <Button
              key={id}
              variant={theme === id ? "default" : "outline"}
              onClick={() => onThemeChange(id)}
              className="flex flex-col items-center gap-2 h-auto py-4"
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
