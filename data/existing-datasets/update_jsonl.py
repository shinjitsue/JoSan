"""
Update training JSONL with the balanced dataset.
"""
import json

# Load combined annotations
with open('./data/existing-datasets/combined_annotations.json', 'r', encoding='utf-8') as f:
    all_ann = json.load(f)

# Create training JSONL
with open('./data/existing-datasets/combined_training.jsonl', 'w', encoding='utf-8') as f:
    for ann in all_ann:
        lang_code = ann['language'].upper()
        training_example = {
            'messages': [
                {
                    'role': 'system',
                    'content': 'You are a content moderation assistant for Filipino social media. Classify text as: CLEAN (safe content), MILD (minor profanity but not harmful), or TOXIC (hate speech, severe profanity, threats). Consider context and intent.'
                },
                {
                    'role': 'user', 
                    'content': f'Classify this text ({lang_code}): "{ann["text"]}"'
                },
                {
                    'role': 'assistant',
                    'content': ann['label'].upper()
                }
            ]
        }
        f.write(json.dumps(training_example, ensure_ascii=False) + '\n')

print('✅ Updated combined_training.jsonl')

# Show sample
print('\nSample entries:')
samples = all_ann[:2] + all_ann[1260:1262] + all_ann[-2:]
for i, ann in enumerate(samples):
    text_preview = ann['text'][:60].replace('\n', ' ')
    print(f'{i+1}. [{ann["language"]}] [{ann["label"]:5}] {text_preview}...')

from collections import Counter
labels = Counter(a['label'] for a in all_ann)
langs = Counter(a['language'] for a in all_ann)

print(f'\n📊 Dataset Summary:')
print(f'   Total examples: {len(all_ann)}')
print(f'   Labels: toxic={labels["toxic"]}, clean={labels["clean"]}')
print(f'   Languages: tl={langs["tl"]}, bis={langs["bis"]}')
