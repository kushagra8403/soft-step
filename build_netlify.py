"""Build the public Netlify site from the artifact source.
Usage: python3 build_netlify.py <srcDir> <distDir>
The artifact page is an HTML fragment; here it becomes a full document with link-preview tags,
structured data, icons, robots/sitemap and cache headers."""
import os, re, shutil, sys, json
from PIL import Image
SRC, DIST = sys.argv[1], sys.argv[2]
URL = "https://softsteps-home-lhci.netlify.app/"
ROOT = os.path.dirname(os.path.abspath(__file__))
if os.path.exists(DIST): shutil.rmtree(DIST)
os.makedirs(DIST)
page = open(os.path.join(SRC, 'softsteps.html'), encoding='utf-8').read()
scripts = re.findall(r'<script src="([a-z0-9_]+\.js)"></script>', page)
# language dictionaries are loaded on demand by lang.js, so they are not in a script tag
scripts += [f for f in ('lang-gu.js', 'lang-hi.js') if os.path.exists(os.path.join(SRC, f))]
for js in scripts:
    s = open(os.path.join(SRC, js), encoding='utf-8').read()
    s = s.replace('https://claude.ai/artifact/CspLRioTiMjWF3nz8qj3WH', URL)
    open(os.path.join(DIST, js), 'w', encoding='utf-8').write(s)
# images actually referenced (+ phone variants and thumbs)
img_entry = os.path.join(SRC, 'img')
# Git stores this entry as a symlink (mode 120000). Some source-archive/build
# pipelines materialise symlinks as a text file containing the link target,
# so handle both a real symlink/directory and that archive representation.
if os.path.isdir(img_entry):
    img_src = os.path.realpath(img_entry)
elif os.path.isfile(img_entry):
    try:
        link_target = open(img_entry, encoding='utf-8').read().strip()
    except OSError as exc:
        raise SystemExit(f"Netlify export: cannot read image link {img_entry}: {exc}")
    candidates = []
    if link_target and not os.path.isabs(link_target):
        candidates.append(os.path.normpath(os.path.join(os.path.dirname(img_entry), link_target)))
        candidates.append(os.path.normpath(os.path.join(ROOT, link_target)))
    # Deterministic repository fallback for archives that lose the link target.
    candidates.append(os.path.join(ROOT, 'site-live-v30', 'img'))
    img_src = next((os.path.realpath(p) for p in candidates if os.path.isdir(p)), None)
    if img_src is None:
        raise SystemExit(
            f"Netlify export: {img_entry} is a file, not an image directory, "
            f"and its target {link_target!r} could not be resolved. "
            "Expected the shared image directory at site-live-v30/img."
        )
else:
    fallback = os.path.join(ROOT, 'site-live-v30', 'img')
    if os.path.isdir(fallback):
        img_src = os.path.realpath(fallback)
    else:
        raise SystemExit(
            f"Netlify export: image directory not found at {img_entry} "
            f"or {fallback}."
        )
if not os.path.isfile(os.path.join(img_src, 'logo.jpg')):
    raise SystemExit(f"Netlify export: resolved image directory has no logo.jpg: {img_src}")
shutil.copytree(img_src, os.path.join(DIST, 'img'), ignore=shutil.ignore_patterns('*.png'))
shutil.copy(os.path.join(ROOT, 'og', 'og.jpg'), os.path.join(DIST, 'img', 'og.jpg'))
logo = Image.open(os.path.join(img_src, 'logo.jpg')).convert('RGB')
for n in (180, 192, 512):
    bg = Image.new('RGB', (n, n), (242, 234, 220)); lg = logo.resize((int(n * .86),) * 2, Image.LANCZOS)
    bg.paste(lg, ((n - lg.width) // 2,) * 2); bg.save(os.path.join(DIST, 'img', f'icon-{n}.png'))
# Seed from built-in defaults, then prefer the actual catalog saved in the page.
# This matters after the owner changes prices or stock in the Artifact admin: the
# Netlify export must describe the same catalog as the visible shop.
P = {}
AVAIL = {}
for k, name, sizes in re.findall(r'(\w+):\{name:"([^"]+)",sizes:(\[\[.*?\]\])\}', page):
    P[k] = (name, json.loads(sizes))
    AVAIL[k] = "https://schema.org/InStock"

catalog_match = re.search(r'<script type="application/json" id="ss-catalog">([\s\S]*?)</script>', page)
if catalog_match:
    try:
        catalog = json.loads(catalog_match.group(1))
        ranges = catalog.get("ranges", {})
        # Artifact-hosted /_blob/ uploads do not exist on a static Netlify site.
        # Stop rather than quietly publishing broken product photos.
        for item in ranges.values():
            if not isinstance(item, dict):
                continue
            for colour in item.get("colours", []):
                if not isinstance(colour, dict):
                    continue
                for field in ("photo", "thumb"):
                    src = colour.get(field)
                    if isinstance(src, str) and src.startswith("/_blob/"):
                        raise SystemExit(
                            "Netlify export blocked: a catalogue photo still points to an Artifact /_blob/ URL. "
                            "Copy the approved image into the site's img/ folder and update the catalogue reference."
                        )
        for k, item in ranges.items():
            if k not in ("zig", "sol", "chen") or not isinstance(item, dict):
                continue
            sizes = []
            for z in item.get("sizes", []):
                if not isinstance(z, dict) or not isinstance(z.get("price"), (int, float)) or z["price"] <= 0:
                    continue
                sizes.append([str(z.get("id", "")), str(z.get("dims", "")), str(z.get("weight", "")), z["price"]])
            if not sizes:
                continue
            P[k] = (str(item.get("name") or P.get(k, (k, []))[0]), sizes)
            colours = [c for c in item.get("colours", []) if isinstance(c, dict) and not c.get("hidden") and c.get("stock") != "out"]
            buyable_size = any(z.get("stock") != "out" for z in item.get("sizes", []) if isinstance(z, dict))
            AVAIL[k] = "https://schema.org/InStock" if colours and buyable_size else "https://schema.org/OutOfStock"
    except (ValueError, TypeError, AttributeError):
        # Keep the baked-in safe fallback rather than failing a static export.
        pass

offers = [{"@type": "Product", "name": name, "brand": {"@type": "Brand", "name": "Soft Steps"},
           "image": URL + "img/" + {"zig": "z1.webp", "sol": "s4.webp", "chen": "chen.jpg"}.get(k, "og.jpg"),
           "offers": {"@type": "AggregateOffer", "priceCurrency": "INR", "lowPrice": min(z[3] for z in sz), "highPrice": max(z[3] for z in sz), "offerCount": len(sz), "availability": AVAIL.get(k, "https://schema.org/InStock")}}
          for k, (name, sz) in P.items()]
ld = {"@context": "https://schema.org", "@type": "Store", "name": "Soft Steps", "url": URL, "image": URL + "img/og.jpg",
      "description": "Plush, anti-slip rugs, doormats and bath mats from Vadodara.", "telephone": "+91 90994 41429",
      "email": "softsteps.home@gmail.com", "areaServed": "India", "address": {"@type": "PostalAddress", "addressLocality": "Vadodara", "addressRegion": "Gujarat", "addressCountry": "IN"},
      "sameAs": ["https://www.instagram.com/softsteps.home"], "openingHours": "Mo-Su 10:00-20:00", "paymentAccepted": "UPI",
      "makesOffer": [{"@type": "Offer", "itemOffered": o} for o in offers]}
title = "Soft Steps · Rugs, doormats & bath mats in Vadodara"
desc = re.search(r'<meta name="description" content="([^"]+)"', page).group(1)
# The Netlify git build has SUPABASE_URL set; a Drop upload or local build does not, so those never probe for the order functions.
ACCOUNTS_META = '<meta name="ss-accounts" content="on">' if os.environ.get('SUPABASE_URL') else ''
head = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="canonical" href="{URL}">
{ACCOUNTS_META}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Soft Steps">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{URL}">
<meta property="og:image" content="{URL}img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A rust Soft Steps bath mat and a navy zigzag doormat">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="192x192" href="img/icon-192.png">
<link rel="apple-touch-icon" href="img/icon-180.png">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
'''
page = re.sub(r'<title>[^<]*</title>', f'<title>{title}</title>', page, count=1)
open(os.path.join(DIST, 'index.html'), 'w', encoding='utf-8').write(head + page)
open(os.path.join(DIST, 'robots.txt'), 'w').write(f"User-agent: *\nAllow: /\nSitemap: {URL}sitemap.xml\n")
open(os.path.join(DIST, 'sitemap.xml'), 'w').write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{URL}</loc></url></urlset>\n')
open(os.path.join(DIST, 'netlify.toml'), 'w').write('''[build]
  publish = "."
  command = ""

[[headers]]
  for = "/img/*"
  [headers.values]
    Cache-Control = "public, max-age=604800"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    X-Frame-Options = "DENY"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https: upi:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; upgrade-insecure-requests"
''')
tot = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(DIST) for f in fs)
print('built', DIST, 'files', sum(len(fs) for _, _, fs in os.walk(DIST)), 'MB', round(tot / 1e6, 1), 'scripts', scripts, 'products', list(P))
