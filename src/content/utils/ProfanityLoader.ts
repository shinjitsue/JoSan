import { BloomFilter } from "./BloomFilter";
import { TrieFilter } from "./TrieFilter";
import { TextNormalizer } from "./TextNormalizer";

export interface WordListData {
  bloom: BloomFilter;
  trie: TrieFilter;
  wordCount: number;
  language: string;
  words?: string[]; // Store words for obfuscation detection
}

export class ProfanityLoader {
  private static readonly CACHE_KEY = "josan_wordlist_cache";
  private static readonly CACHE_VERSION = "1.0";

  static async loadWordList(
    language: string,
    filename: string
  ): Promise<WordListData> {
    try {
      // Try to load from cache first
      const cached = await this.loadFromCache(language);
      if (cached) {
        console.log(
          `[JoSan] Loaded ${language} wordlist from cache (${cached.wordCount} words)`
        );
        return cached;
      }

      console.log(`[JoSan] Loading ${language} wordlist from ${filename}...`);
      const response = await fetch(chrome.runtime.getURL(`data/${filename}`));

      if (!response.ok) {
        throw new Error(
          `Failed to load ${language} wordlist: ${response.status}`
        );
      }

      const text = await response.text();
      const words = text
        .split("\n")
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length > 0);

      const wordListData = this.createWordListData(words, language);

      // Cache the result
      await this.saveToCache(language, wordListData);

      console.log(`[JoSan] Loaded ${words.length} ${language} words`);
      return wordListData;
    } catch (error) {
      console.error(`[JoSan] Failed to load ${language} word list:`, error);
      return this.createWordListData([], language);
    }
  }

  private static createWordListData(
    words: string[],
    language: string
  ): WordListData {
    const bloom = new BloomFilter(words.length, 0.01); // 1% false positive rate
    const trie = new TrieFilter();

    words.forEach((word) => {
      bloom.add(word);
      trie.addWord(word, language);
    });

    return {
      bloom,
      trie,
      wordCount: words.length,
      language,
      words, // Store words for obfuscation detection
    };
  }

  private static async loadFromCache(
    language: string
  ): Promise<WordListData | null> {
    try {
      const result = await chrome.storage.local.get([this.CACHE_KEY]);
      const cache = result[this.CACHE_KEY];

      if (!cache || cache.version !== this.CACHE_VERSION || !cache[language]) {
        return null;
      }

      const cached = cache[language];

      // Reconstruct Bloom filter
      const bloom = new BloomFilter(cached.wordCount, 0.01);
      cached.words.forEach((word: string) => bloom.add(word));

      // Reconstruct Trie
      const trie = new TrieFilter();
      cached.words.forEach((word: string) => trie.addWord(word, language));

      return {
        bloom,
        trie,
        wordCount: cached.wordCount,
        language,
        words: cached.words, // Include words for obfuscation detection
      };
    } catch (error) {
      console.warn(`[JoSan] Failed to load ${language} from cache:`, error);
      return null;
    }
  }

  private static async saveToCache(
    language: string,
    wordListData: WordListData
  ): Promise<void> {
    try {
      const result = await chrome.storage.local.get([this.CACHE_KEY]);
      const cache = result[this.CACHE_KEY] || { version: this.CACHE_VERSION };

      cache[language] = {
        wordCount: wordListData.wordCount,
        words: wordListData.trie.getAllWords(), // Store words for reconstruction
        timestamp: Date.now(),
      };

      await chrome.storage.local.set({ [this.CACHE_KEY]: cache });
      console.log(`[JoSan] Cached ${language} wordlist`);
    } catch (error) {
      console.warn(`[JoSan] Failed to cache ${language} wordlist:`, error);
    }
  }

  // Fast two-stage filtering with obfuscation detection
  static filterText(
    text: string,
    wordListData: WordListData,
    replacement: string = "*"
  ): {
    filteredText: string;
    matchCount: number;
    detectedLanguages: string[];
    obfuscationDetected?: boolean;
    obfuscationTypes?: string[];
  } {
    if (!text || text.length === 0) {
      return { filteredText: text, matchCount: 0, detectedLanguages: [] };
    }

    // Stage 0: Check for obfuscated profanity (leet speak, spaced, vowel removal)
    const profanityList = wordListData.words || wordListData.trie.getAllWords();
    const obfuscationResult = TextNormalizer.containsObfuscatedProfanity(
      text,
      profanityList
    );

    if (obfuscationResult.found) {
      // Filter the obfuscated content by masking detected patterns
      let filteredText = text;

      // Create patterns to match obfuscated words and mask them
      for (const match of obfuscationResult.matches) {
        // Mask based on obfuscation type
        if (obfuscationResult.obfuscationType.includes("spaced_profanity")) {
          // Match spaced patterns like "f u c k" or "f.u.c.k"
          const spacedPattern = match
            .split("")
            .map((c) => `[${c}${c.toUpperCase()}]`)
            .join("[\\s.\\-_*#@!~\\`'\",;:/\\\\]+");
          const spacedRegex = new RegExp(spacedPattern, "gi");
          filteredText = filteredText.replace(spacedRegex, (m) =>
            replacement.repeat(m.length)
          );
        }

        if (obfuscationResult.obfuscationType.includes("leet_speak")) {
          // Match leet speak patterns - find variations
          const leetVariations = this.generateLeetVariations(match);
          for (const variation of leetVariations) {
            const leetRegex = new RegExp(`\\b${variation}\\b`, "gi");
            filteredText = filteredText.replace(leetRegex, (m) =>
              replacement.repeat(m.length)
            );
          }
        }

        if (obfuscationResult.obfuscationType.includes("vowel_removal")) {
          // Match vowel-removed patterns
          const vowelRemovedPattern = this.generateVowelRemovedPattern(match);
          if (vowelRemovedPattern) {
            const vowelRegex = new RegExp(`\\b${vowelRemovedPattern}\\b`, "gi");
            filteredText = filteredText.replace(vowelRegex, (m) =>
              replacement.repeat(m.length)
            );
          }
        }
      }

      // If obfuscation was detected and matches found, use obfuscation-filtered text
      // Then continue with normal filtering for any additional matches
      const trieResult = wordListData.trie.filterText(
        filteredText,
        replacement
      );

      return {
        filteredText: trieResult.filteredText,
        matchCount: obfuscationResult.matches.length + trieResult.matchCount,
        detectedLanguages: [
          ...trieResult.detectedLanguages,
          wordListData.language,
        ].filter((v, i, a) => a.indexOf(v) === i),
        obfuscationDetected: true,
        obfuscationTypes: obfuscationResult.obfuscationType,
      };
    }

    // Stage 1: Quick Bloom filter check
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    let hasPotentialMatches = false;

    for (const word of words) {
      if (wordListData.bloom.mightContain(word)) {
        hasPotentialMatches = true;
        break;
      }
    }

    // If Bloom filter says no matches, text is definitely clean
    if (!hasPotentialMatches) {
      return { filteredText: text, matchCount: 0, detectedLanguages: [] };
    }

    // Stage 2: Precise Trie filtering
    return wordListData.trie.filterText(text, replacement);
  }

  // Generate leet speak variations for a word
  private static generateLeetVariations(word: string): string[] {
    const leetReverse: Record<string, string[]> = {
      o: ["0", "\\(\\)"],
      i: ["1", "!", "\\|"],
      z: ["2"],
      e: ["3", "€", "£"],
      a: ["4", "@"],
      s: ["5", "\\$"],
      g: ["6", "9"],
      t: ["7", "\\+"],
      b: ["8"],
    };

    const variations: string[] = [word];

    // Generate common variations
    let pattern = "";
    for (const char of word.toLowerCase()) {
      if (leetReverse[char]) {
        pattern += `[${char}${leetReverse[char].join("")}]`;
      } else {
        pattern += char;
      }
    }
    variations.push(pattern);

    return variations;
  }

  // Generate pattern for vowel-removed words
  private static generateVowelRemovedPattern(word: string): string | null {
    const vowels = ["a", "e", "i", "o", "u"];
    const consonantsOnly = word
      .toLowerCase()
      .split("")
      .filter((c) => !vowels.includes(c))
      .join("");

    if (consonantsOnly.length >= 2 && consonantsOnly !== word) {
      return consonantsOnly;
    }
    return null;
  }

  // Check if text might contain profanity (fast Bloom check + obfuscation check)
  static mightContainProfanity(
    text: string,
    wordListData: WordListData
  ): boolean {
    // Check for obfuscated profanity first
    const profanityList = wordListData.words || wordListData.trie.getAllWords();
    const obfuscationResult = TextNormalizer.containsObfuscatedProfanity(
      text,
      profanityList
    );
    if (obfuscationResult.found) {
      return true;
    }

    // Then check with Bloom filter
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.some((word) => wordListData.bloom.mightContain(word));
  }

  // Precise check using Trie + obfuscation detection
  static containsProfanity(text: string, wordListData: WordListData): boolean {
    // Check for obfuscated profanity
    const profanityList = wordListData.words || wordListData.trie.getAllWords();
    const obfuscationResult = TextNormalizer.containsObfuscatedProfanity(
      text,
      profanityList
    );
    if (obfuscationResult.found) {
      return true;
    }

    // Then check with Trie
    const result = wordListData.trie.filterText(text);
    return result.matchCount > 0;
  }

  static getStats(wordListData: WordListData): {
    wordCount: number;
    language: string;
    bloomStats: { size: number; hashFunctions: number; memoryBytes: number };
    trieStats: { wordCount: number; memoryEstimateBytes: number };
    totalMemoryBytes: number;
  } {
    const bloomStats = wordListData.bloom.getStats();
    const trieStats = wordListData.trie.getStats();

    return {
      wordCount: wordListData.wordCount,
      language: wordListData.language,
      bloomStats,
      trieStats,
      totalMemoryBytes: bloomStats.memoryBytes + trieStats.memoryEstimateBytes,
    };
  }

  // Legacy compatibility methods (deprecated)
  static compileRegex(wordSet: Set<string>): RegExp | null {
    console.warn(
      "[JoSan] compileRegex is deprecated. Use Bloom+Trie filtering instead."
    );
    if (wordSet.size === 0) return null;

    const words = Array.from(wordSet).slice(0, 1000); // Limit for performance
    const escapedWords = words.map((w) => this.escapeRegExp(w)).join("|");
    return new RegExp(`\\b(${escapedWords})\\b`, "gi");
  }

  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
