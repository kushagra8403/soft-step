# Soft Steps: premium palette research (20 Oct 2026)

**How this was gathered.** Brand hex codes come from each brand's **live stylesheet**, fetched on 20 Oct 2026. I counted how often each colour appears and read the rule it sits in (button, body, background). Counts are a rough guide to how much a colour is used, not a pixel measurement. Contrast ratios use WCAG 2.x. Colour distance is ΔE in OKLab ×100. On that scale, CSS Color 4 treats **2** as the "just noticeable difference" ([W3C CSS Color 4, gamut mapping, JND = 0.02](https://www.w3.org/TR/css-color-4/#binsearch)). Pinterest and Instagram pages are behind a login, so the trend evidence uses Pinterest's own published palette page plus design press. Gaps: Sarita Handa and Aesop blocked the fetch. Good Earth's page builds in the browser and exposed only `theme-color #ffffff` ([goodearth.in](https://www.goodearth.in/)). Nicobar's CSS returned 404. therugrepublic.com now redirects to a domain-sale page.

---

## 1. Reference palettes

| # | Palette (source) | Hex codes | Why it reads premium |
|---|---|---|---|
| 1 | **Pinterest Palette 2026** ([business.pinterest.com](https://business.pinterest.com/en-gb/pinterest-palette/)) | Cool Blue #D7EFFF · Jade #AEB8A0 · Plum Noir #351E28 · Wasabi #E9F056 · Persimmon #FF5C34 | Designers treat Jade and Plum Noir as "the neutrals, muted and sophisticated", and the brights as "pops" used in small amounts ([Homes & Gardens](https://www.homesandgardens.com/interior-design/pinterest-palette-2026)). Plum Noir is pitched as "a sophisticated alternative to classic black" ([Kassatex](https://blog.kassatex.com/design/2026-pinterest-palette/)). |
| 2 | **Ruggable**, a washable-rug brand and the closest product match to Soft Steps ([CSS](https://ruggable.com/_next/static/chunks/0edac1131e383561.css)) | ink #1A1817 · #282521 · beige-light #F6F4EF · beige-medium #EDE9DC · beige #EBE8DD · **primary button terracotta #934B32** (hover #9E5546) · sage #657567 | Text is a warm near-black, not #000. The backgrounds are a three-step ladder of barely tinted beiges. One earthy colour is used only for the main button. |
| 3 | **Loloi Rugs** ([CSS](https://www.loloirugs.com/cdn/shop/t/315/assets/theme-bundle.css?v=91501462944813878381791225922); theme-color #7796A8 on [loloirugs.com](https://www.loloirugs.com/)) | text #484949 / #292728 · oat #F8F6F0 · cream #F4EDE3 · almond #E5D8C6 · **navy #1E4961** (filled buttons, white text) · orange #A63C1C · forest-green #3D4126 | Neutrals far outnumber colour: #484949 appears 473 times against navy's 101. Colours carry material names (oat, almond, vanilla). One deep anchor colour does the work. |
| 4 | **Jaipur Rugs**, Indian handmade rugs ([global-variable.css](https://d36ppzbkbnj66t.cloudfront.net/jrc2026/assets/css/global-variable.css), linked from [jaipurrugs.com](https://www.jaipurrugs.com/us/)) | #000000 · **primary #C29C96** (dusty blush) · #F6F4F2 · #707070 · #818181 · success #1CB061 | Black plus one soft heritage pink. Buttons are blush and turn black on hover. Checkboxes use a near-neutral #F6F4F2. Corners are square. |
| 5 | **Raw Mango**, Indian heritage luxury ([style.css](https://rawmango.com/cdn/shop/t/53/assets/style.css?v=96180608202894141101784627646)) | **bottle green #084D2D** (69 uses) · #00552E · #006838 · warm white #FFFBFA · #000 · grey #BFBFBF · accent pink #F82262 (9 uses) | The clearest case of a single deep anchor colour. Everything else is white or black, and the loud pink is rare. |
| 6 | **Armadillo**, artisan rugs ([CSS](https://us.armadillorugs.com/cdn/shop/t/27/assets/theme.DTBvcaB0.min.css?v=20269387009160404631791938685)) | #000 · #FFF · #F8F5EF · #F0EEEA · #F8F7F5 · deep brown #2F2822 · muted #A65F5F, #5E8A64, #B88A3C | The interface has almost no colour, so the rug photos supply all of it. The few accents are dusty and muddied. |
| 7 | **Aesop**, minimal retail (third-party token extraction, [webdesignhot](https://www.webdesignhot.com/design.md/aesop/)) | ivory #FFFEF2 · charcoal #333333 · sand #F7ECDD (inset panels) · terracotta-leather #945C26 | A warm canvas with ink that is never pure black. Square corners, no shadows or gradients, no saturated accent. |
| 8 | **Cold Picnic**, minimalist rugs and bath mats ([theme.css](https://coldpicnic.com/cdn/shop/t/50/assets/theme.css?v=32713311691826838931784606416)) | all text **#402600** (dark brown) on #FFFFFF · #111 · accents #D23434, #327E5C, #EE7E4C | Warmth comes from brown text rather than a cream background, so product colours stay accurate on white. |
| 9 | **Ikai Asai**, Indian craft editorial ([main.css](https://ikaiasai.com/wp-content/themes/ikaisai/css/main.css?v=1791461492)) | ink #080707 · ground #F9F9F9 · #747474 · taupe #AFA79D · sand #EBE3D7 · #FCFBF6 | A gallery-white page with sand and taupe as quiet secondary tones. Craft photography provides the colour. |

---

## 2. Recurring principles, with evidence

**a. Mostly neutral, very little accent.** The 60-30-10 rule (base, secondary, accent) "originally came from interior design". Its 10% accent is saved "to draw the eye where we want it", meaning the calls to action ([Paige Brunton](https://www.paigebrunton.com/blog/60-30-10-color-rule-for-web-designers/)). India's interiors trade applies 70-20-10 to collections: 70% proven, 20% evolving, 10% bold ([India Interior Trend Report author, Sourcing Hardware](https://sourcinghardware.net/indian-interior-colour-trends-why-warmer-palettes-are-taking-over/)). A 2026 web-trends guide gives the same advice: use "exactly one accent… reserve it for interactive elements", because "the moment the accent appears everywhere, it stops working" ([barnimages](https://barnimages.com/blog/tips/web-design-trends/)). The live sites match: Raw Mango uses green 69 times and pink 9 times. Loloi's neutrals outnumber its navy roughly 5:1.

**b. Whites are warm but barely tinted.** The OKLCH chroma of the premium backgrounds measured here is **0.003–0.009**: Jaipur #F6F4F2 0.003, Ruggable #F6F4EF 0.007, Pantone Cloud Dancer #F0EEE9 0.007, Loloi oat 0.008, Armadillo 0.009. Soft Steps' current `--kora` #F2EADC is **0.0205**, two to six times more tinted. The creamier tones (Aesop sand 0.023, Loloi cream 0.015) appear only on secondary panels. Warm whites suit luxury, but they "tint everything slightly yellow, which flatters some colours but distorts others". A warm image on a cool background also looks mismatched ([Made Good Designs](https://madegooddesigns.com/warm-white-vs-cool-white/)).

**c. One deep anchor colour, and it is not a product colour.** Raw Mango uses bottle green, Loloi navy #1E4961, and Ruggable terracotta for the call to action. Jaipur uses black plus blush. The anchor marks buttons, the footer and selected states, and it must stay clear of the products. Soft Steps fails this test today: **`--neel` #1F2E57 is ΔE 1.9 from the Navy & cream rug (#1E2853)**, below the noticeable threshold, and 2.4 from Navy & white. `--kumkum` is 5.7–6.9 from Burnt-orange, Rust and Berry. `--haldi` is 6.4 from Mustard & tan.

**d. Product photos are the hero.** Neutral backgrounds "let products dominate visually" ([Adobe Stock guide](https://stock.adobe.com/learn/product-photography-backgrounds-guide)). A peer-reviewed study tested products on grey backgrounds from 5% to 90% black ([Howell & Schifferstein 2019, BYU](https://scholarsarchive.byu.edu/facpub/3303)). It found:
- Background darkness had little or no effect on perceived colour. The exception was orange (carrot), which looked lighter and yellower on near-black.
- Attractiveness and expensiveness ratings were highest on the 90%-black background.
- Grey backgrounds presented assortments with "a variety of hues" more attractively than coloured backgrounds.

For 26 rug colours, that argues for a near-neutral frame. Dark backgrounds suit single-product "lamp-lit" moments, but orange rugs (Burnt orange, Rust, Mustard & tan) should not sit on near-black.

**e. Colour blocking: tonal, not loud.** Flat, hard colour blocks belong to 2026's neo-brutalist style, which pairs them with "thick borders, hard shadows" ([barnimages](https://barnimages.com/blog/tips/web-design-trends/)). That style is too raw for a soft-goods brand. Interior designers instead describe "colour capping", meaning variations of one hue across a space ([Elle Decor via Interior Daily](https://www.interiordaily.com/article/9780117/elle-decor-predicts-the-biggest-colour-trends-for-2026/)). Pinterest tells brands to "go all-in on one trending colour for a bold, monochrome look" ([Pinterest](https://business.pinterest.com/en-gb/pinterest-palette/)). Soft Steps' painted rug panels already do this, which is the site's most Pinterest-like idea.

**f. Gradients and grain.** Grain hides gradient banding and "makes flat digital colour feel physical". Use "less than you think". Grain shows best in mid-tones, disappears on white, crushes on black, and heavy WebP or JPEG compression smears it ([Instant Gradient](https://instantgradient.com/blog/grainy-gradients)). Grainy blur is "one of the most recognizable aesthetics in 2026 design" ([Kittl](https://www.kittl.com/blogs/?p=18380)). The current static grain at 0.06 on the dye panels is the right use. Do not add grain to the light page background.

**g. Dark sections.** WGSN says "darks remain important as consumers turn to colors with longevity" ([MR Magazine on WGSN/Coloro](https://mr-mag.com/wgsn-and-coloro-announce-colour-of-the-year-2026-transformative-teal-and-the-key-colours-for-a-w-26-27/)). Benjamin Moore's 2026 colour is an espresso-charcoal ([Silhouette AF-655](https://www.benjaminmoore.com/en-us/paint-colors/color/af-655/silhouette)). Dark grounds need their own care: avoid pure black, "reduce saturation… since bright colors vibrate against dark backgrounds", and note that photos that "sing on white often need a subtle border on dark" ([barnimages](https://barnimages.com/blog/tips/web-design-trends/)). Use dark as punctuation (footer, try-on, one feature section), not as a theme.

---

## 3. 2026 colour trends for Indian homes

| Forecast | Colours | Relevance to Soft Steps |
|---|---|---|
| Pantone CoY 2026 **Cloud Dancer** 11-4201, the first white since the programme began in 1999 ([Pantone](https://www.pantone.com/color-of-the-year/2026); [Style Rave](https://www.stylerave.com/pantone-color-of-the-year-2026/); hex #F0EEE9 per [Blend](https://www.blendnow.com/blog/pantone-color-of-the-year-cloud-dancer)) | "balances warm and cool undertones, avoiding the sterility" of bright whites | Supports a calmer, less yellow page background. |
| **Asian Paints Moonlit Silk**, ColourNext 2026 ([ThePrint/ANI](https://theprint.in/ani-press-releases/asian-paints-unveils-moonlit-silk-the-colour-of-the-year-2026/2862521/)) | "a warm, luminous, neutral green"; "a quieter form of luxury". No official hex was published. | India's own forecast points to calm, soft warmth over shine. |
| **WGSN/Coloro Transformative Teal** 092-37-14, plus A/W 26/27 key colours ([WGSN](https://www.wgsn.com/en/blogs/colour-year-2026-transformative-teal), [MR Mag](https://mr-mag.com/wgsn-and-coloro-announce-colour-of-the-year-2026-transformative-teal-and-the-key-colours-for-a-w-26-27/)) | blue-green dark; Wax Paper (creamy off-white), Cocoa Powder ("champions art, craft and handmade"), Fresh Purple, Green Glow | Teal is an anchor colour none of the 26 rugs uses. Cocoa supports the Cocoa rugs. |
| **Behr Hidden Gem** #596D69, "smoky jade" ([Behr](https://www.behr.com/colors/color-detail/n430-6a)) | muted blue-green | Same direction as teal and jade. |
| **India Interior Trend Report 2026–27** ([Sourcing Hardware](https://sourcinghardware.net/indian-interior-colour-trends-why-warmer-palettes-are-taking-over/)) | terracotta, mocha, warm beige, muted clay, olive, sage, walnut, deep greens, brass, "heritage blues" | Much of the Soft Steps range (Cocoa, Olive, Rust, Forest, Navy) already sits in this list. Homeowners want interiors that feel "warmer, softer and more personal", which "does not mean returning to loud colours". |
| Elle Decor 2026 ([Interior Daily](https://www.interiordaily.com/article/9780117/elle-decor-predicts-the-biggest-colour-trends-for-2026/)) | browns, rusts and greens replace grey; dusty jewel tones; pairs such as periwinkle + chocolate | Good framing for the door + bath **pairs** section. |
| Next year: WGSN/Coloro 2027 **Luminous Blue**, with Energy Orange, Pop Pink, Meadowland Green, Clay ([WGSN](https://www.wgsn.com/en/wgsn/press/press-releases/wgsn-and-coloro-reveal-colour-year-2027-luminous-blue-and-s-s-27-key)) | lapis-like blue | Blue rugs stay current. Do not rebuild the UI around one forecast colour. |

India's dye heritage supports blue-greens: pomegranate followed by indigo "gives a range of greens" ([Daughters of India](https://be.daughtersofindia.net/pages/natural-dyes-of-india)).

**Fads to avoid in the site interface** (these are product colours; keep selling them):
- Electric chartreuse (Wasabi #E9F056, Green Glow). Pinterest itself positions these as accents.
- "Laboratory and artificial" brights, which "can feel harsh and fleeting".
- Saturated mustard, "overused and overproduced", and overdone forest green ([Homes & Gardens](https://www.homesandgardens.com/interior-design/outdated-color-trends-2026)).
- All-greige or all-white "stark, gallery-like" schemes, and colour-and-pattern "drenching" that "is starting to feel visually exhausting" ([AOL / Martha Stewart](https://www.aol.com/articles/8-home-d-cor-trends-170000505.html)).

Pinterest also reports that trends now move "four times" faster than seven years ago ([Nordroom on Pinterest Predicts](https://www.thenordroom.com/pinterest-home-decor-color-trends-2026/)). That is a reason to keep the interface neutral and let the rugs carry the trend colours.

---

## 4. Recommendations for Soft Steps

**Keep**
- True-colour dye panels as inset rounded fields on a light ground, with the fixed fg table, vignette, lamp pool and 0.06 grain. This is colour capping and product-first at once.
- A warm near-black ink rather than #000, as Ruggable, Aesop and Cold Picnic do.
- WhatsApp green only on WhatsApp buttons (white on #1A7349 is 5.85:1).
- AA contrast discipline and the single light theme.

**Change**
1. **Lower the page-background tint.** Move `--kora` #F2EADC (C 0.0205) to about **#F5F2EC** (C 0.0086). Move `--chalk` to **#FCFBF8** (C 0.0041). Keep one creamier panel tone, **#ECE6DC** (C 0.015), for the order panel and steppers. Hairline `--sut` #DDD0BB (C 0.032) becomes **#E2DACB**. The rugs then read truer, especially Blush, Grey and Aqua.
2. **Stop using navy as the house colour.** It is the same colour as two products (ΔE 1.9 and 2.4), so a Navy hero and its button merge, and the indigo fit section, night footer and Navy rug cards blur into one block of blue. Choose an anchor at ΔE 7 or more from every rug (options below) and re-tone `--neel`, `--neel-2` and `--night` together.
3. **Make kumkum and haldi functional only.** Kumkum is for the cart badge, errors and the saved heart. Haldi is for focus and progress on dark grounds. Both sit within ΔE 7 of rug colours, so never put the "New" tag or italic accents on Rust, Burnt-orange, Berry or Mustard & tan panels.
4. **Limit dark to three moments:** footer, try-on and zoom overlays, and one feature section. Never put the orange-family rugs on near-black.
5. **Change the Zigzag default.** It currently defaults to Forest green, a colour designers call overdone. Olive or Cocoa fit the 2026 Indian list. This only changes which colour shows first; every rug stays.

**Three candidate directions** (all pairs checked to WCAG 2.x)

**A. "Kora Quiet": espresso anchor, warm-minimal, the lowest-risk option.**
- Tokens: ground #F5F2EC, card #FCFBF8, panel #ECE6DC, ink #1F1B18, muted #5F5750, border #857A70, **anchor and dark sections espresso #2A2420**, deep #1C1815, text-on-dark #C9BFB3, haldi #E3A62F on dark only, eyebrow-on-light #7A5418, kumkum #A92E1F as the only red.
- Contrast: ink/ground 15.30, muted/ground 6.34, muted/panel 5.70, border/ground 3.75, chalk/espresso 14.79, haldi/espresso 7.12, mist/espresso 8.45, eyebrow 6.05, kumkum/ground 6.07.
- The anchor's nearest rug is ΔE 9.3 away, against 1.9 for today's neel.
- Lineage: Ruggable, Armadillo, Aesop, Cold Picnic and Benjamin Moore Silhouette. This is the cleanest frame for 26 colours, and an espresso pill button echoes Jaipur's black secondary buttons.

**B. "Neel-Hara": deep indigo-teal anchor, heritage dye, the most distinctive option.**
- Tokens: anchor **#123E44** (buttons, fit section, selected states), dark sections and footer **#0B2B2F**, text-on-dark #B7CCCB, haldi on anchor, the same light grounds as A.
- Contrast: chalk/anchor 11.29, chalk/dark 14.49, haldi/anchor 5.43, haldi/dark 6.97, mist/anchor 6.96, anchor as text on ground 10.45 and on panel 9.41.
- The nearest rug is Black solid at ΔE 7.1. It shares Aqua's hue angle (about 207° against 210°) but is far darker, so the two harmonise rather than clash.
- Story: indigo dyed over yellow gives green, which keeps the dye-bath concept. It rides 2026's teal, jade and green forecasts (Transformative Teal, Hidden Gem, Pinterest Jade, Moonlit Silk) without copying any one of them.
- Model: Raw Mango's single deep-green anchor. Check before adopting: a Forest-green rug panel next to the teal fit section.

**C. "Raat": plum-noir evening luxe, the boldest option.**
- Tokens: ground #F7F3EE, anchor **#2E1F26** (a lifted Plum Noir), dark #221820, champagne #E5CFA6 accent on dark, mist #D2C3C6.
- Contrast: chalk/anchor 15.14, champagne/anchor 10.30, champagne/dark 11.32, mist/dark 10.14, haldi/dark 8.00, anchor text on ground 14.18. The nearest rug is ΔE 8.5 away.
- It has the strongest Pinterest/Instagram "villain-era" mood, and the BYU study links dark grounds with higher perceived expense.
- Risks: plum flatters the Blush, Berry and pink rugs but adds a red cast beside Rust, Burnt-orange and Mustard. Pinterest pitches Plum Noir as "your villain era" ([Pinterest](https://business.pinterest.com/en-gb/pinterest-palette/)), a strongly 2026 mood, and trends now turn over four times faster, so this option will date fastest.

**Pick:** A as the base. B if Jelam wants an ownable brand colour that WhatsApp and Instagram posts can repeat. C only as a seasonal or festive skin. Whichever is chosen, `theme-color` should keep following the hero rug, and the anchor should never be reused as a rug-panel colour.
