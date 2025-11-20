import { FastLanguageDetector } from "../utils/FastLanguageDetector";

interface Language {
  code: string;
  name: string;
  confidence: number;
  scores: Record<string, number>;
}

interface RegexSet {
  english: RegExp | null;
  tagalog: RegExp | null;
  cebuano: RegExp | null;
}

export class FilterEngine {
  private static readonly MIN_TEXT_LENGTH = 10;

  static analyzeText(
    text: string,
    regexes: RegexSet
  ): {
    language: Language;
    regexResult: {
      filteredText: string;
      matchCount: number;
      detectedLanguages: string[];
    };
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

    // Step 2: Multi-language regex check (free)
    const regexResult = FastLanguageDetector.applyMultiLangFilter(text, {
      en: regexes.english,
      tl: regexes.tagalog,
      ceb: regexes.cebuano,
    });

    // Step 3: Determine if AI is needed
    const needsAI = FastLanguageDetector.shouldUseAI(
      text,
      regexResult.matchCount
    );

    return { language, regexResult, needsAI };
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
}
