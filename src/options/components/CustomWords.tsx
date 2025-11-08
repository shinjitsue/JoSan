import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus, List, Lightbulb, Trash2, AlertTriangle } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
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

interface CustomWordsProps {
  customWords: string[];
  onAddWord: (word: string) => void;
  onRemoveWord: (word: string) => void;
  onClearAll?: () => void;
}

export function CustomWords({
  customWords,
  onAddWord,
  onRemoveWord,
  onClearAll,
}: CustomWordsProps) {
  const [newWord, setNewWord] = useState("");

  const handleAdd = () => {
    if (newWord.trim() && !customWords.includes(newWord.trim().toLowerCase())) {
      onAddWord(newWord.trim().toLowerCase());
      setNewWord("");
    }
  };

  const handleClearAll = () => {
    // Use dedicated handler if provided, otherwise remove one by one
    if (onClearAll) {
      onClearAll();
    } else {
      customWords.forEach((word) => onRemoveWord(word));
    }
  };

  return (
    <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
            <List className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          Custom Filter Words
        </CardTitle>
        <CardDescription className="text-base">
          Add your own words and phrases to the filter list
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Word Input */}
        <div className="space-y-4 rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm">
          <label className="text-base font-semibold">Add New Word</label>
          <div className="flex gap-2">
            <Input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Enter a word to filter..."
              className="text-base"
            />
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Press Enter <Kbd>⏎</Kbd> or click Add to include the word in your
            filter list
          </p>
        </div>

        {/* Custom Words List */}
        <div className="space-y-4 rounded-xl border-2 bg-white dark:bg-gray-900/50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg">Your Custom Words</h3>
              <Badge
                variant="secondary"
                className="text-sm px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
              >
                {customWords.length} word{customWords.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Clear All Button */}
            {customWords.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 transition-all duration-300 hover:scale-105"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md bg-gradient-to-br from-white via-red-50/50 to-pink-50/30 dark:from-gray-900 dark:via-red-950/30 dark:to-pink-950/20 border-2 border-red-200 dark:border-red-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-lg bg-red-500 shadow-md">
                        <Trash2 className="h-5 w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent">
                        Clear All Custom Words?
                      </span>
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-base pt-2 space-y-3">
                      <p className="text-foreground">
                        This will remove all{" "}
                        <strong>{customWords.length}</strong> custom word
                        {customWords.length !== 1 ? "s" : ""} from your filter
                        list.
                      </p>
                      <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-800">
                        <p className="text-sm text-red-900 dark:text-red-200 font-medium flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          This action cannot be undone
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="hover:scale-105 transition-transform">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAll}
                      className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 hover:scale-105 transition-all"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Words
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {customWords.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              {customWords.map((word) => (
                <Badge
                  key={word}
                  variant="secondary"
                  className="gap-2 px-4 py-2 text-base bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-default group"
                >
                  <span>{word}</span>
                  <button
                    onClick={() => onRemoveWord(word)}
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors hover:scale-110"
                    aria-label={`Remove ${word}`}
                    title={`Remove "${word}"`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              <div className="p-4 rounded-full bg-white dark:bg-gray-800 mb-4">
                <List className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-base text-muted-foreground text-center font-medium">
                No custom words added yet
              </p>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Add words above to start building your custom filter list
              </p>
            </div>
          )}
        </div>

        {/* Info Alert */}
        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 p-4 relative overflow-hidden">
          <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-2 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 flex-shrink-0" />
            Pro Tip
          </p>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300 relative z-10">
            <li className="ps-6">
              • Custom words are added to the base profanity list
            </li>
            <li className="ps-6">• Words are case-insensitive</li>
            <li className="ps-6">• Filtered across all enabled platforms</li>
          </ul>
          {/* Background Icon */}
          <Lightbulb className="absolute -right-4 -bottom-4 h-24 w-24 text-blue-200/10 dark:text-blue-800/20 rotate-12" />
        </div>
      </CardContent>
    </Card>
  );
}
