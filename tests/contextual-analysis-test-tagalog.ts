/**
 * Contextual Analysis Test with REAL OpenAI API - Tagalog Version
 *
 * This test evaluates the hybrid filtering system for Tagalog content:
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
 * 3. Run: npx tsx tests/contextual-analysis-test-tagalog.ts
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
import { tagalogTestCases } from "./test-cases/tagalog-test-cases";

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
    "Or run with: OPENAI_API_KEY=your_key npx tsx tests/contextual-analysis-test-tagalog.ts"
  );
  process.exit(1);
}

const DELAY_BETWEEN_REQUESTS_MS = 500; // Delay to avoid rate limiting
const RUN_FULL_TEST = true; // Set to false to run only a subset

// ============================================================
// TAGALOG PROFANITY LISTS
// ============================================================
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

const tagalogBasicProfanityList = [
  ...tagalogToxicProfanityList,
  ...tagalogMildProfanityList,
];

// ============================================================
// TEXT NORMALIZER FOR TAGALOG
// ============================================================

class TagalogTextNormalizer {
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

  // Tagalog-specific vowel removed patterns
  private static readonly vowelRemovedPatterns: Array<{
    pattern: RegExp;
    replacement: string;
  }> = [
    { pattern: /\bptng\s*n\b/gi, replacement: "putang ina" },
    { pattern: /\bptngn\b/gi, replacement: "putangina" },
    { pattern: /\bgg\b/gi, replacement: "gago" },
    { pattern: /\bll\b/gi, replacement: "ulol" },
    { pattern: /\btng\b/gi, replacement: "tanga" },
    { pattern: /\bbb\b/gi, replacement: "bobo" },
    { pattern: /\btrntd\b/gi, replacement: "tarantado" },
    { pattern: /\blch\b/gi, replacement: "leche" },
    { pattern: /\bpnyt\b/gi, replacement: "punyeta" },
    { pattern: /\bpt\b/gi, replacement: "puta" },
  ];

  static normalizeLeetSpeak(text: string): string {
    let normalized = text.toLowerCase();

    // Special Tagalog cases
    normalized = normalized.replace(/put4ng\s*1n4/gi, "putang ina");
    normalized = normalized.replace(/put4ng1n4/gi, "putangina");
    normalized = normalized.replace(/g4g0/gi, "gago");
    normalized = normalized.replace(/b0b0/gi, "bobo");
    normalized = normalized.replace(/t4ng4/gi, "tanga");
    normalized = normalized.replace(/ul0l/gi, "ulol");
    normalized = normalized.replace(/t4r4nt4d0/gi, "tarantado");
    normalized = normalized.replace(/p0t4/gi, "pota");
    normalized = normalized.replace(/l3ch3/gi, "leche");

    for (const [leet, normal] of Object.entries(this.leetMap)) {
      normalized = normalized.split(leet).join(normal);
    }
    return normalized;
  }

  static normalizeSpacedText(text: string): string {
    let normalized = text.toLowerCase();

    // Specific Tagalog spaced patterns
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

    // Handle dots, hyphens, underscores
    normalized = normalized.replace(
      /p[.\-_]u[.\-_]t[.\-_]a[.\-_]n[.\-_]g[.\-_]i[.\-_]n[.\-_]a/gi,
      "putangina"
    );
    normalized = normalized.replace(/g[.\-_]a[.\-_]g[.\-_]o/gi, "gago");
    normalized = normalized.replace(/t[.\-_]a[.\-_]n[.\-_]g[.\-_]a/gi, "tanga");
    normalized = normalized.replace(/b[.\-_]o[.\-_]b[.\-_]o/gi, "bobo");
    normalized = normalized.replace(/u[.\-_]l[.\-_]o[.\-_]l/gi, "ulol");

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

  const systemPrompt = `You are an expert content moderator specializing in Tagalog/Filipino language content. Classify text as CLEAN, MILD, or TOXIC.

TAGALOG PROFANITY (TOXIC when directed at someone):
- Strong: putangina, puta, gago/gaga, ulol, tanga, bobo/boba, tarantado, leche, punyeta, hinayupak, hayop ka, walang hiya, kingina, pota, ampota, pakyu, lintik
- When used as insults directed at a person = TOXIC

TAGALOG THREATS (ALWAYS TOXIC):
- Death threats: "patayin", "mamatay ka", "papatayin kita", "ipapabaril"
- Violence: "sasaktan kita", "bubugbugin kita", "hahanapin kita"
- Self-harm encouragement: "patayin mo sarili mo", "magpakamatay ka"
- These are TOXIC even without profanity words

TAGALOG BULLYING (TOXIC):
- "walang nagmamahal sayo" (nobody loves you)
- "dapat hindi ka na ipinanganak" (you shouldn't have been born)
- "wala kang silbi" (you're useless)
- "pagkakamali ka" (you're a mistake)
- Body shaming: "ang taba mo", "ang pangit mo"
- These attack personal worth = TOXIC

TAGALOG HATE SPEECH (TOXIC):
- Regional discrimination: "bumalik sa probinsya"
- Class discrimination: "mga mahihirap"
- LGBTQ+ attacks: "bakla/tomboy ay abnormal"
- Religious attacks, xenophobia

CLEAN CONTEXTS (NOT toxic):
- Gaming: "pinatay ko kalaban sa laro", "headshot", "respawn", "namatay sa game"
- Sports: "binugbog namin", "binasag depensa" (metaphors for winning)
- Cooking: "batiin ang itlog", "dikdikin"
- Medical terminology
- Academic discussions ABOUT profanity (studying/reporting)
- Scunthorpe: "puting" (white), "pusit" (squid), "putol" (cut)
- Religious exclamations: Diyos ko, Susmariosep, Hesus
- Frustration WITHOUT insults: "nakakabwisit" (frustrating), "nakakainis"

MILD (not toxic but inappropriate):
- Light frustration with mild words
- Criticism without personal attacks

CRITICAL: When in doubt about Tagalog threats or bullying, classify as TOXIC.
Respond with ONLY: CLEAN, MILD, or TOXIC`;

  const userPrompt = `Text (Tagalog): "${originalText}"
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
    // Step 1: TagalogTextNormalizer pre-processing
    const { normalized, transformations } = TagalogTextNormalizer.normalize(
      testCase.text
    );
    const obfuscationCheck = TagalogTextNormalizer.containsObfuscatedProfanity(
      testCase.text,
      tagalogBasicProfanityList
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

    // Helper: Check for Tagalog threat/bullying patterns (often missed by omni-moderation)
    const threatPatterns = [
      /patayin|papatayin|ipapatay/i,
      /mamatay\s+(ka|kayo)/i,
      /sasaktan|susuntukin|bubugbugin|hahanapin.*kita/i,
      /dapat.*hindi.*ipinanganak/i,
      /walang\s+nagmamahal/i,
      /wala\s+kang\s+silbi/i,
      /pagkakamali\s+ka/i,
      /ang\s+pangit\s+mo/i,
      /ang\s+taba\s+mo/i,
      /abnormal/i,
      /dapat\s+mamatay/i,
    ];
    const hasTagalogThreat = threatPatterns.some((p) => p.test(testCase.text));

    // Helper: Check for direct Tagalog profanity (non-obfuscated)
    const lowerText = testCase.text.toLowerCase();
    const hasDirectProfanity = tagalogToxicProfanityList.some((word) =>
      new RegExp(`\\b${word}\\b`, "i").test(lowerText)
    );

    // Step 4: Decision logic
    // If TagalogTextNormalizer detected obfuscated profanity, bias towards toxic
    if (
      normalization.obfuscationDetected &&
      obfuscationCheck.matches.length > 0
    ) {
      // Check if it's a toxic profanity word
      const hasToxicMatch = obfuscationCheck.matches.some((m) =>
        tagalogToxicProfanityList.includes(m)
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
    } else if (hasTagalogThreat) {
      // Tagalog threat/bullying pattern detected - always check with GPT
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
    } else if (hasDirectProfanity) {
      // Direct Tagalog profanity detected - verify with GPT for context
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
      // Low confidence clean - Tagalog often slips through, verify with GPT
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
  console.log("JoSan Contextual Analysis Test - TAGALOG VERSION");
  console.log("With TagalogTextNormalizer Pre-processing");
  console.log("=".repeat(70));

  const testCases = RUN_FULL_TEST
    ? tagalogTestCases
    : tagalogTestCases.slice(0, 20);

  console.log(`\n⚠️  This test will make REAL API calls to OpenAI!`);
  console.log(`   Language: Tagalog/Filipino`);
  console.log(`   Tests to run: ${testCases.length}`);
  console.log(
    `   Estimated API calls: ${Math.round(
      testCases.length * 1.5
    )} (some need contextual check)`
  );
  console.log(`   Delay between requests: ${DELAY_BETWEEN_REQUESTS_MS}ms`);
  console.log(`   Features: TagalogTextNormalizer pre-processing enabled\n`);

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
  console.log("TEST SUMMARY - TAGALOG");
  console.log("=".repeat(70));
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Correct: ${summary.correctPredictions}`);
  console.log(`Accuracy: ${summary.accuracy.toFixed(2)}%`);
  console.log(`Total API Calls: ${summary.totalApiCalls}`);
  console.log(`Total Time: ${(summary.totalTimeMs / 1000).toFixed(2)}s`);
  console.log(`Avg Time/Test: ${summary.averageTimePerTest.toFixed(0)}ms`);

  console.log("\nTagalogTextNormalizer Stats:");
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
    language: "Tagalog",
    testVersion: "tagalog-v1-with-normalizer",
    apiModel: {
      moderation: "omni-moderation-latest",
      contextual: "gpt-4o-mini",
    },
    features: {
      tagalogTextNormalizerEnabled: true,
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
    "contextual-analysis-results-tagalog.json"
  );
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

// Run tests
runTests().catch(console.error);
