# Soft Steps: premium extras research

**Scope.** Small features that make the one-page shop feel more premium, more trustworthy and more helpful to families buying on a phone, without inventing facts. Pages read on 20 Oct 2026: Jaipur Rugs, Armadillo, Nicobar, Good Earth, Urban Ladder, Pepperfry, Nestasia, Ellementry, Chumbak, EasyRugs, Sleepy Owl, Ruggable (care page and Bain bath mat), plus web.dev, Chrome, Pinterest and Razorpay sources. Ruggable's `/pages/rug-quiz` now redirects to its best-sellers page, so it looks like the quiz was retired.

## What Pinterest and Instagram audiences respond to (for rugs and mats)

- **Colour is back, minimalism is out.** The Pinterest Palette 2026 is Cool Blue, Jade, Plum Noir, Wasabi and Persimmon. The trend report describes a move toward expressive, nostalgic, comfortable rooms, including bold circus stripes ("Chapithome") and Afrohemian textiles ([Homes & Gardens](https://www.homesandgardens.com/interior-design/pinterest-palette-2026), [ContentGrip](https://www.contentgrip.com/pinterest-predicts-2026-trends/)). Zigzag and Striped Chenille already fit this. Neel sits close to Cool Blue, and Kumkum close to Persimmon.
- **Bath mats are being replaced by quick-dry, washable rugs.** Checkered and wavy colourful bath mats are what currently sells ([AOL/House Digest](https://www.aol.com/articles/2026-bathroom-trend-thatll-space-210000410.html), [Ruggable Bain](https://ruggable.com/products/bain-checkered-multicolor-bath-mat)). "Machine washable, quick-drying" is the hook, so show it rather than just stating it.
- **Reels:** before/after and process clips reach the most people, and carousels get the most engagement. Put the hook in the first second ([Buffer](https://buffer.com/resources/instagram-reels-ideas/)). For mats this means muddy, then washed, then dry. Indian brands sell straight from video: Nestasia has "Shop by video" and Ellementry has "from screen to space" ([nestasia.in](https://nestasia.in/), [ellementry.com](https://www.ellementry.com/)).
- **The site should feed Instagram, not embed it.** Instagram embed scripts are not on the allowed CDN list and would hurt LCP. Use still images linking to `@softsteps.home`, plus the share feature that already exists.

## Candidates

Effort: XS < ½ day, S ≈ 1 day, M ≈ 2–3 days.

| # | Candidate | Examples | Why it helps | Facts needed (have?) | Effort | Risk |
|---|---|---|---|---|---|---|
| 1 | **Rug-finder quiz** (3–5 questions) | [Jubi Style Finder](https://shop-jubi.com/pages/style-finder); Ruggable retired its quiz; Octane says quiz takers convert at 7–25% ([vendor claim](https://www.octaneai.com/blog/how-to-create-a-shopify-quiz-with-octane-ai)) | Turns 26 colours × 4 sizes into a short answer | Sizes and ranges ✔; "best for" mapping needs Jelam | M | Overlaps the fit tool and colour index; one more step before buying |
| 2 | **Two-tap mat finder** ("Where will it go?" then "Which feel?") | Jaipur Rugs "Shop by Room" ([jaipurrugs.com](https://www.jaipurrugs.com/us/)); Ruggable sizing tips | Same job as a quiz with a third of the taps; reuses `SS.pickers` | ✔ (all 4 sizes exist in all 3 ranges); spot→size advice needs Jelam to confirm | S | Low |
| 3 | **Care and wash-day guide** | Ruggable "How to Wash" in 3 steps plus "roll, don't fold" ([Bain](https://ruggable.com/products/bain-checkered-multicolor-bath-mat)); EasyRugs "Oops.. spilled it! / Voila" ([easyrugs.in](https://easyrugs.in/)) | Washability is the main promise; answering care questions on the page cuts WhatsApp back-and-forth | "Machine washable, quick-drying" ✔. Water temperature, detergent, bleach, tumble heat and drying need **Jelam to confirm** | S | Wrong care advice damages latex backing. Ship only confirmed lines |
| 4 | **Room/floor colour matcher** (vitrified, marble, Kota, wood-look) | Jaipur "What colour rug goes with a navy couch" journal | Answers "will it look good on my floor?" | Generic floors only | M | Rendered floors misrepresent colour; the photo try-on does this better. **Skip** |
| 5 | **Recently viewed / "pick up where you left off"** | Adobe Commerce "recently viewed" unit ([docs](https://experienceleague.adobe.com/en/docs/commerce-merchant-services/product-recommendations/admin/type)) | Helps buying decisions that involve family members asking each other | ✔ | XS–S | Mostly duplicates Saved and the cart, which already persist. **Runner-up** |
| 6 | **"What size fits" quick picks** | Ruggable washer-size table ([guide](https://ruggable.com/pages/washing-machine-rug-guide)) | Fast route to a size | ✔ | XS | Already covered by the fit tool and compare dialog. **Fold into #2** |
| 7 | **Diwali at the umbaro** (date-limited festive layer) | Ellementry "thoughtful gifting: a love language" plus diyas; Good Earth "Gifting" nav ([goodearth.in](https://www.goodearth.in/)) | Seasonal reason to buy now, for the home and as a gift. Lakshmi's footprints drawn at the threshold, pointing inward, are a direct match for the footprint logo and the Umbaro idea ([Boldsky](https://www.boldsky.com/yoga-spirituality/faith-mysticism/2013/significance-of-lakshmi-footprints-035947.html), [mandana paglya](https://chantal-jumel-kolam-kalam.com/en/rajasthan-mandana-paglya-the-divine-feet-part-5/)) | Dates: Dhanteras 6 Nov, Diwali 8 Nov 2026 ([Hindutone](https://hindutone.com/festivals/dhanteras-2026-complete-guide-to-date-puja-vidhi-rituals-significance/); sources disagree, so confirm with a panchang). Pairs and gift note ✔. **No** "delivered before Diwali" line unless Jelam gives a cut-off | S–M | Religious sensitivity: footprints and diya light only, no deity images. Must switch itself off by date |
| 8 | **Story of the person behind it** | EasyRugs "Meet the founder"; Jaipur "The hands behind every rug" | A real face makes a small brand believable | **Owner must supply** a photo (with consent) and 3–4 true lines. Do not claim she makes or weaves the mats unless she does | XS | Invented biography. Gate on real content |
| 9 | **Pay-safe explainer** | Good Earth footer "Caution Notice: does not request payment … outside our platform"; [Razorpay on fake screenshots](https://razorpay.com/learn/fake-payment-screenshot-scam/) | Families are wary of paying UPI to an unknown seller. Spelling out the safe path builds trust | ✔ UPI ID `panchaljelam@oksbi`, payee name Jelam Panchal, number 90994 41429, same-day confirmation. "We never ask for your UPI PIN or OTP" is a policy line Jelam must approve | XS | None if every line is true |
| 10 | **Weak-signal grace** (Save-Data, offline page, cached shell) | Flipkart Lite: 63% of users on 2G, could browse offline ([web.dev](https://web.dev/case-studies/flipkart)) | Many visitors are on mid-range Android phones with patchy 4G | None | S–M | A stale service-worker cache could show old prices. Fetch HTML from the network first |
| 11 | **Add to home screen** | Flipkart Lite: 60% of visits from the home-screen icon, 70% higher conversion (2016 data) | Repeat buyers (bath mats get replaced) come back with one tap | Manifest, icon | S (with #10) | Annoyance if prompted on load. Chrome needs a fetch handler for the prompt ([Chrome](https://developer.chrome.com/blog/update-install-criteria)) |
| 12 | **WhatsApp catalogue link** `wa.me/c/91…` | [Meta docs](https://developers.facebook.com/documentation/business-messaging/whatsapp/catalogs/catalog-link-messages/) | Familiar in-app browsing | Only if Jelam keeps a WhatsApp Business catalogue up to date | XS | Shows "Invalid catalog link" if she has none |
| 13 | **Colour of the week** | Instagram-first colour stories | Gives repeat visitors something new | Needs weekly owner input | XS | Reads as a stock or scarcity claim; goes stale. **Skip** |
| 14 | **Material close-up** (macro of pile and backing) | Armadillo Meridian ("weave, fiber and construction come into focus"); Jaipur "The craft behind every rug" | Shows the feel of the mat | Real macro photos needed | XS–S | Duplicates the zoom viewer and layer diagram. Do it as photos, not a new effect |
| 15 | **Form micro-interactions** | Common in checkouts | Fewer wrong phone numbers and PINs | ✔ | XS | Already has `aria-invalid` validation, so only polish is left. **Skip** |
| 16 | **Empty-state delight** | Sleepy Owl's playful copy | Turns "cart empty" into a next step | ✔ (pairs data) | XS | Fold into #2 (empty cart and Saved offer "Find your mat") |
| — | Sticky add-to-cart | — | — | Already built (phone buy dock) | — | — |

## Recommended 6

### 1. "Paying safely" panel (pay-safe explainer) — XS, highest trust per byte
Put a 4-line panel inside `#order` and repeat it in the UPI step of the cart:
- "Pay only to **panchaljelam@oksbi**. Your UPI app should show **Jelam Panchal**."
- "We never ask for your UPI PIN or OTP, and never send you a QR to *receive* money."
- "Your order is confirmed on WhatsApp from +91 90994 41429."
- "Outside Vadodara, we call to agree the delivery charge **before** you pay."

Each line is a real fact or a policy Jelam signs off. Use a padlock or footprint icon in `var(--neel)` on `var(--kora)`. No motion, so there is no performance cost. Every string goes through lang.js.

### 2. Wash-day card — S
Make the "Care" line in *Made for wet feet* expandable into three pictogram steps (shake out, machine wash, dry flat) plus "Roll, don't fold". Only show steps Jelam confirms. Put **"Jelam: confirm"** placeholders in the source and render them only once filled. Optional effect: a single water-ripple sweep across the pictograms when they scroll into view, transform-only and turned off under reduced motion. This also gives Jelam a script for a before/after Reel.

### 3. Two-tap mat finder — S (replaces the quiz, quick picks and empty-state ideas)
Add a chip row above `#shop`:
- **Where:** Doorstep · Bathroom · Bedside · Kitchen
- **Feel:** Plush & solid (Solid Premium) · Playful zigzag · Soft stripes (Chenille)

The result scrolls to the matching card, calls `SS.pickers[k](size)` and pulses that card once. Suggested size mapping, for Jelam to confirm: Doorstep M/L, Bathroom H/M, Bedside L/XL, Kitchen XL. Word it as "We'd suggest", never as "most popular". The empty cart and an empty Saved list link to the finder. It is keyboard-reachable as radio groups and uses 44px chips.

### 4. Diwali at the umbaro — S–M, date-gated (live now through 11 Nov 2026, off by client date)
- **Hero:** a trail of small kumkum footprints walks inward across the threshold line once. It is an absolutely positioned SVG, so it causes no layout shift, and starts after LCP. Under reduced motion the prints appear static.
- **Copy:** "Ready your umbaro for Diwali" swaps into the existing eyebrow line (same height).
- **Pairs section:** a "Door + bath, a Diwali gift" card that reuses pairs plus the gift note.

No discounts, no deity images, and no delivery-by promise unless Jelam gives a cut-off date. Colours come from `var(--kumkum)` and `var(--haldi)`. Every string is translatable. Gujarati New Year falls just after Diwali, so the Gujarati copy can say "Saal Mubarak" if Jelam wants it.

### 5. Works on a weak signal, keeps a home-screen spot — M
- Read `navigator.connection.saveData`, or an `effectiveType` of `2g`/`slow-2g`, and skip loading fx.js and touchfx.js. The core shop is unchanged.
- Small `sw.js`: cache-first for `/img`, network-first for HTML so prices stay current, and a versioned cache.
- Offline page in three languages: "You're offline. Your cart is saved on this phone."
- `manifest.webmanifest` with the footprint icon. The manifest's `theme_color` must be a literal hex value, because CSS variables don't work there.
- Catch `beforeinstallprompt` and offer "Add Soft Steps to your home screen" only in the menu sheet or after an order is sent. Never prompt on load.

Check first that the host serves `sw.js` from the site root.

### 6. "Who packs your mat" — XS, content-gated
Add a portrait and 3–4 true lines from Jelam above *Ask Jelam*, for example why she started the shop and that she checks each mat before dispatch, if that is true. Render nothing until she supplies the content. This is what EasyRugs and Jaipur Rugs lead with, and on Instagram the founder's face is what makes a home business feel real.

**Runner-up:** "Pick up where you left off" (#5 in the table), a one-line resume chip for return visits.

## Facts to get from Jelam before building
1. Care specifics: water temperature, detergent, bleach, dryer heat, drying time, and whether the mats can be folded.
2. Approval of the pay-safe policy lines (#9).
3. Spot→size suggestions for the finder.
4. Diwali dispatch cut-off, if she wants one, and whether to add Gujarati New Year wording.
5. Portrait and story lines.
6. Whether she has a WhatsApp Business catalogue (if yes, add the `wa.me/c/919099441429` link: XS).
7. Any real Reels or photos (before/after wash, macro of the pile) to use as stills.
