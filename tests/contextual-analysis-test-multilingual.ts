/**
 * Contextual Analysis Test with REAL OpenAI API - MULTILINGUAL VERSION
 *
 * This comprehensive test evaluates the hybrid filtering system for:
 * - English content
 * - Tagalog (Filipino) content
 * - Bisaya (Cebuano) content
 * - Code-switched/mixed language content
 *
 * Testing Pipeline:
 * 1. Language Detection (auto-detect primary language)
 * 2. MultilingualTextNormalizer pre-processing (leet speak, spaced, vowel removal)
 * 3. Bloom Filter pre-screening
 * 4. Trie Filter precise matching
 * 5. REAL AI Contextual Analysis (omni-moderation-latest + gpt-4o-mini)
 *
 * ⚠️ WARNING: This test makes real API calls and will consume OpenAI credits!
 *
 * Setup:
 * 1. Copy .env.example to .env
 * 2. Add your OpenAI API key to .env
 * 3. Run: npx tsx tests/contextual-analysis-test-multilingual.ts
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
import { englishTestCases } from "./test-cases/english-test-cases";
import { tagalogTestCases } from "./test-cases/tagalog-test-cases";
import { bisayaTestCases } from "./test-cases/bisaya-test-cases";
// Note: toxicProfanityList and basicProfanityList are defined locally with multilingual support

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
    "Or run with: OPENAI_API_KEY=your_key npx tsx tests/contextual-analysis-test-multilingual.ts"
  );
  process.exit(1);
}

const DELAY_BETWEEN_REQUESTS_MS = 500; // Delay to avoid rate limiting
const RUN_FULL_TEST = true; // Set to false to run only a subset
const TEST_SAMPLE_SIZE = 30; // Tests per language when not running full test

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

interface LanguageDetectionResult {
  primary: DetectedLanguage;
  confidence: number;
  scores: Record<DetectedLanguage, number>;
}

// Common Tagalog words/markers
const tagalogMarkers = [
  "ang",
  "ng",
  "sa",
  "ko",
  "mo",
  "ka",
  "ako",
  "ikaw",
  "siya",
  "kami",
  "tayo",
  "sila",
  "na",
  "pa",
  "po",
  "ba",
  "hindi",
  "oo",
  "ito",
  "iyan",
  "iyon",
  "naman",
  "kasi",
  "talaga",
  "pero",
  "kung",
  "paano",
  "bakit",
  "saan",
  "ano",
  "sino",
  "niya",
  "nila",
  "atin",
  "natin",
  "may",
  "wala",
  "para",
  "dahil",
  "kaya",
  "lang",
  "dito",
  "doon",
  "diyan",
];

// Common Bisaya words/markers
const bisayaMarkers = [
  "ang",
  "sa",
  "ko",
  "ka",
  "ako",
  "ikaw",
  "siya",
  "kami",
  "kamo",
  "sila",
  "naa",
  "wala",
  "dili",
  "oo",
  "bitaw",
  "gyud",
  "jud",
  "kaayo",
  "ra",
  "lang",
  "man",
  "ba",
  "ug",
  "og",
  "kini",
  "kana",
  "kadto",
  "asa",
  "unsa",
  "ngano",
  "kinsa",
  "kanus-a",
  "nimo",
  "niya",
  "nila",
  "namo",
  "nato",
  "imong",
  "akong",
  "iyang",
  "atong",
  "ilang",
  "pud",
  "pod",
  "dayon",
  "kay",
  "tungod",
  "bisan",
  "hangtod",
];

// Common English words/markers
const englishMarkers = [
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "can",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "my",
  "your",
  "his",
  "her",
  "its",
  "our",
  "their",
  "what",
  "which",
  "who",
  "where",
  "when",
  "why",
  "how",
  "and",
  "but",
  "or",
  "not",
  "no",
  "yes",
  "for",
  "with",
  "about",
  "from",
  "into",
  "through",
  "during",
  "before",
  "after",
  "above",
  "below",
  "between",
  "under",
  "again",
  "further",
  "then",
  "once",
];

function detectLanguage(text: string): LanguageDetectionResult {
  const lowerText = text.toLowerCase();
  const words = lowerText.match(/\b[a-z]+\b/g) || [];

  let englishScore = 0;
  let tagalogScore = 0;
  let bisayaScore = 0;

  for (const word of words) {
    if (englishMarkers.includes(word)) englishScore++;
    if (tagalogMarkers.includes(word)) tagalogScore++;
    if (bisayaMarkers.includes(word)) bisayaScore++;
  }

  // Check for unique markers that distinguish Bisaya from Tagalog
  const bisayaUniqueMarkers = [
    "gyud",
    "jud",
    "kaayo",
    "naa",
    "dili",
    "bitaw",
    "pud",
    "pod",
    "dayon",
    "ug",
    "og",
  ];
  const tagalogUniqueMarkers = [
    "hindi",
    "naman",
    "kasi",
    "talaga",
    "pero",
    "paano",
    "bakit",
    "niya",
    "nila",
    "natin",
  ];

  for (const word of words) {
    if (bisayaUniqueMarkers.includes(word)) bisayaScore += 3;
    if (tagalogUniqueMarkers.includes(word)) tagalogScore += 3;
  }

  // Normalize scores
  const totalScore = englishScore + tagalogScore + bisayaScore || 1;

  const scores: Record<DetectedLanguage, number> = {
    english: englishScore / totalScore,
    tagalog: tagalogScore / totalScore,
    bisaya: bisayaScore / totalScore,
    mixed: 0,
  };

  // Determine primary language
  let primary: DetectedLanguage = "english";
  let maxScore = scores.english;

  if (scores.tagalog > maxScore) {
    primary = "tagalog";
    maxScore = scores.tagalog;
  }
  if (scores.bisaya > maxScore) {
    primary = "bisaya";
    maxScore = scores.bisaya;
  }

  // Check for mixed language (code-switching)
  const secondMax = Math.max(
    ...Object.values(scores).filter((s) => s !== maxScore)
  );
  if (secondMax > 0.25 && maxScore < 0.6) {
    primary = "mixed";
    scores.mixed = 0.5;
  }

  return {
    primary,
    confidence: maxScore,
    scores,
  };
}

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
    v: "u", // v→u for fvck
  };

  // English vowel-removed patterns
  private static readonly englishVowelRemovedPatterns: Array<{
    pattern: RegExp;
    replacement: string;
  }> = [
    { pattern: /\bf+[ck]+n?g?\b/gi, replacement: "fucking" },
    { pattern: /\bf+[ck]+\b/gi, replacement: "fuck" },
    { pattern: /\bf4ck(ing|ed|er|s)?\b/gi, replacement: "fucking" },
    { pattern: /\bf4ck\b/gi, replacement: "fuck" },
    { pattern: /\bsh+t+y?\b/gi, replacement: "shit" },
    { pattern: /\bb+tch\b/gi, replacement: "bitch" },
    { pattern: /\bd+mn\b/gi, replacement: "damn" },
    { pattern: /\bsht\b/gi, replacement: "shit" },
    { pattern: /\bfck\b/gi, replacement: "fuck" },
    { pattern: /\bfkng?\b/gi, replacement: "fucking" },
    { pattern: /\bbstrd\b/gi, replacement: "bastard" },
    { pattern: /\bwtf\b/gi, replacement: "what the fuck" },
    { pattern: /\bstfu\b/gi, replacement: "shut the fuck up" },
    { pattern: /\bgtfo\b/gi, replacement: "get the fuck out" },
    { pattern: /\bdck\b/gi, replacement: "dick" },
    { pattern: /\bbtch\b/gi, replacement: "bitch" },
    { pattern: /\bss\b/gi, replacement: "ass" },
    { pattern: /\bbllsht\b/gi, replacement: "bullshit" },
  ];

  // Tagalog vowel-removed patterns
  private static readonly tagalogVowelRemovedPatterns: Array<{
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

  // Bisaya vowel-removed patterns
  private static readonly bisayaVowelRemovedPatterns: Array<{
    pattern: RegExp;
    replacement: string;
  }> = [
    { pattern: /\byw\b/gi, replacement: "yawa" },
    { pattern: /\bpst\b/gi, replacement: "piste" },
    { pattern: /\bbng\b/gi, replacement: "buang" },
    { pattern: /\bbg\b/gi, replacement: "bogo" },
    { pattern: /\blnt\b/gi, replacement: "linti" },
    { pattern: /\blwy\b/gi, replacement: "laway" },
    { pattern: /\byt\b/gi, replacement: "yati" },
  ];

  static normalizeLeetSpeak(text: string, language: DetectedLanguage): string {
    let normalized = text.toLowerCase();

    // Language-specific leet patterns
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

    // General leet substitution
    for (const [leet, normal] of Object.entries(this.leetMap)) {
      normalized = normalized.split(leet).join(normal);
    }

    return normalized;
  }

  static normalizeSpacedText(text: string, language: DetectedLanguage): string {
    let normalized = text.toLowerCase();

    // English-specific spaced patterns
    if (language === "english" || language === "mixed") {
      normalized = normalized.replace(/f\s*u\s*c\s*k/gi, "fuck");
      normalized = normalized.replace(/s\s*h\s*i\s*t/gi, "shit");
      normalized = normalized.replace(/b\s*i\s*t\s*c\s*h/gi, "bitch");
      normalized = normalized.replace(/a\s*s\s*s\s*h\s*o\s*l\s*e/gi, "asshole");
    }

    // Tagalog-specific spaced patterns
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

    // Bisaya-specific spaced patterns
    if (language === "bisaya" || language === "mixed") {
      normalized = normalized.replace(/y\s*a\s*w\s*a/gi, "yawa");
      normalized = normalized.replace(/b\s*u\s*a\s*n\s*g/gi, "buang");
      normalized = normalized.replace(/b\s*o\s*g\s*o/gi, "bogo");
      normalized = normalized.replace(/p\s*i\s*s\s*t\s*e/gi, "piste");
      normalized = normalized.replace(/l\s*i\s*n\s*t\s*i/gi, "linti");
      normalized = normalized.replace(/l\s*a\s*w\s*-?\s*a\s*y/gi, "law-ay");
    }

    // Handle dots, hyphens, underscores as separators
    const separatorPatterns = [
      /[.\-_]/g, // Replace dots, hyphens, underscores
    ];

    // General spaced pattern detection
    const spacedPattern =
      /(?<![a-z0-9])([a-z0-9])[\s.\-_*#@!~`'";:/\\]+([a-z0-9])[\s.\-_*#@!~`'";:/\\]+([a-z0-9])(?:[\s.\-_*#@!~`'";:/\\]+([a-z0-9]))*(?=[,\s]|$)/gi;

    normalized = normalized.replace(spacedPattern, (match) => {
      const cleaned = match.replace(/[^a-z0-9]/gi, "");
      return cleaned;
    });

    return normalized;
  }

  static normalizeVowelRemoved(
    text: string,
    language: DetectedLanguage
  ): string {
    let normalized = text.toLowerCase();

    // Apply language-specific patterns
    if (language === "english" || language === "mixed") {
      for (const { pattern, replacement } of this.englishVowelRemovedPatterns) {
        normalized = normalized.replace(pattern, replacement);
      }
    }

    if (language === "tagalog" || language === "mixed") {
      for (const { pattern, replacement } of this.tagalogVowelRemovedPatterns) {
        normalized = normalized.replace(pattern, replacement);
      }
    }

    if (language === "bisaya" || language === "mixed") {
      for (const { pattern, replacement } of this.bisayaVowelRemovedPatterns) {
        normalized = normalized.replace(pattern, replacement);
      }
    }

    return normalized;
  }

  static normalize(
    text: string,
    language?: DetectedLanguage
  ): {
    original: string;
    normalized: string;
    transformations: string[];
    detectedLanguage: DetectedLanguage;
  } {
    const transformations: string[] = [];
    let normalized = text;

    // Auto-detect language if not provided
    const detectedLang = language || detectLanguage(text).primary;

    const afterSpaced = this.normalizeSpacedText(normalized, detectedLang);
    if (afterSpaced !== normalized.toLowerCase()) {
      transformations.push("spaced_profanity");
      normalized = afterSpaced;
    } else {
      normalized = normalized.toLowerCase();
    }

    const afterLeet = this.normalizeLeetSpeak(normalized, detectedLang);
    if (afterLeet !== normalized) {
      transformations.push("leet_speak");
      normalized = afterLeet;
    }

    const afterVowel = this.normalizeVowelRemoved(normalized, detectedLang);
    if (afterVowel !== normalized) {
      transformations.push("vowel_removal");
      normalized = afterVowel;
    }

    return {
      original: text,
      normalized,
      transformations,
      detectedLanguage: detectedLang,
    };
  }

  static containsObfuscatedProfanity(
    text: string,
    language?: DetectedLanguage
  ): {
    found: boolean;
    matches: string[];
    obfuscationType: string[];
    language: DetectedLanguage;
  } {
    const { normalized, transformations, detectedLanguage } = this.normalize(
      text,
      language
    );

    // If no transformations were applied, no obfuscation detected
    if (transformations.length === 0) {
      return {
        found: false,
        matches: [],
        obfuscationType: [],
        language: detectedLanguage,
      };
    }

    // Check if this looks like a reporting/quoting context
    const lowerText = text.toLowerCase();
    const reportingPatterns = [
      /filter\s+detected/i,
      /word\s+['"]?\w+['"]?\s+in/i,
      /content\s+filter/i,
      /detected\s+the\s+word/i,
      /reported\s+saying/i,
      /study\s+(examined|analyzed|found)/i,
      /research\s+(shows|found)/i,
      /called\s+(him|her|them)\s+['"]?/i,
      /witness\s+said/i,
      /quote[ds]?\s/i,
    ];

    const isReportingContext = reportingPatterns.some((pattern) =>
      pattern.test(lowerText)
    );

    // If it's clearly a reporting context, don't flag obfuscation
    if (isReportingContext) {
      return {
        found: false,
        matches: [],
        obfuscationType: [],
        language: detectedLanguage,
      };
    }

    const matches: string[] = [];
    const words = normalized.match(/\b\w+\b/g) || [];

    // Check against all profanity lists
    for (const word of words) {
      if (allBasicProfanityList.includes(word)) {
        matches.push(word);
      }
    }

    // Check for multi-word profanity
    for (const profanity of allBasicProfanityList) {
      if (profanity.includes(" ") && normalized.includes(profanity)) {
        if (!matches.includes(profanity)) {
          matches.push(profanity);
        }
      }
    }

    // Check for partial matches - only for longer words to avoid false positives
    for (const profanity of allToxicProfanityList) {
      if (profanity.length >= 5 && normalized.includes(profanity)) {
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
      language: detectedLanguage,
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

// ============================================================
// ENHANCED MULTILINGUAL SYSTEM PROMPT
// ============================================================

function getMultilingualSystemPrompt(language: DetectedLanguage): string {
  return `You are an expert multilingual content moderator specializing in English, Tagalog (Filipino), and Bisaya (Cebuano) languages. Your task is to classify text as CLEAN, MILD, or TOXIC with high accuracy.

=== PRIORITY RULES (CHECK FIRST) ===

1. SCUNTHORPE PROBLEM → CLEAN
   These words CONTAIN profanity substrings but are LEGITIMATE:
   - assassin, bass, classic, class, mass, massage, pass, passage
   - cockpit, cocktail, cockatoo, shuttlecock, peacock, hancock
   - Scunthorpe, breaststroke, therapist, psychotherapist
   - analyze, analysis, analytical, assembly, asset
   - Buckingham, title, titanic, dickens, dickenson
   - Tagalog: puting (white), pusit (squid), putol (cut)
   - Bisaya: puti (white), bogas (rice), lawas (body/scope)
   
2. ACADEMIC/RESEARCH CONTEXT → CLEAN
   - "The study examined hate speech..." → CLEAN
   - "Research shows profanity usage..." → CLEAN
   - "The filter detected the word 'fuck'..." → CLEAN (meta-discussion)
   - Discussing profanity without USING it offensively = CLEAN

3. TECHNICAL/PROFESSIONAL → CLEAN
   - Gaming: "killed", "destroyed", "headshot", "respawn", "GG"
   - Sports: "murdered them on the scoreboard", "destroyed the opponent"
   - Cooking: "beat the eggs", "whip until stiff", "pound the meat"
   - Computing: "kill process", "daemon", "master/slave"
   - Medical: breast, testicular, penis, vagina (in medical context)

4. RELIGIOUS EXCLAMATIONS → CLEAN
   - "Diyos ko", "Susmariosep", "Hesus", "Ginoo ko", "Santo Papa"
   - These are cultural expressions, NOT profanity

=== TOXIC CLASSIFICATION ===

ALWAYS TOXIC (regardless of politeness wrappers):
• Direct profanity AS AN INSULT: "you fucking idiot", "gago ka"
• Threats: death wishes, violence promises, harm wishes
• Self-harm encouragement: "kill yourself", "patayin mo sarili mo"
• Hate speech: discrimination by race, ethnicity, gender, sexuality, religion
• Bullying: personal attacks, exclusion, appearance attacks

OBFUSCATED PROFANITY (filter evasion) → TOXIC:
• Leet speak: "f4ck", "5h1t", "b1tch", "put4ng1n4", "y4w4"
• Spaced: "f u c k", "g a g o", "y a w a"
• Vowel removal: "fck", "sht", "gg" (when clearly profanity)
• Symbol substitution: "@$$", "$hit", "b!tch"

=== MILD CLASSIFICATION ===

• Frustration without personal attack: "This is damn frustrating"
• Mild criticism: "That was a dumb move"
• Self-directed: "I'm such an idiot"

=== LANGUAGE-SPECIFIC PROFANITY ===

ENGLISH: fuck, shit, bitch, asshole, cunt, dick, bastard, whore, slut, racial slurs

TAGALOG (when directed at someone):
putangina, putang ina, puta, gago/gaga, ulol, tanga, bobo/boba, tarantado
leche, punyeta, hinayupak, hayop ka, walang hiya, kingina, pota, ampota

BISAYA (when directed at someone):
yawa, piste/pisti, buang/boang, bogo, linti/lintik, law-ay
yati, hinampak, animal (as insult), satanas, pisting yawa

=== DECISION PROCESS ===

1. Check if it's Scunthorpe problem → CLEAN
2. Check if it's academic/research/reporting context → CLEAN
3. Check if it's technical/gaming/sports/cooking/medical → CLEAN
4. Check if it's religious exclamation → CLEAN
5. Check for obfuscation + directed at someone → TOXIC
6. Check for threats/harassment/hate → TOXIC
7. Check for mild frustration without target → MILD
8. Otherwise → Use best judgment

${
  language === "mixed"
    ? "\n=== CODE-SWITCHING DETECTED ===\nThis text mixes languages (Taglish/Bislish). Apply ALL relevant language rules."
    : ""
}

RESPOND WITH EXACTLY ONE WORD: CLEAN, MILD, or TOXIC`;
}

async function callContextualCheck(
  originalText: string,
  normalizedText: string,
  normalization: NormalizationResult & { detectedLanguage?: DetectedLanguage },
  omniResult: OmniModerationResult,
  language: DetectedLanguage
): Promise<ContextualResult> {
  // Build context about normalization
  let normalizationContext = "";
  if (normalization.obfuscationDetected) {
    normalizationContext = `
⚠️ OBFUSCATION DETECTED:
- Original: "${originalText}"
- Normalized: "${normalizedText}"
- Obfuscation methods: ${normalization.transformations.join(", ")}
- Detected profanity: ${normalization.obfuscatedMatches.join(", ")}
- Detected language: ${language}

User is attempting to bypass content filters. Unless this is academic/reporting context, classify as TOXIC.`;
  }

  const systemPrompt = getMultilingualSystemPrompt(language);

  const userPrompt = `Text: "${originalText}"
Language detected: ${language.toUpperCase()}
${normalizationContext}
Initial moderation: ${
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
    reason: `GPT-4o-mini classified as ${classification} (${language})`,
  };
}

// ============================================================
// TEST RUNNER
// ============================================================

interface ExtendedTestResult extends TestResult {
  language: DetectedLanguage;
  languageExpected?: string;
}

interface ExtendedTestSummary extends TestSummary {
  languageBreakdown: Record<string, { correct: number; total: number }>;
}

async function runSingleTest(
  testCase: TestCase,
  expectedLanguage?: string
): Promise<ExtendedTestResult> {
  const startTime = performance.now();
  let apiCalls = 0;

  try {
    // Step 1: Language detection
    const languageResult = detectLanguage(testCase.text);
    const detectedLanguage = languageResult.primary;

    // Step 2: MultilingualTextNormalizer pre-processing
    const {
      normalized,
      transformations,
      detectedLanguage: normalizedLang,
    } = MultilingualTextNormalizer.normalize(testCase.text, detectedLanguage);

    const obfuscationCheck =
      MultilingualTextNormalizer.containsObfuscatedProfanity(
        testCase.text,
        detectedLanguage
      );

    const normalization: NormalizationResult = {
      original: testCase.text,
      normalized,
      transformations,
      obfuscationDetected: obfuscationCheck.found,
      obfuscatedMatches: obfuscationCheck.matches,
    };

    // Step 3: Call omni-moderation
    const omniResult = await callOmniModeration(testCase.text);
    apiCalls++;

    let finalLabel: string;
    let contextualResult: ContextualResult | null = null;

    // Step 4: Decision logic with obfuscation consideration

    // Check for Scunthorpe problem - words containing profanity but are legitimate
    const scunthorpeWords = [
      "assassin",
      "bass",
      "class",
      "classic",
      "mass",
      "massage",
      "pass",
      "passage",
      "cockpit",
      "cocktail",
      "cockatoo",
      "cock-a-doodle",
      "shuttlecock",
      "peacock",
      "scunthorpe",
      "breaststroke",
      "therapist",
      "analyze",
      "analysis",
      "assembly",
      "buckingham",
      "titanic",
      "title",
      "titillate",
      // Tagalog
      "puting",
      "pusit",
      "putol",
      "tangang",
      "buwaya",
      // Bisaya
      "puti",
      "bogas",
      "lawas",
      "bogaboga",
    ];

    // Gaming/sports context words that may be flagged by Omni
    const gamingContextWords = [
      "killed",
      "kill",
      "headshot",
      "respawn",
      "game",
      "gaming",
      "match",
      "destroyed",
      "murder",
      "murdered",
      "annihilated",
      "slaughter",
      "player",
      "score",
      "scoreboard",
      "team",
      "round",
      "play",
    ];

    // Literary/media context words
    const literaryContextWords = [
      "movie",
      "film",
      "book",
      "novel",
      "character",
      "story",
      "dialogue",
      "scene",
      "chapter",
      "plot",
      "narrative",
      "documentary",
    ];

    const lowerText = testCase.text.toLowerCase();
    const hasScunthorpeWord = scunthorpeWords.some((word) =>
      lowerText.includes(word)
    );
    const hasGamingContext =
      gamingContextWords.filter((word) => lowerText.includes(word)).length >= 2;
    const hasLiteraryContext = literaryContextWords.some((word) =>
      lowerText.includes(word)
    );

    // For these contexts, always check with GPT when Omni flags
    const needsContextCheck =
      hasScunthorpeWord || hasGamingContext || hasLiteraryContext;

    // If omni flagged but we detect special context, always check with GPT
    if (
      omniResult.flagged &&
      needsContextCheck &&
      !normalization.obfuscationDetected
    ) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
      contextualResult = await callContextualCheck(
        testCase.text,
        normalized,
        { ...normalization, detectedLanguage },
        omniResult,
        detectedLanguage
      );
      apiCalls++;
      finalLabel = contextualResult.classification;
    } else if (
      normalization.obfuscationDetected &&
      obfuscationCheck.matches.length > 0
    ) {
      // Check if it's a toxic profanity word
      const hasToxicMatch = obfuscationCheck.matches.some((m) =>
        allToxicProfanityList.includes(m)
      );

      if (hasToxicMatch) {
        // Strong signal - obfuscated toxic profanity detected
        await sleep(DELAY_BETWEEN_REQUESTS_MS);
        contextualResult = await callContextualCheck(
          testCase.text,
          normalized,
          { ...normalization, detectedLanguage },
          omniResult,
          detectedLanguage
        );
        apiCalls++;

        // Trust GPT if it says clean (academic context), otherwise toxic
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
          { ...normalization, detectedLanguage },
          omniResult,
          detectedLanguage
        );
        apiCalls++;
        finalLabel = contextualResult.classification;
      }
    } else if (
      omniResult.needsContextualCheck ||
      omniResult.classification === "ambiguous"
    ) {
      // Omni says ambiguous, call GPT for context
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
      contextualResult = await callContextualCheck(
        testCase.text,
        normalized,
        { ...normalization, detectedLanguage },
        omniResult,
        detectedLanguage
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
      language: detectedLanguage,
      languageExpected: expectedLanguage,
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
      language: "english",
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface LanguageDetailedStats {
  total: number;
  correct: number;
  accuracy: number;
  cleanStats: { total: number; correct: number; accuracy: number };
  toxicStats: { total: number; correct: number; accuracy: number };
  mildStats: { total: number; correct: number; accuracy: number };
  confusionMatrix: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  };
  precision: number;
  recall: number;
  f1Score: number;
  avgLatencyMs: number;
}

interface ComprehensiveSummary extends ExtendedTestSummary {
  // Overall metrics
  precision: number;
  recall: number;
  f1Score: number;
  specificity: number;
  balancedAccuracy: number;
  mcc: number; // Matthews Correlation Coefficient

  // Per-class accuracy
  cleanAccuracy: number;
  toxicAccuracy: number;
  mildAccuracy: number;

  // Latency stats
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  medianLatencyMs: number;
  p95LatencyMs: number;

  // Language-specific detailed stats
  languageDetailedStats: Record<string, LanguageDetailedStats>;

  // Error analysis
  errorAnalysis: {
    falsePositivesByCategory: Record<string, number>;
    falseNegativesByCategory: Record<string, number>;
    misclassificationDetails: Array<{
      id: number;
      text: string;
      expected: string;
      predicted: string;
      category: string;
      language: string;
    }>;
  };
}

function calculateSummary(results: ExtendedTestResult[]): ComprehensiveSummary {
  const correctPredictions = results.filter((r) => r.isCorrect).length;

  // ===========================================
  // CONFUSION MATRIX (Binary: Toxic vs Non-Toxic)
  // ===========================================
  let truePositives = 0; // Actual toxic, predicted toxic
  let falsePositives = 0; // Actual clean/mild, predicted toxic
  let trueNegatives = 0; // Actual clean/mild, predicted clean/mild
  let falseNegatives = 0; // Actual toxic, predicted clean/mild

  results.forEach((r) => {
    const actualToxic = r.testCase.expectedLabel === "toxic";
    const predictedToxic = r.finalLabel === "toxic";

    if (actualToxic && predictedToxic) truePositives++;
    if (!actualToxic && predictedToxic) falsePositives++;
    if (!actualToxic && !predictedToxic) trueNegatives++;
    if (actualToxic && !predictedToxic) falseNegatives++;
  });

  // ===========================================
  // PRECISION, RECALL, F1, SPECIFICITY, MCC
  // ===========================================
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1Score =
    precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;
  const specificity = trueNegatives / (trueNegatives + falsePositives) || 0;
  const balancedAccuracy = (recall + specificity) / 2;

  // Matthews Correlation Coefficient
  const mccNumerator =
    truePositives * trueNegatives - falsePositives * falseNegatives;
  const mccDenominator = Math.sqrt(
    (truePositives + falsePositives) *
      (truePositives + falseNegatives) *
      (trueNegatives + falsePositives) *
      (trueNegatives + falseNegatives)
  );
  const mcc = mccDenominator !== 0 ? mccNumerator / mccDenominator : 0;

  // ===========================================
  // PER-CLASS ACCURACY
  // ===========================================
  const cleanResults = results.filter(
    (r) => r.testCase.expectedLabel === "clean"
  );
  const toxicResults = results.filter(
    (r) => r.testCase.expectedLabel === "toxic"
  );
  const mildResults = results.filter(
    (r) => r.testCase.expectedLabel === "mild"
  );

  const cleanCorrect = cleanResults.filter((r) => r.isCorrect).length;
  const toxicCorrect = toxicResults.filter((r) => r.isCorrect).length;
  const mildCorrect = mildResults.filter((r) => r.isCorrect).length;

  const cleanAccuracy =
    cleanResults.length > 0 ? (cleanCorrect / cleanResults.length) * 100 : 0;
  const toxicAccuracy =
    toxicResults.length > 0 ? (toxicCorrect / toxicResults.length) * 100 : 0;
  const mildAccuracy =
    mildResults.length > 0 ? (mildCorrect / mildResults.length) * 100 : 0;

  // ===========================================
  // CATEGORY BREAKDOWN
  // ===========================================
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

  // ===========================================
  // LANGUAGE BREAKDOWN (Simple)
  // ===========================================
  const languageBreakdown: Record<string, { correct: number; total: number }> =
    {};
  results.forEach((r) => {
    const lang = r.languageExpected || r.language;
    if (!languageBreakdown[lang]) {
      languageBreakdown[lang] = { correct: 0, total: 0 };
    }
    languageBreakdown[lang].total++;
    if (r.isCorrect) languageBreakdown[lang].correct++;
  });

  // ===========================================
  // LATENCY STATS
  // ===========================================
  const latencies = results
    .map((r) => r.processingTimeMs)
    .sort((a, b) => a - b);
  const totalTime = latencies.reduce((sum, l) => sum + l, 0);
  const avgLatencyMs = totalTime / results.length;
  const minLatencyMs = latencies[0] || 0;
  const maxLatencyMs = latencies[latencies.length - 1] || 0;
  const medianLatencyMs = latencies[Math.floor(latencies.length / 2)] || 0;
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95LatencyMs = latencies[p95Index] || maxLatencyMs;

  const totalApiCalls = results.reduce((sum, r) => sum + r.apiCalls, 0);

  // ===========================================
  // OBFUSCATION STATS
  // ===========================================
  const obfuscationResults = results.filter(
    (r) => r.normalization.obfuscationDetected
  );
  const obfuscationCorrect = obfuscationResults.filter(
    (r) => r.isCorrect
  ).length;

  // ===========================================
  // LANGUAGE DETAILED STATS
  // ===========================================
  const languageDetailedStats: Record<string, LanguageDetailedStats> = {};

  const languages = ["english", "tagalog", "bisaya"];
  for (const lang of languages) {
    const langResults = results.filter(
      (r) => (r.languageExpected || r.language) === lang
    );
    if (langResults.length === 0) continue;

    const langCorrect = langResults.filter((r) => r.isCorrect).length;

    // Per-class stats for this language
    const langClean = langResults.filter(
      (r) => r.testCase.expectedLabel === "clean"
    );
    const langToxic = langResults.filter(
      (r) => r.testCase.expectedLabel === "toxic"
    );
    const langMild = langResults.filter(
      (r) => r.testCase.expectedLabel === "mild"
    );

    const langCleanCorrect = langClean.filter((r) => r.isCorrect).length;
    const langToxicCorrect = langToxic.filter((r) => r.isCorrect).length;
    const langMildCorrect = langMild.filter((r) => r.isCorrect).length;

    // Confusion matrix for this language
    let langTP = 0,
      langFP = 0,
      langTN = 0,
      langFN = 0;
    langResults.forEach((r) => {
      const actualToxic = r.testCase.expectedLabel === "toxic";
      const predictedToxic = r.finalLabel === "toxic";
      if (actualToxic && predictedToxic) langTP++;
      if (!actualToxic && predictedToxic) langFP++;
      if (!actualToxic && !predictedToxic) langTN++;
      if (actualToxic && !predictedToxic) langFN++;
    });

    const langPrecision = langTP / (langTP + langFP) || 0;
    const langRecall = langTP / (langTP + langFN) || 0;
    const langF1 =
      langPrecision + langRecall > 0
        ? (2 * langPrecision * langRecall) / (langPrecision + langRecall)
        : 0;

    const langLatencies = langResults.map((r) => r.processingTimeMs);
    const langAvgLatency =
      langLatencies.reduce((sum, l) => sum + l, 0) / langResults.length;

    languageDetailedStats[lang] = {
      total: langResults.length,
      correct: langCorrect,
      accuracy: (langCorrect / langResults.length) * 100,
      cleanStats: {
        total: langClean.length,
        correct: langCleanCorrect,
        accuracy:
          langClean.length > 0
            ? (langCleanCorrect / langClean.length) * 100
            : 0,
      },
      toxicStats: {
        total: langToxic.length,
        correct: langToxicCorrect,
        accuracy:
          langToxic.length > 0
            ? (langToxicCorrect / langToxic.length) * 100
            : 0,
      },
      mildStats: {
        total: langMild.length,
        correct: langMildCorrect,
        accuracy:
          langMild.length > 0 ? (langMildCorrect / langMild.length) * 100 : 0,
      },
      confusionMatrix: {
        truePositives: langTP,
        falsePositives: langFP,
        trueNegatives: langTN,
        falseNegatives: langFN,
      },
      precision: langPrecision * 100,
      recall: langRecall * 100,
      f1Score: langF1 * 100,
      avgLatencyMs: langAvgLatency,
    };
  }

  // ===========================================
  // ERROR ANALYSIS
  // ===========================================
  const falsePositivesByCategory: Record<string, number> = {};
  const falseNegativesByCategory: Record<string, number> = {};
  const misclassificationDetails: Array<{
    id: number;
    text: string;
    expected: string;
    predicted: string;
    category: string;
    language: string;
  }> = [];

  results.forEach((r) => {
    if (!r.isCorrect) {
      const actualToxic = r.testCase.expectedLabel === "toxic";
      const predictedToxic = r.finalLabel === "toxic";
      const category = r.testCase.category;

      if (!actualToxic && predictedToxic) {
        // False Positive
        falsePositivesByCategory[category] =
          (falsePositivesByCategory[category] || 0) + 1;
      } else if (actualToxic && !predictedToxic) {
        // False Negative
        falseNegativesByCategory[category] =
          (falseNegativesByCategory[category] || 0) + 1;
      }

      misclassificationDetails.push({
        id: r.testCase.id,
        text:
          r.testCase.text.substring(0, 80) +
          (r.testCase.text.length > 80 ? "..." : ""),
        expected: r.testCase.expectedLabel,
        predicted: r.finalLabel,
        category: r.testCase.category,
        language: r.languageExpected || r.language,
      });
    }
  });

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
    precision: precision * 100,
    recall: recall * 100,
    f1Score: f1Score * 100,
    specificity: specificity * 100,
    balancedAccuracy: balancedAccuracy * 100,
    mcc,
    cleanAccuracy,
    toxicAccuracy,
    mildAccuracy,
    categoryBreakdown,
    languageBreakdown,
    totalApiCalls,
    totalTimeMs: totalTime,
    averageTimePerTest: avgLatencyMs,
    avgLatencyMs,
    minLatencyMs,
    maxLatencyMs,
    medianLatencyMs,
    p95LatencyMs,
    obfuscationStats: {
      detected: obfuscationResults.length,
      correctlyClassified: obfuscationCorrect,
    },
    languageDetailedStats,
    errorAnalysis: {
      falsePositivesByCategory,
      falseNegativesByCategory,
      misclassificationDetails,
    },
  };
}

async function runTests(): Promise<void> {
  console.log("═".repeat(70));
  console.log("🌐 JoSan Multilingual Contextual Analysis Test");
  console.log("   Languages: English, Tagalog, Bisaya");
  console.log("═".repeat(70));

  // Prepare test cases with language labels
  const allTestCases: Array<{ case: TestCase; language: string }> = [];

  if (RUN_FULL_TEST) {
    englishTestCases.forEach((tc) =>
      allTestCases.push({ case: tc, language: "english" })
    );
    tagalogTestCases.forEach((tc) =>
      allTestCases.push({ case: tc, language: "tagalog" })
    );
    bisayaTestCases.forEach((tc) =>
      allTestCases.push({ case: tc, language: "bisaya" })
    );
  } else {
    // Sample from each language
    englishTestCases
      .slice(0, TEST_SAMPLE_SIZE)
      .forEach((tc) => allTestCases.push({ case: tc, language: "english" }));
    tagalogTestCases
      .slice(0, TEST_SAMPLE_SIZE)
      .forEach((tc) => allTestCases.push({ case: tc, language: "tagalog" }));
    bisayaTestCases
      .slice(0, TEST_SAMPLE_SIZE)
      .forEach((tc) => allTestCases.push({ case: tc, language: "bisaya" }));
  }

  console.log(`\n⚠️  This test will make REAL API calls to OpenAI!`);
  console.log(`   Total tests: ${allTestCases.length}`);
  console.log(
    `   - English: ${
      allTestCases.filter((t) => t.language === "english").length
    }`
  );
  console.log(
    `   - Tagalog: ${
      allTestCases.filter((t) => t.language === "tagalog").length
    }`
  );
  console.log(
    `   - Bisaya: ${allTestCases.filter((t) => t.language === "bisaya").length}`
  );
  console.log(
    `   Estimated API calls: ${Math.round(allTestCases.length * 1.5)}`
  );
  console.log(`   Delay between requests: ${DELAY_BETWEEN_REQUESTS_MS}ms\n`);

  const results: ExtendedTestResult[] = [];
  let currentLanguage = "";

  for (let i = 0; i < allTestCases.length; i++) {
    const { case: testCase, language } = allTestCases[i];

    // Print language header when changing
    if (language !== currentLanguage) {
      currentLanguage = language;
      console.log(`\n${"─".repeat(50)}`);
      console.log(`📚 Testing ${language.toUpperCase()} cases`);
      console.log(`${"─".repeat(50)}`);
    }

    process.stdout.write(
      `[${i + 1}/${allTestCases.length}] #${testCase.id} (${language})...`
    );

    const result = await runSingleTest(testCase, language);
    results.push(result);

    const status = result.isCorrect ? "✓" : "✗";
    const obfuscFlag = result.normalization.obfuscationDetected ? " [OBF]" : "";
    const langDetect =
      result.language !== language ? ` [→${result.language}]` : "";
    const errorInfo = result.error ? ` (Error: ${result.error})` : "";
    console.log(
      ` ${status} Expected: ${testCase.expectedLabel}, Got: ${result.finalLabel}${obfuscFlag}${langDetect}${errorInfo}`
    );

    if (!result.isCorrect && !result.error) {
      console.log(
        `      Text: "${testCase.text.substring(0, 60)}${
          testCase.text.length > 60 ? "..." : ""
        }"`
      );
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
          } (${result.omniResult.confidence.toFixed(2)})`
        );
      }
      if (result.contextualResult) {
        console.log(
          `      GPT-4o-mini: ${result.contextualResult.classification}`
        );
      }
    }

    // Rate limiting delay
    if (i < allTestCases.length - 1) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  const summary = calculateSummary(results);

  // ===========================================
  // PRINT COMPREHENSIVE SUMMARY
  // ===========================================
  console.log("\n" + "═".repeat(80));
  console.log(
    "📊 COMPREHENSIVE TEST SUMMARY - MULTILINGUAL CONTEXTUAL ANALYSIS"
  );
  console.log("═".repeat(80));

  // Basic stats
  console.log(
    "\n┌─────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│                           OVERALL STATISTICS                                │"
  );
  console.log(
    "├─────────────────────────────────────────────────────────────────────────────┤"
  );
  console.log(
    `│  Total Tests:          ${summary.totalTests
      .toString()
      .padEnd(10)} │  Correct Predictions:  ${summary.correctPredictions
      .toString()
      .padEnd(10)} │`
  );
  console.log(
    `│  Overall Accuracy:     ${summary.accuracy
      .toFixed(2)
      .padEnd(10)}% │  Total API Calls:      ${summary.totalApiCalls
      .toString()
      .padEnd(10)} │`
  );
  console.log(
    "└─────────────────────────────────────────────────────────────────────────────┘"
  );

  // ===========================================
  // CONFUSION MATRIX
  // ===========================================
  console.log(
    "\n┌─────────────────────────────────────────────────────────────────────────────┐"
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
    `│    Actual    │  TP: ${summary.confusionMatrix.truePositives
      .toString()
      .padEnd(10)} │  FN: ${summary.confusionMatrix.falseNegatives
      .toString()
      .padEnd(10)} │  Toxic               │`
  );
  console.log(
    "│              ├──────────────────┼──────────────────┤                       │"
  );
  console.log(
    `│              │  FP: ${summary.confusionMatrix.falsePositives
      .toString()
      .padEnd(10)} │  TN: ${summary.confusionMatrix.trueNegatives
      .toString()
      .padEnd(10)} │  Non-Toxic           │`
  );
  console.log(
    "│              └──────────────────┴──────────────────┘                       │"
  );
  console.log(
    "└─────────────────────────────────────────────────────────────────────────────┘"
  );

  // ===========================================
  // CLASSIFICATION METRICS
  // ===========================================
  console.log(
    "\n┌─────────────────────────────────────────────────────────────────────────────┐"
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
      .padEnd(10)}%  (TP / (TP + FP))                         │`
  );
  console.log(
    `│  Recall (Sensitivity): ${summary.recall
      .toFixed(2)
      .padEnd(10)}%  (TP / (TP + FN))                         │`
  );
  console.log(
    `│  Specificity:          ${summary.specificity
      .toFixed(2)
      .padEnd(10)}%  (TN / (TN + FP))                         │`
  );
  console.log(
    `│  F1 Score:             ${summary.f1Score
      .toFixed(2)
      .padEnd(10)}%  (2 * P * R / (P + R))                     │`
  );
  console.log(
    `│  Balanced Accuracy:    ${summary.balancedAccuracy
      .toFixed(2)
      .padEnd(10)}%  ((Recall + Specificity) / 2)            │`
  );
  console.log(
    `│  MCC:                  ${summary.mcc
      .toFixed(4)
      .padEnd(10)}   (Matthews Correlation Coefficient)         │`
  );
  console.log(
    "└─────────────────────────────────────────────────────────────────────────────┘"
  );

  // ===========================================
  // PER-CLASS ACCURACY
  // ===========================================
  console.log(
    "\n┌─────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│                            PER-CLASS ACCURACY                              │"
  );
  console.log(
    "├─────────────────────────────────────────────────────────────────────────────┤"
  );
  const cleanBar = "█".repeat(Math.round(summary.cleanAccuracy / 10));
  const toxicBar = "█".repeat(Math.round(summary.toxicAccuracy / 10));
  const mildBar = "█".repeat(Math.round(summary.mildAccuracy / 10));
  console.log(
    `│  Clean Accuracy:       ${summary.cleanAccuracy
      .toFixed(2)
      .padEnd(10)}%  ${cleanBar.padEnd(12)}                     │`
  );
  console.log(
    `│  Toxic Accuracy:       ${summary.toxicAccuracy
      .toFixed(2)
      .padEnd(10)}%  ${toxicBar.padEnd(12)}                     │`
  );
  console.log(
    `│  Mild Accuracy:        ${summary.mildAccuracy
      .toFixed(2)
      .padEnd(10)}%  ${mildBar.padEnd(12)}                     │`
  );
  console.log(
    "└─────────────────────────────────────────────────────────────────────────────┘"
  );

  // ===========================================
  // LATENCY STATISTICS
  // ===========================================
  console.log(
    "\n┌─────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│                           LATENCY STATISTICS                               │"
  );
  console.log(
    "├─────────────────────────────────────────────────────────────────────────────┤"
  );
  console.log(
    `│  Total Time:           ${(summary.totalTimeMs / 1000)
      .toFixed(2)
      .padEnd(10)}s                                         │`
  );
  console.log(
    `│  Average Latency:      ${summary.avgLatencyMs
      .toFixed(0)
      .padEnd(10)}ms                                        │`
  );
  console.log(
    `│  Min Latency:          ${summary.minLatencyMs
      .toFixed(0)
      .padEnd(10)}ms                                        │`
  );
  console.log(
    `│  Max Latency:          ${summary.maxLatencyMs
      .toFixed(0)
      .padEnd(10)}ms                                        │`
  );
  console.log(
    `│  Median Latency:       ${summary.medianLatencyMs
      .toFixed(0)
      .padEnd(10)}ms                                        │`
  );
  console.log(
    `│  95th Percentile:      ${summary.p95LatencyMs
      .toFixed(0)
      .padEnd(10)}ms                                        │`
  );
  console.log(
    "└─────────────────────────────────────────────────────────────────────────────┘"
  );

  // ===========================================
  // OBFUSCATION DETECTION
  // ===========================================
  const obfuscationAccuracy =
    summary.obfuscationStats.detected > 0
      ? (summary.obfuscationStats.correctlyClassified /
          summary.obfuscationStats.detected) *
        100
      : 0;
  console.log(
    "\n┌─────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│                          OBFUSCATION DETECTION                             │"
  );
  console.log(
    "├─────────────────────────────────────────────────────────────────────────────┤"
  );
  console.log(
    `│  Total Obfuscated:     ${summary.obfuscationStats.detected
      .toString()
      .padEnd(10)}                                        │`
  );
  console.log(
    `│  Correctly Classified: ${summary.obfuscationStats.correctlyClassified
      .toString()
      .padEnd(10)}                                        │`
  );
  console.log(
    `│  Obfuscation Accuracy: ${obfuscationAccuracy
      .toFixed(2)
      .padEnd(10)}%                                        │`
  );
  console.log(
    "└─────────────────────────────────────────────────────────────────────────────┘"
  );

  // ===========================================
  // ACCURACY BY LANGUAGE
  // ===========================================
  console.log("\n" + "═".repeat(80));
  console.log("📌 ACCURACY BY LANGUAGE");
  console.log("═".repeat(80));

  // Overall language accuracy table
  console.log(
    "\n┌──────────────────────────────────────────────────────────────────────────────┐"
  );
  console.log(
    "│ Language     │ Correct/Total │ Accuracy │ Precision │ Recall │ F1 Score     │"
  );
  console.log(
    "├──────────────────────────────────────────────────────────────────────────────┤"
  );

  Object.entries(summary.languageDetailedStats)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([lang, stats]) => {
      console.log(
        `│ ${lang.padEnd(12)} │ ${(stats.correct + "/" + stats.total).padEnd(
          13
        )} │ ${stats.accuracy.toFixed(1).padEnd(8)}% │ ${stats.precision
          .toFixed(1)
          .padEnd(9)}% │ ${stats.recall.toFixed(1).padEnd(6)}% │ ${stats.f1Score
          .toFixed(1)
          .padEnd(12)}% │`
      );
    });
  console.log(
    "└──────────────────────────────────────────────────────────────────────────────┘"
  );

  // Detailed per-language breakdown
  console.log("\n📊 DETAILED BREAKDOWN BY LANGUAGE:");
  console.log("─".repeat(80));

  ["english", "tagalog", "bisaya"].forEach((lang) => {
    const stats = summary.languageDetailedStats[lang];
    if (!stats) return;

    console.log(`\n  🌐 ${lang.toUpperCase()}`);
    console.log(`  ${"─".repeat(40)}`);
    console.log(
      `     Overall:    ${stats.correct}/${
        stats.total
      } (${stats.accuracy.toFixed(1)}%)`
    );
    console.log(
      `     Clean:      ${stats.cleanStats.correct}/${
        stats.cleanStats.total
      } (${stats.cleanStats.accuracy.toFixed(1)}%)`
    );
    console.log(
      `     Toxic:      ${stats.toxicStats.correct}/${
        stats.toxicStats.total
      } (${stats.toxicStats.accuracy.toFixed(1)}%)`
    );
    if (stats.mildStats.total > 0) {
      console.log(
        `     Mild:       ${stats.mildStats.correct}/${
          stats.mildStats.total
        } (${stats.mildStats.accuracy.toFixed(1)}%)`
      );
    }
    console.log(`     Precision:  ${stats.precision.toFixed(2)}%`);
    console.log(`     Recall:     ${stats.recall.toFixed(2)}%`);
    console.log(`     F1 Score:   ${stats.f1Score.toFixed(2)}%`);
    console.log(`     Avg Latency: ${stats.avgLatencyMs.toFixed(0)}ms`);
    console.log(
      `     Confusion Matrix: TP=${stats.confusionMatrix.truePositives} FP=${stats.confusionMatrix.falsePositives} TN=${stats.confusionMatrix.trueNegatives} FN=${stats.confusionMatrix.falseNegatives}`
    );
  });

  // ===========================================
  // CATEGORY BREAKDOWN
  // ===========================================
  console.log("\n" + "═".repeat(80));
  console.log("📂 CATEGORY BREAKDOWN");
  console.log("═".repeat(80));

  const sortedCategories = Object.entries(summary.categoryBreakdown).sort(
    ([, a], [, b]) => b.correct / b.total - a.correct / a.total
  );

  console.log(
    "\n┌────────────────────────────┬─────────────┬──────────┬────────────────────┐"
  );
  console.log(
    "│ Category                   │ Correct     │ Accuracy │ Visual             │"
  );
  console.log(
    "├────────────────────────────┼─────────────┼──────────┼────────────────────┤"
  );

  sortedCategories.forEach(([category, stats]) => {
    const catAccuracy = (stats.correct / stats.total) * 100;
    const bar = "█".repeat(Math.round(catAccuracy / 10));
    console.log(
      `│ ${category.padEnd(26)} │ ${(stats.correct + "/" + stats.total).padEnd(
        11
      )} │ ${catAccuracy.toFixed(0).padEnd(7)}% │ ${bar.padEnd(18)} │`
    );
  });
  console.log(
    "└────────────────────────────┴─────────────┴──────────┴────────────────────┘"
  );

  // ===========================================
  // ERROR ANALYSIS
  // ===========================================
  console.log("\n" + "═".repeat(80));
  console.log("❌ ERROR ANALYSIS");
  console.log("═".repeat(80));

  const totalErrors = summary.errorAnalysis.misclassificationDetails.length;
  const fpTotal = Object.values(
    summary.errorAnalysis.falsePositivesByCategory
  ).reduce((a, b) => a + b, 0);
  const fnTotal = Object.values(
    summary.errorAnalysis.falseNegativesByCategory
  ).reduce((a, b) => a + b, 0);

  console.log(`\n  Total Misclassifications: ${totalErrors}`);
  console.log(`  False Positives (clean→toxic): ${fpTotal}`);
  console.log(`  False Negatives (toxic→clean): ${fnTotal}`);

  if (Object.keys(summary.errorAnalysis.falsePositivesByCategory).length > 0) {
    console.log("\n  📈 False Positives by Category:");
    Object.entries(summary.errorAnalysis.falsePositivesByCategory)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`     ${cat.padEnd(25)}: ${count}`);
      });
  }

  if (Object.keys(summary.errorAnalysis.falseNegativesByCategory).length > 0) {
    console.log("\n  📉 False Negatives by Category:");
    Object.entries(summary.errorAnalysis.falseNegativesByCategory)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`     ${cat.padEnd(25)}: ${count}`);
      });
  }

  // Show some misclassification examples
  if (summary.errorAnalysis.misclassificationDetails.length > 0) {
    console.log("\n  📋 Sample Misclassifications (first 10):");
    console.log("  " + "─".repeat(76));
    summary.errorAnalysis.misclassificationDetails
      .slice(0, 10)
      .forEach((err) => {
        console.log(`  #${err.id} [${err.language}] ${err.category}`);
        console.log(`     Expected: ${err.expected} → Got: ${err.predicted}`);
        console.log(`     Text: "${err.text}"`);
        console.log("");
      });
  }

  // ===========================================
  // FINAL SUMMARY TABLE
  // ===========================================
  console.log("\n" + "═".repeat(80));
  console.log("🏆 FINAL SUMMARY");
  console.log("═".repeat(80));

  console.log(
    "\n┌──────────────────────────────────────────────────────────────────────────────┐"
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
    `│  Average Latency:        ${summary.avgLatencyMs.toFixed(0)}ms`.padEnd(
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

  ["english", "tagalog", "bisaya"].forEach((lang) => {
    const stats = summary.languageDetailedStats[lang];
    if (stats) {
      console.log(
        `│  ${
          lang.charAt(0).toUpperCase() + lang.slice(1).padEnd(19)
        }: ${stats.accuracy.toFixed(2)}% accuracy, F1: ${stats.f1Score.toFixed(
          2
        )}%, Latency: ${stats.avgLatencyMs.toFixed(0)}ms`.padEnd(79) + "│"
      );
    }
  });
  console.log(
    "└──────────────────────────────────────────────────────────────────────────────┘"
  );

  // Save results
  const outputData = {
    testDate: new Date().toISOString(),
    testVersion: "multilingual-v2-comprehensive",
    languages: ["english", "tagalog", "bisaya"],
    apiModel: {
      moderation: "omni-moderation-latest",
      contextual: "gpt-4o-mini",
    },
    features: {
      multilingualNormalizerEnabled: true,
      languageDetectionEnabled: true,
      leetSpeakDetection: true,
      spacedProfanityDetection: true,
      vowelRemovalDetection: true,
    },
    summary: {
      totalTests: summary.totalTests,
      correctPredictions: summary.correctPredictions,
      accuracy: summary.accuracy,
      confusionMatrix: summary.confusionMatrix,
      precision: summary.precision,
      recall: summary.recall,
      f1Score: summary.f1Score,
      specificity: summary.specificity,
      balancedAccuracy: summary.balancedAccuracy,
      mcc: summary.mcc,
      cleanAccuracy: summary.cleanAccuracy,
      toxicAccuracy: summary.toxicAccuracy,
      mildAccuracy: summary.mildAccuracy,
      latencyStats: {
        totalTimeMs: summary.totalTimeMs,
        avgLatencyMs: summary.avgLatencyMs,
        minLatencyMs: summary.minLatencyMs,
        maxLatencyMs: summary.maxLatencyMs,
        medianLatencyMs: summary.medianLatencyMs,
        p95LatencyMs: summary.p95LatencyMs,
      },
      obfuscationStats: summary.obfuscationStats,
      categoryBreakdown: summary.categoryBreakdown,
      languageBreakdown: summary.languageBreakdown,
      languageDetailedStats: summary.languageDetailedStats,
      errorAnalysis: summary.errorAnalysis,
      totalApiCalls: summary.totalApiCalls,
    },
    results: results.map((r) => ({
      id: r.testCase.id,
      text: r.testCase.text,
      expectedLabel: r.testCase.expectedLabel,
      predictedLabel: r.finalLabel,
      isCorrect: r.isCorrect,
      category: r.testCase.category,
      description: r.testCase.description,
      expectedLanguage: r.languageExpected,
      detectedLanguage: r.language,
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
    "contextual-analysis-results-multilingual.json"
  );
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);
}

// Run tests
runTests().catch(console.error);
