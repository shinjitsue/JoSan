/**
 * Regex-Only (No AI) Multilingual Test
 *
 * This test evaluates the hybrid filtering system WITHOUT AI to compare:
 * - Precision, Recall, F1 Score
 * - Accuracy per language
 * - Confusion Matrix
 *
 * Uses ONLY:
 * - Bloom Filter pre-screening
 * - Trie Filter matching
 * - Text normalization (leet speak, spaced, vowel removal)
 *
 * NO AI/OpenAI calls are made in this test.
 *
 * Run: npx tsx tests/regex-only-test-multilingual.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// Import test cases
import { englishTestCases } from "./test-cases/english-test-cases";
import { tagalogTestCases } from "./test-cases/tagalog-test-cases";
import { bisayaTestCases } from "./test-cases/bisaya-test-cases";
import { type TestCase } from "./test-cases/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// MULTILINGUAL PROFANITY LISTS
// ============================================================

// English profanity
const englishToxicProfanityList = [
  "fuck",
  "fucking",
  "fucked",
  "fucker",
  "shit",
  "shitty",
  "bullshit",
  "bitch",
  "asshole",
  "dick",
  "cock",
  "pussy",
  "bastard",
  "whore",
  "slut",
  "retard",
  "retarded",
  "nigger",
  "fag",
  "faggot",
  "cunt",
];

const englishMildProfanityList = [
  "ass",
  "damn",
  "hell",
  "crap",
  "idiot",
  "moron",
  "stupid",
  "dumb",
  "dumbest",
  "pathetic",
  "loser",
  "ugly",
  "disgusting",
];

// Tagalog profanity
const tagalogToxicProfanityList = [
  "putangina",
  "putang ina",
  "puta",
  "gago",
  "gaga",
  "ulol",
  "tanga",
  "bobo",
  "boba",
  "tarantado",
  "leche",
  "punyeta",
  "hinayupak",
  "hayop",
  "walang hiya",
  "walanghiya",
  "kingina",
  "pota",
  "ampota",
  "amputa",
  "pakyu",
  "pakingshet",
  "bwisit",
  "buwisit",
  "peste",
  "lintik",
  "engot",
  "tangek",
  "abnoy",
  "timang",
  "gunggong",
];

const tagalogMildProfanityList = [
  "siraulo",
  "sira ulo",
  "hudas",
  "demonyo",
  "salot",
  "malas",
  "kupad",
  "duwag",
  "hangal",
];

// Bisaya profanity
const bisayaToxicProfanityList = [
  "yawa",
  "piste",
  "pisti",
  "buang",
  "boang",
  "bogo",
  "linti",
  "lintik",
  "law-ay",
  "laway",
  "yati",
  "hinampak",
  "animal",
  "satanas",
  "gaba",
  "maot",
  "maoton",
  "bogoon",
  "bugo",
  "bombels",
  "panget",
  "pisting yawa",
];

const bisayaMildProfanityList = [
  "samok",
  "kapoy",
  "lisod",
  "way pulos",
  "way klaro",
  "bawog",
];

// Combined multilingual lists
const allToxicProfanityList = [
  ...englishToxicProfanityList,
  ...tagalogToxicProfanityList,
  ...bisayaToxicProfanityList,
];

const allBasicProfanityList = [
  ...englishToxicProfanityList,
  ...englishMildProfanityList,
  ...tagalogToxicProfanityList,
  ...tagalogMildProfanityList,
  ...bisayaToxicProfanityList,
  ...bisayaMildProfanityList,
];

// ============================================================
// LANGUAGE DETECTION
// ============================================================

type DetectedLanguage = "english" | "tagalog" | "bisaya" | "mixed";

// ============================================================
// MULTILINGUAL TEXT NORMALIZER
// ============================================================

class MultilingualTextNormalizer {
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
    v: "u",
  };

  static normalizeLeetSpeak(text: string, language: DetectedLanguage): string {
    let normalized = text.toLowerCase();

    if (language === "english" || language === "mixed") {
      normalized = normalized.replace(/f4ck/gi, "fuck");
    }

    if (language === "tagalog" || language === "mixed") {
      normalized = normalized.replace(/put4ng\s*1n4/gi, "putang ina");
      normalized = normalized.replace(/put4ng1n4/gi, "putangina");
      normalized = normalized.replace(/g4g0/gi, "gago");
      normalized = normalized.replace(/b0b0/gi, "bobo");
      normalized = normalized.replace(/t4ng4/gi, "tanga");
      normalized = normalized.replace(/ul0l/gi, "ulol");
      normalized = normalized.replace(/t4r4nt4d0/gi, "tarantado");
      normalized = normalized.replace(/p0t4/gi, "pota");
      normalized = normalized.replace(/l3ch3/gi, "leche");
    }

    if (language === "bisaya" || language === "mixed") {
      normalized = normalized.replace(/y4w4/gi, "yawa");
      normalized = normalized.replace(/p1st3/gi, "piste");
      normalized = normalized.replace(/bu4ng/gi, "buang");
      normalized = normalized.replace(/b0g0/gi, "bogo");
      normalized = normalized.replace(/l1nt1/gi, "linti");
      normalized = normalized.replace(/l4w-?4y/gi, "law-ay");
      normalized = normalized.replace(/y4t1/gi, "yati");
    }

    for (const [leet, normal] of Object.entries(this.leetMap)) {
      normalized = normalized.split(leet).join(normal);
    }

    return normalized;
  }

  static normalizeSpacedText(text: string, language: DetectedLanguage): string {
    let normalized = text.toLowerCase();

    if (language === "english" || language === "mixed") {
      normalized = normalized.replace(/f\s*u\s*c\s*k/gi, "fuck");
      normalized = normalized.replace(/s\s*h\s*i\s*t/gi, "shit");
      normalized = normalized.replace(/b\s*i\s*t\s*c\s*h/gi, "bitch");
      normalized = normalized.replace(/a\s*s\s*s\s*h\s*o\s*l\s*e/gi, "asshole");
    }

    if (language === "tagalog" || language === "mixed") {
      normalized = normalized.replace(
        /p\s*u\s*t\s*a\s*n\s*g\s*i\s*n\s*a/gi,
        "putangina"
      );
      normalized = normalized.replace(/g\s*a\s*g\s*o/gi, "gago");
      normalized = normalized.replace(/u\s*l\s*o\s*l/gi, "ulol");
      normalized = normalized.replace(/t\s*a\s*n\s*g\s*a/gi, "tanga");
      normalized = normalized.replace(/b\s*o\s*b\s*o/gi, "bobo");
      normalized = normalized.replace(/p\s*u\s*n\s*y\s*e\s*t\s*a/gi, "punyeta");
      normalized = normalized.replace(/p\s*u\s*t\s*a/gi, "puta");
    }

    if (language === "bisaya" || language === "mixed") {
      normalized = normalized.replace(/y\s*a\s*w\s*a/gi, "yawa");
      normalized = normalized.replace(/b\s*u\s*a\s*n\s*g/gi, "buang");
      normalized = normalized.replace(/b\s*o\s*g\s*o/gi, "bogo");
      normalized = normalized.replace(/p\s*i\s*s\s*t\s*e/gi, "piste");
      normalized = normalized.replace(/l\s*i\s*n\s*t\s*i/gi, "linti");
      normalized = normalized.replace(/l\s*a\s*w\s*-?\s*a\s*y/gi, "law-ay");
    }

    const spacedPattern =
      /(?<![a-z0-9])([a-z0-9])[\s.\-_*#@!~`'";:/\\]+([a-z0-9])[\s.\-_*#@!~`'";:/\\]+([a-z0-9])(?:[\s.\-_*#@!~`'";:/\\]+([a-z0-9]))*(?=[,\s]|$)/gi;

    normalized = normalized.replace(spacedPattern, (match) => {
      return match.replace(/[^a-z0-9]/gi, "");
    });

    return normalized;
  }

  static normalize(
    text: string,
    language: DetectedLanguage = "mixed"
  ): {
    original: string;
    normalized: string;
    transformations: string[];
  } {
    const transformations: string[] = [];
    let normalized = text;

    const leetNorm = this.normalizeLeetSpeak(text, language);
    if (leetNorm !== text.toLowerCase()) {
      transformations.push("leet_speak");
      normalized = leetNorm;
    }

    const spacedNorm = this.normalizeSpacedText(normalized, language);
    if (spacedNorm !== normalized.toLowerCase()) {
      transformations.push("spaced");
      normalized = spacedNorm;
    }

    return {
      original: text,
      normalized: normalized.toLowerCase(),
      transformations,
    };
  }
}

// ============================================================
// MOCK BLOOM FILTER
// ============================================================

class MockBloomFilter {
  private words: Set<string> = new Set();

  add(word: string): void {
    this.words.add(word.toLowerCase());
  }

  mightContain(word: string): boolean {
    return this.words.has(word.toLowerCase());
  }
}

// ============================================================
// MOCK TRIE FILTER
// ============================================================

class MockTrieFilter {
  private words: Set<string> = new Set();

  addWord(word: string): void {
    this.words.add(word.toLowerCase());
  }

  filterText(
    text: string,
    replacement: string = "*"
  ): { filteredText: string; matchCount: number; detectedLanguages: string[] } {
    let filteredText = text;
    let matchCount = 0;
    const detectedLanguages: string[] = [];

    // Check normalized text for obfuscated matches
    const { normalized, transformations } =
      MultilingualTextNormalizer.normalize(text, "mixed");
    const wordsArray = Array.from(this.words);

    if (transformations.length > 0) {
      for (const word of wordsArray) {
        if (normalized.includes(word)) {
          matchCount++;
          detectedLanguages.push("obfuscated");
        }
      }
    }

    // Check original words
    const originalWords = text.toLowerCase().match(/\b[\w-]+\b/g) || [];
    for (const word of originalWords) {
      if (this.words.has(word)) {
        const regex = new RegExp(
          `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "gi"
        );
        filteredText = filteredText.replace(
          regex,
          replacement.repeat(word.length)
        );
        matchCount++;
        detectedLanguages.push("direct");
      }
    }

    return { filteredText, matchCount, detectedLanguages };
  }
}

// ============================================================
// WORD LIST DATA SETUP
// ============================================================

function createWordListData() {
  const bloom = new MockBloomFilter();
  const trie = new MockTrieFilter();

  for (const word of allBasicProfanityList) {
    bloom.add(word);
    trie.addWord(word);
  }

  return { bloom, trie };
}

// ============================================================
// REGEX-ONLY TEST RUNNER
// ============================================================

interface RegexTestResult {
  testCase: TestCase;
  predictedLabel: string;
  isCorrect: boolean;
  matchCount: number;
  obfuscationDetected: boolean;
  processingTimeMs: number;
}

function runRegexOnlyTest(
  testCase: TestCase,
  wordListData: { bloom: MockBloomFilter; trie: MockTrieFilter }
): RegexTestResult {
  const startTime = performance.now();

  // Step 1: Normalize text
  const normalized = MultilingualTextNormalizer.normalize(
    testCase.text,
    "mixed"
  );

  // Step 2: Check with Bloom filter
  const words = normalized.normalized.match(/\b[\w-]+\b/g) || [];
  let bloomTriggered = false;

  for (const word of words) {
    if (wordListData.bloom.mightContain(word)) {
      bloomTriggered = true;
      break;
    }
  }

  // Also check original text words
  const originalWords = testCase.text.toLowerCase().match(/\b[\w-]+\b/g) || [];
  for (const word of originalWords) {
    if (wordListData.bloom.mightContain(word)) {
      bloomTriggered = true;
      break;
    }
  }

  // Step 3: Trie filter
  let trieResult = {
    filteredText: testCase.text,
    matchCount: 0,
    detectedLanguages: [] as string[],
  };
  if (bloomTriggered) {
    trieResult = wordListData.trie.filterText(testCase.text);
  }

  // Step 4: Determine label based on matches
  let predictedLabel: string;
  const obfuscationDetected = normalized.transformations.length > 0;

  if (trieResult.matchCount >= 2) {
    predictedLabel = "toxic";
  } else if (trieResult.matchCount === 1) {
    // With obfuscation, single match is likely toxic
    predictedLabel = obfuscationDetected ? "toxic" : "mild";
  } else {
    predictedLabel = "clean";
  }

  const processingTimeMs = performance.now() - startTime;

  // Check correctness (toxic = toxic/mild, clean = clean)
  let isCorrect = false;
  if (testCase.expectedLabel === "clean") {
    isCorrect = predictedLabel === "clean";
  } else if (testCase.expectedLabel === "toxic") {
    isCorrect = predictedLabel === "toxic" || predictedLabel === "mild";
  } else if (testCase.expectedLabel === "mild") {
    isCorrect = predictedLabel === "toxic" || predictedLabel === "mild";
  }

  return {
    testCase,
    predictedLabel,
    isCorrect,
    matchCount: trieResult.matchCount,
    obfuscationDetected,
    processingTimeMs,
  };
}

// ============================================================
// SUMMARY CALCULATION
// ============================================================

interface TestSummary {
  total: number;
  correct: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  specificity: number;
  balancedAccuracy: number;
  mcc: number;
  cleanAccuracy: number;
  toxicAccuracy: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  confusionMatrix: {
    tp: number;
    fp: number;
    tn: number;
    fn: number;
  };
  byLanguage: Record<
    string,
    {
      total: number;
      correct: number;
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
      cleanCorrect: number;
      cleanTotal: number;
      toxicCorrect: number;
      toxicTotal: number;
      avgLatencyMs: number;
      confusionMatrix: { tp: number; fp: number; tn: number; fn: number };
    }
  >;
  byCategory: Record<
    string,
    { correct: number; total: number; accuracy: number }
  >;
}

function calculateSummary(results: RegexTestResult[]): TestSummary {
  const total = results.length;
  const correct = results.filter((r) => r.isCorrect).length;
  const accuracy = (correct / total) * 100;

  // Confusion Matrix (toxic vs non-toxic)
  let tp = 0,
    fp = 0,
    tn = 0,
    fn = 0;
  for (const r of results) {
    const actualToxic =
      r.testCase.expectedLabel === "toxic" ||
      r.testCase.expectedLabel === "mild";
    const predictedToxic =
      r.predictedLabel === "toxic" || r.predictedLabel === "mild";

    if (actualToxic && predictedToxic) tp++;
    else if (!actualToxic && predictedToxic) fp++;
    else if (!actualToxic && !predictedToxic) tn++;
    else if (actualToxic && !predictedToxic) fn++;
  }

  const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0;
  const recall = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
  const f1Score =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;
  const specificity = tn + fp > 0 ? (tn / (tn + fp)) * 100 : 0;
  const balancedAccuracy = (recall + specificity) / 2;

  // Matthews Correlation Coefficient
  const mccNumerator = tp * tn - fp * fn;
  const mccDenominator = Math.sqrt(
    (tp + fp) * (tp + fn) * (tn + fp) * (tn + fn)
  );
  const mcc = mccDenominator > 0 ? mccNumerator / mccDenominator : 0;

  // Per-class accuracy
  const cleanResults = results.filter(
    (r) => r.testCase.expectedLabel === "clean"
  );
  const toxicResults = results.filter(
    (r) =>
      r.testCase.expectedLabel === "toxic" ||
      r.testCase.expectedLabel === "mild"
  );
  const cleanAccuracy =
    cleanResults.length > 0
      ? (cleanResults.filter((r) => r.isCorrect).length / cleanResults.length) *
        100
      : 0;
  const toxicAccuracy =
    toxicResults.length > 0
      ? (toxicResults.filter((r) => r.isCorrect).length / toxicResults.length) *
        100
      : 0;

  // Latency stats
  const latencies = results
    .map((r) => r.processingTimeMs)
    .sort((a, b) => a - b);
  const avgLatencyMs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const minLatencyMs = latencies[0];
  const maxLatencyMs = latencies[latencies.length - 1];
  const medianLatencyMs = latencies[Math.floor(latencies.length / 2)];
  const p95LatencyMs = latencies[Math.floor(latencies.length * 0.95)];

  // By language
  const byLanguage: TestSummary["byLanguage"] = {};
  const languages = [...new Set(results.map((r) => r.testCase.language))];
  for (const lang of languages) {
    const langResults = results.filter((r) => r.testCase.language === lang);
    const langCorrect = langResults.filter((r) => r.isCorrect).length;

    let langTp = 0,
      langFp = 0,
      langTn = 0,
      langFn = 0;
    for (const r of langResults) {
      const actualToxic =
        r.testCase.expectedLabel === "toxic" ||
        r.testCase.expectedLabel === "mild";
      const predictedToxic =
        r.predictedLabel === "toxic" || r.predictedLabel === "mild";
      if (actualToxic && predictedToxic) langTp++;
      else if (!actualToxic && predictedToxic) langFp++;
      else if (!actualToxic && !predictedToxic) langTn++;
      else if (actualToxic && !predictedToxic) langFn++;
    }

    const langPrecision =
      langTp + langFp > 0 ? (langTp / (langTp + langFp)) * 100 : 0;
    const langRecall =
      langTp + langFn > 0 ? (langTp / (langTp + langFn)) * 100 : 0;
    const langF1 =
      langPrecision + langRecall > 0
        ? (2 * langPrecision * langRecall) / (langPrecision + langRecall)
        : 0;

    const cleanLang = langResults.filter(
      (r) => r.testCase.expectedLabel === "clean"
    );
    const toxicLang = langResults.filter(
      (r) =>
        r.testCase.expectedLabel === "toxic" ||
        r.testCase.expectedLabel === "mild"
    );

    byLanguage[lang] = {
      total: langResults.length,
      correct: langCorrect,
      accuracy: (langCorrect / langResults.length) * 100,
      precision: langPrecision,
      recall: langRecall,
      f1Score: langF1,
      cleanCorrect: cleanLang.filter((r) => r.isCorrect).length,
      cleanTotal: cleanLang.length,
      toxicCorrect: toxicLang.filter((r) => r.isCorrect).length,
      toxicTotal: toxicLang.length,
      avgLatencyMs:
        langResults.reduce((a, r) => a + r.processingTimeMs, 0) /
        langResults.length,
      confusionMatrix: { tp: langTp, fp: langFp, tn: langTn, fn: langFn },
    };
  }

  // By category
  const byCategory: TestSummary["byCategory"] = {};
  const categories = [...new Set(results.map((r) => r.testCase.category))];
  for (const cat of categories) {
    const catResults = results.filter((r) => r.testCase.category === cat);
    const catCorrect = catResults.filter((r) => r.isCorrect).length;
    byCategory[cat] = {
      correct: catCorrect,
      total: catResults.length,
      accuracy: (catCorrect / catResults.length) * 100,
    };
  }

  return {
    total,
    correct,
    accuracy,
    precision,
    recall,
    f1Score,
    specificity,
    balancedAccuracy,
    mcc,
    cleanAccuracy,
    toxicAccuracy,
    avgLatencyMs,
    minLatencyMs,
    maxLatencyMs,
    medianLatencyMs,
    p95LatencyMs,
    confusionMatrix: { tp, fp, tn, fn },
    byLanguage,
    byCategory,
  };
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

function runTests(): void {
  console.log(
    "══════════════════════════════════════════════════════════════════════"
  );
  console.log("🔤 JoSan REGEX-ONLY Multilingual Test (No AI)");
  console.log("   Languages: English, Tagalog, Bisaya");
  console.log(
    "══════════════════════════════════════════════════════════════════════"
  );
  console.log("");
  console.log(
    "📋 This test uses ONLY Bloom Filter + Trie Filter + Text Normalization"
  );
  console.log("   NO AI/OpenAI calls are made.");
  console.log("");

  // Prepare test cases
  const allTestCases: TestCase[] = [
    ...englishTestCases.map((tc) => ({ ...tc, language: "english" as const })),
    ...tagalogTestCases.map((tc) => ({ ...tc, language: "tagalog" as const })),
    ...bisayaTestCases.map((tc) => ({ ...tc, language: "bisaya" as const })),
  ];

  console.log(`   Total tests: ${allTestCases.length}`);
  console.log(`   - English: ${englishTestCases.length}`);
  console.log(`   - Tagalog: ${tagalogTestCases.length}`);
  console.log(`   - Bisaya: ${bisayaTestCases.length}`);
  console.log("");

  // Create word list data
  const wordListData = createWordListData();

  // Run tests
  const results: RegexTestResult[] = [];
  let currentLanguage = "";

  for (let i = 0; i < allTestCases.length; i++) {
    const tc = allTestCases[i];

    if (tc.language !== currentLanguage) {
      currentLanguage = tc.language;
      console.log("");
      console.log("──────────────────────────────────────────────────");
      console.log(`📚 Testing ${tc.language.toUpperCase()} cases`);
      console.log("──────────────────────────────────────────────────");
    }

    const result = runRegexOnlyTest(tc, wordListData);
    results.push(result);

    const status = result.isCorrect ? "✓" : "✗";
    const obfFlag = result.obfuscationDetected ? " [OBF]" : "";
    const matchInfo =
      result.matchCount > 0 ? ` (${result.matchCount} matches)` : "";

    if (!result.isCorrect) {
      console.log(
        `[${i + 1}/${allTestCases.length}] #${tc.id} (${
          tc.language
        })... ${status} Expected: ${tc.expectedLabel}, Got: ${
          result.predictedLabel
        }${obfFlag}${matchInfo}`
      );
      console.log(
        `      Text: "${tc.text.substring(0, 60)}${
          tc.text.length > 60 ? "..." : ""
        }"`
      );
      console.log(`      Category: ${tc.category}`);
    } else {
      console.log(
        `[${i + 1}/${allTestCases.length}] #${tc.id} (${
          tc.language
        })... ${status} Expected: ${tc.expectedLabel}, Got: ${
          result.predictedLabel
        }${obfFlag}${matchInfo}`
      );
    }
  }

  // Calculate summary
  const summary = calculateSummary(results);

  // Print comprehensive summary
  printSummary(summary, results);

  // Save results to JSON
  const outputPath = path.join(
    __dirname,
    "regex-only-results-multilingual.json"
  );
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary,
        results: results.map((r) => ({
          id: r.testCase.id,
          language: r.testCase.language,
          category: r.testCase.category,
          text: r.testCase.text,
          expectedLabel: r.testCase.expectedLabel,
          predictedLabel: r.predictedLabel,
          isCorrect: r.isCorrect,
          matchCount: r.matchCount,
          obfuscationDetected: r.obfuscationDetected,
          processingTimeMs: r.processingTimeMs,
        })),
      },
      null,
      2
    )
  );

  console.log("");
  console.log(`💾 Results saved to: ${outputPath}`);
}

function printSummary(summary: TestSummary, results: RegexTestResult[]): void {
  const { confusionMatrix: cm } = summary;

  console.log("");
  console.log(
    "════════════════════════════════════════════════════════════════════════════════"
  );
  console.log("📊 COMPREHENSIVE TEST SUMMARY - REGEX-ONLY (NO AI)");
  console.log(
    "════════════════════════════════════════════════════════════════════════════════"
  );

  // Overall Statistics
  console.log("");
  console.log(
    "┌─────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│                           OVERALL STATISTICS                                │"
  );
  console.log(
    "├─────────────────────────────────────────────────────────────────────────────┤"
  );
  console.log(
    `│  Total Tests:          ${summary.total
      .toString()
      .padEnd(10)} │  Correct Predictions:  ${summary.correct
      .toString()
      .padEnd(10)} │`
  );
  console.log(
    `│  Overall Accuracy:     ${summary.accuracy
      .toFixed(2)
      .padEnd(10)} % │  Total API Calls:      0           │`
  );
  console.log(
    "└─────────────────────────────────────────────────────────────────────────────┘"
  );

  // Confusion Matrix
  console.log("");
  console.log(
    "┌─────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│                          CONFUSION MATRIX (Toxic vs Non-Toxic)             │"
  );
  console.log(
    "├─────────────────────────────────────────────────────────────────────────────┤"
  );
  console.log(
    "│                              Predicted                                      │"
  );
  console.log(
    "│                        Toxic          Non-Toxic                            │"
  );
  console.log(
    "│              ┌──────────────────┬──────────────────┐                       │"
  );
  console.log(
    `│    Actual    │  TP: ${cm.tp.toString().padEnd(10)} │  FN: ${cm.fn
      .toString()
      .padEnd(9)}│  Toxic               │`
  );
  console.log(
    "│              ├──────────────────┼──────────────────┤                       │"
  );
  console.log(
    `│              │  FP: ${cm.fp.toString().padEnd(10)} │  TN: ${cm.tn
      .toString()
      .padEnd(9)}│  Non-Toxic           │`
  );
  console.log(
    "│              └──────────────────┴──────────────────┘                       │"
  );
  console.log(
    "└─────────────────────────────────────────────────────────────────────────────┘"
  );

  // Classification Metrics
  console.log("");
  console.log(
    "┌─────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│                           CLASSIFICATION METRICS                           │"
  );
  console.log(
    "├─────────────────────────────────────────────────────────────────────────────┤"
  );
  console.log(
    `│  Precision:            ${summary.precision
      .toFixed(2)
      .padEnd(10)} %  (TP / (TP + FP))                         │`
  );
  console.log(
    `│  Recall (Sensitivity): ${summary.recall
      .toFixed(2)
      .padEnd(10)} %  (TP / (TP + FN))                         │`
  );
  console.log(
    `│  Specificity:          ${summary.specificity
      .toFixed(2)
      .padEnd(10)} %  (TN / (TN + FP))                         │`
  );
  console.log(
    `│  F1 Score:             ${summary.f1Score
      .toFixed(2)
      .padEnd(10)} %  (2 * P * R / (P + R))                     │`
  );
  console.log(
    `│  Balanced Accuracy:    ${summary.balancedAccuracy
      .toFixed(2)
      .padEnd(10)} %  ((Recall + Specificity) / 2)            │`
  );
  console.log(
    `│  MCC:                  ${summary.mcc
      .toFixed(4)
      .padEnd(12)}   (Matthews Correlation Coefficient)         │`
  );
  console.log(
    "└─────────────────────────────────────────────────────────────────────────────┘"
  );

  // Per-Class Accuracy
  console.log("");
  console.log(
    "┌─────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│                            PER-CLASS ACCURACY                              │"
  );
  console.log(
    "├─────────────────────────────────────────────────────────────────────────────┤"
  );
  const cleanBar = "█".repeat(Math.round(summary.cleanAccuracy / 10));
  const toxicBar = "█".repeat(Math.round(summary.toxicAccuracy / 10));
  console.log(
    `│  Clean Accuracy:       ${summary.cleanAccuracy
      .toFixed(2)
      .padEnd(10)} %  ${cleanBar.padEnd(30)} │`
  );
  console.log(
    `│  Toxic Accuracy:       ${summary.toxicAccuracy
      .toFixed(2)
      .padEnd(10)} %  ${toxicBar.padEnd(30)} │`
  );
  console.log(
    "└─────────────────────────────────────────────────────────────────────────────┘"
  );

  // Latency Statistics
  console.log("");
  console.log(
    "┌─────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│                           LATENCY STATISTICS                               │"
  );
  console.log(
    "├─────────────────────────────────────────────────────────────────────────────┤"
  );
  const totalTimeMs = results.reduce((a, r) => a + r.processingTimeMs, 0);
  console.log(
    `│  Total Time:           ${(totalTimeMs / 1000)
      .toFixed(2)
      .padEnd(10)} s                                         │`
  );
  console.log(
    `│  Average Latency:      ${summary.avgLatencyMs
      .toFixed(3)
      .padEnd(10)} ms                                        │`
  );
  console.log(
    `│  Min Latency:          ${summary.minLatencyMs
      .toFixed(3)
      .padEnd(10)} ms                                        │`
  );
  console.log(
    `│  Max Latency:          ${summary.maxLatencyMs
      .toFixed(3)
      .padEnd(10)} ms                                        │`
  );
  console.log(
    `│  Median Latency:       ${summary.medianLatencyMs
      .toFixed(3)
      .padEnd(10)} ms                                        │`
  );
  console.log(
    `│  95th Percentile:      ${summary.p95LatencyMs
      .toFixed(3)
      .padEnd(10)} ms                                        │`
  );
  console.log(
    "└─────────────────────────────────────────────────────────────────────────────┘"
  );

  // Accuracy by Language
  console.log("");
  console.log(
    "════════════════════════════════════════════════════════════════════════════════"
  );
  console.log("📌 ACCURACY BY LANGUAGE");
  console.log(
    "════════════════════════════════════════════════════════════════════════════════"
  );
  console.log("");
  console.log(
    "┌──────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│ Language     │ Correct/Total │ Accuracy │ Precision │ Recall │ F1 Score     │"
  );
  console.log(
    "├──────────────────────────────────────────────────────────────────────────────┤"
  );

  for (const [lang, stats] of Object.entries(summary.byLanguage)) {
    console.log(
      `│ ${lang.padEnd(12)} │ ${stats.correct}/${stats.total}`.padEnd(30) +
        `│ ${stats.accuracy.toFixed(1).padEnd(8)} % │ ${stats.precision
          .toFixed(1)
          .padEnd(9)} % │ ${stats.recall
          .toFixed(1)
          .padEnd(6)} % │ ${stats.f1Score.toFixed(1).padEnd(12)} % │`
    );
  }
  console.log(
    "└──────────────────────────────────────────────────────────────────────────────┘"
  );

  // Detailed breakdown by language
  console.log("");
  console.log("📊 DETAILED BREAKDOWN BY LANGUAGE:");
  console.log(
    "────────────────────────────────────────────────────────────────────────────────"
  );

  for (const [lang, stats] of Object.entries(summary.byLanguage)) {
    const cleanAcc =
      stats.cleanTotal > 0 ? (stats.cleanCorrect / stats.cleanTotal) * 100 : 0;
    const toxicAcc =
      stats.toxicTotal > 0 ? (stats.toxicCorrect / stats.toxicTotal) * 100 : 0;

    console.log("");
    console.log(`  🌐 ${lang.toUpperCase()}`);
    console.log("  ────────────────────────────────────────");
    console.log(
      `     Overall:    ${stats.correct}/${
        stats.total
      } (${stats.accuracy.toFixed(1)}%)`
    );
    console.log(
      `     Clean:      ${stats.cleanCorrect}/${
        stats.cleanTotal
      } (${cleanAcc.toFixed(1)}%)`
    );
    console.log(
      `     Toxic:      ${stats.toxicCorrect}/${
        stats.toxicTotal
      } (${toxicAcc.toFixed(1)}%)`
    );
    console.log(`     Precision:  ${stats.precision.toFixed(2)}%`);
    console.log(`     Recall:     ${stats.recall.toFixed(2)}%`);
    console.log(`     F1 Score:   ${stats.f1Score.toFixed(2)}%`);
    console.log(`     Avg Latency: ${stats.avgLatencyMs.toFixed(3)}ms`);
    console.log(
      `     Confusion Matrix: TP=${stats.confusionMatrix.tp} FP=${stats.confusionMatrix.fp} TN=${stats.confusionMatrix.tn} FN=${stats.confusionMatrix.fn}`
    );
  }

  // Category breakdown
  console.log("");
  console.log(
    "════════════════════════════════════════════════════════════════════════════════"
  );
  console.log("📂 CATEGORY BREAKDOWN");
  console.log(
    "════════════════════════════════════════════════════════════════════════════════"
  );
  console.log("");
  console.log(
    "┌────────────────────────────┬─────────────┬──────────┬────────────────────┐"
  );
  console.log(
    "│ Category                   │ Correct     │ Accuracy │ Visual             │"
  );
  console.log(
    "├────────────────────────────┼─────────────┼──────────┼────────────────────┤"
  );

  const sortedCategories = Object.entries(summary.byCategory).sort(
    (a, b) => b[1].accuracy - a[1].accuracy
  );

  for (const [cat, stats] of sortedCategories) {
    const bar = "█".repeat(Math.round(stats.accuracy / 10));
    console.log(
      `│ ${cat.padEnd(26)} │ ${stats.correct}/${stats.total}`.padEnd(42) +
        `│ ${stats.accuracy.toFixed(0).padEnd(8)} % │ ${bar.padEnd(18)} │`
    );
  }
  console.log(
    "└────────────────────────────┴─────────────┴──────────┴────────────────────┘"
  );

  // Error Analysis
  const errors = results.filter((r) => !r.isCorrect);
  const falsePositives = errors.filter(
    (r) => r.testCase.expectedLabel === "clean" && r.predictedLabel !== "clean"
  );
  const falseNegatives = errors.filter(
    (r) => r.testCase.expectedLabel !== "clean" && r.predictedLabel === "clean"
  );

  console.log("");
  console.log(
    "════════════════════════════════════════════════════════════════════════════════"
  );
  console.log("❌ ERROR ANALYSIS");
  console.log(
    "════════════════════════════════════════════════════════════════════════════════"
  );
  console.log("");
  console.log(`  Total Misclassifications: ${errors.length}`);
  console.log(`  False Positives (clean→toxic): ${falsePositives.length}`);
  console.log(`  False Negatives (toxic→clean): ${falseNegatives.length}`);

  // False positives by category
  if (falsePositives.length > 0) {
    console.log("");
    console.log("  📈 False Positives by Category:");
    const fpByCategory: Record<string, number> = {};
    for (const fp of falsePositives) {
      fpByCategory[fp.testCase.category] =
        (fpByCategory[fp.testCase.category] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(fpByCategory).sort(
      (a, b) => b[1] - a[1]
    )) {
      console.log(`     ${cat.padEnd(25)}: ${count}`);
    }
  }

  // False negatives by category
  if (falseNegatives.length > 0) {
    console.log("");
    console.log("  📉 False Negatives by Category:");
    const fnByCategory: Record<string, number> = {};
    for (const fn of falseNegatives) {
      fnByCategory[fn.testCase.category] =
        (fnByCategory[fn.testCase.category] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(fnByCategory).sort(
      (a, b) => b[1] - a[1]
    )) {
      console.log(`     ${cat.padEnd(25)}: ${count}`);
    }
  }

  // Final summary
  console.log("");
  console.log(
    "════════════════════════════════════════════════════════════════════════════════"
  );
  console.log("🏆 FINAL SUMMARY - REGEX ONLY (NO AI)");
  console.log(
    "════════════════════════════════════════════════════════════════════════════════"
  );
  console.log("");
  console.log(
    "┌──────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│                              KEY METRICS                                     │"
  );
  console.log(
    "├──────────────────────────────────────────────────────────────────────────────┤"
  );
  console.log(
    `│  Overall Accuracy:       ${summary.accuracy.toFixed(2)}%`.padEnd(79) +
      "│"
  );
  console.log(
    `│  Precision:              ${summary.precision.toFixed(2)}%`.padEnd(79) +
      "│"
  );
  console.log(
    `│  Recall:                 ${summary.recall.toFixed(2)}%`.padEnd(79) + "│"
  );
  console.log(
    `│  F1 Score:               ${summary.f1Score.toFixed(2)}%`.padEnd(79) + "│"
  );
  console.log(
    `│  Clean Accuracy:         ${summary.cleanAccuracy.toFixed(2)}%`.padEnd(
      79
    ) + "│"
  );
  console.log(
    `│  Toxic Accuracy:         ${summary.toxicAccuracy.toFixed(2)}%`.padEnd(
      79
    ) + "│"
  );
  console.log(
    `│  Average Latency:        ${summary.avgLatencyMs.toFixed(3)}ms`.padEnd(
      79
    ) + "│"
  );
  console.log(
    "├──────────────────────────────────────────────────────────────────────────────┤"
  );
  console.log(
    "│                           BY LANGUAGE                                        │"
  );
  console.log(
    "├──────────────────────────────────────────────────────────────────────────────┤"
  );

  for (const [lang, stats] of Object.entries(summary.byLanguage)) {
    const langName = lang.charAt(0).toUpperCase() + lang.slice(1);
    console.log(
      `│  ${langName.padEnd(18)}: ${stats.accuracy.toFixed(
        2
      )}% accuracy, F1: ${stats.f1Score.toFixed(
        2
      )}%, Latency: ${stats.avgLatencyMs.toFixed(3)}ms`.padEnd(79) + "│"
    );
  }
  console.log(
    "└──────────────────────────────────────────────────────────────────────────────┘"
  );
}

// Run the tests
runTests();
