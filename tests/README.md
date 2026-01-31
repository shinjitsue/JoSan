# JoSan Filter Testing Suite

## Overview

This directory contains the comprehensive testing infrastructure for the JoSan multilingual profanity filter. The test suite evaluates filter accuracy across three languages (English, Tagalog, Bisaya) and various content categories.

## Quick Start

```bash
# Install dependencies
npm install

# Run all unit tests
npm run test

# Run filter tests and export JSON for visualization
npm run test:export

# Launch Jupyter notebook for visualization
cd notebooks && jupyter lab
```

## Directory Structure

```
tests/
├── README.md                    # This file
├── filter-test-runner.ts        # Main test runner with JSON export
├── filter.test.ts               # Vitest unit tests
├── test-cases/                  # Test case definitions
│   ├── index.ts                 # Exports all test cases
│   ├── types.ts                 # TypeScript type definitions
│   ├── english-test-cases.ts    # 100 English test cases
│   ├── tagalog-test-cases.ts    # 100 Tagalog test cases
│   └── bisaya-test-cases.ts     # 100 Bisaya test cases
└── results/                     # Generated test outputs
    ├── regex-test-results.json  # Latest regex-only test results
    ├── ai-test-results.json     # Latest AI-enhanced test results
    ├── analysis-summary.json    # Notebook-generated analysis
    └── old/                     # Archived results
```

## npm Scripts

| Script                  | Description                                 |
| ----------------------- | ------------------------------------------- |
| `npm run test`          | Run all Vitest unit tests                   |
| `npm run test:watch`    | Run tests in watch mode                     |
| `npm run test:ui`       | Launch Vitest UI dashboard                  |
| `npm run test:coverage` | Generate code coverage report               |
| `npm run test:filter`   | Run filter tests (regex-only mode)          |
| `npm run test:ai`       | Run filter tests with AI analysis           |
| `npm run test:export`   | Run tests and export JSON for visualization |

## Test Categories

### Clean Content Categories

| Category     | Description                           | Example                        |
| ------------ | ------------------------------------- | ------------------------------ |
| `scunthorpe` | Words containing profanity substrings | "I went to Scunthorpe"         |
| `academic`   | Academic/educational content          | "The essay analyzed..."        |
| `medical`    | Medical terminology                   | "The patient's condition..."   |
| `cooking`    | Food/cooking related                  | "This dish is delicious"       |
| `gaming`     | Gaming context without toxicity       | "I got a headshot in the game" |
| `literary`   | Book/literary references              | "The book was fantastic"       |
| `technical`  | Technical/programming content         | "This code executes..."        |

### Toxic Content Categories

| Category        | Description                 | Example                    |
| --------------- | --------------------------- | -------------------------- |
| `direct`        | Direct profanity            | Explicit insults           |
| `leet_speak`    | Obfuscated with numbers     | "f4ck y0u"                 |
| `spaced`        | Letters separated by spaces | "f u c k"                  |
| `vowel_removal` | Vowels removed              | "fck"                      |
| `threat`        | Threatening content         | Physical harm threats      |
| `bullying`      | Harassment/bullying         | Personal attacks           |
| `hate`          | Hate speech                 | Discrimination             |
| `subtle`        | Subtle/implicit toxicity    | Passive-aggressive insults |

## Test Result JSON Schema

```typescript
interface TestSummary {
  testType: "regex" | "ai";
  timestamp: string;
  totalTests: number;
  correctPredictions: number;
  overallAccuracy: number; // Percentage
  precision: number; // TP / (TP + FP)
  recall: number; // TP / (TP + FN)
  f1Score: number; // 2 * (P * R) / (P + R)
  confusionMatrix: {
    truePositives: number;
    falsePositives: number;
    trueNegatives: number;
    falseNegatives: number;
  };
  latencyStats: {
    total: number;
    average: number;
    min: number;
    max: number;
    median: number;
    p95: number;
  };
  byLanguage: Array<{
    language: string;
    total: number;
    correct: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    avgLatency: number;
  }>;
  byCategory: Array<{
    category: string;
    total: number;
    correct: number;
    accuracy: number;
  }>;
  results: FilterTestResult[];
}
```

## Jupyter Notebook Visualization

### Setup

```bash
# Navigate to notebooks directory
cd notebooks

# Create virtual environment (first time only)
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Launch Jupyter Lab
jupyter lab
```

### Available Visualizations

1. **Key Metrics Dashboard** - Gauge charts for accuracy, precision, recall, F1
2. **Confusion Matrix Heatmap** - TP/FP/TN/FN visualization
3. **Language Performance Bars** - Grouped bar chart comparing languages
4. **Radar Chart** - Multi-dimensional language comparison
5. **Category Performance** - Horizontal bar chart sorted by accuracy
6. **Latency Distribution** - Histogram with percentile markers
7. **Error Analysis** - False positive vs false negative breakdown
8. **Obfuscation Detection** - Gauge chart and pie chart

## Key Metrics Explained

### Classification Metrics

$$\text{Precision} = \frac{TP}{TP + FP}$$

How many flagged items were actually toxic.

$$\text{Recall} = \frac{TP}{TP + FN}$$

How many toxic items were correctly flagged.

$$\text{F1 Score} = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$

Harmonic mean of precision and recall.

### Current Performance Benchmarks

| Metric           | Target  | Current |
| ---------------- | ------- | ------- |
| Overall Accuracy | ≥85%    | 84.67%  |
| Precision        | ≥90%    | 95.73%  |
| Recall           | ≥80%    | 74.67%  |
| F1 Score         | ≥85%    | 83.90%  |
| Avg Latency      | <1000ms | 952ms   |

## Writing New Test Cases

Add new test cases to the appropriate file in `test-cases/`:

```typescript
// test-cases/english-test-cases.ts
export const englishTestCases: TestCase[] = [
  {
    id: 101,
    text: "Your new test sentence here",
    expected: "clean", // or "toxic"
    language: "english",
    category: "category-name",
    obfuscation: undefined, // or "leet_speak", "spaced", etc.
  },
  // ...
];
```

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**

   ```bash
   npm install
   npm run build
   ```

2. **Jupyter kernel not found**

   ```bash
   python -m ipykernel install --user --name=josan
   ```

3. **JSON parsing errors**
   - Ensure test runner completed successfully
   - Check for valid JSON in results files

4. **Plotly charts not rendering**
   ```bash
   pip install plotly kaleido
   ```

## Contributing

When adding new test cases:

1. Maintain balance between clean and toxic samples
2. Include edge cases for obfuscation patterns
3. Test across all three languages when applicable
4. Update expected counts in this README

## License

MIT License - See [LICENSE](../LICENSE) for details.
