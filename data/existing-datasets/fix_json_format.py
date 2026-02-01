"""
Fix JSON format to match AnnotationRecord type exactly.

The TypeScript type expects:
- metadata.createdAt (inside metadata object)
- NOT createdAt at root level
"""
import json
from datetime import datetime

# Load current data
with open('./data/existing-datasets/combined_annotations.json', 'r', encoding='utf-8') as f:
    annotations = json.load(f)

print(f'Loaded {len(annotations)} annotations')
print(f'Current format: {list(annotations[0].keys())}')

# Fix format to match AnnotationRecord type
fixed_annotations = []
for ann in annotations:
    # Get createdAt - could be at root or in metadata
    created_at = ann.get('createdAt') or ann.get('metadata', {}).get('createdAt') or datetime.now().isoformat()
    
    # Build proper metadata object
    old_metadata = ann.get('metadata', {})
    if isinstance(old_metadata, dict):
        metadata = {
            'createdAt': created_at,
            **{k: v for k, v in old_metadata.items() if k != 'createdAt'}
        }
    else:
        metadata = {'createdAt': created_at}
    
    fixed = {
        'id': str(ann.get('id', '')),
        'text': str(ann.get('text', '')),
        'label': ann.get('label', 'clean'),
        'language': ann.get('language', 'tl'),
        'category': ann.get('category', 'general'),
        'source': ann.get('source', 'existing-dataset'),
        'annotatorId': ann.get('annotatorId', 'existing-dataset-import'),
        'confidence': float(ann.get('confidence', 0.9)),
        'metadata': metadata
    }
    fixed_annotations.append(fixed)

# Validate
print(f'\nFixed format: {list(fixed_annotations[0].keys())}')
print(f'Metadata keys: {list(fixed_annotations[0]["metadata"].keys())}')

# Save
with open('./data/existing-datasets/combined_annotations.json', 'w', encoding='utf-8') as f:
    json.dump(fixed_annotations, f, ensure_ascii=False, indent=2)

print(f'\n✅ Fixed {len(fixed_annotations)} annotations')

# Show sample
print('\nSample fixed annotation:')
print(json.dumps(fixed_annotations[0], indent=2, ensure_ascii=False)[:500])
