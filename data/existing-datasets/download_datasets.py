
import os
import json
from datetime import datetime

try:
    from datasets import load_dataset
    import pandas as pd
except ImportError:
    print("Installing required packages...")
    os.system("pip install datasets pandas")
    from datasets import load_dataset
    import pandas as pd

OUTPUT_DIR = "./data/existing-datasets"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def download_tagalog_hatespeech():
    """Download syke9p3/multilabel-tagalog-hate-speech dataset"""
    print("\n📥 Downloading syke9p3/multilabel-tagalog-hate-speech...")
    try:
        ds = load_dataset("syke9p3/multilabel-tagalog-hate-speech")
        df = ds['train'].to_pandas()
        df.to_csv(f"{OUTPUT_DIR}/tagalog_hatespeech_raw.csv", index=False)
        print(f"   ✅ Downloaded {len(df)} examples")
        return df
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return None

def download_jcblaise_hatespeech():
    """Download jcblaise/hatespeech_filipino dataset"""
    print("\n📥 Downloading jcblaise/hatespeech_filipino...")
    try:
        ds = load_dataset("jcblaise/hatespeech_filipino")
        
        annotations = []
        for split in ['train', 'validation', 'test']:
            if split in ds:
                split_df = ds[split].to_pandas()
                split_df['split'] = split
                annotations.append(split_df)
        
        df = pd.concat(annotations, ignore_index=True)
        df.to_csv(f"{OUTPUT_DIR}/jcblaise_hatespeech_raw.csv", index=False)
        print(f"   ✅ Downloaded {len(df)} examples")
        return df
    except Exception as e:
        print(f"   ❌ Error: {e}")
        # Try alternative download
        try:
            import urllib.request
            url = "https://s3.us-east-2.amazonaws.com/blaisecruz.com/datasets/hatenonhate/hatespeech_raw.zip"
            print("   Trying alternative URL...")
            urllib.request.urlretrieve(url, f"{OUTPUT_DIR}/hatespeech_raw.zip")
            os.system(f"cd {OUTPUT_DIR} && unzip -o hatespeech_raw.zip")
            print("   ✅ Downloaded via alternative URL")
        except Exception as e2:
            print(f"   ❌ Alternative also failed: {e2}")
        return None

def convert_to_josan_format(df, dataset_name, label_mapping_fn):
    """Convert dataframe to JoSan annotation format"""
    annotations = []
    
    for idx, row in df.iterrows():
        text = str(row.get('text', row.get('Text', row.get('tweet', ''))))
        if not text or text == 'nan':
            continue
        
        label = label_mapping_fn(row)
        
        annotation = {
            'id': f'existing-{dataset_name}-{idx}',
            'text': text,
            'label': label,
            'language': 'tl',  # Filipino/Tagalog
            'category': 'general',
            'confidence': 0.95,
            'annotatorId': 'existing-dataset-import',
            'source': 'existing-dataset',
            'createdAt': datetime.now().isoformat(),
            'metadata': {
                'originalDataset': dataset_name,
                'originalRow': dict(row)
            }
        }
        annotations.append(annotation)
    
    return annotations

def map_syke9p3_labels(row):
    """Map syke9p3 multilabel to JoSan labels"""
    # Check for hate-related columns
    hate_cols = ['hate', 'Hate', 'hate_speech', 'hate-speech']
    offensive_cols = ['offensive', 'Offensive']
    profane_cols = ['profane', 'Profane', 'profanity']
    
    is_hate = any(row.get(col, 0) == 1 for col in hate_cols if col in row.index)
    is_offensive = any(row.get(col, 0) == 1 for col in offensive_cols if col in row.index)
    is_profane = any(row.get(col, 0) == 1 for col in profane_cols if col in row.index)
    
    # Try label column
    if 'label' in row.index:
        label_val = str(row['label']).lower()
        if 'hate' in label_val or 'toxic' in label_val:
            return 'toxic'
        elif 'offensive' in label_val or 'profane' in label_val:
            return 'mild'
    
    if is_hate or is_offensive:
        return 'toxic'
    elif is_profane:
        return 'mild'
    return 'clean'

def map_jcblaise_labels(row):
    """Map jcblaise binary labels to JoSan labels"""
    label = row.get('label', row.get('Label', 0))
    if isinstance(label, str):
        label = 1 if label.lower() in ['hate', 'hatespeech', 'hate_speech', '1'] else 0
    return 'toxic' if label == 1 else 'clean'

def main():
    all_annotations = []
    
    # Download and convert syke9p3 dataset
    df1 = download_tagalog_hatespeech()
    if df1 is not None:
        annotations1 = convert_to_josan_format(df1, 'syke9p3', map_syke9p3_labels)
        all_annotations.extend(annotations1)
        print(f"   Converted {len(annotations1)} annotations")
    
    # Download and convert jcblaise dataset
    df2 = download_jcblaise_hatespeech()
    if df2 is not None:
        annotations2 = convert_to_josan_format(df2, 'jcblaise', map_jcblaise_labels)
        all_annotations.extend(annotations2)
        print(f"   Converted {len(annotations2)} annotations")
    
    # Save combined annotations
    if all_annotations:
        output_path = f"{OUTPUT_DIR}/combined_annotations.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(all_annotations, f, ensure_ascii=False, indent=2)
        
        # Print statistics
        labels = [a['label'] for a in all_annotations]
        print(f"\n✅ Saved {len(all_annotations)} annotations to {output_path}")
        print(f"   - Clean: {labels.count('clean')}")
        print(f"   - Mild: {labels.count('mild')}")
        print(f"   - Toxic: {labels.count('toxic')}")
        
        # Also create JSONL for direct training
        jsonl_path = f"{OUTPUT_DIR}/combined_training.jsonl"
        with open(jsonl_path, 'w', encoding='utf-8') as f:
            for ann in all_annotations:
                training_example = {
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a content moderation assistant for Filipino social media. Classify text as: CLEAN (safe content), MILD (minor profanity but not harmful), or TOXIC (hate speech, severe profanity, threats). Consider context and intent."
                        },
                        {
                            "role": "user", 
                            "content": f"Classify this text ({ann['language'].upper()}): \"{ann['text']}\""
                        },
                        {
                            "role": "assistant",
                            "content": ann['label'].upper()
                        }
                    ]
                }
                f.write(json.dumps(training_example, ensure_ascii=False) + '\n')
        print(f"   Created training JSONL: {jsonl_path}")
    else:
        print("\n❌ No annotations were created")

if __name__ == "__main__":
    main()
