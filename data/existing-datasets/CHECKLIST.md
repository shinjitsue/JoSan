# JoSan Dataset Checklist - Avoid Duplication

> **Last Updated**: February 1, 2026  
> **Current Total**: 2,660 annotations (53.2% of 5,000 target)

---

## ✅ ALREADY INCLUDED - DO NOT RE-DOWNLOAD

### 1. syke9p3/multilabel-tagalog-hate-speech

- ✅ **Status**: DOWNLOADED & INCLUDED
- **Count**: 1,260 examples
- **Type**: TOXIC (multilabel hate speech)
- **Language**: Tagalog
- **Categories**: Age, Gender, Physical, Race, Religion, Others
- **Date Added**: Feb 1, 2026
- **File**: `combined_annotations.json` (IDs: `existing-syke9p3-0` to `existing-syke9p3-1259`)

### 2. jfernandez/cebuano-filipino-sentences

- ✅ **Status**: DOWNLOADED & INCLUDED
- **Count**: 1,400 examples (700 Tagalog + 700 Bisaya)
- **Type**: CLEAN (general sentences)
- **Languages**: Tagalog & Bisaya
- **Date Added**: Feb 1, 2026
- **File**: `combined_annotations.json` (IDs: `existing-jfernandez-*`)

---

## ⏳ AVAILABLE - NOT YET DOWNLOADED

### 3. jcblaise/hatespeech_filipino

- ⏳ **Status**: PENDING
- **Priority**: 🔴 **HIGH** (Should download next)
- **Est. Size**: ~18,500 examples (10k train + 4.2k val + 4.2k test)
- **Type**: TOXIC (binary hate speech)
- **Language**: Tagalog
- **Why**: Largest Filipino hate speech dataset; adds diversity to toxic examples
- **Download**:
  ```bash
  pip install datasets
  npx tsx src/scripts/download-jcblaise-hatespeech.ts
  ```

### 4. Jigsaw Toxic Comment Classification (HuggingFace 50k)

- ⏳ **Status**: PENDING
- **Priority**: 🟡 MEDIUM (Optional for cross-lingual training)
- **Est. Size**: ~50,000 examples
- **Type**: TOXIC (multi-class)
- **Language**: English
- **Why**: Transfer learning for toxicity patterns
- **HuggingFace**: `mteb/toxic_conversations_50k`

### 5. Jession01/English-Cebuano-Translation

- ⏳ **Status**: PENDING
- **Priority**: 🟢 LOW (Use sparingly)
- **Est. Size**: ~103,000 translation pairs
- **Type**: CLEAN
- **Language**: Bisaya/Cebuano
- **Why**: More clean Bisaya examples (already have 700)

---

## ❌ NOT SUITABLE - SKIP THESE

### Dengue Dataset (Cruz et al.)

- ❌ **Status**: SKIP
- **Reason**: Domain-specific (health); not relevant for general toxicity detection

### Filipino-Text-Benchmarks (other datasets)

- ❌ **Status**: SKIP
- **Reason**: Task-specific (sentiment, NER); not toxicity-focused

### Jigsaw Toxic (Full Kaggle - 160k)

- ❌ **Status**: SKIP (use HF 50k version instead)
- **Reason**: Too large; redundant with HF version

---

## 📊 Current Dataset Breakdown

| Category  | Count | Percentage | Target | Status                 |
| --------- | ----- | ---------- | ------ | ---------------------- |
| **Total** | 2,660 | 53.2%      | 5,000  | 🟡 In Progress         |
| Toxic     | 1,260 | 47.4%      | 2,500  | 🟡 Need 1,240 more     |
| Clean     | 1,400 | 52.6%      | 2,500  | 🟡 Need 1,100 more     |
| Tagalog   | 1,960 | 73.7%      | 2,500  | 🟡 Need 540 more       |
| Bisaya    | 700   | 26.3%      | 2,500  | 🔴 **Need 1,800 more** |

### Critical Gaps:

1. **🔴 URGENT**: Only 700 Bisaya examples (all clean) - **NEED 1,800 more, including toxic examples**
2. **🟡 MODERATE**: 1,260 toxic examples - need 1,240 more for balance
3. **✅ GOOD**: 1,400 clean examples - decent foundation

---

## 🎯 Recommended Next Steps

### Phase 1: Download jcblaise Dataset (Priority 1)

```bash
# This will add ~18,500 toxic Tagalog examples
cd src/scripts
# TODO: Create download-jcblaise-hatespeech.ts
npx tsx download-jcblaise-hatespeech.ts
```

### Phase 2: Focus on Bisaya Toxic Examples (Priority 2)

**Options**:

1. **Manual annotation** using JoSan Annotation Tool
2. **Translate** toxic Tagalog → Bisaya using GPT-4 or manual translation
3. **Google Forms** survey with Bisaya speakers
4. **Social media scraping** (with proper anonymization)

**Target**: 1,000-1,500 toxic Bisaya examples

### Phase 3: Balance Dataset (Priority 3)

- Ensure 50/50 split: toxic vs clean
- Ensure 50/50 split: Tagalog vs Bisaya
- Target: 5,000 total (2,500 toxic, 2,500 clean, 2,500 TL, 2,500 BIS)

---

## 🔍 How to Check Before Downloading

### Method 1: Check Annotation Tool

1. Open http://localhost:5174/annotation.html
2. Click "🚀 Load Existing Dataset (2,660)" button
3. Check "By Source" section → should show "Existing Dataset: 2660"

### Method 2: Inspect JSON File

```bash
# PowerShell
$data = Get-Content "data\existing-datasets\combined_annotations.json" | ConvertFrom-Json
$sources = $data | ForEach-Object { $_.metadata.originalDataset } | Select-Object -Unique
Write-Host "Already included:" $sources
```

### Method 3: Check This File

- Always refer to this `CHECKLIST.md` before downloading
- Update this file after adding new datasets

---

## 📝 Update Checklist After Adding Dataset

When you add a new dataset:

1. ✅ Move from "⏳ AVAILABLE" → "✅ ALREADY INCLUDED"
2. ✅ Update counts in "Current Dataset Breakdown"
3. ✅ Update "Last Updated" date
4. ✅ Add file location and ID range
5. ✅ Commit changes to Git

---

## 🔗 Useful Links

- **EXISTING_DATASETS.md**: Full documentation in `docs/EXISTING_DATASETS.md`
- **Annotation Tool**: http://localhost:5174/annotation.html
- **HuggingFace Datasets**: https://huggingface.co/datasets
- **Download Script**: `src/scripts/download-existing-datasets.ts`
