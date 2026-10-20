#!/usr/bin/env python3
"""Second pass: list every visible text node / human attribute in the markup and every JS string
literal with letters that the catalog does not cover, so they can be reviewed by hand."""
import json, re, sys, os
from html.parser import HTMLParser

SRC, CAT = sys.argv[1], sys.argv[2]
cat = json.load(open(CAT, encoding="utf-8"))
texts = set(e["en"] for e in cat if e["kind"] in ("text", "attr"))
rich = [e["en"] for e in cat if e["kind"] == "rich"]
pats = []
for e in cat:
    if e["kind"] == "pattern":
        rx = re.escape(e["en"])
        rx = re.sub(r"\\\{[a-z]+\\\}", ".+?", rx)
        pats.append(re.compile("^" + rx + "$", re.S))

def strip_tags(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s)).strip()
rich_plain = " || ".join(strip_tags(r) for r in rich)

# product names, colour names, brand, etc. that stay English
STAY = set("""Soft Steps|Multicolour Zigzag|Solid Premium|Striped Chenille|Zigzag|Chenille|Solid|M|H|L|XL|₹|›|‹|✕|−|+|1|0|26|6|4|01 / 06|₹0|₹249|₹349|₹299|
Rust|Forest green & black|Royal blue|Mustard stripe|Forest green|Blush pink|Navy|Olive|Cocoa|Mustard|Berry|Grey|Black|Blue|
+91 90994 41429|softsteps.home@gmail.com|@softsteps.home|panchaljelam@oksbi|16×24 in · 450 g|16×24 in · 300 g|16×24 in|Soft Steps · +91 90994 41429""".replace("\n", "").split("|"))

ALL = " || ".join(strip_tags(e["en"]) for e in cat)
def frag_ok(s):
    f = strip_tags(s).strip(" ,.:·#–\\n")
    f = re.sub(r"\\n", " ", f).strip()
    return len(f) > 0 and f in ALL
def covered(s):
    if not s or not re.search(r"[A-Za-z]", s):
        return True
    if frag_ok(s):
        return True
    if s in texts or s in STAY:
        return True
    if s in rich_plain:
        return True
    return any(p.match(s) for p in pats)

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0; self.out = []; self.stack = []
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        a = dict(attrs)
        for k in ("aria-label", "placeholder", "alt", "title"):
            if a.get(k):
                self.out.append((self.getpos()[0], "@" + k, a[k]))
        if tag == "meta" and a.get("name") == "description":
            self.out.append((self.getpos()[0], "@content", a.get("content")))
    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip -= 1
    def handle_data(self, d):
        if self.skip:
            return
        t = re.sub(r"\s+", " ", d).strip()
        if t:
            self.out.append((self.getpos()[0], "#text", t))

html = open(os.path.join(SRC, "softsteps.html"), encoding="utf-8").read()
p = P(); p.feed(html)
print("== markup not covered ==")
for ln, k, t in p.out:
    if not covered(t):
        print(ln, k, repr(t))

# HTML inside JS template strings is checked too, through the literal scan below.
print("== JS string literals with letters, not covered ==")
lit = re.compile(r'"((?:[^"\\\n]|\\.)*)"|\'((?:[^\'\\\n]|\\.)*)\'')
for f in ("softsteps.html", "fx.js", "features.js", "touchfx.js", "shop.js", "tryon.js"):
    path = os.path.join(SRC, f)
    if not os.path.exists(path):
        continue
    src = open(path, encoding="utf-8").read()
    if f == "softsteps.html":
        # only the inline scripts
        parts = re.findall(r"<script>(.*?)</script>", src, re.S)
        offs = [src.find(x) for x in parts]
    else:
        parts, offs = [src], [0]
    for part, off in zip(parts, offs):
        for m in lit.finditer(part):
            s = m.group(1) if m.group(1) is not None else m.group(2)
            if not re.search(r"[A-Za-z]{2,}", s):
                continue
            # skip obvious code: selectors, css, urls, keys, svg paths
            if re.match(r"^[#.\[\]a-z0-9_:=\-\"' ,>()*^$]+$", s) and " " not in s.strip():
                continue
            if re.match(r"^\s*[#.\[]", s) or re.search(r"[{};]|\(\.|rgba|scale|rotate|px", s):
                continue
            if re.search(r"^(https?:|upi:|data:|img/|cubic-bezier|translate|rotate|inset|circle|url\(|M\d|\(prefers|\(max|\(min|\(hover)", s):
                continue
            t = re.sub(r"\s+", " ", s).strip()
            plain = strip_tags(t.replace("\\n", " "))
            if covered(t) or covered(plain):
                continue
            ln = src.count("\n", 0, off + m.start()) + 1
            print(f + ":" + str(ln), repr(t[:140]))
