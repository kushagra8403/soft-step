#!/usr/bin/env python3
"""Builds i18n/strings.json from the Soft Steps sources.

Every `where` item is a (file, snippet, label) triple: the snippet is looked up in the source
snapshot so each location carries a real line number, and a missing snippet fails the build.
For patterns the label is omitted and the snippet itself (the JS expression) is quoted.
"""
import json, os, re, sys, html

SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), "..", ".snap1")
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "..", "strings.json")
FILES = {"html": "softsteps.html", "fx": "fx.js", "feat": "features.js", "touch": "touchfx.js", "shop": "shop.js", "tryon": "tryon.js", "lang": "lang.js"}
TEXT = {}
for k, f in FILES.items():
    p = os.path.join(SRC, f)
    TEXT[k] = open(p, encoding="utf-8").read() if os.path.exists(p) else ""

ERR = []
def lines_of(fk, snip, all_=False):
    t = TEXT[fk]
    out, i = [], t.find(snip)
    while i >= 0:
        out.append(t.count("\n", 0, i) + 1)
        if not all_:
            break
        i = t.find(snip, i + 1)
    return out

def W(fk, snip, label=None, all_=False):
    ln = lines_of(fk, snip, all_)
    if not ln:
        ERR.append("snippet not found in %s: %r" % (FILES[fk], snip))
        ln = ["?"]
    loc = FILES[fk] + ":" + ",".join(str(x) for x in ln)
    return loc + " " + (label if label is not None else "`" + snip + "`")

ENTRIES = []
def E(id, en, kind, where, note=""):
    ENTRIES.append({"id": id, "en": en, "kind": kind, "where": " | ".join(where), "note": note})

# ------------------------------------------------------------------ page / skip / meta
E("page.title.sr", "Soft Steps: rugs, doormats and bath mats from Vadodara", "text",
  [W("html", '<h1 class="sr-only">Soft Steps: rugs', "h1.sr-only (the page's only h1, screen readers)")],
  "Keep 'Soft Steps' in Latin script. Vadodara may be transliterated.")
E("meta.description", "Soft Steps, Vadodara: plush, anti-slip rugs, doormats and bath mats from ₹249, with delivery across India.", "attr",
  [W("html", '<meta name="description"', 'meta[name=description] content')],
  "Shown in search results and link previews; only reaches crawlers if a language version is served as its own page. Keep 'Soft Steps' and ₹249.")
E("skip.shop", "Skip to the shop", "text", [W("html", '<a class="skip" href="#shop">', "a.skip")])

# ------------------------------------------------------------------ navigation
E("nav.sections.aria", "Sections", "attr", [W("html", 'aria-label="Sections"', "#hdr nav.hnav[aria-label]")])
E("nav.main.aria", "Main", "attr", [W("html", 'nav class="navpill" aria-label="Main"', "#hero nav.navpill[aria-label]")])
E("nav.footer.aria", "Footer", "attr", [W("html", 'nav aria-label="Footer"', "footer nav[aria-label]")])
E("nav.home", "Rugs & mats", "text",
  [W("html", 'aria-current="page">Rugs &amp; mats</a>', "#hero nav.navpill a.on"),
   W("html", 'style="--i:0">Rugs &amp; mats</a>', "dialog#menu .mlinks a[href=#hero]")])
E("nav.shop", "Shop", "text",
  [W("html", '<a href="#shop">Shop</a>', "#hdr nav.hnav a; footer nav a", all_=True)])
E("nav.colours", "Colours", "text",
  [W("html", '<a href="#colours">Colours</a>', "#hdr nav.hnav a; #hero nav.navpill a; footer nav a", all_=True),
   W("html", 'style="--i:1">Colours</a>', "dialog#menu .mlinks a"),
   W("shop", 'aria-label="Colours"', "#zoom-row[aria-label] (zoom viewer swatch row, attr)")])
E("nav.sizes", "Sizes", "text",
  [W("html", '<a href="#fit">Sizes</a>', "#hdr, #hero, footer nav a", all_=True),
   W("html", 'style="--i:5">Sizes</a>', "dialog#menu .mlinks a")])
E("nav.order", "How to order", "text",
  [W("html", '<a href="#order">How to order</a>', "#hdr, #hero nav a", all_=True),
   W("html", 'style="--i:6">How to order</a>', "dialog#menu .mlinks a")])
E("nav.contact", "Contact", "text",
  [W("html", '<a href="#contact">Contact</a>', "#hdr, #hero, footer nav a", all_=True),
   W("html", 'style="--i:7">Contact</a>', "dialog#menu .mlinks a")])
E("nav.questions", "Questions", "text", [W("html", '<a href="#faq">Questions</a>', "footer nav a")])
E("app.instagram", "Instagram", "text",
  [W("html", 'rel="noopener">Instagram</a>', "footer nav a"),
   W("html", 'aria-label="Instagram"', "#hero .social a[aria-label] (attr)"),
   W("html", '<span class="k">Instagram</span>', "#contact .clist .k")],
  "Third-party app name: usually kept in Latin script; transliterate only if that reads more naturally. The handle @softsteps.home stays as is.")
E("app.whatsapp", "WhatsApp", "text",
  [W("html", 'aria-label="WhatsApp"', "#hero .social a[aria-label] (attr)"),
   W("html", '<span class="k">WhatsApp</span>', "#contact .clist .k"),
   W("html", '<div class="menu-wa"><span>WhatsApp</span>', "dialog#menu .menu-wa span")],
  "Third-party app name: usually kept in Latin script (or વોટ્સએપ / व्हाट्सएप). Use the same choice inside every sentence that mentions WhatsApp.")
E("menu.button", "Menu", "text",
  [W("html", 'id="hmenu" aria-haspopup="dialog">Menu</button>', "#hmenu"),
   W("html", 'id="h-menu" aria-haspopup="dialog">Menu</button>', "#h-menu"),
   W("html", '<dialog id="menu" aria-label="Menu">', "dialog#menu[aria-label] (attr)"),
   W("html", '<nav aria-label="Menu">', "dialog#menu nav[aria-label] (attr)")])
E("menu.close.aria", "Close menu", "attr", [W("html", 'aria-label="Close menu"', "dialog#menu button.x[data-close]")])
E("menu.zig", "Zigzag rugs", "text", [W("html", 'style="--i:2">Zigzag rugs</a>', "dialog#menu .mlinks a[href=#r-zig]")],
  "Keep the range name 'Zigzag' in English; translate only 'rugs'.")
E("menu.sol", "Solid Premium rugs", "text", [W("html", 'style="--i:3">Solid Premium rugs</a>', "dialog#menu .mlinks a[href=#r-sol]")],
  "Keep 'Solid Premium' in English; translate only 'rugs'.")
E("menu.chen", "Chenille mats", "text", [W("html", 'style="--i:4">Chenille mats</a>', "dialog#menu .mlinks a[href=#r-chen]")],
  "Keep 'Chenille' in English; translate only 'mats'.")

# ------------------------------------------------------------------ header counters
E("saved.button.aria", "Saved colours, {n}", "pattern",
  [W("html", 'aria-label="Saved colours, 0"', "static #hsaved, #h-savedbtn [aria-label] (n=0)", all_=True),
   W("feat", 'btn.setAttribute("aria-label", "Saved colours, " + n)')],
  "n = number of saved colours (0 or more). The code has no singular form: if your language needs one for n=1, add a variant and a plural switch in syncSaved().")
E("cart.button.aria.one", "Open cart, {n} item", "pattern",
  [W("html", '$("#cartbtn").setAttribute("aria-label","Open cart, "+n+(n===1?" item":" items"))'),
   W("feat", 'hc.setAttribute("aria-label", "Open cart, " + n + (n === 1 ? " item" : " items"))')],
  "Variant used when n === 1 (#cartbtn and sticky-header #hcart).")
E("cart.button.aria.other", "Open cart, {n} items", "pattern",
  [W("html", 'aria-label="Open cart, 0 items"', "static #hcart, #cartbtn (n=0)", all_=True),
   W("html", '"Open cart, "+n+(n===1?" item":" items")'),
   W("feat", '"Open cart, " + n + (n === 1 ? " item" : " items")')],
  "Variant used when n is 0 or more than 1.")

# ------------------------------------------------------------------ hero
E("hero.aria", "Featured rug", "attr", [W("html", 'aria-label="Featured rug"', "header#hero[aria-label]")])
E("hero.prev.aria", "Previous rug", "attr", [W("html", 'aria-label="Previous rug"', "#prev")])
E("hero.next.aria", "Next rug", "attr", [W("html", 'aria-label="Next rug"', "#nextBtn")])
E("hero.pause.aria", "Pause slideshow", "attr",
  [W("html", 'aria-label="Pause slideshow"', "static #h-play"),
   W("fx", 'btn.setAttribute("aria-label", asPlay ? "Play slideshow" : "Pause slideshow")')])
E("hero.play.aria", "Play slideshow", "attr",
  [W("fx", 'btn.setAttribute("aria-label", asPlay ? "Play slideshow" : "Pause slideshow")')])
E("hero.eyebrow", "Rugs, doormats & bath mats · Vadodara", "text",
  [W("html", '<p class="eyebrow">Rugs, doormats &amp; bath mats · Vadodara</p>', "#hero .hcopy p.eyebrow")])

SLIDE_NOTE = ("SLIDES[%d] = {k, c, h, a, g, t}. h is the headline, a the accent: fx.js parts() finds a inside h with "
              "h.lastIndexOf(a) and wraps it in <em>, so in every language a must be an exact substring of h "
              "(ideally its end, as in English). k (range key), c (colour, also the swatch lookup key) and g "
              "(the big faded ghost word, a colour fragment) stay English and are not in the catalog.")
slides = [
    ("Soft steps, every morning", "every morning",
     "Our Solid Premium pile is heavy, plush and absorbent. Step out of the shower onto something warm, then throw it in the washing machine."),
    ("Bold at the front door", "front door",
     "Zigzag stripes in a soft microfiber pile with a latex anti-slip backing. The first thing guests see, and the softest."),
    ("Dry feet, happy floors", "happy floors",
     "A thick textured pile that soaks up water fast and dries quickly. Made for the bathroom door, sized for every room."),
    ("A little colour by the bed", "by the bed",
     "Soft underfoot first thing in the morning. Ten zigzag colourways, four sizes, all machine washable."),
    ("Fresh as the first rain", "first rain",
     "A cool aqua pile that brightens a white bathroom. Anti-slip latex backing keeps it where you put it."),
    ("Sunshine for your doorstep", "doorstep",
     "Warm mustard zigzags for the main door or the balcony. From ₹249 for the 16×24 inch size."),
]
for i, (h, a, t) in enumerate(slides):
    n = i + 1
    wh = [W("html", 'h:"%s"' % h, "SLIDES[%d].h" % i)]
    if i == 0:
        wh.append(W("html", 'id="h-title">Soft steps, <em>every morning</em></p>',
                    "static #h-title (before JS: h with the accent a wrapped in <em>)"))
    wh += [W("html", '$("#h-title").textContent=sl.h', "core show()"),
           W("fx", 'var h = sl.h, a = sl.a || ""', "fx.js parts()/renderTitle(): words split into span.w, full text in span.sr-only")]
    note = SLIDE_NOTE % i
    if i == 0:
        note += " 'Soft steps' here is a play on the brand; translators may keep it as the English brand or translate the phrase."
    E("hero.s%d.h" % n, h, "text", wh, note)
    E("hero.s%d.a" % n, a, "text", [W("html", 'a:"%s"' % a, "SLIDES[%d].a" % i),
                                    W("fx", "i = a ? h.lastIndexOf(a) : -1", "fx.js parts()")],
      "Accent of hero.s%d.h: must be copied exactly from the translated headline (the part shown in italic <em>)." % n)
    twh = [W("html", 't:"%s' % t[:40], "SLIDES[%d].t" % i)]
    if i == 0:
        twh.append(W("html", '<p class="lead" id="h-lead">', "static #h-lead"))
    twh.append(W("html", '$("#h-lead").textContent=sl.t', "core show()"))
    tnote = "Lead paragraph under the hero headline."
    if i == 5:
        tnote += " Keep ₹249 and 16×24 as they are."
    if "Solid Premium" in t:
        tnote += " Keep 'Solid Premium' in English."
    E("hero.s%d.t" % n, t, "text", twh, tnote)

E("cta.add", "Add to cart", "text",
  [W("html", '<button type="button" class="pill" id="h-add">Add to cart', "#h-add (text node before span.chev)"),
   W("html", 'data-add>Add to cart <span class="chev"', "static .prod [data-add] x3 (replaced by cta.add.price once JS runs)", all_=True),
   W("feat", '>Add to cart</button>', "saved dialog [data-sadd]"),
   W("feat", 'add.textContent = "Add to cart"', "saved dialog, reset after saved.added")])
E("hero.see_all", "See all 26 colours", "text", [W("html", '<a class="text" href="#colours">See all 26 colours</a>', "#hero .ctas a.text")])
E("hero.choose", "Choose your size:", "text", [W("html", '<p class="choose">Choose your size:</p>', "#hero p.choose")])
E("hero.tagline", "Comfort, in every step", "text", [W("html", '<p class="tagline">Comfort, in every step</p>', "#hero p.tagline")])
E("hero.next", "Next: {colour}", "pattern",
  [W("html", '<span id="h-nextname">Next: Forest green</span>', "static #h-nextname"),
   W("html", '$("#h-nextname").textContent="Next: "+nx.c.split(" &")[0].split(" & ")[0]')],
  "colour = first part of the next slide's colour name, English (e.g. 'Forest green', 'Royal blue'). The #h-next button has no aria-label now, so this text is also its accessible name.")
E("hero.live", "Rug {i} of {n}: {product} in {colour}, {price}", "pattern",
  [W("html", '$("#h-live").textContent="Rug "+(hi+1)+" of "+SLIDES.length+": "+P[sl.k].name+" in "+sl.c+", "+inr(P[sl.k].sizes[hs][3])')],
  "Screen-reader announcement (#h-live, aria-live=polite) when the visitor changes slide from inside the hero. i = 1..6, n = 6; product and colour stay English; price like ₹349. The '{product} in {colour}' part should read the same as img.alt.")
E("img.alt", "{product} in {colour}", "pattern",
  [W("html", 'alt="Solid Premium Rug in Rust"', "static #h-img alt"),
   W("html", 'alt="Multicolour Zigzag Rug in Forest green &amp; black"', "static #r-zig img alt"),
   W("html", 'alt="Solid Premium Rug in Royal blue"', "static #r-sol img alt"),
   W("html", 'img.alt=p.name+" in "+b.dataset.n'),
   W("html", '$("#h-img").alt=P[sl.k].name+" in "+sl.c'),
   W("fx", 'img.alt = SS.P[sl.k].name + " in " + sl.c', all_=True),
   W("shop", 'img.alt = P[st.k].name + " in " + b.dataset.n')],
  "Alt text of the rug photos (hero, product cards, zoom viewer). product = full range name, colour = colour name; both stay English.")
E("save.aria", "Save {colour} {product}", "pattern",
  [W("html", 'aria-label="Save Rust Solid Premium Rug"', "static #h-save"),
   W("html", 'aria-label="Save Forest green &amp; black Multicolour Zigzag Rug"', "static #r-zig [data-save]"),
   W("fx", 'b.setAttribute("aria-label", "Save " + sl.c + " " + SS.P[sl.k].name)'),
   W("feat", 'h.setAttribute("aria-label", "Save " + sl.c + " " + P[sl.k].name)'),
   W("feat", 'h.setAttribute("aria-label", "Save " + c + " " + P[k].name)'),
   W("feat", 'esc("Save " + t.n + " " + P[t.k].name)')],
  "Heart (toggle, aria-pressed) on the hero, each product card and each colour-index tile. colour and product stay English.")

# ------------------------------------------------------------------ sizes
E("size.label", "Size", "text",
  [W("html", '<span class="clab">Size</span>', ".prod .szlab span.clab x3", all_=True),
   W("html", '<p class="clab">Size</p>', "#fit p.clab"),
   W("html", 'role="radiogroup" aria-label="Size"', "#h-sizes, #fsizes [aria-label] (attr)", all_=True),
   W("feat", '<span class="sr-only">Size</span>', "compare table first header cell (sr-only)")])
E("size.half", "{dims} half round", "pattern",
  [W("html", '["H","16×24 in half round"', "P.*.sizes[1][1] data (all three ranges)", all_=True),
   W("html", '$("#h-dims").textContent=z[1]+(z[2]?" · "+z[2]:"")'),
   W("html", '$("[data-dims]",el).textContent=z[1]+(z[2]?" · "+z[2]:"")'),
   W("html", "aria-label=\"'+z[0]+', '+z[1]+'\""),
   W("feat", '"</b><small>" + esc(h[1]) + "</small></th>"'),
   W("feat", "esc(s[0] + \", \" + s[1])"),
   W("html", "esc(x.size)+' · '+inr(x.p)+' each</small>", "core render() cart line small (x.size)")],
  "dims = '16×24 in'. The H size's dimension text, shown in #h-dims, the card's [data-dims], size-button aria-labels ('H, 16×24 in half round'), the Compare table row header, the Saved dialog size buttons and the cart line. The same P data also feeds the WhatsApp order and share messages, which stay English: translate at display time only, not in P. Cart items keep their English size in localStorage.")
E("size.half.short", "½ round", "text",
  [W("html", '(/half round/.test(z[1])?"½ round":z[1].replace(" in",""))', "core sizeButtons() data-d, shown by CSS .sz[data-d]::after{content:attr(data-d)}")],
  "Tiny caption under the H size button (11px). Keep it very short. The other buttons show measurements such as 16×24, which stay as they are.")
E("compare.open", "Compare sizes", "text",
  [W("html", 'id="h-compare" aria-haspopup="dialog">Compare sizes</button>', "#h-compare"),
   W("html", 'data-compare aria-haspopup="dialog">Compare sizes</button>', ".prod .szlab [data-compare] x3; #fit .fitbtns [data-compare]", all_=True),
   W("html", '<h2 id="compare-t">Compare sizes</h2>', "dialog#compare h2")])
E("size.which", "Which size?", "text", [W("html", '<a class="link" href="#fit">Which size?</a>', ".prod .szlab a.link x3", all_=True)])

# ------------------------------------------------------------------ range strip
E("ranges.aria", "Shop by range", "attr", [W("html", 'aria-label="Shop by range"', "nav.ranges")])
E("price.from", "from {price}", "pattern",
  [W("html", '<small>from ₹', "static nav.ranges small (from ₹249 / ₹349 / ₹299)", all_=True),
   W("feat", "'<span class=\"fromp\"> · from ' + fp + '</span></span>'")],
  "price like ₹249 (lowest price of the range). In the colour-index tile it follows the range name after ' · ' (outside the string).")
E("ranges.count", "{n} colours", "pattern",
  [W("html", '<small>10 colours</small>', "static nav.ranges small (Zigzag, Chenille)", all_=True),
   W("html", '<small>6 colours</small>', "static nav.ranges small (Solid Premium)")],
  "Static text in the markup; n = 10, 6, 10 (always plural).")

# ------------------------------------------------------------------ promise strip + PIN
E("promise.aria", "Why Soft Steps", "attr", [W("html", 'aria-label="Why Soft Steps"', "section.promise[aria-label]")],
  "Keep 'Soft Steps' in Latin script.")
E("promise.delivery", "Free delivery in Vadodara", "text", [W("html", '</svg>Free delivery in Vadodara</li>', "section.promise li")])
E("promise.upi", "Pay by UPI, confirmed on WhatsApp the same day", "text",
  [W("html", '</svg>Pay by UPI, confirmed on WhatsApp the same day</li>', "section.promise li")])
E("care.wash", "Machine washable, quick-drying", "text",
  [W("html", '</svg>Machine washable, quick-drying</li>', "section.promise li"),
   W("html", '<dt>Care</dt><dd>Machine washable, quick-drying</dd>', "#made dl.specs dd")])
E("promise.antislip", "Anti-slip latex backing", "text", [W("html", '</svg>Anti-slip latex backing</li>', "section.promise li")])
E("pin.label", "Check delivery to your PIN", "text", [W("html", '<label for="pin-in">Check delivery to your PIN</label>', "#pinf label")])
E("pin.placeholder", "6-digit PIN", "attr", [W("html", 'placeholder="6-digit PIN"', "#pin-in[placeholder]")])
E("pin.check", "Check", "text", [W("html", '<button type="submit" class="pill plain">Check</button>', "#pinf button[type=submit]")])
E("pin.vadodara", "Vadodara: free delivery. We confirm on WhatsApp.", "text",
  [W("feat", 'return "Vadodara: free delivery. We confirm on WhatsApp."', "pinMsg() for PIN 390xxx, shown in #pin-out (aria-live) and #pinnote (aria-live)")])
E("pin.district", "Vadodara district: we'll confirm delivery charges on WhatsApp.", "text",
  [W("feat", 'return "Vadodara district: we\'ll confirm delivery charges on WhatsApp."', "pinMsg() for PIN 391xxx, #pin-out and #pinnote")])
E("pin.india", "Delivery across India: charges extra, confirmed on call. We confirm on WhatsApp.", "text",
  [W("feat", 'return "Delivery across India: charges extra, confirmed on call. We confirm on WhatsApp."', "pinMsg() for any other valid PIN, #pin-out and #pinnote")])
E("pin.invalid", "Enter a 6-digit PIN code.", "text",
  [W("feat", 'return "Enter a 6-digit PIN code."', "pinMsg() for an invalid PIN, #pin-out")])

# ------------------------------------------------------------------ colour index
E("colours.title", "Twenty-six colours, <em>three ranges</em>", "rich",
  [W("html", '<h2 class="h2" id="colours-h">Twenty-six colours, <em>three ranges</em></h2>', "h2#colours-h innerHTML")])
E("colours.sub", "Every colour comes in the same four sizes. Tap one to see it on the rug.", "text",
  [W("html", '<p class="sub">Every colour comes in the same four sizes.', "#colours .sechead p.sub")])
E("family.aria", "Colour family", "attr", [W("html", 'aria-label="Colour family"', "#fam[aria-label]")])
E("family.all", "All", "text", [W("html", 'data-fam="all">All <span class="n">26</span>', "#fam chip text node before span.n (count stays a number)")])
for key, en, snip in [("blues", "Blues", 'Blues <span class="n">'), ("greens", "Greens", 'Greens <span class="n">'),
                      ("pinks", "Pinks & reds", 'Pinks &amp; reds <span class="n">'),
                      ("earth", "Mustard & earth", 'Mustard &amp; earth <span class="n">'),
                      ("greys", "Greys & blacks", 'Greys &amp; blacks <span class="n">')]:
    E("family." + key, en, "text",
      [W("html", snip, "#fam chip[data-fam=%s] text node after span.cdots, before span.n" % key),
       W("feat", '%s: "%s"' % (key, en), "FAMNAME.%s (used in family.live.one)" % key)],
      "Colour-family filter label, not a product colour name, so it is translated.")
E("family.live.all", "Showing all {n} colours", "pattern",
  [W("feat", 'f === "all" ? "Showing all " + n + " colours"')],
  "#fam-live (sr-only, aria-live) after the visitor picks a family chip. n = 26.")
E("family.live.one", "Showing {n} colours: {family}", "pattern",
  [W("feat", '"Showing " + n + " colours: " + FAMNAME[f]')],
  "#fam-live. n = 4 or 6 (always plural); family = the translated family.* label.")
E("tile.aria", "{colour}, {range}, from {price}", "pattern",
  [W("feat", 'esc(t.n + ", " + RN[t.k] + ", from " + fp)')],
  "Colour-index tile button. colour stays English; range = RN long name (Multicolour Zigzag / Solid Premium / Striped Chenille), English; price like ₹249. The visible tile shows colour, the short range RS[k] ('Zigzag', 'Solid', 'Chenille', English) and price.from.")

# ------------------------------------------------------------------ shop / product cards
E("shop.title", "Three ranges, <em>four sizes</em>", "rich",
  [W("html", '<h2 class="h2" id="shop-h">Three ranges, <em>four sizes</em></h2>', "h2#shop-h innerHTML")])
E("shop.sub", "Pick a colour and the rug's panel takes it on. Tap a rug to look closer.", "text",
  [W("html", "<p class=\"sub\">Pick a colour and the rug's panel takes it on.", "#shop .sechead p.sub")])
E("prod.zig.desc", "Bold zigzag stripes in a soft microfiber pile. Bright enough for the main door, soft enough beside the bed.", "text",
  [W("html", '<p class="desc">Bold zigzag stripes', "#r-zig p.desc")])
E("prod.sol.desc", "A heavier, textured pile in one rich colour. Plush and absorbent, made for the bathroom door.", "text",
  [W("html", '<p class="desc">A heavier, textured pile', "#r-sol p.desc")])
E("prod.chen.desc", "Soft, ribbed chenille in classic stripes. The photo shows all ten colourways; pick yours by name.", "text",
  [W("html", '<p class="desc">Soft, ribbed chenille', "#r-chen p.desc")])
E("prod.new", "New", "text", [W("html", '<span class="tag">New</span>', "#t-chen span.tag (h3 'Striped Chenille' itself stays English)")])
E("prod.colour", "Colour:", "text",
  [W("html", '<p class="clab">Colour: <span data-colour>', ".prod p.clab text node before span[data-colour] x3", all_=True)],
  "Label before the colour name (the name inside span[data-colour] stays English).")
E("prod.zig.colours.aria", "Zigzag colours", "attr", [W("html", 'aria-label="Zigzag colours"', "#r-zig .swatches[aria-label]")], "Keep 'Zigzag' in English.")
E("prod.sol.colours.aria", "Solid colours", "attr", [W("html", 'aria-label="Solid colours"', "#r-sol .swatches[aria-label]")], "'Solid' is the range (Solid Premium): keep it in English.")
E("prod.chen.colours.aria", "Chenille colourways", "attr", [W("html", 'aria-label="Chenille colourways"', "#r-chen .chips[aria-label]")], "Keep 'Chenille' in English.")
E("prod.zig.sizes.aria", "Zigzag sizes", "attr", [W("html", 'aria-label="Zigzag sizes"', "#r-zig .sizes-c[aria-label]")], "Keep 'Zigzag' in English.")
E("prod.sol.sizes.aria", "Solid sizes", "attr", [W("html", 'aria-label="Solid sizes"', "#r-sol .sizes-c[aria-label]")], "Keep 'Solid' in English.")
E("prod.chen.sizes.aria", "Chenille sizes", "attr", [W("html", 'aria-label="Chenille sizes"', "#r-chen .sizes-c[aria-label]")], "Keep 'Chenille' in English.")
E("qty.less", "One less, {item}", "pattern",
  [W("html", 'aria-label="One less, ', "static .prod .stepper (item = Zigzag / Solid Premium / Chenille)", all_=True),
   W("html", "aria-label=\"One less, '+esc(x.colour+\" \"+P[x.k].name)+'\"")],
  "Stepper minus button. item = short range name on the product cards (static markup), or '{colour} {product}' on cart lines (core render()); all English.")
E("qty.more", "One more, {item}", "pattern",
  [W("html", 'aria-label="One more, ', "static .prod .stepper", all_=True),
   W("html", "aria-label=\"One more, '+esc(x.colour+\" \"+P[x.k].name)+'\"")],
  "Stepper plus button. Same item values as qty.less.")
E("cta.add.price", "Add to cart · {price}", "pattern",
  [W("html", 'add.innerHTML="Add to cart · "+inr(z[3]*s.q)+\' <span class="chev" aria-hidden="true">›</span>\'')],
  "Product-card add button (core upd()), price = unit price × quantity. Set with innerHTML: keep the trailing span.chev outside the translated text.")
E("prod.ask", "Ask if {colour} ({size}) is in stock", "pattern",
  [W("html", '>Ask if ', "static .prod .ask a[data-ask] x3", all_=True),
   W("feat", 'a.textContent = "Ask if " + label + " (" + z[0] + ") is in stock"')],
  "colour stays English (on Chenille it is the short chip label, e.g. 'Mustard'); size = M/H/L/XL. The WhatsApp message behind the link (and its data-copy text) stays English.")
E("prod.ask.copy.aria", "Copy the question about {colour} ({size})", "pattern",
  [W("feat", 'cp.setAttribute("aria-label", "Copy the question about " + label + " (" + z[0] + ")")')],
  "aria-label of the Copy button next to prod.ask; same colour/size values.")
E("common.copy", "Copy", "text",
  [W("html", 'data-askcopy data-copy=', ".prod .ask button.copy x3 (text 'Copy')", all_=True),
   W("html", 'aria-label="Copy WhatsApp number">Copy</button>', "#contact .clist and dialog#menu .menu-wa button.copy", all_=True),
   W("html", 'aria-label="Copy email address">Copy</button>', "#contact .clist button.copy")])
E("common.copied", "Copied", "text",
  [W("html", 'btn.textContent="Copied"', "core copyText(): temporary label on any [data-copy] button, restored after 1.5 s"),
   W("feat", 'btn.textContent = "Copied"', "features dlgCopy() (copy buttons inside dialogs)")],
  "The restore puts back whatever text the button had, so the translated label comes back correctly.")
E("prod.replies", "Replies 10am–8pm daily", "text", [W("html", '<small>Replies 10am–8pm daily</small>', ".prod .ask small x3", all_=True)])
E("chen.alt", "All ten Striped Chenille Mat colourways laid out in two columns", "attr",
  [W("html", 'alt="All ten Striped Chenille Mat colourways laid out in two columns"', "#chen-frame img alt")], "Keep 'Striped Chenille Mat' in English.")
E("chen.cap.all", "Showing all ten colourways", "text",
  [W("html", '<p id="chen-cap">Showing all ten colourways</p>', "static #chen-cap"),
   W("fx", 'cap.textContent = "Showing all ten colourways"', "fx.js allTen()")])
E("chen.cap.one", "Showing the {colour} colourway", "pattern",
  [W("fx", 'cap.textContent = "Showing the " + (sel0.textContent || "").trim() + " colourway"'),
   W("fx", 'cap.textContent = "Showing the " + (b.textContent || "").trim() + " colourway"')],
  "colour = the Chenille chip's text (short colour name, English, e.g. 'Mustard'). Read from the chip, so do not translate the chips.")
E("chen.see_all", "See all ten", "text", [W("html", 'id="chen-all" hidden>See all ten</button>', "#chen-all")])
E("shop.fine", "Weights are ±5%. Colours can look slightly different on screen and stock changes, so we confirm your colour on WhatsApp before dispatch.", "text",
  [W("html", '<p class="fine" style="margin-top:24px">Weights are', "#shop p.fine")])
E("toast.added", "Added {q} × {product} ({size})", "pattern",
  [W("html", 'toast("Added "+q+" × "+p.name+" ("+z[0]+")")')],
  "Toast (#toast, role=status) after any add to cart. q = quantity, product stays English, size = M/H/L/XL.")

# ------------------------------------------------------------------ fit tool
E("fit.eyebrow", '<span lang="gu">ઉંબરો</span> · at your doorstep', "rich",
  [W("html", '<p class="eyebrow"><span><span lang="gu">ઉંબરો</span> · at your doorstep</span></p>', "#fit p.eyebrow > span innerHTML")],
  "ઉંબરો (umbaro, threshold) is already Gujarati. In gu, the gloss after it can become a Gujarati phrase or be dropped; in hi, keep the Gujarati word with lang=\"gu\" or swap in देहरी (then change lang to hi).")
E("fit.title", "See it at <em>your door</em>", "rich",
  [W("html", 'id="fit-h" style="margin-top:16px">See it at <em>your door</em></h2>', "h2#fit-h innerHTML")])
E("fit.lead", "Pick a spot and a size. The mat, the doorway and a pair of feet are drawn to the same scale.", "text",
  [W("html", '<p class="lead">Pick a spot and a size.', "#fit p.lead")])
E("fit.where", "Where will it go?", "text", [W("html", '<p class="clab">Where will it go?</p>', "#fit p.clab")])
E("fit.spot.aria", "Spot", "attr", [W("html", 'aria-label="Spot" id="spots"', "#spots[aria-label]")])
E("fit.spot.main", "Main door", "text",
  [W("html", 'data-spot="main">Main door</button>', "#spots chip"),
   W("html", 'main:{label:"Main door"', "SPOTS.main.label (used in fit.spotlabel.door)")])
E("fit.spot.bath", "Bathroom door", "text",
  [W("html", 'data-spot="bath">Bathroom door</button>', "#spots chip"),
   W("html", 'bath:{label:"Bathroom door"', "SPOTS.bath.label (used in fit.spotlabel.door)")])
E("fit.spot.bed", "Bedside", "text", [W("html", 'data-spot="bed">Bedside</button>', "#spots chip")])
E("fit.spot.kitchen", "Kitchen counter", "text", [W("html", 'data-spot="kitchen">Kitchen counter</button>', "#spots chip")])
E("fit.floor", "Your floor", "text",
  [W("html", '<p class="clab">Your floor</p>', "#fit p.clab"),
   W("html", 'aria-label="Your floor" id="floors"', "#floors[aria-label] (attr)")])
for key, en in [("marble", "White marble"), ("kota", "Kota stone"), ("wood", "Wood"), ("tile", "Grey tile"), ("oxide", "Red oxide")]:
    E("fit.floor." + key, en, "text", [W("html", 'data-floor="%s">%s</button>' % (key, en), "#floors chip")],
      "Kota stone is a local floor stone from Kota, Rajasthan; keep 'Kota'." if key == "kota" else "")
E("fit.compare_all", "Compare all sizes", "text", [W("html", '<span class="tick" aria-hidden="true"></span>Compare all sizes</button>', "#cmpall text node after span.tick")])
E("fit.spotlabel.door", "{spot}, {w} in opening", "pattern",
  [W("html", '<p id="spotlbl">Main door, 36 in opening</p>', "static #spotlbl"),
   W("html", '$("#spotlbl").textContent=sp.kind==="door"?sp.label+", "+sp.w+" in opening":sp.label')],
  "Variants: 'Main door, 36 in opening' and 'Bathroom door, 30 in opening'. spot = fit.spot.main / fit.spot.bath (translated SPOTS label), w = 36 or 30 inches.")
E("fit.spotlabel.bed", "Bed, 75 in side", "text",
  [W("html", 'label:"Bed, 75 in side"', "SPOTS.bed.label, shown as-is in #spotlbl")], "75 is the drawn bed side in inches; keep the number.")
E("fit.spotlabel.kitchen", "Kitchen counter, 72 in", "text",
  [W("html", 'label:"Kitchen counter, 72 in"', "SPOTS.kitchen.label, shown as-is in #spotlbl")], "72 is the counter length in inches; keep the number.")
E("fit.plan.title", "Plan view of the chosen mat in front of the chosen spot, drawn to scale", "text",
  [W("html", '<title id="planlbl">', "svg title#planlbl (accessible name of the role=img plan)")])
E("fit.caption", "Adult feet, 10 in long, for scale. Mat shown in {range} · {colour}.", "pattern",
  [W("html", '<p id="fitcap">Adult feet, 10 in long, for scale. Mat shown in Solid Premium · Rust.</p>', "static #fitcap"),
   W("feat", 'cap.textContent = "Adult feet, 10 in long, for scale. Mat shown in " + RN[k] + " · " + c + "."')],
  "range = RN long name (Multicolour Zigzag / Solid Premium / Striped Chenille), colour = colour name; both English.")
E("fit.readout.fits", "<b>{size}</b> covers {mat} in of your {w} in doorway, with {spare} in to spare on each side.", "pattern",
  [W("html", 'txt=spare>=0?"<b>"+fit.size+"</b> covers "+d[0]+" in of your "+sp.w+" in doorway, with "+(spare/2)+" in to spare on each side."')],
  "Door spot, mat narrower than the opening. #readout (aria-live) is set with innerHTML, so the DOM holds <b>M</b> plus one text node starting ' covers …': a matcher that works on text nodes sees only the part after </b>. Keep <b>{size}</b> in translations. size = M/H/L/XL, mat = mat width (24/32/60), w = 36 or 30, spare = (w - mat) / 2 (3, 6, 2).")
E("fit.readout.over", "<b>{size}</b> is {over} in wider than a {w} in doorway, so it runs past the frame.", "pattern",
  [W("html", '"<b>"+fit.size+"</b> is "+(-spare)+" in wider than a "+sp.w+" in doorway, so it runs past the frame."')],
  "Door spot, mat wider than the opening. innerHTML, keep <b>. over = mat - w (2, 24, 30).")
E("fit.readout.bed", "<b>{size}</b> runs {mat} in along the {w} in side of the bed and is {depth} in deep, room for both feet.", "pattern",
  [W("html", 'txt="<b>"+fit.size+"</b> runs "+d[0]+" in along the "+sp.w+" in "+(fit.spot==="bed"?"side of the bed":"counter")+" and is "+d[1]+" in deep, room for both feet."')],
  "Bedside spot (fit.spot === 'bed', w = 75). The code builds one sentence with a 'side of the bed' / 'counter' switch; it is split into two full sentences here so the grammar can differ. innerHTML, keep <b>. depth = 16/20/24.")
E("fit.readout.counter", "<b>{size}</b> runs {mat} in along the {w} in counter and is {depth} in deep, room for both feet.", "pattern",
  [W("html", '(fit.spot==="bed"?"side of the bed":"counter")')],
  "Kitchen-counter spot (w = 72). Same expression as fit.readout.bed with the 'counter' branch.")
E("fit.suggest.main", "Suggested: Multicolour Zigzag L (20×32 in), 2 in to spare each side.", "text",
  [W("html", '<p id="fit-sugg">Suggested: Multicolour Zigzag L', "static #fit-sugg"),
   W("feat", 'main: { t: "Suggested: Multicolour Zigzag L', "SUG.main.t, shown in #fit-sugg by syncFitAdd()")],
  "Keep 'Multicolour Zigzag', L and 20×32 in.")
E("fit.suggest.bath", "Suggested: Solid Premium M or H (16×24 in), plush and absorbent for the bathroom door.", "text",
  [W("feat", 'bath: { t: "Suggested: Solid Premium M or H', "SUG.bath.t")], "Keep 'Solid Premium', M, H and 16×24 in.")
E("fit.suggest.bed", "Suggested: a 24×60 in XL runner along the side of the bed.", "text",
  [W("feat", 'bed: { t: "Suggested: a 24×60 in XL runner', "SUG.bed.t")])
E("fit.suggest.kitchen", "Suggested: a 24×60 in XL runner along the counter.", "text",
  [W("feat", 'kitchen: { t: "Suggested: a 24×60 in XL runner along the counter."', "SUG.kitchen.t")])
E("fit.add", "Add {range} {size} · {colour} · {price}", "pattern",
  [W("feat", 'btn.innerHTML = esc("Add " + FN[s.k] + " " + s.l + " · " + c.split(" & ")[0] + " · " + inr(z[3])) + \' <span class="chev" aria-hidden="true">›</span>\'')],
  "#fit-add label. range = FN short name (Zigzag / Solid Premium / Chenille), size = M/H/L/XL, colour = first part of the colour name; all English. Keep the trailing span.chev outside. fx.js tests this button's text for /Chenille/ and /Solid/ to pick the fly-to-cart range, so the range names must stay in Latin script.")
E("fit.add.initial", "Add {range} {size} · {price}", "pattern",
  [W("html", 'id="fit-add">Add Zigzag L · ₹349', "static #fit-add before features.js runs (range=Zigzag, size=L, price=₹349)")],
  "Only the pre-JS markup uses this shorter form; features.js replaces it with fit.add on load.")
E("fit.add.aria", "Add {range} {size} in {colour}, {price}", "pattern",
  [W("feat", 'btn.setAttribute("aria-label", "Add " + FN[s.k] + " " + s.l + " in " + c + ", " + inr(z[3]))')],
  "aria-label of #fit-add; colour is the full colour name.")
E("fit.shop_size", "Shop size {size}", "pattern",
  [W("html", 'id="fitgo" href="#shop">Shop size M', "static #fitgo"),
   W("html", '$("#fitgo").innerHTML="Shop size "+fit.size+\' <span class="chev" aria-hidden="true">›</span>\'')],
  "size = M/H/L/XL. innerHTML: keep the trailing span.chev outside.")

# ------------------------------------------------------------------ made
E("made.layer.pile", "<b>Pile</b> · polyester microfiber and BCF yarn", "rich",
  [W("html", '<li><b>Pile</b> · polyester microfiber and BCF yarn</li>', "#made ul.stk-l li innerHTML")], "BCF (bulked continuous filament) stays as is.")
E("made.layer.backing", "<b>Backing</b> · latex, anti-skid", "rich",
  [W("html", '<li><b>Backing</b> · latex, anti-skid</li>', "#made ul.stk-l li innerHTML")])
E("made.layer.floor", "<b>Your floor</b> · the backing holds it", "rich",
  [W("html", '<li><b>Your floor</b> · the backing holds it</li>', "#made ul.stk-l li innerHTML")])
E("made.title", "Made for <em>wet feet</em>", "rich", [W("html", '<h2 class="h2" id="made-h">Made for <em>wet feet</em></h2>', "h2#made-h innerHTML")])
E("made.text", "Step out of the shower, in from the monsoon or off a dusty road. The pile soaks it up and the backing holds the floor.", "text",
  [W("html", '<p>Step out of the shower, in from the monsoon', "#made .made-text p")])
E("spec.pile", "Pile", "text", [W("html", '<dt>Pile</dt>', "#made dl.specs dt")])
E("spec.backing", "Backing", "text", [W("html", '<dt>Backing</dt>', "#made dl.specs dt")])
E("spec.care", "Care", "text", [W("html", '<dt>Care</dt>', "#made dl.specs dt")])
E("spec.weight", "Weight", "text", [W("html", '<dt>Weight</dt>', "#made dl.specs dt")])
E("spec.pile.value", "Polyester microfiber and BCF yarn", "text", [W("html", '<dd>Polyester microfiber and BCF yarn</dd>', "#made dl.specs dd")])
E("spec.backing.value", "Latex, anti-skid", "text", [W("html", '<dd>Latex, anti-skid</dd>', "#made dl.specs dd")])
E("spec.weight.value", "300 g for a zigzag M, up to 1715 g for a solid XL", "text",
  [W("html", '<dd>300 g for a zigzag M, up to 1715 g for a solid XL</dd>', "#made dl.specs dd")],
  "'zigzag' and 'solid' are the ranges (keep in English); keep 300 g, 1715 g, M and XL.")

# ------------------------------------------------------------------ order
E("order.title", "Order on WhatsApp, <em>pay by UPI</em>", "rich",
  [W("html", '<h2 class="h2" id="order-h">Order on WhatsApp, <em>pay by UPI</em></h2>', "h2#order-h innerHTML")])
steps = [("Fill your cart", "Pick colour, size and quantity for each mat."),
         ("Add your address", "Name, phone, address and PIN code."),
         ("Pay by UPI", "Scan our QR or pay to panchaljelam@oksbi from any UPI app."),
         ("Send it on WhatsApp", "One tap sends the order. We confirm it the same day and dispatch.")]
for i, (t, d) in enumerate(steps):
    E("order.step%d.title" % (i + 1), t, "text", [W("html", "<li><b>%s</b>" % t, "#order ol.steps li:nth-child(%d) > b" % (i + 1))])
    E("order.step%d.text" % (i + 1), d, "text", [W("html", "<span>%s</span>" % d, "#order ol.steps li:nth-child(%d) > span" % (i + 1))],
      "Keep the UPI ID panchaljelam@oksbi exactly." if "oksbi" in d else "")
E("chat.today", "Today", "text", [W("html", '<span class="day">Today</span>', "#order .chat span.day (phone mock)")])
E("chat.sent", "Sent from the site", "text",
  [W("html", '<small>Sent from the site</small>', "#order .chat .bubble small (phone mock)")],
  "Only this small line is translated: the bubble text above it is an example WhatsApp order message and stays English, like real orders.")
E("chat.note", "An example of the message the site writes for you.", "text",
  [W("html", '<p class="note">An example of the message the site writes for you.</p>', "#order p.note (phone mock caption)")],
  "Translations may add that the message itself is sent in English.")

# ------------------------------------------------------------------ FAQ
E("faq.title", "Before you order", "text", [W("html", '<h2 class="h2" id="faq-h">Before you order</h2>', "h2#faq-h")])
faq = [("How do I order?", "Add mats to your cart, enter your delivery details, pay by UPI and send the order to us on WhatsApp with one tap. We confirm your order and payment the same day."),
       ("How do I pay?", "By UPI. Scan the QR at checkout or pay to panchaljelam@oksbi (Jelam Panchal) from GPay, PhonePe, Paytm or any UPI app. You can also pay to UPI number 90994 41429."),
       ("Do you deliver across India?", "Yes. Delivery is free within Vadodara. For the rest of India, delivery charges are extra and we confirm them with you on call."),
       ("Can I choose my colour?", "Yes. Colours depend on stock, so we confirm yours on WhatsApp before dispatch. If your colour is out of stock, we let you know before you pay."),
       ("How do I wash my mat?", "Our mats are machine washable and quick-drying, with an anti-slip latex backing. Message us if you want care tips for a particular mat."),
       ("Can I visit?", "Yes, by appointment in Vadodara. Message us on WhatsApp to set a time.")]
for i, (q, a) in enumerate(faq):
    E("faq.q%d" % (i + 1), q, "text", [W("html", "<summary>%s</summary>" % q, "#faq .qa details:nth-of-type(%d) summary" % (i + 1))])
    E("faq.a%d" % (i + 1), a, "text", [W("html", "<p>%s</p>" % a, "#faq .qa details:nth-of-type(%d) p" % (i + 1))],
      "Keep the UPI ID, the UPI number and the app names GPay, PhonePe, Paytm." if i == 1 else "")

# ------------------------------------------------------------------ contact + enquiry form
E("contact.title", "Ask Jelam", "text", [W("html", '<h2 class="h2">Ask Jelam</h2>', "#contact h2")], "Jelam is the owner's first name: transliterate (જેલમ / जेलम).")
E("contact.text", "Soft Steps is run by Jelam Panchal in Vadodara. Ask about colours, sizes or stock and you get a reply the same day.", "text",
  [W("html", '<p style="max-width:42ch">Soft Steps is run by Jelam Panchal', "#contact p")], "Keep 'Soft Steps'.")
E("field.email", "Email", "text",
  [W("html", '<span class="k">Email</span>', "#contact .clist .k"),
   W("html", 'for="o-email">Email <small>', "#drawer label[for=o-email] text node before small")])
E("contact.hours.label", "Hours", "text", [W("html", '<span class="k">Hours</span>', "#contact .clist .k")])
E("contact.visits.label", "Visits", "text", [W("html", '<span class="k">Visits</span>', "#contact .clist .k")])
E("contact.hours", "10am to 8pm, every day", "text", [W("html", '<span class="v">10am to 8pm, every day</span>', "#contact .clist .v")])
E("contact.visits", "By appointment in Vadodara", "text", [W("html", '<span class="v">By appointment in Vadodara</span>', "#contact .clist .v")])
E("copy.whatsapp.aria", "Copy WhatsApp number", "attr",
  [W("html", 'aria-label="Copy WhatsApp number"', "#contact .clist and dialog#menu .menu-wa button.copy", all_=True)])
E("copy.email.aria", "Copy email address", "attr", [W("html", 'aria-label="Copy email address"', "#contact .clist button.copy")])
E("contact.whatsapp", "Message Jelam on WhatsApp", "text",
  [W("html", '</svg>Message Jelam on WhatsApp</a>', "#contact a.wa-direct (text node after svg)")],
  "The pre-filled WhatsApp message behind this link stays English.")
E("enquiry.open", "Or write it here first", "text", [W("html", '<summary>Or write it here first</summary>', "details#enqd summary")])
E("enquiry.name", "Your name", "text", [W("html", 'for="e-n">Your name<input', "label[for=e-n] text node")])
E("field.phone", "Phone / WhatsApp", "text",
  [W("html", 'for="e-p">Phone / WhatsApp<input', "label[for=e-p] text node"),
   W("html", 'for="o-ph">Phone / WhatsApp<input', "#drawer label[for=o-ph] text node")])
E("enquiry.interest", "Interested in", "text", [W("html", 'for="e-s">Interested in<select', "label[for=e-s] text node")])
E("enquiry.message", "Message", "text", [W("html", 'for="e-m">Message <small>', "label[for=e-m] text node before small")])
E("enquiry.message.hint", "Sizes, colours, quantity, anything that helps", "text",
  [W("html", '<small>Sizes, colours, quantity, anything that helps</small>', "label[for=e-m] small")])
E("enquiry.option.larger", "A larger order", "text", [W("html", '<option>A larger order</option>', "#e-s option")],
  "The selected option's text goes into the English WhatsApp enquiry ('Interested in: ' + $('#e-s').value). Give the option value=\"A larger order\" before translating its text, so the message stays English. The three range options (Multicolour Zigzag Rugs, Solid Premium Rugs, Striped Chenille Mats) stay English and are not in the catalog.")
E("enquiry.option.unsure", "Not sure yet", "text", [W("html", '<option>Not sure yet</option>', "#e-s option")],
  "Same as enquiry.option.larger: add value=\"Not sure yet\" so the WhatsApp enquiry stays English.")
E("enquiry.error", "Add your name and phone number so we can reply.", "text",
  [W("html", '$("#eerr").textContent="Add your name and phone number so we can reply."', "#eerr (role=alert)")])
E("enquiry.submit", "Write my WhatsApp message", "text",
  [W("html", 'type="submit">Write my WhatsApp message <span class="chev"', "#enq button[type=submit] text node before span.chev")])
E("enquiry.done", "Your message is ready. Tap below to open WhatsApp and send it.", "text",
  [W("html", 'id="enqdone" hidden>Your message is ready. Tap below to open WhatsApp and send it.', "#enqdone text node before a#enqwa")])
E("enquiry.send", "Open WhatsApp", "text", [W("html", '</svg>Open WhatsApp</a>', "a#enqwa text node after svg")])

# ------------------------------------------------------------------ footer
E("footer.line", "Comfort in every step · Vadodara, Gujarat · © 2026", "text",
  [W("html", '<span>Comfort in every step · Vadodara, Gujarat · © 2026</span>', "footer .foot-row span")],
  "Close to hero.tagline but without the comma; keep © 2026.")
E("footer.contact", "WhatsApp +91 90994 41429 · 10am–8pm daily · UPI panchaljelam@oksbi", "text",
  [W("html", '<p class="mist">WhatsApp +91 90994 41429', "footer p.mist")],
  "Translate only the labels and '10am–8pm daily'; keep the phone number and UPI ID exactly.")

# ------------------------------------------------------------------ cart bar, dock, toasts
E("cartbar.finish", "Finish order #{oid}", "pattern",
  [W("html", '$("#cbn").textContent=pend?"Finish order #"+pend.oid:"View cart · "+n+(n>1?" items":" item")')],
  "#cbn in the floating cart bar while an order waits on the pay step. oid like SS-4K2Q9P.")
E("cartbar.view.one", "View cart · {n} item", "pattern", [W("html", '"View cart · "+n+(n>1?" items":" item")')], "Variant for n = 1 (the bar is hidden at 0).")
E("cartbar.view.other", "View cart · {n} items", "pattern", [W("html", '"View cart · "+n+(n>1?" items":" item")')], "Variant for n > 1.")
E("dock.add", "Add", "text", [W("html", '<button type="button" id="dock-add">Add</button>', "#dock-add (phone buy dock)")])
E("dock.add.aria", "Add {colour}, size {size}, to cart", "pattern",
  [W("feat", '$("#dock-add").setAttribute("aria-label", "Add " + c + ", size " + l + ", to cart")')],
  "colour stays English, size = M/H/L/XL. The dock text itself ('{colour} · {size}' and the price) needs no translation.")
E("toast.copy_failed", "Select and copy: {text}", "pattern",
  [W("html", 'toast("Select and copy: "+text)'),
   W("feat", 'SS.toast("Select and copy: " + text)')],
  "Shown when the clipboard is blocked; text is the copied content (phone, email, UPI ID, or an English message).")
E("toast.saved", "Saved {colour}", "pattern",
  [W("feat", '"Removed " + c + " from Saved" : "Saved " + c')], "Toast after tapping a heart; colour stays English.")
E("toast.unsaved", "Removed {colour} from Saved", "pattern",
  [W("feat", 'SS.toast(i >= 0 ? "Removed " + c + " from Saved"')], "Toast after un-saving; 'Saved' is the Saved colours list (saved.title).")

# ------------------------------------------------------------------ drawer: cart view
E("common.close", "Close", "attr",
  [W("html", 'id="dclose" aria-label="Close"', "#dclose"),
   W("html", 'data-close aria-label="Close"', "dialog#saved and dialog#compare button.x", all_=True),
   W("shop", 'data-zclose aria-label="Close"', "zoom viewer button.x")])
E("cart.title", "Your cart", "text",
  [W("html", 'tabindex="-1">Your cart</h2>', "h2#dtitle (static)"),
   W("html", 'titles={cart:"Your cart"', "titles.cart, set by view()")])
E("cart.title.details", "Delivery details", "text", [W("html", 'det:"Delivery details"', "titles.det -> h2#dtitle")])
E("cart.title.pay", "Pay & send", "text",
  [W("html", 'pay:"Pay & send"', "titles.pay -> h2#dtitle"),
   W("html", '<li>Pay &amp; send</li>', "#prog li:nth-child(3)")])
E("cart.step.cart", "Cart", "text", [W("html", '<li class="on">Cart</li>', "#prog li:nth-child(1)")])
E("cart.step.details", "Details", "text", [W("html", '<li>Details</li>', "#prog li:nth-child(2)")])
E("cart.line.each", "{size} · {price} each", "pattern",
  [W("html", "<small>'+esc(x.size)+' · '+inr(x.p)+' each</small>")],
  "Cart line. size = the stored English size string, e.g. 'M 16×24 in' or 'H 16×24 in half round' (see size.half); price = unit price.")
E("cart.remove", "Remove", "text",
  [W("html", "data-d=\"0\" aria-label=\"Remove '+esc(x.colour+\" \"+P[x.k].name)+'\">Remove</button>", "cart line button.rm"),
   W("feat", '>Remove</button>', "saved dialog [data-srm]")])
E("cart.remove.aria", "Remove {colour} {product}", "pattern",
  [W("html", "aria-label=\"Remove '+esc(x.colour+\" \"+P[x.k].name)+'\"")], "Cart line Remove button; colour and product stay English.")
E("cart.live.removed", "Removed {colour} {product}", "pattern",
  [W("html", '$("#cartlive").textContent=gone?"Removed "+x.colour+" "+P[x.k].name:x.colour+" "+P[x.k].name+", quantity "+x.q')],
  "#cartlive (sr-only, aria-live) after a line is removed.")
E("cart.live.quantity", "{colour} {product}, quantity {q}", "pattern",
  [W("html", 'x.colour+" "+P[x.k].name+", quantity "+x.q')], "#cartlive after + or − on a cart line.")
E("cart.empty", "Your cart is empty.", "text", [W("html", "'<div class=\"empty\"><p>Your cart is empty.</p>", "core render() empty state")])
E("cart.browse", "Browse mats", "text", [W("html", 'id="browse">Browse mats</button>', "core render() #browse")])
E("cart.subtotal", "Subtotal", "text", [W("html", '<span>Subtotal</span>', "#f-cart .rowx")])
E("cart.continue", "Continue to delivery details", "text",
  [W("html", 'id="go">Continue to delivery details <span class="chev"', "#go text node before span.chev")])

# ------------------------------------------------------------------ drawer: details view
E("details.name", "Full name", "text", [W("html", 'for="o-name">Full name<input', "label[for=o-name] text node")])
E("details.phone.placeholder", "10-digit mobile number", "attr", [W("html", 'placeholder="10-digit mobile number"', "#o-ph[placeholder]")])
E("details.address", "Address", "text", [W("html", 'for="o-ad">Address<textarea', "label[for=o-ad] text node")])
E("details.address.placeholder", "House / flat, street, area, landmark", "attr",
  [W("html", 'placeholder="House / flat, street, area, landmark"', "#o-ad[placeholder]")])
E("details.city", "City", "text", [W("html", 'for="o-ct">City<input', "label[for=o-ct] text node")])
E("details.pin", "PIN code", "text", [W("html", 'for="o-pin">PIN code<input', "label[for=o-pin] text node")])
E("details.pin.placeholder", "6 digits", "attr", [W("html", 'placeholder="6 digits"', "#o-pin[placeholder]")])
E("details.optional", "Optional", "text", [W("html", '<small>Optional</small>', "label[for=o-email] small")])
E("details.gift", "This is a gift", "text", [W("html", '<span>This is a gift</span>', "label[for=o-gift-on] span")])
E("details.gift.message", "Gift message", "text", [W("html", 'for="o-gift">Gift message <small>', "label[for=o-gift] text node before small")])
E("details.gift.hint", "It's sent to Jelam with your order on WhatsApp.", "text",
  [W("html", "<small>It's sent to Jelam with your order on WhatsApp.</small>", "label[for=o-gift] small")],
  "The gift note the shopper types is sent as they wrote it.")
E("details.delivery", "Delivery", "text",
  [W("html", '<legend class="bh">Delivery</legend>', "#v-det fieldset legend"),
   W("html", "'<div class=\"sl\"><span>Delivery</span>", "core summary() delivery row")])
E("details.vadodara", "Vadodara", "text", [W("html", 'value="vad" checked><span>Vadodara<small>', "radio[value=vad] span text node before small")],
  "Place name: transliterate (વડોદરા / वडोदरा).")
E("details.vadodara.note", "Free delivery", "text", [W("html", '<small>Free delivery</small>', "radio[value=vad] small")])
E("details.india", "Rest of India", "text", [W("html", 'value="out"><span>Rest of India<small>', "radio[value=out] span text node before small")])
E("details.india.note", "Delivery charges extra, confirmed on call", "text",
  [W("html", '<small>Delivery charges extra, confirmed on call</small>', "radio[value=out] small")])
E("details.summary", "Order summary", "text", [W("html", '<div class="bh">Order summary</div>', "#v-det .box .bh")])
E("summary.on_call", "Confirmed on call", "text", [W("html", '(dl()==="out"?"Confirmed on call":"Free")', "core summary() delivery row value (Rest of India)")])
E("summary.free", "Free", "text", [W("html", '(dl()==="out"?"Confirmed on call":"Free")', "core summary() delivery row value (Vadodara)")])
E("details.total", "Total", "text", [W("html", '<span>Total</span>', "#f-det .rowx")])
E("details.total.out", "{price} + delivery", "pattern",
  [W("html", '$("#tot").textContent=inr(total())+(dl()==="out"?" + delivery":"")')],
  "#tot when 'Rest of India' is chosen; otherwise #tot is just the price.")
E("error.name", "Add your name.", "text", [W("html", 'err="Add your name."', "#oerr (role=alert), order-btn validation")])
E("error.phone", "Enter a 10-digit Indian mobile number, like 98765 43210.", "text",
  [W("html", 'err="Enter a 10-digit Indian mobile number, like 98765 43210."', "#oerr")], "Keep the example number 98765 43210.")
E("error.address", "Add your full address with house number and area.", "text",
  [W("html", 'err="Add your full address with house number and area."', "#oerr")])
E("error.city", "Add your city.", "text", [W("html", 'err="Add your city."', "#oerr")])
E("error.pin", "Enter your 6-digit PIN code.", "text", [W("html", 'err="Enter your 6-digit PIN code."', "#oerr")])
E("error.email", "Check your email address, or leave it blank.", "text", [W("html", 'err="Check your email address, or leave it blank."', "#oerr")])
E("details.back", "Back", "text", [W("html", 'id="back">Back</button>', "#back")])
E("details.continue", "Continue to payment", "text",
  [W("html", 'id="order-btn">Continue to payment <span class="chev"', "#order-btn text node before span.chev")])

# ------------------------------------------------------------------ drawer: pay view
E("pay.order", 'Order <span id="oid"></span>', "rich",
  [W("html", '<p class="oidl">Order <span id="oid"></span></p>', "p.oidl innerHTML")],
  "#oid is filled by fillPay() with '#SS-…' via textContent. Translate the text node only (or re-run fillPay after swapping innerHTML), or the order number is lost.")
E("pay.hello", 'Almost done, <span id="oname"></span>', "rich",
  [W("html", '<h3 style="margin-top:6px">Almost done, <span id="oname"></span></h3>', "#v-pay h3 innerHTML")],
  "#oname gets the shopper's first name from fillPay(). Same caution as pay.order.")
E("pay.todo.pay", '<b>Pay <span id="payamt"></span></b> by UPI to the ID below.', "rich",
  [W("html", '<li><b>Pay <span id="payamt"></span></b> by UPI to the ID below.</li>', "#v-pay ol.todo li:nth-child(1) innerHTML")],
  "#payamt is filled by fillPay() (price, or pay.amount.out). Keep <b> and the empty span; their order may change for gu/hi word order.")
E("pay.amount.out", "{price} + delivery once confirmed", "pattern",
  [W("html", '$("#payamt").textContent=inr(o.t)+(o.out?" + delivery once confirmed":"")')],
  "#payamt for Rest of India orders; otherwise just the price.")
E("pay.todo.send", "<b>Send your order on WhatsApp</b> with the green button. Your order is confirmed when we reply.", "rich",
  [W("html", '<li><b>Send your order on WhatsApp</b> with the green button.', "#v-pay ol.todo li:nth-child(2) innerHTML")])
E("pay.upi_id", "UPI ID", "text", [W("html", '<div class="fine">UPI ID</div>', "#v-pay .upiid .fine")])
E("pay.upi_name", 'Jelam Panchal (Soft Steps) · or UPI number <span style="white-space:nowrap">90994 41429</span>', "rich",
  [W("html", '<div class="fine">Jelam Panchal (Soft Steps) · or UPI number <span style="white-space:nowrap">90994 41429</span></div>', "#v-pay .upiid .fine:last-child innerHTML")],
  "Only 'or UPI number' is translated; the name (transliterate if wished), brand and number stay.")
E("pay.copy_upi", "Copy UPI ID", "text", [W("html", 'data-copy="panchaljelam@oksbi">Copy UPI ID</button>', "#v-pay .upiid button[data-copy]")])
E("pay.open_upi", "Open a UPI app", "text", [W("html", 'id="upil" href="#">Open a UPI app</a>', "a#upil")])
E("pay.qr.show", "Show the UPI QR code", "text", [W("html", '<summary>Show the UPI QR code</summary>', "details#qrd summary")])
E("pay.qr.alt", "UPI QR code for Soft Steps", "attr", [W("html", 'alt="UPI QR code for Soft Steps"', "details#qrd img alt")], "Keep 'Soft Steps'.")
E("pay.qr.help", "Scan it from another phone. On this phone, long-press to save it, then use “scan from gallery” in GPay, PhonePe or Paytm.", "text",
  [W("html", '<p class="fine">Scan it from another phone.', "details#qrd p.fine")],
  "“scan from gallery” names a button in the UPI apps; if those apps show it in Gujarati/Hindi, quote their wording, otherwise keep the English in quotes.")
E("pay.sent", "<b>Sent it?</b> Jelam replies on WhatsApp to confirm your order and payment.", "rich",
  [W("html", '<p><b>Sent it?</b> Jelam replies on WhatsApp to confirm your order and payment.</p>', "#sentbox p innerHTML")])
E("pay.new_cart", "Start a new cart", "text", [W("html", 'id="newcart">Start a new cart</button>', "#newcart")])
E("pay.edit", "Change something in this order", "text", [W("html", 'id="editorder">Change something in this order</button>', "#editorder")])
E("pay.send", "Send order on WhatsApp", "text", [W("html", '</svg>Send order on WhatsApp</a>', "a#sendwa text node after svg")],
  "The order message it sends stays English.")
E("pay.help", 'WhatsApp not opening? <button type="button" class="link" id="copyorder">Copy the order text</button> and message +91 90994 41429 or email softsteps.home@gmail.com.', "rich",
  [W("html", '<p class="fine">WhatsApp not opening? <button type="button" class="link" id="copyorder">Copy the order text</button>', "#f-pay p.fine innerHTML")],
  "#copyorder has a click handler set once by the core: replace only the text nodes around it and the button's own text, never the whole innerHTML (or re-bind). Keep phone and email exactly.")
E("pay.copy_order", "Copy the order text", "text",
  [W("html", 'id="copyorder">Copy the order text</button>', "button#copyorder (inside pay.help)")],
  "Also part of pay.help. Listed on its own so the button can be translated in place and keep its click handler.")

# ------------------------------------------------------------------ saved dialog
E("saved.title", "Saved colours", "text", [W("html", '<h2 id="saved-t">Saved colours</h2>', "dialog#saved h2")])
E("saved.empty", "Tap ♡ on any colour to save it here.", "text", [W("html", '<p>Tap ♡ on any colour to save it here.</p>', "#saved-empty p")], "Keep the ♡ symbol.")
E("saved.ask", "Ask Jelam about these", "text", [W("html", '</svg>Ask Jelam about these</a>', "a#saved-ask text node after svg")],
  "The stock-check message it opens ('Hi Jelam, are these in stock?' + list) stays English.")
E("saved.family", "Send to family", "text", [W("html", 'id="saved-family" href="https://wa.me/" target="_blank" rel="noopener">Send to family</a>', "a#saved-family")],
  "The list it shares with family (familyText()) stays English.")
E("saved.copy", "Copy list", "text", [W("html", 'id="saved-copy">Copy list</button>', "#saved-copy")], "The copied list (familyText()) stays English.")
E("saved.size.aria", "Size for {colour}", "pattern", [W("feat", 'esc("Size for " + x.c)')], "Saved row size radiogroup; colour stays English.")
E("saved.add.aria", "Add to cart: {colour} {product}, {size}", "pattern",
  [W("feat", 'esc("Add to cart: " + x.c + " " + P[x.k].name + ", " + z[0])'),
   W("feat", '"Add to cart: " + x.c + " " + P[x.k].name + ", " + z[0])')],
  "aria-label of each Saved row's Add to cart; size = M/H/L/XL.")
E("saved.added", "Added ✓", "text", [W("feat", 'add.textContent = "Added ✓"', "saved row [data-sadd] for 1.5 s after adding")])
E("saved.remove.aria", "Remove {colour} {product} from Saved", "pattern",
  [W("feat", 'esc("Remove " + x.c + " " + P[x.k].name + " from Saved")')])

# ------------------------------------------------------------------ compare dialog
E("compare.caption", "Price and weight of every range in each size", "text",
  [W("feat", '<caption class="sr-only">Price and weight of every range in each size</caption>', "#cmp-table caption (sr-only)")])
E("compare.choose.aria", "Choose {product} size {size}, {price}", "pattern",
  [W("feat", 'esc("Choose " + P[k].name + " size " + z[0] + ", " + inr(z[3]))')],
  "Each price cell is a button that picks that range and size. product stays English. Column headers (Zigzag / Solid Premium / Chenille) and weights stay as they are.")
E("compare.note", "Weights are ±5%.", "text", [W("html", '<p class="cmpnote">Weights are ±5%.</p>', "dialog#compare p.cmpnote")])

# ------------------------------------------------------------------ zoom viewer + share (shop.js)
E("zoom.hint.touch", "Double-tap or pinch to zoom · swipe for the next colour", "text",
  [W("shop", '<p class="zhint" id="zoom-hint">Double-tap or pinch to zoom · swipe for the next colour</p>', "#zoom-hint (touch screens)")])
E("zoom.hint.mouse", "Click or press + to zoom · arrow keys for the next colour", "text",
  [W("shop", '$("#zoom-hint").textContent = "Click or press + to zoom · arrow keys for the next colour"', "#zoom-hint (mouse / no touch)")],
  "'+' is the keyboard key and stays as is.")
E("zoom.in.aria", "Zoom in", "attr", [W("shop", 'id="zoom-in" aria-label="Zoom in"', "#zoom-in (button shows +)")])
E("zoom.out.aria", "Zoom out", "attr", [W("shop", 'id="zoom-out" aria-label="Zoom out"', "#zoom-out (button shows −)")])
E("zoom.try", "See it at your door", "text",
  [W("shop", "DOOR + 'See it at your door</button>'", "#zoom-try text node after the door svg (hidden unless the photo try-on, SS.tryon, is loaded)")],
  "Same words as the fit-tool heading (fit.title) without the <em>; keep the two translations consistent.")
E("zoom.view.aria", "View {product} in {colour} larger", "pattern",
  [W("shop", 'return "View " + P[k].name + " in " + curColour(card) + " larger"'),
   W("shop", 'sl ? "View " + P[sl.k].name + " in " + sl.c + " larger"')],
  "aria-label of the corner expand button (.zopen) on each Zigzag/Solid card panel and on the hero rug; renamed when the colour or slide changes. product and colour stay English.")
E("zoom.view.aria.fallback", "View this rug larger", "attr",
  [W("shop", ': "View this rug larger"', "hero .zopen aria-label when no slide is known")])
E("zoom.choose", "Choose this colour", "text", [W("shop", 'id="zoom-go">Choose this colour</button>', "#zoom-go")])
E("share.aria", "Share this {product} on WhatsApp", "pattern",
  [W("shop", 'a.setAttribute("aria-label", "Share this " + P[k].name + " on WhatsApp")')],
  "Share icon added to each product card. product stays English. The shared message (shareText()) stays English.")

# ------------------------------------------------------------------ language switch (lang.js, added while this catalog was built)
if TEXT.get("lang"):
    E("lang.done", "Showing the site in English", "text",
      [W("lang", "SS.toast(d.done)", "lang.js set(): toast after switching to gu or hi, text taken from the dictionary's own `done` field")],
      "No English source text: English never shows this toast. Each dictionary supplies its own confirmation naming its language ('Showing the site in Gujarati' / '... in Hindi'). The switch labels English / ગુજરાતી / हिन्दी and the group label 'Language / ભાષા / भाषा' are written in all three scripts on purpose (data-noi18n) and are not in the catalog.")

# ------------------------------------------------------------------ output
seen_ids, seen_en = {}, {}
for e in ENTRIES:
    if e["id"] in seen_ids:
        ERR.append("duplicate id " + e["id"])
    seen_ids[e["id"]] = 1
    key = e["en"]
    if key in seen_en and e["kind"] != "pattern" and e["id"].split(".")[0] != "hero":
        ERR.append("duplicate en %r: %s and %s" % (key, seen_en[key], e["id"]))
    seen_en.setdefault(key, e["id"])
    if e["kind"] == "pattern" and not re.search(r"\{[a-z]+\}", e["en"]):
        ERR.append("pattern without placeholder: " + e["id"])

if ERR:
    print("\n".join(ERR))
    sys.exit(1)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(ENTRIES, f, ensure_ascii=False, indent=1)
    f.write("\n")
from collections import Counter
print(len(ENTRIES), dict(Counter(e["kind"] for e in ENTRIES)))
