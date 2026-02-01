# Existing Datasets for JoSan Training

This document lists existing datasets suitable for training the JoSan content moderation model, specifically for **Tagalog** and **Bisaya** languages.

---

## 📋 CURRENT STATUS CHECKLIST

> **Last Updated**: February 1, 2026  
> **Total Annotations Loaded**: 12,251

### ✅ Already Downloaded & Included (DO NOT re-download)

| Dataset                                    | Status          | Count | Type  | Language          | File Location                                      |
| ------------------------------------------ | --------------- | ----- | ----- | ----------------- | -------------------------------------------------- |
| **syke9p3/multilabel-tagalog-hate-speech** | ✅ **INCLUDED** | 1,260 | TOXIC | Tagalog           | `data/existing-datasets/combined_annotations.json` |
| **jcblaise/hatespeech_filipino**           | ✅ **INCLUDED** | 8,410 | TOXIC | Tagalog           | `data/existing-datasets/combined_annotations.json` |
| **jfernandez/cebuano-filipino-sentences**  | ✅ **INCLUDED** | 1,400 | CLEAN | TL/BIS (700 each) | `data/existing-datasets/combined_annotations.json` |
| **Translated Bisaya Toxic**                | ✅ **INCLUDED** | 1,181 | TOXIC | Bisaya            | `data/existing-datasets/combined_annotations.json` |

**Breakdown**:

- ✅ Tagalog Toxic: **9,670** (1,260 from syke9p3 + 8,410 from jcblaise)
- ✅ Tagalog Clean: **700** (from jfernandez)
- ✅ Bisaya Toxic: **1,181** (translated from Tagalog)
- ✅ Bisaya Clean: **700** (from jfernandez)
- ✅ **Total: 12,251 annotations** (245% of 5,000 target! 🎉)

### ⏳ Available But Not Yet Included

| Dataset                                   | Status         | Est. Size | Type  | Language | Priority | Notes                                                    |
| ----------------------------------------- | -------------- | --------- | ----- | -------- | -------- | -------------------------------------------------------- |
| **Jigsaw Toxic Comment** (HF)             | ⏳ **PENDING** | ~50,000   | TOXIC | English  | 🟢 LOW   | Cross-lingual training; filter for transferable patterns |
| **Jession01/English-Cebuano-Translation** | ⏳ **PENDING** | ~103,000  | CLEAN | BIS      | 🟢 LOW   | Use sparingly; focus on diverse Bisaya examples          |

### ❌ Completed / No Longer Needed

| Dataset                          | Status          | Notes                                       |
| -------------------------------- | --------------- | ------------------------------------------- |
| **jcblaise/hatespeech_filipino** | ✅ **INCLUDED** | Downloaded and processed - 8,410 examples   |
| Dengue Dataset (Cruz et al.)     | ❌ Skip         | Domain-specific (health); not relevant      |
| Jigsaw (Full 160k)               | ❌ Skip         | Too large; English-only; use HF 50k version |

---

---

## 🚀 Quick Action Guide

### Before Downloading Any New Dataset:

1. ✅ **Check this checklist** - Is it already marked as "INCLUDED"?
2. ✅ **Verify in annotation tool** - Load http://localhost:5174/annotation.html and check "By Source" stats
3. ✅ **Check file** - Look in `data/existing-datasets/combined_annotations.json` for `originalDataset` field

### How to Identify Duplicates:

```bash
# Check what's already in the dataset
npx tsx -e "
const data = require('./data/existing-datasets/combined_annotations.json');
const sources = [...new Set(data.map(d => d.metadata.translatedFrom ? 'translated-from-' + d.metadata.translatedFrom : d.metadata.originalDataset))];
console.log('Already included datasets:', sources);
"
```

Expected output:

```
Already included datasets: [
  'syke9p3/multilabel-tagalog-hate-speech',
  'jcblaise/hatespeech_filipino',
  'jfernandez/cebuano-filipino-sentences',
  'translated-from-tl'
]
```

### Next Steps (Recommended Priority):

1. **� MEDIUM**: Review **Bisaya translated examples** for quality
   - Run: `python data/existing-datasets/review_translations.py`
   - Use annotation tool to spot-check translations
   - Fix any obvious errors in the translations
2. **🟡 MEDIUM**: Add more **clean examples** to balance the dataset
   - Current ratio: 10,851 toxic vs 1,400 clean (very imbalanced!)
   - Consider adding more clean examples from jfernandez or manual curation
3. **🟢 LOW**: Consider English datasets (Jigsaw) only if needed for cross-lingual patterns

### Translation Scripts Available:

```bash
# Translate Tagalog toxic examples to Bisaya (word mapping)
npx tsx src/scripts/translate-tagalog-to-bisaya.ts

# Translate with API (slower but better quality, rate limited)
npx tsx src/scripts/translate-tagalog-to-bisaya.ts --use-api

# Translate with limit
npx tsx src/scripts/translate-tagalog-to-bisaya.ts --limit=100

# Merge translations into main dataset
npx tsx src/scripts/merge-bisaya-translations.ts
```

---

## 🎯 Recommended Datasets (Primary)

### 1. Multilabel Tagalog Hate Speech Dataset ⭐ BEST MATCH

- **Source**: [syke9p3/multilabel-tagalog-hate-speech](https://huggingface.co/datasets/syke9p3/multilabel-tagalog-hate-speech)
- **Size**: ~2,100 examples
- **Labels**: Multilabel hate speech classification (hate, offensive, profane, etc.)
- **Language**: Tagalog
- **Format**: CSV
- **License**: Public
- **Why Perfect**: Native Tagalog, multilabel toxicity classification, directly applicable to JoSan's filtering needs

**Download**:

```bash
# Using datasets library
pip install datasets
python -c "from datasets import load_dataset; ds = load_dataset('syke9p3/multilabel-tagalog-hate-speech'); ds.to_csv('tagalog_hatespeech.csv')"
```

### 2. Filipino Hate Speech Dataset (jcblaise)

- **Source**: [jcblaise/hatespeech_filipino](https://huggingface.co/datasets/jcblaise/hatespeech_filipino)
- **Size**: ~10,000 training, 4,232 validation, 4,232 testing
- **Labels**: Binary (hate speech / non-hate speech)
- **Language**: Filipino/Tagalog
- **Format**: CSV
- **License**: Apache 2.0
- **Why Good**: Large size, academic quality, collected during 2016 PH elections

**Download**:

```bash
wget https://s3.us-east-2.amazonaws.com/blaisecruz.com/datasets/hatenonhate/hatespeech_raw.zip
unzip hatespeech_raw.zip
```

---

## 📚 Supplementary Datasets

### 3. Jigsaw Toxic Comment Classification

- **Source**: [Kaggle](https://www.kaggle.com/datasets/julian3833/jigsaw-toxic-comment-classification-challenge) / [HuggingFace](https://huggingface.co/datasets/mteb/toxic_conversations_50k)
- **Size**: ~160,000 (train) + 50,000 (HF version)
- **Labels**: Multi-class (toxic, severe_toxic, obscene, threat, insult, identity_hate)
- **Language**: English (but useful for training general toxicity patterns)
- **Format**: CSV
- **License**: CC0: Public Domain

**Why Useful**: Even though English, can help model learn toxicity patterns that transfer to Filipino contexts.

### 4. Dengue Dataset (Cruz et al.)

- **Source**: [Filipino-Text-Benchmarks](https://github.com/jcblaisecruz02/Filipino-Text-Benchmarks)
- **Size**: 4,015 training, 500 validation, 500 testing
- **Labels**: 5-class multiclass
- **Language**: Filipino/Tagalog
- **Why Useful**: Provides clean Tagalog text examples (non-toxic) for balanced training

**Download**:

```bash
wget https://s3.us-east-2.amazonaws.com/blaisecruz.com/datasets/dengue/dengue_raw.zip
```

---

## 🇵🇭 Bisaya/Cebuano Datasets (Limited)

Unfortunately, there are **no dedicated Bisaya hate speech/toxicity datasets** currently available. Options:

### Available Bisaya Resources:

1. **Cebuano-Filipino Sentences** ([jfernandez/cebuano-filipino-sentences](https://huggingface.co/datasets/jfernandez/cebuano-filipino-sentences))
   - 105k parallel sentences
   - Useful for language understanding, NOT toxicity

2. **English-Cebuano Translation** ([Jession01/English-Cebuano-Translation](https://huggingface.co/datasets/Jession01/English-Cebuano-Translation))
   - 103k translation pairs
   - Useful for general Cebuano text understanding

### Recommended Approach for Bisaya:

1. **Manual annotation** using the JoSan Annotation Tool (Phase 2)
2. **Translate** toxic examples from Tagalog/English to Bisaya
3. **Google Forms** data collection from native Bisaya speakers
4. Use **language similarity** - Tagalog/Bisaya share many profanity terms

---

## 📊 Dataset Summary Table

| Dataset                                | Language | Size  | Labels               | Best For                |
| -------------------------------------- | -------- | ----- | -------------------- | ----------------------- |
| syke9p3/multilabel-tagalog-hate-speech | Tagalog  | 2.1k  | Multilabel toxicity  | **PRIMARY TL TRAINING** |
| jcblaise/hatespeech_filipino           | Filipino | 18k+  | Binary hate/non-hate | **TL VALIDATION**       |
| Jigsaw Toxic Comments                  | English  | 160k+ | 6-class toxicity     | Pattern learning        |
| Dengue Dataset                         | Filipino | 5k    | General text         | Clean examples          |

---

## 🔧 Integration with JoSan Annotation Tool

The datasets above can be imported into the JoSan Annotation Tool:

### Convert to JoSan Format

```python
import pandas as pd
import json
from datetime import datetime

def convert_tagalog_hatespeech_to_josan(input_csv: str, output_json: str):
    """
    Convert syke9p3/multilabel-tagalog-hate-speech to JoSan annotation format.
    """
    df = pd.read_csv(input_csv)

    annotations = []
    for idx, row in df.iterrows():
        # Map labels: assume columns like 'hate', 'offensive', 'profane'
        label = 'clean'
        if row.get('hate', 0) == 1 or row.get('offensive', 0) == 1:
            label = 'toxic'
        elif row.get('profane', 0) == 1:
            label = 'mild'

        annotation = {
            'id': f'existing-{idx}',
            'text': row['text'],
            'label': label,
            'language': 'tl',
            'category': 'general',
            'confidence': 0.95,
            'annotatorId': 'existing-dataset-import',
            'source': 'existing-dataset',
            'createdAt': datetime.now().isoformat(),
            'metadata': {
                'originalDataset': 'syke9p3/multilabel-tagalog-hate-speech',
                'originalLabels': {col: int(row.get(col, 0)) for col in ['hate', 'offensive', 'profane']}
            }
        }
        annotations.append(annotation)

    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(annotations, f, ensure_ascii=False, indent=2)

    print(f"Converted {len(annotations)} annotations to {output_json}")

# Usage:
# convert_tagalog_hatespeech_to_josan('tagalog_hatespeech.csv', 'imported_annotations.json')
```

---

## 📈 Estimated Training Data Distribution

Current dataset (after all imports and translations):

| Source                     | TL Examples | BIS Examples | EN Examples |
| -------------------------- | ----------- | ------------ | ----------- |
| syke9p3 dataset (toxic)    | 1,260       | 0            | 0           |
| jcblaise dataset (toxic)   | 8,410       | 0            | 0           |
| jfernandez dataset (clean) | 700         | 700          | 0           |
| Translated from TL (toxic) | 0           | 1,181        | 0           |
| **Current Total**          | **10,370**  | **1,881**    | **0**       |

### Dataset Balance Analysis:

| Metric         | Tagalog | Bisaya  | Total   |
| -------------- | ------- | ------- | ------- |
| Toxic examples | 9,670   | 1,181   | 10,851  |
| Clean examples | 700     | 700     | 1,400   |
| **Total**      | 10,370  | 1,881   | 12,251  |
| Toxic/Clean %  | 93%/7%  | 63%/37% | 89%/11% |

**Note**: The dataset is heavily skewed towards toxic examples. For better model training, consider adding more clean examples.

This far exceeds the Phase 2 target of 5,000 examples! 🎉

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
pip install datasets pandas

# 2. Download primary dataset
python -c "
from datasets import load_dataset
ds = load_dataset('syke9p3/multilabel-tagalog-hate-speech')
ds['train'].to_csv('data/tagalog_hatespeech_train.csv', index=False)
"

# 3. Run conversion script
npx tsx src/scripts/convert-existing-datasets.ts

# 4. Import into annotation tool for review
# Open annotation.html → Import JSON/CSV
```

---

## References

1. Cruz, J.C.B., & Cheng, C. (2020). "Establishing Baselines for Text Classification in Low-Resource Languages" [arXiv:2005.02068](https://arxiv.org/abs/2005.02068)
2. Cruz, J.C.B., et al. (2020). "Investigating the True Performance of Transformers in Low-Resource Languages" [arXiv:2010.11574](https://arxiv.org/abs/2010.11574)
3. Cabasag, N.J.A., et al. (2019). "Hate Speech in Philippine Election-Related Tweets"
