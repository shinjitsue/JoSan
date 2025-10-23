export class ProfanityLoader {
  static async loadWordList(): Promise<Set<string>> {
    try {
      const response = await fetch(chrome.runtime.getURL("data/en.txt"));

      if (!response.ok) {
        throw new Error(`Failed to load profanity list: ${response.status}`);
      }

      const text = await response.text();
      const words = text
        .split("\n")
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length > 0);

      return new Set(words);
    } catch (error) {
      console.error("[JoSan] Failed to load word list:", error);
      return new Set();
    }
  }

  static compileRegex(wordSet: Set<string>): RegExp | null {
    if (wordSet.size === 0) {
      console.warn("[JoSan] No words to filter, regex not compiled");
      return null;
    }

    const escapedWords = Array.from(wordSet)
      .map((w) => ProfanityLoader.escapeRegExp(w))
      .join("|");

    return new RegExp(`\\b(${escapedWords})\\b`, "gi");
  }

  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
