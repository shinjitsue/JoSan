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
import { X, Plus, List, Lightbulb } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

interface CustomWordsProps {
  customWords: string[];
  onAddWord: (word: string) => void;
  onRemoveWord: (word: string) => void;
}

export function CustomWords({
  customWords,
  onAddWord,
  onRemoveWord,
}: CustomWordsProps) {
  const [newWord, setNewWord] = useState("");

  const handleAdd = () => {
    if (newWord.trim() && !customWords.includes(newWord.trim().toLowerCase())) {
      onAddWord(newWord.trim().toLowerCase());
      setNewWord("");
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
            <h3 className="font-semibold text-lg">Your Custom Words</h3>
            <Badge
              variant="secondary"
              className="text-base px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
            >
              {customWords.length} word{customWords.length !== 1 ? "s" : ""}
            </Badge>
          </div>

          {customWords.length > 0 ? (
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              {customWords.map((word) => (
                <Badge
                  key={word}
                  variant="secondary"
                  className="gap-2 px-4 py-2 text-base bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-default"
                >
                  {word}
                  <button
                    onClick={() => onRemoveWord(word)}
                    className="ml-1 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    aria-label={`Remove ${word}`}
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
