# STATUS UPDATE (22 Oct 2026) — read this first

- `main` == what is live: claude.ai artifact **version 31** (https://claude.ai/artifact/CspLRioTiMjWF3nz8qj3WH) built from `work-admin/site/` (Kora Quiet palette, 5 wow effects `wow.js`, 3 extras `extras.js`, stock/price catalog layer, owner admin `admin.js`). Published with capabilities `{artifact, user, assets}`.
- Done since the text below was written: checkout/core bugs fixed (PR #1/#3), colour palette chosen and applied, effects + extras built, admin built and tested (core 269, admin 172, integration 216, paint 12), phone CLS fixed (language strip now in the markup), invisible hero buttons on dark rugs fixed, CI green on `main`.
- Security checks run on the live build: XSS payloads through every catalog field, tampered localStorage (`ss_cart2`, `ss_pending`, `ss_saved`, `ss_pin`, `ss_lang`) and hostile URL hashes — nothing executes; admin builds DOM with textContent only (CI enforces it).
- Still open: (1) the owner must try the admin once with the real claude.ai login (open the site with `#admin`); (2) deploy to Netlify (`python3 build_netlify.py work-admin/site dist`, zip `dist/`, drag to app.netlify.com/drop, name `softsteps-home`) — PR #2 (`fix/netlify-security-headers`) conflicts with `main` and is superseded by the headers already in `netlify.toml`; (3) owner-only items in section 2; (4) the rest of the original checklist below is historical.

---

# Soft Steps — project handoff and remaining tasks

Give this whole folder (or the zip) to the next AI. Read this file first.

## 1. What this is
Soft Steps is a real home business in Vadodara, Gujarat (owner: Jelam Panchal) selling rugs, doormats and bath mats.
It is a **one-page shop in plain HTML/CSS/JS** (no framework, no build step). Most visitors use mid-range Android phones.
Checkout: cart → details → UPI payment → order sent on WhatsApp (+91 90994 41429, UPI `panchaljelam@oksbi`).
Languages: English | ગુજરાતી | हिन्दी (DOM translation engine, dictionaries built from JSON).

- **Live site (version 30):** https://claude.ai/artifact/CspLRioTiMjWF3nz8qj3WH  (a claude.ai Artifact, shared "anyone with the link"). Its exact files are in `site-live-v30/`.
- **Planned public address:** https://softsteps-home.netlify.app (not deployed yet; the previous AI's network could not reach Netlify). `build_netlify.py` builds the deploy folder; `netlify-dist-v30-old/` is an older build (v30, without admin/colours/effects).
- Brand concept: "Umbaro (ઉંબરો), the threshold" — the doorstep. Fonts: Fraunces + Hind Vadodara (Google Fonts only). Full original design spec: `SPEC.md`.

## 2. Non-negotiable rules (from the owner)
- Real facts only: no invented reviews, discounts, stock counts, delivery times, urgency.
- Product names, colour names, prices and the WhatsApp order text stay **English** in every language.
- Photos in the try-on never leave the device.
- Respect `prefers-reduced-motion`. WCAG AA contrast. No `alert`/`confirm`. No horizontal scroll down to 320px.
- Scripts only from cdnjs / jsdelivr / unpkg; fonts only from Google Fonts. Keep LCP ≲ 1.8 s and CLS ≲ 0.05 on a throttled phone.
- Every new user-visible string needs Gujarati + Hindi (see §5).
- Owner-only items (cannot be done by an AI; remind the owner): real photos (mat at a doorstep, hand pressing the pile, latex back, bathroom door), real customer photos with permission, delivery charges outside Vadodara, and a policy conflict: the FAQ says stock is confirmed *before* payment but checkout asks for payment first.

## 3. Folder map
| Path | What it is |
|---|---|
| `site-live-v30/` | Exact files published as live v30: `softsteps.html` (all core CSS + core JS), `fx.js` (hero effects), `features.js` (colour index, saved, dock, compare, fit tool, PIN check…), `touchfx.js`, `shop.js` (share + zoom viewer), `tryon.js` (photo try-on "See it at your door"), `pairs.js` (colour pairs), `lang.js` + `lang-gu.js` + `lang-hi.js`, `img/` |
| `work-admin/site/` | **Newer working copy**: = live v30 + shop-side catalog/stock layer + `admin.js` + `admin.css`. Its `img` is a relative symlink to `../../site-live-v30/img` (recreate it if your zip tool dropped it). |
| `work-admin/tests/` | `core.cjs` (236 checks for catalog/stock/price/notice behaviour), `admin.cjs`, `integ.cjs`, `mock-claude.js` (mock of the claude.ai `window.claude` runtime), screenshot scripts |
| `i18n/` | `strings.json` (300 reviewed source strings), `gu.json`, `hi.json` (reviewed translations), `extra.json` (hand-added entries `{kind,en,gu,hi}`), `tools/build_lang.py` |
| `build_netlify.py` | `python3 build_netlify.py <src-dir> <out-dir>` → Netlify-ready folder (adds OG tags, JSON-LD, sitemap, robots, icons, `netlify.toml`, rewrites the artifact URL to the netlify one, copies `lang-*.js`). Run with the folder that has the final files. |
| `qa.cjs`, `audit/serve.cjs`, `libs/` | Test harness. `node qa.cjs <path/to/softsteps.html> <outdir>` (4 viewports + phone/desktop checkout; "REQFAIL … img" lines are harmless aborted lazy loads). `serve(dir)` serves a folder; `prep(page,log)` routes Google Fonts/CDNs to local copies in `libs/`. Needs Playwright + Chromium. |
| `design2/` | Research and plans: `research-palette.md`, `audit-colour.md` (colour literals audit), `research-fx.md`, `research-extras.md`, **`EFFECTS.md` (build-ready specs for the 5 wow effects + 3 extras)**, `quiet.css`, `heritage.css` (unfinished palette experiments) |
| `AUDIT-CORE-FINDINGS.md` | 12 checkout/core bugs found by the audit (not yet fixed) |
| `audit2-scripts/` | Reproduction scripts for those findings and perf probes |
| `og/`, `tryon_test/` | WhatsApp preview card source; a test doorway photo |

## 4. Architecture notes
- `softsteps.html` core defines `window.SS` (`P` products, `SLIDES`, `addToCart`, `swatch`, `imgFor`, `inr`, `esc`, `toast`, `openD`, `render`, `zoom`, `tryon`, and in the working copy `catalog`, `stock`, `canBuy`). Effects register hooks with `SSFX_on(name, fn)`.
- Colours are CSS custom properties in `:root` (`--kora --chalk --kajal --mitti --sut --neel --night --haldi --kumkum --wa …`); the hero/cards are "painted" by the selected rug colour (`--f --fg --on`).
- Images use an AVIF/WebP picker (`SSIMG.map`) — do not break it.
- Script order matters: `fx.js, features.js, touchfx.js, shop.js, pairs.js, tryon.js, lang.js` (lang.js last). A published artifact's `index.html` = a fixed wrapper (`<!doctype html><html><head><meta charset=utf8><meta name=viewport …><style>…reset…</style></head><body>`) + softsteps.html + `</body></html>`.

## 5. Translations
Add English + Gujarati + Hindi entries to `i18n/extra.json`, then:
`python3 -I i18n/tools/build_lang.py gu <site>/lang-gu.js` and the same for `hi`. Terminology used: Gujarati "રગ" for rug, Hindi "रग". Test by clicking the language buttons; scan for leftover English.

## 6. State of each workstream and what remains

### A. Owner admin + stock/price system  (built, tested; reviews/fixes pending)
Design: the live shop is a claude.ai Artifact. Login = the owner's claude.ai account; only artifact editors can open the admin (`user.canEdit()`), and the server enforces writes. Saving rebuilds `index.html` with a new catalog JSON block and calls `artifact.publish(html)` (the *files* form of publish is disabled on public artifacts). Photos go through `assets.upload` and are shown as `/_blob/<id>`.
Done (in `work-admin/site/`): catalog block `<!--ss-catalog:start-->…<!--ss-catalog:end-->` before the core script; `P` is built from it; every price shown anywhere comes from it; stock states (colour in/few/out, size in/out, hidden colours, owner-added colours with photos, notice bar); central `SS.addToCart` guard; out-of-stock → "Ask on WhatsApp"; Gujarati/Hindi strings; the owner loader (footer link, `#admin` hash). `admin.js`/`admin.css`: Prices, Stock, Photos, New colour, Notice tabs, draft in sessionStorage, review & publish. Test result: `core.cjs` 236/236 pass.
Remaining: (1) security review of admin + catalog (XSS via catalog values, JSON/marker breakout, upload types, EXIF stripping, draft tampering); (2) phone UX review as the owner on 390px (timings for: mark a colour sold out, raise XL prices, add a colour with photo, set a notice, undo); (3) shopper-regression comparison against `site-live-v30` (checkout text and UPI link identical; no admin requests for visitors; LCP/CLS not worse); (4) fix what those find; (5) merge into the final build. The real claude.ai publish path cannot be tested offline: the owner must try the admin once with their own login (open the site with `#admin`).
Limitation to tell the owner: admin edits update the claude.ai site; the Netlify copy must be rebuilt with `build_netlify.py` to pick up new prices/photos.

### B. Bugs from the audit (`AUDIT-CORE-FINDINGS.md`) — fix these
12 findings, all medium or low. Most important: (1) changing the cart after the pay step silently discards the pending order → a customer who already paid can be asked to pay the full new total (keep a `replaces` id / pay only the balance / warn); (2) after "Send on WhatsApp" the cart is never cleared, so a later visit adds on top of already-ordered mats; (3) PIN codes 391xxx (Padra, Waghodia, Savli) keep "free delivery in Vadodara"; (4) the phone Back button during checkout leaves the site instead of closing the drawer/going back a step (use history.pushState/popstate); (5) a saved cart keeps old prices after a price change (re-derive prices from `P` — already done in the admin working copy for restored carts). Also run the rest of the audit that did not finish: UI/effects bugs and memory leaks, language-engine/compat issues, and a **security review** (every innerHTML sink, localStorage tampering, regex DoS in lang.js, CDN usage/SRI, try-on photo never leaving the device, clickjacking). Then write recommended Netlify headers (strict CSP that still allows Google Fonts, cdnjs/jsdelivr/unpkg if used, wa.me, upi:, data:/blob: images; HSTS; frame-ancestors; Permissions-Policy; Referrer-Policy) into `netlify.toml`. Remind the owner: always check the UPI amount received matches the order total before dispatch (the amount is client-side).

### C. New colour palette across the whole site  (research done; design not finished)
The owner wants "proper colour combination all across the site", researched from Pinterest/Instagram/premium brands, premium + aesthetic. Done: `design2/research-palette.md` (web research), `design2/audit-colour.md` (every hard-coded colour + critique). Two experimental directions were started (`quiet.css` = quiet warm minimal; `heritage.css` = Indian heritage luxe) but not judged. To do: choose one (or blend), verify every text/background pair ≥ AA with a script (incl. Gujarati/Hindi on it, and the painted hero/card colours for all 26 rugs), implement via the `:root` tokens + section rules, replace hard-coded colours in JS (see audit), render screenshots at 390 and 1440 and iterate. 26 rug colours are real product photos and must keep their true colours; the frame should flatter them.

### D. Five new wow effects + three extras  (planned; not built)
Full build-ready specs are in `design2/EFFECTS.md`. Effects: (W1) **Brush the pile** — stroke the Solid rug and the pile shades like velvet (canvas mask, lazy); (W2) **Pairs on the washing line** — cord + pegs and sway on the phone colour-pairs row; (W3) **Chappals off at the umbaro** — footwear animation in the fit-plan SVG; (W4) **Step on it** — a wet foot presses the exploded mat in "Made for wet feet"; (W5) **Rangoli welcome** — a rangoli draws itself in the cart drawer after the order is sent. Extras: **Paying safely** panel (uses only facts already on the site), **Reply hours, live** (10am–8pm IST), **"Where will it go?"** shortcut under the shop heading. Plan: each in its own isolated section of a new `wow.js` / `extras.js`, own injected CSS using colour tokens, lazy start, reduced-motion safe, translatable strings, never touching the buy flow. Test at 390/320/1440 with CPU 4× throttle; check CLS = 0.

### E. Publish
1. Merge A–D into one folder, rebuild languages, run `qa.cjs` and the test scripts.
2. Publish to the claude.ai Artifact (an AI with the Artifact tool: publish `softsteps.html` as the page and each other file via `files`; keep the capabilities `{artifact:{}, user:{}, assets:{}}` declared for the admin) — OR build for Netlify: `python3 build_netlify.py <final-folder> dist` and zip `dist/` for the owner to drag onto https://app.netlify.com/drop, then rename the site to `softsteps-home`. (If the platform's network allows `api.netlify.com`, deploy directly.)
3. Do not publish anything the owner has not seen if it changes the look dramatically — show screenshots first.

## 7. Suggested order for the next AI
B (bug fixes) → A (finish admin reviews/fixes) → C (palette) → D (effects/extras) → E (publish). Run the full test suite after each step.
