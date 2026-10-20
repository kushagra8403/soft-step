# Soft Steps final build spec: "Umbaro (ઉંબરો), the threshold"

## 0. Decision, scope and build order

**Winner by summed judge totals:** Umbaro, the craft direction, with 142 (46 + 50 + 46). Lamplight (luxury) had 136, Dip-Dyed (colour) 133 and Unroll (cinematic) 117. There was no tie, so no tie-break was needed.

**What we keep from Umbaro:**
- A calm kora (unbleached cotton) ground.
- Indigo as the house colour.
- Kumkum, taken from the logo heart, for the thread, the hearts and the badge.
- Haldi as the accent on dark surfaces only.
- Hind Vadodara for body text and Fraunces for display.
- The chenille treated as a mat-board.
- Swatch colour fallbacks.
- Fit-tool captions in HTML, the doorstep sill and the chappals.
- A gift note at checkout.
- A running stitch.

**What we graft in, to supply the wow it lacked:**
- Luxury: lamp-pool light with grain, velvet sheen, scroll unroll, odometer, sticky header with buy dock, colour index, room advisor.
- Cinematic: the timed unroll with a roll cylinder and edge thickness, the exploded layer diagram, the compare-sizes table, "Send to family".
- Dip-Dyed: true-colour fields from a hand-checked table, the fit mat filled with the real rug, Indian floor finishes, the burnt-orange "Mustard" fix.

**Cut list. Do NOT build any of these:**
- Preloader.
- Rangoli halo, toran, bandhani dot fields.
- Animating the SOFT axis.
- Cursor follower, magnetic buttons, marquee.
- Lenis, ScrollTrigger, any pinning.
- A page-tint scroll scrub.
- Quick-look dialog.
- Recently viewed.
- Inspect loupe.
- New 640px tile images.
- A footer wordmark cut out of the rug pile (it vanishes on dark colourways).
- A mehendi/olive WhatsApp button.
- Gujarati text in the hero.
- Any external JS. Everything here is CSS, WAAPI and vanilla JS. GSAP is unnecessary, and cdnjs was unreachable from the build sandbox.

**Owner sign-offs.** Build with the defaults below. Each one is a one-line change if Jelam disagrees.
- Solid "Mustard" photographs as burnt orange, so its field is #A34B19. The name is unchanged.
- The PIN rules: 390xxx is treated as Vadodara (free delivery); 391xxx gets "we'll confirm".
- The ઉંબરો word, used only as the fit-tool eyebrow.
- Black rugs sit on a lifted charcoal field rather than black.

**Build order:**
1. **P0:** tokens and type, then the hero layout and the dye table, then the range cards, then all core hooks, then the cart flow intact.
2. **P1:** effects 1–4, the sticky header and dock, the colour index, the stock link, Saved, PIN.
3. **P2:** effects 5–8, compare table, fit upgrades, gift note.

---

## 1. Concept (2 sentences)

Soft Steps is shown as a quiet, kora-cotton catalogue for the doorstep (umbaro), where shoes come off and a mat matters. Indigo is the house colour, kumkum from the logo's heart is the stitch, and haldi is the lamp-light on dark. Colour arrives the way dye does: each rug floats on a panel of its own true colour, as in the owner's reference. The panel floods with dye from the swatch you touch, the rug unrolls into place, and its pile catches the light. Every "wow" shows something true about the product.

---

## 2. Design tokens

### 2.1 Palette

Single fixed light theme, as today. Use `color-scheme: light` and an explicit body background. Do not add a dark variant, because colour fidelity depends on the kora ground.

| Token | Hex | Role |
|---|---|---|
| `--kora` | #F2EADC | Page ground (replaces #f6f1ec) |
| `--kora-2` | #E8DDCB | Secondary panels (How to order panel, exploded-diagram floor, steppers, Copy buttons) |
| `--chalk` | #FBF7F0 | Cards, drawer, dialogs, inputs, mat-board; text on dark and dark fields |
| `--kajal` | #1B1D2B | Primary text; text on light fields; cart bar and dock |
| `--mitti` | #5F5248 | Secondary text, captions, fine print (on kora, kora-2, chalk) |
| `--sut` | #DDD0BB | Decorative 1px hairlines only; never the only boundary of a control |
| `--edge` | #8F806F | Borders of inputs, chips and size rings on chalk or kora (≥3:1) |
| `--neel` | #1F2E57 | House colour: primary buttons on light, fit section, selected states, focus ring on light |
| `--neel-2` | #24356A | Neel hover |
| `--night` | #141B36 | Footer, drawer header, menu sheet, toast, plan walls |
| `--mist` | #B9C0D6 | Secondary text on neel and night |
| `--haldi` | #E3A62F | Accent on neel and night only: italic H2 accents, readout size letter, active progress, focus ring on dark |
| `--haldi-deep` | #805400 | Eyebrow text on kora and chalk only |
| `--kumkum` | #A92E1F | Running stitch, cart badge (with chalk text), saved heart fill, "New" tag, error text, H2 italic accents on light |
| `--wa` | #1A7349 | WhatsApp buttons only (white text plus the WhatsApp glyph) |
| `--f` / `--fg` / `--on` | per rug | Field colour / text on field / text on an fg-filled pill (the opposite of fg) |

### 2.2 Verified contrast pairs

All pairs use WCAG 2.x relative luminance, computed in this pass.

**Text on light grounds**

| Pair | Ratio |
|---|---|
| Kajal on Kora | 13.98 |
| Kajal on Kora-2 | 12.44 |
| Kajal on Chalk | 15.64 |
| Mitti on Kora | 6.31 |
| Mitti on Kora-2 | 5.61 |
| Mitti on Chalk | 7.06 |
| Haldi-deep on Kora | 5.52 |
| Haldi-deep on Chalk | 6.17 |
| Kumkum on Kora | 5.67 |
| Kumkum on Kora-2 | 5.05 |
| Kumkum on Chalk | 6.35 |
| Neel on Kora | 11.08 |
| Neel on Kora-2 | 9.85 |

**Text on dark grounds and buttons**

| Pair | Ratio |
|---|---|
| Chalk on Neel | 12.39 |
| Chalk on Neel-2 | 10.97 |
| Chalk on Night | 15.86 |
| Mist on Neel | 7.29 |
| Mist on Night | 9.34 |
| Haldi on Neel | 6.15 |
| Haldi on Night | 7.87 |
| Kajal on Haldi | 7.76 |
| White on WA #1A7349 | 5.85 |
| Chalk on Kumkum (badge) | 6.35 |

**Non-text (needs 3:1)**

| Pair | Ratio |
|---|---|
| Edge vs Chalk | 3.59 |
| Edge vs Kora | 3.20 |
| WA vs Chalk | 5.47 |
| Chalk ring at 55% vs Neel | 4.88 |

**Never use these as text:** Haldi on Chalk (2.01), Kumkum on Neel (1.95), Sut on Kora (1.27), Edge on Kora-2 (2.85).

### 2.3 Dye table and how rug colours are used

The field is the rug's true colour, sampled from the photos. It is never steeped toward black. `fg` comes from this table and is **never** computed at runtime. Delete `lum()`.

| Range | `data-n` | Field (`data-bg`) | fg | Text ratio | 1.5px fg ring at 75% |
|---|---|---|---|---|---|
| Zigzag | Forest green & black | #3B4A28 | Chalk | 8.95 | 5.88 |
| Zigzag | Blush pink & black | #EBC4BD | Kajal | 10.47 | 5.60 |
| Zigzag | Navy & cream | #1E2853 | Chalk | 13.25 | 8.09 |
| Zigzag | Olive & cream | #504621 | Chalk | 8.78 | 5.78 |
| Zigzag | Cocoa & cream | #5A3826 | Chalk | 9.69 | 6.25 |
| Zigzag | Mustard & tan | #D3913F | Kajal | 6.28 | 4.09 |
| Zigzag | Berry red & pink | #8C2630 | Chalk | 8.08 | 5.22 |
| Zigzag | Grey & black | #57504B | Chalk | 7.41 | 5.01 |
| Zigzag | Black & beige | #4E4237 | Chalk | 9.11 | 5.98 |
| Zigzag | Navy & white | #262E63 | Chalk | 11.89 | 7.42 |
| Solid | Royal blue | #1D3A8A | Chalk | 9.71 | 6.21 |
| Solid | Aqua | #2AA5B8 | Kajal | 5.71 | 3.82 |
| Solid | Mustard (photo is burnt orange) | #A34B19 | Chalk | 5.50 | 3.82 |
| Solid | Rust | #8A3A1A | Chalk | 7.28 | 4.85 |
| Solid | Black (lifted charcoal so the rug reads) | #46413C | Chalk | 9.45 | 6.18 |
| Solid | Grey | #A29D9C | Kajal | 6.24 | 4.01 |
| Chenille | Forest green / Blush pink / Navy / Olive / Cocoa / Mustard / Berry stripe | same as the matching Zigzag hex | as Zigzag | | |
| Chenille | Grey stripe | #5E5C5E | Chalk | 6.21 | 4.32 |
| Chenille | Black stripe | #46413C | Chalk | 9.45 | 6.18 |
| Chenille | Blue stripe | #2A4793 | Chalk | 8.12 | 5.36 |
| Footer | (paint target) | #141B36 | Chalk | 15.86 | |

The JS table:

```js
FG = {"#ebc4bd":"#1B1D2B","#d3913f":"#1B1D2B","#2aa5b8":"#1B1D2B","#a29d9c":"#1B1D2B"}
// default "#FBF7F0"; --on = (fg === Chalk ? Kajal : Chalk)
```

**Usage rules, so the colour reads premium rather than garish:**
1. A dye field only ever appears as an **inset rounded panel on kora**: the hero card, and the image half (about 58%) of each range card. The range info side is Chalk. The fit section is Neel, not dye. Nothing is full-bleed.
2. Every field gets the same three layers:
   - **Floor vignette**, in `::before`: `radial-gradient(120% 90% at 50% 115%, rgba(0,0,0,.26), transparent 60%)`.
   - **Lamp pool**: a moving `span.lamp` in the hero; a static radial at 62%/36% in range panels: `radial-gradient(closest-side, rgba(255,238,210,.24), transparent)`.
   - **Static grain**, in `::after`, at opacity .06 with no blend mode (URI in §2.7).
   These replace today's white-highlight "glaze".
3. Text on a field is always full fg and is never reduced by opacity. Hierarchy comes from size, not alpha.
4. Controls on a field:
   - Unselected controls are transparent with a `1.5px solid color-mix(in srgb, var(--fg) 75%, transparent)` ring; the minimum is 3.82:1.
   - Selected controls are filled with fg and use `--on` text.
   - Icon-only circles get a 12% fg glass.
   - Fallback before `color-mix`: `rgba(127,127,127,.35)`.
5. Italic accent words on fields stay fg (italic only). On kora they are Kumkum; on Neel they are Haldi.
6. Default colours give a light/dark rhythm down the page with no repeated green:
   - Hero: Rust.
   - Zigzag: Forest green.
   - Solid: Royal blue.
   - Chenille: **Mustard** (`data-def="5"`).
7. `<meta name="theme-color">` follows the hero field, as today.

### 2.4 Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..600,100,0;1,9..144,300..600,100,0&family=Hind+Vadodara:wght@400;500;600&display=swap">
```

- I verified this URL in this pass: HTTP 200, 15 `@font-face` rules. Fraunces is served in roman and italic, weight 300–600, with SOFT pinned at 100 and WONK at 0, which roughly halves the download compared with the full axis range.
- Hind Vadodara is served at 400, 500 and 600 in gujarati, latin-ext and latin subsets.
- The ₹ sign (U+20B9) is in Fraunces latin-ext and in Hind Vadodara's gujarati and latin-ext subsets.
- `--display: "Fraunces", "Iowan Old Style", Georgia, serif`
- `--text: "Hind Vadodara", system-ui, "Segoe UI", Roboto, sans-serif`
- Set `font-optical-sizing: auto` on Fraunces.
- Prices use `font-variant-numeric: lining-nums tabular-nums`.
- No uppercase tracked micro-labels anywhere. Everything is sentence case.

### 2.5 Type scale

| Use | Font | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| Hero H1 | Fraunces | clamp(44px, 5.6vw, 84px) / .98 (phone clamp(38px, 10.5vw, 46px)) | 380; accent phrase italic 340 | -0.02em |
| H2 | Fraunces | clamp(36px, 4.4vw, 64px) / 1.02 | 400; accent italic 360 | -0.015em |
| H3 (range titles, drawer title) | Fraunces | clamp(30px, 3vw, 42px) / 1.05 | 420 | -0.01em |
| Hero price (odometer) | Fraunces | clamp(40px, 4vw, 60px) / 1 | 500 | -0.01em |
| Card price | Fraunces | 34px / 1 | 500 | |
| Step numerals 01–04 | Fraunces italic | 40px / 1 | 340 | |
| FAQ question | Fraunces | 20px / 1.3 | 420 | |
| Tagline, counter, tile names | Fraunces italic | 15–22px / 1.25 | 400 | |
| Ghost colour name | Fraunces italic | clamp(96px, 18vw, 260px) | 300 | -0.03em |
| Footer wordmark | Fraunces italic | clamp(64px, 17vw, 240px) / .85 | 300 | -0.03em |
| Lead | Hind | 18px / 1.6 (phone 16px) | 400 | |
| Body | Hind | 17px / 1.6 | 400 | |
| UI labels, chips | Hind | 15px / 1.4 | 500 | |
| Buttons | Hind | 16px / 1 | 600 | |
| Eyebrow | Hind | 14px / 1.3, Haldi-deep, preceded by a 28px stitch dash | 600 | .02em |
| Small, fine print | Hind | 14px / 1.5 | 400 | |
| Micro (tile range line) | Hind | 13px; 12px minimum on phone | 500 | |

Inputs are 16px (no iOS zoom).

### 2.6 Radii, spacing, layout

- **Radii:**
  - Hero 32px (phone 24px).
  - Range card 28px; dye panel inside it 20px.
  - Chalk cards and dialogs 28px.
  - Colour tiles 16px.
  - Inputs 14px.
  - Line cards 18px.
  - Pills and circles 999px.
- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
  - `--sec: clamp(64px, 8vw, 128px)` vertical padding per section.
  - The promise strip uses 32px instead, so the rhythm is not uniform.
- **Gutters:** `--m: max(16px, env(safe-area-inset-left))` and `--mr` likewise. 24px at ≥768px, 32px at ≥1200px. Wrap max-width is 1380px.
- **Breakpoints:**
  - 440: form fields collapse to one column.
  - 600.
  - 860: stacked layouts and phone behaviours.
  - 980: the nav pill becomes the Menu button.
  - 1100: sticky header shows its nav links.
- **Overflow and scrolling:**
  - `body { overflow-x: clip }`. The hero, footer and ghost type clip their own overflow.
  - `scroll-padding-top: 80px` to clear the sticky header.

### 2.7 Shadows, textures, glyphs

- **Shadows:**
  - `--sh-card: 0 1px 0 rgba(27,29,43,.05), 0 24px 48px -32px rgba(27,29,43,.35)`
  - `--sh-hero: 0 48px 90px -48px rgba(20,27,54,.55)`
  - `--sh-float: 0 20px 50px -18px rgba(20,27,54,.45)` for the drawer, dock, header and dialogs.
- **Rug contact shadow.** Two sibling elements under the rug, replacing the image drop-shadows:
  - Tight: left/right 18%, bottom 14%, height 9%, `rgba(0,0,0,.42)`, `blur(10px)`.
  - Ambient: left/right 6%, bottom 8%, height 22%, `rgba(0,0,0,.22)`, `blur(40px)`.
- **Rug edge thickness.** Applied to the main img:

  ```css
  filter: drop-shadow(0 5px 0 color-mix(in srgb, var(--f) 45%, #120c08));
  /* fallback: rgba(0,0,0,.5) */
  ```

  The offset sits in plane space, so it reads as a pile edge once the rug is tilted.
- **Grain** (`::after` of `.field`, `background-size: 160px`, opacity .06, `pointer-events: none`):

  ```
  url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")
  ```

- **Footprint glyph.** This is the one quiet motif, taken from the logo. It is used in promise-strip separators and the Saved empty state. 10×16, `fill: currentColor`:

  ```html
  <svg viewBox="0 0 10 16"><ellipse cx="5" cy="10.5" rx="3.2" ry="5"/><circle cx="2.2" cy="3.4" r="1.1"/><circle cx="4.3" cy="2.3" r="1.1"/><circle cx="6.4" cy="2.6" r="1"/><circle cx="8.1" cy="3.9" r=".9"/></svg>
  ```

- **Running stitch.** Kumkum, 2px wide, `stroke-dasharray: 10 8`, round caps, on kora and kora-2 only. The eyebrow dash is CSS:

  ```css
  .eyebrow::before {
    content: "";
    width: 28px;
    height: 2px;
    border-radius: 2px;
    background: repeating-linear-gradient(90deg, var(--kumkum) 0 6px, transparent 6px 10px);
  }
  ```

  At most two motifs (stitch and footprint) per viewport.

### 2.8 Motion tokens

- **Easing:**
  - `--e-out: cubic-bezier(.22,.8,.2,1)` for UI and entrances.
  - `--e-io: cubic-bezier(.65,0,.35,1)` for unroll and camera moves.
  - `--e-in: cubic-bezier(.5,0,.75,0)` for roll-up and exits.
  - `--e-dye: cubic-bezier(.7,0,.2,1)`.
  - No back or elastic easings.
- **Durations:** hover 160ms; UI 240ms; dye 700ms; roll-up 380ms; unroll 900ms (first load 1100ms); odometer 700ms; fly 720ms; autoplay 7000ms.
- **Motion gate.** `RM = matchMedia('(prefers-reduced-motion: reduce)')`. Every WAAPI call checks `!RM.matches && 'animate' in Element.prototype`.
- **Fine pointers.** Pointer effects only run under `matchMedia('(hover:hover) and (pointer:fine)')`.
- **Reduced motion in CSS.** Keep the existing global rule (`animation: none!important; transition: none!important`).

### 2.9 Component rules

- **Primary pill on light surfaces:**
  - 52px tall, Neel background, Chalk text, Hind 600 16px, padding `0 10px 0 24px`.
  - Trailing chevron in a 28px Chalk circle with a Neel "›" (the reference's "Get the look ›").
  - Hover: `--neel-2`, chevron moves `translateX(3px)`. Active: `scale(.98)`.
- **Pill on a field:** fg fill with `--on` text; the chevron circle is `--on` with an fg "›".
- **Secondary button:** transparent with a 1.5px ring: Kajal on light, fg at 75% on fields, Chalk at 55% on Neel.
- **WhatsApp button:** `--wa` with white text and an 18px WhatsApp glyph on the left.
- **Text links:** Neel on light; underline offset 4px, thickness 1px (2px on hover).
- **Copy buttons:**
  - Minimum 44px tall, Kora-2 fill, Kajal 14px/600.
  - Copied state: "Copied ✓" in `--wa`, for 1.5s.
- **Chips on light:**
  - 44px tall, 1px `--edge` ring, Kajal text.
  - Selected: Neel fill, Chalk text.
- **Chips on Neel:**
  - 1.5px ring of Chalk at 55%, Chalk text.
  - Selected: Chalk fill, Neel text.
- **Swatches:**
  - 44px circles with inline `style="--c:#hex"` and `background: var(--c)`, so they are never empty circles.
  - Thumbnails load **eagerly**.
  - Selected: `box-shadow: 0 0 0 3px var(--chalk), 0 0 0 5px var(--neel)`.
- **Size circles in cards:**
  - 48px, 1px `--edge` ring.
  - Selected: Neel fill, Chalk text.
- **Inputs:**
  - Chalk background, 1px `--edge` border, 14px radius, 52px minimum height, 16px text.
  - Focus: Neel border plus `box-shadow: 0 0 0 2px var(--neel)`.
- **Focus ring:** `:focus-visible { outline: 3px solid var(--focus, var(--neel)); outline-offset: 3px }`. Set `.field { --focus: var(--fg) }` and Neel/Night sections `{ --focus: var(--haldi) }`.
- **Touch targets:** every target is at least 44×44px. For small hearts, use a `::before` with `inset: -4px`.

---

## 3. Sections, top to bottom

Global head:
- Keep `<title>Soft Steps</title>` and the meta description.
- Add `<link rel="preload" as="image" href="img/s4.webp" fetchpriority="high">`.
- `body { background: var(--kora); color: var(--kajal); font: 400 17px/1.6 var(--text) }`.
- Images below the hero get `loading="lazy" decoding="async"`, **except** the swatch thumbnails, which load eagerly.

### S0. Skip link and sticky header (new)

- Keep `<a class="skip" href="#shop">Skip to the shop</a>`.
- **`#hdr`** (fixed, z 30, 64px tall; 56px on phone):
  - Chalk at 90% with `backdrop-filter: blur(12px) saturate(1.2)`. Inside `@supports not`, solid Chalk. 1px Sut bottom border.
  - Left: logo 32px plus "Soft Steps" in Fraunces italic 20px.
  - Centre (≥1100 only): links Shop (#shop), Colours (#colours), Sizes (#fit), How to order (#order), Contact (#contact).
  - Right:
    - `#hsaved`: heart circle with count `#hsavedn`.
    - `#hcart`: bag circle with Kumkum badge `#hcnt`, which has a 2px Chalk ring.
    - `#hmenu`: a "Menu" pill, shown at ≤980.
- It slides in with `translateY(-110%)` to 0 over 240ms `--e-out` when an IntersectionObserver on `#hero` reports it is not intersecting. While hidden it has `visibility: hidden`. No slide under reduced motion.

### S1. Hero `#hero.field` (the reference layout)

- **Desktop card:** `margin-top: calc(16px + safe-area-top)`, `min-height: min(820px, calc(100svh - 32px))`, padding `24px clamp(20px,3vw,44px)`, `--sh-hero`, radius 32px. Rows are `auto 1fr auto`.
- **Top bar:**
  - `a.logo`: logo.jpg at 44px in a 1px fg-at-30% ring, plus "Soft Steps" in Fraunces italic 22px. Not uppercase.
  - Nav pill `.navpill` (≥981): no fill, 1px fg-at-35% ring. Links are fg 15px/500: **Rugs & mats** (#hero, active: fg fill with `--on` text), **Colours** (#colours), **Sizes** (#fit), **How to order** (#order), **Contact** (#contact).
  - Right side: `#h-savedbtn` (heart with count `#h-savedn`, opens Saved), `#cartbtn` (kept, badge `#cnt` in Kumkum with a 2px `var(--f)` ring), and `#h-menu` (Menu pill, ≤980).
- **Stage grid:** `minmax(0,1fr) minmax(0,1.3fr) minmax(0,.7fr)`.
- **Left column (`.hcopy`):**
  1. Arrows `#prev` / `#nextBtn` (40px glass circles).
  2. Eyebrow "Rugs, doormats & bath mats · Vadodara".
  3. `h1#h-title`, rendering `SLIDES[hi].h` with `SLIDES[hi].a` in `<em>`.
  4. `p#h-lead`. The HTML default is slide 1's lead, so there is text without JS.
  5. CTA row: `#h-add` "Add to cart ›" (fg pill), then `#h-save` (48px glass heart toggle, `aria-pressed`, `aria-label="Save Rust Solid Premium Rug"`), then the link "See all 26 colours" (#colours).
- **Centre column:**
  - `.rugwrap` (perspective 1600px).
  - `#h-ghost`: ghost colour name (`SLIDES[hi].g`), aria-hidden, fg at 7% via `color-mix`, absolutely centred behind the rug, `white-space: nowrap`.
  - `.rug#h-rug` (float wrapper) > `.tilt` > `.plane` (`rotateX(38deg) rotateZ(-10deg)`, preserve-3d). The plane holds, in DOM order: `img#h-img` (first img; width `min(100%, 540px)`), `span.roll`, `span.sheen > i`. The plane is followed by the two shadow spans.
- **Right column (`.side`):**
  - `#h-price`: real text, visible by default. It becomes `.sr-only` once JS adds `.has-odo` to `.side`.
  - `#h-odo`: the odometer, `aria-hidden`.
  - `#h-name` "Solid Premium Rug · Rust".
  - "Choose your size:".
  - `#h-sizes`: 52px circles.
  - `#h-dims` "16×24 in · 450 g".
  - `#h-compare`: link button "Compare sizes".
- **Bottom row:**
  - Social links (Instagram, WhatsApp), 44px.
  - Tagline "Comfort, in every step" in Fraunces italic 20px.
  - A cluster with `#h-count` "01 / 06" (Fraunces italic 15px), then `#dots` (kept, restyled as 6 segments 24×2px with 6px gaps; `.on` is fg; on desktop the active segment's `::after` is the autoplay fill), then `#h-play` (32px circle; pause/play icon, `aria-pressed`, label "Pause slideshow"/"Play slideshow"; only present when autoplay is eligible).
  - `#h-next` thumbnail (96px, pose 38/-10) with `#h-nextname` "Next: Forest green".
- **SLIDES gets two new fields** (the copy is otherwise unchanged):

  | # | `a` (accent phrase) | `g` (ghost name) |
  |---|---|---|
  | 1 | every morning | Rust |
  | 2 | front door | Forest |
  | 3 | happy floors | Royal |
  | 4 | by the bed | Blush |
  | 5 | first rain | Aqua |
  | 6 | doorstep | Mustard |

- **Phone (≤860):**
  - Card radius 24px, no `min-height`.
  - Top bar: logo, Saved, Cart, Menu.
  - Rug first: `min-height: 240px`, width `min(88%, 420px)`, pose `rotateX(32deg) rotateZ(-8deg)`, ghost at 26vw.
  - Then arrows, eyebrow, H1, lead (16px).
  - Price row: odometer at 40px with the name beside it.
  - "Choose your size", then four 48px circles (222px), then dims and "Compare sizes".
  - CTA row: Add (flex 1) and a 48px heart.
  - "See all 26 colours".
  - Bottom row: social, counter and dots, next thumbnail at 72px. The tagline is hidden.
  - No autoplay. Swipe is kept.

### S2. Promise strip (`<section aria-label="Why Soft Steps">`, new)

- Sits on kora with 1px Sut hairlines top and bottom and 32px padding.
- Four facts, each with a 20px line icon in Neel (1.5px stroke), separated by footprint glyphs in Mitti:

  | Icon | Text |
  |---|---|
  | van | "Free delivery in Vadodara" |
  | phone with check | "Pay by UPI, confirmed on WhatsApp the same day" |
  | drop | "Machine washable, quick-drying" |
  | 3×3 dot grid | "Anti-slip latex backing" |

- A second line, right-aligned, holds the PIN check:
  - `form#pinf`: label "Check delivery to your PIN", `input#pin-in` (`inputmode="numeric"`, `maxlength="6"`, placeholder "6-digit PIN"), button "Check".
  - Result in `output#pin-out` (`aria-live="polite"`).
- **Phone:** the facts form a 2×2 grid; the PIN form goes full width below (input flex 1 plus the button).

### S3. Shop by colour `#colours` (new)

- Eyebrow "Shop by colour".
- H2 "Twenty-six colours, *three ranges*".
- Sub (Mitti 17px): "Every colour comes in the same four sizes. Tap one to see it on the rug."
- **Filter `#fam`** (radiogroup; uses the existing `radio()` and `arrows()` helpers; chips with three 8px colour dots each):

  | Chip | Dots |
  |---|---|
  | All 26 | |
  | Blues 6 | #1E2853 #1D3A8A #2AA5B8 |
  | Greens 4 | #3B4A28 #504621 |
  | Pinks & reds 4 | #EBC4BD #8C2630 |
  | Mustard & earth 6 | #D3913F #A34B19 #5A3826 |
  | Greys & blacks 6 | #46413C #A29D9C |

- `#fam-live` (visually hidden, polite) announces "Showing 6 colours: Blues".
- **Grid `#cgrid`:**
  - `repeat(auto-fill, minmax(124px, 1fr))` with a 16px gap on desktop.
  - **Phone:** 4 columns with an 8px gap (tiles about 83px). The chip row wraps; there is no horizontal scroller.
- **Tile:** a `<button>` with aria-label "Navy & cream, Multicolour Zigzag, from ₹249", holding:
  - A 1:1 image, 16px radius: the thumbnail from the swatch's `img/t/*.jpg`. Chenille tiles are a div with a `chen.jpg` background crop.
  - A 4px bar in the field colour.
  - The name in Fraunces italic 17px (13px on phone).
  - The range line in Mitti 13px, "Zigzag · from ₹249". On phone it is just "Zigzag" at 12px.
  - A separate heart toggle (`aria-pressed`) at the top-right of the image: a 36px Chalk-at-90% circle with a 44px hit area.
  - Hover (fine pointer): image `scale(1.04)`, tile `translateY(-2px)` plus `--sh-card`.
- **Tile order:** by family (Blues, Greens, Pinks, Mustard & earth, Greys), then Zigzag, Solid, Chenille.

### S4. The collection `#shop`

- Eyebrow "The collection".
- H2 "Three ranges, *26 colours*".
- Sub: "Every range comes in the same four sizes. Pick a colour and the rug's panel takes it on."
- **Each `article.prod[data-k]`** (no longer `.field` itself):
  - Chalk, 28px radius, padding 12px, `--sh-card`.
  - Grid `minmax(0,7fr) minmax(0,5fr)`. `.flip` (Solid) puts the panel on the right.
- **`.pic.field`** (the dye panel):
  - 20px radius, `min-height: 520px`; on phone `aspect-ratio: 4/3` with `min-height: 0`.
  - Lamp, grain and vignette as in §2.3.
  - Zigzag/Solid hold `.rugwrap > .rug > .plane > img` (first img, `alt` kept) `+ span.sheen > i`, plus the shadows. Pose 38/-10, width `min(86%, 520px)`.
  - Chenille holds `.chen-board`:
    - Chalk, padding 12px, radius 18px, 1px Sut hairline.
    - `#chen-frame` (overflow hidden, radius 12px, `aspect-ratio: 1200/1801` on desktop, `1/1` at ≤860) containing the existing chen.jpg img (first img; `width="1200" height="1801"`; `mix-blend-mode: multiply`).
    - Below it, a caption row: `#chen-cap` "Showing all ten colourways" and `button#chen-all.link` "See all ten" (hidden in the all state).
- **`.info`** (padding `clamp(20px, 3vw, 40px)`), top to bottom:
  1. Title row: `h3` and a heart toggle `[data-save]`. Chenille h3 text becomes "Striped Chenille" followed by `<span class="tag">New</span>` (Kumkum pill, Chalk 12px/600).
  2. Price row: `[data-price]` (Fraunces 34px) and `[data-dims]` (Mitti 15px).
  3. `.desc`: existing copy, Kajal.
  4. "Colour: `<span data-colour>`" (label Mitti, value Kajal 600).
  5. Swatches or chips. Chenille chips get a 28px image dot, a `span.dot` with a chen.jpg crop (§5).
  6. Size label row: "Size" plus the links "Which size?" (#fit) and "Compare sizes" (`[data-compare]` button).
  7. `.sizes-c`: 48px circles.
  8. `.buy`: stepper (Kora-2) plus `[data-add]` Neel pill, flex 1, min-width 200px; wraps.
  9. `.ask` row:
     - WhatsApp glyph in `--wa`.
     - `a[data-ask]` "Ask if Forest green & black (M) is in stock" (target `_blank`, rel `noopener`).
     - `button.copy[data-askcopy]` "Copy".
     - Mitti 14px "Replies 10am–8pm daily".
- **Fine print** below the cards (existing text, Mitti 15px): "Weights are ±5%. Colours can look slightly different on screen and stock changes, so we confirm your colour on WhatsApp before dispatch."
- **Phone:** the panel stacks above the info; 10 swatches wrap at 44px with 10px gaps; the dock takes over (feature 2).

### S5. Fit tool `#fit` (Neel section, `--f:#1F2E57; --fg:#FBF7F0`, radius 32px)

- **Left column:**
  - Eyebrow (Haldi, `lang="gu"` on the word): "<span lang="gu">ઉંબરો</span> · at your doorstep".
  - H2 "See it at *your door*" (accent in Haldi).
  - Lead (Chalk): "Pick a spot and a size. The mat, the doorway and a pair of feet are drawn to the same scale."
  - "Where will it go?" with `#spots` chips.
  - "Size" with `#fsizes` (48px circles in the Neel chip style).
  - "Your floor" with `#floors` chips: White marble (default), Kota stone, Wood, Grey tile, Red oxide.
  - `button#cmpall` "Compare all sizes" (`aria-pressed`).
- **Right column:**
  - `p#spotlbl` (moved **out** of the SVG into HTML, Mist 14px) "Main door, 36 in opening".
  - `figure.plan`: the SVG with walls in Night plus a 0.2px Chalk-at-40% stroke; the floor fill comes from the patterns; `#matR`/`#matH` filled with `url(#rugpat)`.
  - `p#fitcap` (Mist 14px): "Adult feet, 10 in long, for scale. Mat shown in Solid Premium · Rust."
  - `#readout` (Fraunces 24px Chalk, `b` in Haldi).
  - `p#fit-sugg` (Chalk 16px).
  - Button row: `#fit-add` (Chalk pill, Neel text, e.g. "Add Zigzag L · ₹349"), `#fitgo` (kept: secondary Chalk-ring pill "Shop size M ›"), and a "Compare sizes" link.
- **Phone:** controls first; the plan is full width; buttons go full width and stack.

### S6. Made for wet feet `#made` (kora)

- Two columns: the diagram on a Chalk panel (radius 28px) on the left, text on the right.
- **Text:**
  - Eyebrow "The material".
  - H2 "Made for *wet feet*".
  - Paragraph (existing): "Step out of the shower, in from the monsoon or off a dusty road. The pile soaks it up and the backing holds the floor."
  - `dl.specs` as hairline rows (Sut 1px; `dt` Kajal 600, `dd` Kajal):

    | `dt` | `dd` |
    |---|---|
    | Pile | Polyester microfiber and BCF yarn |
    | Backing | Latex, anti-skid |
    | Care | Machine washable, quick-drying |
    | Weight | 300 g for a zigzag M, up to 1715 g for a solid XL |

- **Diagram `#stack`:** see effect 6. Labels are HTML, with these exact texts:
  1. "Pile · polyester microfiber and BCF yarn"
  2. "Backing · latex, anti-skid"
  3. "Your floor · the backing holds it"
- **Phone:** diagram first at `aspect-ratio: 1/1`, labels as a plain list below it with no leader lines, then the text.

### S7. How to order `#order` (Kora-2 panel, radius 32px)

- Eyebrow "How to order".
- H2 "Order on WhatsApp, *pay by UPI*".
- **Left:** an `ol` of 4 steps with Fraunces italic numerals 01–04 in Kumkum, joined by a vertical running stitch. The step copy is existing:

  | Step | Copy |
  |---|---|
  | **Fill your cart** | Pick colour, size and quantity for each mat. |
  | **Add your address** | Name, phone, address and PIN code. |
  | **Pay by UPI** | Scan our QR or pay to panchaljelam@oksbi from any UPI app. |
  | **Send it on WhatsApp** | One tap sends the order. We confirm it the same day and dispatch. |

- **Right:** `.chat[data-ui]` restyled as a phone frame:
  - 300px wide, Night frame with 10px padding, radius 36px.
  - Inner Chalk screen. The header strip is in `--wa` with white text "Soft Steps · +91 90994 41429".
  - The bubble is Kora-2 with Kajal text. The text is existing and unchanged.
  - The note below: "An example of the message the site writes for you."
- **Phone:** the steps, then the phone mock centred at a maximum of 300px.

### S8. Before you order and Ask Jelam (`#faq`, `#contact`)

- Two columns on kora.
- **Left:** eyebrow "Questions", H2 "Before you order", the 6 existing `<details>` as hairline rows (no boxes).
  - Summary in Fraunces 20px.
  - The `+` sits in a 30px Kumkum-ring circle and rotates 45° when open.
- **Right:** `#contact` Chalk card (radius 28px):
  - Logo medallion 56px.
  - H2 "Ask Jelam".
  - Existing intro: "Soft Steps is run by Jelam Panchal in Vadodara. Ask about colours, sizes or stock and you get a reply the same day."
  - `.clist` hairline rows:

    | Label | Value | Action |
    |---|---|---|
    | WhatsApp | +91 90994 41429 (link) | Copy |
    | Email | softsteps.home@gmail.com | Copy |
    | Instagram | @softsteps.home | |
    | Hours | 10am to 8pm, every day | |
    | Visits | By appointment in Vadodara | (new row) |

  - Form `#enq` unchanged: Chalk inputs with edge borders. Submit is a Neel pill "Write my WhatsApp message ›". `#enqdone` shows the `--wa` pill "Open WhatsApp".
- **Phone:** single column.

### S9. Footer `#foot.field` (painted #141B36)

- Radius 32px.
- `p.name` "Soft Steps" in Fraunces italic 300 at `clamp(64px, 17vw, 240px)`, Chalk, `white-space: nowrap`, followed by a 10px Kumkum dot (the logo's heart).
  - At 390px, assert `.name.scrollWidth <= .name.clientWidth`. If it fails, use 15vw.
- `.foot-row`:
  - "Comfort in every step · Vadodara, Gujarat · © 2026".
  - Nav: Shop, Colours, Sizes, Questions, Contact, Instagram.
  - A Mist line: "WhatsApp +91 90994 41429 · 10am–8pm daily · UPI panchaljelam@oksbi".
- `margin-bottom: calc(var(--m) + 90px + safe-area)` (kept, so the cart bar never covers it).

### Overlays

- **`#cbar`** (kept): Kajal pill; `span:last-child` Chalk.
- **`#dock`** (new, phone only): see feature 2.
- **Toast `#toast`** (kept): Night background, Chalk text, a 1px Haldi top hairline. Position `top: calc(80px + env(safe-area-inset-top))` so it sits below the header.
- **Drawer `#drawer`:**
  - Chalk body.
  - `.dh` and `#prog` sit together on a Night block: `#dtitle` in Fraunces Chalk; `#dclose` a Chalk-at-15% circle; progress segments Mist at 30%, `.on` Haldi; labels Mist / Chalk.
  - Line cards on Kora, radius 18px. `.df` on Kora-2. Buttons Neel. `#sendwa` WhatsApp green. UPI box Chalk.
- **Dialogs** (native `<dialog>` with `showModal()`, `::backdrop { rgba(20,27,54,.5) }`, `html:has(dialog[open]) { overflow: hidden }`, close on a backdrop click):
  - `#saved`: Chalk, radius 28px, max 560px. On phone it is a bottom sheet: `margin: auto 0 0`, width 100%, `max-height: 88dvh`, top radius 28px.
  - `#compare`: as `#saved`, max 760px.
  - `#menu`: full screen, Night. Links in Fraunces 34px Chalk with a 40ms stagger rise (time-based): Rugs & mats, Colours, Shop, Sizes, How to order, Contact. A WhatsApp row "+91 90994 41429" with Copy. A close button.

---

## 4. Wow effects

There are no libraries. Every effect is behind the motion gate, runs on time or on a scroll *position* (never an observer that gates visibility), and its CSS default is the finished, visible state.

### 1. Hero slide choreography: dye, roll-up, unroll, words, odometer (P1)

- **Trigger:** `show(i, instant, from)` calls `fx("title", sl, hi)` (always) and then `fx("slide", data)`.
- **`title` hook:**
  - Renders `h1` as text + `<em>accent</em>`.
  - Sets `#h-ghost` to `sl.g` (crossfade: opacity .07 → 0 → .07 over 700ms).
  - Sets `#h-count` to "0N / 06".
  - Syncs `#h-save` `aria-pressed`.
- **`slide` hook** (returns `false` when instant, reduced motion, or no WAAPI, so the old `.out` path runs). It kills any running hero animations first, with `getAnimations().forEach(a => a.finish())`, then:
  1. **t=0:** the dye-bath starts from `from` (effect 2).
  2. **Words out:** if H1 words were split, each `span.w > span` animates `translateY(0)` → `-105%`, 300ms `--e-in`, 20ms stagger.
  3. **Roll-up:** `img.animate({clipPath: ['inset(-4% -4% -8% -4% round 2%)', 'inset(-4% 94% -8% -4% round 2%)']}, 380ms --e-in)`. At the same time `span.roll` (absolute, `left: 0`, `top: -2%`, height 104%, width 7% of the plane, radius 999, `opacity: 0` at rest, background `linear-gradient(90deg, rgba(0,0,0,.5), rgba(255,255,255,.25) 40%, rgba(0,0,0,.55)), color-mix(in srgb, var(--f) 80%, #000)`) animates `translateX(W)` → `translateX(.06W)` (W = `plane.offsetWidth`), opacity 0 → 1.
  4. **Swap:** set `src` and `alt`, then `await img.decode()` with a 600ms timeout.
  5. **Unroll:** clip `inset(-4% 94% ...)` → `inset(-4% -4% ...)` over 900ms `--e-io`. The roll goes `translateX(.06W) scaleX(1)` → `translateX(.97W) scaleX(.35)` (offset .9) → `translateX(W)` with opacity 0.
  6. **Words in:** split the new H1 words in JS only (`span.w{display:inline-block;overflow:clip;padding-bottom:.1em;margin-bottom:-.1em}`). The h1 gets a `.sr-only` full-text copy, and the split copy is `aria-hidden`. Animate `translateY(105%)` → 0, 700ms `--e-out`, 50ms stagger, `fill: 'backwards'`.
  7. **Lead and name:** opacity .3 → 1 over 300ms.
  8. **Odometer:** effect 1b.
  9. **On unroll finish:** sheen sweep. `.sheen i` goes `translateX(-60%)` → `translateX(160%)` over 1200ms `--e-io`, once.
- **First load:** the same unroll, 1100ms, starting at 150ms, plus the `.hcopy` children rising 18px over 700ms with a 70ms stagger. All time-based.
- **Prefetch:** after each slide settles, `new Image().src = SLIDES[next].full` on idle.
- **1b. Odometer.**
  - `odo(box, n)` builds `₹` + per digit `span.dg > span.col` holding 10 `span`s (0–9) at 1em each; commas are static.
  - `.odo { display: inline-flex; height: 1em; line-height: 1; overflow: hidden }` and `.col { transition: transform .7s var(--e-out) }`.
  - It sets `translateY(-d*10%)` with a 40ms delay per digit and rebuilds only if the length changes.
  - Called from `fx("price", z[3])` at the end of `hsSet`, so it covers both size change and slide change.
- **1c. Autoplay** (desktop only):
  - Eligibility: `matchMedia('(min-width:861px) and (hover:hover) and (prefers-reduced-motion:no-preference)')`.
  - `.hero.auto #dots span.on::after { animation: fill 7s linear forwards }`, with keyframe `scaleX(0)` → `scaleX(1)`, origin left. `animationend` calls `show(hi+1, false, $("#h-next"))`.
  - Pause with `animation-play-state: paused` on `.hero:has(.hcopy:hover, .side:hover)`, `.hero:focus-within`, and `.hero.paused`. `.paused` is toggled by `visibilitychange`.
  - Any manual interaction (prev, next, thumbnail, swipe, size, add, save) removes `.auto` permanently.
  - `#h-play` toggles `.auto` and `.paused`.
- **Fallbacks:** no JS: static slide 1 with the rug fully unrolled. Reduced motion: instant swap via the existing path, no autoplay. No WAAPI: the existing `.out` class path.
- **Performance:** only `clip-path`, `transform` and `opacity` on rug-sized layers. At most one timeline at a time.

### 2. Dye-bath colour change (P1)

- **Where:** the hero (from the arrow, the next thumbnail, or the rug centre on swipe), range panels (from the clicked swatch or chip), and colour-index clicks (via the swatch).
- **How:** `paint(el, hex, from)` → `fx("dye", el, hex, fg, on, from)`.
  - Panel = `el.matches('.field') ? el : $('.field', el)`.
  - Origin = centre of `from`, relative to the panel, **clamped to the panel rect**, so a swatch on the info side floods in from the nearest edge.
  - `R = Math.hypot(max(x, w-x), max(y, h-y))`.
  - Prepend two `<i class="dye">` layers (`position: absolute; inset: 0; z-index: -2; border-radius: inherit`, beneath the vignette and lamp at -1):
    - A wet edge, `color-mix(in srgb, hex 82%, #fff)`.
    - The main layer, `hex`, with a 90ms delay.
  - Both animate `clipPath: circle(0px at x y)` → `circle(Rpx at x y)` over 700ms `--e-dye`.
  - At 350ms, switch `--fg` and `--on` (never interpolated).
  - On finish: set `--f`, remove both layers, clear `el._dye`.
  - **Rapid clicks:** a new call first runs `el._dye.finish()` and `clearTimeout(el._dyeT)`, which commits the previous state.
  - Remove the `background-color` and `color` transitions from `.field`.
- **Fallbacks:** first paint, reduced motion, no WAAPI or a hidden tab all paint instantly.

### 3. Lamp-lit floating rug with velvet sheen (P1)

- **Where:** hero (all of it); range rugs (sheen only).
- **Lamp:**
  - `span.lamp` is the first child of the hero: absolute, `z-index: -1`, 70vmin circle, `background: radial-gradient(closest-side, rgba(255,238,210,.26), transparent)`.
  - Fine pointer: one shared rAF loop with lerp .08, writing `transform: translate3d()` **on that element only**. The loop stops when the pointer is still and while the hero is off-screen (IntersectionObserver).
  - Touch: CSS `@keyframes drift` for 18s alternating between `translate(-6%, -4%)` and `translate(6%, 5%)`.
- **Tilt (fine pointer):** `.tilt` gets `rotateX((.5-py)*6deg) rotateY((px-.5)*8deg)`, clamped to ±4°, lerp .1, eased back to 0 on leave.
- **Float:** `.rug { animation: float 7s ease-in-out infinite alternate }` from `translateY(0)` to `-8px`. The two shadows animate `scale(1)` → `.94` and opacity 1 → .85 in sync.
- **Sheen:**
  - `span.sheen`: absolute, `inset: 0`, `border-radius: var(--rr)` (JS sets `--rr = img.clientWidth * .019 + 'px'`, matching the webp's transparent corners at about 30/1600), `overflow: hidden`.
  - Inner `i`: width 60%, `background: linear-gradient(105deg, transparent 20%, rgba(255,244,228,.22) 50%, transparent 80%)`.
  - Fine pointer: `translateX` maps the pointer x over the rug from -60% to 160% (lerp .12). Touch: only the sweep after each unroll.
- **Reduced motion:** static lamp at 62%/36%, no float or tilt, sheen parked at 40%.

### 4. Range rugs unroll as you scroll (P1)

- **Where:** Zigzag and Solid `.pic img` only. Never text, prices or controls.
- **How:**

  ```css
  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
      .prod .plane img {
        animation: unroll linear both;
        animation-timeline: view();
        animation-range: entry 10% cover 35%;
      }
    }
  }
  @keyframes unroll {
    from { clip-path: inset(-4% 62% -8% -4% round 2%) }
    to   { clip-path: inset(-4% -4% -8% -4% round 2%) }
  }
  ```

  - At least 38% of the rug is always visible.
  - The unroll finishes before the rug reaches mid-viewport.
  - A full-page capture shows the rugs complete.
- **Fallback:** Firefox and older Safari show a static, full rug.

### 5. Chenille camera: zoom to the colourway (P2)

- **Rects** (px in the 1200×1801 photo), measured in this pass. Order is row-major, left then right, and matches the chip order:

  | # | Colourway | x, y, w, h |
  |---|---|---|
  | 0 | Forest green | 83, 142, 507, 257 |
  | 1 | Blush pink | 612, 142, 512, 257 |
  | 2 | Navy | 83, 411, 507, 272 |
  | 3 | Olive | 612, 411, 512, 272 |
  | 4 | Cocoa | 83, 694, 507, 278 |
  | 5 | Mustard | 612, 694, 512, 278 |
  | 6 | Berry | 83, 985, 507, 294 |
  | 7 | Grey | 612, 985, 512, 294 |
  | 8 | Black | 83, 1293, 507, 298 |
  | 9 | Blue | 612, 1293, 512, 298 |

- **Base CSS (no JS):** the img is `width: 100%; height: 100%; object-fit: contain`.
- **JS mode:** JS adds `.cam` to the frame. The img becomes absolute at 1200×1801px with `transform-origin: 0 0` and `transition: transform .9s var(--e-io)`.
  - All-ten state: `s = min(fw/1200, fh/1801)`, centred.
  - Zoomed state: `s = min(fw/(w*1.1), fh/(h*1.1))`; translate so that rect's centre sits at the frame centre.
  - When zoomed, `.chen-frame.zoomed::before` and `::after` add Chalk fades over the top and bottom 22%, so the neighbouring mats recede.
  - Recompute with a ResizeObserver.
- **Behaviour:**
  - The default is **all ten**: caption "Showing all ten colourways", even though Mustard is pre-selected.
  - A user pick (`fx("picked")` with `ready` true) zooms to that mat. The caption becomes "Showing the Navy colourway" and `#chen-all` appears.
  - "See all ten" zooms back out.
- **Reduced motion:** same end states, no transition.

### 6. Exploded layer diagram: "Made for wet feet" (P2)

- **Structure:** `#stack` (relative, `aspect-ratio: 4/3`, `perspective: 1400px`). Inside it, `.layers` (centred, width 72%, `aspect-ratio: 4/3`, `transform: rotateX(56deg) rotateZ(-28deg)`, preserve-3d) holds three absolute planes, radius 14px:
  1. **Pile:** `<img src="img/s2_close.jpg" loading="lazy" alt="">`, `object-fit: cover`, `filter: drop-shadow(0 4px 0 #1b5d68)`, `translateZ(70px)`.
  2. **Latex:** `#D9C7A6` + `radial-gradient(circle, #B9A582 1.4px, transparent 1.8px) 0 0/12px 12px` (the anti-skid dots), `translateZ(0)`.
  3. **Floor:** `#E8DDCB` + `linear-gradient(rgba(27,29,43,.12) 1px, transparent 1px) 0 0/24px 24px` and its 90° twin, `translateZ(-60px)`.
- **Labels:** HTML, absolutely positioned on the right at `top: calc(50% - 70px)`, `50%` and `calc(50% + 60px)`. Each has a `::before` leader: 56px of 1px Kajal at 40% with a 5px dot end. Desktop only.
- **Motion:** inside `@supports (animation-timeline: view())` with no-preference, each plane animates from a compressed state (pile `translateZ(10px)`, floor `translateZ(-8px)`) to the default, with `animation-range: entry 10% cover 40%`.
- **Fallback:** the exploded state, so all information is always visible.
- This replaces the flat aqua-noise square.

### 7. Fly-to-cart on a thread (P1)

- **Trigger:** `fx("fly", sourceEl, k, swatchBtn)` after `addToCart()`, called from:
  - the card `[data-add]`
  - `#h-add`
  - `#dock-add`
  - `#fit-add`
  - **Not** Saved adds (the dialog is in the top layer; the button shows "Added ✓" for 1.5s instead).
- **Target:** whichever cart is visible: `#hcart` if the header is shown, else `#cartbtn` if it is in the viewport, else `#cbar`.
- **Clone:**
  - `div.fly`: fixed, 56px circle, Chalk 2px ring, `--sh-float`.
  - Background: the swatch thumbnail; for chenille, the chen.jpg crop (formula in feature 1).
  - Path: a quadratic Bézier with P0 = source centre, P2 = target centre, P1 = (midpoint x, `min(y0, y2) - 160`), sampled into 17 keyframes `translate(x-28, y-28) scale(1 - .65t)`, 720ms `cubic-bezier(.5,0,.3,1)`.
- **Thread:**
  - A fixed full-viewport SVG (`#flylayer`, z 70, `pointer-events: none`) with the path `M x0 y0 Q x1 y1 x2 y2`.
  - Kumkum, 1.5px, `pathLength=1`, `stroke-dasharray: 1`, `stroke-dashoffset` 1 → 0 over 720ms, then opacity → 0 over 250ms, then removed.
- **Landing:** the target pulses `box-shadow: 0 0 0 0 rgba(169,46,31,.45)` → `0 0 0 12px transparent` over 500ms. The badge goes `scale(1)` → `1.35` → `1` over 300ms.
- **Fallback:** reduced motion or no WAAPI: the existing toast only.

### 8. Running stitch (P2)

- **Where:**
  - The How-to-order thread: an absolutely positioned SVG path down the numeral column, `aria-hidden`.
  - The eyebrow dashes.
- **How:**

  ```css
  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
      .thread {
        animation: sew linear both;
        animation-timeline: view();
        animation-range: entry 0% cover 40%;
      }
    }
  }
  @keyframes sew {
    from { clip-path: inset(0 0 100% 0) }
    to   { clip-path: inset(0) }
  }
  ```

- **Fallback:** fully stitched. Purely decorative.
- Keep the existing `.rise` view-timeline (a `translateY(28px)` entry) on H2s and panels. It is transform-only, which is compliant.

---

## 5. New features

### 1. Shop by colour index (section S3)

- **Build:** synchronously at script start, from the DOM swatches and chips.
- **FAM map** (keys are `data-n`):
  - **blues:** Navy & cream, Navy & white, Royal blue, Aqua, Navy stripe, Blue stripe
  - **greens:** Forest green & black, Olive & cream, Forest green stripe, Olive stripe
  - **pinks:** Blush pink & black, Berry red & pink, Blush pink stripe, Berry stripe
  - **earth:** Cocoa & cream, Mustard & tan, Mustard, Rust, Cocoa stripe, Mustard stripe
  - **greys:** Grey & black, Black & beige, Black, Grey, Grey stripe, Black stripe
- **Chenille crop for tiles** (and chip dots and fly clones), for a target box of size `B`:
  - `s = B*1.4 / rect.h`
  - `background-size: 1200*s px auto`
  - `background-position: (B/2 - (x + w/2)*s)px (B/2 - (y + h/2)*s)px`
- **Filter:**
  - Toggles `[hidden]`, with a FLIP animation: rects before, toggle, then remaining tiles animate their transform delta to 0 over 300ms `--e-out`. Entering tiles go `scale(.96)` → 1 over 240ms.
  - Updates `#fam-live`.
  - Remembers the choice in `ss_fam` (try/catch).
- **Tile click:**
  1. `card.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" })`.
  2. On `scrollend` (or a 500ms timeout): `swatch.focus({ preventScroll: true }); swatch.click()`. This runs `pickC` with the dye-bath; for chenille, also the camera zoom.

### 2. Always-reachable cart: sticky header plus contextual buy dock

- **Header:** S0. `#hcnt` and `#hsavedn` are synced in `fx("rendered", n)`.
- **`#dock`** (≤860 only):
  - Fixed, `bottom: calc(12px + safe-area)`, width `min(480px, 100% - 32px)`, Kajal pill, 60px.
  - Contents: `img#dock-img` (40px circle, the swatch thumbnail or chenille crop); `#dock-t` "Navy & cream · L" (Chalk 15px/600); `#dock-p` "₹349"; `button#dock-add` "Add" (Chalk pill, Kajal text, 44px).
- **Visibility:**
  - One IntersectionObserver per `.prod` (threshold `[0, .3]`) and one per `[data-add]` (threshold 0).
  - The dock shows for the card that is ≥30% visible while its Add button is not.
  - While shown, it sets `body.docked`, and CSS hides `#cbar` with `body.docked #cbar { display: none !important }`. `render()` is untouched.
  - Hidden while the drawer or any dialog is open.
- **Content:** label and price come from the card DOM: `[data-colour]`, the selected `.sizes-c` button text, and `[data-price]`.
- **Add:** `#dock-add` calls `card.querySelector("[data-add]").click()`, so cart logic stays single.
- **Motion:** `translateY(120%)` → 0 over 240ms; it just appears under reduced motion.

### 3. Saved shortlist (`ss_saved`)

- **Hearts:** on cards (`[data-save]`, the card's current colour), on tiles, and `#h-save` (the current slide).
  - Each toggles `"k|colour"` in an array in localStorage `ss_saved`, with try/catch and an in-memory fallback.
  - Validate on load with `SS.P[k]` and `SS.swatch(k, c)`.
  - `aria-pressed`. Saved fill: Kumkum on light surfaces, fg on fields.
- **Opening the list:** `#h-savedbtn` and `#hsaved` open `dialog#saved`, titled "Saved colours".
- **Each row** in `#saved-list`:
  - Thumbnail, range name, colour.
  - Mini M/H/L/XL radio circles (40px; default M).
  - The price for the chosen size.
  - "Add to cart": `SS.addToCart(k, idx, colour, 1)`, then the button shows "Added ✓".
  - "Remove".
- **Empty state:** footprint glyph plus "Tap ♡ on any colour to save it here."
- **Footer buttons:**
  - `a#saved-ask` (`--wa`): "Ask Jelam about these" →

    ```
    https://wa.me/919099441429?text=enc("Hi Jelam, are these in stock?\n• Multicolour Zigzag Rug – Navy & cream\n• …")
    ```

  - `a#saved-family` (secondary): "Send to family" →

    ```
    https://wa.me/?text=enc("Which one should we get? Soft Steps mats:\n• Multicolour Zigzag Rug – Navy & cream (from ₹249)\n…\nInstagram @softsteps.home · WhatsApp +91 90994 41429")
    ```

  - `button#saved-copy` "Copy list". Uses `SS.copyText`.

### 4. Ask about this exact mat

- **Where:** per card `a[data-ask]`, updated in `fx("updated")` and `fx("picked")`.
- **Link text:** "Ask if {colour} ({size letter}) is in stock". For chenille, use the chip label.
- **href:** `https://wa.me/919099441429?text=` + `encodeURIComponent("Hi Jelam, is the " + P[k].name + " in " + colour + ", size " + z[0] + " (" + z[1] + "), in stock?")`.
- **Copy:** `[data-askcopy]` gets the same text in `data-copy`, so the existing delegated copy handler works.

### 5. PIN delivery check (`ss_pin`)

- **`check(pin)`:**

  | PIN | Message |
  |---|---|
  | `/^390\d{3}$/` | "Vadodara: free delivery. We confirm on WhatsApp." |
  | `/^391\d{3}$/` | "Vadodara district: we'll confirm delivery charges on WhatsApp." |
  | `/^[1-9]\d{5}$/` | "Delivery across India: charges extra, confirmed on call. We confirm on WhatsApp." |
  | anything else | "Enter a 6-digit PIN code." |

- **Promise strip:** `#pinf` submit runs `preventDefault`, writes `#pin-out`, and stores `ss_pin`.
- **Checkout:**
  - A second listener on `#go` (added via `addEventListener`, so it runs after the core `onclick`) pre-fills an empty `#o-pin` from `ss_pin`.
  - On `#o-pin` input (6 digits): show the message in a new `small#pinnote` (`aria-live`) under the field.
  - For 390 only, check the `dl=vad` radio. For other valid PINs, check `dl=out`. 391 leaves the radio unchanged.
  - Then `dispatchEvent(new Event('change'))` on the checked radio, so the core `summary()` reruns.

### 6. Compare sizes (`dialog#compare`)

- **Open from:** `#h-compare`, every `[data-compare]`, and the fit-tool link.
- **Table** `#cmp-table`, generated from `P`. Wrap it in `.tablewrap { overflow-x: auto }`.
  - **Columns:** `<th scope="col">` "M · 16×24 in" / "H · 16×24 in half round" / "L · 20×32 in" / "XL · 24×60 in".
  - **Rows:** `<th scope="row">` with each range name.
  - **Cells:** a button showing the price (Fraunces 20px) and the weight (Mitti 14px; blank for chenille), with aria-label "Choose Solid Premium Rug size L, ₹499".
- **Cell click:** `SS.pickers[k](letter)`, close, scroll to the card.
- **Footnote:** "Weights are ±5%."

### 7. Fit tool upgrade (`fx("fit", fit, sp, d)` at the end of `drawFit`)

- **Mat fill:** the mat shows the last-picked rug at true scale.
  - `<defs><pattern id="rugpat" patternUnits="objectBoundingBox" width="1" height="1" viewBox="0 0 1600 876" preserveAspectRatio="none"><image id="rugimg" href="img/s4.webp" width="1600" height="H"/></pattern></defs>`.
  - `lastPick` is updated by `picked` and `title`.
  - Zigzag/Solid: `href = data-full`, viewBox `0 0 1600 naturalHeight`. Chenille: `href = img/chen.jpg`, viewBox = the mat rect, image 1200×1801.
  - CSS: `.plan .mat { fill: url(#rugpat) }`. Delete the #f1b23a fill. Feet are Chalk at .9.
- **Floors:** `#floors` sets `#floor`'s `style.fill` to one of these `userSpaceOnUse` patterns (units are inches):

  | Pattern | Base | Detail |
  |---|---|---|
  | `fl-marble` | #ECE9E3 | 2 vein paths, #CFC8BC, .25 |
  | `fl-kota` | #7D8A78 | 12-unit grid, #6F7B6A, .2 |
  | `fl-wood` | #A0714B | planks every 5, #8A5E3C, .2 |
  | `fl-tile` | #A7ABAE | 24-unit grid, #8F9396, .25 |
  | `fl-oxide` | #8E3B2E | flat |

- **Door spots only:** add a sill (the umbaro): rect at y 7 across the opening, height 1.2, `#E8DDCB`. Add a pair of chappals: two rounded 3.6×9.5 shapes, Chalk 0.3 stroke, `fill: none`, at x = mat right + 4, y = 12, rotated ±6°.
- **Compare all sizes** (`#cmpall`): dashed Chalk outlines (0.25 stroke, `dasharray .8 .6`) for M, L, XL rects and the H arc, labelled in SVG text at 3.2 units (about 12px at 358px width) in Hind 600 Chalk.
- **Suggestion `#fit-sugg` and `#fit-add`:**

  | Spot | Suggestion text | `#fit-add` |
  |---|---|---|
  | main | "Suggested: Multicolour Zigzag L (20×32 in), 2 in to spare each side." | Add Zigzag L · ₹349 |
  | bath | "Suggested: Solid Premium M or H (16×24 in), plush and absorbent for the bathroom door." | Add Solid Premium M · ₹349 |
  | bed | "Suggested: a 24×60 in XL runner along the side of the bed." | Add Zigzag XL · ₹599 |
  | kitchen | "Suggested: a 24×60 in XL runner along the counter." | Add Solid Premium XL · ₹849 |

  `#fit-add` adds that card's currently picked colour: `SS.addToCart(k, SIZEIDX[letter], colourFromCardDOM, 1)`, then flies from the plan mat.
- **Captions:** `#fitcap` reads "Mat shown in {range} · {colour}."

### 8. Gift note

- **UI:** in `#v-det`, a new `.box` after the address box:
  - `label > input#o-gift-on[type=checkbox]` "This is a gift".
  - It reveals `label` "Gift message" + `textarea#o-gift` (`maxlength="200"`) with the helper "It's sent to Jelam with your order on WhatsApp."
- **Message:** the order message adds `"\n\nGift note: " + text` just before `"\n\nI will share the UPI payment screenshot here."`.
- **No promises:** nothing about wrapping or packaging.

---

## 6. Preservation checklist

The core shop script stays one IIFE.

**Allowed surgical edits.** Only these:
1. **`fx` helper.** Add it at the top:

   ```js
   function fx(n){
     var h = window.SSFX && SSFX[n];
     if (!h) return false;
     try { return h.apply(null, [].slice.call(arguments, 1)); }
     catch (e) { return false; }
   }
   ```

   Also add `var ready = false`, and at the end of init set `ready = true` and expose:

   ```js
   window.SS = {P, SLIDES, SIZEIDX, pickers, addToCart, swatch, imgFor, inr, esc, toast, copyText, radio, arrows,
                render, openD, closeD, show, hsSet, getHi(){return hi}, getHs(){return hs}};
   ```

2. **`paint(el, hex, from)`:** the FG table plus `--on`. If `from && fx("dye", el, hex, fg, on, from)` succeeds, return; otherwise set the vars instantly. Delete `lum()`.
3. **`pickC`:** `paint(el, b.dataset.bg, ready ? b : null)`; at the end, `fx("picked", el, k, b, ready)`. **`upd`:** at the end, `fx("updated", el, k)`. The init uses `pickC(cbs[+el.dataset.def || 0])`.
4. **`add.onclick`:** `addToCart(...); fx("fly", el, k, cbs[s.c]); s.q = 1; upd();`. **`#h-add`:** after `addToCart`, `fx("fly", hero, sl.k, swatch(sl.k, sl.c))`.
5. **`show(i, instant, from)`:**
   - `paint(hero, b.dataset.bg, instant ? null : (from || $("#h-rug")))`.
   - After the text is set: `fx("title", sl, hi)`.
   - Before the fallback: `if (!instant && fx("slide", {sl, b, from})) return;`.
   - Prev and next pass `this`; the swipe passes `$("#h-rug")`.
6. **`hsSet`:** at the end, `fx("price", z[3], i)`. **`drawFit`:** at the end, `fx("fit", fit, sp, d)`. **`render`:** at the end, `fx("rendered", n)`. **`openD` / `closeD`:** `fx("drawer", true/false)`. The effect sets `.page.inert`, hides the dock, and traps Tab.
7. **Order button:** the gift-note line in the `#order-btn` `lastMsg`.
8. **Footer:** `paint($("#foot"), "#141B36")`.
9. **HTML data:** new `data-bg` values (§2.3), inline `style="--c:…"` on swatches and chips, swatch `<img>` without `loading="lazy"`, and `data-def="5"` on chenille. `SLIDES` gets `a` and `g`.

**Must keep working, unchanged in behaviour:**
- **Data:** `P` (names, sizes, weights, prices exact), `SIZEIDX`, `SLIDES` copy, `PH = "919099441429"`, `UPI = "panchaljelam@oksbi"`.
- **Pickers:**
  - Card colour and size radiogroups with roving tabindex and arrow keys (`radio()`, `arrows()`).
  - `aria-checked`.
  - Swatch `aria-label` and `title`.
  - `[data-colour]`, `[data-price]`, `[data-dims]` text.
  - The stepper `[data-q]` clamped 1–20.
  - The "Add to cart · ₹" label.
  - `pickers[k](letter)`.
- **Hero:**
  - IDs: `#hero`, `#prev`, `#nextBtn`, `#h-next`, `#h-nextimg`, `#h-nextname`, `#h-title`, `#h-lead`, `#h-name`, `#h-rug` (and the `.out` fallback), `#h-img`, `#h-price`, `#h-sizes`, `#h-dims`, `#h-add`, `#dots`, `#cartbtn`, `#cnt`.
  - Swipe threshold 50px.
  - `theme-color` meta update.
  - `.pic img` must remain the **first** img in each `.pic` (`imgFor` and `pickC` depend on it); chenille's first img stays chen.jpg.
- **Fit tool:**
  - IDs: `#fit`, `#spots`, `#fsizes`, `#wallL`, `#wallR`, `#spotlbl` (now HTML), `#matR`, `#matH`, `#feet`, `#readout`, `#fitgo`.
  - `SPOTS` and `FS` maths.
  - `#fitgo` sets every picker plus `hsSet`.
- **Cart:**
  - `cart` items `{id, k, size, colour, p, q}`.
  - The localStorage key **`ss_cart2`** (try/catch), with load validation.
  - `count`, `total`, `render`.
  - `#cbar`, `#cbn`, `#cbt` (hidden while the drawer is open or the cart is empty).
  - `#v-cart` delegated `[data-i][data-d]` +, −, Remove.
  - `#browse`.
- **Drawer:**
  - IDs: `#scrim`, `#drawer`, `#dtitle`, `#dclose`, `#prog`, `#v-cart`, `#f-cart`, `#sub`, `#go` (disabled when empty), `#v-det`, `#f-det`, `#back`, `#v-pay`, `#f-pay`.
  - `view()`, `openD`, `closeD`, Escape to close, focus return, body overflow lock.
- **Checkout:**
  - IDs: `#o-name`, `#o-ph`, `#o-ad`, `#o-ct`, `#o-pin`, `#o-email`, `input[name=dl]`, `#lines`, `#tot`, `#oerr`, `#order-btn`.
  - Validation regexes and messages exactly as today.
  - The order id `SS-xxxxxx`.
  - `#oid`, `#oname`, `#payamt`.
  - `#upil`: `upi://pay?pa=panchaljelam@oksbi&pn=Jelam%20Panchal&am={t}&cu=INR&tn=…`.
  - `#sendwa` (`wa.me` + encoded `lastMsg`).
  - `#copyorder`.
  - The QR `img/qr.jpg`.
- **Copy and enquiry:**
  - The delegated `[data-copy]` handler with `copyText` (clipboard plus `execCommand` fallback, "Copied" state).
  - `#enq` with `preventDefault`, validation `#eerr`, `#enqdone`, `#enqwa`.
- **Other IDs:** `#shop`, `#made`, `#order`, `#faq`, `#contact`, `#foot`, `#toast` (`role="status"`).
- **Isolation:** the new effects and features script is a separate `<script>` after the core. Each module is wrapped in `try { … } catch (e) {}`. If it fails entirely, the shop still works with instant swaps.

---

## 7. Acceptance checks

### A. Platform and hygiene
1. The Network panel shows only same-origin `img/*`, fonts.googleapis.com and fonts.gstatic.com. There are no `<script src>`, no iframes, and no external images.
2. Source grep finds none of: `alert(`, `confirm(`, `prompt(`, `print(`, `tel:`, `mailto:`, `lum(`.
3. Both forms (`#enq`, `#pinf`) `preventDefault`. Every `wa.me` and `upi://` link has a Copy alternative next to it.
4. **Zero console errors** across all the flows below, at both widths.

### B. Desktop 1440×900
1. The hero matches the reference:
   - Pill nav centred.
   - Logo with italic wordmark on the left; Saved and Cart on the right.
   - Headline left, rug centre, odometer price and four round sizes right.
   - Tagline bottom centre, next thumbnail bottom right.
   - Field #8A3A1A with Chalk text.
2. Click Next:
   - Dye floods from the arrow.
   - The rug rolls up and unrolls with the roll cylinder.
   - H1 words rise, with the accent in italic.
   - The odometer rolls ₹349 → ₹249.
   - The ghost reads "Forest". The counter reads "02 / 06". `theme-color` is #3B4A28.
3. Spam Next 8× quickly. After 1.2s:
   - `document.querySelectorAll('.dye').length === 0`.
   - The hero's `--fg` equals the FG table value for the current slide.
   - The text matches `SLIDES[hi]`.
4. Autoplay advances after about 7s when the pointer rests on the rug. It pauses when the pointer is over the text or side columns, on focus within the hero, and when the tab is hidden. `#h-play` toggles it. Clicking Prev stops it permanently.
5. Moving the pointer moves the lamp and sheen, and the tilt stays within ±4°.
6. Hero size L shows ₹499 and "20×32 in · 780 g".
7. Card Solid → Aqua:
   - The panel floods from the swatch side.
   - Text on the panel switches to Kajal.
   - The rug image updates.
   - The ask link reads "Ask if Aqua (M) is in stock".
8. Colour index → "Pinks & reds" shows 4 tiles and announces it. Tapping "Blush pink stripe" scrolls to Chenille, selects the chip, and zooms the camera to the top-right mat. "See all ten" restores the full sheet.
9. Fit tool:
   - Bathroom door + XL gives the "runs past the frame" readout.
   - The suggestion text appears for the spot.
   - "Add Solid Premium M" adds the card's current colour.
   - Floor chips recolour the floor; "Compare all sizes" draws labelled outlines.
   - "Shop size L" sets every card and the hero to L.
10. Range rugs unroll as they scroll into view (Chrome) and are fully unrolled by mid-viewport. The exploded diagram's labels are always visible.

### C. Phone 390×844
1. `document.documentElement.scrollWidth === 390`, and `[...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > 391)` returns only elements inside the overflow-clipped hero, footer or tablewrap.
2. The footer `.name` fits (`scrollWidth <= clientWidth`).
3. No autoplay; swipe changes the slide; the size circles are 48px; Add is full width.
4. All buttons and controls measure ≥44×44 (script over `button, [role=radio], .copy, summary`). All inputs compute `font-size >= 16px`.
5. The colour index is 4 columns and the filter chips wrap inside the page.
6. On a range card, scroll until Add is off-screen while the card is ≥30% visible:
   - `#dock` shows "{colour} · {size}" and a price.
   - Dock Add increments `#cnt`, `#hcnt` and `#cbar`.
   - Opening the drawer hides the dock and `#cbar`.
7. The Menu sheet opens, traps focus, closes on Escape, and links scroll to their sections.
8. Swatches show their colour **before** the thumbnails load (throttle the network to Slow 3G).

### D. Reduced motion (emulate `prefers-reduced-motion: reduce`)
- Slide changes are instant, with no dye and no unroll.
- There is no autoplay and `#h-play` is absent.
- After interactions, `document.getAnimations().length === 0`.
- Rugs are fully unrolled and the diagram is exploded.
- Everything is visible.

### E. Cart, details and pay flow
1. Add Zigzag Navy & cream L ×2 from the card and Solid Rust M from the hero. Fly-to-cart lands on the visible cart; the badge reads 3.
2. Open the drawer:
   - Line items, +/−, Remove and the subtotal all work.
   - Reload the page: the cart persists (`ss_cart2`).
3. Continue to details:
   - An empty submit gives "Add your name." with focus on `#o-name`.
   - A bad phone gives the phone message.
   - A short address, missing city, PIN "12345" and bad email each give their exact messages.
4. Enter PIN 390007:
   - `#pinnote` shows "Vadodara: free delivery. We confirm on WhatsApp."
   - The Vadodara radio is checked and the summary shows "Free".
   - With 560001, "Rest of India" is checked and the total shows "+ delivery".
5. Tick gift and type "Happy griha pravesh!". Place the order:
   - The pay view shows `#oid`, the name and the amount.
   - `#sendwa` href decodes to include "Gift note: Happy griha pravesh!" before the UPI screenshot line.
   - `#upil` matches the pattern in §6.
   - "Copy UPI ID" and "Copy the order text" show "Copied".
6. Close and reopen the drawer: focus returns to the opener; while the drawer is open, the page behind is inert.

### F. Features
1. Save 3 colours from a tile, a card and the hero:
   - The counts update in the hero and header.
   - Reload: they persist (`ss_saved`).
   - In the Saved dialog, "Add to cart" at size L adds the correct price.
   - The `#saved-ask` and `#saved-family` hrefs decode to the exact messages in §5. "Copy list" works.
2. In the Compare dialog, the table values equal `P`. Clicking "Solid Premium L" selects L on the Solid card and scrolls to it.
3. Promise-strip PIN 391240 shows the district message and does not change the radios.

### G. No-JS and failure modes
1. With JS disabled:
   - The hero shows slide 1's headline, lead, ₹349 and a fully visible rug.
   - Every section's text is visible, and nothing has computed `opacity: 0`.
   - The chenille image shows the whole sheet.
2. Throw inside the effects script (for example `window.SSFX = null`): the shop, cart, checkout and enquiry still work, with instant swaps.
3. With `localStorage` throwing: the page loads, the cart works for the session, and there are no errors.

### H. Contrast spot checks
Sample computed colours on each of the following and compare against §2.2 and §2.3. Fail the check if any text pair is below 4.5:1.
- Hero slides 4–6 (light fields with Kajal).
- Solid Mustard and Aqua panels.
- The Neel fit section.
- The Night footer and drawer header.
- Eyebrows (Haldi-deep on kora).