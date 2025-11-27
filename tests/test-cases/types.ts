/**
 * Test Case Type Definitions
 */

export interface TestCase {
  id: number;
  text: string;
  expectedLabel: "clean" | "mild" | "toxic";
  category: string;
  description: string;
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
