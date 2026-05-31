import json
from pathlib import Path

files = [Path('query_planning.json'), Path('query_results.json')]
terms = {
    'Library and information science': ['library', 'information science', 'library and information'],
    'Electrical and electronics engineering': ['electrical', 'electronics'],
    'Mechanical Engineering': ['mechanical engineering', 'mechanical'],
    'Neuroscience or Neurobiology': ['neuroscience', 'neurobiology'],
    'Early childhood Education or international education': ['early childhood', 'international education', 'education'],
    'Educational Technology': ['educational technology'],
    'Chemical engineering/ Process Engineering': ['chemical engineering', 'process engineering', 'chemical'],
    'PhD Cybersecurity': ['cybersecurity', 'security'],
    'Material science and engineering': ['material science', 'materials science', 'material'],
    'Chemistry': ['chemistry'],
    'MSc Education': ['msc education', 'education'],
    'Actuarial science': ['actuarial'],
    'Health Administration': ['health administration', 'health'],
    'Biomedical sciences': ['biomedical', 'biomedical sciences', 'biomedical science'],
}

all_data = []
for f in files:
    if f.exists():
        with f.open('r', encoding='utf-8') as fh:
            try:
                all_data.extend(json.load(fh))
            except json.JSONDecodeError as e:
                print(f'ERROR loading {f}:', e)

for label, kws in terms.items():
    hits = []
    for item in all_data:
        text = ' '.join(str(item.get(k, '')).lower() for k in ['program_name', 'field_of_study', 'university_name', 'degree_level'])
        if any(kw in text for kw in kws):
            hits.append(item)
    print('===', label, '===')
    if not hits:
        print('  no matches found')
    for item in hits[:5]:
        print('  ', item.get('id'), '|', item.get('program_name'), '|', item.get('university_name'), '|', item.get('country'), '|', item.get('degree_level'))
    print(' count', len(hits))
    print()
