"""
Generate translation review samples for quality checking.
"""

import json
import random

# Load the translated Bisaya samples
with open('data/existing-datasets/bisaya_toxic_translated.json', 'r', encoding='utf-8') as f:
    translations = json.load(f)

# Get random samples for review
random.seed(42)
samples = random.sample(translations, min(30, len(translations)))

print('='*80)
print('BISAYA TRANSLATION REVIEW SAMPLES')
print('='*80)
print()
print('These are random samples from the Tagalog->Bisaya translations.')
print('Please review for accuracy and natural-sounding Bisaya.')
print()

for i, sample in enumerate(samples, 1):
    original = sample['metadata']['originalText']
    translated = sample['text']
    category = sample['category']
    
    print(f'--- Sample {i} ---')
    print(f'Category: {category}')
    print(f'Original (TL):')
    print(f'  {original[:200]}')
    print(f'Translated (BIS):')
    print(f'  {translated[:200]}')
    print()

# Summary
print('='*80)
print('TRANSLATION QUALITY NOTES')
print('='*80)
print('''
The translation uses word-level mapping for profanity terms.
Common mappings used:
- tangina/putangina -> yawa
- gago/bobo/tanga -> buang/bugo
- panget -> ngil-ad
- bwisit -> hasol
- malandi/malibog -> malibog
- bakla/bading -> bayot

If translations need improvement:
1. Open annotation tool: npm run dev -> http://localhost:5174/annotation.html
2. Import the translated file and manually fix errors
3. Export corrected annotations
''')
