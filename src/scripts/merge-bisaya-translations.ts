/**
 * Merge Bisaya Translations into Combined Annotations
 *
 * This script merges the translated Bisaya toxic examples
 * into the main combined_annotations.json file.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function main() {
  const dataDir = path.join(__dirname, "../../data/existing-datasets");
  const combinedPath = path.join(dataDir, "combined_annotations.json");
  const translatedPath = path.join(dataDir, "bisaya_toxic_translated.json");
  const backupPath = path.join(
    dataDir,
    `combined_annotations_backup_${Date.now()}.json`,
  );

  console.log("=".repeat(60));
  console.log("Merge Bisaya Translations Script");
  console.log("=".repeat(60));

  // Check if translated file exists
  if (!fs.existsSync(translatedPath)) {
    console.error(
      "❌ Translated file not found. Run translate-tagalog-to-bisaya.ts first.",
    );
    process.exit(1);
  }

  // Load files
  console.log("\n1. Loading files...");
  const combined: Annotation[] = JSON.parse(
    fs.readFileSync(combinedPath, "utf-8"),
  );
  const translated: Annotation[] = JSON.parse(
    fs.readFileSync(translatedPath, "utf-8"),
  );

  console.log(`   Combined annotations: ${combined.length}`);
  console.log(`   Translated Bisaya: ${translated.length}`);

  // Check for duplicates
  console.log("\n2. Checking for duplicates...");
  const existingTexts = new Set(combined.map((a) => a.text.toLowerCase()));
  const newTranslations = translated.filter(
    (t) => !existingTexts.has(t.text.toLowerCase()),
  );

  const duplicates = translated.length - newTranslations.length;
  if (duplicates > 0) {
    console.log(`   ⚠️  Skipping ${duplicates} duplicate texts`);
  }

  // Create backup
  console.log("\n3. Creating backup...");
  fs.writeFileSync(backupPath, JSON.stringify(combined, null, 2), "utf-8");
  console.log(`   Backup saved to: ${path.basename(backupPath)}`);

  // Merge
  console.log("\n4. Merging annotations...");
  const merged = [...combined, ...newTranslations];

  // Save
  fs.writeFileSync(combinedPath, JSON.stringify(merged, null, 2), "utf-8");

  // Generate stats
  console.log("\n" + "=".repeat(60));
  console.log("MERGE SUMMARY");
  console.log("=".repeat(60));

  const stats = {
    before: combined.length,
    added: newTranslations.length,
    after: merged.length,
    byLanguage: {} as Record<
      string,
      { total: number; toxic: number; clean: number; mild: number }
    >,
    bySource: {} as Record<string, number>,
  };

  for (const a of merged) {
    // By language
    if (!stats.byLanguage[a.language]) {
      stats.byLanguage[a.language] = { total: 0, toxic: 0, clean: 0, mild: 0 };
    }
    stats.byLanguage[a.language].total++;
    stats.byLanguage[a.language][a.label]++;

    // By source
    const source = a.metadata.translatedFrom
      ? `translated-from-${a.metadata.translatedFrom}`
      : a.metadata.originalDataset || a.source;
    stats.bySource[source] = (stats.bySource[source] || 0) + 1;
  }

  console.log(
    `\nTotal annotations: ${stats.before} → ${stats.after} (+${stats.added})`,
  );

  console.log("\n📊 By Language:");
  for (const [lang, counts] of Object.entries(stats.byLanguage)) {
    const langName =
      lang === "tl" ? "Tagalog" : lang === "bis" ? "Bisaya" : "English";
    console.log(`   ${langName} (${lang}):`);
    console.log(`     Total: ${counts.total}`);
    console.log(`     Toxic: ${counts.toxic}`);
    console.log(`     Clean: ${counts.clean}`);
    console.log(`     Mild: ${counts.mild}`);
  }

  console.log("\n📊 By Source:");
  for (const [source, count] of Object.entries(stats.bySource)) {
    console.log(`   ${source}: ${count}`);
  }

  // Update JSONL training file
  console.log("\n5. Updating training JSONL file...");
  const jsonlPath = path.join(dataDir, "combined_training.jsonl");
  const jsonlLines = merged.map((a) =>
    JSON.stringify({
      text: a.text,
      label: a.label,
      language: a.language,
      category: a.category,
    }),
  );
  fs.writeFileSync(jsonlPath, jsonlLines.join("\n"), "utf-8");
  console.log(`   Updated: ${path.basename(jsonlPath)}`);

  console.log("\n✅ Merge complete!");
}

main().catch(console.error);
