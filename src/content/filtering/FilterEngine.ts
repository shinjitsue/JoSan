import { FastLanguageDetector } from "../utils/FastLanguageDetector";
import { ProfanityLoader, type WordListData } from "../utils/ProfanityLoader";

interface Language {
  code: string;
  name: string;
  confidence: number;
  scores: Record<string, number>;
}

interface WordListSet {
  english: WordListData | null;
  tagalog: WordListData | null;
  bisaya: WordListData | null;
}

interface FilterResult {
  filteredText: string;
  matchCount: number;
  detectedLanguages: string[];
}

export class FilterEngine {
  private static readonly MIN_TEXT_LENGTH = 10;
  // Fallback threshold: when language confidence is below this, run all word lists
  private static readonly LANGUAGE_FALLBACK_THRESHOLD = 0.5;

  static analyzeText(
    text: string,
    wordLists: WordListSet,
    customWordList: WordListData | null,
  ): {
    language: Language;
    filterResult: FilterResult;
    needsAI: boolean;
  } {
    // Step 1: Fast language detection (no AI cost)
    const detected = FastLanguageDetector.detectBest(text);
    const language: Language = {
      code: detected.code,
      name: FastLanguageDetector.getLanguageName(detected.code),
      confidence: detected.confidence,
      scores: detected.scores,
    };

    // Step 2: Multi-language Bloom+Trie filtering (highly optimized)
    // Pass language confidence for fallback logic
    const filterResult = this.applyMultiLanguageFilter(
      text,
      wordLists,
      customWordList,
      language.confidence,
    );

    // Step 3: Determine if AI is needed
    const needsAI = FastLanguageDetector.shouldUseAI(
      text,
      filterResult.matchCount,
    );

    return { language, filterResult, needsAI };
  }

  private static applyMultiLanguageFilter(
    text: string,
    wordLists: WordListSet,
    customWordList: WordListData | null,
    languageConfidence: number = 1.0,
  ): FilterResult {
    let filteredText = text;
    let totalMatches = 0;
    const allDetectedLanguages = new Set<string>();

    // Determine if we should use fallback mode (run all word lists)
    const useFallbackMode =
      languageConfidence < this.LANGUAGE_FALLBACK_THRESHOLD;

    // Fast pre-screening with Bloom filters
    let activeWordLists: WordListData[] = [];

    if (useFallbackMode) {
      // Fallback mode: include all word lists regardless of Bloom filter results
      // This catches cases where language detection is uncertain
      console.log(
        `[JoSan] Language confidence low (${(languageConfidence * 100).toFixed(1)}%), using fallback mode - checking all word lists`,
      );
      activeWordLists = Object.values(wordLists).filter(
        (wl): wl is WordListData => wl !== null,
      );
      if (customWordList) {
        activeWordLists.push(customWordList);
      }
    } else {
      // Normal mode: use Bloom filters for pre-screening
      Object.values(wordLists).forEach((wordList) => {
        if (wordList && ProfanityLoader.mightContainProfanity(text, wordList)) {
          activeWordLists.push(wordList);
        }
      });

      if (
        customWordList &&
        ProfanityLoader.mightContainProfanity(text, customWordList)
      ) {
        activeWordLists.push(customWordList);
      }
    }

    // If no word lists to check, text is clean
    if (activeWordLists.length === 0) {
      return {
        filteredText,
        matchCount: 0,
        detectedLanguages: [],
      };
    }

    console.log(
      `[JoSan] Bloom pre-screen: ${activeWordLists.length}/${
        Object.keys(wordLists).length + (customWordList ? 1 : 0)
      } word lists need checking${useFallbackMode ? " (fallback mode)" : ""}`,
    );

    // Apply Trie filtering only on word lists that passed Bloom screening
    activeWordLists.forEach((wordList) => {
      const result = ProfanityLoader.filterText(filteredText, wordList, "*");

      if (result.matchCount > 0) {
        filteredText = result.filteredText;
        totalMatches += result.matchCount;
        result.detectedLanguages.forEach((lang) =>
          allDetectedLanguages.add(lang),
        );
      }
    });

    return {
      filteredText,
      matchCount: totalMatches,
      detectedLanguages: Array.from(allDetectedLanguages),
    };
  }

  static isTextWorthFiltering(text: string): boolean {
    if (!text || text.length < this.MIN_TEXT_LENGTH) {
      return false;
    }

    const trimmedText = text.trim();
    return FastLanguageDetector.isTextWorthAnalyzing(trimmedText);
  }

  static shouldProcessText(text: string): boolean {
    return this.isTextWorthFiltering(text);
  }

  // Quick profanity check using only Bloom filters (extremely fast)
  static quickProfanityCheck(
    text: string,
    wordLists: WordListSet,
    customWordList: WordListData | null,
  ): boolean {
    const allWordLists = [
      ...Object.values(wordLists).filter(Boolean),
      ...(customWordList ? [customWordList] : []),
    ] as WordListData[];

    return allWordLists.some((wordList) =>
      ProfanityLoader.mightContainProfanity(text, wordList),
    );
  }

  // Performance benchmarking
  static benchmarkFilter(
    text: string,
    wordLists: WordListSet,
    customWordList: WordListData | null,
  ): {
    bloomTime: number;
    trieTime: number;
    totalTime: number;
    result: FilterResult;
  } {
    const startTime = performance.now();

    const bloomStart = performance.now();
    const hasPotentialMatches = this.quickProfanityCheck(
      text,
      wordLists,
      customWordList,
    );
    const bloomTime = performance.now() - bloomStart;

    let trieTime = 0;
    let result: FilterResult;

    if (hasPotentialMatches) {
      const trieStart = performance.now();
      result = this.applyMultiLanguageFilter(text, wordLists, customWordList);
      trieTime = performance.now() - trieStart;
    } else {
      result = { filteredText: text, matchCount: 0, detectedLanguages: [] };
    }

    const totalTime = performance.now() - startTime;

    return {
      bloomTime,
      trieTime,
      totalTime,
      result,
    };
  }
}
