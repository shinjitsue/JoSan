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
import { X, Plus } from "lucide-react";

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
    <Card>
      <CardHeader>
        <CardTitle>Custom Filter Words</CardTitle>
        <CardDescription>Add your own words to the filter list</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a word to filter..."
          />
          <Button onClick={handleAdd} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {customWords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {customWords.map((word) => (
              <Badge key={word} variant="secondary" className="gap-1">
                {word}
                <button
                  onClick={() => onRemoveWord(word)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No custom words added yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
