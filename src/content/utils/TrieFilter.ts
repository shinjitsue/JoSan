interface TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;
  language?: string;
}

interface MatchResult {
  word: string;
  startIndex: number;
  endIndex: number;
  language?: string;
}

export class TrieFilter {
  private root: TrieNode;
  private wordCount: number = 0;

  constructor() {
    this.root = {
      children: new Map(),
      isEndOfWord: false,
    };
  }

  addWord(word: string, language?: string): void {
    const normalized = word.toLowerCase().trim();
    if (!normalized) return;

    let current = this.root;

    for (const char of normalized) {
      if (!current.children.has(char)) {
        current.children.set(char, {
          children: new Map(),
          isEndOfWord: false,
        });
      }
      current = current.children.get(char)!;
    }

    if (!current.isEndOfWord) {
      this.wordCount++;
    }
    current.isEndOfWord = true;
    if (language) {
      current.language = language;
    }
  }

  // Enhanced word-boundary matching for more precise detection
  findMatches(text: string, startIndex: number): MatchResult[] {
    const matches: MatchResult[] = [];
    const lowerText = text.toLowerCase();

    // Only start matching at word boundaries (letter/number or start of string)
    if (startIndex > 0) {
      const prevChar = lowerText[startIndex - 1];
      const currentChar = lowerText[startIndex];

      // Skip if we're not at a word boundary
      if (/[a-z0-9]/.test(prevChar) && /[a-z0-9]/.test(currentChar)) {
        return matches;
      }
    }

    let current = this.root;
    let i = startIndex;

    while (i < lowerText.length) {
      const char = lowerText[i];

      if (current.children.has(char)) {
        current = current.children.get(char)!;
        i++;

        // Check if we found a complete word
        if (current.isEndOfWord) {
          const matchEnd = i;

          // Verify this is a complete word boundary
          const isWordBoundary =
            matchEnd >= lowerText.length ||
            !/[a-z0-9]/.test(lowerText[matchEnd]);

          if (isWordBoundary) {
            matches.push({
              word: lowerText.substring(startIndex, i),
              startIndex: startIndex,
              endIndex: i - 1,
              language: current.language,
            });
          }
        }
      } else {
        // No match found, break the search
        break;
      }
    }

    return matches;
  }

  // Enhanced filterText with character-by-character masking - FIXED DEFAULT PARAMETER
  filterText(
    text: string,
    replacement: string = "*"
  ): { filteredText: string; matchCount: number; detectedLanguages: string[] } {
    if (!text)
      return { filteredText: text, matchCount: 0, detectedLanguages: [] };

    const originalText = text;
    const lowerText = text.toLowerCase();
    let filteredText = originalText;
    let matchCount = 0;
    const detectedLanguages = new Set<string>();

    // Process text character by character to find all matches
    const processedRanges: Array<{ start: number; end: number }> = [];

    for (let i = 0; i < lowerText.length; i++) {
      // Skip if this position is already processed
      if (processedRanges.some((range) => i >= range.start && i < range.end)) {
        continue;
      }

      const matches = this.findMatches(lowerText, i);

      if (matches.length > 0) {
        // Use the longest match to avoid partial word replacement
        const longestMatch = matches.reduce(
          (prev: MatchResult, current: MatchResult) =>
            current.word.length > prev.word.length ? current : prev
        );

        const matchStart = longestMatch.startIndex;
        const matchEnd = longestMatch.endIndex + 1;
        const matchedWord = originalText.substring(matchStart, matchEnd);

        // Create replacement: same number of asterisks as original word length
        const wordReplacement = replacement.repeat(matchedWord.length);

        // Replace the matched word while preserving case structure if needed
        filteredText =
          filteredText.substring(0, matchStart) +
          wordReplacement +
          filteredText.substring(matchEnd);

        // Track processed range
        processedRanges.push({ start: matchStart, end: matchEnd });

        matchCount++;

        if (longestMatch.language) {
          detectedLanguages.add(longestMatch.language);
        }

        // Skip ahead to end of current match
        i = longestMatch.endIndex;

        console.log(
          `[JoSan Trie] Masked "${matchedWord}" → "${wordReplacement}" (${longestMatch.word.length} chars)`
        );
      }
    }

    return {
      filteredText,
      matchCount,
      detectedLanguages: Array.from(detectedLanguages),
    };
  }

  containsWord(word: string): boolean {
    const normalized = word.toLowerCase().trim();
    let current = this.root;

    for (const char of normalized) {
      if (!current.children.has(char)) {
        return false;
      }
      current = current.children.get(char)!;
    }

    return current.isEndOfWord;
  }

  getWordCount(): number {
    return this.wordCount;
  }

  getMemoryEstimate(): number {
    // Rough estimate: each node ~100 bytes on average
    let nodeCount = 0;

    const countNodes = (node: TrieNode): void => {
      nodeCount++;
      node.children.forEach((child) => countNodes(child));
    };

    countNodes(this.root);
    return nodeCount * 100; // bytes
  }

  getStats(): { wordCount: number; memoryEstimateBytes: number } {
    return {
      wordCount: this.wordCount,
      memoryEstimateBytes: this.getMemoryEstimate(),
    };
  }

  // For debugging
  getAllWords(): string[] {
    const words: string[] = [];

    const traverse = (node: TrieNode, currentWord: string): void => {
      if (node.isEndOfWord) {
        words.push(currentWord);
      }

      node.children.forEach((child, char) => {
        traverse(child, currentWord + char);
      });
    };

    traverse(this.root, "");
    return words;
  }
}
