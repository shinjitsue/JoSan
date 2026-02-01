"""
Fix dataset conversion with correct label mapping for syke9p3 dataset.
"""
import pandas as pd
import json
from datetime import datetime
from collections import Counter

df = pd.read_csv('./data/existing-datasets/tagalog_hatespeech_raw.csv')
print(f'Total rows: {len(df)}')

# Label columns for hate speech categories
hate_cols = ['Age', 'Gender', 'Physical', 'Race', 'Religion', 'Others']

annotations = []
for idx, row in df.iterrows():
    text = str(row['Text']).strip()
    if not text or text == 'nan':
        continue
    
    # Check if any hate label is 1
    is_hate = any(row.get(col, 0) == 1 for col in hate_cols)
    label = 'toxic' if is_hate else 'clean'
    
    # Determine category based on which column is flagged
    categories = [col.lower() for col in hate_cols if row.get(col, 0) == 1]
    category = categories[0] if categories else 'general'
    
    annotation = {
        'id': f'existing-syke9p3-{idx}',
        'text': text,
        'label': label,
        'language': 'tl',
        'category': category,
        'confidence': 0.95,
        'annotatorId': 'existing-dataset-import',
        'source': 'existing-dataset',
        'createdAt': datetime.now().isoformat(),
        'metadata': {
            'originalDataset': 'syke9p3/multilabel-tagalog-hate-speech',
            'originalLabels': {col: int(row.get(col, 0)) for col in hate_cols}
        }
    }
    annotations.append(annotation)

# Save JSON
output_path = './data/existing-datasets/combined_annotations.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(annotations, f, ensure_ascii=False, indent=2)

# Create JSONL for training
jsonl_path = './data/existing-datasets/combined_training.jsonl'
with open(jsonl_path, 'w', encoding='utf-8') as f:
    for ann in annotations:
        training_example = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a content moderation assistant for Filipino social media. Classify text as: CLEAN (safe content), MILD (minor profanity but not harmful), or TOXIC (hate speech, severe profanity, threats). Consider context and intent."
                },
                {
                    "role": "user", 
                    "content": f"Classify this text (TL): \"{ann['text']}\""
                },
                {
                    "role": "assistant",
                    "content": ann['label'].upper()
                }
            ]
        }
        f.write(json.dumps(training_example, ensure_ascii=False) + '\n')

# Stats
labels = [a['label'] for a in annotations]
print(f'\nSaved {len(annotations)} annotations to {output_path}')
print(f'  - Clean: {labels.count("clean")}')
print(f'  - Toxic: {labels.count("toxic")}')
print(f'\nCategory breakdown:')
cats = Counter(a['category'] for a in annotations)
for cat, count in cats.most_common():
    print(f'  - {cat}: {count}')

print(f'\nAlso created: {jsonl_path}')
print('\nSample toxic annotations:')
toxic = [a for a in annotations if a['label'] == 'toxic'][:3]
for t in toxic:
    print(f'  [{t["category"]}] {t["text"][:80]}...')
