# Soft Steps: colour audit of the current site

Audited build: `scratchpad/next/` (softsteps.html + fx/features/touchfx/shop/tryon/pairs/lang .js). Nothing in `next/` or `site/` was changed.
Method: (1) every colour literal was pulled out by script and sorted by hand; (2) the browser recorded the computed colour of every visible element at 390px and 1440px; (3) every text node had its contrast measured in the default state, in each overlay, across all 26 painted rug colours and across the 6 hero slides; (4) screenshots were taken at 390×844 @2x and 1440×900, and every one was looked at.

Working files are in `scratchpad/design2/tools/`: `all.tsv` (352 raw literals), `contrast.json`, `census.json`, `ratios.py`, `shots.cjs`, `contrast.cjs`, `census.cjs`, `rhythm.cjs`. Screenshots are in `scratchpad/design2/audit/`.

---

## 0. Headline findings

1. **Each brand accent is almost the same colour as one of the rugs.** Neel #1F2E57 vs the Navy & cream rug #1E2853 is 1.07:1. Kumkum #A92E1F vs Rust #8A3A1A is 1.15:1, and vs Berry 1.27:1. Haldi #E3A62F vs Mustard & tan #D3913F is 1.24:1. So the UI colour never stands apart from the product. The worst case is the Solid card: a Royal blue field sits directly above neel buttons and a neel selected-size circle (1.28:1). The two blues are close but not equal, so it looks like a mistake.
2. **The neutral steps are too small.** Chalk on kora is 1.12:1 and kora-2 on kora is 1.12:1. An "audit round" removed the card shadows (`softsteps.html:797`), so product cards, the contact card, the made panel and the order panel are now separated from the page only by that 1.12 step. On a bright mid-range Android LCD the page reads as one flat beige sheet.
3. **There are five darks with no clear roles.** They are kajal #1B1D2B (cart bar, dock), night #141B36 (footer, drawer, menu, zoom), neel #1F2E57 (buttons, fit), neel-2 #24356A, and the try-on stage #0E1330. They differ by only 1.01 to 1.28:1. Over the night footer the kajal cart bar is 1.01:1, so it merges into it. Over the neel fit section it is 1.26:1 (`p-x-cbar-over-footer.png`, `p-x-cbar-over-fit.png`).
4. **Real contrast failures only appear after a colour is picked.** The default state passes AA everywhere: 0 of 402 text nodes fail at 390px and 0 of 496 at 1440px. The colour sweep does find failures:
   - **Chenille caption** (`#chen-cap`, `.chen-cap{color:var(--kajal)}` at line 435, link `var(--neel)` at line 437) sits straight on the field because the mat-board was made transparent at line 801. It **fails on 8 of 10 Chenille colours**: 1.18:1 on Navy, 1.66 on Black, 1.75 on Forest, 1.93 on Blue, 2.52 on Grey. The "See all ten" link is down to **1.07:1** on Navy (`p-x-chen-navy-caption.png`).
   - **Hero size labels** (`.field .sz[data-d]::after{opacity:.78}`, line 179, 11px) give 4.03:1 on Aqua and 4.32:1 on Mustard & tan. They would also fail on Solid Mustard (4.00) and Grey (4.25) if those became slides.
   - **Input placeholder** `#7d7064` (line 585) is 4.496:1 on chalk, just under 4.5.
   - **Try-on `.td` separator** at opacity .6 is 4.41:1.
   - **Zoom swatches** on night: Royal 1.63, Navy 1.20, Black 1.68, and the 25% chalk ring is 2.19, so the controls can't be told apart (below the 3:1 non-text minimum).
5. **Colour is spent mostly in the top half of the page.** Hero, then 26 tiles, then 3 painted cards, then 8 two-colour pair cards: about 45 coloured blocks before #fit. After #fit comes a **3,630px beige stretch on phone** (made, order, faq, contact; 30% of the page, 4.3 screens) before the night footer.
6. **The accents feel left over rather than designed in.** Italic H2 accents on light lost their colour (`.h2 em{color:inherit}`, line 795). `--haldi-deep` is never rendered anywhere (dead token). Kumkum appears only as order numerals, FAQ "+" rings, the "New" tag, badges and the footer dot. Haldi appears only inside #fit and the dark overlays. None of them sets up a repeating pattern down the page.
7. **The solid-rug hero slides are tone-on-tone.** Rust on Rust, Aqua on Aqua and Royal on Royal: the rug is only held off its own field by a 5px drop-shadow edge. On the light fields (Blush 1.34:1, Mustard & tan 2.23, Aqua 2.45 vs kora) the hero card loses its outline against the page, and a blue-grey 48px shadow becomes its only edge, which looks dirty under pink and mustard.
8. **The dark viewing surfaces tint the product.** Zoom and try-on show rugs on saturated navy (#141B36 / #0E1330). The SPEC's own rule is that "colour fidelity depends on the kora ground", yet the two places where people judge colour most closely are navy. Blue and black rugs lose their edges there, and warm rugs look more orange.
9. **Off-token colours.** There are three greens (#1A7349 token, #155f3c hover at line 132, #1a7f4e fallback at line 878), two whites (chalk and #fff on hovers and WhatsApp text), three warm lamp tints, two hover washes, three "glass on dark" alphas (.14/.15/.16) and three ring alphas on dark (.45/.55/.6). shop.js and tryon.js re-type the whole dark palette as literals: about 45 hard-coded #141B36 / #FBF7F0 / #E3A62F values.
10. **Correction to the brief:** the Chenille Grey stripe is #5E5C5E and the Black stripe is #46413C. They are not the Zigzag Grey & black #57504B or Black & beige #4E4237 (SPEC §2.3 agrees with the code). Use the code values when re-pairing palette and rugs.

---

## 1. Inventory

### 1.1 Tokens (`softsteps.html:63-77`) and where they actually render

The counts are from the 390px census of the default state (`census.json`).

| Token | Hex | What it colours in practice | Rendered count | Status |
|---|---|---|---|---|
| `--kora` | #F2EADC | body (95), `::before` safe-area (96), `.done`, drawer `.line`/`.box` | page | OK |
| `--kora-2` | #E8DDCB | #order panel, stepper, `.copy`, `.hbtn`, chat bubble/day, drawer footer `.df`, steps numeral knockout | 12 bg | Also typed as a literal at 477, 509, features.js:49, pairs.js:22 |
| `--chalk` | #FBF7F0 | cards, drawer, dialogs, inputs, ranges, pairs, text on dark | 44 bg / 105 text | Also typed as about 30 literals: `#FBF7F0` and `rgba(251,247,240,x)` |
| `--kajal` | #1B1D2B | body text, `.cbar`, `.dock`, `--on` | 166 text | Fine as text; as a surface it competes with night and neel |
| `--mitti` | #5F5248 | secondary text, counts, size dims | 63 text | OK |
| `--sut` | #DDD0BB | hairlines, ranges/pair rings | 23 borders | Decorative only (1.27:1 on kora) |
| `--edge` | #8F806F | chip, size, input and msz rings | 33 | 3.20:1 on kora, but 2.85 on kora-2 |
| `--neel` | #1F2E57 | primary pills, selected chip/size/swatch, links, promise icons, #fit, focus on light | 21 bg / 30 text / 21 svg | Clashes with the Navy rugs and Royal |
| `--neel-2` | #24356A | `.pill:hover` only | 0 at rest | Hover-only |
| `--night` | #141B36 | footer, drawer header, menu, toast, chat frame, plan walls/bg | 4 bg | Also typed about 12 times in shop.js/tryon.js |
| `--mist` | #B9C0D6 | text on neel/night, selected-chip count | 7 text | OK |
| `--haldi` | #E3A62F | #fit eyebrow/em/readout, drawer progress, toast border, focus on dark, `.mlinks a:hover` | 4 text (all in #fit) | Shows up only in dark contexts; also typed 8 times in shop.js/tryon.js |
| `--haldi-deep` | #805400 | default `.eyebrow` colour (103) | **0** | **Dead.** No eyebrow sits on a light ground |
| `--kumkum` | #A92E1F | `.badge`, `.tag` "New", order numerals + thread, FAQ "+", footer dot, saved heart, fly thread, `.sentbox`, `.err` | 2 bg / 10 pseudo | Typed as `rgba(169,46,31,…)` in fx.js:614 |
| `--wa` | #1A7349 | `.pill.wa`, chat header, `.ask .wag` | 2 bg / 9 svg | Off-token siblings #155f3c and #1a7f4e |
| `--f/--fg/--on` | per rug | `.field` panels | n/a | Defaults typed as literals at 67, 207, 449 and inline at 1010/1038/1062/1276 |

### 1.2 Hard-coded literals in the `<style>` block that bypass tokens

| Line | Value | Equals / should be | What it colours | Note |
|---|---|---|---|---|
| 32 | `#8A3A1A` | Rust rug (default slide) | `<meta theme-color>` | JS rewrites it at 1462. OK as data |
| 67 | `--f:#8A3A1A;--fg:#FBF7F0;--on:#1B1D2B` | rug / `var(--chalk)` / `var(--kajal)` | root field defaults | Literal copies of tokens |
| 72 | `rgba(27,29,43,.05)`, `rgba(27,29,43,.35)` | kajal-alpha | `--sh-card` | Shadow tinted with kajal |
| 73-74 | `rgba(20,27,54,.55/.45)` | night-alpha | `--sh-hero`, `--sh-float` | Shadow tinted with night: a **second shadow hue** |
| 112 | `rgba(127,127,127,.35/.18/.35/.4/.1)`, `rgba(0,0,0,.5)` | none | `.field` ring/glass/ghost fallback when `color-mix` is missing | Neutral grey rings on coloured fields (older Android WebViews) |
| 114 | `color-mix(var(--f) 45%, #120c08)` | warm black | rug edge `--edgec` | Literal warm black |
| 116 | `rgba(0,0,0,.26)` | none | field floor vignette | Pure black |
| 118, 838 | `rgba(255,238,210,.24)` | "lamp" tint | lamp in range panels | Warm tint 1 |
| 208 | `rgba(255,238,210,.26)` | lamp | hero `.lamp` | Same tint, different alpha |
| 244 | `rgba(255,244,228,.22)` | none | `.sheen` | **Warm tint 2** |
| 131 | `#fff` | `--chalk` or a new `--on-wa` | `.pill.wa` text | Pure white |
| 132 | `#155f3c` | none | `.pill.wa:hover` | **Green 2** |
| 136 | `rgba(27,29,43,.06)` | kajal wash | `.pill.sec:hover` | Hover wash 1 |
| 162, 172 | `rgba(31,46,87,.06)` | neel wash | `.chip:hover`, `.sz:hover` | **Hover wash 2** |
| 168, 169, 409 | `rgba(27,29,43,.12/.15/.12)` | kajal-alpha | inner ring on cdots, chip dot, `.sw` | Fine; should be one token |
| 185 | `rgba(251,247,240,.9)` | chalk-alpha | sticky header | |
| 207 | `--f:#8A3A1A;--fg:#FBF7F0;--on:#1B1D2B` | duplicate of 67 | `.hero` | |
| 241-242 | `rgba(0,0,0,.5)`, `rgba(255,255,255,.25)`, `rgba(0,0,0,.55)`, `color-mix(var(--f) 80%,#000)` | none | `.roll` cylinder | Pure white and black |
| 246-247 | `rgba(0,0,0,.42/.22)` | none | hero rug shadows | |
| 284 | `rgba(0,0,0,.45)` | none | "Next" thumbnail shadow | |
| 374 | `rgba(251,247,240,.9)`, `rgba(27,29,43,.18)` | chalk, kajal | `.tile .heart` disc | 26 white discs on the colour grid |
| 427 | `rgba(0,0,0,.45)` | none | `.chen-board` shadow | Overridden to none at 801 |
| 432-433 | `rgba(251,247,240,0)` | chalk-alpha | chen zoom fades | |
| 449 | `--f:#1F2E57;--fg:#FBF7F0` | `var(--neel)`, `var(--chalk)` | `.fit` | Literal copies |
| 450 | `rgba(255,238,210,.10)`, `rgba(0,0,0,.22)` | lamp, vignette | `.fit::before` | |
| 457, 460, 464, 489 | `rgba(251,247,240,.55)` | chalk 55% | ring on #fit chips, sizes, `.btn-ring`, `.ringp` | **Ring system 2** (fields use `color-mix` at 75%) |
| 458, 461, 465, 490 | `rgba(251,247,240,.08)` | chalk 8% | #fit hovers | |
| 471 | `rgba(251,247,240,.14)`, `rgba(0,0,0,.6)` | none | `.plan` ring and shadow | |
| 473 | `#ECE9E3` | marble floor | `.plan .floor` fallback | **Floor colours exist in 3 copies** (HTML 1143-1147, features.js:546, tryon.js:19) |
| 474 | `rgba(251,247,240,.4)` | chalk-alpha | plan wall stroke | |
| 475 | `#8A3A1A` | Rust | `.plan .mat` fallback | |
| 476, 479 | `rgba(27,29,43,.5/.35)` | kajal-alpha | feet and chappal strokes | |
| 477 | `#E8DDCB` | `var(--kora-2)` | `.plan .sill` | Literal copy |
| 481 | `rgba(20,27,54,.55)` | night-alpha | compare label halo | |
| 487 | `#fff` | none | `.fit .pill:hover` | Pure white only on hover |
| 507 | `#1b5d68` | none (dark teal) | `.ly-pile` edge | Tuned to the Aqua photo; breaks if the photo changes |
| 508 | `#B9A582` on `#D9C7A6` | none | latex layer | Untokenised beige: 1.55:1 vs the chalk panel |
| 509 | `rgba(27,29,43,.12)` on `#E8DDCB` | kora-2 | floor layer grid | Literal kora-2, 1.26:1 vs chalk |
| 513-514 | `rgba(27,29,43,.4/.7)` | kajal-alpha | layer callout lines | |
| 548 | `#fff` | chalk | chat header text | |
| 585 | `#7d7064` | none (between mitti and edge) | placeholders | 4.496:1 on chalk: **fails** |
| 655, 716 | `rgba(20,27,54,.5)` | night-alpha | scrim, `::backdrop` | Consistent |
| 661, 755, 761 | `rgba(251,247,240,.15)` | chalk 15% | `.x` / `.copy` on night | Glass alpha 1 |
| 662 | `rgba(251,247,240,.25)` | none | `.dtop .x:hover` | |
| 665 | `rgba(185,192,214,.3)` | mist 30% | drawer progress track | 2.01:1 (state is also given by the text label) |
| 759 | `rgba(185,192,214,.25)` | mist 25% | menu divider | |
| 864 | `linear-gradient(110deg,var(--a) 0 50%,var(--b) 50% 100%)` | rug data | `.pair .pv` hard split | |
| 865 | `rgba(27,29,43,.22)` | kajal-alpha | pair thumbnail shadow | |
| 878 | `var(--wa,#1a7f4e)` | fallback ≠ token #1A7349 | `.pair .pill.done` | **Green 3** |

Named colours: none in CSS. SVG markup uses only `currentColor`/`none`, apart from the floor patterns listed below.

### 1.3 Rug and scene colour data in markup and core JS

This is real product data and should stay, but each rug hex is typed 3 to 4 times.

| Where | Lines | Content |
|---|---|---|
| Range strip `--c` | 968-970 | Forest #3B4A28, Royal #1D3A8A, Mustard & tan #D3913F |
| Family chips `.cdots` | 993-997 | 13 swatch dots (Blues, Greens, Pinks, Earth, Greys) |
| Product cards inline `--f/--fg/--on` | 1010, 1038, 1062 | zig Forest + chalk/kajal; sol Royal + chalk/kajal; chen Mustard & tan + kajal/chalk |
| Zigzag swatches `data-bg` + `--c` | 1020-1029 | 10 hexes |
| Solid swatches | 1048-1053 | 6 hexes |
| Chenille chips | 1075-1084 | 10 hexes, including Grey stripe #5E5C5E and Blue stripe #2A4793 |
| Fit floor patterns | 1143-1147 | marble #ECE9E3/#CFC8BC, kota #7D8A78/#6F7B6A, wood #A0714B/#8A5E3C, tile #A7ABAE/#8F9396, red oxide #8E3B2E |
| Footer inline | 1276 | `--f:#141B36` (= night), chalk, kajal |
| `FG` map | 1408 | the light rugs (#ebc4bd, #d3913f, #2aa5b8, #a29d9c) get kajal text |
| `paint()` | 1414 | `#FBF7F0` / `#1B1D2B` typed as literals for fg/on |
| theme-color | 1462 | follows the hero rug |
| `paint(#foot,"#141B36")` | 1471 | night as a literal |

### 1.4 JS literals

| File:line | Value | Equals / should be | What it colours |
|---|---|---|---|
| fx.js:74 | `rgb(...)` from `mixWhite(hex,.82)` | generated | "wet" leading edge of the dye flood. Fine |
| fx.js:96, 108, 303 | rug hex, set at runtime | data | dye layers, `--f`, roll cylinder |
| fx.js:614 | `rgba(169,46,31,.45)` → `0` | kumkum | pulse on the cart button when an item lands. Bypasses the token |
| features.js:49 | `#E8DDCB` | kora-2 | fallback thumbnail for a Chenille colour |
| features.js:546-548 | marble #ECE9E3, kota #7D8A78, wood #A0714B, tile #A7ABAE, oxide #8E3B2E | duplicate of HTML 1143-1147 | fit floor fill fallback |
| touchfx.js:19 | `currentColor` at opacity .22 | inherits | touch ripple. Fine |
| shop.js:29-30 | `#141B36`, `#FBF7F0`, `--focus:#E3A62F` | night, chalk, haldi | zoom dialog, backdrop, focus ring |
| shop.js:31, 36 | `linear-gradient(#141B36, rgba(20,27,54,0))` | night | zoom header and footer fades |
| shop.js:32 | `opacity:.75` on `small` | should be mist | zoom subtitle (passes at 9.35:1) |
| shop.js:33, 45 | `rgba(251,247,240,.14)` + `#FBF7F0` | glass alpha 2 | zoom `.x` and `.zb` |
| shop.js:35 | `rgba(0,0,0,.45)` | none | zoom image shadow |
| shop.js:38 | `rgba(251,247,240,.25)` | none | swatch ring (2.19:1 on night: fails 3:1) |
| shop.js:40 | `#E3A62F` | haldi | current swatch ring |
| shop.js:41 | `opacity:.7` | should be mist | zoom hint |
| shop.js:42 | `#FBF7F0` bg / `#141B36` text | chalk / night | "Choose this colour": pill text is a **third variant** (neel in #fit, kajal on fields, night here) |
| shop.js:48 | `#FBF7F0`, `rgba(251,247,240,.55/.08)` | ring system 2 | "See it at your door" |
| shop.js:142 | `#555` | none | swatch `--c` fallback |
| tryon.js:19 | marble #ECE9E3/#C8C0B2, kota #7D8A78/#68745F, wood #A0714B/#7A5134 | third copy of the floors, only 3 of 5, different grout shades | sample floors |
| tryon.js:21 | `rgba(0,0,0,.5/.32)` | none | rug drop-shadow |
| tryon.js:46-47 | `#141B36`, `#FBF7F0`, `--focus:#E3A62F` | night, chalk, haldi | try-on dialog and backdrop |
| tryon.js:50-53 | `rgba(251,247,240,.14/.22)`, `#FBF7F0`, `#141B36` | glass | `.x`, `.tbtn`, pressed state |
| tryon.js:58, 62, 65 | `#FBF7F0`, `#E3A62F` | chalk, haldi | intro art, file focus, links |
| tryon.js:63, 111 | `#FBF7F0` / `#141B36`, hover `#fff` | chalk, night, pure white | primary and "Add" pills |
| tryon.js:64, 94, 101 | `rgba(251,247,240,.55/.6/.45)`, `.08` | **three ring alphas** | secondary, cart and seg/size buttons |
| tryon.js:66 | `#FFD9A0` | **off-palette peach** | error text (12.65:1) |
| tryon.js:67, 110, 112 | opacity .8 / .85 / .6 | should be mist | `.twhat`, size price, `.td` separator (**4.41:1, fails**) |
| tryon.js:71 | `#0E1330` | **dark number 5** (1.07:1 vs night) | photo stage |
| tryon.js:81-85 | `#FBF7F0`, `rgba(20,27,54,.38)`, `rgba(0,0,0,.3–.7)`, `#E3A62F` | | frame, handles, handle focus |
| tryon.js:88, 90 | `rgba(20,27,54,.74)` | night glass | hint and floor chips (2.44:1 against the wood door: muddy) |
| tryon.js:91-92, 103 | `#FBF7F0` / `#141B36` | | selected floor/size, toast |
| tryon.js:95, 115 | `rgba(251,247,240,.1)` | | panel dividers |
| tryon.js:98, 107 | `#E3A62F` | haldi | light slider accent, selected swatch ring |
| tryon.js:105 | `rgba(251,247,240,.25)` | | swatch ring |
| tryon.js:132-133 | `#E3A62F` mat, `#141B36` lines, chalk handles | | intro illustration |
| tryon.js:322 | `#555` | none | swatch fallback |
| tryon.js:413 | `rgb(...)` from `shade()` | generated | rug edge shading |
| tryon.js:424-462 | walls #EFE7DA→#E0D5C3, skirting #D3C6B1, frame #5C3D29, door #8E5F3C, panels `rgba(60,36,20,.5)`, handle #D9B76A, veins `rgba(150,138,120,.25)`, sill #D8CDBA, lamp `rgba(255,246,228,.16)` (**warm tint 3**), vignette `rgba(0,0,0,.3)` | scene | sample doorway (fine as illustration, but a second set of beiges) |
| pairs.js:22 | `#E8DDCB` | kora-2 | pair colour fallback |
| lang.js:213-217 | tokens, plus `rgba(251,247,240,.16)` (menu, pressed) and `.14` (footer, pressed), footer buttons at opacity .85 | glass alphas 3 and 2 | language switch (footer passes at 11.69:1) |
| lang-gu.js, lang-hi.js | none | | |

### 1.5 Near-duplicate families (what a new palette must merge)

- **Darks:** kajal #1B1D2B, night #141B36, neel #1F2E57, neel-2 #24356A, try-on #0E1330. Neighbours differ by 1.01 to 1.28:1. Rug navies #1E2853 and #262E63 sit inside the same cluster.
- **Off-whites:** chalk #FBF7F0, #fff (5 places), marble #ECE9E3, try-on walls #EFE7DA/#E0D5C3.
- **Beiges:** kora #F2EADC, kora-2 #E8DDCB, sut #DDD0BB, latex #D9C7A6, sill #D8CDBA, skirting #D3C6B1.
- **Golds:** haldi #E3A62F, haldi-deep #805400 (dead), Mustard & tan rug #D3913F, brass #D9B76A, latex dots #B9A582, peach #FFD9A0.
- **Reds:** kumkum #A92E1F, Rust rug #8A3A1A, red-oxide floor #8E3B2E (vs a Rust mat: **1.04:1**), Berry rug #8C2630.
- **Greens:** wa #1A7349, #155f3c, #1a7f4e, kota floor #7D8A78, Forest rug #3B4A28.
- **Lamp tints:** (255,238,210), (255,244,228), (255,246,228).
- **Alpha recipes:** glass on dark .14/.15/.16; ring on dark .45/.55/.6 against a 75% `color-mix` on fields; hover washes in kajal 6% and neel 6%.
- **Shadow hues:** kajal-tinted, night-tinted and pure black, all used side by side.

---

## 2. Screenshots

Everything is in `/tmp/claude-0/-home-user/b3b2df08-4b5f-5d42-b6f7-07d0365cb062/scratchpad/design2/audit/`. File prefixes: `p-` = 390×844 @2x, `d-` = 1440×900 @1x.

- **Per section:** `{p,d}-NN-<section>-view.png` (viewport after a slow scroll plus 1s) and `-el.png` (element only). Sections: 01 hero, 02 ranges, 03 promise, 04 colours, 05-07 shop zig/sol/chen, 08 shop head, 09 pairs, 10 fit, 11 made, 12 order, 13 faq, 14 footer. Plus `{p,d}-00-first-screen.png`.
- **Overlays:** `{p,d}-ov-cart.png`, `-ov-cart-step2.png`, `-ov-zoom-aqua.png`, `-ov-tryon-intro.png`, `-ov-tryon-sample.png`, `-ov-menu.png`, `-ov-saved.png`, `-ov-compare.png`, `-ov-header-toast-cbar.png`.
- **Painted variants:** `{p,d}-hero-{blush,aqua,mustard,royal}.png`, `{p,d}-card-{zig-blush,sol-grey,sol-aqua,chen-blue}.png`.
- **Defects:** `p-x-chen-navy-caption.png`, `p-x-hero-mustard-sizes.png`, `p-x-cbar-over-footer.png`, `p-x-cbar-over-fit.png`.
- **Overviews (scaled):** `p-full-strip.jpg`, `d-full-strip.jpg`, `sheet-p-hero-colours.jpg`, `sheet-p-cards-light.jpg`, `sheet-d-hero-colours.jpg`, `sheet-d-mid.jpg`, `sheet-d-low.jpg`, `sheet-d-overlays.jpg`, `sheet-p-defects.jpg`.

**The 8 a designer should open first:**
1. `sheet-p-hero-colours.jpg`: tone-on-tone solids, light fields losing their edge on kora, kumkum badges on pink and mustard.
2. `p-full-strip.jpg`: the whole page rhythm, showing colour at the top and the beige stretch at the bottom.
3. `sheet-p-defects.jpg`: Chenille caption at 1.18:1, the kajal cart bar dissolving into the night footer and the neel fit section.
4. `sheet-p-cards-light.jpg`: Royal/neel, Grey and Aqua fields, the Chenille mat-board.
5. `p-12-order-el.png`: kumkum and WhatsApp green at equal value, plus night and beige, in one view.
6. `p-ov-zoom-aqua.png` and `p-ov-tryon-intro.png`: product shown on navy; the Navy thumbnail disappears.
7. `sheet-d-low.jpg`: made, order and faq on desktop, all beige.
8. `p-05-shop-zig-el.png`: the card system at its best (the reference to keep).

---

## 3. Measured contrast

### 3.1 DOM scan (computed colour × opacity chain over the composited background)

| View | Text nodes | Fails |
|---|---|---|
| Page, default, 390 | 402 | 0 |
| Page, default, 1440 | 496 | 0 |
| Cart drawer / zoom / try-on intro / menu | 11 / 8 / 6 / 17 | 0 |
| Try-on with the sample floor | 26 | 1 (`.td` "·" at 4.41) |
| Sweep of all 26 swatches on the cards | n/a | **8 Chenille colours: `#chen-cap` at 1.18–2.52** |
| Sweep of the 6 hero slides | 56 per slide | Aqua: size dims at 4.03. Mustard & tan: size dims at 4.32 |

### 3.2 Rug fields: what the palette has to frame

| Rug | Field | fg/f | 75% ring | Size dims .78 | vs kora | vs night | vs neel | Chenille caption, kajal | Kumkum badge vs f |
|---|---|---|---|---|---|---|---|---|---|
| Forest green & black | #3B4A28 | 8.95 | 5.88 | 6.21 | 8.00 | 1.77 | 1.38 | **1.75** | 1.41 |
| Blush pink & black | #EBC4BD | 10.47 | 5.60 | 6.08 | **1.34** | 10.62 | 8.30 | 10.47 | 4.25 |
| Navy & cream | #1E2853 | 13.25 | 8.09 | 8.59 | 11.85 | **1.20** | **1.07** | **1.18** | 2.09 |
| Olive & cream | #504621 | 8.78 | 5.78 | 6.09 | 7.85 | 1.81 | 1.41 | **1.78** | 1.38 |
| Cocoa & cream | #5A3826 | 9.69 | 6.25 | 6.63 | 8.67 | 1.64 | 1.28 | **1.61** | 1.53 |
| Mustard & tan | #D3913F | 6.28 | 4.09 | **4.32** | **2.23** | 6.37 | 4.97 | 6.28 | 2.55 |
| Berry red & pink | #8C2630 | 8.08 | 5.22 | 5.52 | 7.22 | 1.96 | 1.53 | **1.94** | **1.27** |
| Grey & black | #57504B | 7.41 | 5.01 | 5.27 | 6.62 | 2.14 | 1.67 | n/a | 1.17 |
| Black & beige | #4E4237 | 9.11 | 5.98 | 6.29 | 8.14 | 1.74 | 1.36 | n/a | 1.44 |
| Navy & white | #262E63 | 11.89 | 7.42 | 7.88 | 10.63 | 1.33 | **1.04** | n/a | 1.87 |
| Royal blue | #1D3A8A | 9.71 | 6.21 | 6.55 | 8.68 | 1.63 | **1.28** | n/a | 1.53 |
| Aqua | #2AA5B8 | 5.71 | 3.82 | **4.03** | **2.45** | 5.79 | 4.52 | n/a | 2.32 |
| Solid Mustard | #A34B19 | 5.50 | 3.82 | **4.00** | 4.91 | 2.89 | 2.25 | n/a | **1.16** |
| Rust | #8A3A1A | 7.28 | 4.85 | 5.09 | 6.51 | 2.18 | 1.70 | n/a | **1.15** |
| Black (Sol / Chen stripe) | #46413C | 9.45 | 6.18 | 6.50 | 8.44 | 1.68 | 1.31 | **1.66** | 1.49 |
| Grey (Sol) | #A29D9C | 6.24 | 4.01 | **4.25** | **2.24** | 6.32 | 4.94 | n/a | 2.53 |
| Grey stripe (Chen) | #5E5C5E | 6.21 | 4.32 | 4.53 | 5.55 | 2.56 | 2.00 | **2.52** | 1.02 |
| Blue stripe (Chen) | #2A4793 | 8.12 | 5.36 | 5.64 | 7.26 | 1.95 | 1.53 | **1.93** | 1.28 |

How to read it:
- fg on field always passes. The rules break where code does **not** use `--fg`: the Chenille caption, and text dimmed with opacity on a field.
- Four rug colours are close to the page ground (under 3:1 vs kora). Their panels need an edge, such as a 1px darker ring or a deeper ground.
- Twelve rug colours fall within 2:1 of night/neel, which explains the problems in the dark viewers.

### 3.3 Token pairs (static)

| Pair | Ratio | Pair | Ratio |
|---|---|---|---|
| Chalk / kora | 1.12 | Kumkum on night (footer dot) | 2.50 |
| Kora-2 / kora | 1.12 | Haldi on chalk / kora | 2.01 / 1.80 |
| Chalk / kora-2 | 1.26 | WhatsApp green on kora | 4.89 |
| Sut on kora / chalk | 1.27 / 1.42 | WhatsApp green vs kumkum (luminance) | 1.16 |
| Edge on kora / chalk / kora-2 | 3.20 / 3.59 / **2.85** | Kajal vs night / neel | **1.01 / 1.26** |
| Placeholder #7d7064 on chalk | **4.496** | Night vs try-on stage #0E1330 | 1.07 |
| Fit ring at 55% on neel | 4.88 | Try-on seg ring at 45% on night | 4.20 |
| Zoom swatch ring at 25% on night | **2.19** | Drawer progress track | 2.01 |
| Latex / floor layers vs chalk (#made) | 1.55 / 1.26 | Rust mat on the red-oxide floor (#fit) | **1.04** |

---

## 4. Section by section

**Header and first screen.** The chalk-90% blurred bar with kora-2 icon discs is quiet and correct. On desktop, though, the discs are 1.26:1 against the bar and look washed out, and the neel "Menu" pill is the only colour in it. On Android the status bar takes the rug colour (`theme-color`), but a kora strip holding the language switch sits between the status bar and the hero. The very top of the phone therefore reads rug / beige / rug: three stripes before any content.

**Hero (#hero).** The concept is strong: the rug floats on its own dye. But for the solid slides the rug *is* the background. Rust on Rust, Aqua on Aqua and Royal on Royal hold apart only through a 5px warm-black edge. The lamp radial, `rgba(255,238,210,.26)`, reads as a brown smudge on Rust and as fog on Royal and Aqua, not as light. On the light slides (Blush, Mustard & tan, Aqua) the whole panel loses its outline against kora (1.34 to 2.45), and the night-tinted `--sh-hero` becomes a blue-grey bruise under a pink card. The kumkum count badges on Blush and Mustard put red against pink and orange. Autoplay breaks the SPEC's "no repeated green" rule: within 7 s the hero is Forest green, and the next big panel down (the Zigzag card) is the same Forest green. The Royal slide likewise repeats the Solid card. On phone the prev/next/pause discs are filled with `var(--f)` (line 857) and sit on the rug corner like brown blobs.

**Range strip and promise strip.** Chalk tiles with a sut ring on kora (1.12:1) have almost no presence, so the photos do all the work. The promise strip is a generic "trust bar": four neel line icons and kajal text between two 1.27:1 hairlines. It is the most template-looking part of the page. Neel as an icon colour appears here and nowhere else; hearts are kajal and the WhatsApp glyph is green.

**Colour index (#colours).** Correctly the most colourful screen, and the family grouping helps. But 26 chalk heart discs at 90% chalk lay a polka-dot grid over the rugs and compete with them. The 4px colour bars under each tile (desktop only) repeat the tile and vanish for light rugs (Blush bar 1.34 on kora). The headline is plain kajal, because `.h2 em` lost kumkum at line 795, so the section has no accent at all.

**Shop (#shop).** The card anatomy (dye panel next to a chalk info side) is the best idea on the site. Stacking the three defaults, though, gives a "rainbow stack": Forest, then Royal, then Mustard & tan, three unrelated saturated hues at equal weight across about 3.5 phone screens, with nothing tying them together. With the card shadows gone, the chalk info side melts into kora, so the coloured panels float without a card around them. Specific problems:
- In the Solid card, the Royal field sits above a neel Add-to-cart, a neel selected-size circle and a neel swatch ring. Two blues that nearly match (1.28) read as an error.
- The Chenille card breaks the system. Its photo sits on a white mat-board inside a mustard field (chalk vs field 2.49), so it looks pasted in. Its caption and "See all ten" link use fixed dark colours and become invisible on 8 of 10 colours.
- The kumkum "New" tag sits next to the mustard field: red on orange.
- The kora-2 stepper and "Copy" pills are a third neutral (1.26 on chalk) and look disabled.

**Pairs (#pairs).** Eight chalk cards, each split diagonally into two rug colours with two framed thumbnails, so 16 more colour blocks right after 26 tiles and three painted cards. By this point colour has stopped carrying information. The hard 110° split looks like a stock "duotone card". Light pairs (Soft rose: blush and grey) look faded beside dark ones (Quiet neutrals: black and charcoal). Eight neel CTAs in a row add a fourth blue band.

**Fit (#fit).** This is the most considered section: neel, haldi italics and a haldi readout letter, mist labels. Three problems:
- On phone it is a 1,390px full-bleed slab of saturated indigo, arriving straight after the blue pair card and the Royal card.
- Inside the plan, the night walls are 1.28:1 against the neel section, so the doorway outline dissolves. The brightest thing in the section is the empty marble floor (#ECE9E3), so the eye lands on floor, not mat. Choosing the red-oxide floor makes a Rust mat disappear (1.04).
- The haldi accent is 1.24:1 from the Mustard Chenille field two sections earlier, so it reads as an echo of a product rather than a house accent.

Three stacked full-width buttons (chalk fill, ring, ring) make the end of the section heavy.

**Made (#made).** Beige on beige on beige. The chalk panel is 1.12 on kora; inside it, the latex layer is 1.55 and the floor layer 1.26 against chalk, so two of the three "exploded layers" nearly vanish and only the Aqua pile has colour. That Aqua is fixed (with a hard-coded teal edge), so it doesn't follow the rug you chose. The spec table is kajal on sut hairlines. It is correct but flat.

**Order (#order).** The kora-2 panel is 1.12 on kora, which on phone is barely an edge. Inside it are kumkum italic numerals, a dashed kumkum thread, a night phone frame, a WhatsApp-green header and a kora-2 bubble. Red, green, navy and beige all in one view, with the red and green at the same value (1.16), so they vibrate. It is the busiest accent mix on the page, sitting in its calmest stretch. The mock is half WhatsApp (green header) and half brand (beige bubble).

**FAQ and contact.** Six kumkum "+" rings are the only colour on the phone screen. They read as close/error buttons, and the other expanders on the same screen ("Or write it here first", the UPI QR disclosure) use neel. The contact card's WhatsApp-green button is the right primary action, but its green doesn't relate to anything else in the palette.

**Footer (#foot).** The night wordmark block is a good ending. The kumkum "heart" dot is 2.50:1 on night and reads as a muddy maroon speck. Below the footer the page ends on a strip of kora: 90px with a cart, 16px without (lines 595/800). With items in the cart, the kajal cart bar crosses from that strip onto the night footer at 1.01:1 and loses its edge.

**Overlays.**
- *Cart drawer:* night header, haldi progress, chalk body, kora line cards, kora-2 footer. That is four neutrals, but the hierarchy holds. The toast (night) lands on the night drawer header and only its haldi top line shows.
- *Zoom:* product on #141B36. Navy, Royal and Black swatches disappear; text is dimmed with opacity instead of using mist.
- *Try-on:* chrome in night and the stage in #0E1330 (a fifth dark). The night glass floor chips over a wood door are muddy (2.44), the error peach #FFD9A0 is off-palette, and the Navy thumbnail on the intro screen is 1.20:1.
- *Menu:* a full navy sheet of chalk serif links, no imagery and no colour, with a lot of empty navy. It is functional but template-like.
- *Cart bar and dock:* kajal, a third dark that matches neither the buttons (neel) nor the footer (night).

**What reads as "template" rather than premium.** The icon trust bar between two hairlines. The "pill + round chevron ›" used on every CTA (hero, cards, pairs, fit, drawer). The duotone diagonal pair cards. FAQ "+" rings. The phone mock-up. Navy + beige + gold, which is the default "premium" palette everywhere. The cultural names (kora, haldi, kumkum, neel) aren't visible in how colour is used: on screen it is navy and beige with occasional red. Uniform 999px pills and 24–32px radii everywhere mean nothing has its own shape.

---

## 5. Light/dark rhythm today

Phone, 12,097px total. Bars are to scale by height.

```
hero      ████████  rug dye (Rust by default; autoplay cycles)     1,049px  8.7%
ranges    ░          chalk tiles on kora                              202
promise   ░░         kora                                             279
colours   ▒▒▒▒▒▒     kora + 26 colour tiles                           784
shop      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  3 dye panels (Forest/Royal/Mustard) + chalk   3,500  28.9%
pairs     ▒▒▒▒▒      8 two-colour cards                               667
fit       ███████████  NEEL full-bleed                              1,390  11.5%
made      ░░░░░░░░   kora/chalk/beige                               1,018
order     ░░░░░░░░░  kora-2 panel                                   1,178
faq+ctc   ░░░░░░░░░░░ kora + chalk card                              1,436
                     ↑ 3,632px of beige with no colour beat, apart from the WhatsApp green and kumkum "+"
foot      ███        NIGHT full-bleed                                 415
(kora strip 16–90px under the footer)
```

Desktop has the same shape: colour runs through #fit (to 65% of the page), then 2,919px (28%) is beige until the footer.

---

## 6. What the new palette must solve (handoff)

1. **Take UI accents out of the rug gamut.** Check every accent, button colour and badge against all 26 rug hexes and keep a clear gap (as a guide, ≥1.5:1 luminance or a clear hue gap) from each, or let the rugs be the only saturated colour. In particular, neel must not sit within 1.3:1 of Navy & cream, Navy & white or Royal.
2. **Rebuild the neutral steps** so ground, card and inset differ by at least about 1.25:1, or bring back a hairline or soft shadow on cards. Choose one warm white and drop `#fff`.
3. **Use one dark, plus at most one tint of it.** Assign roles: text, primary button, deep surface. Drop kajal surfaces, `#0E1330` and the duplicate night literals.
4. **Make the colour-judging surfaces neutral.** Zoom and try-on should use a warm charcoal or kora-like ground, not navy. Swatch rings must reach 3:1 on whatever ground is chosen.
5. **Text on a field.** Anything inside `.field` uses `--fg`/`--on`; no opacity on field text. This fixes `#chen-cap` and `.sz::after`. Light fields (Blush, Mustard & tan, Aqua, Grey) need a visible panel edge on the page ground.
6. **Give the accents a repeating role down the page** (eyebrows, italic H2 words, step numerals, section markers), and give the beige lower half at least one colour beat between #fit and the footer.
7. **Tokenise the recipes:** `--glass-dark`, `--ring-dark`, `--hover-wash`, `--shadow`, `--lamp`, `--on-wa`, and one floor table shared by fit and try-on. Make shop.js and tryon.js read `var(--…)` instead of hex.
8. **Keep the rug hexes as they are** (true colour). Change only what frames them.
