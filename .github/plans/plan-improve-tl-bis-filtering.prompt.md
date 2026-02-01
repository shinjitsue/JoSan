# Plan: Improve Tagalog & Bisaya AI Filtering Accuracy (Phased Rollout)

**TL;DR**: A three-phase improvement plan targeting Tagalog (78% → 92%+ F1) and Bisaya (72% → 88%+ F1). **Phase 1** delivers quick wins with testing checkpoint. **Phase 2** builds annotation pipeline (2-3 weeks, ~5K examples). **Phase 3** implements dual fine-tuning with comprehensive thesis metrics comparison.

---

## Phase 1: Quick Wins (1-2 days)

### Steps

1. **Add few-shot examples to AI prompts** in [BackgroundAIService.ts](src/background/BackgroundAIService.ts#L450-L473):
   - Create `getFewShotExamples(langCode)` with 4-6 examples per language
   - Cover: threats, bullying, gaming context, Scunthorpe cases
   - Inject into `buildContextualPrompt()` (~300-400 tokens)

2. **Lower AI threshold for PH languages** in [BackgroundAIService.ts](src/background/BackgroundAIService.ts):
   - Add `CONFIDENCE_THRESHOLD_PH = 0.05` for `tl`/`bis`
   - Bypass omni-moderation → direct GPT contextual for PH languages

3. **Implement "run all three lists" fallback** in [FilterEngine.ts](src/content/filtering/FilterEngine.ts):
   - Add `FALLBACK_THRESHOLD = 0.5` for language confidence
   - Force-include all word lists when detection uncertain

4. **Expand Bisaya word list** in [public/data/bis.txt](public/data/bis.txt):
   - Add ~1,000 entries (threat verbs, insults, bullying phrases)
   - Target: 1,549 → 2,500+ words

### Phase 1 Testing Checkpoint

5. **Run full test suite** — execute `npx tsx tests/filter-test-runner.ts`:
   - Document baseline vs post-Phase 1 metrics
   - **Gate criteria**: TL ≥ 82% F1, BIS ≥ 78% F1
   - If not met: iterate few-shot examples, expand word lists before Phase 2

---

## Phase 2: Annotation Pipeline (2-3 weeks)

### Steps

6. **Extend test case schema** in [tests/test-cases/types.ts](tests/test-cases/types.ts):
   - Add: `language`, `source`, `annotatorId`, `confidence`, `metadata`

7. **Create annotation page** — `annotation.html` + `src/annotation/`:
   - Components: `TextInput`, `LabelSelector`, `AnnotationQueue`, `ExportTools`, `ProgressTracker`
   - Session persistence, self-review queue

8. **Create Google Forms integration**:
   - Form: text, label (CLEAN/MILD/TOXIC), language, category
   - `src/scripts/import-forms-data.ts` for CSV parsing + validation

9. **Create export script** — `src/scripts/export-training-data.ts`:
   - JSONL format (OpenAI compatible), 80/20 train/val split

### Annotation Velocity Plan

| Source               | Examples  | Time Estimate       | Notes                                   |
| -------------------- | --------- | ------------------- | --------------------------------------- |
| Solo annotation      | 3,000     | 30-60 hours         | Primary focus: TL/BIS threats, bullying |
| Crowdsourced (Forms) | 1,500     | 10 hours validation | Tagalog community, students             |
| Existing datasets    | 500       | 5 hours curation    | English hate speech datasets            |
| **Total**            | **5,000** | **~50-75 hours**    | 2-3 weeks part-time                     |

---

## Phase 3: Model Fine-Tuning (1-2 weeks)

### Steps

10. **Fine-tune GPT-4o-mini** (accuracy benchmark):
    - `src/scripts/finetune-openai.ts` for API interaction
    - Cost: ~$25-50, update `BackgroundAIService.ts` with custom model ID

11. **Fine-tune local XLM-RoBERTa** (offline capability):
    - Training notebook in [notebooks/](notebooks/)
    - Export ONNX, quantize to ~5-10MB

12. **Add local model infrastructure**:
    - `@xenova/transformers` in [package.json](package.json)
    - `src/lib/ModelCache.ts` (IndexedDB, 100MB limit)
    - [manifest.json](manifest.json): `"unlimitedStorage"`, CDN permissions

13. **Create `LocalModerationModel.ts`**:
    - Lazy-load with progress UI, fallback chain

14. **Set up CDN**:
    - `josan-assets` GitHub repo → jsDelivr
    - Cloudflare R2 for ONNX models

### Thesis Comparison Metrics

15. **Benchmark all approaches** — create comparison table:

| Metric               | Regex-Only | Few-Shot (P1) | Fine-tuned GPT | Local XLM-R |
| -------------------- | ---------- | ------------- | -------------- | ----------- |
| **Accuracy**         | 84.67%     | TBD           | TBD            | TBD         |
| **Precision**        | —          | —             | —              | —           |
| **Recall**           | —          | —             | —              | —           |
| **F1 Score (EN)**    | 98.99%     | —             | —              | —           |
| **F1 Score (TL)**    | 78.16%     | Target: 85%   | Target: 92%    | Target: 88% |
| **F1 Score (BIS)**   | 71.60%     | Target: 78%   | Target: 88%    | Target: 85% |
| **Latency (p50)**    | 0.27ms     | ~1000ms       | ~800ms         | ~50ms       |
| **Latency (p95)**    | —          | —             | —              | —           |
| **Cost/1K requests** | $0         | ~$0.20        | ~$0.15         | $0          |
| **Offline capable**  | ✅         | ❌            | ❌             | ✅          |
| **Model size**       | ~50KB      | N/A           | N/A            | ~10MB       |

---

## Timeline Summary

| Phase       | Duration  | Key Deliverables                                  | Success Criteria        |
| ----------- | --------- | ------------------------------------------------- | ----------------------- |
| **Phase 1** | 1-2 days  | Few-shot, fallback, bis.txt expansion             | TL ≥ 82%, BIS ≥ 78% F1  |
| **Phase 2** | 2-3 weeks | Annotation UI, 5K examples, export pipeline       | 5,000+ labeled examples |
| **Phase 3** | 1-2 weeks | Dual fine-tuned models, CDN infra, thesis metrics | TL ≥ 92%, BIS ≥ 88% F1  |

---

## Implementation Notes

### Few-Shot Examples (Phase 1)

**Tagalog Examples:**

```
Text: "Ang puting ibon ay lumilipad" → CLEAN (puting means white, not profanity)
Text: "Pinatay ko kalaban sa ML" → CLEAN (gaming context)
Text: "Hindi ako bastos pero ang bobo mo" → TOXIC (disguised insult)
Text: "Hahanapin kita at sasaktan kita" → TOXIC (direct threat)
Text: "Walang nagmamahal sayo, kaya mag-isa ka palagi" → TOXIC (bullying/isolation)
```

**Bisaya Examples:**

```
Text: "Ang puti nga baboy naa sa uma" → CLEAN (puti means white)
Text: "Gipatay nako kalaban sa ML" → CLEAN (gaming context)
Text: "Dili ko bastos pero bogo ka" → TOXIC (disguised insult)
Text: "Pangitaon tika ug sakiton tika" → TOXIC (direct threat)
Text: "Walay nagmahal nimo, maoy ra ka kanunay" → TOXIC (bullying/isolation)
```

### Bisaya Word List Expansion Categories

- **Threat verbs**: sakiton, patyon, bugbugon, samaran, ihigot
- **Insults**: buang, bogo, lawog, tanga, gago, yawa
- **Bullying phrases**: walay pulos, walay kwenta, maoy ra, way nahigugma
- **Obfuscated variants**: b0g0, bu4ng, g4g0, y4w4

### Language Fallback Logic

```typescript
// FilterEngine.ts
const FALLBACK_THRESHOLD = 0.5;

if (languageConfidence < FALLBACK_THRESHOLD) {
  // Force run all three word lists
  activeWordLists = [
    wordLists.english,
    wordLists.tagalog,
    wordLists.bisaya,
  ].filter(Boolean);
}
```

### PH Language AI Threshold

```typescript
// BackgroundAIService.ts
const CONFIDENCE_THRESHOLD_EN = 0.3;
const CONFIDENCE_THRESHOLD_PH = 0.05; // Much lower for TL/BIS

const threshold = ["tl", "bis"].includes(language.code)
  ? CONFIDENCE_THRESHOLD_PH
  : CONFIDENCE_THRESHOLD_EN;
```
