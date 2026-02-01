"""
Process jcblaise/hatespeech_filipino dataset and convert to JoSan format.

This script:
1. Reads the train/test/valid CSV files
2. Filters for hate speech examples (label=1)
3. Converts to JoSan annotation format
4. Merges with existing combined_annotations.json
"""

import pandas as pd
import json
import os
from datetime import datetime

# Paths
DATA_DIR = "data/existing-datasets/data/existing-datasets/hatespeech"
OUTPUT_DIR = "data/existing-datasets"

def load_jcblaise_data():
    """Load all jcblaise CSV files."""
    dfs = []
    for split in ["train", "test", "valid"]:
        path = os.path.join(DATA_DIR, f"{split}.csv")
        if os.path.exists(path):
            try:
                df = pd.read_csv(path, engine="python", on_bad_lines="skip")
                df["split"] = split
                dfs.append(df)
                print(f"  {split}: {len(df)} rows")
            except Exception as e:
                print(f"  {split}: Error - {e}")
    
    return pd.concat(dfs, ignore_index=True) if dfs else None


def convert_to_josan_format(df, only_toxic=True):
    """Convert jcblaise dataframe to JoSan annotation format."""
    annotations = []
    
    # Filter for toxic examples if requested
    if only_toxic:
        df = df[df["label"] == 1]
        print(f"  Filtered to {len(df)} toxic examples")
    
    for idx, row in df.iterrows():
        text = str(row.get("text", "")).strip()
        
        # Skip empty or invalid texts
        if not text or text == "nan" or len(text) < 5:
            continue
        
        # Skip texts that are too long (likely corrupted)
        if len(text) > 1000:
            continue
        
        # Map label: 1 = hate speech = toxic, 0 = non-hate = clean
        label = "toxic" if row.get("label", 0) == 1 else "clean"
        
        annotation = {
            "id": f"existing-jcblaise-{idx}",
            "text": text,
            "label": label,
            "language": "tl",  # Filipino/Tagalog
            "category": "general",  # jcblaise doesn't have subcategories
            "source": "existing-dataset",
            "annotatorId": "existing-dataset-import",
            "confidence": 0.90,  # Slightly lower confidence as it's binary classification
            "metadata": {
                "createdAt": datetime.now().isoformat(),
                "originalDataset": "jcblaise/hatespeech_filipino",
                "originalLabels": {"label": int(row.get("label", 0))},
                "split": row.get("split", "unknown"),
            },
        }
        annotations.append(annotation)
    
    return annotations


def merge_with_existing(new_annotations, existing_path):
    """Merge new annotations with existing, avoiding duplicates."""
    
    # Load existing
    if os.path.exists(existing_path):
        with open(existing_path, "r", encoding="utf-8") as f:
            existing = json.load(f)
        print(f"  Existing annotations: {len(existing)}")
    else:
        existing = []
        print("  No existing annotations found")
    
    # Create set of existing texts for deduplication
    existing_texts = {a["text"].lower().strip() for a in existing}
    
    # Filter new annotations to avoid duplicates
    unique_new = []
    duplicates = 0
    for ann in new_annotations:
        if ann["text"].lower().strip() not in existing_texts:
            unique_new.append(ann)
            existing_texts.add(ann["text"].lower().strip())
        else:
            duplicates += 1
    
    print(f"  New unique annotations: {len(unique_new)}")
    print(f"  Duplicates skipped: {duplicates}")
    
    # Merge
    merged = existing + unique_new
    
    return merged


def main():
    print("=" * 60)
    print("Process jcblaise/hatespeech_filipino Dataset")
    print("=" * 60)
    
    # Step 1: Load data
    print("\n1. Loading jcblaise data...")
    df = load_jcblaise_data()
    if df is None:
        print("  ❌ Failed to load data")
        return
    
    print(f"  Total loaded: {len(df)}")
    print(f"  Label distribution: {df['label'].value_counts().to_dict()}")
    
    # Step 2: Convert to JoSan format (only toxic examples)
    print("\n2. Converting to JoSan format...")
    annotations = convert_to_josan_format(df, only_toxic=True)
    print(f"  Converted: {len(annotations)} annotations")
    
    # Step 3: Save intermediate file
    print("\n3. Saving jcblaise annotations...")
    jcblaise_path = os.path.join(OUTPUT_DIR, "jcblaise_toxic.json")
    with open(jcblaise_path, "w", encoding="utf-8") as f:
        json.dump(annotations, f, ensure_ascii=False, indent=2)
    print(f"  Saved to: {jcblaise_path}")
    
    # Step 4: Merge with existing
    print("\n4. Merging with existing annotations...")
    combined_path = os.path.join(OUTPUT_DIR, "combined_annotations.json")
    
    # Create backup
    backup_path = os.path.join(OUTPUT_DIR, f"combined_annotations_backup_{int(datetime.now().timestamp())}.json")
    if os.path.exists(combined_path):
        with open(combined_path, "r", encoding="utf-8") as f:
            backup_data = json.load(f)
        with open(backup_path, "w", encoding="utf-8") as f:
            json.dump(backup_data, f, ensure_ascii=False, indent=2)
        print(f"  Backup saved to: {os.path.basename(backup_path)}")
    
    merged = merge_with_existing(annotations, combined_path)
    
    # Save merged
    with open(combined_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    print(f"  Merged annotations saved: {len(merged)}")
    
    # Step 5: Update training JSONL
    print("\n5. Updating training JSONL...")
    jsonl_path = os.path.join(OUTPUT_DIR, "combined_training.jsonl")
    with open(jsonl_path, "w", encoding="utf-8") as f:
        for ann in merged:
            line = json.dumps({
                "text": ann["text"],
                "label": ann["label"],
                "language": ann["language"],
                "category": ann["category"],
            }, ensure_ascii=False)
            f.write(line + "\n")
    print(f"  Updated: {jsonl_path}")
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    # Count by language and label
    by_lang = {}
    by_source = {}
    for ann in merged:
        lang = ann["language"]
        label = ann["label"]
        source = ann["metadata"].get("originalDataset", ann.get("source", "unknown"))
        if ann["metadata"].get("translatedFrom"):
            source = f"translated-from-{ann['metadata']['translatedFrom']}"
        
        if lang not in by_lang:
            by_lang[lang] = {"total": 0, "toxic": 0, "clean": 0, "mild": 0}
        by_lang[lang]["total"] += 1
        by_lang[lang][label] += 1
        
        by_source[source] = by_source.get(source, 0) + 1
    
    print("\nBy Language:")
    for lang, counts in by_lang.items():
        lang_name = {"tl": "Tagalog", "bis": "Bisaya", "en": "English"}.get(lang, lang)
        print(f"  {lang_name}: {counts}")
    
    print("\nBy Source:")
    for source, count in sorted(by_source.items(), key=lambda x: -x[1]):
        print(f"  {source}: {count}")
    
    print(f"\n✅ Total annotations: {len(merged)}")


if __name__ == "__main__":
    main()
