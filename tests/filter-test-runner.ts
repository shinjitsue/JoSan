/**
 * JoSan Filter Test Runner
 *
 * Runs profanity filter tests against test cases and exports JSON results
 * for visualization in Python Jupyter notebooks.
 *
 * Usage:
 *   npx tsx tests/filter-test-runner.ts --mode=regex    # Regex-only tests
 *   npx tsx tests/filter-test-runner.ts --mode=ai       # AI-powered tests
 *   npx tsx tests/filter-test-runner.ts --export        # Export all results to JSON
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Import test cases
import {
  cleanTestCases as englishCleanCases,
  profaneTestCases as englishToxicCases,
} from "./test-cases/english-test-cases";
import {
  tagalogCleanTestCases as tagalogCleanCases,
  tagalogToxicTestCases as tagalogToxicCases,
} from "./test-cases/tagalog-test-cases";
import {
  bisayaCleanTestCases as bisayaCleanCases,
  bisayaToxicTestCases as bisayaToxicCases,
} from "./test-cases/bisaya-test-cases";
import type { TestCase } from "./test-cases/types";

// ============================================================================
// Types
// ============================================================================

interface FilterTestResult {
  testId: number;
  language: string;
  text: string;
  expectedLabel: "clean" | "mild" | "toxic";
  predictedLabel: "clean" | "mild" | "toxic";
  category: string;
  isCorrect: boolean;
  processingTimeMs: number;
  matchCount: number;
  matchedWords: string[];
  obfuscationDetected: boolean;
  obfuscationTypes: string[];
}

interface LanguageMetrics {
  language: string;
  total: number;
  correct: number;
  accuracy: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  avgLatencyMs: number;
}

interface CategoryMetrics {
  category: string;
  total: number;
  correct: number;
  accuracy: number;
}

interface TestSummary {
  testType: "regex" | "ai";
  timestamp: string;
  totalTests: number;
  correctPredictions: number;
  overallAccuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  };
  latencyStats: {
    totalTimeMs: number;
    avgLatencyMs: number;
    minLatencyMs: number;
    maxLatencyMs: number;
    medianLatencyMs: number;
    p95LatencyMs: number;
  };
  obfuscationStats: {
    totalObfuscated: number;
    correctlyClassified: number;
    accuracy: number;
  };
  byLanguage: LanguageMetrics[];
  byCategory: CategoryMetrics[];
  results: FilterTestResult[];
  errors: { testId: number; error: string }[];
}

// ============================================================================
// Inline Filter Implementation (for testing without Chrome APIs)
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
          // Check word boundaries
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
      for (const [leet, normal] of Object.entries(this.leetMap)) {
        normalized = normalized.split(leet).join(normal);
      }
      if (normalized !== text.toLowerCase()) {
        obfuscationTypes.push("leet_speak");
      }
    }

    // Check for spaced text
    const hasSpaced = /\b[a-z]\s+[a-z]\s+[a-z]/i.test(text);
    if (hasSpaced) {
      // Remove spaces between single letters
      normalized = normalized.replace(
        /\b([a-z])\s+([a-z])\s+([a-z])(?:\s+([a-z]))?(?:\s+([a-z]))?\b/gi,
        "$1$2$3$4$5",
      );
      obfuscationTypes.push("spaced");
    }

    // Check for dotted/punctuated text
    const hasDotted = /\b[a-z][.\-_][a-z][.\-_][a-z]/i.test(text);
    if (hasDotted) {
      normalized = normalized.replace(/([a-z])[.\-_](?=[a-z])/gi, "$1");
      obfuscationTypes.push("dotted");
    }

    return {
      normalized,
      obfuscationDetected: obfuscationTypes.length > 0,
      obfuscationTypes,
    };
  }
}

interface WordListData {
  bloom: TestBloomFilter;
  trie: TestTrieFilter;
  words: string[];
  language: string;
}

// ============================================================================
// Data Loading
// ============================================================================

function loadWordList(filePath: string, language: string): WordListData {
  const content = fs.readFileSync(filePath, "utf-8");
  const words = content
    .split("\n")
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0);

  const bloom = new TestBloomFilter(words.length, 0.01);
  const trie = new TestTrieFilter();

  words.forEach((word) => {
    bloom.add(word);
    trie.addWord(word, language);
  });

  return { bloom, trie, words, language };
}

// ============================================================================
// Filter Testing Logic
// ============================================================================

function testFilter(
  text: string,
  wordLists: WordListData[],
): {
  matchCount: number;
  matchedWords: string[];
  obfuscationDetected: boolean;
  obfuscationTypes: string[];
  processingTimeMs: number;
} {
  const startTime = performance.now();

  const allMatches: string[] = [];
  let obfuscationDetected = false;
  let obfuscationTypes: string[] = [];

  // Step 1: Normalize text for obfuscation detection
  const {
    normalized,
    obfuscationDetected: hasObf,
    obfuscationTypes: obfTypes,
  } = TestTextNormalizer.normalize(text);

  obfuscationDetected = hasObf;
  obfuscationTypes = obfTypes;

  // Step 2: Check both original and normalized text
  const textsToCheck = [text.toLowerCase()];
  if (normalized !== text.toLowerCase()) {
    textsToCheck.push(normalized);
  }

  for (const wordList of wordLists) {
    for (const checkText of textsToCheck) {
      // Bloom filter pre-check
      let mightContain = false;
      for (const word of wordList.words.slice(0, 1000)) {
        // Check common words
        if (checkText.includes(word)) {
          mightContain = true;
          break;
        }
      }

      // Also check if bloom filter indicates potential match
      const words = checkText.split(/\s+/);
      for (const word of words) {
        if (wordList.bloom.mightContain(word)) {
          mightContain = true;
          break;
        }
      }

      if (mightContain) {
        const matches = wordList.trie.findMatches(checkText);
        allMatches.push(...matches.map((m) => m.word));
      }
    }
  }

  // Remove duplicates
  const uniqueMatches = [...new Set(allMatches)];

  const processingTimeMs = performance.now() - startTime;

  return {
    matchCount: uniqueMatches.length,
    matchedWords: uniqueMatches,
    obfuscationDetected,
    obfuscationTypes,
    processingTimeMs,
  };
}

function classifyResult(matchCount: number): "clean" | "mild" | "toxic" {
  // For regex-only testing, we classify based on match count
  if (matchCount === 0) return "clean";
  if (matchCount >= 2) return "toxic";
  return "mild";
}

// ============================================================================
// Metrics Calculation
// ============================================================================

function calculateMetrics(results: FilterTestResult[]): {
  confusionMatrix: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  };
  precision: number;
  recall: number;
  f1Score: number;
} {
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0;

  for (const result of results) {
    const actualToxic =
      result.expectedLabel === "toxic" || result.expectedLabel === "mild";
    const predictedToxic =
      result.predictedLabel === "toxic" || result.predictedLabel === "mild";

    if (actualToxic && predictedToxic) tp++;
    else if (!actualToxic && predictedToxic) fp++;
    else if (!actualToxic && !predictedToxic) tn++;
    else if (actualToxic && !predictedToxic) fn++;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

  return {
    confusionMatrix: {
      truePositives: tp,
      falsePositives: fp,
      trueNegatives: tn,
      falseNegatives: fn,
    },
    precision,
    recall,
    f1Score,
  };
}

function calculateLanguageMetrics(
  results: FilterTestResult[],
  language: string,
): LanguageMetrics {
  const langResults = results.filter((r) => r.language === language);
  const metrics = calculateMetrics(langResults);
  const latencies = langResults.map((r) => r.processingTimeMs);

  return {
    language,
    total: langResults.length,
    correct: langResults.filter((r) => r.isCorrect).length,
    accuracy:
      langResults.filter((r) => r.isCorrect).length / langResults.length,
    ...metrics.confusionMatrix,
    precision: metrics.precision,
    recall: metrics.recall,
    f1Score: metrics.f1Score,
    avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
  };
}

function calculateCategoryMetrics(
  results: FilterTestResult[],
  category: string,
): CategoryMetrics {
  const catResults = results.filter((r) => r.category === category);
  return {
    category,
    total: catResults.length,
    correct: catResults.filter((r) => r.isCorrect).length,
    accuracy: catResults.filter((r) => r.isCorrect).length / catResults.length,
  };
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTests(mode: "regex" | "ai" = "regex"): Promise<TestSummary> {
  console.log("═".repeat(70));
  console.log(`🧪 JoSan Filter Test Runner - Mode: ${mode.toUpperCase()}`);
  console.log("═".repeat(70));

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(__dirname, "..");
  const dataDir = path.join(projectRoot, "public", "data");

  // Load wordlists
  console.log("\n📚 Loading wordlists...");
  const englishWordList = loadWordList(path.join(dataDir, "en.txt"), "english");
  const tagalogWordList = loadWordList(path.join(dataDir, "tl.txt"), "tagalog");
  const bisayaWordList = loadWordList(path.join(dataDir, "bis.txt"), "bisaya");

  console.log(`   English: ${englishWordList.words.length} words`);
  console.log(`   Tagalog: ${tagalogWordList.words.length} words`);
  console.log(`   Bisaya: ${bisayaWordList.words.length} words`);

  const wordLists = [englishWordList, tagalogWordList, bisayaWordList];

  // Combine all test cases
  const allTestCases: Array<{ testCase: TestCase; language: string }> = [
    ...englishCleanCases.map((tc) => ({ testCase: tc, language: "english" })),
    ...englishToxicCases.map((tc) => ({ testCase: tc, language: "english" })),
    ...tagalogCleanCases.map((tc) => ({ testCase: tc, language: "tagalog" })),
    ...tagalogToxicCases.map((tc) => ({ testCase: tc, language: "tagalog" })),
    ...bisayaCleanCases.map((tc) => ({ testCase: tc, language: "bisaya" })),
    ...bisayaToxicCases.map((tc) => ({ testCase: tc, language: "bisaya" })),
  ];

  console.log(`\n🔬 Running ${allTestCases.length} tests...\n`);

  const results: FilterTestResult[] = [];
  const errors: { testId: number; error: string }[] = [];
  const startTime = performance.now();

  // Run tests
  for (let i = 0; i < allTestCases.length; i++) {
    const { testCase, language } = allTestCases[i];

    try {
      const filterResult = testFilter(testCase.text, wordLists);
      const predictedLabel = classifyResult(filterResult.matchCount);

      const isCorrect = predictedLabel === testCase.expectedLabel;

      results.push({
        testId: testCase.id,
        language,
        text: testCase.text,
        expectedLabel: testCase.expectedLabel,
        predictedLabel,
        category: testCase.category,
        isCorrect,
        processingTimeMs: filterResult.processingTimeMs,
        matchCount: filterResult.matchCount,
        matchedWords: filterResult.matchedWords,
        obfuscationDetected: filterResult.obfuscationDetected,
        obfuscationTypes: filterResult.obfuscationTypes,
      });

      // Progress indicator
      const icon = isCorrect ? "✓" : "✗";
      const obfIndicator = filterResult.obfuscationDetected ? " [OBF]" : "";
      process.stdout.write(
        `\r[${i + 1}/${allTestCases.length}] #${testCase.id} (${language})... ${icon}${obfIndicator}`,
      );
    } catch (error) {
      errors.push({
        testId: testCase.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log("\n");

  const totalTimeMs = performance.now() - startTime;
  const latencies = results
    .map((r) => r.processingTimeMs)
    .sort((a, b) => a - b);

  // Calculate overall metrics
  const overallMetrics = calculateMetrics(results);
  const correctCount = results.filter((r) => r.isCorrect).length;

  // Calculate obfuscation stats
  const obfuscatedResults = results.filter((r) => r.obfuscationDetected);
  const obfuscationStats = {
    totalObfuscated: obfuscatedResults.length,
    correctlyClassified: obfuscatedResults.filter((r) => r.isCorrect).length,
    accuracy:
      obfuscatedResults.length > 0
        ? obfuscatedResults.filter((r) => r.isCorrect).length /
          obfuscatedResults.length
        : 0,
  };

  // Get unique categories
  const categories = [...new Set(results.map((r) => r.category))];

  const summary: TestSummary = {
    testType: mode,
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    correctPredictions: correctCount,
    overallAccuracy: correctCount / results.length,
    precision: overallMetrics.precision,
    recall: overallMetrics.recall,
    f1Score: overallMetrics.f1Score,
    confusionMatrix: overallMetrics.confusionMatrix,
    latencyStats: {
      totalTimeMs,
      avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      minLatencyMs: latencies[0] || 0,
      maxLatencyMs: latencies[latencies.length - 1] || 0,
      medianLatencyMs: latencies[Math.floor(latencies.length / 2)] || 0,
      p95LatencyMs: latencies[Math.floor(latencies.length * 0.95)] || 0,
    },
    obfuscationStats,
    byLanguage: [
      calculateLanguageMetrics(results, "english"),
      calculateLanguageMetrics(results, "tagalog"),
      calculateLanguageMetrics(results, "bisaya"),
    ],
    byCategory: categories.map((cat) => calculateCategoryMetrics(results, cat)),
    results,
    errors,
  };

  // Print summary
  printSummary(summary);

  return summary;
}

function printSummary(summary: TestSummary): void {
  console.log("\n" + "═".repeat(70));
  console.log("📊 TEST SUMMARY");
  console.log("═".repeat(70));

  console.log(`
┌─────────────────────────────────────────────────────────────────────┐
│                         OVERALL METRICS                            │
├─────────────────────────────────────────────────────────────────────┤
│  Total Tests:       ${String(summary.totalTests).padEnd(10)} Correct: ${String(summary.correctPredictions).padEnd(10)}   │
│  Overall Accuracy:  ${(summary.overallAccuracy * 100).toFixed(2).padEnd(10)}%                              │
│  Precision:         ${(summary.precision * 100).toFixed(2).padEnd(10)}%                              │
│  Recall:            ${(summary.recall * 100).toFixed(2).padEnd(10)}%                              │
│  F1 Score:          ${(summary.f1Score * 100).toFixed(2).padEnd(10)}%                              │
└─────────────────────────────────────────────────────────────────────┘
`);

  console.log("📌 BY LANGUAGE:");
  console.log("─".repeat(70));
  for (const lang of summary.byLanguage) {
    console.log(
      `  ${lang.language.padEnd(10)}: ${(lang.accuracy * 100).toFixed(1)}% accuracy, ` +
        `F1: ${(lang.f1Score * 100).toFixed(1)}%, ` +
        `Precision: ${(lang.precision * 100).toFixed(1)}%, ` +
        `Recall: ${(lang.recall * 100).toFixed(1)}%`,
    );
  }

  console.log("\n📂 BY CATEGORY (sorted by accuracy):");
  console.log("─".repeat(70));
  const sortedCategories = [...summary.byCategory].sort(
    (a, b) => b.accuracy - a.accuracy,
  );
  for (const cat of sortedCategories) {
    const bar = "█".repeat(Math.round(cat.accuracy * 10));
    console.log(
      `  ${cat.category.padEnd(20)}: ${cat.correct}/${cat.total} (${(cat.accuracy * 100).toFixed(0)}%) ${bar}`,
    );
  }

  console.log("\n⏱️  LATENCY:");
  console.log("─".repeat(70));
  console.log(`  Average: ${summary.latencyStats.avgLatencyMs.toFixed(2)}ms`);
  console.log(
    `  Median:  ${summary.latencyStats.medianLatencyMs.toFixed(2)}ms`,
  );
  console.log(`  P95:     ${summary.latencyStats.p95LatencyMs.toFixed(2)}ms`);
  console.log(`  Total:   ${summary.latencyStats.totalTimeMs.toFixed(2)}ms`);

  if (summary.obfuscationStats.totalObfuscated > 0) {
    console.log("\n🔍 OBFUSCATION DETECTION:");
    console.log("─".repeat(70));
    console.log(
      `  Total Obfuscated:     ${summary.obfuscationStats.totalObfuscated}`,
    );
    console.log(
      `  Correctly Classified: ${summary.obfuscationStats.correctlyClassified}`,
    );
    console.log(
      `  Accuracy:             ${(summary.obfuscationStats.accuracy * 100).toFixed(1)}%`,
    );
  }

  // Show misclassifications
  const misclassified = summary.results.filter((r) => !r.isCorrect);
  if (misclassified.length > 0) {
    console.log("\n❌ MISCLASSIFICATIONS (first 10):");
    console.log("─".repeat(70));
    for (const r of misclassified.slice(0, 10)) {
      console.log(
        `  #${r.testId} [${r.language}] ${r.category}: Expected ${r.expectedLabel} → Got ${r.predictedLabel}`,
      );
      console.log(`    "${r.text.substring(0, 60)}..."`);
      if (r.matchedWords.length > 0) {
        console.log(`    Matched: ${r.matchedWords.join(", ")}`);
      }
    }
  }
}

// ============================================================================
// Export to JSON
// ============================================================================

function exportResults(summary: TestSummary, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args.includes("--mode=ai") ? "ai" : "regex";
  const shouldExport = args.includes("--export") || true; // Always export

  const summary = await runTests(mode);

  if (shouldExport) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const outputPath = path.join(
      __dirname,
      "results",
      `${mode}-test-results.json`,
    );
    exportResults(summary, outputPath);
  }
}

main().catch(console.error);
