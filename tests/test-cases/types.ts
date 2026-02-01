/**
 * Test Case Type Definitions
 */

/** Supported languages for annotation and testing */
export type LanguageCode = "en" | "tl" | "bis" | "mixed";

/** Label classification for content moderation */
export type ContentLabel = "clean" | "mild" | "toxic";

/** Source of annotation data */
export type AnnotationSource =
  | "manual" // Direct annotation in UI
  | "google-forms" // Imported from Google Forms
  | "existing-dataset" // Curated from external datasets
  | "synthetic"; // AI-generated examples

/** Metadata for annotation provenance and quality */
export interface AnnotationMetadata {
  createdAt: string; // ISO timestamp
  updatedAt?: string; // ISO timestamp
  reviewedAt?: string; // ISO timestamp for self-review
  notes?: string; // Annotator notes
  originalText?: string; // Before any normalization
  tags?: string[]; // Additional categorization tags
}

/** Extended test case with full annotation fields */
export interface TestCase {
  id: number;
  text: string;
  expectedLabel: ContentLabel;
  category: string;
  description: string;

  // Phase 2: Extended annotation fields
  language?: LanguageCode;
  source?: AnnotationSource;
  annotatorId?: string;
  confidence?: number; // Annotator's confidence (0-1)
  metadata?: AnnotationMetadata;
}

/** Annotation record for training data export */
export interface AnnotationRecord {
  id: string; // UUID
  text: string;
  label: ContentLabel;
  language: LanguageCode;
  category: string;
  source: AnnotationSource;
  annotatorId: string;
  confidence: number;
  metadata: AnnotationMetadata;
}

/** OpenAI-compatible JSONL format for fine-tuning */
export interface OpenAITrainingExample {
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
}

/** Export statistics for training data */
export interface ExportStats {
  totalExamples: number;
  trainExamples: number;
  validationExamples: number;
  byLanguage: Record<LanguageCode, number>;
  byLabel: Record<ContentLabel, number>;
  bySource: Record<AnnotationSource, number>;
  exportedAt: string;
}

export interface NormalizationResult {
  original: string;
  normalized: string;
  transformations: string[];
  obfuscationDetected: boolean;
  obfuscatedMatches: string[];
}

export interface OmniModerationResult {
  classification: "clean" | "mild" | "toxic" | "ambiguous";
  confidence: number;
  needsContextualCheck: boolean;
  categories?: string[];
  flagged: boolean;
  rawScores?: Record<string, number>;
}

export interface ContextualResult {
  classification: "clean" | "mild" | "toxic";
  confidence: number;
  reason: string;
}

export interface TestResult {
  testCase: TestCase;
  normalization: NormalizationResult;
  omniResult: OmniModerationResult | null;
  contextualResult: ContextualResult | null;
  finalLabel: string;
  isCorrect: boolean;
  processingTimeMs: number;
  apiCalls: number;
  error?: string;
}

export interface TestSummary {
  totalTests: number;
  correctPredictions: number;
  accuracy: number;
  confusionMatrix: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  };
  categoryBreakdown: Record<string, { correct: number; total: number }>;
  totalApiCalls: number;
  totalTimeMs: number;
  averageTimePerTest: number;
  obfuscationStats: {
    detected: number;
    correctlyClassified: number;
  };
}
