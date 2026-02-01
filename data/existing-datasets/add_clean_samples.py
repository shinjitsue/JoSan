"""
Download clean Tagalog/Filipino text samples to balance the dataset.
"""
from datasets import load_dataset
import json
from datetime import datetime

print('Downloading clean Tagalog text samples...')

# Download Filipino sentences from translation dataset
ds = load_dataset('jfernandez/cebuano-filipino-sentences', split='train[:1000]')

clean_annotations = []
for idx, row in enumerate(ds):
    text = row.get('fil', row.get('filipino', ''))
    if not text or len(text) < 20:
        continue
    
    annotation = {
        'id': f'clean-filipino-{idx}',
        'text': text.strip(),
        'label': 'clean',
        'language': 'tl',
        'category': 'general',
        'confidence': 0.9,
        'annotatorId': 'existing-dataset-import',
        'source': 'existing-dataset',
        'createdAt': datetime.now().isoformat(),
        'metadata': {
            'originalDataset': 'jfernandez/cebuano-filipino-sentences'
        }
    }
    clean_annotations.append(annotation)

print(f'Got {len(clean_annotations)} clean Filipino examples')

# Also get Cebuano/Bisaya clean examples
bisaya_annotations = []
for idx, row in enumerate(ds):
    text = row.get('ceb', row.get('cebuano', ''))
    if not text or len(text) < 20:
        continue
    
    annotation = {
        'id': f'clean-bisaya-{idx}',
        'text': text.strip(),
        'label': 'clean',
        'language': 'bis',
        'category': 'general',
        'confidence': 0.9,
        'annotatorId': 'existing-dataset-import',
        'source': 'existing-dataset',
        'createdAt': datetime.now().isoformat(),
        'metadata': {
            'originalDataset': 'jfernandez/cebuano-filipino-sentences'
        }
    }
    bisaya_annotations.append(annotation)

print(f'Got {len(bisaya_annotations)} clean Bisaya examples')

# Load existing toxic annotations
with open('./data/existing-datasets/combined_annotations.json', 'r', encoding='utf-8') as f:
    toxic_annotations = json.load(f)

print(f'Existing toxic annotations: {len(toxic_annotations)}')

# Combine all
all_annotations = toxic_annotations + clean_annotations + bisaya_annotations

# Save combined
with open('./data/existing-datasets/combined_annotations.json', 'w', encoding='utf-8') as f:
    json.dump(all_annotations, f, ensure_ascii=False, indent=2)

# Stats
from collections import Counter
labels = Counter(a['label'] for a in all_annotations)
langs = Counter(a['language'] for a in all_annotations)

print(f'\n✅ Total: {len(all_annotations)} annotations')
print(f'\nBy label:')
for label, count in labels.most_common():
    print(f'  - {label}: {count}')

print(f'\nBy language:')
for lang, count in langs.most_common():
    print(f'  - {lang}: {count}')

# Update JSONL training file
jsonl_path = './data/existing-datasets/combined_training.jsonl'
with open(jsonl_path, 'w', encoding='utf-8') as f:
    for ann in all_annotations:
        lang_code = ann['language'].upper()
        training_example = {
            "messages": [
                {
                    "role": "system",
                    "content": "You are a content moderation assistant for Filipino social media. Classify text as: CLEAN (safe content), MILD (minor profanity but not harmful), or TOXIC (hate speech, severe profanity, threats). Consider context and intent."
                },
                {
                    "role": "user", 
                    "content": f'Classify this text ({lang_code}): "{ann["text"]}"'
                },
                {
                    "role": "assistant",
                    "content": ann['label'].upper()
                }
            ]
        }
        f.write(json.dumps(training_example, ensure_ascii=False) + '\n')

print(f'\n✅ Updated training JSONL: {jsonl_path}')
