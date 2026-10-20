"""Turn i18n/strings.json + i18n/<code>.json (+ extra entries) into next/lang-<code>.js for lang.js."""
import json, re, sys, os
HERE = os.path.dirname(os.path.abspath(__file__)); I18N = os.path.dirname(HERE)
code, out = sys.argv[1], sys.argv[2]
cat = json.load(open(os.path.join(I18N, 'strings.json')))
tr = json.load(open(os.path.join(I18N, code + '.json')))
extra = json.load(open(os.path.join(I18N, 'extra.json')))  # [{en, kind, gu, hi}]
D = {'text': {}, 'rich': {}, 'attr': {}, 'pat': [], 'slides': [{} for _ in range(6)], 'done': None}
# Rich strings whose spans are filled by scripts, or that hold a button with a handler: translate per text node.
SPLIT = {'pay.order', 'pay.hello', 'pay.todo.pay', 'pay.help'}
def strip_tags(h): return re.sub(r'<[^>]+>', '', h)
missing = []
for e in cat:
    i, en, k = e['id'], e['en'], e['kind']
    t = tr.get(i)
    if not t: missing.append(i); continue
    m = re.match(r'hero\.s(\d)\.([hat])$', i)
    if m: D['slides'][int(m.group(1)) - 1][m.group(2)] = t
    if i == 'lang.done': D['done'] = t; continue
    if i in SPLIT: continue
    if k == 'pattern': D['pat'].append([en, t])
    elif k == 'rich': D['rich'][en] = t
    elif k == 'attr': D['attr'][en] = t
    else: D['text'][en] = t
# hand-split entries (see SPLIT)
def parts(i):
    en, t = cat_by[i]['en'], tr[i]
    return en, t
cat_by = {e['id']: e for e in cat}
en, t = parts('pay.help')
b_en = re.search(r'<button[^>]*>.*?</button>', en).group(0); b_t = re.search(r'<button[^>]*>.*?</button>', t).group(0)
pre_en, post_en = en.split(b_en); pre_t, post_t = t.split(b_t)
D['text'][pre_en.strip()] = pre_t.strip(); D['text'][post_en.strip()] = post_t.strip()
D['text']['Order'] = strip_tags(tr['pay.order']).strip()
D['text']['Almost done,'] = strip_tags(tr['pay.hello']).strip()
for e in extra:
    v = e[code]
    if e['kind'] == 'pattern': D['pat'].append([e['en'], v])
    else: D[e['kind']][e['en']] = v
assert all(len(s) == 3 for s in D['slides']), D['slides']
for s in D['slides']: assert s['h'].endswith(s['a']) or s['a'] in s['h'], s
if missing: print('MISSING', code, missing)
js = 'window.SSI18N=window.SSI18N||{};SSI18N.' + code + '=' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n'
open(out, 'w').write(js)
print(code, {k: len(v) for k, v in D.items() if isinstance(v, (dict, list))}, len(js), 'bytes')
