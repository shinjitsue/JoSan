/**
 * Translate Toxic Tagalog Examples to Bisaya
 *
 * This script translates toxic Tagalog examples from the syke9p3 dataset
 * to Bisaya/Cebuano for training data augmentation.
 *
 * Uses:
 * 1. Common profanity word mappings (Tagalog → Bisaya)
 * 2. MyMemory Translation API (free, no key required)
 * 3. Google Translate (via googletrans library if available)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// Types
// =============================================================================

interface AnnotationMetadata {
  createdAt: string;
  originalDataset: string;
  originalLabels?: Record<string, number>;
  translatedFrom?: string;
  translationMethod?: string;
  originalText?: string;
}

interface Annotation {
  id: string;
  text: string;
  label: "clean" | "mild" | "toxic";
  language: "tl" | "bis" | "en";
  category: string;
  source: string;
  annotatorId: string;
  confidence: number;
  metadata: AnnotationMetadata;
}

// =============================================================================
// Tagalog to Bisaya Word Mappings
// =============================================================================

/**
 * Common Tagalog to Bisaya/Cebuano profanity and slang mappings
 * These are the most frequently used toxic terms that need accurate translation
 */
const TAGALOG_TO_BISAYA_PROFANITY: Record<string, string> = {
  // Strong profanity
  putangina: "yawa",
  "putang ina": "yawa",
  puta: "buwang",
  tangina: "yawa",
  gago: "buang",
  gaga: "buanga",
  tanga: "bugo",
  bobo: "bobo",
  boba: "boba",
  ulol: "buang",
  tarantado: "burikat",
  pakyu: "yawa ka",
  "fuck you": "yawa ka",
  hindot: "iyot",
  kantot: "iyot",
  leche: "yawa",
  punyeta: "punyeta",
  hayop: "mananap",
  "anak ng puta": "anak sa yawa",

  // Mild profanity / insults
  panget: "ngil-ad",
  pangit: "ngil-ad",
  bwisit: "hasol",
  buwisit: "hasol",
  peste: "peste",
  sira: "buang",
  "sira ulo": "buang",
  loko: "buang",
  loka: "buanga",
  engot: "bugo",
  inutil: "walay pulos",
  demonyo: "yawa",
  satanas: "yawa",
  baliw: "buang",

  // Body-related insults
  mabaho: "baho",
  anghit: "anghit",
  sungki: "sungki",
  dugyot: "hugaw",
  bastos: "bastos",
  malandi: "malibog",
  malibog: "malibog",
  pokpok: "pampam",
  kabit: "kabit",
  bakla: "bayot",
  bading: "bayot",
  tomboy: "tomboy",

  // Common words for context
  mga: "mga",
  ang: "ang",
  sa: "sa",
  ng: "sa",
  ka: "ka",
  ikaw: "ikaw",
  siya: "siya",
  sila: "sila",
  tayo: "kita",
  kami: "kami",
  mo: "imo",
  ko: "ako",
  niya: "iya",
  nila: "ila",
  atin: "ato",
  ano: "unsa",
  sino: "kinsa",
  bakit: "ngano",
  paano: "unsaon",
  nasaan: "asa",
  dito: "diri",
  doon: "didto",
  ganito: "ingani",
  ganoon: "ingana",
  hindi: "dili",
  oo: "oo",
  wala: "wala",
  meron: "naa",
  may: "naa",
  dapat: "kinahanglan",
  gusto: "gusto",
  ayaw: "ayaw",
  bakit: "ngano",
  kasi: "kay",
  dahil: "tungod",
  para: "para",
  lahat: "tanan",
  walang: "walay",
  tapos: "dayon",
  ngayon: "karon",
  mamaya: "unya",
  kahapon: "gahapon",
  bukas: "ugma",

  // Action words commonly used in toxic content
  mamatay: "mamatay",
  patayin: "patyon",
  sirain: "gub-on",
  bastusin: "bastusan",
  manakit: "sakit",
  masakit: "sakit",
  sapakin: "sumbagon",
  suntukin: "sumbagon",
  tadyakan: "sipaan",
  sipain: "sipaan",
  bugbugin: "bugbogon",
  awayin: "away",

  // Adjectives
  pangit: "ngil-ad",
  maganda: "gwapa",
  gwapo: "gwapo",
  mataba: "tambok",
  payat: "niwang",
  maitim: "itom",
  maputi: "puti",
  mahina: "huyang",
  malakas: "kusog",
  matalino: "maalam",
  bobong: "bugo nga",
  tanganga: "bugo kaayo",
  kakapal: "baga kaayo",
};

/**
 * Tagalog sentence structure patterns to Bisaya
 */
const TAGALOG_TO_BISAYA_PATTERNS: Array<[RegExp, string]> = [
  // Common expressions
  [/\bano ba\b/gi, "unsa ba"],
  [/\bano yan\b/gi, "unsa na"],
  [/\bano ka ba\b/gi, "unsa ka ba"],
  [/\bsarap\b/gi, "lami"],
  [/\bmasarap\b/gi, "lami"],
  [/\bkakain\b/gi, "mokaon"],
  [/\bkumain\b/gi, "kaon"],
  [/\btulad mo\b/gi, "sama nimo"],
  [/\bkung gusto mo\b/gi, "kung gusto nimo"],
  [/\bsa tingin ko\b/gi, "sa akong tan-aw"],
  [/\bmukha kang\b/gi, "murag"],
  [/\bmukha kayong\b/gi, "murag mo"],
  [/\bparang\b/gi, "murag"],
  [/\btalaga\b/gi, "gyud"],
  [/\bsobra\b/gi, "sobra"],
  [/\bmasyado\b/gi, "kaayo"],
  [/\bnapaka\b/gi, "sobra ka"],
  [/\bbaka\b/gi, "basin"],
  [/\bpag\b/gi, "kung"],
  [/\bpero\b/gi, "pero"],
  [/\bat\b/gi, "ug"],
  [/\bo\b/gi, "o"],
  [/\bna\b/gi, "na"],
  [/\bpa\b/gi, "pa"],
  [/\blang\b/gi, "lang"],
  [/\blamang\b/gi, "lang"],
  [/\bdin\b/gi, "pud"],
  [/\brin\b/gi, "pud"],
  [/\bnga\b/gi, "nga"],
  [/\bhay nako\b/gi, "sus"],
  [/\bay nako\b/gi, "sus"],
  [/\bhahahaha\b/gi, "hahahaha"],
  [/\bhaha\b/gi, "haha"],
  [/\blol\b/gi, "lol"],
  [/\bwtf\b/gi, "wtf"],
];

// =============================================================================
// Translation Functions
// =============================================================================

/**
 * Apply word-level translation using the profanity mapping
 */
function applyWordMapping(text: string): string {
  let translated = text.toLowerCase();

  // First apply pattern replacements (multi-word expressions)
  for (const [pattern, replacement] of TAGALOG_TO_BISAYA_PATTERNS) {
    translated = translated.replace(pattern, replacement);
  }

  // Then apply word-level replacements
  for (const [tagalog, bisaya] of Object.entries(TAGALOG_TO_BISAYA_PROFANITY)) {
    const regex = new RegExp(`\\b${tagalog}\\b`, "gi");
    translated = translated.replace(regex, bisaya);
  }

  return translated;
}

/**
 * Translate using MyMemory API (free, no key required)
 * Rate limited to 1000 words/day for anonymous users
 */
async function translateWithMyMemory(text: string): Promise<string | null> {
  try {
    const encodedText = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=tl|ceb`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    return null;
  } catch (error) {
    console.error("MyMemory API error:", error);
    return null;
  }
}

/**
 * Hybrid translation: combine word mapping with API translation
 * Falls back to word mapping if API fails
 */
async function translateText(
  text: string,
  useApi: boolean = true,
): Promise<{ translated: string; method: string }> {
  // First, apply word-level mapping for profanity (preserves toxic terms accurately)
  const wordMapped = applyWordMapping(text);

  if (!useApi) {
    return { translated: wordMapped, method: "word-mapping" };
  }

  // Try API translation for better sentence structure
  try {
    const apiResult = await translateWithMyMemory(text);
    if (apiResult) {
      // Apply profanity mapping to API result to ensure toxic terms are correct
      const hybridResult = applyWordMapping(apiResult);
      return { translated: hybridResult, method: "hybrid-api" };
    }
  } catch (error) {
    console.error("API translation failed, using word mapping:", error);
  }

  return { translated: wordMapped, method: "word-mapping" };
}

/**
 * Batch translate with rate limiting
 */
async function batchTranslate(
  texts: string[],
  useApi: boolean = true,
  delayMs: number = 500,
): Promise<Array<{ translated: string; method: string }>> {
  const results: Array<{ translated: string; method: string }> = [];

  for (let i = 0; i < texts.length; i++) {
    const result = await translateText(texts[i], useApi);
    results.push(result);

    // Rate limiting for API calls
    if (useApi && i < texts.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Progress logging
    if ((i + 1) % 50 === 0) {
      console.log(`Translated ${i + 1}/${texts.length} texts...`);
    }
  }

  return results;
}

// =============================================================================
// Main Script
// =============================================================================

async function main() {
  const inputPath = path.join(
    __dirname,
    "../../data/existing-datasets/combined_annotations.json",
  );
  const outputPath = path.join(
    __dirname,
    "../../data/existing-datasets/bisaya_toxic_translated.json",
  );

  console.log("=".repeat(60));
  console.log("Tagalog to Bisaya Translation Script");
  console.log("=".repeat(60));

  // Load existing annotations
  console.log("\n1. Loading annotations...");
  const annotations: Annotation[] = JSON.parse(
    fs.readFileSync(inputPath, "utf-8"),
  );

  // Filter toxic Tagalog examples from syke9p3 dataset
  const toxicTagalog = annotations.filter(
    (a) =>
      a.label === "toxic" &&
      a.language === "tl" &&
      a.metadata.originalDataset === "syke9p3/multilabel-tagalog-hate-speech",
  );

  console.log(
    `Found ${toxicTagalog.length} toxic Tagalog examples to translate`,
  );

  // Check for existing translated examples to avoid duplicates
  const existingBisayaToxic = annotations.filter(
    (a) =>
      a.label === "toxic" &&
      a.language === "bis" &&
      a.metadata.translatedFrom === "tl",
  );

  if (existingBisayaToxic.length > 0) {
    console.log(
      `\n⚠️  Found ${existingBisayaToxic.length} existing Bisaya toxic translations.`,
    );
    console.log("Skipping already translated texts...");
  }

  // Get texts that haven't been translated yet
  const existingOriginalTexts = new Set(
    existingBisayaToxic.map((a) => a.metadata.originalText),
  );
  const toTranslate = toxicTagalog.filter(
    (a) => !existingOriginalTexts.has(a.text),
  );

  console.log(`\n2. Translating ${toTranslate.length} new examples...`);

  // Use command line args to control API usage
  const useApi = process.argv.includes("--use-api");
  const limit =
    parseInt(
      process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] || "0",
    ) || toTranslate.length;

  const textsToTranslate = toTranslate.slice(0, limit);

  console.log(
    `Mode: ${useApi ? "Hybrid (API + word mapping)" : "Word mapping only"}`,
  );
  console.log(`Processing: ${textsToTranslate.length} examples`);

  // Translate
  const translations = await batchTranslate(
    textsToTranslate.map((a) => a.text),
    useApi,
    useApi ? 1000 : 0, // 1 second delay between API calls to avoid rate limiting
  );

  // Create new Bisaya annotations
  console.log("\n3. Creating Bisaya annotations...");
  const bisayaAnnotations: Annotation[] = textsToTranslate.map(
    (original, i) => ({
      id: `translated-bis-${Date.now()}-${i}`,
      text: translations[i].translated,
      label: original.label,
      language: "bis" as const,
      category: original.category,
      source: "translated-from-tagalog",
      annotatorId: "translation-script",
      confidence: 0.85, // Lower confidence for machine translation
      metadata: {
        createdAt: new Date().toISOString(),
        originalDataset: original.metadata.originalDataset,
        originalLabels: original.metadata.originalLabels,
        translatedFrom: "tl",
        translationMethod: translations[i].method,
        originalText: original.text,
      },
    }),
  );

  // Save translated annotations
  console.log(`\n4. Saving ${bisayaAnnotations.length} Bisaya annotations...`);
  fs.writeFileSync(
    outputPath,
    JSON.stringify(bisayaAnnotations, null, 2),
    "utf-8",
  );

  console.log(`\n✅ Saved to: ${outputPath}`);

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("TRANSLATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total toxic Tagalog examples: ${toxicTagalog.length}`);
  console.log(`Already translated: ${existingBisayaToxic.length}`);
  console.log(`Newly translated: ${bisayaAnnotations.length}`);
  console.log(`Translation method breakdown:`);

  const methodCounts = translations.reduce(
    (acc, t) => {
      acc[t.method] = (acc[t.method] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  for (const [method, count] of Object.entries(methodCounts)) {
    console.log(`  - ${method}: ${count}`);
  }

  // Show sample translations
  console.log("\n📝 Sample translations:");
  for (let i = 0; i < Math.min(5, bisayaAnnotations.length); i++) {
    console.log(`\n[${i + 1}] Original (TL):`);
    console.log(`    "${textsToTranslate[i].text.substring(0, 80)}..."`);
    console.log(`    Translated (BIS):`);
    console.log(`    "${bisayaAnnotations[i].text.substring(0, 80)}..."`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("NEXT STEPS:");
  console.log("=".repeat(60));
  console.log("1. Review the translations in the output file");
  console.log("2. Use the annotation tool to verify and fix any errors");
  console.log("3. Run: npx tsx src/scripts/merge-bisaya-translations.ts");
  console.log("   to merge into combined_annotations.json");
}

// Run if called directly
main().catch(console.error);
