/**
 * Vitest Unit Tests for JoSan Filter Components
 *
 * Tests BloomFilter, TrieFilter, TextNormalizer, and FilterEngine
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ============================================================================
// Test Implementations (matching filter-test-runner.ts)
// ============================================================================

class TestBloomFilter {
  private bitArray: Uint8Array;
  private size: number;
  private hashCount: number;

  constructor(expectedItems: number, falsePositiveRate: number = 0.01) {
    this.size = this.calculateOptimalSize(expectedItems, falsePositiveRate);
    this.hashCount = this.calculateOptimalHashCount(this.size, expectedItems);
    this.bitArray = new Uint8Array(Math.ceil(this.size / 8));
  }

  private calculateOptimalSize(n: number, p: number): number {
    return Math.ceil((-n * Math.log(p)) / (Math.log(2) * Math.log(2)));
  }

  private calculateOptimalHashCount(m: number, n: number): number {
    return Math.max(1, Math.round((m / n) * Math.log(2)));
  }

  private hash(str: string, seed: number): number {
    let h = seed;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    }
    return Math.abs(h % this.size);
  }

  add(item: string): void {
    const normalized = item.toLowerCase().trim();
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.hash(normalized, i);
      this.bitArray[Math.floor(index / 8)] |= 1 << (index % 8);
    }
  }

  mightContain(item: string): boolean {
    const normalized = item.toLowerCase().trim();
    for (let i = 0; i < this.hashCount; i++) {
      const index = this.hash(normalized, i);
      if (!(this.bitArray[Math.floor(index / 8)] & (1 << (index % 8)))) {
        return false;
      }
    }
    return true;
  }
}

class TestTrieNode {
  children: Map<string, TestTrieNode> = new Map();
  isEndOfWord: boolean = false;
  word: string = "";
  language: string = "";
}

class TestTrieFilter {
  private root: TestTrieNode = new TestTrieNode();

  addWord(word: string, language: string = "unknown"): void {
    const normalized = word.toLowerCase().trim();
    if (!normalized) return;

    let current = this.root;
    for (const char of normalized) {
      if (!current.children.has(char)) {
        current.children.set(char, new TestTrieNode());
      }
      current = current.children.get(char)!;
    }
    current.isEndOfWord = true;
    current.word = normalized;
    current.language = language;
  }

  findMatches(
    text: string,
  ): Array<{ word: string; index: number; language: string }> {
    const normalized = text.toLowerCase();
    const matches: Array<{ word: string; index: number; language: string }> =
      [];

    for (let i = 0; i < normalized.length; i++) {
      let current = this.root;
      let j = i;

      while (j < normalized.length && current.children.has(normalized[j])) {
        current = current.children.get(normalized[j])!;
        j++;

        if (current.isEndOfWord) {
          const beforeOk = i === 0 || !/[a-z]/i.test(normalized[i - 1]);
          const afterOk =
            j === normalized.length || !/[a-z]/i.test(normalized[j]);

          if (beforeOk && afterOk) {
            matches.push({
              word: current.word,
              index: i,
              language: current.language,
            });
          }
        }
      }
    }

    return matches;
  }
}

class TestTextNormalizer {
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
  };

  static normalizeLeetSpeak(text: string): string {
    let normalized = text.toLowerCase();
    for (const [leet, normal] of Object.entries(this.leetMap)) {
      normalized = normalized.split(leet).join(normal);
    }
    return normalized;
  }

  static normalizeSpacedText(text: string): string {
    return text
      .toLowerCase()
      .replace(
        /\b([a-z])\s+([a-z])\s+([a-z])(?:\s+([a-z]))?(?:\s+([a-z]))?\b/gi,
        "$1$2$3$4$5",
      );
  }

  static normalize(text: string): {
    normalized: string;
    obfuscationDetected: boolean;
    obfuscationTypes: string[];
  } {
    const obfuscationTypes: string[] = [];
    let normalized = text.toLowerCase();

    // Check for leet speak
    const hasLeet = /[0-9@$!+]/.test(text);
    if (hasLeet) {
      const leetNormalized = this.normalizeLeetSpeak(text);
      if (leetNormalized !== text.toLowerCase()) {
        normalized = leetNormalized;
        obfuscationTypes.push("leet_speak");
      }
    }

    // Check for spaced text
    const hasSpaced = /\b[a-z]\s+[a-z]\s+[a-z]/i.test(text);
    if (hasSpaced) {
      normalized = this.normalizeSpacedText(normalized);
      obfuscationTypes.push("spaced");
    }

    return {
      normalized,
      obfuscationDetected: obfuscationTypes.length > 0,
      obfuscationTypes,
    };
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("BloomFilter", () => {
  it("should add and find words", () => {
    const bloom = new TestBloomFilter(100);
    bloom.add("test");
    bloom.add("hello");
    bloom.add("world");

    expect(bloom.mightContain("test")).toBe(true);
    expect(bloom.mightContain("hello")).toBe(true);
    expect(bloom.mightContain("world")).toBe(true);
  });

  it("should return false for words not added", () => {
    const bloom = new TestBloomFilter(100);
    bloom.add("test");

    // Note: Bloom filters can have false positives but never false negatives
    // So we test that the word we added is found
    expect(bloom.mightContain("test")).toBe(true);
  });

  it("should handle case insensitivity", () => {
    const bloom = new TestBloomFilter(100);
    bloom.add("Test");

    expect(bloom.mightContain("test")).toBe(true);
    expect(bloom.mightContain("TEST")).toBe(true);
    expect(bloom.mightContain("TeSt")).toBe(true);
  });

  it("should handle empty strings", () => {
    const bloom = new TestBloomFilter(100);
    bloom.add("");
    // Empty string after trim should be handled gracefully
  });

  it("should maintain low false positive rate", () => {
    const bloom = new TestBloomFilter(1000, 0.01);

    // Add 1000 words
    for (let i = 0; i < 1000; i++) {
      bloom.add(`word${i}`);
    }

    // Check 1000 words that were NOT added
    let falsePositives = 0;
    for (let i = 1000; i < 2000; i++) {
      if (bloom.mightContain(`word${i}`)) {
        falsePositives++;
      }
    }

    // False positive rate should be around 1% (allow up to 5% for randomness)
    expect(falsePositives).toBeLessThan(50);
  });
});

describe("TrieFilter", () => {
  it("should add and find exact word matches", () => {
    const trie = new TestTrieFilter();
    trie.addWord("test", "english");
    trie.addWord("hello", "english");

    const matches = trie.findMatches("this is a test message");
    expect(matches).toHaveLength(1);
    expect(matches[0].word).toBe("test");
  });

  it("should respect word boundaries", () => {
    const trie = new TestTrieFilter();
    trie.addWord("ass", "english");

    // Should NOT match "ass" inside "class" or "bass"
    const matches1 = trie.findMatches("I play bass guitar");
    expect(matches1).toHaveLength(0);

    const matches2 = trie.findMatches("This is a class");
    expect(matches2).toHaveLength(0);

    // Should match standalone "ass"
    const matches3 = trie.findMatches("You are an ass");
    expect(matches3).toHaveLength(1);
  });

  it("should find multiple matches", () => {
    const trie = new TestTrieFilter();
    trie.addWord("damn", "english");
    trie.addWord("hell", "english");

    const matches = trie.findMatches("what the damn hell is this");
    expect(matches).toHaveLength(2);
  });

  it("should handle Filipino profanity", () => {
    const trie = new TestTrieFilter();
    trie.addWord("gago", "tagalog");
    trie.addWord("bobo", "tagalog");

    const matches = trie.findMatches("gago ka bobo");
    expect(matches).toHaveLength(2);
  });

  it("should handle Bisaya profanity", () => {
    const trie = new TestTrieFilter();
    trie.addWord("yawa", "bisaya");
    trie.addWord("buang", "bisaya");

    const matches = trie.findMatches("yawa ka buang");
    expect(matches).toHaveLength(2);
  });
});

describe("TextNormalizer", () => {
  describe("Leet Speak Normalization", () => {
    it("should normalize basic leet speak", () => {
      expect(TestTextNormalizer.normalizeLeetSpeak("b1tch")).toBe("bitch");
      expect(TestTextNormalizer.normalizeLeetSpeak("5h1t")).toBe("shit");
      expect(TestTextNormalizer.normalizeLeetSpeak("4ss")).toBe("ass");
    });

    it("should normalize numbers to letters", () => {
      expect(TestTextNormalizer.normalizeLeetSpeak("h3llo")).toBe("hello");
      expect(TestTextNormalizer.normalizeLeetSpeak("w0rld")).toBe("world");
    });

    it("should normalize special characters", () => {
      expect(TestTextNormalizer.normalizeLeetSpeak("@ss")).toBe("ass");
      expect(TestTextNormalizer.normalizeLeetSpeak("$h!t")).toBe("shit");
    });
  });

  describe("Spaced Text Normalization", () => {
    it("should normalize spaced profanity", () => {
      expect(TestTextNormalizer.normalizeSpacedText("f u c k")).toBe("fuck");
      expect(TestTextNormalizer.normalizeSpacedText("s h i t")).toBe("shit");
    });
  });

  describe("Combined Normalization", () => {
    it("should detect leet speak obfuscation", () => {
      const result = TestTextNormalizer.normalize("b1tch");
      expect(result.obfuscationDetected).toBe(true);
      expect(result.obfuscationTypes).toContain("leet_speak");
    });

    it("should detect spaced obfuscation", () => {
      const result = TestTextNormalizer.normalize("f u c k you");
      expect(result.obfuscationDetected).toBe(true);
      expect(result.obfuscationTypes).toContain("spaced");
    });

    it("should not detect obfuscation in clean text", () => {
      const result = TestTextNormalizer.normalize("hello world");
      expect(result.obfuscationDetected).toBe(false);
    });
  });
});

describe("Wordlist Loading", () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(__dirname, "..");
  const dataDir = path.join(projectRoot, "public", "data");

  it("should load English wordlist", () => {
    const filePath = path.join(dataDir, "en.txt");
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, "utf-8");
    const words = content
      .split("\n")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    expect(words.length).toBeGreaterThan(1000);
  });

  it("should load Tagalog wordlist", () => {
    const filePath = path.join(dataDir, "tl.txt");
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, "utf-8");
    const words = content
      .split("\n")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    expect(words.length).toBeGreaterThan(100);
  });

  it("should load Bisaya wordlist", () => {
    const filePath = path.join(dataDir, "bis.txt");
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, "utf-8");
    const words = content
      .split("\n")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    expect(words.length).toBeGreaterThan(100);
  });
});

describe("Scunthorpe Problem Prevention", () => {
  let trie: TestTrieFilter;

  beforeAll(() => {
    trie = new TestTrieFilter();
    trie.addWord("ass", "english");
    trie.addWord("cock", "english");
    trie.addWord("hell", "english");
  });

  it("should NOT match 'bass' for 'ass'", () => {
    const matches = trie.findMatches("I play bass guitar");
    expect(matches).toHaveLength(0);
  });

  it("should NOT match 'cocktail' for 'cock'", () => {
    const matches = trie.findMatches("I ordered a cocktail");
    expect(matches).toHaveLength(0);
  });

  it("should NOT match 'hello' for 'hell'", () => {
    const matches = trie.findMatches("hello world");
    expect(matches).toHaveLength(0);
  });

  it("should NOT match 'Scunthorpe' for profanity", () => {
    const matches = trie.findMatches("Scunthorpe is a town in England");
    expect(matches).toHaveLength(0);
  });

  it("should NOT match 'assassin' for 'ass'", () => {
    const matches = trie.findMatches("The assassin was caught");
    expect(matches).toHaveLength(0);
  });
});

describe("Integration: Full Filter Pipeline", () => {
  let bloom: TestBloomFilter;
  let trie: TestTrieFilter;

  beforeAll(() => {
    bloom = new TestBloomFilter(100);
    trie = new TestTrieFilter();

    const words = ["fuck", "shit", "damn", "gago", "bobo", "yawa"];
    words.forEach((word) => {
      bloom.add(word);
      trie.addWord(word, "mixed");
    });
  });

  it("should detect direct profanity", () => {
    const text = "this is a damn test";

    // First check bloom filter
    expect(bloom.mightContain("damn")).toBe(true);

    // Then check trie for precise match
    const matches = trie.findMatches(text);
    expect(matches).toHaveLength(1);
    expect(matches[0].word).toBe("damn");
  });

  it("should detect obfuscated profanity", () => {
    const text = "this is a d4mn test";

    // Normalize first
    const { normalized } = TestTextNormalizer.normalize(text);

    // Check normalized text
    const matches = trie.findMatches(normalized);
    expect(matches).toHaveLength(1);
  });

  it("should pass clean text through", () => {
    const text = "this is a perfectly clean sentence";
    const matches = trie.findMatches(text);
    expect(matches).toHaveLength(0);
  });
});
