import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Power,
  Shield,
  Scan,
  Trash2,
  ChartNoAxesCombined,
  AlertTriangle,
  XCircle,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";

interface BasicSettingsProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

interface Stats {
  blockedWords: number;
  pagesScanned: number;
  lastScan: string;
}

export function BasicSettings({
  enabled,
  onEnabledChange,
}: BasicSettingsProps) {
  const [stats, setStats] = useState<Stats>({
    blockedWords: 0,
    pagesScanned: 0,
    lastScan: "",
  });

  // Load stats on mount
  useEffect(() => {
    chrome.storage.local.get(
      {
        stats: { blockedWords: 0, pagesScanned: 0, lastScan: "" },
      },
      (result) => {
        setStats(result.stats);
      }
    );

    // Listen for stats updates
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes.stats) {
        setStats(changes.stats.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleClearStats = async () => {
    const clearedStats: Stats = {
      blockedWords: 0,
      pagesScanned: 0,
      lastScan: "",
    };
    await chrome.storage.local.set({ stats: clearedStats });
    setStats(clearedStats);
  };

  return (
    <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="relative">
        <div className="absolute top-6 right-6 mt-[18px]">
          <Switch
            size="3xl"
            checked={enabled}
            onCheckedChange={onEnabledChange}
          />
        </div>

        <CardTitle className="flex items-center gap-3 text-2xl pr-16">
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
        </CardTitle>
        <CardDescription className="text-base">
          Enable or disable content filtering across supported social media
          platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="space-y-4 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                <ChartNoAxesCombined className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-lg">Filter Statistics</h3>
            </div>

            {/* Clear Stats Dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Stats
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-md bg-gradient-to-br from-white via-red-50/50 to-pink-50/30 dark:from-gray-900 dark:via-red-950/30 dark:to-pink-950/20 border-2 border-red-200 dark:border-red-800 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-pink-500/5 to-red-500/5 animate-gradient opacity-50 rounded-lg" />

                <AlertDialogHeader className="relative z-10">
                  <AlertDialogTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-lg shadow-red-500/30 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 rounded-xl blur-md opacity-50 heartbeat-pulse" />
                      <AlertTriangle className="h-6 w-6 text-white relative z-10 heartbeat-pulse" />
                    </div>
                    <span className="bg-gradient-to-r from-red-600 via-pink-600 to-red-600 dark:from-red-400 dark:via-pink-400 dark:to-red-400 bg-clip-text text-transparent">
                      Clear All Statistics?
                    </span>
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base pt-4 space-y-4 relative z-10">
                    {/* Warning message */}
                    <div className="p-4 rounded-lg bg-red-100 dark:bg-red-950/50 border-2 border-red-300 dark:border-red-800">
                      <p className="text-red-900 dark:text-red-200 font-semibold flex items-center gap-2 mb-2">
                        <XCircle className="h-5 w-5 heartbeat-pulse" />
                        This action cannot be undone
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-300">
                        All your filtering statistics will be permanently
                        deleted from storage.
                      </p>
                    </div>

                    {/* Stats to be cleared */}
                    <div className="space-y-3">
                      <p className="font-semibold text-foreground">
                        The following data will be reset:
                      </p>

                      <div className="grid gap-3">
                        {/* Blocked Words */}
                        <div className="p-3 rounded-lg bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-2 border-red-200 dark:border-red-800/50 hover:shadow-md transition-all duration-300 ">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 shadow-sm">
                              <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-muted-foreground">
                                Blocked Words
                              </p>
                              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {stats.blockedWords.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Pages Scanned */}
                        <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2 border-blue-200 dark:border-blue-800/50 hover:shadow-md transition-all duration-300 ">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 shadow-sm">
                              <Scan className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-muted-foreground">
                                Pages Scanned
                              </p>
                              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {stats.pagesScanned.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Last Scan */}
                        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-2 border-purple-200 dark:border-purple-800/50 hover:shadow-md transition-all duration-300 ">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 shadow-sm">
                              <ChartNoAxesCombined className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-muted-foreground">
                                Last Scan Timestamp
                              </p>
                              <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                {stats.lastScan
                                  ? new Date(stats.lastScan).toLocaleString()
                                  : "No scans yet"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter className="relative z-10 gap-2 sm:gap-2">
                  <AlertDialogCancel className="hover:scale-105 transition-all duration-300 hover:shadow-md border-2">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearStats}
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 dark:from-red-600 dark:to-pink-600 dark:hover:from-red-700 dark:hover:to-pink-700 hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30 border-0"
                  >
                    <Trash2 className="h-4 w-4 mr-2 heartbeat-pulse" />
                    Clear Statistics
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Words Blocked Card  */}
            <div className="relative p-6 rounded-xl border-2 border-red-100 dark:border-red-900/50 bg-gradient-to-br from-red-50/50 to-pink-50/50 dark:from-red-950/20 dark:to-pink-950/20 hover:shadow-md transition-shadow duration-300 overflow-hidden group">
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 shadow-sm">
                    <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Words Blocked
                  </p>
                </div>
                <p className="text-4xl font-bold text-red-600 dark:text-red-400 mb-1">
                  {stats.blockedWords.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total filtered</p>
              </div>
              {/* Background Icon */}
              <Shield className="absolute -right-4 -bottom-4 h-32 w-32 text-red-200/20 dark:text-red-800/10 rotate-12" />
            </div>

            {/* Pages Scanned Card */}
            <div className="relative p-6 rounded-xl border-2 border-blue-100 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:shadow-md transition-shadow duration-300 overflow-hidden group">
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 shadow-sm">
                    <Scan className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Pages Scanned
                  </p>
                </div>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {stats.pagesScanned.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.lastScan
                    ? `Last: ${new Date(stats.lastScan).toLocaleDateString()}`
                    : "No scans yet"}
                </p>
              </div>
              {/* Background Icon */}
              <Scan className="absolute -right-4 -bottom-4 h-32 w-32 text-blue-200/20 dark:text-blue-800/10 rotate-12" />
            </div>
          </div>

          {/* Additional Stats Info */}
          {stats.blockedWords > 0 && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-2 border-indigo-100 dark:border-indigo-900/50 hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {(
                      stats.blockedWords / Math.max(stats.pagesScanned, 1)
                    ).toFixed(1)}
                  </span>{" "}
                  words filtered per page on average
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
