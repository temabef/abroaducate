import re, pathlib
p=pathlib.Path(r"C:\Users\HPENVY~1\AppData\Local\Temp\browseros-tool-output-24jZE0\get-dom-1778621913243-a9e1c87a-ece8-4010-acb2-66baf2a0e784.html")
t=p.read_text(encoding='utf-8',errors='ignore')
patterns=[r'"credits"\s*:\s*(\d+)', r'credits\s*:\s*(\d+)', r'credit_balance\s*[:=]\s*(\d+)']
for pat in patterns:
    ms=list(re.finditer(pat,t,re.I))
    print(pat, 'matches', len(ms))
    for m in ms[:10]:
        s=max(0,m.start()-120)
        e=min(len(t),m.end()+120)
        print(t[s:e].replace('\n',' ')[:280])
        print('---')