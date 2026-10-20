# Soft Steps: effect research (round 2)

Sources: Chrome DevRel e-commerce case studies (scroll-driven animations at Tokopedia, View Transitions at redBus), scroll-driven-animations.style, Codrops 2024–26 demos, poke-holo, the linear() and @property write-ups, and 2026 trend round-ups. The round-ups agree that grain, tactility, quieter micro-interactions and layered depth are in, and that heavy WebGL and scroll-jacking are out.

**Tags:** **NEW** has no overlap with the existing effects. **EXT** builds on an existing effect or feature and is safe to add. **DUP** duplicates something that exists, so don't build it. "fx-N" refers to existing effect N in SPEC §4.

**Rules for every entry** unless it says otherwise:
- Animate `transform`, `opacity` or `clip-path` only.
- Take colours from tokens (`--f`, `--kumkum`, `--haldi`, `--neel`, `--kora`, `--kajal`, `--chalk`, `--night`).
- Mark it `aria-hidden` (decorative).
- Start it lazily.
- Make the CSS default the finished state.

## Recommended five (plus three no-cost polish items)

1. **Brush the pile** (#2): the tactile signature.
2. **Card-to-sheet morph** (#1): the site feels like a premium app.
3. **Toran sway** (#7): a threshold cue, and cheap.
4. **Step through the door** (#11): the Umbaro story told through scroll.
5. **Rangoli on return** (#16): a calm moment after the order.

The polish items are **spring press** (#5), **dye-reading text** (#6) and **soft type** (#4).

---

### 1. Card-to-sheet morph (View Transitions) — NEW
- **What the visitor sees:** Tapping a rug card makes its picture glide and grow into the detail sheet's image while the sheet fades up. Closing reverses it.
- **Reference:** https://developer.chrome.com/blog/css-ui-ecommerce-vt and https://developer.chrome.com/docs/web-platform/view-transitions
- **Technique:**
  - Set `view-transition-name: rug` on the tapped img.
  - Call `document.startViewTransition(() => { openD(…); move the name to the sheet img })`.
  - Use 280ms on `::view-transition-group(rug)` and keep the root crossfade short.
- **Phone:**
  - Same-document transitions work in Chrome for Android 111+. Other browsers swap instantly.
  - Taps are ignored while a transition runs, so keep it under 300ms.
  - redBus warns that hover-triggered transitions can fire `mouseleave`, so trigger on tap only.
- **Cost:** GPU snapshots, with no layout shift.
- **Reduced motion:** Skip the transition.
- **Fit for Soft Steps:** Every product open gets a native-app feel without adding any library.

### 2. Brush the pile — NEW (signature)
- **What the visitor sees:** A finger stroking the close-up pile photo leaves a lighter or darker "brushed" trail, like plush rubbed against the nap. The trail slowly recovers.
- **Reference:** the "Fluffy" fur that reacts to the pointer, https://compartsblog.doc.gold.ac.uk/index.php/work/fluffyfluffy/ (the idea only; ours is much lighter).
- **Technique:**
  - A half-resolution canvas over the image with `mix-blend-mode: soft-light`.
  - On each pointermove, take the dot product of the stroke direction with a fixed nap vector. Positive draws a soft white radial dab at about 12% alpha, negative a dark one.
  - Each frame, draw `destination-out` at 4% alpha to fade the trail.
  - rAF runs only while a trail exists.
- **Phone:**
  - Use `touch-action: pan-y`: vertical scroll still works and horizontal strokes brush.
  - A translatable hint, "Brush it with your finger".
  - Optional `vibrate(4)` every 80px.
- **Cost:** One small canvas, and nothing when idle. It is fine at 4× throttle.
- **Reduced motion:** A static half-brushed image with a caption.
- **Fit for Soft Steps:** Put it on `s2_close.jpg` or the chenille macro. Not the hero, which already has drag tilt.

### 3. Footsteps to the door — EXT (overlaps fx-8 running stitch; use one per section)
- **What the visitor sees:** Small footprints in the logo glyph appear one by one, left and right, walking down the margin toward "How to order" or the cart.
- **Reference:** Rajasthani *paglya*, footprints drawn on the doorstep, https://chantal-jumel-kolam-kalam.com/en/rajasthan-mandana-paglya-the-divine-feet-part-5/ . Technique demos are at https://scroll-driven-animations.style/
- **Technique:** About 8 SVG `<use>` prints in kumkum, each with `animation-timeline: view()` and a staggered `animation-range`, running opacity 0→1 and scale .8→1.
- **Phone:** Placed in the gutter or behind the numerals, with no layout impact.
- **Cost:** CSS-only.
- **Reduced motion:** All prints static at 40% opacity.
- **Fit for Soft Steps:** The logo made literal: footsteps arriving at the umbaro. A festive variant could run for the Diwali season.

### 4. Soft type — NEW
- **What the visitor sees:** As each H2 enters, its Fraunces letterforms go from crisp to soft-cornered. "Soft" in the wordmark softens on press.
- **Reference:** Fraunces axes `SOFT` (0–100), `WONK`, `opsz`, https://github.com/undercasetype/Fraunces
- **Technique:**
  - The site loads `SOFT@100` only. Widen it to `SOFT@0..100` and measure the extra bytes.
  - Animate `font-variation-settings: "SOFT"` with view().
  - Never animate `wght`, because width changes risk CLS. Check that SOFT keeps the advance widths unchanged.
- **Phone:** Gujarati and Hindi use Hind Vadodara, which has no axes, so they stay static. That is acceptable.
- **Cost:** Text re-rasterises during a short scroll range only.
- **Reduced motion:** Fixed at SOFT 100.
- **Fit for Soft Steps:** The cheapest way to make the word "Soft" visible.

### 5. Spring press ("step on it") — EXT (complements the tap ripples)
- **What the visitor sees:** Buttons, swatches and chips compress under the thumb and spring back with a tiny overshoot, like pile recovering.
- **Reference:** https://developer.chrome.com/docs/css-ui/css-linear-easing-function and its generator.
- **Technique:** `:active { transform: scale(.96) translateY(1px) }`, released with `transition: transform .5s linear(…spring…)`.
- **Phone:** Ideal, and needs zero JS.
- **Cost:** None.
- **Reduced motion:** Scale .98 with no overshoot.
- **Fit for Soft Steps:** One tactile language across the site.

### 6. Dye-reading text — NEW
- **What the visitor sees:** In the Umbaro story paragraph, words fill from faint to full kajal as you read. The craft words (haldi, neel, kumkum) fill in their own colours.
- **Reference:** https://tympanus.net/codrops/2024/04/17/some-on-scroll-text-highlight-animations
- **Technique:**
  - JS splits the words into spans (`aria-hidden`, with an `.sr-only` copy). It re-splits after a language switch, splitting on spaces, which works for Gujarati and Hindi too.
  - CSS animates `color` with view() and staggered ranges, done by `cover 45%`.
- **Phone:** Excellent.
- **Cost:** Paint in one paragraph.
- **Reduced motion and no support:** Full colour.
- **Fit for Soft Steps:** The dye story told in type. Use it in one paragraph only.

### 7. Toran sway — NEW
- **What the visitor sees:** A slim toran of thread tassels in the rug colours hangs from the sticky header. It swings with scroll speed and settles.
- **Reference:** spring physics, https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/
- **Technique:**
  - A passive scroll listener feeds velocity into one damped spring. One rAF loop writes `--sway` and stops once settled.
  - Each tassel does `rotate(calc(var(--sway) * var(--k)))`.
  - The toran is absolute with `pointer-events: none`, so it adds no height.
- **Phone:** About 12 tiny elements.
- **Cost:** Low.
- **Reduced motion:** Still.
- **Fit for Soft Steps:** A toran marks the threshold, the clearest Umbaro cue for local families.

### 8. Gyro sheen — EXT of fx-3 (lamp-lit rug)
- **What the visitor sees:** Tilting the phone slides the velvet sheen and lamp across the hero rug. It is the touch twin of the pointer sheen.
- **Reference:** https://poke-holo.simey.me/ (holo cards that follow device orientation).
- **Technique:** `deviceorientation` gamma and beta map to the sheen `translateX` (lerp .1, rAF), listening only while the hero is visible.
- **Phone:**
  - Android Chrome currently fires the event without a prompt.
  - If `DeviceOrientationEvent.requestPermission` exists (iOS), skip it. Never prompt.
- **Cost:** Low.
- **Reduced motion:** Off.
- **Fit for Soft Steps:** Brings fx-3 to the phones most visitors use.

### 9. Thread-wound order button — NEW
- **What the visitor sees:** When the cart first gets an item, a haldi thread winds once around "Order on WhatsApp", then rests as a solid edge.
- **Reference:** https://web.dev/articles/css-border-animations
- **Technique:** `@property --wind {syntax:'<angle>'}` drives a border-box `conic-gradient(var(--haldi) var(--wind), transparent 0)`, animated 0→360deg once over 1.1s.
- **Phone:** Fine.
- **Cost:** Repaints one small element for 1s.
- **Reduced motion:** Static border.
- **Fit for Soft Steps:** Points to the next step with no fake urgency.

### 10. Stack of folded mats — NEW
- **What the visitor sees:** The fact cards stick and stack as you scroll; the one beneath shrinks and dims like mats piled on a shelf. The cards are machine washable, latex anti-skid, free delivery in Vadodara, and replies 10am–8pm.
- **Reference:** the Stacking Cards demo on https://scroll-driven-animations.style/
- **Technique:**
  - `position: sticky` with a stepped `top`.
  - The covered card animates `scale(.94)` and a darker overlay with view().
- **Phone:** Made for it.
- **Cost:** CSS-only.
- **Reduced motion:** A plain list.
- **Fit for Soft Steps:** Real facts only. Leave "How to order" alone, because it already has the stitch.

### 11. Step through the door — NEW
- **What the visitor sees:** An SVG door-frame with an umbaro step frames a doorstep photo. On scroll, the frame grows past the screen edges while the photo settles from 1.15× to 1×, so you cross the threshold into the range.
- **Reference:** https://tympanus.net/codrops/2025/10/29/building-a-layered-zoom-scroll-effect-with-gsap-scrollsmoother-and-scrolltrigger/ . Rebuild it in CSS, without GSAP.
- **Technique:** A sticky stage in a 150vh wrapper. The frame does `scale(1→3.2)` and the image `scale(1.15→1)`, both with view().
- **Phone:** Native scroll, kept out of the first viewport (protects LCP).
- **Cost:** Two composited transforms.
- **Reduced motion:** Static framed photo at normal height.
- **Fit for Soft Steps:** The brand concept as a spatial transition.

### 12. Woven reveal — DUP-risk (overlaps fx-4 unroll)
- **What the visitor sees:** An image appears through interlacing warp and weft strips.
- **Reference:** blind and grid masks, https://tympanus.net/codrops/2026/03/11/svg-mask-transitions-on-scroll-with-gsap-and-scrolltrigger/
- **Technique:** Two `repeating-linear-gradient` masks with `mask-size` animated by view().
- **Phone:** Fine.
- **Cost:** Mask repaint.
- **Reduced motion:** Shown.
- **Fit for Soft Steps:** Use at most once, on the Striped Chenille photo. Otherwise skip it.

### 13. Wet footprint that fades — NEW
- **What the visitor sees:** As the bath-mat section enters, or on tap, a damp footprint darkens on the chenille mat and fades away.
- **Reference:** SVG filter demos, https://tympanus.net/codrops/demos/?tag=svg
- **Technique:**
  - The footprint is pre-blurred with a static `feGaussianBlur` and coloured `color-mix(in srgb, var(--f), #000 35%)`, with `mix-blend-mode: multiply`.
  - Animate opacity only, 0→.35→0 over 2.4s.
- **Phone:** Tap to replay.
- **Cost:** Opacity only.
- **Reduced motion:** Hidden.
- **Fit for Soft Steps:** It echoes the existing "absorbent" copy. Add no new claims, such as drying times.

### 14. Colour-name ribbon — NEW (ext of shop-by-colour)
- **What the visitor sees:** A slow ribbon of the craft colour names (kora · neel · haldi · kumkum · kajal · mitti …) with swatch dots. It leans and speeds up on a flick-scroll. Tapping a name opens shop-by-colour filtered to it.
- **Reference:** https://www.framer.com/marketplace/components/velocity-marquee/
- **Technique:**
  - A duplicated track (the copy `aria-hidden`) moved by translateX.
  - Scroll velocity adds speed and `skewX(±5deg)` with a lerp back.
  - An IntersectionObserver pauses it off-screen.
- **Phone:**
  - 44px buttons.
  - A visible pause control is required, because the motion runs longer than 5s (WCAG 2.2.2).
- **Cost:** Low.
- **Reduced motion:** A static chip list.
- **Fit for Soft Steps:** Teaches the colour vocabulary in three languages.

### 15. Lamp-off night mode — conditional EXT (only if the palette ships a `--night` theme)
- **What the visitor sees:** Toggling the lamp darkens the page as a door-shaped wipe rising from the threshold. It avoids a circle, which would echo the dye-bath.
- **Reference:** https://developer.chrome.com/docs/web-platform/view-transitions and https://www.mintlify.com/Max-Samson/magicui/components/animated-theme-toggler
- **Technique:** `startViewTransition` plus `clip-path: inset(100% 0 0 0)→inset(0)` on `::view-transition-new(root)`.
- **Phone:** Fine.
- **Cost:** One page snapshot.
- **Reduced motion:** Instant.
- **Fit for Soft Steps:** Only if a dark theme is in scope.

### 16. Rangoli on return — NEW
- **What the visitor sees:** When the visitor comes back from WhatsApp after ordering, a small dot-and-loop rangoli draws itself around the footprint logo in kumkum and haldi. Beneath it is the line "Order sent. We reply daily, 10am–8pm." The same design, static, fills the empty cart.
- **Reference:** stroke draw-on with `pathLength=1`, as in segment-js on cdnjs.
- **Technique:**
  - Plays on `visibilitychange` back to the page, when an order is persisted. The order already persists.
  - Staggered `stroke-dashoffset` 1→0 over 1.2s.
- **Phone:** Never delays opening WhatsApp.
- **Cost:** Tiny.
- **Reduced motion:** Drawn instantly.
- **Fit for Soft Steps:** A doorstep ritual instead of confetti. Strings must be translatable.

### 17. Snap carousel with depth — NEW
- **What the visitor sees:** In the colour-pairs row, cards grow and lift as they snap to centre, with native dot markers.
- **Reference:** https://developer.chrome.com/blog/carousels-with-css (`::scroll-marker`, Chrome 135+) and the Cover Flow demo on scroll-driven-animations.style.
- **Technique:** `scroll-snap-type: x mandatory`, with each card animating `scale(.9→1→.9)` on `view(inline)`.
- **Phone:** Native fling.
- **Cost:** CSS-only.
- **Reduced motion:** Flat.
- **Fit for Soft Steps:** The pairs-card tilt is desktop-only, so this gives touch an equivalent.

### 18. Selvedge header when stuck — EXT (of the sticky header)
- **What the visitor sees:** Once the header sticks, it gains a woven selvedge edge: a 3px kora and neel stripe with a soft shadow.
- **Reference:** https://developer.chrome.com/blog/css-scroll-state-queries
- **Technique:** `container-type: scroll-state` with `@container scroll-state(stuck: top)`, wrapped in `@supports`.
- **Phone:** Chrome 133+. Elsewhere there is simply no edge.
- **Cost:** None.
- **Reduced motion:** Same, with no transition.
- **Fit for Soft Steps:** Quiet premium polish.

### 19. Shake-out mat (Verlet cloth) — experimental, NEW
- **What the visitor sees:** Beside "machine washable", a small striped mat hangs on a washing line. A flick makes it flutter and settle.
- **Reference:** https://codepen.io/dissimulate/pen/eZxEBO
- **Technique:**
  - A 12×8 Verlet grid, drawn as rows of flat quads in stripe tokens.
  - It sleeps when its energy is low and initialises on the first touch.
- **Phone:** DPR capped at 1.5.
- **Cost:** Medium while moving.
- **Reduced motion:** Static SVG.
- **Fit for Soft Steps:** Charming but optional.

### 20. Liquid-glass buy dock — NOT recommended
- **What the visitor sees:** A refracting glass dock.
- **Reference:** https://dev.to/fabiosleal/how-to-create-the-apple-liquid-glass-effect-with-css-and-svg-2o06
- **Technique:** `backdrop-filter: url(#displace)`, Chromium-only.
- **Phone:** The fixed dock repaints every scroll frame on mid-range Android.
- **Cost:** High.
- **Alternative:** Kora at 94% opacity with a 1px highlight and no blur.

---

## Already covered or skip
- **Grain overlay:** DUP. The `--grain` token already exists.
- **Ambient glow behind rugs:** DUP of the fx-2 painted card.
- **WebGL fluid or dye shaders:** DUP of fx-2, and heavy.
- **Odometer:** DUP of fx-1b.
- **Cursor followers, magnetic buttons, image trails:** These rely on hover, so phones get nothing.
- **Lenis-style smooth scroll:** Breaks native Android fling.
- **Preloaders and intro curtains:** They delay LCP.
- **Confetti:** Too loud. #16 replaces it.
