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

    const enhancedWords = Array.from(wordSet).map((word) => {
      return this.createEvasionResistantPattern(word);
    });

    return new RegExp(`\\b(${enhancedWords.join("|")})\\b`, "gi");
  }

  private static createEvasionResistantPattern(word: string): string {
    // Escape the base word first
    let pattern = this.escapeRegExp(word);

    // Apply character substitution patterns
    pattern = this.applyCharacterSubstitutions(pattern);

    // Apply spacing/separation patterns
    pattern = this.applySpacingPatterns(pattern);

    // Apply repetition patterns (handle repeated characters)
    pattern = this.applyRepetitionPatterns(pattern);

    return pattern;
  }

  private static applyCharacterSubstitutions(pattern: string): string {
    const substitutions: Record<string, string> = {
      a: "[a@4∆Δ∀]",
      e: "[e3€ε£]",
      i: "[i1!|¡]",
      o: "[o0ø°]",
      s: "[s$5§ß]",
      u: "[uυμ]",
      l: "[l1|!]",
      t: "[t7†+]",
      g: "[g9q]",
      f: "[f†]",
      c: "[c¢©]",
      h: "[h#]",
      b: "[b6β]",
      d: "[dδ]",
      p: "[p9]",
      r: "[r®]",
      n: "[nη]",
      m: "[m]",
      v: "[v]",
      w: "[w]",
      x: "[x×]",
      y: "[y¥]",
      z: "[z2]",
    };

    let result = pattern;

    // Apply substitutions character by character
    for (const [char, substitution] of Object.entries(substitutions)) {
      const regex = new RegExp(this.escapeRegExp(char), "gi");
      result = result.replace(regex, substitution);
    }

    return result;
  }

  private static applySpacingPatterns(pattern: string): string {
    // Allow optional separators between any characters
    // This handles: f u c k, f-u-c-k, f_u_c_k, f.u.c.k, etc.
    return pattern.split("").join("[\\s\\-_\\.\\*]*");
  }

  private static applyRepetitionPatterns(pattern: string): string {
    // Handle repeated characters like: fuuuuck, shiiiit
    // Replace each character with itself + optional repetitions
    return pattern.replace(/(\[[^\]]+\]|.)/g, "$1{1,3}");
  }

  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
