import json, re, sys
from html.parser import HTMLParser

base = sys.argv[1]
cat = json.load(open(base + "/strings.json"))
gu = json.load(open(base + "/gu.draft.json"))

ids = [e["id"] for e in cat]
probs = []
missing = [i for i in ids if i not in gu]
extra = [k for k in gu if k not in set(ids)]
empty = [k for k, v in gu.items() if not str(v).strip()]
if missing: probs.append(("missing", missing))
if extra: probs.append(("extra", extra))
if empty: probs.append(("empty", empty))

PH = re.compile(r"\{(\w+)\}")
TAG = re.compile(r"<[^>]+>")
NUMS = re.compile(r"[₹+]?\d[\d ,.×]*\d|\d")

def tags(s):
    return sorted(TAG.findall(s))

for e in cat:
    i, en = e["id"], e["en"]
    t = gu.get(i, "")
    if sorted(PH.findall(en)) != sorted(PH.findall(t)):
        probs.append(("placeholders", i, PH.findall(en), PH.findall(t)))
    if tags(en) != tags(t):
        probs.append(("tags", i, tags(en), tags(t)))
    if re.search("[૦-૯]", t):
        probs.append(("gujarati digits", i))
    for tok in ["₹249", "16×24", "20×32 in", "24×60 in", "panchaljelam@oksbi", "90994 41429",
                "softsteps.home@gmail.com", "98765 43210", "© 2026", "Soft Steps", "±5%", "♡",
                "GPay", "PhonePe", "Paytm", "BCF", "300 g", "1715 g", "Multicolour Zigzag", "Solid Premium",
                "Striped Chenille Mat", "Zigzag", "Chenille", "+91"]:
        if tok in en and tok not in t:
            probs.append(("lost token", i, tok))
    # every digit run in English must survive (ignore number words)
    for n in re.findall(r"\d+", en):
        if n not in t:
            probs.append(("lost number", i, n))
    # no stray Latin words beyond allowed
    latin = set(w.rstrip(".") for w in re.findall(r"[A-Za-z][A-Za-z.@]*", PH.sub("", TAG.sub("", t))))
    allowed = {"Soft", "Steps", "WhatsApp", "UPI", "ID", "QR", "Instagram", "Zigzag", "Solid", "Premium", "Chenille",
               "Multicolour", "Striped", "Mat", "Aqua", "Mustard", "M", "H", "L", "XL", "in", "g", "BCF", "GPay",
               "PhonePe", "Paytm", "Jelam", "Panchal", "panchaljelam@oksbi", "softsteps.home@gmail.com", "zigzag", "solid",
               "scan", "from", "gallery"}
    odd = latin - allowed
    if odd:
        probs.append(("latin words", i, sorted(odd)))

# hero accents
for k in range(1, 7):
    h, a = gu["hero.s%d.h" % k], gu["hero.s%d.a" % k]
    j = h.rfind(a)
    if j < 0:
        probs.append(("accent not in headline", k))
    elif j + len(a) != len(h):
        probs.append(("accent not at end (ok but note)", k))

# pay.help button text must equal pay.copy_order
m = re.search(r'id="copyorder">(.*?)</button>', gu["pay.help"])
if not m or m.group(1) != gu["pay.copy_order"]:
    probs.append(("pay.help/copy_order mismatch",))
# fit.title vs zoom.try consistency
if TAG.sub("", gu["fit.title"]) != gu["zoom.try"]:
    probs.append(("fit.title vs zoom.try", TAG.sub("", gu["fit.title"]), gu["zoom.try"]))
# rich entries must parse
class P(HTMLParser):
    pass
for e in cat:
    if e["kind"] == "rich":
        P().feed(gu[e["id"]])

# length report for short UI labels
print("== length ratio > 1.4 (text/attr, EN <= 30 chars) ==")
for e in cat:
    en, t = e["en"], gu[e["id"]]
    if len(en) <= 30 and e["kind"] in ("text", "pattern", "attr"):
        r = len(t) / max(1, len(en))
        if r > 1.4:
            print("  %-26s %4.2f  %r -> %r" % (e["id"], r, en, t))

print("== problems ==")
for p in probs:
    print(" ", p)
print("catalog", len(ids), "translated", len(gu), "problems", len(probs))
