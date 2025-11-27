/**
 * Contextual Analysis Test with REAL OpenAI API - Bisaya (Cebuano) Version
 *
 * This test evaluates the hybrid filtering system for Bisaya content:
 * 1. TextNormalizer pre-processing (leet speak, spaced, vowel removal detection)
 * 2. Bloom Filter pre-screening
 * 3. Trie Filter precise matching
 * 4. REAL AI Contextual Analysis (omni-moderation-latest + gpt-4o-mini)
 *
 * ⚠️ WARNING: This test makes real API calls and will consume OpenAI credits!
 *
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Add your OpenAI API key to .env
 * 3. Run: npx tsx tests/contextual-analysis-test-bisaya.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import fetch from "node-fetch";

// Import from test-cases folder
import {
  type TestCase,
  type NormalizationResult,
  type OmniModerationResult,
  type ContextualResult,
  type TestResult,
  type TestSummary,
} from "./test-cases/types";
import { bisayaTestCases } from "./test-cases/bisaya-test-cases";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
config({ path: path.join(__dirname, "../.env") });

// ============================================================
// CONFIGURATION
// ============================================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY || OPENAI_API_KEY === "your_openai_api_key_here") {
  console.error("❌ Error: OPENAI_API_KEY is not set!");
  console.error("");
  console.error("To fix this:");
  console.error("  1. Copy .env.example to .env");
  console.error("  2. Add your OpenAI API key to the .env file");
  console.error("");
  console.error(
    "Or run with: OPENAI_API_KEY=your_key npx tsx tests/contextual-analysis-test-bisaya.ts"
  );
  process.exit(1);
}

const DELAY_BETWEEN_REQUESTS_MS = 500; // Delay to avoid rate limiting
const RUN_FULL_TEST = true; // Set to false to run only a subset

// ============================================================
// BISAYA (CEBUANO) PROFANITY LISTS
// ============================================================
const bisayaToxicProfanityList = [
  "yawa",
  "buang",
  "bogo",
  "boang",
  "piste",
  "pisti",
  "linti",
  "lintik",
  "yati",
  "law-ay",
  "laway",
  "maot",
  "hinampak",
  "animal",
  "satanas",
  "dimonyo",
  "demonyo",
  "gaba",
  "peste",
  "pesti",
  "litsi",
  "litse",
  "panget",
  "bawog",
  "dautan",
  "way batasan",
  "way pulos",
  "way utok",
  "bugok",
  "tanga",
  "ulol",
];

const bisayaMildProfanityList = [
  "tambok",
  "bano",
  "kapoy",
  "samok",
  "lagot",
  "kalagot",
  "pasaway",
  "tapulan",
  "gahig ulo",
];

const bisayaBasicProfanityList = [
  ...bisayaToxicProfanityList,
  ...bisayaMildProfanityList,
];

// ============================================================
// TEXT NORMALIZER FOR BISAYA
// ============================================================

class BisayaTextNormalizer {
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

  // Bisaya-specific vowel removed patterns
  private static readonly vowelRemovedPatterns: Array<{
    pattern: RegExp;
    replacement: string;
  }> = [
    { pattern: /\byw\b/gi, replacement: "yawa" },
    { pattern: /\bbng\b/gi, replacement: "buang" },
    { pattern: /\bbg\b/gi, replacement: "bogo" },
    { pattern: /\bpst\b/gi, replacement: "piste" },
    { pattern: /\blnt\b/gi, replacement: "linti" },
    { pattern: /\byt\b/gi, replacement: "yati" },
    { pattern: /\blwy\b/gi, replacement: "law-ay" },
    { pattern: /\bmt\b/gi, replacement: "maot" },
  ];

  static normalizeLeetSpeak(text: string): string {
    let normalized = text.toLowerCase();

    // Special Bisaya cases
    normalized = normalized.replace(/y4w4/gi, "yawa");
    normalized = normalized.replace(/bu4ng/gi, "buang");
    normalized = normalized.replace(/b0g0/gi, "bogo");
    normalized = normalized.replace(/p1st3/gi, "piste");
    normalized = normalized.replace(/p1st1/gi, "pisti");
    normalized = normalized.replace(/l1nt1/gi, "linti");
    normalized = normalized.replace(/y4t1/gi, "yati");
    normalized = normalized.replace(/l4w-4y/gi, "law-ay");
    normalized = normalized.replace(/l4w4y/gi, "laway");
    normalized = normalized.replace(/m40t/gi, "maot");
    normalized = normalized.replace(/4n1m4l/gi, "animal");
    normalized = normalized.replace(/d40t4n/gi, "dautan");

    for (const [leet, normal] of Object.entries(this.leetMap)) {
      normalized = normalized.split(leet).join(normal);
    }
    return normalized;
  }

  static normalizeSpacedText(text: string): string {
    let normalized = text.toLowerCase();

    // Specific Bisaya spaced patterns
    normalized = normalized.replace(/y\s*a\s*w\s*a/gi, "yawa");
    normalized = normalized.replace(/b\s*u\s*a\s*n\s*g/gi, "buang");
    normalized = normalized.replace(/b\s*o\s*g\s*o/gi, "bogo");
    normalized = normalized.replace(/p\s*i\s*s\s*t\s*e/gi, "piste");
    normalized = normalized.replace(/p\s*i\s*s\s*t\s*i/gi, "pisti");
    normalized = normalized.replace(/l\s*i\s*n\s*t\s*i/gi, "linti");
    normalized = normalized.replace(/y\s*a\s*t\s*i/gi, "yati");
    normalized = normalized.replace(/l\s*a\s*w\s*-?\s*a\s*y/gi, "law-ay");
    normalized = normalized.replace(/m\s*a\s*o\s*t/gi, "maot");

    // Handle dots, hyphens, underscores
    normalized = normalized.replace(/y[.\-_]a[.\-_]w[.\-_]a/gi, "yawa");
    normalized = normalized.replace(/b[.\-_]u[.\-_]a[.\-_]n[.\-_]g/gi, "buang");
    normalized = normalized.replace(/b[.\-_]o[.\-_]g[.\-_]o/gi, "bogo");
    normalized = normalized.replace(/p[.\-_]i[.\-_]s[.\-_]t[.\-_]e/gi, "piste");
    normalized = normalized.replace(/l[.\-_]i[.\-_]n[.\-_]t[.\-_]i/gi, "linti");

    // General spaced pattern detection
    const spacedPattern =
      /(?<![a-z0-9])([a-z0-9])[\s.\-_*#@!~`'";:/\\]+([a-z0-9])[\s.\-_*#@!~`'";:/\\]+([a-z0-9])(?:[\s.\-_*#@!~`'";:/\\]+([a-z0-9]))*(?=[,\s]|$)/gi;

    normalized = normalized.replace(spacedPattern, (match) => {
      const cleaned = match.replace(/[^a-z0-9]/gi, "");
      return cleaned;
    });

    return normalized;
  }

  static normalizeVowelRemoved(text: string): string {
    let normalized = text.toLowerCase();
    for (const { pattern, replacement } of this.vowelRemovedPatterns) {
      normalized = normalized.replace(pattern, replacement);
    }
    return normalized;
  }

  static normalize(text: string): {
    original: string;
    normalized: string;
    transformations: string[];
  } {
    const transformations: string[] = [];
    let normalized = text;

    const afterSpaced = this.normalizeSpacedText(normalized);
    if (afterSpaced !== normalized.toLowerCase()) {
      transformations.push("spaced_profanity");
      normalized = afterSpaced;
    } else {
      normalized = normalized.toLowerCase();
    }

    const afterLeet = this.normalizeLeetSpeak(normalized);
    if (afterLeet !== normalized) {
      transformations.push("leet_speak");
      normalized = afterLeet;
    }

    const afterVowel = this.normalizeVowelRemoved(normalized);
    if (afterVowel !== normalized) {
      transformations.push("vowel_removal");
      normalized = afterVowel;
    }

    return { original: text, normalized, transformations };
  }

  static containsObfuscatedProfanity(
    text: string,
    profanityList: string[]
  ): {
    found: boolean;
    matches: string[];
    obfuscationType: string[];
  } {
    const { normalized, transformations } = this.normalize(text);

    if (transformations.length === 0) {
      return { found: false, matches: [], obfuscationType: [] };
    }

    const matches: string[] = [];
    const words = normalized.match(/\b\w+\b/g) || [];

    for (const word of words) {
      if (profanityList.includes(word)) {
        matches.push(word);
      }
    }

    for (const profanity of profanityList) {
      if (profanity.length >= 3 && normalized.includes(profanity)) {
        const regex = new RegExp(
          `\\b${profanity.replace(/\s+/g, "\\s*")}\\b`,
          "i"
        );
        if (regex.test(normalized) && !matches.includes(profanity)) {
          matches.push(profanity);
        } else if (!matches.includes(profanity)) {
          const startBoundary = new RegExp(
            `\\b${profanity.replace(/\s+/g, "\\s*")}`,
            "i"
          );
          const endBoundary = new RegExp(
            `${profanity.replace(/\s+/g, "\\s*")}\\b`,
            "i"
          );
          if (startBoundary.test(normalized) || endBoundary.test(normalized)) {
            matches.push(profanity);
          }
        }
      }
    }

    return {
      found: matches.length > 0,
      matches,
      obfuscationType: transformations,
    };
  }
}

// ============================================================
// OPENAI API FUNCTIONS
// ============================================================

async function callOmniModeration(text: string): Promise<OmniModerationResult> {
  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text.substring(0, 2000),
      model: "omni-moderation-latest",
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Omni-moderation API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as {
    results?: Array<{
      flagged: boolean;
      categories: Record<string, boolean>;
      category_scores: Record<string, number>;
    }>;
  };
  const result = data.results?.[0];

  if (!result) {
    throw new Error("No omni-moderation result");
  }

  return parseOmniResult(result);
}

function parseOmniResult(omniData: {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
}): OmniModerationResult {
  const scores = omniData.category_scores || {};
  const categories = omniData.categories || {};

  const maxScore = Math.max(
    scores.hate || 0,
    scores["hate/threatening"] || 0,
    scores.harassment || 0,
    scores["harassment/threatening"] || 0,
    scores.violence || 0,
    scores["violence/graphic"] || 0,
    scores.sexual || 0,
    scores["sexual/minors"] || 0,
    scores["self-harm"] || 0,
    scores["self-harm/intent"] || 0,
    scores["self-harm/instructions"] || 0
  );

  let classification: "clean" | "mild" | "toxic" | "ambiguous" = "clean";
  let needsContextualCheck = false;

  if (omniData.flagged) {
    if (
      maxScore > 0.8 ||
      categories["hate/threatening"] ||
      categories["violence"] ||
      categories["sexual/minors"]
    ) {
      classification = "toxic";
    } else if (maxScore > 0.4) {
      classification = "ambiguous";
      needsContextualCheck = true;
    } else {
      classification = "mild";
    }
  } else {
    if (maxScore > 0.2) {
      classification = "ambiguous";
      needsContextualCheck = true;
    }
  }

  const flaggedCategories = Object.keys(categories).filter(
    (k) => categories[k]
  );

  return {
    classification,
    confidence: maxScore,
    needsContextualCheck,
    categories: flaggedCategories,
    flagged: omniData.flagged,
    rawScores: scores,
  };
}

async function callContextualCheck(
  originalText: string,
  normalizedText: string,
  normalization: NormalizationResult,
  omniResult: OmniModerationResult
): Promise<ContextualResult> {
  // Build context about normalization
  let normalizationContext = "";
  if (normalization.obfuscationDetected) {
    normalizationContext = `
IMPORTANT - Obfuscation Detected:
- Original text: "${originalText}"
- Normalized text: "${normalizedText}"
- Obfuscation types: ${normalization.transformations.join(", ")}
- Detected profanity after normalization: ${normalization.obfuscatedMatches.join(
      ", "
    )}

The user is attempting to bypass filters using obfuscation. This should be classified as TOXIC.`;
  }

  const systemPrompt = `You are an expert content moderator specializing in Bisaya/Cebuano language content. Classify text as CLEAN, MILD, or TOXIC.

BISAYA/CEBUANO PROFANITY (TOXIC when directed at someone):
- Strong: yawa, buang/boang, bogo, piste/pisti, linti/lintik, yati, law-ay, maot, hinampak, animal (as insult), satanas, dimonyo/demonyo, gaba, peste/pesti, litsi/litse, dautan
- Compound insults: "pisting yawa", "buang ka yawa", "bogo ka piste", "hinampak buang"
- When used as insults directed at a person = TOXIC

BISAYA THREATS (ALWAYS TOXIC):
- Death threats: "patya", "mamatay ka", "ipapatay", "ipapusil"
- Violence: "sakiton tika", "bunalan tika", "pangitaon tika"
- Self-harm encouragement: "patya imong kaugalingon"
- These are TOXIC even without profanity words

BISAYA BULLYING (TOXIC):
- "walay nagmahal nimo" (nobody loves you)
- "dapat wala ka gipanganak" (you shouldn't have been born)
- "walay pulos ka" (you're useless)
- "sayop ka lang" (you're just a mistake)
- Body shaming: "ka tambok nimo", "ka pangit nimo"
- These attack personal worth = TOXIC

BISAYA HATE SPEECH (TOXIC):
- Regional discrimination: "balik sa probinsya"
- Class discrimination: "mga pobre"
- LGBTQ+ attacks: "bayot/tomboy abnormal"
- Religious attacks, xenophobia

CLEAN CONTEXTS (NOT toxic):
- Gaming: "gipatay nako kalaban sa dula", "headshot", "respawn", "namatay sa game"
- Sports: "gibunalan namo", "gibali depensa" (metaphors for winning)
- Cooking: "batiha ang itlog", "dugmoka ang ahos"
- Medical terminology
- Academic discussions ABOUT profanity (studying/reporting)
- Scunthorpe: "puti" (white), "bugas" (rice), "bata" (child), "maayo" (good)
- Religious exclamations: Ginoo ko, Hesus Maria Jose, Santo Papa, Ay Dios ko
- Frustration WITHOUT insults: "samok" (annoying), "kapoy" (tiring)

MILD (not toxic but inappropriate):
- Light frustration with mild words
- Criticism without personal attacks

CRITICAL: When in doubt about Bisaya threats or bullying, classify as TOXIC.
Respond with ONLY: CLEAN, MILD, or TOXIC`;

  const userPrompt = `Text (Bisaya/Cebuano): "${originalText}"
${normalizationContext}
Initial moderation assessment: ${
    omniResult.classification
  } (confidence: ${omniResult.confidence.toFixed(2)})
${
  omniResult.flagged
    ? `Flagged categories: ${omniResult.categories?.join(", ") || "none"}`
    : "Not flagged by moderation API"
}

Classification:`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 10,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `GPT-4o-mini API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const gptResponse = data.choices[0]?.message?.content?.trim().toUpperCase();

  let classification: "clean" | "mild" | "toxic" = "mild";
  if (gptResponse?.includes("TOXIC")) {
    classification = "toxic";
  } else if (gptResponse?.includes("CLEAN")) {
    classification = "clean";
  } else if (gptResponse?.includes("MILD")) {
    classification = "mild";
  }

  return {
    classification,
    confidence: 0.85,
    reason: `GPT-4o-mini classified as ${classification}`,
  };
}

// ============================================================
// TEST RUNNER
// ============================================================

async function runSingleTest(testCase: TestCase): Promise<TestResult> {
  const startTime = performance.now();
  let apiCalls = 0;

  try {
    // Step 1: BisayaTextNormalizer pre-processing
    const { normalized, transformations } = BisayaTextNormalizer.normalize(
      testCase.text
    );
    const obfuscationCheck = BisayaTextNormalizer.containsObfuscatedProfanity(
      testCase.text,
      bisayaBasicProfanityList
    );

    const normalization: NormalizationResult = {
      original: testCase.text,
      normalized,
      transformations,
      obfuscationDetected: obfuscationCheck.found,
      obfuscatedMatches: obfuscationCheck.matches,
    };

    // Step 2: If obfuscation detected with profanity matches, can classify as toxic directly
    // But we still call AI for validation
    let textToAnalyze = testCase.text;

    // If obfuscation was detected, also send normalized version for better AI analysis
    if (normalization.obfuscationDetected) {
      textToAnalyze = testCase.text;
    }

    // Step 3: Call omni-moderation
    const omniResult = await callOmniModeration(textToAnalyze);
    apiCalls++;

    let finalLabel: string;
    let contextualResult: ContextualResult | null = null;

    // Helper: Check for Bisaya threat/bullying patterns (often missed by omni-moderation)
    const threatPatterns = [
      /patya|ipapatay|ipapusil/i,
      /mamatay\s+(ka|kamo)/i,
      /sakiton|bunalan|pangitaon.*tika/i,
      /dapat.*wala.*gipanganak/i,
      /walay\s+nagmahal/i,
      /walay\s+pulos\s+ka/i,
      /sayop\s+ka\s+lang/i,
      /ka\s+pangit\s+nimo/i,
      /ka\s+tambok\s+nimo/i,
      /abnormal/i,
      /unta\s+mamatay/i,
    ];
    const hasBisayaThreat = threatPatterns.some((p) => p.test(testCase.text));

    // Helper: Check for direct Bisaya profanity (non-obfuscated)
    const lowerText = testCase.text.toLowerCase();
    const hasDirectProfanity = bisayaToxicProfanityList.some((word) =>
      new RegExp(`\\b${word}\\b`, "i").test(lowerText)
    );

    // Helper: Check for compound Bisaya profanity
    const compoundPatterns = [
      /pisting\s*yawa/i,
      /buang\s*ka\s*yawa/i,
      /bogo\s*ka\s*piste/i,
      /hinampak\s*buang/i,
      /yawa\s*ka/i,
      /buang\s*ka/i,
      /bogo\s*ka/i,
      /piste\s*ka/i,
      /linti\s*ka/i,
    ];
    const hasCompoundProfanity = compoundPatterns.some((p) =>
      p.test(testCase.text)
    );

    // Step 4: Decision logic
    // If BisayaTextNormalizer detected obfuscated profanity, bias towards toxic
    if (
      normalization.obfuscationDetected &&
      obfuscationCheck.matches.length > 0
    ) {
      // Check if it's a toxic profanity word
      const hasToxicMatch = obfuscationCheck.matches.some((m) =>
        bisayaToxicProfanityList.includes(m)
      );

      if (hasToxicMatch) {
        // Strong signal - obfuscated toxic profanity detected
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
        contextualResult = await callContextualCheck(
          testCase.text,
          normalized,
          normalization,
          omniResult
        );
        apiCalls++;

        // Even if GPT says mild, obfuscated toxic profanity should be toxic
        if (contextualResult.classification === "clean") {
          finalLabel = "clean";
        } else {
          finalLabel = "toxic";
        }
      } else {
        // Mild profanity obfuscation
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
        contextualResult = await callContextualCheck(
          testCase.text,
          normalized,
          normalization,
          omniResult
        );
        apiCalls++;
        finalLabel = contextualResult.classification;
      }
    } else if (hasBisayaThreat) {
      // Bisaya threat/bullying pattern detected - always check with GPT
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
      contextualResult = await callContextualCheck(
        testCase.text,
        normalized,
        normalization,
        omniResult
      );
      apiCalls++;
      // Threat patterns are usually toxic unless GPT specifically says clean (like gaming)
      finalLabel =
        contextualResult.classification === "clean" ? "clean" : "toxic";
    } else if (hasDirectProfanity || hasCompoundProfanity) {
      // Direct Bisaya profanity detected - verify with GPT for context
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
      contextualResult = await callContextualCheck(
        testCase.text,
        normalized,
        normalization,
        omniResult
      );
      apiCalls++;
      finalLabel = contextualResult.classification;
    } else if (
      omniResult.needsContextualCheck ||
      omniResult.classification === "ambiguous"
    ) {
      // Omni says ambiguous, call GPT for context
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
      contextualResult = await callContextualCheck(
        testCase.text,
        normalized,
        normalization,
        omniResult
      );
      apiCalls++;
      finalLabel = contextualResult.classification;
    } else if (
      omniResult.classification === "clean" &&
      omniResult.confidence < 0.1
    ) {
      // Low confidence clean - Bisaya often slips through, verify with GPT
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
      contextualResult = await callContextualCheck(
        testCase.text,
        normalized,
        normalization,
        omniResult
      );
      apiCalls++;
      finalLabel = contextualResult.classification;
    } else {
      // Use omni-moderation result directly
      finalLabel = omniResult.classification;
    }

    const processingTimeMs = performance.now() - startTime;

    return {
      testCase,
      normalization,
      omniResult,
      contextualResult,
      finalLabel,
      isCorrect: finalLabel === testCase.expectedLabel,
      processingTimeMs,
      apiCalls,
    };
  } catch (error) {
    const processingTimeMs = performance.now() - startTime;
    return {
      testCase,
      normalization: {
        original: testCase.text,
        normalized: testCase.text.toLowerCase(),
        transformations: [],
        obfuscationDetected: false,
        obfuscatedMatches: [],
      },
      omniResult: null,
      contextualResult: null,
      finalLabel: "error",
      isCorrect: false,
      processingTimeMs,
      apiCalls,
      error: (error as Error).message,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateSummary(results: TestResult[]): TestSummary {
  const correctPredictions = results.filter((r) => r.isCorrect).length;

  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;

  results.forEach((r) => {
    const actualToxic = r.testCase.expectedLabel === "toxic";
    const predictedToxic = r.finalLabel === "toxic";

    if (actualToxic && predictedToxic) truePositives++;
    if (!actualToxic && predictedToxic) falsePositives++;
    if (!actualToxic && !predictedToxic) trueNegatives++;
    if (actualToxic && !predictedToxic) falseNegatives++;
  });

  const categoryBreakdown: Record<string, { correct: number; total: number }> =
    {};
  results.forEach((r) => {
    const cat = r.testCase.category;
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { correct: 0, total: 0 };
    }
    categoryBreakdown[cat].total++;
    if (r.isCorrect) categoryBreakdown[cat].correct++;
  });

  const totalTime = results.reduce((sum, r) => sum + r.processingTimeMs, 0);
  const totalApiCalls = results.reduce((sum, r) => sum + r.apiCalls, 0);

  // Obfuscation stats
  const obfuscationResults = results.filter(
    (r) => r.normalization.obfuscationDetected
  );
  const obfuscationCorrect = obfuscationResults.filter(
    (r) => r.isCorrect
  ).length;

  return {
    totalTests: results.length,
    correctPredictions,
    accuracy: (correctPredictions / results.length) * 100,
    confusionMatrix: {
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives,
    },
    categoryBreakdown,
    totalApiCalls,
    totalTimeMs: totalTime,
    averageTimePerTest: totalTime / results.length,
    obfuscationStats: {
      detected: obfuscationResults.length,
      correctlyClassified: obfuscationCorrect,
    },
  };
}

async function runTests(): Promise<void> {
  console.log("=".repeat(70));
  console.log("JoSan Contextual Analysis Test - BISAYA (CEBUANO) VERSION");
  console.log("With BisayaTextNormalizer Pre-processing");
  console.log("=".repeat(70));

  const testCases = RUN_FULL_TEST
    ? bisayaTestCases
    : bisayaTestCases.slice(0, 20);

  console.log(`\n⚠️  This test will make REAL API calls to OpenAI!`);
  console.log(`   Language: Bisaya/Cebuano`);
  console.log(`   Tests to run: ${testCases.length}`);
  console.log(
    `   Estimated API calls: ${Math.round(
      testCases.length * 1.5
    )} (some need contextual check)`
  );
  console.log(`   Delay between requests: ${DELAY_BETWEEN_REQUESTS_MS}ms`);
  console.log(`   Features: BisayaTextNormalizer pre-processing enabled\n`);

  const results: TestResult[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];

    process.stdout.write(
      `[${i + 1}/${testCases.length}] Testing #${testCase.id}...`
    );

    const result = await runSingleTest(testCase);
    results.push(result);

    const status = result.isCorrect ? "✓" : "✗";
    const obfuscFlag = result.normalization.obfuscationDetected ? " [OBF]" : "";
    const errorInfo = result.error ? ` (Error: ${result.error})` : "";
    console.log(
      ` ${status} Expected: ${testCase.expectedLabel}, Got: ${result.finalLabel}${obfuscFlag}${errorInfo}`
    );

    if (!result.isCorrect && !result.error) {
      console.log(`      Text: "${testCase.text.substring(0, 60)}..."`);
      console.log(`      Category: ${testCase.category}`);
      if (result.normalization.obfuscationDetected) {
        console.log(
          `      Obfuscation: ${result.normalization.transformations.join(
            ", "
          )}`
        );
        console.log(
          `      Matches: ${result.normalization.obfuscatedMatches.join(", ")}`
        );
      }
      if (result.omniResult) {
        console.log(
          `      Omni: ${
            result.omniResult.classification
          } (${result.omniResult.confidence.toFixed(2)}) flagged=${
            result.omniResult.flagged
          }`
        );
      }
      if (result.contextualResult) {
        console.log(
          `      GPT-4o-mini: ${result.contextualResult.classification}`
        );
      }
    }

    // Rate limiting delay
    if (i < testCases.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  const summary = calculateSummary(results);

  console.log("\n" + "=".repeat(70));
  console.log("TEST SUMMARY - BISAYA (CEBUANO)");
  console.log("=".repeat(70));
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Correct: ${summary.correctPredictions}`);
  console.log(`Accuracy: ${summary.accuracy.toFixed(2)}%`);
  console.log(`Total API Calls: ${summary.totalApiCalls}`);
  console.log(`Total Time: ${(summary.totalTimeMs / 1000).toFixed(2)}s`);
  console.log(`Avg Time/Test: ${summary.averageTimePerTest.toFixed(0)}ms`);

  console.log("\nBisayaTextNormalizer Stats:");
  console.log(`  Obfuscation Detected: ${summary.obfuscationStats.detected}`);
  console.log(
    `  Correctly Classified: ${summary.obfuscationStats.correctlyClassified}/${
      summary.obfuscationStats.detected
    } (${(
      (summary.obfuscationStats.correctlyClassified /
        summary.obfuscationStats.detected) *
        100 || 0
    ).toFixed(0)}%)`
  );

  console.log("\nConfusion Matrix (Toxic as Positive):");
  console.log(
    `  TP: ${summary.confusionMatrix.truePositives} | FP: ${summary.confusionMatrix.falsePositives}`
  );
  console.log(
    `  FN: ${summary.confusionMatrix.falseNegatives} | TN: ${summary.confusionMatrix.trueNegatives}`
  );

  const precision =
    summary.confusionMatrix.truePositives /
      (summary.confusionMatrix.truePositives +
        summary.confusionMatrix.falsePositives) || 0;
  const recall =
    summary.confusionMatrix.truePositives /
      (summary.confusionMatrix.truePositives +
        summary.confusionMatrix.falseNegatives) || 0;
  const f1Score =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

  console.log(`\nPrecision: ${(precision * 100).toFixed(2)}%`);
  console.log(`Recall: ${(recall * 100).toFixed(2)}%`);
  console.log(`F1 Score: ${(f1Score * 100).toFixed(2)}%`);

  console.log("\nCategory Breakdown:");
  const sortedCategories = Object.entries(summary.categoryBreakdown).sort(
    ([, a], [, b]) => a.correct / a.total - b.correct / b.total
  );
  sortedCategories.forEach(([category, stats]) => {
    const catAccuracy = ((stats.correct / stats.total) * 100).toFixed(0);
    const bar = "█".repeat(Math.round((stats.correct / stats.total) * 10));
    console.log(
      `  ${category.padEnd(20)}: ${stats.correct}/${
        stats.total
      } (${catAccuracy}%) ${bar}`
    );
  });

  // Separate clean vs toxic accuracy
  const cleanResults = results.filter(
    (r) => r.testCase.expectedLabel === "clean"
  );
  const toxicResults = results.filter(
    (r) => r.testCase.expectedLabel === "toxic"
  );
  const cleanCorrect = cleanResults.filter((r) => r.isCorrect).length;
  const toxicCorrect = toxicResults.filter((r) => r.isCorrect).length;

  console.log("\nClean vs Toxic Accuracy:");
  console.log(
    `  Clean (${cleanResults.length}):   ${cleanCorrect}/${
      cleanResults.length
    } (${((cleanCorrect / cleanResults.length) * 100).toFixed(0)}%)`
  );
  console.log(
    `  Toxic (${toxicResults.length}): ${toxicCorrect}/${
      toxicResults.length
    } (${((toxicCorrect / toxicResults.length) * 100).toFixed(0)}%)`
  );

  // Save results
  const outputData = {
    testDate: new Date().toISOString(),
    language: "Bisaya (Cebuano)",
    testVersion: "bisaya-v1-with-normalizer",
    apiModel: {
      moderation: "omni-moderation-latest",
      contextual: "gpt-4o-mini",
    },
    features: {
      bisayaTextNormalizerEnabled: true,
      leetSpeakDetection: true,
      spacedProfanityDetection: true,
      vowelRemovalDetection: true,
    },
    summary: {
      ...summary,
      precision: precision * 100,
      recall: recall * 100,
      f1Score: f1Score * 100,
      cleanAccuracy: (cleanCorrect / cleanResults.length) * 100,
      toxicAccuracy: (toxicCorrect / toxicResults.length) * 100,
    },
    results: results.map((r) => ({
      id: r.testCase.id,
      text: r.testCase.text,
      expectedLabel: r.testCase.expectedLabel,
      predictedLabel: r.finalLabel,
      isCorrect: r.isCorrect,
      category: r.testCase.category,
      description: r.testCase.description,
      normalization: r.normalization,
      omniResult: r.omniResult,
      contextualResult: r.contextualResult,
      processingTimeMs: r.processingTimeMs,
      apiCalls: r.apiCalls,
      error: r.error,
    })),
  };

  const outputPath = path.join(
    __dirname,
    "contextual-analysis-results-bisaya.json"
  );
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

// Run tests
runTests().catch(console.error);
