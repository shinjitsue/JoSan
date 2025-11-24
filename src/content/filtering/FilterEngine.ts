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
  bisaya: RegExp | null;
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
    // Step 1: Preprocess text to handle evasion techniques
    const preprocessedText = this.preprocessText(text);

    // Step 2: Fast language detection (no AI cost)
    const detected = FastLanguageDetector.detectBest(preprocessedText);
    const language: Language = {
      code: detected.code,
      name: FastLanguageDetector.getLanguageName(detected.code),
      confidence: detected.confidence,
      scores: detected.scores,
    };

    // Step 3: Multi-language regex check (free) on both original and preprocessed
    const regexResult = this.performEnhancedRegexCheck(
      text,
      preprocessedText,
      regexes
    );

    // Step 4: Determine if AI is needed
    const needsAI = FastLanguageDetector.shouldUseAI(
      text,
      regexResult.matchCount
    );

    return { language, regexResult, needsAI };
  }

  private static preprocessText(text: string): string {
    let processed = text;

    // Step 1: Normalize spacing and separators
    processed = this.normalizeSpacing(processed);

    // Step 2: Handle leetspeak substitutions
    processed = this.normalizeLeetspeak(processed);

    // Step 3: Remove excessive repetition
    processed = this.normalizeRepetition(processed);

    // Step 4: Clean up
    processed = processed.toLowerCase().trim();

    return processed;
  }

  private static normalizeSpacing(text: string): string {
    // Remove common separators between characters that might be used to evade detection
    return text
      .replace(/([a-z])\s*[-_.\\*|]\s*([a-z])/gi, "$1$2") // Remove separators between letters
      .replace(/([a-z])\s+([a-z])/gi, "$1$2") // Remove spaces between single characters
      .replace(/\s{2,}/g, " "); // Normalize multiple spaces to single space
  }

  private static normalizeLeetspeak(text: string): string {
    const leetMap: Record<string, string> = {
      "@": "a",
      "4": "a",
      "∆": "a",
      Δ: "a",
      "∀": "a",
      "3": "e",
      "€": "e",
      ε: "e",
      "£": "e",
      "1": "i",
      "!": "i",
      "|": "i",
      "¡": "i",
      "0": "o",
      ø: "o",
      "°": "o",
      $: "s",
      "5": "s",
      "§": "s",
      ß: "s",
      υ: "u",
      μ: "u",
      "7": "t",
      "†": "t",
      "+": "t",
      "9": "g",
      q: "g",
      "¢": "c",
      "©": "c",
      "#": "h",
      "6": "b",
      β: "b",
      δ: "d",
      "®": "r",
      η: "n",
      "×": "x",
      "¥": "y",
      "2": "z",
    };

    let result = text;
    for (const [leet, normal] of Object.entries(leetMap)) {
      const regex = new RegExp(this.escapeRegExp(leet), "gi");
      result = result.replace(regex, normal);
    }

    return result;
  }

  private static normalizeRepetition(text: string): string {
    // Reduce repeated characters to maximum of 2
    // "fuuuuuck" becomes "fuuck", "shiiiit" becomes "shiit"
    return text.replace(/(.)\1{2,}/g, "$1$1");
  }

  private static performEnhancedRegexCheck(
    originalText: string,
    preprocessedText: string,
    regexes: RegexSet
  ): { filteredText: string; matchCount: number; detectedLanguages: string[] } {
    // Check both original and preprocessed text
    const originalResult = FastLanguageDetector.applyMultiLangFilter(
      originalText,
      {
        en: regexes.english,
        tl: regexes.tagalog,
        bis: regexes.bisaya,
      }
    );

    const preprocessedResult = FastLanguageDetector.applyMultiLangFilter(
      preprocessedText,
      {
        en: regexes.english,
        tl: regexes.tagalog,
        bis: regexes.bisaya,
      }
    );

    // Use the result with more matches (indicating better detection)
    if (preprocessedResult.matchCount > originalResult.matchCount) {
      // Apply the filtering to the original text but use the preprocessed detection logic
      return this.applyDetectionToOriginal(
        originalText,
        preprocessedText,
        regexes
      );
    }

    return originalResult;
  }

  private static applyDetectionToOriginal(
    originalText: string,
    preprocessedText: string,
    regexes: RegexSet
  ): { filteredText: string; matchCount: number; detectedLanguages: string[] } {
    let filteredText = originalText;
    let matchCount = 0;
    const detectedLanguages: string[] = [];

    // For each language, check if preprocessed version has matches
    Object.entries({
      en: regexes.english,
      tl: regexes.tagalog,
      bis: regexes.bisaya,
    }).forEach(([lang, regex]) => {
      if (!regex) return;

      const preprocessedMatches = preprocessedText.match(regex);
      if (preprocessedMatches && preprocessedMatches.length > 0) {
        // Try to find corresponding patterns in original text using fuzzy matching
        const originalMatches = this.findFuzzyMatches(
          originalText,
          preprocessedMatches
        );

        if (originalMatches.length > 0) {
          originalMatches.forEach((match) => {
            const stars = "*".repeat(match.length);
            filteredText = filteredText.replace(
              new RegExp(this.escapeRegExp(match), "gi"),
              stars
            );
          });

          matchCount += originalMatches.length;
          detectedLanguages.push(lang);
        }
      }
    });

    return { filteredText, matchCount, detectedLanguages };
  }

  private static findFuzzyMatches(
    originalText: string,
    preprocessedMatches: string[]
  ): string[] {
    const matches: string[] = [];
    const originalLower = originalText.toLowerCase();

    for (const preprocessedMatch of preprocessedMatches) {
      // Create a regex pattern that allows for common evasion techniques
      const fuzzyPattern = this.createFuzzyPattern(preprocessedMatch);
      const fuzzyRegex = new RegExp(fuzzyPattern, "gi");

      const foundMatches = originalLower.match(fuzzyRegex);
      if (foundMatches) {
        matches.push(...foundMatches);
      }
    }

    return Array.from(new Set(matches)); // Remove duplicates
  }

  private static createFuzzyPattern(word: string): string {
    // Create a pattern that matches the word with various evasion techniques
    let pattern = "";

    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      pattern += this.getCharacterPattern(char);

      // Add optional separators between characters (except for the last character)
      if (i < word.length - 1) {
        pattern += "[\\s\\-_.*]*";
      }
    }

    return `\\b${pattern}\\b`;
  }

  private static getCharacterPattern(char: string): string {
    const patterns: Record<string, string> = {
      a: "[a@4∆Δ∀]+",
      e: "[e3€ε£]+",
      i: "[i1!|¡]+",
      o: "[o0ø°]+",
      s: "[s$5§ß]+",
      u: "[uυμ]+",
      l: "[l1|!]+",
      t: "[t7†+]+",
      g: "[g9q]+",
      f: "[f†]+",
      c: "[c¢©]+",
      h: "[h#]+",
      b: "[b6β]+",
      d: "[dδ]+",
      p: "[p9]+",
      r: "[r®]+",
      n: "[nη]+",
      x: "[x×]+",
      y: "[y¥]+",
      z: "[z2]+",
    };

    return patterns[char] || `[${char}]+`;
  }

  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
