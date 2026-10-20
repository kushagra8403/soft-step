# Soft Steps: round-2 effects and extras (build spec)

Working copy read for this spec: `scratchpad/next/` (softsteps.html, fx.js, features.js, touchfx.js, shop.js, pairs.js, tryon.js, lang.js). Nothing there was changed.
Probes for this round are in `scratchpad/design2/probe2/` (`probe.cjs`, `pile.cjs`, `line.cjs` and their screenshots). Line references are to `next/softsteps.html` unless another file is named.

## 0. The set

Five effects go into the new file **`wow.js`**. They are spread down the page, and each has a different sensation. Nothing new is added to the hero, which is already the busiest zone.

| # | Key | Effect | Where | Sensation | Panel (A delight / B engineering) |
|---|---|---|---|---|---|
| W1 | `brush-the-pile` | Brush the pile | Solid Premium card `#r-sol` | stroke: the velvet changes shade under the finger | 9.5 / 8 |
| W2 | `clothesline-pairs` | Pairs on the washing line | `#pairs-list` (phones) | swing: cards sway on pegs after a fling | 7 / 7.5 |
| W3 | `chappals-off` | Chappals off at the umbaro | `#fit` plan SVG | walk: dusty soles arrive, chappals step aside, bare feet go on the mat | 7.5 / 8.5 |
| W4 | `step-on-it` | Step on it | `#made #stack` | press: the pile squashes and a damp foot soaks away | 8.5 / 7 |
| W5 | `rangoli-on-return` | Rangoli welcome | drawer `#sentbox` | drawn: a tipka rangoli draws itself when you return from WhatsApp | 8.5 / 7.5 |

Three extras go into the new file **`extras.js`**.

| # | Key | Extra | Where |
|---|---|---|---|
| X1 | `paying-safely` | Paying safely | `#order .order-l` (plus a short note in `#v-pay .upibox` once Jelam confirms) |
| X2 | `reply-hours-now` | Reply hours, live | `.prod .ask small` ×3 and a line in `#v-pay` |
| X3 | `where-will-it-go` | "Where will it go?" shortcut | `#shop .sechead` |

**Order down the page:** shop card (W1), then pairs (W2), then fit (W3), then made (W4), then the drawer after sending (W5). The extras sit at the trust points: the order section, the cards' "ask" lines and the pay step, plus a shortcut at the top of the shop.

**Changes from the idea texts.** Where the delight and engineering judges disagreed, I followed engineering.

- **W1:** Normal alpha compositing replaces `soft-light`. The tints are read from tokens, and the mask uses `img.currentSrc`. This removes the risk of blend modes inside a 3D context on Android GPUs (verified look in `probe2/nap-phone.png`). Recovery is time-based (dt) rather than counted per frame. There are no haptics.
- **W2:** The padding is CLS-neutral (`padding-top` +20, `margin-top` −20). A flex spacer at the end replaces extra right padding, because at 320px that padding made the 82% cards narrower, re-wrapped them and moved `#fit` by 22px (measured). Each visible card gets its own `rotate` write, instead of one custom property on the list. The cord and pegs are phone-only.
- **W3:** The walk is shortened to two soles plus the chappals themselves, because only 8–16 inches of floor show below the mat. The state is armed before the plan's middle is on screen, so the feet never visibly vanish. It replays only when the spot changes and the plan is visible.
- **W4:** No overshoot easing (SPEC §2.8 bans back and elastic easings). There is no blend mode or filter on 3D layers. The print has its own scroll-timeline keyframes kept in lock-step with `pileZ`.
- **W5:** The layout space is reserved while `#sentbox` is not rendered. The bold "Sent it?" is not rewritten, because lang.js translates that `<p>` as one rich string. "Welcome back." is a caption under the rangoli that is shown with `visibility`, so the height never changes.
- **X2:** No live minute clock, and so no `{time}` placeholder in lang.js. The status changes only at 10:00, 20:00 and midnight IST. It runs only for visitors whose time zone is India.
- **X3:** The chips are buttons, not a radiogroup, because each pick scrolls the page and moves focus; arrow-key selection must not jump the page. The fit tool's own SUG map is reused through a one-line export. If that export is missing, the shortcut is not shown at all.

---

## 1. Shared contract

### 1.1 Loading

```html
<!-- after lang.js, at the end of <body> -->
<script src="wow.js" defer></script><script src="extras.js" defer></script>
```

At top level, both files only check gates, inject one `<style>` and attach observers and listeners. No module does visible work before its section is near. No module adds anything to the hero, so LCP (the hero `#h-img`) is untouched.

### 1.2 Gates (top of wow.js)

```js
var SS = window.SS, doc = document;
if (!SS || typeof window.SSFX_on !== "function") return;
var C = navigator.connection;   /* light gate: Data Saver or 2G loads no effects */
if (C && (C.saveData || /(^|-)2g$/.test(C.effectiveType || ""))) return;
var RM = mq("(prefers-reduced-motion: reduce)"), WAAPI = "animate" in Element.prototype;
function motion() { return !RM.matches && WAAPI; }           /* same gate as fx.js / touchfx.js */
var TOUCH = mq("(hover: none), (pointer: coarse)"), PHONE = mq("(max-width: 620px)");
```

extras.js has no light gate, because its features are content and help on a weak signal too.

### 1.3 Helpers shared by the wow.js modules

- **`$`, `$$`, `mq`, `listen(m, fn)`:** as in fx.js.
- **`on(name, fn)`:** wraps `SSFX_on(name, function(){ try { fn.apply(null, arguments); } catch (e) {} return false; })`. Every wow.js hook returns **false**, so it never claims a core path.
- **`tok(name, fallback)`:** `getComputedStyle(doc.documentElement).getPropertyValue(name).trim() || fallback`. Motion tokens are read once:
  `E = { out: tok("--e-out","cubic-bezier(.22,.8,.2,1)"), io: tok("--e-io",…), inn: tok("--e-in",…), dye: tok("--e-dye",…) }`.
- **`rgbOf(cssColour)`:** returns `[r,g,b]` via a 1×1 canvas (`fillStyle = v; fillRect; getImageData`). It accepts hex, `rgb()`, `color-mix()` and `oklch()`, so the new palette can use any notation.
- **`near(el, fn, margin)`:** a one-shot IntersectionObserver (`rootMargin` default `"600px 0px"`). Without IO it runs `fn` on idle.
- **`store` / `sess`:** get and set on localStorage / sessionStorage inside try/catch, with an in-memory fallback. Keys used: `ss_wow_nap` (W1 hint seen), `ss_wow_step` (W4 auto-play done), `ss_wow_rg` (W5 order id already welcomed). wow.js **never** writes the core's keys (`ss_cart2`, `ss_pending`, `ss_saved`, `ss_fam`, `ss_pin`, `ss_lang`). W5 only reads `ss_pending`.
- **`mod(name, init)`:** runs `init` in try/catch and keeps the returned `{reset}`. On `listen(RM, …)` every module's `reset()` runs, which stops loops, finishes animations and clears inline styles.
- **`uvMap(img, plane3d)`:** maps a pointer event to `{u, v}` in 0..1 on a tilted plane.
  - **Primary:** `u = e.offsetX / img.offsetWidth`, `v = e.offsetY / img.offsetHeight`. Blink inverse-projects through 3D transforms. This was verified exact (≤0.1px) on the Solid card plane and on the `#made` pile at translateZ(70px), at 390×844 touch and 1440×900 (`probe2/probe.cjs`, `probe2/pile.cjs`).
  - **Self-test on first use:** append a zero-size `<i>` at the img's centre and at 90%/80% inside a wrapper with the img's own transform, then dispatch a synthetic `PointerEvent("pointermove", {clientX, clientY})` on the img. Mark the event in a WeakSet so stroke handlers ignore it, then compare `offsetX/Y`. If the error is more than 2px, switch to the fallback.
  - **Fallback:** project the four corners the same way and invert the square-to-quad homography (Heckbert): `sx=x0−x1+x2−x3, sy=y0−y1+y2−y3, dx1=x1−x2, dx2=x3−x2, dy1=y1−y2, dy2=y3−y2, den=dx1·dy2−dx2·dy1, g=(sx·dy2−dx2·sy)/den, h=(dx1·sy−sx·dy1)/den, a=x1−x0+g·x1, b=x3−x0+h·x3, c=x0, d=y1−y0+g·y1, e=y3−y0+h·y3, f=y0`. Invert the 3×3 `[[a,b,c],[d,e,f],[g,h,1]]` with its adjugate and apply it to `(clientX, clientY, 1)`. The corners are re-read at each stroke start.

### 1.4 Colour role tokens (injected with zero specificity, so the palette can remap them)

```css
:where(:root){
  --wow-lit:var(--chalk);   --wow-shade:var(--kajal);          /* W1 pile shading */
  --wow-cord:var(--mitti);  --wow-peg:var(--mitti); --wow-peg-hi:var(--kora-2);   /* W2 */
  --wow-dust:var(--kajal);                                      /* W3 chappal prints */
  --wow-damp:var(--kajal);  --wow-bead:var(--chalk);            /* W4 */
  --wow-dot:var(--mitti);   --wow-loop:var(--kumkum); --wow-petal:var(--haldi); --wow-foot:var(--neel);   /* W5 */
}
```

No module types a hex value. The palette work in progress (`design2/quiet/quiet.css`) makes kumkum "errors only" and haldi "on dark only". That palette should remap `--wow-loop` (for example to `var(--haldi-deep)`) and `--wow-petal`, and leave the modules alone. Shadows use `color-mix(in srgb, var(--kajal) 18%, transparent)`.

### 1.5 Rules for every module

- **CSS defaults to the finished state.** JS only adds motion.
- Animate only `transform`, individual `translate` / `rotate` / `scale`, `opacity`, `stroke-dashoffset` and canvas pixels.
- **CLS is zero by construction.** New elements are absolutely positioned, or are inserted only while their container is not rendered or is off screen (§1.6).
- **Never touch the buy flow.** wow.js never calls `addToCart`, `openD`, `closeD` or `render`. It never calls `preventDefault` on click, touch or pointer events, never moves focus, and never edits `#sendwa`, `#upil`, `#order-btn`, the stepper or the swatches.
- Every loop is driven by dt (`performance.now()`) and stops itself (no rAF when settled), and it stops while `document.hidden` is true.
- **Every new visible string is plain English text**, picked up by the lang.js dictionaries (§4). Nothing uses `data-noi18n`, except where noted.

### 1.6 CLS guard (extras.js, and W5)

`whenQuiet(el, fn)`: if `el` is not rendered (`!el.getClientRects().length`, or it sits in `#drawer[hidden]`), or its rect is outside the viewport, run `fn` now. Otherwise wait for an IntersectionObserver report of `isIntersecting === false`, then run it.

### 1.7 Budgets (whole files)

| | wow.js | extras.js |
|---|---|---|
| Size | ≤ 14 KB minified / ≤ 5.5 KB gzip | ≤ 6 KB minified / ≤ 2.5 KB gzip |
| Top-level execution | ≤ 3 ms at 4× CPU | ≤ 2 ms at 4× CPU |
| LCP change | none (±50 ms noise) | none |
| CLS attributable | 0 | 0 |
| Network | none (W1's mask reuses the card's own image URL from cache) | none |

---

## 2. Effects (wow.js)

### W1. Brush the pile (`brush-the-pile`)

**What the visitor sees.** Run a finger sideways across the Solid Premium rug, or move the mouse over it on desktop. The pile turns lighter or darker in a soft swath, the way plush does when brushed against its nap. Stroking *with* the nap changes nothing, and stroking across or against it shows. The swath settles back over about 2.5 seconds. Picking another Solid colour clears it.

**DOM hooks**
- Image: `#r-sol .pic .plane img`. After `SSIMG` flattening it is a plain `<img>` inside `picture[data-flat]{display:contents}`.
- New `<canvas class="wow-nap" width="48" height="40" aria-hidden="true">` inserted into `#r-sol .plane` **immediately before** `#r-sol .plane .sheen`, so the sheen stays on top.
- New hint `<span class="wow-hint" aria-hidden="true"><svg…/>Stroke the pile</span>` appended to `#r-sol .pic`, at the bottom-left. `.tgo` from tryon.js is top-left and `.zopen` from shop.js is top-right.
- Card tone: `#r-sol.dataset.tone` (`"dark"` / `"light"`, set by the core's `paint()`).

**CSS (injected)**
```css
#r-sol .plane img{touch-action:pan-y pinch-zoom}
.wow-nap{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;border-radius:var(--rr,10px)}
@supports (animation-timeline:view()){@media(prefers-reduced-motion:no-preference){
  .prod .plane .wow-nap{animation:unroll linear both;animation-timeline:view();animation-range:entry 10% cover 35%}}}
.wow-hint{position:absolute;left:12px;bottom:12px;z-index:3;display:inline-flex;align-items:center;gap:8px;min-height:32px;padding:0 12px;
  border-radius:999px;background:var(--glass);box-shadow:inset 0 0 0 1px var(--ring35);color:var(--fg);font:600 13px/1 var(--text);
  pointer-events:none;opacity:0;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.wow-hint svg{width:18px;height:10px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round}
.wow-hint.on{opacity:1}
@media(prefers-reduced-motion:no-preference){.wow-hint{transition:opacity .24s var(--e-out)}}
@media(min-width:861px){.wow-hint{left:20px;bottom:20px}}
```
The mask is set inline from JS as an absolute URL, so a relative `url()` inside a custom property can't misresolve:
`cv.style.webkitMaskImage = cv.style.maskImage = 'url("' + (img.currentSrc || img.src) + '")'` with `mask-size:100% 100%; mask-repeat:no-repeat; mask-position:0 0`.
On phones the source is `img/m/s*.avif`. It has alpha, and masking with it works (`probe2/nap-phone.png`).

**Technique**
- **Field:** `nx, ny = Float32Array(48*40)`, rest vector `REST=(0,1)` (nap lying toward the viewer). The light comes from the lamp side, `L=(0.94,−0.34)`, so `s0 = REST·L = −0.34`.
- **Lazy init:** on the first `pointerenter` (mouse) or `pointerdown` (touch or pen) on the img:
  1. create the canvas;
  2. set the mask;
  3. read tints: `lit = rgbOf(cs.getPropertyValue("--wow-lit"))` and `shade = rgbOf(…"--wow-shade")` from `getComputedStyle(#r-sol)`;
  4. run the `uvMap` self-test.

  Nothing exists before this point.
- **Stroke:**
  - Mouse brushes on any hover movement.
  - Touch and pen brush only between `pointerdown` and `pointerup` / `pointercancel`. Touch is implicitly captured to the img; a vertical gesture becomes a page scroll and fires `pointercancel`, which ends the stroke.
  - For each coalesced event (`e.getCoalescedEvents?.() || [e]`), get `p = uv × (48,40)`. Accumulate distance from the previous point until it is at least 0.2 cells. Then walk the segment in 0.75-cell sub-steps. At each sub-step, every cell within `R = 4.5` cells is pushed toward the stroke direction `dir`: `n += (dir − n) · 0.85·(1 − dist/R)²`.
- **Shade per cell:**
  - `s = (n·L)/|n|`, `d = s − s0`.
  - If `d > .02`, the pixel is `lit` with alpha `A_lit·min(1, d/1.1)`. If `d < −.02`, it is `shade` with alpha `A_shade·min(1, −d/.6)`. Otherwise the alpha is 0.
  - Tone-tuned alphas: `dark` gives `A_lit .26 / A_shade .18`; `light` (Aqua, Grey) gives `A_lit .14 / A_shade .24`.
  - Write one `ImageData(48,40)` and call `putImageData`. CSS upscales it about 6× on phones and 11× on desktop, and bilinear smoothing turns it into soft velvet swaths.
- **Loop:** one rAF while active.
  - When no input has arrived for 300ms, recovery runs `n += (REST − n)·(1 − exp(−dt/900))`, with dt in ms clamped to 48.
  - Settled means `max|n − REST| < .03`: then `clearRect` and the loop stops.
- **`picked` hook** (`k === "sol"`): end any stroke, reset the field, `clearRect`. On the img's next `load` (or now if it is `complete`), re-set the mask to `img.currentSrc` and re-read the tints, since the tone can change.
- **Hint:**
  - An IntersectionObserver on `#r-sol .pic` at threshold 0.6 checks `!store.get("ss_wow_nap")`.
  - After 900ms, if the card is still at ≥0.6 and no stroke has happened, add `.on` and set `ss_wow_nap=1`.
  - Remove `.on` on the first stroke, or after 5s.
  - The hint shows once per browser.

**Timing:** the recovery time constant is 900ms, with the visible tail gone by about 2.5s. The hint fades in and out over 240ms with `--e-out`. The swath follows the finger 1:1, with no easing.

**Phone vs desktop**
- **Phone:** horizontal strokes brush. Vertical scroll and pinch-zoom still work through `touch-action: pan-y pinch-zoom`. A still tap still opens the `#zoom` viewer through shop.js's img click; a moved touch fires no click.
- **Desktop:** hovering brushes, and a click opens the viewer.
- It fits at 320px: the hint is about 130px wide in a 288px panel.

**Reduced motion:** brushing still follows the pointer 1:1. It is direct manipulation and nothing moves by itself. There is **no recovery animation**: the field resets and the canvas clears on `pointerup`, `pointercancel` or `pointerleave`, and after 600ms without mouse movement. The hint appears without a fade (the global rule kills transitions).

**Performance budget**
- Zero work before the first pointer on the Solid rug.
- Each pointermove costs ≤0.15ms (about 64 cells × sub-steps).
- Each active frame costs ≤0.4ms at 4× CPU (1,920 cells plus a 7.7KB `putImageData`).
- It adds one tiny composited canvas layer and no rAF when settled.

**Accessibility:** the canvas and hint are `aria-hidden` and not focusable. Pile and plushness are already described in the card text and in "Made for wet feet". The `.zopen` button stays the keyboard and screen-reader route to look closer. Focus is never moved.

**Conflicts to avoid**
- fx.js writes `.sheen i` transforms on `.pic` pointermove (desktop). W1 doesn't touch the sheen, and the canvas sits under it.
- Keep the canvas in the same scroll-driven `unroll` clip as the img (the CSS above), or the shading would show over a rolled-up rug.
- Don't add `mix-blend-mode`, `filter` or `opacity < 1` to the canvas's ancestors (`.plane`), because that would flatten the 3D plane.
- Don't run on the hero (swipe and drag-tilt live there) or on Zigzag or Chenille.

**Acceptance tests**
1. **Horizontal swipe** (390×844, touch emulation): a swipe across `#r-sol .plane img` from u=.2 to u=.8 at v=.5 leaves a visible swath. Lightness along the path changes by at least 6 L* against a pre-stroke screenshot, and `scrollY` is unchanged.
2. **Vertical swipe:** a swipe starting on the rug scrolls the page.
3. **Still tap:** a still tap opens `dialog#zoom`.
4. **Settles:** 3.0s after the last movement, the canvas alpha is 0 everywhere and no wow.js rAF callbacks fire (Performance trace).
5. **New colour:** picking Aqua clears the canvas at once. The mask URL equals the new `img.currentSrc`. A pixel at 2%/2% of the plane (the transparent corner) matches the field colour within ±2.
6. **Before any pointer:** there is no `.wow-nap` element in the DOM.
7. **Reduced motion:** the stroke draws, and the canvas is clear within one frame of `pointerup`.
8. **Performance:** continuous stroking at 4× CPU gives frame time p95 ≤ 16.7ms, with wow.js ≤ 1ms per frame.
9. **No side effects:** Zigzag and Chenille cards behave as before, and CLS is 0.
10. **Translation:** with Gujarati active, the hint shows the Gujarati string.

**New English strings:** "Stroke the pile"

---

### W2. Pairs on the washing line (`clothesline-pairs`)

**What the visitor sees.** On phones, a thin cotton cord runs across the top of the "Colours that go together" row, and each pair card hangs from it by a small wooden peg. Fling the row and the cards sway on their pegs like mats drying in the sun, then settle as the row snaps. This happens at 620px and below only. Wider screens are unchanged and keep their existing hover tilt.

**DOM hooks:** `#pairs #pairs-list` (`ul.pairs-list`, a flex scroll-snap row at ≤620px, line 881) and its `li.pair` children (rendered by pairs.js). There are no new elements: the cord is a background, and pegs and the end spacer are pseudo-elements.

**CSS (injected; checked in `probe2/line.cjs`, with card and `#fit` positions identical before and after at 390 and 320)**
```css
@media (max-width:620px){
  #pairs-list{padding-top:24px;margin-top:-20px;overflow-y:hidden;
    background:linear-gradient(var(--wow-cord),var(--wow-cord)) 0 10px/100% 1.5px repeat-x;background-attachment:local}
  #pairs-list::after{content:"";flex:0 0 12px}             /* end room for the last card's swing; card widths unchanged */
  #pairs-list>.pair{position:relative;transform-origin:50% -10px}
  #pairs-list>.pair::before{content:"";position:absolute;left:calc(50% - 4px);top:-15px;width:8px;height:22px;border-radius:3px;z-index:1;pointer-events:none;
    background:linear-gradient(90deg,transparent 3.25px,var(--wow-peg-hi) 3.25px 4.75px,transparent 4.75px),var(--wow-peg);
    box-shadow:0 1px 1px color-mix(in srgb,var(--kajal) 18%,transparent)}
}
```
- **Why the box doesn't move:** the original padding-top is 4px. +20px of padding with −20px of margin nets zero, and the list's raised top overlaps only the empty bottom margin of `.sechead` (28px on phones).
- **Why there is no extra padding-right:** cards are `flex: 0 0 82%` of the content box, so padding-right would narrow them and re-wrap their text. That was measured as a 22px shift of `#fit` at 320px.
- **Why `overflow-y: hidden`:** the list must never become vertically scrollable mid-swing.

**Technique (JS, phone and motion only)**
- **Lazy:** `near(#pairs-list, init, "300px 0px")` while `PHONE.matches && motion()`. Listen to `PHONE` changes to attach or detach.
- **Velocity:** a passive `scroll` listener on the list computes `vNew = ΔscrollLeft/Δt` (px/ms), smoothed with `v = .6v + .4vNew`, and records `lastScroll = now`.
- **Target angle:** `T = clamp(−1.4·v, −3.5, 3.5)` degrees while `now − lastScroll < 80ms`, else 0. Content moving left makes the bottoms trail right, which is counter-clockwise.
- **One damped spring per card `i`** (physics, not an easing):
  - `θ'' = −ω_i²(θ − T) − 2ζω_iθ'`, with `ω_i = 2π·1.05·[1, .94, 1.07][i%3]` rad/s and `ζ = .32`.
  - Semi-implicit Euler, dt in seconds clamped to .032, sub-stepped above .016.
- **Writes:** an IntersectionObserver on each `li` marks it in view. Only in-view cards get `li.style.rotate = θ.toFixed(2)+"deg"`, and only when the value changes by more than .01. During motion each in-view card also gets `will-change: rotate`, which is cleared at rest.
- **Settle:** when every `|θ| < .03` and `|θ'| < .05` and `now − lastScroll > 150ms`, clear all inline `rotate` and `will-change` and stop the rAF. It also stops when `document.hidden`.

**Timing:** the response follows the finger's fling. The first counter-swing is about 35% of the swing, and it is still within about 2.5s of the last scroll. Rotation is capped at ±3.5°.

This is the one deliberate exception to SPEC §2.8's "no elastic" rule. It is not a UI easing: it is a physical sway driven by the visitor's own fling, and it is small and short.

**Phone vs desktop**
- **Phone:** only here.
- **321–620px:** the same behaviour.
- **Above 620px:** nothing is injected and nothing is listened to.
- At rest the rotation is exactly 0, so "Add both" is never tilted when tapped. A tap during a swing still lands, because hit-testing follows the transform.

**Reduced motion:** cord and pegs only (pure CSS). No listeners, and no inline `rotate` ever. A runtime switch to reduce stops the loop and clears the inline values.

**Performance budget:** no work until the row scrolls. While moving, at most 3 `rotate` writes per frame (the in-view cards) and ≤0.3ms of script and style per frame at 4× CPU. Idle at rest.

**Accessibility:** the pegs, cord and spacer are pseudo-elements and backgrounds with no semantics. List semantics, focus order, keyboard scrolling and snap are unchanged.

**Conflicts to avoid**
- pairs.js renders the cards. Only `rotate` is written on `.pair` (the hover tilt is on `.pv > span`, a different element).
- Don't use `padding-right` for end room (see above).
- Don't write a custom property on the `ul` per frame: that would restyle every card subtree.
- Ship this or a toran (header flags), never both.

**Acceptance tests**
1. **No shift:** at 390×844 and 320×844, injecting the CSS leaves `#pairs-list .pair` and `#fit` `getBoundingClientRect().top` unchanged (exactly as `probe2/line.cjs` reports).
2. **Cord and pegs:** the cord is visible behind the last card after scrolling to the end, and each card's peg is centred on its top edge and overlaps the cord.
3. **Fling:** a fling of 600px of `scrollLeft` in 300ms gives in-view cards a rotation within ±3.5°. Within 3s of the last scroll event no card has an inline `rotate`, and no rAF remains.
4. **During the swing:** `ul.scrollHeight === ul.clientHeight`, and snap positions are the same as before.
5. **"Add both"** mid-swing adds both mats.
6. **Reduced motion:** no inline `rotate` is ever set.
7. **Above 620px:** no cord and no pegs.
8. **Performance:** at 4× CPU, no fling frame over 16.7ms is attributable to wow.js.

**New English strings:** none.

---

### W3. Chappals off at the umbaro (`chappals-off`)

**What the visitor sees.** When the doorway plan scrolls in, two dusty chappal-sole prints appear at the bottom of the plan, heading for the mat. The chappals arrive at the mat's edge and step aside to their usual spot beside it. Then the bare feet (already drawn for scale) settle onto the mat. Switching between Main door and Bathroom door replays a short version. Bedside and Kitchen counter have no door: the feet simply step on. The final picture is exactly today's drawing.

**DOM hooks (SVG user units are inches, `viewBox 0 0 84 40`, line 1139)**
- **`#chappals`:** a `g` whose `transform` attribute is owned by features.js `onFit`. It is `translate(min(42 + d0/2 + 4, 75.4) 12)`, so x is 58 for M and H, 62 for L and 75.4 for XL. It is `hidden` for bed and kitchen.
- **`#feet`:** a `g` whose `transform` attribute is owned by the core's `drawFit`: `translate(42 16)`, or `translate(42 15)` for H.
- **The mat:** `#matR`, with y=8 and height `d1` of 16, 20 or 24; or `#matH` (H, whose bottom is 24).
- **New, created once when `#fit` is within 800px:**
  - `g.wow-walk` (`aria-hidden="true"`), inserted immediately before `#chappals`;
  - `g.wow-ch`, holding all of `#chappals`' children;
  - `g.wow-ft`, holding all of `#feet`' children.

  Wrapping changes nothing visually.

**Geometry**
- Mat bottom `yB = 8 + d1` (H = 24). The standing chappals sit at `x0 = 38` (the pair centred on x=42) and `ys = yB + 1`.
- The side spot comes from `m = chappals.transform.baseVal.consolidate()`: `chX = m ? m.matrix.e : 58`, `chY = m ? m.matrix.f : 12`. The start offset for `g.wow-ch` is `dx = 38 − chX`, `dy = ys − chY` (M: −20, 13; L: −24, 17; XL: −37.4, 21).
- **Prints:** two `rect`s (3.6 × 9.5, `rx 1.8`, `fill: var(--wow-dust)`, `opacity 0`).
  - Left sole at `x 38, y ys + 13`, rotated `rotate(−6 39.8 cy)`.
  - Right sole at `x 42.4, y ys + 6.5`, rotated `rotate(6 44.2 cy)`.
  - Anything below y=40 is clipped by the viewBox, so a large mat leaves fewer visible soles. That is intended: they arrive from outside the frame.

**Sequence: door spots (main, bath), 1.6s.** All WAAPI with `fill:"backwards"` for delayed parts. All are tracked for `finishAll()`.

| Element | Keyframes | Timing |
|---|---|---|
| Left sole | opacity 0 → .22 (offset .06) → .22 (offset .69) → 0 | 1600ms, delay 0 |
| Right sole | the same | 1400ms, delay 200 |
| `g.wow-ch` | `{opacity:0, transform:translate(dx px,dy px)}` until offset .374, then opacity 1 at .514, held until .607 (`easing: E.out` on the last segment), then `{opacity:1, transform:none}` | 1070ms, delay 0 (appears at 400–550ms, slides aside 650–1070ms) |
| `g.wow-ft` | `{opacity:0, transform:translate(0px,3px)}` → `{opacity:1, transform:none}` | 300ms, delay 900, `E.out` |

When the last animation finishes, empty `g.wow-walk`. CSS px on SVG elements are user units, so `translate(…px)` moves in inches.

**Block spots (bed, kitchen):** only `g.wow-ft`, over 300ms with a 150ms delay.

**Triggers**
- **First view:** an IntersectionObserver on `#fit .plan` with thresholds `[0.05, 0.5]`.
  1. *Arm* at ≥0.05 (only the walls are on screen): create the animations paused at t=0, so the start state applies (the feet and chappals are hidden while still off screen).
  2. *Play* at ≥0.5.
  3. If the plan leaves (ratio 0), or 4s pass between arm and play, `cancel()` everything (back to the final drawing) and re-arm next time.
- **`fit` hook `(fit, sp, d)`:**
  1. Always `finishAll()` first. This is instant: wrappers land and prints are removed.
  2. If `fit.spot` changed and the plan is ≥0.5 visible and `motion()`, play the short version. Doors get `g.wow-ch` from offset .374 onward, re-timed as 670ms (appears, then slides aside) plus `g.wow-ft` at 500ms. Blocks get the feet only.
  3. Size changes only finish.

**Phone vs desktop:** identical. The plan is 358px wide on phones (4.26px per inch, so a sole is about 15 × 40px) and 677px on desktop (8.06px per inch). No interaction is needed.

**Reduced motion:** the module never wraps or animates anything, so the plan is exactly as today. A runtime switch runs `finishAll()`.

**Performance budget:** no work before `#fit` is within 800px. At most 4 WAAPI animations for at most 1.6s, on SVG groups. These repaint on the main thread, at ≤4ms paint per frame at 4× CPU for a figure about 358 × 170px. Nothing runs afterwards.

**Accessibility:** the SVG keeps `role="img"` and its `<title>`. `g.wow-walk` is `aria-hidden`. `#readout` (aria-live) and `#fit-sugg` text are untouched, so there are no extra announcements.

**Conflicts to avoid**
- **Never write** the `transform` or `hidden` attributes of `#chappals` or `#feet`. features.js and the core own them. A CSS transform on those outer groups would override their attributes; that is why the animation targets the inner wrappers.
- X3 (the shortcut) clicks `#spots` while `#fit` is off screen. The plan isn't ≥0.5 visible, so nothing plays.
- **W4 is the next section.** W3 uses dusty chappal soles with outlines, plus the existing drawn feet. W4 uses one soft damp darkening in the pile. Don't add any other footprint motif in this release (no wordmark footsteps or paglya).
- Ask Jelam for a nod that "chappals off at the door" feels right.

**Acceptance tests**
1. **First view:** scrolling `#fit` into view at 390×844 plays the soles, the chappals and the feet. At 1.7s, `svg.getAnimations({subtree:true}).length === 0`, `g.wow-walk` has no children, and a screenshot of the plan equals a pre-wow.js baseline (pixel diff 0).
2. **Final positions:** each chappal rect's `getCTM()` after the walk equals its value before wow.js (±0.01).
3. **Short versions:** tapping Bathroom door while visible plays the short version in ≤0.8s. Tapping Bedside steps in the feet only.
4. **Size change mid-walk:** everything finishes instantly, the chappals sit at the new spot and there are no stray prints.
5. **Anchor jump:** jumping to `#fit` from the header nav leaves the feet visible within 1.3s.
6. **Stopping halfway:** scrolling half into the plan and stopping for 5s shows the final drawing.
7. **Reduced motion:** the plan is identical to today and has no `g.wow-ch`.

**New English strings:** none.

---

### W4. Step on it (`step-on-it`)

**What the visitor sees.** In "Made for wet feet", tap the exploded mat. A damp footprint in the shape of the Soft Steps foot presses into the aqua pile. The pile layer drops toward the latex and the gap closes. Three water beads sit on the print and shrink into the pile. The pile rises back, and the damp mark spreads slightly and fades over about 2.8s. It plays once by itself after the diagram has finished exploding on scroll, then wherever you tap.

**DOM hooks:** `#made #stack` (`.stack`, `view-timeline: --stk block`, line 504), `.layers` (`aria-hidden`), `.ly-pile` (the img, scroll-animated `pileZ` 10 → 70px), `.ly-latex` and `.ly-floor`. New elements, created when `#made` is within 600px:
- `<span class="ly wow-print" aria-hidden="true"><i class="wow-foot"></i><b class="wow-drop"></b><b class="wow-drop"></b><b class="wow-drop"></b></span>`, appended to `.layers` after the `picture`;
- `<p class="wow-tap" aria-hidden="true">Tap the mat to step on it</p>`, appended to `#stack`.

**CSS (injected)**
```css
#stack{cursor:pointer}
.wow-print{pointer-events:none;background:none;transform:translateZ(71px)}
@keyframes wowPrintZ{from{transform:translateZ(11px)}to{transform:translateZ(71px)}}
@supports (animation-timeline:view()){@media(prefers-reduced-motion:no-preference){
  .wow-print{animation:wowPrintZ linear both;animation-timeline:--stk;animation-range:entry 10% cover 40%}}}   /* lock-step with pileZ */
.wow-foot{position:absolute;left:var(--x,52%);top:var(--y,56%);width:20%;aspect-ratio:2/3;translate:-50% -50%;rotate:-8deg;
  background:var(--wow-damp);opacity:0;
  -webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-1 -1 12 18'%3E%3Cfilter id='b'%3E%3CfeGaussianBlur stdDeviation='.35'/%3E%3C/filter%3E%3Cg filter='url(%23b)'%3E%3Cellipse cx='5' cy='10.5' rx='3.2' ry='5'/%3E%3Ccircle cx='2.2' cy='3.4' r='1.1'/%3E%3Ccircle cx='4.3' cy='2.3' r='1.1'/%3E%3Ccircle cx='6.4' cy='2.6' r='1'/%3E%3Ccircle cx='8.1' cy='3.9' r='.9'/%3E%3C/g%3E%3C/svg%3E") center/contain no-repeat;
  mask:<same>}
.wow-drop{position:absolute;width:3.2%;aspect-ratio:1;border-radius:50%;translate:-50% -50%;opacity:0;
  background:radial-gradient(circle at 35% 30%,var(--wow-bead) 0 22%,color-mix(in srgb,var(--wow-bead) 35%,transparent) 45%,transparent 72%)}
.wow-tap{position:absolute;left:0;bottom:6px;margin:0;font:500 14px/1.3 var(--text);color:var(--mitti);opacity:0;pointer-events:none}
.wow-tap.on{opacity:1}
@media(prefers-reduced-motion:no-preference){.wow-tap{transition:opacity .24s var(--e-out)}}
```
- The blur sits inside the mask image (rasterised once), not as a CSS `filter` on a 3D layer.
- No `mix-blend-mode` anywhere.
- **Bead positions** (set inline, in % of the pile): (x, y−9), (x+5, y−7) and (x−4, y−10), near the toes.

**Technique**
- **Tap:** a `click` listener on `#stack`.
  - If `e.target` is `.ly-pile`, use `u = e.offsetX/img.offsetWidth`, `v = e.offsetY/img.offsetHeight`. This was verified exact through `rotateX(56deg) rotateZ(-28deg) translateZ(70px)` in `probe2/pile.cjs`; the shared `uvMap` self-test falls back to the homography if a device disagrees.
  - Clamp u to .18–.82 and v to .2–.8. A tap anywhere else in the stack uses (.52, .56).
- **`press(u, v)`:**
  1. `finishAll()` (a tap during playback restarts cleanly, with one print at a time).
  2. Set `--x/--y` on `.wow-foot` and position the beads.
  3. On touch, call `navigator.vibrate(10)` when `TOUCH.matches && motion()`. A tap is user activation.
  4. Start the animations:

| Element | Property | Keyframes (offset: value) | Duration |
|---|---|---|---|
| `.ly-pile` and `.wow-print` | `translate` (individual) | 0: `0 0 0` (easing `E.inn`) → .167: `0 0 -44px` → .357: `0 0 -44px` (easing `E.out`) → 1: `0 0 0` | 840ms |
| `.ly-latex` | `translate` | the same offsets, down to `0 0 -8px` | 840ms |
| `.wow-foot` | `opacity`, `scale` | 0: `0, .94` → .05: `.34, 1` → .107: `.34, 1` (easing `E.out`) → 1: `0, 1.06` | 2800ms |
| each `.wow-drop` (i = 0..2) | `opacity`, `scale` | 0: `0, 1` → .12: `1` → .30: `1, 1` (easing `E.inn`) → 1: `0, 0` | 1200ms, delay i·60 |

  The press runs 140ms with `--e-in`, holds 160ms, then releases over 540ms with `--e-out`. There is no overshoot.

  The individual `translate` composes with the scroll-driven `transform`. Verified: the computed `translate` is `0px 0px -44px` while the ViewTimeline `matrix3d(…70…)` stays intact (`probe2/stack-press-phone.png` against `stack-rest-phone.png`).
- **Auto-play once per session:**
  - An IntersectionObserver on `#stack` with `rootMargin "0px 0px -55% 0px"` fires when the stack's top is in the upper 45% of the viewport, which is when `pileZ` has finished.
  - After 500ms, if it is still intersecting and `!doc.hidden && !sess.get("ss_wow_step")`, run `press(.52, .56)` and set the key.
  - When the press finishes, add `.wow-tap.on`. The hint is removed on the first tap.

**Phone vs desktop:** the same everywhere. On phones the stack is a 326px square, and the bottom of about 36px is empty, which is where the hint goes. On desktop the stack is 588 × 441, and the hint sits bottom-left, clear of the right-hand `.stk-l` labels. The listener is `click` only, never `preventDefault`, so a swipe that starts on the stack scrolls the page.

**Reduced motion:** no auto-play, and the pile and latex never move. A tap shows the print statically (inline `opacity:.3`, no animation) and hides it after 1.5s. The hint shows without a fade. Browsers without `animation-timeline` show the print on the static pile at 71px, and the press still works through individual `translate`.

**Performance budget:** no work before `#made` is within 600px. At most 7 WAAPI animations for at most 2.8s: three are composited `translate`s on existing 3D layers, and four are opacity/scale animations on small leaves. Nothing runs afterwards.

**Accessibility:** `.layers` is already `aria-hidden`, and the print and hint are too. The stack isn't focusable. No information is added: "The pile soaks it up" and the spec list stay the source. The auto-play is short (under 5s) and plays once, which is within WCAG 2.2.2. Keyboard users get the auto-play.

**Conflicts to avoid**
- **Never animate `transform` on `.ly-pile` / `.ly-floor`;** the scroll timeline owns it.
- **Keep the print's keyframes and range identical to `pileZ`** (`entry 10% cover 40%`), plus 1px.
- Use tokens even though the existing layer CSS hard-codes `#1b5d68` and `#D9C7A6` (don't change those here).
- **Never attach a drying time or absorbency figure** to this effect.

**Acceptance tests**
1. **Auto-play** (390×844): scrolling until the stack's top is at 40% of the viewport makes the pile's screen rect dip by at least 8px within 1s and return. The foot fades by 3.3s. A reload in the same session doesn't auto-play again.
2. **Tap position:** tapping at a known (u, v) centres the foot within 4% of it. A second tap mid-play leaves exactly one running `.wow-foot` animation.
3. **After play:** `getComputedStyle(.ly-pile).translate` is `none` (or zero), and `.ly-pile.getAnimations()` is only the ViewTimeline one.
4. **Scrolling:** a vertical swipe from the stack scrolls.
5. **Reduced motion:** no auto-play, a static print on tap, and the pile rect never moves.
6. **No scroll timelines** (emulate by removing `@supports`): the print sits on the pile.
7. **CLS** is 0.

**New English strings:** "Tap the mat to step on it"

---

### W5. Rangoli welcome (`rangoli-on-return`)

**What the visitor sees.** After tapping "Send order on WhatsApp", the visitor comes back to the site, and the "Sent it?" box greets them with a small tipka rangoli:
- earth-coloured dots pop in;
- one continuous kumkum thread loops around them as a four-petal kolam;
- haldi petals bloom at the corners;
- the footprint logo presses into the centre;
- "Welcome back." appears under it.

It takes about 1.8s and plays once per order. Before and after, the rangoli simply sits there, drawn.

**DOM hooks:** `#drawer #v-pay #sentbox` (`div.box.sentbox`, `hidden` until the core reveals it 600ms after a `#sendwa` click or from a restored pending order, line 1560), `#oid`, `#sendwa`, `#newcart`. The new `<figure class="wow-rg" aria-hidden="true">` (the SVG) plus `<p class="wow-wb">Welcome back.</p>` are inserted as the first children of `#sentbox`. Once inserted, `#sentbox` gets the class `.wow-has-rg`.

**When it is inserted (the CLS guard):** at idle after load, but **only while `#sentbox` is not rendered** (drawer closed, `#v-pay` hidden or `#sentbox` hidden). Otherwise it waits for the `drawer` hook with `open === false`.

**CSS (injected)**
```css
#sentbox.wow-has-rg{grid-template-columns:64px minmax(0,1fr);column-gap:14px;align-items:start}
#sentbox.wow-has-rg>.wow-rg{grid-area:1/1;margin:0;width:64px;height:64px}
#sentbox.wow-has-rg>.wow-wb{grid-area:2/1;margin:-6px 0 0}
#sentbox.wow-has-rg>p:not(.wow-wb){grid-area:1/2/3/3}
#sentbox.wow-has-rg>#newcart{grid-area:3/1/4/3;justify-self:start}
.wow-rg svg{display:block;width:64px;height:64px;overflow:visible}
.wow-rg .d{fill:var(--wow-dot)} .wow-rg .lp{fill:none;stroke:var(--wow-loop);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.wow-rg .pt{fill:var(--wow-petal)} .wow-rg .ft{fill:var(--wow-foot)}
.wow-rg .d,.wow-rg .pt,.wow-rg .ft{transform-box:fill-box;transform-origin:center}
.wow-wb{font:italic 400 14px/1.25 var(--display);font-variation-settings:var(--fvs);color:var(--kajal);text-align:center;overflow-wrap:anywhere;visibility:hidden}
#sentbox.wow-welcomed .wow-wb{visibility:visible}
```
- **Why the height never changes:** the caption reserves its two lines from the start. Showing it with `visibility` changes no height, so there is no shift while the box is visible.
- **Why the core's `<p>` is never edited:** lang.js translates that `<p>` as one rich string (`"<b>Sent it?</b> Jelam replies…"`).

**SVG (`viewBox 0 0 72 72`, drawn at 64px).** This is a four-lobe kolam; each lobe is a 9-unit arc enclosing one of the dots at the middle of each edge.
```html
<svg viewBox="0 0 72 72" focusable="false">
  <ellipse class="pt" cx="12" cy="12" rx="5.5" ry="2.6" transform="rotate(45 12 12)"/>
  <ellipse class="pt" cx="60" cy="12" rx="5.5" ry="2.6" transform="rotate(-45 60 12)"/>
  <ellipse class="pt" cx="60" cy="60" rx="5.5" ry="2.6" transform="rotate(45 60 60)"/>
  <ellipse class="pt" cx="12" cy="60" rx="5.5" ry="2.6" transform="rotate(-45 12 60)"/>
  <path class="lp" pathLength="1" d="M30 30A9 9 0 1 1 42 30A9 9 0 1 1 42 42A9 9 0 1 1 30 42A9 9 0 1 1 30 30Z"/>
  <!-- 12 dots, r=1.6: corners 18,18 54,18 54,54 18,54; lobe dots 36,18 54,36 36,54 18,36; outer 36,6 66,36 36,66 6,36 -->
  <circle class="d" cx="18" cy="18" r="1.6"/> … (12 in total)
  <g class="ft" transform="translate(32.4 30.24) scale(.72)"><ellipse cx="5" cy="10.5" rx="3.2" ry="5"/><circle cx="2.2" cy="3.4" r="1.1"/><circle cx="4.3" cy="2.3" r="1.1"/><circle cx="6.4" cy="2.6" r="1"/><circle cx="8.1" cy="3.9" r=".9"/></g>
</svg>
```
The arcs were checked by hand: lobe centres are at (36, 23.29), (48.71, 36), (36, 48.71) and (23.29, 36), each with r=9 and each sweeping 276°. Each lobe encloses its middle dot (5.3 units from the centre), and the corner and outer dots sit outside the lobes.

**Sequence: `play()`, about 1.8s.** WAAPI with `fill:"backwards"`, all tracked.
1. Add `.wow-welcomed` to `#sentbox`. The caption fades in: opacity 0 → 1 over 300ms with `E.out`.
2. Dots `i = 0..11`: scale 0 → 1 and opacity 0 → 1 over 240ms with `E.out`, delay `i·30`.
3. Loop: set `style.strokeDasharray = "1"`, then animate `strokeDashoffset` 1 → 0 over 1100ms with **`E.dye`** (the colour runs along the thread like dye), delay 250ms.
4. Petals `i = 0..3`: opacity 0 → 1 and scale .6 → 1 over 300ms with `E.out`, delay `1000 + i·60`.
5. Foot: opacity 0 → 1 and scale 1.15 → 1 over 320ms with `E.out`, delay 1450 (the press).
6. When it finishes, clear the inline `strokeDasharray`.

**Triggers.** It only ever plays after the visitor really left and came back.
1. **Arm:** a capture-phase, passive `click` listener on `#sendwa` sets `armed = { oid: #oid.textContent, left: false }`. It never calls `preventDefault` and never delays. Nothing reads or writes `href`.
2. **Left:** `visibilitychange` with `doc.hidden`, or window `blur`, sets `armed.left = true`.
3. **Return:** on `visibilitychange` back to visible (or window `focus`) with `armed.left`, call `tryPlay()`.
4. **`tryPlay()`:** needs `!#drawer.hidden && !#v-pay.hidden` and `sess.get("ss_wow_rg") !== oid`.
   - If `#sentbox` is still `hidden` because the core's 600ms timer hasn't fired, wait up to 1500ms with a MutationObserver on its `hidden` attribute.
   - Then set `ss_wow_rg = oid` and `play()`.
5. **Restored path** (the tab was discarded or reloaded while in WhatsApp): on the `drawer` hook with `open === true`, if `#v-pay` and `#sentbox` are visible, `JSON.parse(localStorage.ss_pending).sent === true` (read only) and the oid isn't welcomed yet, then `play()`.
6. **New order:** a MutationObserver on `#oid` text removes `.wow-welcomed` and runs `finishAll()`.

**Phone vs desktop:** the drawer is full width on phones and 480px on desktop. At 320px the text column is 170px. The "Start a new cart" button spans the full row underneath, so it never squeezes. The WhatsApp link is untouched and never delayed.

**Reduced motion:** the rangoli is already drawn. On return only `.wow-welcomed` is added, so the caption appears with no animation.

**Performance budget:** nothing runs until the pay step. One inline SVG of about 1.5KB, and about 19 tiny WAAPI animations for 1.8s, once per order.

**Accessibility:** the SVG figure is `aria-hidden`. "Welcome back." is plain visible text: it is not a live region and focus doesn't move (the core focuses `#dtitle` on step changes). The box's existing sentence "Jelam replies on WhatsApp to confirm your order and payment." stays, so nothing claims the order was sent.

**Conflicts to avoid**
- Never mutate `#sentbox` while it is rendered (the reserve-then-show rule).
- Never touch `#sendwa`, `#newcart` or `ss_pending`.
- Don't play on a plain tab switch: play needs a `#sendwa` click first, or the restored `sent` flag.
- Don't use confetti or sound.

**Acceptance tests**
1. **Play on return:** with a cart, go through details to pay, click `#sendwa` (stub the navigation), then emulate hidden and visible (CDP `Emulation.setFocusEmulationEnabled` plus dispatching `visibilitychange`, or opening and closing a second tab). The caption becomes visible and the loop's `stroke-dashoffset` animates from 1 to 0. Reopening the drawer doesn't replay.
2. **No height change:** `#sentbox.offsetHeight` is identical before and after `play()`.
3. **Insertion waits:** with the drawer open on `#v-pay` when wow.js initialises, insertion waits until the drawer closes.
4. **Reduced motion:** no animations, and the caption appears on return.
5. **Gujarati:** the caption is in Gujarati and the `<p>` keeps its Gujarati rich translation.
6. **WhatsApp link:** `#sendwa`'s `href` is unchanged and WhatsApp opens with no delay.

**New English strings:** "Welcome back."

---

## 3. Extras (extras.js)

extras.js uses the same skeleton and helpers as wow.js: `SS` check, `whenQuiet`, try/catch per extra and CSS injection, with no light gate. Every insertion goes through `whenQuiet` (§1.6), so CLS is 0. Every string is plain English text that lang.js translates.

### X1. Paying safely (`paying-safely`)

**Where**
- **Full panel:** `<section class="paysafe" aria-labelledby="paysafe-h">`, inserted in `#order .order-l` **after `.stepwrap`**.
- **Short note:** `<p class="fine paysafe-s">`, inserted in `#drawer #v-pay .upibox` after `.upiid`. It is inserted only while the drawer is closed.

**Content.** Data, not markup. A line renders only when `ok` is true.

```js
var LINES = [
 { t: "Pay only to panchaljelam@oksbi or UPI number 90994 41429.", ok: true },                                   // site: pay step, FAQ
 { t: "Before you enter your UPI PIN, check that your app shows the name Jelam Panchal.", ok: false },          // GATE: exact payee name apps display
 { t: "You never need your UPI PIN to receive money. We never ask for your PIN or an OTP.", ok: false },        // GATE: Jelam confirms; no collect requests
 { t: "Your order and payment are confirmed on WhatsApp from +91 90994 41429.", ok: true },                      // site: FAQ, steps
 { t: "Outside Vadodara, the delivery charge is confirmed with you on a call.", ok: true }                       // site: FAQ, delivery radio
];
var SHORT = [1, 2];   // the drawer note uses lines 2 and 3 only
```

The panel renders only if at least 2 lines are `ok`. The drawer note renders only if every `SHORT` line is `ok`, so today it stays off.

**Markup and style**
```html
<section class="paysafe" aria-labelledby="paysafe-h">
  <svg class="ps-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.4-3 8.3-7 9.5C8 19.3 5 15.4 5 11V6z"/><path d="M9 12l2 2 4-4.2"/></svg>
  <h3 id="paysafe-h">Paying safely</h3>
  <ul><li>…ok lines…</li></ul>
</section>
```
```css
.paysafe{display:grid;grid-template-columns:24px minmax(0,1fr);align-items:center;gap:8px 12px;margin-top:8px;padding:18px 20px;border-radius:20px;background:var(--chalk);box-shadow:inset 0 0 0 1px var(--sut)}
.paysafe h3{font:420 20px/1.25 var(--display);font-variation-settings:var(--fvs)}
.paysafe ul{grid-column:1/-1;margin:0;padding-left:20px;display:grid;gap:6px;font-size:16px;line-height:1.5;color:var(--kajal)}
.ps-ic{width:24px;height:24px;fill:none;stroke:var(--neel);stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round}
@media(max-width:860px){.paysafe{padding:16px}.paysafe ul{font-size:15px}}
```
There is no motion.

**Accessibility:** a real `h3` under the section's `h2`, and a real list. The icon is decorative. The UPI ID and phone number are in the text.

**Acceptance**
1. The panel shows the 3 confirmed lines. No gated line appears in the DOM.
2. Flipping a line's `ok` makes it appear.
3. CLS is 0 when loading with scroll restored to `#order`, because insertion waits until it is off screen.
4. The Gujarati and Hindi dictionaries translate every line.

**Facts used:** the UPI ID `panchaljelam@oksbi`, UPI number 90994 41429, WhatsApp +91 90994 41429, "we confirm your order and payment" (FAQ), "delivery charges are extra and we confirm them with you on call" (FAQ). **Gated on Jelam:** the exact payee name UPI apps show for `panchaljelam@oksbi`, and that she never asks for a PIN or OTP or sends collect requests.

**New English strings:**
- "Paying safely"
- "Pay only to panchaljelam@oksbi or UPI number 90994 41429."
- "Before you enter your UPI PIN, check that your app shows the name Jelam Panchal."
- "You never need your UPI PIN to receive money. We never ask for your PIN or an OTP."
- "Your order and payment are confirmed on WhatsApp from +91 90994 41429."
- "Outside Vadodara, the delivery charge is confirmed with you on a call."

### X2. Reply hours, live (`reply-hours-now`)

**Where**
- **On the cards:** the three `.prod .ask small` lines ("Replies 10am–8pm daily"). Their text is replaced.
- **In the pay step:** a new `<p class="fine wow-rh">` inserted in `#v-pay` after `ol.todo` (while the drawer is closed), just under "Your order is confirmed when we reply."

The `#contact` Hours row and the footer keep the plain schedule ("10am to 8pm, every day"), so the stated hours always stay visible somewhere.

**Logic**
```js
var tz = ""; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
if (tz !== "Asia/Kolkata" && tz !== "Asia/Calcutta") return;            /* visitors elsewhere keep "Replies 10am–8pm daily" */
var CLOSED = [];   /* "YYYY-MM-DD" closure days from Jelam; empty until she lists them */
function ist(d) { /* Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hourCycle:"h23",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).formatToParts → {ymd, h, m} */ }
function status(now) {
  var t = ist(now), tm = ist(new Date(+now + 864e5));
  if (CLOSED.indexOf(t.ymd) >= 0) return "Closed today. We reply when we reopen.";
  if (t.h < 10) return "Replies from 10am today";
  if (t.h < 20) return "Within reply hours, until 8pm";
  return CLOSED.indexOf(tm.ymd) >= 0 ? "Closed tomorrow. We reply when we reopen." : "Replies from 10am tomorrow";
}
```

**Writing the status**
- **Initial write:** through `whenQuiet`. The cards are below the fold and the drawer is closed at load.
- **Re-evaluation:** at the next boundary (10:00, 20:00 or 00:00 IST) using `setTimeout(ms to boundary + 2000)`, and on `visibilitychange` back to visible.
- **No minute timer**, no clock and no "online" wording.
- **Deferred writes:** a write to an element that is on screen waits (through `whenQuiet`) until it is off screen.

**Phone:** every string fits one line at 320px in English. Check the Gujarati and Hindi lengths, and if one wraps, the deferral above already prevents shifts.

**Reduced motion:** there is no motion.

**Accessibility:** plain text, not live. The `.ask` link and Copy button are unchanged.

**Acceptance** (mock `Date` and the time zone)
1. At 15:00 IST the cards read "Within reply hours, until 8pm".
2. At 22:40 they read "Replies from 10am tomorrow".
3. At 07:00 they read "Replies from 10am today".
4. With `CLOSED` containing today, they read "Closed today…".
5. With the time zone `America/New_York`, the text is the original.
6. A full scroll pass has CLS 0.
7. In Gujarati or Hindi the status is translated.
8. The output never contains "online", "now" or a minute value.

**Facts used:** "Replies 10am–8pm daily" and "10am to 8pm, every day" (both on the site), and the IST time zone. **Gated on Jelam:** a list of closure days (`CLOSED`). Until then the status follows the stated hours.

**New English strings:**
- "Within reply hours, until 8pm"
- "Replies from 10am today"
- "Replies from 10am tomorrow"
- "Closed today. We reply when we reopen."
- "Closed tomorrow. We reply when we reopen."

### X3. "Where will it go?" shortcut (`where-will-it-go`)

**Where:** `#shop .sechead` (under "Three ranges, four sizes"). Insert `div.wwg` as its last child, spanning both grid columns (`grid-column: 1/-1`), through `whenQuiet`.

**Markup:** this reuses existing, already translated labels.
```html
<div class="wwg" role="group" aria-labelledby="wwg-l" aria-describedby="wwg-d">
  <p class="clab" id="wwg-l">Where will it go?</p>
  <div class="chips">
    <button type="button" class="chip" data-wwg="main" aria-pressed="false">Main door</button>
    <button type="button" class="chip" data-wwg="bath" aria-pressed="false">Bathroom door</button>
    <button type="button" class="chip" data-wwg="bed" aria-pressed="false">Bedside</button>
    <button type="button" class="chip" data-wwg="kitchen" aria-pressed="false">Kitchen counter</button>
  </div>
  <p class="sr-only" id="wwg-d">Tap a spot to see the mat we suggest.</p>
  <p class="sr-only" id="wwg-live" aria-live="polite"></p>
</div>
```
```css
.wwg{grid-column:1/-1;display:grid;gap:10px}
.wwg .chip[aria-pressed="true"]{background:var(--neel);color:var(--chalk);box-shadow:none}
```
These are plain buttons: a pick scrolls and moves focus, so arrow keys must not select.

**Dependency:** one line in features.js after `SUG` is defined: `SS.fitSug = SUG;`. If `SS.fitSug` is missing, X3 doesn't render (fail closed), so no advice is ever duplicated in extras.js.

**On click `(spot)`**
1. Set `sug = SS.fitSug[spot]`; set `aria-pressed` on this chip and clear it on the others.
2. `$('#spots [data-spot="' + spot + '"]').click()`. The core's `pickSpot`, `drawFit` and the `fit` hook then run, and features.js updates `#fit-sugg` and `#fit-add`, so the fit tool and the shortcut always agree. W3 won't play, because `#fit` is off screen.
3. `SS.pickers[sug.k](sug.l)` selects the suggested size on that card. The colour stays as the visitor left it.
4. On the next microtask (after lang.js has translated it), `#wwg-live.textContent = $("#fit-sugg").textContent`.
5. `card.scrollIntoView({behavior: RM.matches ? "auto" : "smooth", block: "start"})`. `scroll-padding-top: 80px` clears the header.
6. Focus the card's checked size radio (`.sizes-c [aria-checked="true"]`) with `{preventScroll: true}`, as features.js's Compare does.

**Phone:** four 44px chips wrap to two rows at 320px.

**Reduced motion:** an instant jump instead of smooth scrolling.

**Accessibility:** a labelled group of toggle buttons, with a polite announcement of the existing suggestion sentence. Focus lands on the result (the size radio, read as "M, 16×24 in, radio, checked").

**Acceptance**
1. Tapping "Bathroom door" scrolls to `#r-sol`, where M is checked. `#spots` shows Bathroom door, `#fit-sugg` is the bath sentence, the live region holds it, and focus is on the M radio.
2. Keyboard Tab and Enter do the same.
3. Without `SS.fitSug`, there is no `.wwg` in the DOM.
4. `grep -c "Suggested" extras.js` returns 0.
5. CLS at load is 0.
6. Gujarati and Hindi chip labels come from the existing dictionary.

**Facts used:** the fit tool's own suggestions (features.js `SUG`: main → Zigzag L, bath → Solid M, bed → Zigzag XL, kitchen → Solid XL). Nothing new. Jelam may want to re-confirm them now that they are more prominent.

**New English strings:** "Tap a spot to see the mat we suggest." (It reuses "Where will it go?", "Main door", "Bathroom door", "Bedside", "Kitchen counter" and the four "Suggested: …" sentences, which are already in both dictionaries.)

---

## 4. Integration checklist

1. **`softsteps.html`:** add `<script src="wow.js" defer></script><script src="extras.js" defer></script>` after `lang.js`. No other HTML changes.
2. **`features.js`:** add one line, `SS.fitSug = SUG;`, needed only by X3.
3. **`lang-gu.js` / `lang-hi.js`:** add `text` entries for every new English string below. Keys must match exactly, including the final full stop. Nothing needs a typed placeholder.
   - **Effects:** "Stroke the pile" · "Tap the mat to step on it" · "Welcome back."
   - **X1:** "Paying safely" and the five lines in X1.
   - **X2:** the five status strings in X2.
   - **X3:** "Tap a spot to see the mat we suggest."
4. **Palette:** keep the token names `--chalk --kajal --mitti --kora-2 --neel --kumkum --haldi --sut`, plus `--glass --ring35 --fg` on `.field`, or remap the `--wow-*` role tokens (§1.4) in the palette CSS.
5. **Jelam to confirm:**
   - the UPI display name;
   - her PIN, OTP and collect-request policy;
   - her closure days;
   - a nod on the chappals-at-the-door image;
   - optionally, the fit suggestions.

## 5. Global acceptance (run with `scratchpad/qa.cjs` + `audit/serve.cjs`)

- **Lighthouse mobile** (4× CPU, slow 4G): LCP is within ±50ms of the baseline and stays at or under about 1.8s. Total CLS is ≤ 0.05, with 0 shifts whose sources are wow.js or extras.js nodes. TBT rises by ≤ 20ms.
- **Before interaction or proximity:** no wow.js rAF runs, and no `.wow-nap`, `.wow-print` or `g.wow-walk` exists until its section is near or touched.
- **Failure isolation:**
  - Throwing inside any one module leaves the other four and the whole shop working.
  - With `window.SSFX = null`, the shop works.
  - With wow.js removed, the page is identical to today.
- **Light gate:** with `navigator.connection.saveData = true` emulated, wow.js does nothing and extras.js still renders.
- **Reduced motion:** nothing moves by itself (W1 is still direct manipulation with instant clear; W2 is static; W3 and W4 don't auto-play; W5 is static). Toggling the preference at runtime stops everything cleanly.
- **Keyboard-only pass:** the only new focusable controls are X3's four chips. There are no traps, and focus is visible.
- **TalkBack pass:** no new announcements except X3's live region. Decorative layers are silent.
- **Languages:** in `gu` and `hi`, every new string is translated and nothing overflows at 320px.

## 6. Verified in this round

| Claim | Result | File |
|---|---|---|
| `offsetX/Y` maps through `.plane` (rotateX 38 / 32, rotateZ −10 / −8) | exact at 390 touch and 1440 | `probe2/probe.cjs` |
| `offsetX/Y` maps through the `#made` pile (rotateX 56, rotateZ −28, translateZ 70) | exact (≤0.1px) at 390 and 1440 | `probe2/pile.cjs` |
| An AVIF-masked canvas with normal alpha in the 3D plane reads as velvet and stays inside the rug | yes | `probe2/nap-phone.png`, `nap-desk.png` |
| Individual `translate` composes with the scroll-driven `pileZ` | yes (computed translate and ViewTimeline both live) | `probe2/stack-press-*.png` |
| The clothesline padding trick moves nothing | 0px at 390 and 320 (padding-right moved `#fit` 22px at 320, so it was replaced by `::after`) | `probe2/line.cjs`, `line-*-rest.png`, `line-390-swing.png` |

All of these ran in headless Chromium. Repeat the two `offsetX` checks and the masked-canvas look once on a real mid-range Android Chrome. The `uvMap` self-test covers a mismatch at runtime.

## 7. Not chosen (and why)

- **rug-lifts-to-viewer** (7.0): the first reserve if a pick fails on a device. It is generic rather than Soft Steps. Its risks are perspective-matrix interpolation, the `::backdrop` popping in, and up to 200ms of decode latency on tap.
- **footsteps-wordmark** (7.0): footer reach is low, it re-rasterises glyphs on the main thread, and it would be a third footprint motif beside W3 and W4.
- **thread-wound-send** (7.0): thread is already the fly-to-cart and running-stitch sensation, and a haldi ring on the green pill is busy.
- **diwali-paglya** (7.0): it is timely (Lakshmi Puja is about 8 Nov 2026), but it puts prints over the hero product colour, adds to the busiest zone, and needs panchang dates and Jelam's approval of the wording. Build it later as a separate, date-gated seasonal toggle that fails closed in IST, not as one of the permanent five.
- **gyro-sheen** (6.75): the same sensation as effect 3 and the touch shimmer, and sensors are dead in iframes.
- **heft** (6.5): a 4–12px drop reads as a glitch, and the `price` hook fires on every slide.
- **feel-the-stripes** (6.25): touchstart isn't user activation, so the first drag can't vibrate, and cheap motors turn the ticks into a buzz.
- **dyed-browser-bar** (6.0): the hero half already exists (`softsteps.html:1462`), and Chrome hides the toolbar while scrolling. Worth a separate 10-line tweak that reads `--f` at runtime.
- **toran-sway** (5.75): a reading-time distraction under the sticky header. It shares W2's spring sensation; ship one, and W2 wins.
- **patola-register** (5.5): it reads as a glitch and would be a third heading reveal.
- **Extras not chosen:**
  - **wash-day-card** (7.0): blocked on care facts, and it duplicates the FAQ.
  - **same-again** (7.0): low reach for slow-replacement goods.
  - **light-mode** (6.0): its useful core (the Data Saver / 2G module gate) is folded into §1.2. The service worker and manifest wait.
