# Existing Datasets for JoSan Training

This document lists existing datasets suitable for training the JoSan content moderation model, specifically for **Tagalog** and **Bisaya** languages.

---

## 📋 CURRENT STATUS CHECKLIST

> **Last Updated**: February 1, 2026  
> **Total Annotations Loaded**: 2,660

### ✅ Already Downloaded & Included (DO NOT re-download)

| Dataset                                    | Status          | Count | Type  | Language          | File Location                                      |
| ------------------------------------------ | --------------- | ----- | ----- | ----------------- | -------------------------------------------------- |
| **syke9p3/multilabel-tagalog-hate-speech** | ✅ **INCLUDED** | 1,260 | TOXIC | Tagalog           | `data/existing-datasets/combined_annotations.json` |
| **jfernandez/cebuano-filipino-sentences**  | ✅ **INCLUDED** | 1,400 | CLEAN | TL/BIS (700 each) | `data/existing-datasets/combined_annotations.json` |

**Breakdown**:

- ✅ Toxic examples: **1,260** (all Tagalog from syke9p3)
- ✅ Clean examples: **1,400** (700 Tagalog + 700 Bisaya from jfernandez)
- ✅ **Total: 2,660 annotations** (53.2% of 5,000 target)

### ⏳ Available But Not Yet Included

| Dataset                                   | Status         | Est. Size | Type  | Language | Priority    | Notes                                                             |
| ----------------------------------------- | -------------- | --------- | ----- | -------- | ----------- | ----------------------------------------------------------------- |
| **jcblaise/hatespeech_filipino**          | ⏳ **PENDING** | ~18,500   | TOXIC | Tagalog  | 🔴 **HIGH** | Largest Filipino hate speech dataset; use for more toxic examples |
| **Jigsaw Toxic Comment** (HF)             | ⏳ **PENDING** | ~50,000   | TOXIC | English  | 🟡 MEDIUM   | Cross-lingual training; filter for transferable patterns          |
| **Jession01/English-Cebuano-Translation** | ⏳ **PENDING** | ~103,000  | CLEAN | BIS      | 🟢 LOW      | Use sparingly; focus on diverse Bisaya examples                   |

### ❌ Not Suitable / Skip

| Dataset                      | Reason                                                      |
| ---------------------------- | ----------------------------------------------------------- |
| Dengue Dataset (Cruz et al.) | Domain-specific (health); not relevant for general toxicity |
| Jigsaw (Full 160k)           | Too large; English-only; use HF 50k version if needed       |

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
const sources = [...new Set(data.map(d => d.metadata.originalDataset))];
console.log('Already included datasets:', sources);
"
```

Expected output:

```
Already included datasets: [
  'syke9p3/multilabel-tagalog-hate-speech',
  'jfernandez/cebuano-filipino-sentences'
]
```

### Next Steps (Recommended Priority):

1. **🔴 HIGH PRIORITY**: Download `jcblaise/hatespeech_filipino` (~18.5k examples)
   - Will add **more diverse toxic Tagalog examples**
   - Balances the dataset (currently 1,260 toxic vs 1,400 clean)
2. **🟡 MEDIUM**: Manually annotate **more Bisaya toxic examples** using annotation tool
   - Currently only have 700 clean Bisaya, **zero toxic Bisaya**
   - Target: 1,000-1,500 toxic Bisaya examples

3. **🟢 LOW**: Consider English datasets (Jigsaw) only if needed for cross-lingual patterns

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

After importing existing datasets + manual annotation:

| Source            | TL Examples | BIS Examples | EN Examples |
| ----------------- | ----------- | ------------ | ----------- |
| syke9p3 dataset   | ~2,100      | 0            | 0           |
| jcblaise dataset  | ~10,000     | 0            | 0           |
| Manual annotation | ~500        | ~1,000       | ~200        |
| Google Forms      | ~300        | ~500         | ~100        |
| **Total**         | **~12,900** | **~1,500**   | **~300**    |

This exceeds the Phase 2 target of 5,000 examples!

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
