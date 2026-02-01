/**
 * Google Forms Data Import Script
 *
 * Imports annotation data from Google Forms CSV exports and validates/transforms
 * into the JoSan annotation format.
 *
 * Expected CSV format:
 * Timestamp, Text, Label (CLEAN/MILD/TOXIC), Language (EN/TL/BIS), Category
 *
 * Usage:
 *   npx tsx src/scripts/import-forms-data.ts <input.csv> [output.json]
 */

import * as fs from "fs";
import type {
  AnnotationRecord,
  ContentLabel,
  LanguageCode,
} from "../../tests/test-cases/types";

interface CSVRow {
  timestamp: string;
  text: string;
  label: string;
  language: string;
  category: string;
  annotatorEmail?: string;
}

interface ImportStats {
  totalRows: number;
  validRows: number;
  skippedRows: number;
  duplicates: number;
  byLanguage: Record<string, number>;
  byLabel: Record<string, number>;
  errors: string[];
}

const LANGUAGE_ALIASES: Record<string, LanguageCode> = {
  english: "en",
  en: "en",
  tagalog: "tl",
  tl: "tl",
  filipino: "tl",
  bisaya: "bis",
  bis: "bis",
  cebuano: "bis",
  mixed: "mixed",
};

const LABEL_ALIASES: Record<string, ContentLabel> = {
  clean: "clean",
  safe: "clean",
  ok: "clean",
  mild: "mild",
  warning: "mild",
  caution: "mild",
  toxic: "toxic",
  harmful: "toxic",
  profane: "toxic",
  offensive: "toxic",
};

function parseCSV(content: string): CSVRow[] {
  const lines = content.split("\n");
  const rows: CSVRow[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted fields with commas
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    if (fields.length >= 4) {
      rows.push({
        timestamp: fields[0] || new Date().toISOString(),
        text: fields[1] || "",
        label: fields[2] || "",
        language: fields[3] || "",
        category: fields[4] || "general",
        annotatorEmail: fields[5],
      });
    }
  }

  return rows;
}

function normalizeLabel(raw: string): ContentLabel | null {
  const normalized = raw.toLowerCase().trim();
  return LABEL_ALIASES[normalized] || null;
}

function normalizeLanguage(raw: string): LanguageCode | null {
  const normalized = raw.toLowerCase().trim();
  return LANGUAGE_ALIASES[normalized] || null;
}

function validateRow(
  row: CSVRow,
  index: number,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!row.text || row.text.length < 3) {
    errors.push(`Row ${index + 2}: Text too short or empty`);
  }

  if (row.text.length > 1000) {
    errors.push(
      `Row ${index + 2}: Text too long (${row.text.length} chars, max 1000)`,
    );
  }

  const label = normalizeLabel(row.label);
  if (!label) {
    errors.push(`Row ${index + 2}: Invalid label "${row.label}"`);
  }

  const language = normalizeLanguage(row.language);
  if (!language) {
    errors.push(`Row ${index + 2}: Invalid language "${row.language}"`);
  }

  return { valid: errors.length === 0, errors };
}

function convertToAnnotation(
  row: CSVRow,
  existingIds: Set<string>,
): AnnotationRecord | null {
  const label = normalizeLabel(row.label);
  const language = normalizeLanguage(row.language);

  if (!label || !language) return null;

  // Check for duplicate text
  const textHash = row.text.toLowerCase().trim();
  if (existingIds.has(textHash)) {
    return null;
  }
  existingIds.add(textHash);

  return {
    id: crypto.randomUUID(),
    text: row.text.trim(),
    label,
    language,
    category: row.category.toLowerCase().trim() || "general",
    source: "google-forms",
    annotatorId: row.annotatorEmail
      ? `forms-${row.annotatorEmail.split("@")[0]}`
      : "google-forms-anonymous",
    confidence: 0.8, // Default confidence for crowdsourced data
    metadata: {
      createdAt: row.timestamp || new Date().toISOString(),
      notes: "Imported from Google Forms",
    },
  };
}

async function importFormsData(
  inputPath: string,
  outputPath?: string,
): Promise<void> {
  console.log("📥 JoSan Google Forms Import Tool\n");

  // Read input file
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, "utf-8");
  const rows = parseCSV(content);

  console.log(`📄 Parsed ${rows.length} rows from CSV\n`);

  // Initialize stats
  const stats: ImportStats = {
    totalRows: rows.length,
    validRows: 0,
    skippedRows: 0,
    duplicates: 0,
    byLanguage: {},
    byLabel: {},
    errors: [],
  };

  // Process rows
  const existingIds = new Set<string>();
  const annotations: AnnotationRecord[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const validation = validateRow(row, i);

    if (!validation.valid) {
      stats.errors.push(...validation.errors);
      stats.skippedRows++;
      continue;
    }

    const annotation = convertToAnnotation(row, existingIds);

    if (!annotation) {
      stats.duplicates++;
      continue;
    }

    annotations.push(annotation);
    stats.validRows++;
    stats.byLanguage[annotation.language] =
      (stats.byLanguage[annotation.language] || 0) + 1;
    stats.byLabel[annotation.label] =
      (stats.byLabel[annotation.label] || 0) + 1;
  }

  // Print stats
  console.log("📊 Import Statistics:");
  console.log("─".repeat(40));
  console.log(`   Total rows:    ${stats.totalRows}`);
  console.log(`   Valid rows:    ${stats.validRows}`);
  console.log(`   Skipped:       ${stats.skippedRows}`);
  console.log(`   Duplicates:    ${stats.duplicates}`);
  console.log("");
  console.log("   By Language:");
  Object.entries(stats.byLanguage).forEach(([lang, count]) => {
    console.log(`     ${lang}: ${count}`);
  });
  console.log("");
  console.log("   By Label:");
  Object.entries(stats.byLabel).forEach(([label, count]) => {
    console.log(`     ${label}: ${count}`);
  });

  if (stats.errors.length > 0) {
    console.log("");
    console.log("⚠️  Validation Errors (first 10):");
    stats.errors.slice(0, 10).forEach((err) => console.log(`   ${err}`));
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`);
    }
  }

  // Write output
  const defaultOutput = inputPath.replace(/\.csv$/i, "-imported.json");
  const finalOutput = outputPath || defaultOutput;

  fs.writeFileSync(finalOutput, JSON.stringify(annotations, null, 2));
  console.log("");
  console.log(
    `✅ Exported ${annotations.length} annotations to: ${finalOutput}`,
  );
}

// CLI entry point
const args = process.argv.slice(2);
if (args.length < 1) {
  console.log(
    "Usage: npx tsx src/scripts/import-forms-data.ts <input.csv> [output.json]",
  );
  console.log("");
  console.log("Expected CSV format:");
  console.log("  Timestamp, Text, Label, Language, Category, [Email]");
  console.log("");
  console.log("Example:");
  console.log(
    "  npx tsx src/scripts/import-forms-data.ts responses.csv annotations.json",
  );
  process.exit(1);
}

importFormsData(args[0], args[1]).catch(console.error);
