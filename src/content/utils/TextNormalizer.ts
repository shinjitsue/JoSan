/**
 * TextNormalizer - Handles obfuscated profanity detection
 *
 * Detects and normalizes:
 * 1. Leet speak (1337 speak): b1tch → bitch, 5hit → shit
 * 2. Spaced profanity: f u c k → fuck, f.u.c.k → fuck
 * 3. Vowel removal: fck → fuck, sht → shit
 */

export class TextNormalizer {
  // Leet speak character mappings
  private static readonly leetMap: Record<string, string> = {
    "0": "o",
    "1": "i",
    "2": "z",
    "3": "e",
    "4": "a",
    "5": "s",
    "6": "g",
    "7": "t",
    "8": "b",
    "9": "g",
    "@": "a",
    $: "s",
    "!": "i",
    "+": "t",
    "(": "c",
    ")": "o",
    "|": "i",
    "€": "e",
    "£": "e",
    "¥": "y",
    "×": "x",
    "÷": "d",
  };

  // Common vowel-removed variations mapped to full words
  private static readonly vowelRemovedPatterns: Array<{
    pattern: RegExp;
    replacement: string;
  }> = [
    { pattern: /\bf+[ck]+\b/gi, replacement: "fuck" },
    { pattern: /\bsh+t\b/gi, replacement: "shit" },
    { pattern: /\bb+tch\b/gi, replacement: "bitch" },
    { pattern: /\bd+mn\b/gi, replacement: "damn" },
    { pattern: /\bhl+\b/gi, replacement: "hell" },
    { pattern: /\bsht\b/gi, replacement: "shit" },
    { pattern: /\bfck\b/gi, replacement: "fuck" },
    { pattern: /\bbstrd\b/gi, replacement: "bastard" },
    { pattern: /\bwtf\b/gi, replacement: "what the fuck" },
    { pattern: /\bstfu\b/gi, replacement: "shut the fuck up" },
    { pattern: /\bgtfo\b/gi, replacement: "get the fuck out" },
    { pattern: /\bffs\b/gi, replacement: "for fucks sake" },
    { pattern: /\bass\b/gi, replacement: "ass" },
    { pattern: /\bss\b/gi, replacement: "ass" },
    // Filipino/Tagalog obfuscations
    { pattern: /\bpt\b/gi, replacement: "puta" },
    { pattern: /\bptngn\b/gi, replacement: "putangina" },
    { pattern: /\bptngina\b/gi, replacement: "putangina" },
    { pattern: /\bgg\b/gi, replacement: "gago" },
    { pattern: /\btng\b/gi, replacement: "tanga" },
    // Bisaya obfuscations
    { pattern: /\byw\b/gi, replacement: "yawa" },
    { pattern: /\bbng\b/gi, replacement: "buang" },
    { pattern: /\bbg\b/gi, replacement: "bogo" },
  ];

  /**
   * Normalize leet speak to regular text
   * e.g., "b1tch" → "bitch", "5h1t" → "shit"
   */
  static normalizeLeetSpeak(text: string): string {
    let normalized = text.toLowerCase();

    // Replace leet characters
    for (const [leet, normal] of Object.entries(this.leetMap)) {
      normalized = normalized.split(leet).join(normal);
    }

    return normalized;
  }

  /**
   * Remove spaces/punctuation between characters to detect spaced profanity
   * Only detects when there are ACTUAL separators between letters
   * e.g., "f u c k" → "fuck", "f.u.c.k" → "fuck"
   * But NOT "fuck" or "damn" which are already whole words
   */
  static normalizeSpacedText(text: string): string {
    let normalized = text.toLowerCase();

    // 4+ letter spaced words (with mandatory separators)
    const spacedPattern4Plus =
      /\b([a-z])[\s.\-_*#@!~`'",;:/\\]+([a-z])[\s.\-_*#@!~`'",;:/\\]+([a-z])[\s.\-_*#@!~`'",;:/\\]+([a-z])\b/gi;

    const matches = normalized.match(spacedPattern4Plus);
    if (matches) {
      matches.forEach((match) => {
        const cleaned = match.replace(/[^a-z]/gi, "");
        normalized = normalized.replace(match, cleaned);
      });
    }

    // 3-letter spaced words (with mandatory separators)
    const spacedPattern3 =
      /\b([a-z])[\s.\-_*#@!~`'",;:/\\]+([a-z])[\s.\-_*#@!~`'",;:/\\]+([a-z])\b/gi;
    const threeMatches = normalized.match(spacedPattern3);
    if (threeMatches) {
      threeMatches.forEach((match) => {
        const cleaned = match.replace(/[^a-z]/gi, "");
        if (cleaned.length >= 3) {
          normalized = normalized.replace(match, cleaned);
        }
      });
    }

    return normalized;
  }

  /**
   * Restore vowels in vowel-removed words
   * e.g., "fck" → "fuck", "sht" → "shit"
   */
  static normalizeVowelRemoved(text: string): string {
    let normalized = text.toLowerCase();

    for (const { pattern, replacement } of this.vowelRemovedPatterns) {
      normalized = normalized.replace(pattern, replacement);
    }

    return normalized;
  }

  /**
   * Full normalization pipeline
   * Returns the original text, normalized text, and which transformations were applied
   */
  static normalize(text: string): {
    original: string;
    normalized: string;
    transformations: string[];
  } {
    const transformations: string[] = [];
    let normalized = text;

    // Step 1: Normalize spaced text first (before other transformations)
    const afterSpaced = this.normalizeSpacedText(normalized);
    if (afterSpaced !== normalized.toLowerCase()) {
      transformations.push("spaced_profanity");
      normalized = afterSpaced;
    } else {
      normalized = normalized.toLowerCase();
    }

    // Step 2: Normalize leet speak
    const afterLeet = this.normalizeLeetSpeak(normalized);
    if (afterLeet !== normalized) {
      transformations.push("leet_speak");
      normalized = afterLeet;
    }

    // Step 3: Normalize vowel-removed words
    const afterVowel = this.normalizeVowelRemoved(normalized);
    if (afterVowel !== normalized) {
      transformations.push("vowel_removal");
      normalized = afterVowel;
    }

    return {
      original: text,
      normalized,
      transformations,
    };
  }

  /**
   * Check if text contains obfuscated profanity
   * Only returns true if obfuscation was detected AND profanity found after normalization
   */
  static containsObfuscatedProfanity(
    text: string,
    profanityList: string[]
  ): {
    found: boolean;
    matches: string[];
    obfuscationType: string[];
  } {
    const { normalized, transformations } = this.normalize(text);

    // Only check if obfuscation was actually detected
    if (transformations.length === 0) {
      return {
        found: false,
        matches: [],
        obfuscationType: [],
      };
    }

    const matches: string[] = [];

    // Check for whole word matches in normalized text
    const words = normalized.match(/\b\w+\b/g) || [];
    for (const word of words) {
      if (profanityList.includes(word)) {
        matches.push(word);
      }
    }

    // Also check for profanity that might span multiple "words" after normalization
    for (const profanity of profanityList) {
      // Only check longer profanity words to avoid false positives
      if (profanity.length >= 4 && normalized.includes(profanity)) {
        const regex = new RegExp(`\\b${profanity}\\b`, "i");
        if (regex.test(normalized) && !matches.includes(profanity)) {
          matches.push(profanity);
        }
      }
    }

    return {
      found: matches.length > 0,
      matches,
      obfuscationType: transformations,
    };
  }

  /**
   * Get normalized version of text for comparison
   * Useful for checking if normalized text matches any word in a profanity list
   */
  static getNormalizedWords(text: string): string[] {
    const { normalized } = this.normalize(text);
    return normalized.match(/\b\w+\b/g) || [];
  }
}
