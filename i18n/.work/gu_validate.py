import json, re, sys
from collections import Counter
from html.parser import HTMLParser
B = sys.argv[1]
cat = json.load(open(B + "/strings.json"))
tryon = json.load(open(B + "/gu.tryon.draft.json"))["entries"]
gu = json.load(open(B + "/gu.json"))
src = [(e["id"], e["en"], e["kind"]) for e in cat] + [(e["id"], e["en"], e.get("kind", "text")) for e in tryon]
ids = [s[0] for s in src]
err = []
for i in ids:
    if i not in gu: err.append(("missing", i))
for k in gu:
    if k not in set(ids): err.append(("extra", k))
for k, v in gu.items():
    if not isinstance(v, str) or not v.strip(): err.append(("empty", k))
    if v != v.strip() or "  " in v: err.append(("whitespace", k))
    if re.search("[​-‍﻿]", v): err.append(("zero-width", k))
    if re.search("[ऀ-ॿ]", v): err.append(("devanagari", k))
    if re.search("[૦-૯]", v): err.append(("gujarati digits", k))
PH = re.compile(r"\{(\w+)\}"); TAG = re.compile(r"<[^>]+>")
ALLOWED = {"Soft","Steps","WhatsApp","UPI","ID","QR","Instagram","Zigzag","Solid","Premium","Chenille","Multicolour",
 "Striped","Mat","Aqua","Mustard","M","H","L","XL","in","g","BCF","GPay","PhonePe","Paytm","Jelam","Panchal",
 "panchaljelam@oksbi","softsteps.home@gmail.com","scan","from","gallery","JPG","PNG","Shift"}
for i, en, kind in src:
    t = gu.get(i, "")
    if Counter(PH.findall(en)) != Counter(PH.findall(t)): err.append(("placeholders", i))
    if Counter(TAG.findall(en)) != Counter(TAG.findall(t)): err.append(("tags", i, kind))
    for n in re.findall(r"\d+", en):
        if n not in t: err.append(("lost number", i, n))
    for tok in ["₹249","panchaljelam@oksbi","90994 41429","softsteps.home@gmail.com","98765 43210","© 2026","Soft Steps","±5%","♡","Striped Chenille Mat","Solid Premium","Multicolour Zigzag","Chenille","GPay","PhonePe","Paytm"]:
        if tok in en and tok not in t: err.append(("lost token", i, tok))
    latin = set(w.rstrip(".") for w in re.findall(r"[A-Za-z][A-Za-z.@]*", PH.sub("", TAG.sub("", t))))
    if latin - ALLOWED: err.append(("latin", i, sorted(latin - ALLOWED)))
    if kind == "rich": HTMLParser().feed(t)
for k in range(1, 7):
    h, a = gu["hero.s%d.h" % k], gu["hero.s%d.a" % k]
    if not h.endswith(a): err.append(("hero accent", k))
m = re.search(r'id="copyorder">(.*?)</button>', gu["pay.help"])
if not m or m.group(1) != gu["pay.copy_order"]: err.append(("pay.help/copy_order",))
if TAG.sub("", gu["fit.title"]) != gu["zoom.try"] or gu["tryon.title"] != gu["zoom.try"]: err.append(("fit.title/zoom.try/tryon.title",))
# allowed known exception: hero.s2.t keeps 'zigzag stripes' as a pattern word (ઝિગઝેગ), not the range name
print("entries", len(gu), "(catalog %d + tryon %d)" % (len(cat), len(tryon)))
print("PASS" if not err else "FAIL", len(err))
for e in err: print(" ", e)
