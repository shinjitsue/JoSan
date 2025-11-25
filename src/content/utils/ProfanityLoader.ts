import { BloomFilter } from "./BloomFilter";
import { TrieFilter } from "./TrieFilter";

export interface WordListData {
  bloom: BloomFilter;
  trie: TrieFilter;
  wordCount: number;
  language: string;
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

  // Fast two-stage filtering
  static filterText(
    text: string,
    wordListData: WordListData,
    replacement: string = "*"
  ): { filteredText: string; matchCount: number; detectedLanguages: string[] } {
    if (!text || text.length === 0) {
      return { filteredText: text, matchCount: 0, detectedLanguages: [] };
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

  // Check if text might contain profanity (fast Bloom check)
  static mightContainProfanity(
    text: string,
    wordListData: WordListData
  ): boolean {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.some((word) => wordListData.bloom.mightContain(word));
  }

  // Precise check using Trie
  static containsProfanity(text: string, wordListData: WordListData): boolean {
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
