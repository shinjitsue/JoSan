/**
 * Training Data Export Script
 *
 * Exports annotation data to OpenAI-compatible JSONL format for fine-tuning.
 * Supports 80/20 train/validation split and various filtering options.
 *
 * Usage:
 *   npx tsx src/scripts/export-training-data.ts <input.json> [options]
 *
 * Options:
 *   --split           Create train/validation split (80/20)
 *   --language=<code> Filter by language (en, tl, bis, mixed)
 *   --min-confidence=<n>  Minimum confidence threshold (0-1)
 *   --output=<dir>    Output directory (default: ./training-data)
 */

import * as fs from "fs";
import * as path from "path";
import type {
  AnnotationRecord,
  LanguageCode,
  OpenAITrainingExample,
  ExportStats,
} from "../../tests/test-cases/types";

interface ExportOptions {
  inputPath: string;
  outputDir: string;
  split: boolean;
  language?: LanguageCode;
  minConfidence: number;
  trainRatio: number;
}

function getLanguageName(code: LanguageCode): string {
  const names: Record<LanguageCode, string> = {
    en: "English",
    tl: "Tagalog/Filipino",
    bis: "Bisaya/Cebuano",
    mixed: "Mixed languages",
  };
  return names[code] || "Unknown";
}

function buildSystemPrompt(language: LanguageCode): string {
  const basePrompt = "You are an expert content moderator";
  const languageContext = getLanguageName(language);

  const additionalContext: Record<LanguageCode, string> = {
    en: "Consider context, sarcasm, and cultural references.",
    tl: "Consider Filipino cultural context, honorifics (po, opo), indirect speech patterns, and gaming terminology (ML, kill, patay in game context are usually clean).",
    bis: "Consider Visayan/Cebuano cultural context, regional expressions, and gaming terminology. Watch for threats, bullying, and disguised insults.",
    mixed:
      "Analyze each language component carefully and consider code-switching patterns.",
  };

  return `${basePrompt} for ${languageContext} content. Classify text as CLEAN (acceptable), MILD (mildly inappropriate), or TOXIC (harmful/offensive). ${additionalContext[language]}`;
}

function convertToTrainingExample(
  annotation: AnnotationRecord,
): OpenAITrainingExample {
  return {
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(annotation.language),
      },
      {
        role: "user",
        content: `Classify this text: "${annotation.text}"`,
      },
      {
        role: "assistant",
        content: annotation.label.toUpperCase(),
      },
    ],
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function computeStats(annotations: AnnotationRecord[]): ExportStats {
  const stats: ExportStats = {
    totalExamples: annotations.length,
    trainExamples: 0,
    validationExamples: 0,
    byLanguage: { en: 0, tl: 0, bis: 0, mixed: 0 },
    byLabel: { clean: 0, mild: 0, toxic: 0 },
    bySource: {
      manual: 0,
      "google-forms": 0,
      "existing-dataset": 0,
      synthetic: 0,
    },
    exportedAt: new Date().toISOString(),
  };

  annotations.forEach((a) => {
    stats.byLanguage[a.language]++;
    stats.byLabel[a.label]++;
    stats.bySource[a.source]++;
  });

  return stats;
}

function writeJSONL(data: OpenAITrainingExample[], filePath: string): void {
  const content = data.map((d) => JSON.stringify(d)).join("\n");
  fs.writeFileSync(filePath, content);
}

async function exportTrainingData(options: ExportOptions): Promise<void> {
  console.log("📤 JoSan Training Data Export Tool\n");

  // Read input file
  if (!fs.existsSync(options.inputPath)) {
    console.error(`❌ Input file not found: ${options.inputPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(options.inputPath, "utf-8");
  let annotations: AnnotationRecord[] = JSON.parse(content);

  console.log(`📄 Loaded ${annotations.length} annotations\n`);

  // Apply filters
  if (options.language) {
    annotations = annotations.filter((a) => a.language === options.language);
    console.log(
      `🔍 Filtered to ${annotations.length} ${options.language} annotations`,
    );
  }

  if (options.minConfidence > 0) {
    annotations = annotations.filter(
      (a) => a.confidence >= options.minConfidence,
    );
    console.log(
      `🔍 Filtered to ${annotations.length} annotations with confidence >= ${options.minConfidence}`,
    );
  }

  if (annotations.length === 0) {
    console.error("❌ No annotations match the filter criteria");
    process.exit(1);
  }

  // Create output directory
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  // Shuffle annotations
  const shuffled = shuffleArray(annotations);

  // Compute stats
  const stats = computeStats(annotations);

  if (options.split) {
    // Split into train/validation
    const splitIndex = Math.floor(shuffled.length * options.trainRatio);
    const trainData = shuffled.slice(0, splitIndex);
    const validationData = shuffled.slice(splitIndex);

    stats.trainExamples = trainData.length;
    stats.validationExamples = validationData.length;

    // Convert to training format
    const trainExamples = trainData.map(convertToTrainingExample);
    const validationExamples = validationData.map(convertToTrainingExample);

    // Write files
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const trainPath = path.join(options.outputDir, `train-${timestamp}.jsonl`);
    const valPath = path.join(
      options.outputDir,
      `validation-${timestamp}.jsonl`,
    );
    const statsPath = path.join(options.outputDir, `stats-${timestamp}.json`);

    writeJSONL(trainExamples, trainPath);
    writeJSONL(validationExamples, valPath);
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    console.log("\n📊 Export Statistics:");
    console.log("─".repeat(40));
    console.log(`   Total examples:      ${stats.totalExamples}`);
    console.log(
      `   Training examples:   ${stats.trainExamples} (${(options.trainRatio * 100).toFixed(0)}%)`,
    );
    console.log(
      `   Validation examples: ${stats.validationExamples} (${((1 - options.trainRatio) * 100).toFixed(0)}%)`,
    );
    console.log("");
    console.log("   By Language:");
    Object.entries(stats.byLanguage).forEach(([lang, count]) => {
      if (count > 0) console.log(`     ${lang}: ${count}`);
    });
    console.log("");
    console.log("   By Label:");
    Object.entries(stats.byLabel).forEach(([label, count]) => {
      if (count > 0) console.log(`     ${label}: ${count}`);
    });
    console.log("");
    console.log("✅ Files created:");
    console.log(`   📄 ${trainPath}`);
    console.log(`   📄 ${valPath}`);
    console.log(`   📄 ${statsPath}`);
  } else {
    // Single file export
    const examples = shuffled.map(convertToTrainingExample);
    stats.trainExamples = examples.length;

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const outputPath = path.join(
      options.outputDir,
      `training-${timestamp}.jsonl`,
    );
    const statsPath = path.join(options.outputDir, `stats-${timestamp}.json`);

    writeJSONL(examples, outputPath);
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    console.log("\n📊 Export Statistics:");
    console.log("─".repeat(40));
    console.log(`   Total examples: ${stats.totalExamples}`);
    console.log("");
    console.log("   By Language:");
    Object.entries(stats.byLanguage).forEach(([lang, count]) => {
      if (count > 0) console.log(`     ${lang}: ${count}`);
    });
    console.log("");
    console.log("   By Label:");
    Object.entries(stats.byLabel).forEach(([label, count]) => {
      if (count > 0) console.log(`     ${label}: ${count}`);
    });
    console.log("");
    console.log("✅ Files created:");
    console.log(`   📄 ${outputPath}`);
    console.log(`   📄 ${statsPath}`);
  }

  console.log("");
  console.log("💡 Next steps:");
  console.log("   1. Review the JSONL files for quality");
  console.log("   2. Upload to OpenAI for fine-tuning:");
  console.log("      openai api files.create -f train-*.jsonl -p fine-tune");
  console.log("   3. Create fine-tuning job:");
  console.log(
    "      openai api fine_tunes.create -t file-<id> -m gpt-4o-mini-2024-07-18",
  );
}

// Parse CLI arguments
function parseArgs(): ExportOptions {
  const args = process.argv.slice(2);

  if (args.length < 1 || args[0].startsWith("--")) {
    console.log(
      "Usage: npx tsx src/scripts/export-training-data.ts <input.json> [options]",
    );
    console.log("");
    console.log("Options:");
    console.log(
      "  --split                 Create train/validation split (80/20)",
    );
    console.log(
      "  --language=<code>       Filter by language (en, tl, bis, mixed)",
    );
    console.log("  --min-confidence=<n>    Minimum confidence threshold (0-1)");
    console.log(
      "  --output=<dir>          Output directory (default: ./training-data)",
    );
    console.log(
      "  --train-ratio=<n>       Train ratio for split (default: 0.8)",
    );
    console.log("");
    console.log("Examples:");
    console.log(
      "  npx tsx src/scripts/export-training-data.ts annotations.json --split",
    );
    console.log(
      "  npx tsx src/scripts/export-training-data.ts data.json --language=tl --min-confidence=0.9",
    );
    process.exit(1);
  }

  const options: ExportOptions = {
    inputPath: args[0],
    outputDir: "./training-data",
    split: false,
    minConfidence: 0,
    trainRatio: 0.8,
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--split") {
      options.split = true;
    } else if (arg.startsWith("--language=")) {
      options.language = arg.split("=")[1] as LanguageCode;
    } else if (arg.startsWith("--min-confidence=")) {
      options.minConfidence = parseFloat(arg.split("=")[1]);
    } else if (arg.startsWith("--output=")) {
      options.outputDir = arg.split("=")[1];
    } else if (arg.startsWith("--train-ratio=")) {
      options.trainRatio = parseFloat(arg.split("=")[1]);
    }
  }

  return options;
}

const options = parseArgs();
exportTrainingData(options).catch(console.error);
