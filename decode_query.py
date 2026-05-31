from pathlib import Path
text = Path('query_out.txt').read_text('utf-16')
print(text[:20000])
