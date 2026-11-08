#!/usr/bin/env python3
"""Normalize the rendered Studio gallery capture into catalog.json and catalog.csv.

Usage: python3 normalize_gallery.py [gallery-cards.json] [output-dir]
No network requests or third-party Python packages are required.
"""
import csv
import json
import re
import sys
from pathlib import Path

RAW = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name('gallery-cards.json')
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).parent
CATEGORIES = [
    'Racing and sports',
    'Strategy and sim',
    'Arcade and puzzle',
    'Adventure',
    'Action',
]

outer = json.loads(RAW.read_text(encoding='utf-8'))
data = json.loads(outer) if isinstance(outer, str) else outer
rows = []
for card in data.get('cards', []):
    title = str(card.get('title', '')).strip()
    raw_text = re.sub(r'\s+', ' ', str(card.get('card_text', '')).replace('\u00a0', ' ')).strip()
    text = raw_text
    if text.startswith('Template'):
        text = text[len('Template'):].lstrip()
    if text.startswith('Open'):
        text = text[len('Open'):].lstrip()
    # The card's accessible text repeats the title for its opener and heading.
    for _ in range(2):
        if title and text.startswith(title):
            text = text[len(title):].lstrip()

    category = next((name for name in CATEGORIES if text.startswith(name)), '')
    if not category:
        category = str(card.get('category', '')).strip()
    if category and text.startswith(category):
        text = text[len(category):].lstrip()

    # The gallery card description precedes one of these action labels.
    description = re.split(r'Make your own version|Use this template', text, maxsplit=1)[0].strip()
    description = re.sub(r'\s+Play(?:\s+.*)?$', '', description).strip()
    is_template = ('Use this template' in raw_text) or raw_text.startswith('Template')

    rows.append({
        'id': f"game-{int(card.get('index', len(rows) + 1)):02d}",
        'index': int(card.get('index', len(rows) + 1)),
        'title': title,
        'category': category,
        'is_template': is_template,
        'gallery_description': description,
        'launch_url': str(card.get('url', '')).strip(),
        'source_gallery_url': str(data.get('source_url', '')).strip(),
        'description_source': 'official gallery card copy',
        'capture_status': 'not_playtested',
        'analysis_status': 'pending',
    })

if len(rows) != 40:
    raise SystemExit(f'Expected 40 cards from the gallery capture, got {len(rows)}.')
if len({r['title'] for r in rows}) != len(rows):
    raise SystemExit('Duplicate titles found; refusing to emit an ambiguous catalog.')
if len({r['launch_url'] for r in rows}) != len(rows):
    raise SystemExit('Duplicate launch URLs found; refusing to emit an ambiguous catalog.')
if any(not r['title'] or not r['launch_url'] or not r['category'] for r in rows):
    missing = [r['id'] for r in rows if not r['title'] or not r['launch_url'] or not r['category']]
    raise SystemExit('Missing required title/URL/category for: ' + ', '.join(missing))

OUT.mkdir(parents=True, exist_ok=True)
json_path = OUT / 'catalog.json'
csv_path = OUT / 'catalog.csv'
summary = {
    'source_gallery_url': data.get('source_url', ''),
    'source_page_title': data.get('page_title', ''),
    'declared_total': data.get('total_claim', ''),
    'catalog_count': len(rows),
    'category_counts': {name: sum(1 for r in rows if r['category'] == name) for name in CATEGORIES},
    'template_count': sum(1 for r in rows if r['is_template']),
    'games': rows,
}
json_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
fields = ['id', 'index', 'title', 'category', 'is_template', 'gallery_description', 'launch_url', 'source_gallery_url', 'description_source', 'capture_status', 'analysis_status']
with csv_path.open('w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)
print(f'Wrote {json_path} and {csv_path}; {len(rows)} unique games, {summary["template_count"]} templates.')
print('Category counts:', json.dumps(summary['category_counts'], ensure_ascii=False))
