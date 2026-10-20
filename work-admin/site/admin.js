/* Soft Steps Admin: the shop owner's editor for prices, stock, photos, new colours and the shop notice.
   Loaded on demand by the shop's loader, only for people the platform says can edit. Exposes window.SSADMIN = {open, close}.

   How saving works (CONTRACT §5): edits are kept as a draft in sessionStorage (so a reload or a publish conflict
   loses nothing). "Publish to shop" fetches the page's own source text, checks it, replaces ONLY the text between
   <!--ss-catalog:start--> and <!--ss-catalog:end--> with a freshly serialised catalog <script>, and hands the whole
   document to artifact.publish(). Everything outside the markers stays byte-identical (only <script>s a server
   injected into the platform's wrapper around the page are left out; see unwrapInjected).

   Safety: every element is built with createElement/textContent; owner-entered and catalog values never pass through
   innerHTML. Uploaded assets are only ever used as <img> sources ("/_blob/" + id). Every field is validated. */
(function () {
  "use strict";
  if (window.SSADMIN) return;

  const D = document, W = window;
  const SELF = (D.currentScript && D.currentScript.src) || "";
  const START = "<!--ss-catalog:start-->", END = "<!--ss-catalog:end-->";
  const DRAFT_KEY = "ss-admin-draft-v1", UI_KEY = "ss-admin-ui-v1";
  const KEYS = ["zig", "sol", "chen"];
  const SHORT = { zig: "Zigzag", sol: "Solid", chen: "Chenille" };
  const PHOTO_OK = { zig: true, sol: true };                 /* chen colours are crops of one shared photo */
  const ID_RE = /^[0-9a-f]{32}$/, HEX_RE = /^#[0-9a-fA-F]{6}$/;
  const NAME_RE = uni("^[\\p{L}\\p{M}\\p{N} &-]+$", /^[A-Za-z0-9 &-]+$/);
  const HAS_WORD = uni("[\\p{L}\\p{N}]", /[A-Za-z0-9]/);
  const NAME_MAX = 40, PRICE_MAX = 99999, SHOP_PRICE_MAX = 999999, NOTE_MAX = { en: 140, gu: 180, hi: 180 };
  const STOCK = [["in", "In stock"], ["few", "Few left"], ["out", "Out of stock"]];
  const STOCK_WORD = { in: "In stock", few: "Few left", out: "Out of stock" };
  const TABS = [["prices", "Prices"], ["stock", "Stock"], ["photos", "Photos"], ["new", "New colour"], ["notice", "Notice"]];
  const MAIN_MAX = 1600, THUMB = 400, FILE_MAX = 40 * 1024 * 1024;
  const DENY_TEXT = "Only the shop owner can open this. Sign in to claude.ai with the owner account.";

  const UPLOAD_MSG = {
    too_large: "This photo is too big to upload, even after making it smaller. Try a different photo.",
    unsupported_type: "This kind of file can't be uploaded. Please choose a JPG, PNG or WebP photo.",
    quota_or_state: "The shop's photo storage is full or not available right now, so photos can't be added at the moment.",
    rate_limited: "Too many uploads in a short time. Wait a minute, then try again.",
    not_granted: "This account can't upload photos to the shop.",
    upstream_auth: "Your sign-in has expired. Reload the page, sign in again, then try again.",
    store_unavailable: "Photo storage is busy right now. Try again in a minute.",
    invalid_request: "This photo couldn't be uploaded. Try a different photo.",
    bad_id: "The upload didn't finish properly. Please try again.",
    upstream_error: "The upload didn't go through. Check your internet connection and try again."
  };
  UPLOAD_MSG.capability_disabled = UPLOAD_MSG.capability_removed = UPLOAD_MSG.not_uploader = UPLOAD_MSG.not_granted;
  UPLOAD_MSG.transform_error = UPLOAD_MSG.upstream_error;

  const PREP_MSG = {
    not_image: "That file isn't a photo. Please choose a photo (JPG, PNG or WebP).",
    file_too_big: "This file is over 40 MB. Please choose a smaller photo.",
    decode: "This photo couldn't be opened here. Please choose a JPG or PNG photo.",
    too_small: "This photo is too small. Please choose one at least 300 pixels on each side.",
    encode: "This phone couldn't prepare the photo. Try a different photo."
  };

  const CANT_SAVE = "This account can't save changes to the shop.";
  const PUBLISH_MSG = {
    conflict: "Someone saved a newer version just now. The page will reload — your draft is kept, check it and publish again.",
    not_writer: CANT_SAVE, not_granted: CANT_SAVE, capability_disabled: CANT_SAVE, capability_removed: CANT_SAVE,
    consent_required: CANT_SAVE, not_declared: CANT_SAVE, no_artifact: CANT_SAVE,
    too_large: "The shop page is too large to save. Nothing was changed — your draft is kept.",
    rate_limited: "You've published several times in a short while. Wait a minute, then tap Publish again. Your draft is kept.",
    upstream_error: "Couldn't save right now. Check your internet connection and try again. Your draft is kept.",
    invalid_content: "The shop didn't accept this save. Nothing was changed — your draft is kept.",
    fetch_failed: "Couldn't load the shop page to save it. Check your internet connection and try again.",
    not_page: "This copy of the shop can't be saved from here. Nothing was changed.",
    no_markers: "This copy of the shop has no product list block, so it can't be saved from here. Nothing was changed.",
    stale: "The shop was changed somewhere else since you opened it. Reload the page (your draft is kept), check it and publish again."
  };
  PUBLISH_MSG.transform_error = PUBLISH_MSG.read_only_path = PUBLISH_MSG.invalid_content;
  const KNOWN_PUBLISH = Object.keys(PUBLISH_MSG);

  let S = null;        /* state of the open admin; null when closed */
  let deny = null;     /* the "owner only" panel, when shown */

  /* ---------------------------------------------------------------- helpers */
  function uni(src, fallback) { try { return new RegExp(src, "u"); } catch (e) { return fallback; } }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function str(v) { return typeof v === "string" ? v : ""; }
  function inr(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function code(e) { return e && typeof e.code === "string" ? e.code : "upstream_error"; }
  function ek(t, k, id) { return JSON.stringify([t, k || "", id || ""]); }
  function pk(key) { try { const a = JSON.parse(key); return Array.isArray(a) && a.length === 3 ? a : null; } catch (e) { return null; } }
  function safeHex(x) { return HEX_RE.test(x) ? x : "#8F806F"; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many); }
  function sget(st, k) { try { return W[st].getItem(k); } catch (e) { return null; } }
  function sset(st, k, v) { try { if (v == null) W[st].removeItem(k); else W[st].setItem(k, v); } catch (e) {} }

  /* Element builder: props become attributes (setAttribute), "text" is textContent, on* are listeners. Never innerHTML. */
  function h(tag, props, kids) {
    const el = D.createElement(tag);
    if (props) for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === "text") el.textContent = v;
      else if (k === "class") el.className = v;
      else if (k === "style") { for (const s in v) el.style.setProperty(s, v[s]); }
      else if (/^on[a-z]/.test(k) && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : String(v));
    }
    append(el, kids);
    return el;
  }
  function append(el, kids) {
    if (kids == null || kids === false) return el;
    (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null || c === false) return;
      el.appendChild(c.nodeType ? c : D.createTextNode(String(c)));
    });
    return el;
  }
  const ICONS = {
    back: "M15 18l-6-6 6-6", check: "M5 12.5l4.5 4.5L19 7.5", chev: "M9 6l6 6-6 6", undo: "M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 010 11H11",
    cam: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z", plus: "M12 5v14M5 12h14", trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
    warn: "M12 4l9 16H3zM12 10v4M12 17v.5", x: "M6 6l12 12M18 6L6 18"
  };
  function icon(name) {
    const NS = "http://www.w3.org/2000/svg", s = D.createElementNS(NS, "svg"), p = D.createElementNS(NS, "path");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("class", "ssa-ic");
    p.setAttribute("d", ICONS[name]); s.appendChild(p); return s;
  }

  function cap(name) {
    const c = W.claude;
    if (!c || typeof c.use !== "function") return Promise.resolve(null);
    try { return Promise.resolve(c.use(name)).then(function (x) { return x || null; }, function () { return null; }); }
    catch (e) { return Promise.resolve(null); }
  }
  async function canEdit() {
    const u = await cap("user");
    if (!u || typeof u.canEdit !== "function") return false;
    try { return (await u.canEdit()) === true; } catch (e) { return false; }
  }

  /* ---------------------------------------------------------------- catalog */
  /* The editor starts from SS.catalog, the catalog exactly as the shop validated and is showing it (a bad or missing
     field already replaced by the shop's default), so what gets published is what the owner saw plus their edits.
     The block's raw text is kept to check that the page fetched for saving is still this version. */
  function readCatalog() {
    const el = D.getElementById("ss-catalog");
    const raw = el ? el.textContent : null;
    let cat = null;
    if (W.SS && W.SS.catalog && typeof W.SS.catalog === "object") { try { cat = clone(W.SS.catalog); } catch (e) { cat = null; } }
    if (!cat && raw != null) { try { cat = JSON.parse(raw); } catch (e) { cat = null; } }
    return { raw: raw, cat: normalize(cat) };
  }
  /* Deep copy with every field the admin touches made well-formed; unknown fields are kept as they are. */
  function normalize(c) {
    if (!c || typeof c !== "object" || !c.ranges || typeof c.ranges !== "object") return null;
    const out = clone(c);
    if (typeof out.updatedAt !== "string") out.updatedAt = "";
    const n = out.notice && typeof out.notice === "object" ? out.notice : {};
    out.notice = Object.assign({}, n, { on: !!n.on, en: str(n.en), gu: str(n.gu), hi: str(n.hi) });
    for (const k of KEYS) {
      const r = out.ranges[k];
      if (!r || !Array.isArray(r.sizes) || !Array.isArray(r.colours)) return null;
      r.sizes = r.sizes.filter(function (z) { return z && typeof z.id === "string" && z.id; });
      r.sizes.forEach(function (z) {
        const p = Number(z.price); z.price = Number.isInteger(p) && p >= 1 && p <= SHOP_PRICE_MAX ? p : 1;   /* same rule as the shop */
        z.stock = z.stock === "out" ? "out" : "in"; z.dims = str(z.dims); z.weight = str(z.weight);
      });
      r.colours = r.colours.filter(function (x) { return x && typeof x.n === "string" && x.n; });
      r.colours.forEach(function (x) {
        x.stock = x.stock === "few" || x.stock === "out" ? x.stock : "in";
        x.hidden = !!x.hidden; x.added = !!x.added;
        x.photo = ID_RE.test(x.photo) ? x.photo : null; x.thumb = ID_RE.test(x.thumb) ? x.thumb : null;
      });
    }
    return out;
  }
  function rangeOf(cat, k) { return cat.ranges[k]; }
  function sizeOf(cat, k, id) { return rangeOf(cat, k).sizes.find(function (z) { return z.id === id; }) || null; }
  function colourOf(cat, k, n) { return rangeOf(cat, k).colours.find(function (x) { return x.n === n; }) || null; }
  function baseColour(k, n) { return colourOf(S.base, k, n); }

  /* The draft = base catalog + edits. Edit keys are JSON [type, range, id]:
     price|avail (id = size id), stock|hide|photo (id = colour name), add (id = new colour name, value = colour object),
     del (id = owner-added colour name), notice (value = {on,en,gu,hi}). Changes to a not-yet-published colour live
     inside its "add" value. */
  function build() {
    const c = clone(S.base);
    S.edits.forEach(function (val, key) {
      const a = pk(key); if (!a) return;
      const t = a[0], k = a[1], id = a[2];
      if (t === "notice") { c.notice = Object.assign({}, c.notice, clone(val)); return; }
      const r = c.ranges[k]; if (!r) return;
      if (t === "price" || t === "avail") { const z = r.sizes.find(function (z) { return z.id === id; }); if (z) z[t === "price" ? "price" : "stock"] = val; return; }
      if (t === "add") { r.colours.push(clone(val)); return; }
      if (t === "del") { r.colours = r.colours.filter(function (x) { return x.n !== id; }); return; }
      const x = r.colours.find(function (x) { return x.n === id; }); if (!x) return;
      if (t === "stock") x.stock = val; else if (t === "hide") x.hidden = val; else if (t === "photo") { x.photo = val.photo; x.thumb = val.thumb; }
    });
    return c;
  }
  function setEdit(t, k, id, val, baseVal) {
    const key = ek(t, k, id);
    if (same(val, baseVal)) S.edits.delete(key); else S.edits.set(key, val);
    persist();
  }
  function hasEdit(t, k, id) { return S.edits.has(ek(t, k, id)); }
  function isDraftNew(k, n) { return S.edits.has(ek("add", k, n)); }
  function setColour(k, n, field, v) {
    const ak = ek("add", k, n);
    if (S.edits.has(ak)) {
      const o = S.edits.get(ak);
      if (field === "photo") { if (!v.photo) return; o.photo = v.photo; o.thumb = v.thumb; } else o[field] = v;
      persist(); return;
    }
    const b = baseColour(k, n); if (!b) return;
    if (field === "stock") setEdit("stock", k, n, v, b.stock);
    else if (field === "hidden") setEdit("hide", k, n, v, b.hidden);
    else if (field === "photo") setEdit("photo", k, n, { photo: v.photo, thumb: v.thumb }, { photo: b.photo, thumb: b.thumb });
  }
  function cleanName(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  function nameTaken(k, name, cat) {
    const want = name.toLowerCase();
    return rangeOf(cat || build(), k).colours.some(function (x) { return x.n.toLowerCase() === want; }) ||
      rangeOf(S.base, k).colours.some(function (x) { return x.n.toLowerCase() === want; });
  }
  function nameError(k, raw) {
    const name = cleanName(raw);
    if (!name) return "Enter a colour name.";
    if (name.length > NAME_MAX) return "Use " + NAME_MAX + " characters or fewer.";
    if (!NAME_RE.test(name) || !HAS_WORD.test(name)) return "Use only letters, numbers, spaces, & and -.";
    if (nameTaken(k, name)) return SHORT[k] + " already has a colour called “" + name + "”.";
    return "";
  }
  function cleanNote(s, max) { return String(s || "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
  function parsePrice(s) {
    const t = String(s).replace(/[\s,₹]/g, "");
    if (!/^\d{1,6}$/.test(t)) return null;
    const n = Number(t);
    return n >= 1 && n <= PRICE_MAX ? n : null;
  }
  function validPhotoPair(v) { return v && typeof v === "object" && (v.photo === null || ID_RE.test(v.photo)) && (v.thumb === null || ID_RE.test(v.thumb)) && (v.photo === null) === (v.thumb === null); }

  /* A restored draft edit is kept only if it still applies to the (possibly newer) base and still changes something. */
  function acceptEdit(key, val) {
    const a = pk(key); if (!a) return false;
    const t = a[0], k = a[1], id = a[2];
    if (t === "notice") {
      if (!val || typeof val !== "object") return false;
      const n = { on: !!val.on, en: cleanNote(val.en, NOTE_MAX.en), gu: cleanNote(val.gu, NOTE_MAX.gu), hi: cleanNote(val.hi, NOTE_MAX.hi) };
      const b = S.base.notice;
      if (same(n, { on: b.on, en: b.en, gu: b.gu, hi: b.hi })) return false;
      S.edits.set(key, n); return "set";
    }
    if (KEYS.indexOf(k) < 0) return false;
    if (t === "price" || t === "avail") {
      const z = sizeOf(S.base, k, id); if (!z) return false;
      if (t === "price") return Number.isInteger(val) && val >= 1 && val <= PRICE_MAX && val !== z.price;
      return (val === "in" || val === "out") && val !== z.stock;
    }
    if (t === "add") {
      if (!PHOTO_OK[k] || !val || typeof val !== "object" || val.n !== id) return false;
      if (cleanName(id) !== id || id.length > NAME_MAX || !NAME_RE.test(id) || !HAS_WORD.test(id)) return false;
      if (!HEX_RE.test(val.bg) || !ID_RE.test(val.photo) || !ID_RE.test(val.thumb) || ["in", "few", "out"].indexOf(val.stock) < 0) return false;
      if (nameTaken(k, id)) return false;     /* published already, or someone else added the same name */
      S.edits.set(key, { n: id, bg: val.bg.toUpperCase(), stock: val.stock, hidden: !!val.hidden, photo: val.photo, thumb: val.thumb, added: true });
      return "set";
    }
    const x = baseColour(k, id); if (!x) return false;
    if (t === "stock") return ["in", "few", "out"].indexOf(val) >= 0 && val !== x.stock;
    if (t === "hide") return typeof val === "boolean" && val !== x.hidden;
    if (t === "photo") return !!PHOTO_OK[k] && validPhotoPair(val) && !(x.added && !val.photo) && !same(val, { photo: x.photo, thumb: x.thumb });
    if (t === "del") return val === true && x.added;
    return false;
  }
  function restoreDraft() {
    let d = null;
    try { d = JSON.parse(sget("sessionStorage", DRAFT_KEY) || "null"); } catch (e) { d = null; }
    if (!d || !Array.isArray(d.edits)) return { n: 0, dropped: 0 };
    let dropped = 0;
    d.edits.forEach(function (pair) {
      if (!Array.isArray(pair) || pair.length !== 2) { dropped++; return; }
      const r = acceptEdit(pair[0], pair[1]);
      if (r === true) S.edits.set(pair[0], pair[1]); else if (!r) dropped++;
    });
    persist();
    return { n: S.edits.size, dropped: dropped };
  }
  function persist() {
    if (!S) return;
    sset("sessionStorage", DRAFT_KEY, S.edits.size ? JSON.stringify({ v: 1, at: Date.now(), edits: Array.from(S.edits.entries()) }) : null);
  }
  function saveUi() { sset("sessionStorage", UI_KEY, JSON.stringify({ tab: S.tab, range: S.range, newRange: S.nf.k })); }

  /* What blocks publishing: prices typed wrong, or a notice switched on without English text. */
  function problems() {
    const out = [];
    Object.keys(S.rawPrice).forEach(function (key) {
      const a = pk(key); if (a) out.push({ tab: "prices", range: a[1], fk: "price|" + a[1] + "|" + a[2], label: SHORT[a[1]] + " " + a[2] + " price" });
    });
    const n = build().notice;
    if (n.on && !n.en) out.push({ tab: "notice", fk: "notice|en", label: "Notice in English" });
    return out;
  }

  /* ---------------------------------------------------------------- original photos (from the page's own markup) */
  function harvest(root) {
    root.querySelectorAll(".prod[data-k]").forEach(function (card) {
      const k = card.getAttribute("data-k"); if (KEYS.indexOf(k) < 0) return;
      const m = S.orig[k] = S.orig[k] || {};
      card.querySelectorAll("[data-n]").forEach(function (b) {
        const n = b.getAttribute("data-n"), o = m[n] = m[n] || {};
        const img = b.querySelector("img"), src = img && img.getAttribute("src"), dot = b.querySelector(".dot");
        if (src && /^img\/[\w\/.-]+$/.test(src)) o.thumb = src;
        if (dot) {
          const st = dot.getAttribute("style") || "", sz = /background-size:\s*([\d.]+)px/.exec(st), ps = /background-position:\s*(-?[\d.]+)px\s+(-?[\d.]+)px/.exec(st);
          if (sz && ps) o.dot = [+sz[1], +ps[1], +ps[2]];
        }
      });
    });
  }

  /* ---------------------------------------------------------------- source text (CONTRACT §5) */
  async function fetchSource() {
    const u1 = new URL(location.href); u1.hash = "";
    const u2 = new URL("index.html", location.href); u2.hash = "";
    const urls = [u1.href]; if (u2.href !== u1.href) urls.push(u2.href);
    let err = "fetch_failed";
    for (const u of urls) {
      let t;
      try {
        const r = await fetch(u, { cache: "no-store", credentials: "same-origin" });
        if (!r.ok) continue;
        t = await r.text();
      } catch (e) { continue; }
      const v = checkSource(t);
      if (v.ok) return v;
      err = v.code;
    }
    throw { code: err };
  }
  function count(t, s) { let n = 0, i = -1; while ((i = t.indexOf(s, i + 1)) >= 0) n++; return n; }
  /* The shop's own text runs from its first line (PAGE_START) to its last (PAGE_END); around it sits the platform's
     wrapper (doctype, head with a reset style, body), which holds no scripts. If the copy we fetched has <script>s in
     that wrapper, the server injected them (runtime code) and they must not be published: they are removed, and the
     copy is used only if what is left is a plain document shell. Nothing inside the shop's own text is ever touched,
     and a copy without injected scripts is used exactly as fetched. */
  const PAGE_START = "<title>Soft Steps</title>", PAGE_END = "<!--ss-page:end-->";
  const SCRIPT_EL = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
  const PLAIN_HEAD = /^<!doctype html>\s*<html\b[^>]*>\s*<head\b[^>]*>\s*(?:(?:<meta\b(?![^>]*\bhttp-equiv\b)[^>]*>|<style\b[^>]*>[^<]*<\/style>)\s*)*<\/head>\s*<body\b[^>]*>\s*$/i;
  const PLAIN_TAIL = /^\s*(?:<\/body>\s*)?(?:<\/html>\s*)?$/i;
  function unwrapInjected(t) {
    const a = t.indexOf(PAGE_START);
    if (a < 0) return t;
    let b = t.lastIndexOf(PAGE_END);
    b = b < a ? t.length : b + PAGE_END.length;
    const pre = t.slice(0, a), post = t.slice(b);
    if (!/<script\b/i.test(pre) && !/<script\b/i.test(post)) return t;
    const pre2 = pre.replace(SCRIPT_EL, ""), post2 = post.replace(SCRIPT_EL, "");
    if (!PLAIN_HEAD.test(pre2) || !PLAIN_TAIL.test(post2)) return null;
    return pre2 + t.slice(a, b) + post2;
  }
  function checkSource(t) {
    if (typeof t !== "string") return { code: "not_page" };
    t = unwrapInjected(t);
    if (t == null || !/^<!doctype html/i.test(t)) return { code: "not_page" };
    if (count(t, START) !== 1 || count(t, END) !== 1) return { code: "no_markers" };
    const s = t.indexOf(START), e = t.indexOf(END);
    if (e < s) return { code: "no_markers" };
    const a = s + START.length, inner = t.slice(a, e);
    const m = /^\s*<script\b[^>]*>([\s\S]*)<\/script>\s*$/i.exec(inner);
    /* the fetched copy must be the version this view is running, or we'd publish an older page over a newer one */
    if (S && S.raw != null && m && m[1].trim() !== S.raw.trim()) return { code: "stale" };
    return { ok: true, text: t, a: a, b: e };
  }
  function catalogBlock(cat) {
    return '<script type="application/json" id="ss-catalog">' + JSON.stringify(cat).replace(/</g, "\\u003c") + "</script>";
  }
  function preflight() {
    fetchSource().then(function (src) {
      if (!S) return;
      try { harvest(new DOMParser().parseFromString(src.text, "text/html")); } catch (e) {}
      const ae = D.activeElement;
      if (!(ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName))) renderPanel();
    }, function (e) {
      if (!S) return;
      S.srcIssue = PUBLISH_MSG[code(e)] || PUBLISH_MSG.fetch_failed;
      renderPanel();
    });
  }

  /* ---------------------------------------------------------------- photos: decode, downscale, crop, encode, upload */
  function canvas(w, hgt) { const c = D.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(hgt)); return c; }
  function ctx2d(c) { const x = c.getContext("2d"); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; return x; }
  async function decode(file) {
    if (W.createImageBitmap) {
      try { const b = await createImageBitmap(file, { imageOrientation: "from-image" }); return { src: b, w: b.width, h: b.height, done: function () { b.close && b.close(); } }; } catch (e) {}
    }
    const url = URL.createObjectURL(file), img = new Image();
    img.decoding = "async"; img.src = url;
    try { await img.decode(); } catch (e) { URL.revokeObjectURL(url); throw { code: "decode" }; }
    return { src: img, w: img.naturalWidth, h: img.naturalHeight, done: function () { URL.revokeObjectURL(url); } };
  }
  /* halve step by step while far above the target, so big phone photos stay sharp */
  function scaled(src, sx, sy, sw, sh, tw, th) {
    let cur = src, cx = sx, cy = sy, cw = sw, ch = sh;
    while (cw / 2 > tw && ch / 2 > th) {
      const c = canvas(cw / 2, ch / 2);
      ctx2d(c).drawImage(cur, cx, cy, cw, ch, 0, 0, c.width, c.height);
      cur = c; cx = 0; cy = 0; cw = c.width; ch = c.height;
    }
    const out = canvas(tw, th);
    ctx2d(out).drawImage(cur, cx, cy, cw, ch, 0, 0, out.width, out.height);
    return out;
  }
  function toBlob(c, type, q) { return new Promise(function (r) { try { c.toBlob(function (b) { r(b); }, type, q); } catch (e) { r(null); } }); }
  async function encode(c, q) {
    let b = await toBlob(c, "image/webp", q);
    if (b && b.type === "image/webp") return b;
    const flat = canvas(c.width, c.height), x = flat.getContext("2d");    /* JPEG has no transparency: lay it on chalk */
    x.fillStyle = "#FBF7F0"; x.fillRect(0, 0, flat.width, flat.height); x.drawImage(c, 0, 0);
    b = await toBlob(flat, "image/jpeg", q);
    if (b && b.type === "image/jpeg") return b;
    throw { code: "encode" };
  }
  function average(c) {
    const s = 24, t = canvas(s, s), x = t.getContext("2d");
    x.drawImage(c, c.width * 0.2, c.height * 0.2, c.width * 0.6, c.height * 0.6, 0, 0, s, s);
    const d = x.getImageData(0, 0, s, s).data, lin = function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 128) continue; r += lin(d[i]); g += lin(d[i + 1]); b += lin(d[i + 2]); n++; }
    if (!n) return "#8F806F";
    const enc = function (v) { v /= n; v = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0"); };
    return ("#" + enc(r) + enc(g) + enc(b)).toUpperCase();
  }
  async function preparePhoto(file) {
    if (!file) throw { code: "not_image" };
    if (file.size > FILE_MAX) throw { code: "file_too_big" };
    /* Trust file signatures, not the browser-provided MIME type. Only raster formats are accepted;
       all uploads are decoded and re-encoded below, so source metadata (including EXIF) is stripped. */
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const starts = function (bytes) { return bytes.every(function (v, i) { return head[i] === v; }); };
    const jpeg = starts([0xFF, 0xD8, 0xFF]);
    const png = starts([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const webp = starts([0x52, 0x49, 0x46, 0x46]) && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
    const type = String(file.type || "").toLowerCase();
    const typeOK = !type || type === "image/jpeg" || type === "image/jpg" || type === "image/png" || type === "image/webp";
    if (!typeOK || !(jpeg || png || webp) || (type.indexOf("jpeg") >= 0 && !jpeg) || (type.indexOf("jpg") >= 0 && !jpeg) ||
        (type === "image/png" && !png) || (type === "image/webp" && !webp)) throw { code: "not_image" };
    const im = await decode(file);
    try {
      if (!im.w || !im.h) throw { code: "decode" };
      if (Math.min(im.w, im.h) < 300) throw { code: "too_small" };
      const k = Math.min(1, MAIN_MAX / Math.max(im.w, im.h));
      const main = scaled(im.src, 0, 0, im.w, im.h, Math.round(im.w * k), Math.round(im.h * k));
      const side = Math.min(main.width, main.height);
      const thumb = scaled(main, (main.width - side) / 2, (main.height - side) / 2, side, side, THUMB, THUMB);
      let mainBlob = await encode(main, 0.86);
      if (mainBlob.size > 3 * 1024 * 1024) mainBlob = await encode(main, 0.7);
      const thumbBlob = await encode(thumb, 0.82);
      return { main: main, thumb: thumb, mainBlob: mainBlob, thumbBlob: thumbBlob, avg: average(thumb), w: main.width, h: main.height, ids: {} };
    } finally { im.done(); }
  }
  async function uploadOne(assets, blob) {
    for (let i = 0; ; i++) {
      try {
        const r = await assets.upload(blob, { type: blob.type });
        if (!r || !ID_RE.test(r.id)) throw { code: "bad_id" };
        return r.id;
      } catch (e) {
        const c = code(e);
        if (c === "store_unavailable" && i === 0) { await wait(700 + Math.random() * 900); continue; }
        throw { code: c };
      }
    }
  }
  /* uploads the photo, then the thumbnail; ids already uploaded are reused on "Try again" */
  async function uploadPair(pic, onStep) {
    const assets = await cap("assets");
    if (!assets || typeof assets.upload !== "function") throw { code: "not_granted" };
    onStep(1); if (!pic.ids.photo) pic.ids.photo = await uploadOne(assets, pic.mainBlob);
    onStep(2); if (!pic.ids.thumb) pic.ids.thumb = await uploadOne(assets, pic.thumbBlob);
    return { photo: pic.ids.photo, thumb: pic.ids.thumb };
  }
  function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
  function picMeta(p) { return p.w + " × " + p.h + " px · " + (p.mainBlob.type === "image/webp" ? "WebP" : "JPEG") + " · " + kb(p.mainBlob.size); }

  /* ---------------------------------------------------------------- small UI parts */
  function thumb(k, x, big) {
    const el = h("span", { class: "ssa-th" + (big ? " ssa-th-big" : ""), "aria-hidden": "true", style: { "--c": safeHex(x.bg) } });
    const o = (S.orig[k] || {})[x.n] || {};
    const src = x.thumb ? "/_blob/" + x.thumb : o.thumb;
    if (src) {
      const img = h("img", { src: src, alt: "", width: 96, height: 96, decoding: "async" });
      img.addEventListener("error", function () { img.remove(); });
      el.appendChild(img);
    } else if (o.dot) {
      const f = (big ? 64 : 48) / 28;          /* the shop's sprite offsets are for its 28px dots */
      el.classList.add("ssa-th-chen");
      el.style.setProperty("background-size", (o.dot[0] * f).toFixed(1) + "px auto");
      el.style.setProperty("background-position", (o.dot[1] * f).toFixed(1) + "px " + (o.dot[2] * f).toFixed(1) + "px");
    }
    return el;
  }
  function tag(text, kind) { return h("span", { class: "ssa-tag ssa-tag-" + kind, text: text }); }
  function switchBtn(label, on, fk, onChange, extra) {
    const b = h("button", { type: "button", role: "switch", class: "ssa-switch" + (extra ? " " + extra : ""), "aria-checked": on ? "true" : "false", "data-fk": fk },
      [h("span", { class: "ssa-sw-l", text: label }), h("span", { class: "ssa-track", "aria-hidden": "true" }, h("span", { class: "ssa-knob" }))]);
    b.addEventListener("click", function () { onChange(b.getAttribute("aria-checked") !== "true"); });
    return b;
  }
  /* roving focus + arrow keys for role=radio / role=tab groups */
  function arrowKeys(group, sel) {
    group.addEventListener("keydown", function (e) {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      const items = Array.prototype.slice.call(group.querySelectorAll(sel)), i = items.indexOf(D.activeElement);
      if (i < 0) return;
      let j = -1;
      if (d) j = (i + d + items.length) % items.length; else if (e.key === "Home") j = 0; else if (e.key === "End") j = items.length - 1;
      if (j < 0) return;
      e.preventDefault(); items[j].focus(); items[j].click();
    });
  }
  function radios(label, options, cur, fkBase, onPick, cls) {
    const g = h("div", { class: "ssa-seg" + (cls ? " " + cls : ""), role: "radiogroup", "aria-label": label });
    options.forEach(function (o) {
      const on = o[0] === cur;
      g.appendChild(h("button", { type: "button", role: "radio", class: "ssa-seg-b" + (o[2] ? " " + o[2] : ""), "aria-checked": on ? "true" : "false", tabindex: on ? "0" : "-1",
        "data-v": o[0], "data-fk": fkBase + "|" + o[0], onclick: function () { if (!on) onPick(o[0]); } }, o[1]));
    });
    arrowKeys(g, '[role="radio"]');
    return g;
  }
  function rangePicker(keys, cur, onPick) {
    return radios("Range", keys.map(function (k) { return [k, SHORT[k]]; }), cur, "range", onPick, "ssa-ranges");
  }
  function announce(msg) { if (!S) return; S.els.live.textContent = ""; setTimeout(function () { if (S) S.els.live.textContent = msg; }, 30); }
  function toast(msg) {
    if (!S) return;
    const t = S.els.toast; t.textContent = msg; t.hidden = false; t.classList.add("on");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("on"); t._h = setTimeout(function () { t.hidden = true; }, 250); }, 3200);
    announce(msg);
  }
  function hideToast() {
    const t = S && S.els.toast; if (!t) return;
    clearTimeout(t._h); t.classList.remove("on"); t.hidden = true;
  }
  function focusKey(key) {
    if (!key || !S) return false;
    const el = Array.prototype.find.call(S.root.querySelectorAll("[data-fk]"), function (x) { return x.getAttribute("data-fk") === key; });
    if (el && !el.disabled) { el.focus({ preventScroll: false }); return true; }
    return false;
  }

  /* ---------------------------------------------------------------- shell */
  function buildShell() {
    const els = S.els = {};
    const root = S.root = h("div", { id: "ssadm", class: "ssa", role: "dialog", "aria-modal": "true", "aria-labelledby": "ssa-title", lang: "en", dir: "ltr", "data-noi18n": "" });
    /* works as an overlay even before admin.css arrives */
    root.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:#F2EADC;color:#1B1D2B;overflow:hidden;display:flex;flex-direction:column";

    els.avatar = h("img", { class: "ssa-av", alt: "", width: 40, height: 40, hidden: true });
    els.who = h("span", { class: "ssa-who", text: "Shop owner" });
    els.close = h("button", { type: "button", class: "ssa-btn ssa-quiet ssa-viewshop", "data-fk": "close", onclick: function () { close(); } }, [icon("back"), h("span", { text: "View shop" })]);
    els.hd = h("header", { class: "ssa-hd" }, h("div", { class: "ssa-in ssa-hd-in" }, [
      h("div", { class: "ssa-brand" }, [els.avatar, h("div", { class: "ssa-brand-t" }, [h("h1", { id: "ssa-title", class: "ssa-title", tabindex: "-1" }, ["Soft Steps ", h("em", { text: "Admin" })]), els.who])]),
      els.close
    ]));

    els.tabs = h("div", { class: "ssa-tabs", role: "tablist", "aria-label": "Admin sections" });
    TABS.forEach(function (t) {
      els.tabs.appendChild(h("button", { type: "button", role: "tab", id: "ssa-tab-" + t[0], class: "ssa-tab", "aria-controls": "ssa-panel", "data-tab": t[0], "data-fk": "tab|" + t[0],
        onclick: function () { if (S.tab !== t[0]) { S.tab = t[0]; saveUi(); render("tab|" + t[0], true); } } }, t[1]));
    });
    arrowKeys(els.tabs, '[role="tab"]');
    els.nav = h("nav", { class: "ssa-nav", "aria-label": "Admin" }, h("div", { class: "ssa-in" }, els.tabs));

    els.col = h("div", { class: "ssa-in ssa-col" });
    els.main = h("main", { class: "ssa-main" }, els.col);
    els.bar = h("div", { class: "ssa-bar" });
    els.toast = h("div", { class: "ssa-toast", "aria-hidden": "true", hidden: true });
    els.live = h("div", { class: "ssa-sr", "aria-live": "polite", role: "status" });
    els.sheetHost = h("div", { class: "ssa-sheethost" });
    els.file = h("input", { type: "file", accept: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp", class: "ssa-file", tabindex: "-1", "aria-hidden": "true" });
    els.file.addEventListener("change", onFile);
    append(root, [els.hd, els.nav, els.main, els.bar, els.toast, els.live, els.sheetHost, els.file]);
    D.body.appendChild(root);
  }

  function render(focus, scrollTop) {
    const review = S.view === "review";
    hideToast();      /* a confirmation from the last screen doesn't belong on the next one */
    S.els.nav.hidden = review;
    S.els.tabs.querySelectorAll('[role="tab"]').forEach(function (b) {
      const on = b.getAttribute("data-tab") === S.tab;
      b.setAttribute("aria-selected", on ? "true" : "false"); b.tabIndex = on ? 0 : -1;
      if (on && !review) {
        const tl = S.els.tabs, l = b.offsetLeft, r = l + b.offsetWidth;
        if (l < tl.scrollLeft) tl.scrollLeft = Math.max(0, l - 16); else if (r > tl.scrollLeft + tl.clientWidth) tl.scrollLeft = r - tl.clientWidth + 16;
      }
    });
    renderPanel(focus, scrollTop);
  }

  /* Rebuilds the visible view; keeps scroll position and puts focus back on the same control (by data-fk). */
  function renderPanel(focus, toTop) {
    if (!S) return;
    const ae = D.activeElement, keep = focus || (ae && S.root.contains(ae) && ae.getAttribute("data-fk"));
    const y = S.els.main.scrollTop;
    const col = S.els.col;
    while (col.firstChild) col.removeChild(col.firstChild);
    banners(col);
    if (S.view === "review") col.appendChild(viewReview());
    else {
      const p = h("section", { id: "ssa-panel", class: "ssa-panel", role: "tabpanel", "aria-labelledby": "ssa-tab-" + S.tab });
      ({ prices: viewPrices, stock: viewStock, photos: viewPhotos, new: viewNew, notice: viewNotice })[S.tab](p);
      col.appendChild(p);
    }
    renderBar();
    S.els.main.scrollTop = toTop ? 0 : y;
    if (keep && !focusKey(keep)) { const t = S.root.querySelector(".ssa-col .ssa-h2"); if (t) t.focus(); }
  }

  function banners(col) {
    if (S.view === "edit" && S.restored) {
      const r = S.restored;
      col.appendChild(h("div", { class: "ssa-note ssa-note-info", role: "note" }, [
        h("p", { text: "You have " + plural(r.n, "unpublished change", "unpublished changes") + " from earlier. They're kept until you publish or discard them." }),
        h("button", { type: "button", class: "ssa-link", "data-fk": "banner-x", onclick: function () { S.restored = null; renderPanel(); } }, "OK, got it")
      ]));
    }
    if (S.dropped) col.appendChild(h("div", { class: "ssa-note ssa-note-warn", role: "note" }, [
      h("p", { text: plural(S.dropped, "earlier change was", "earlier changes were") + " left out because the shop already has " + (S.dropped === 1 ? "it" : "them") + " or " + (S.dropped === 1 ? "it" : "they") + " no longer appl" + (S.dropped === 1 ? "ies." : "y.") }),
      h("button", { type: "button", class: "ssa-link", "data-fk": "dropped-x", onclick: function () { S.dropped = 0; renderPanel(); } }, "OK")
    ]));
    if (S.srcIssue) col.appendChild(h("div", { class: "ssa-note ssa-note-warn", role: "note" }, [h("p", { text: "Heads up: " + S.srcIssue })]));
    if (!S.assetsOk && S.view === "edit" && (S.tab === "photos" || S.tab === "new"))
      col.appendChild(h("div", { class: "ssa-note ssa-note-warn", role: "note" }, h("p", { text: "Photo uploads aren't available for this account here, so photos and new colours can't be added." })));
  }

  function panelHead(p, title, intro) {
    p.appendChild(h("h2", { class: "ssa-h2", tabindex: "-1", text: title }));
    if (intro) p.appendChild(h("p", { class: "ssa-intro", text: intro }));
  }
  function pickRange(k) { S.range = k; saveUi(); renderPanel("range|" + k); }

  /* ---------------------------------------------------------------- Prices */
  function viewPrices(p) {
    panelHead(p, "Prices", "Set the price of each size. Turn off “Available” when a size runs out — customers won't be able to order it until you turn it back on.");
    p.appendChild(rangePicker(KEYS, S.range, pickRange));
    const cat = build(), k = S.range, ul = h("ul", { class: "ssa-list", "aria-label": SHORT[k] + " sizes" });
    rangeOf(cat, k).sizes.forEach(function (z) { ul.appendChild(sizeCard(k, z)); });
    p.appendChild(ul);
  }
  function sizeCard(k, z) {
    const b = sizeOf(S.base, k, z.id), pkey = ek("price", k, z.id), id = "ssa-p-" + k + "-" + z.id;
    const raw = Object.prototype.hasOwnProperty.call(S.rawPrice, pkey) ? S.rawPrice[pkey] : String(z.price);
    const li = h("li", { class: "ssa-card ssa-size" });
    const changedTag = tag("Changed", "changed"), offTag = tag("Not available", "off");
    const head = h("div", { class: "ssa-size-hd" }, [
      h("span", { class: "ssa-letter", "aria-hidden": "true", text: z.id }),
      h("div", { class: "ssa-size-t" }, [h("b", { text: SHORT[k] + " " + z.id }), h("span", { class: "ssa-dim", text: z.dims + (z.weight ? " · " + z.weight : "") })]),
      h("span", { class: "ssa-tags" }, [changedTag, offTag])
    ]);
    const hint = h("p", { class: "ssa-hint", id: id + "-h" }), err = h("p", { class: "ssa-err", id: id + "-e" });
    const inp = h("input", { id: id, type: "text", inputmode: "numeric", autocomplete: "off", enterkeyhint: "done", maxlength: "8", class: "ssa-input ssa-price", value: raw, "data-fk": "price|" + k + "|" + z.id, "aria-describedby": id + "-h " + id + "-e" });
    const sw = switchBtn("Available", z.stock !== "out", "avail|" + k + "|" + z.id, function (on) {
      setEdit("avail", k, z.id, on ? "in" : "out", b.stock); renderPanel(); announce(SHORT[k] + " " + z.id + (on ? " is available" : " is not available"));
    }, "ssa-avail");
    function sync() {
      const bad = Object.prototype.hasOwnProperty.call(S.rawPrice, pkey);
      const cur = bad ? null : parsePrice(inp.value);
      changedTag.hidden = !(hasEdit("price", k, z.id) || hasEdit("avail", k, z.id));
      offTag.hidden = sw.getAttribute("aria-checked") === "true";
      inp.setAttribute("aria-invalid", bad ? "true" : "false");
      err.hidden = !bad; err.textContent = bad ? (inp.value.trim() ? "Enter a whole number of rupees, from 1 to 99,999." : "Enter a price.") : "";
      hint.hidden = bad || cur == null || cur === b.price; hint.textContent = "Was " + inr(b.price) + " — now " + (cur != null ? inr(cur) : "");
      li.classList.toggle("is-changed", !changedTag.hidden); li.classList.toggle("is-bad", bad);
    }
    inp.addEventListener("input", function () {
      const v = parsePrice(inp.value);
      if (v == null) S.rawPrice[pkey] = inp.value;
      else { delete S.rawPrice[pkey]; setEdit("price", k, z.id, v, b.price); }
      sync(); renderBar();
    });
    inp.addEventListener("blur", function () { const v = parsePrice(inp.value); if (v != null && inp.value !== String(v)) inp.value = String(v); });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") inp.blur(); });
    li.appendChild(head);
    li.appendChild(h("div", { class: "ssa-size-row" }, [
      h("div", { class: "ssa-fld ssa-fld-price" }, [h("label", { for: id, class: "ssa-lbl", text: "Price" }), h("div", { class: "ssa-money" }, [h("span", { "aria-hidden": "true", text: "₹" }), inp])]),
      sw
    ]));
    li.appendChild(hint); li.appendChild(err);
    sync();
    return li;
  }

  /* ---------------------------------------------------------------- Stock */
  function viewStock(p) {
    panelHead(p, "Stock", "Choose what customers see for each colour. “Few left” and “Out of stock” only show when you set them.");
    p.appendChild(rangePicker(KEYS, S.range, pickRange));
    p.appendChild(switchBtn("Show only out of stock", S.onlyOut, "only-out", function (on) { S.onlyOut = on; renderPanel(); }, "ssa-filter"));
    const k = S.range, cols = rangeOf(build(), k).colours.filter(function (x) { return !S.onlyOut || x.stock === "out"; });
    if (!cols.length) { p.appendChild(h("p", { class: "ssa-empty", text: "No " + SHORT[k] + " colours are out of stock." })); return; }
    const ul = h("ul", { class: "ssa-list", "aria-label": SHORT[k] + " colours" });
    cols.forEach(function (x) { ul.appendChild(stockCard(k, x)); });
    p.appendChild(ul);
  }
  function colourTags(k, x, kinds) {
    const t = h("span", { class: "ssa-tags" }), fresh = isDraftNew(k, x.n);
    if (fresh) t.appendChild(tag("New · not published", "new"));
    else if (kinds.some(function (q) { return hasEdit(q, k, x.n); })) t.appendChild(tag("Changed", "changed"));
    if (x.hidden) t.appendChild(tag("Hidden", "hidden"));
    return t;
  }
  function stockCard(k, x) {
    const n = x.n, li = h("li", { class: "ssa-card ssa-colour" + (x.hidden ? " is-hidden" : "") });
    li.classList.toggle("is-changed", hasEdit("stock", k, n) || hasEdit("hide", k, n) || isDraftNew(k, n));
    li.appendChild(h("div", { class: "ssa-c-hd" }, [thumb(k, x), h("div", { class: "ssa-c-t" }, [h("b", { class: "ssa-cname", text: n }), colourTags(k, x, ["stock", "hide"])])]));
    li.appendChild(radios("Stock for " + n, STOCK.map(function (s) { return [s[0], s[1], "ssa-st-" + s[0]]; }), x.stock, "stock|" + k + "|" + n, function (v) {
      setColour(k, n, "stock", v); renderPanel(); announce(n + ": " + STOCK_WORD[v]);
    }, "ssa-stock"));
    li.appendChild(switchBtn("Hide from shop", x.hidden, "hide|" + k + "|" + n, function (on) {
      setColour(k, n, "hidden", on); renderPanel(); announce(n + (on ? " will be hidden from the shop" : " will show in the shop"));
    }, "ssa-hide"));
    return li;
  }

  /* ---------------------------------------------------------------- Photos */
  function viewPhotos(p) {
    panelHead(p, "Photos", "Change the photo customers see for a colour. Big photos are made smaller automatically before they upload.");
    p.appendChild(rangePicker(KEYS, S.range, pickRange));
    const k = S.range;
    if (!PHOTO_OK[k]) {
      p.appendChild(h("div", { class: "ssa-note ssa-note-info" }, h("p", { text: "All Chenille colours are shown in one shared photo, so they don't have photos of their own. You can still change Chenille prices and stock." })));
      return;
    }
    const ul = h("ul", { class: "ssa-list", "aria-label": SHORT[k] + " photos" });
    rangeOf(build(), k).colours.forEach(function (x) { ul.appendChild(photoCard(k, x)); });
    p.appendChild(ul);
  }
  function photoCard(k, x) {
    const n = x.n, fresh = isDraftNew(k, n), ch = hasEdit("photo", k, n);
    const state = fresh ? "New colour · not published yet" : x.photo ? (ch ? "New photo · not published yet" : "Your uploaded photo") : (ch ? "Original photo · not published yet" : "Original photo");
    const li = h("li", { class: "ssa-card ssa-colour ssa-photo" + (ch || fresh ? " is-changed" : "") });
    li.appendChild(h("div", { class: "ssa-c-hd" }, [thumb(k, x, true), h("div", { class: "ssa-c-t" }, [h("b", { class: "ssa-cname", text: n }), h("span", { class: "ssa-dim", text: state }), colourTags(k, x, ["photo"])])]));
    const acts = h("div", { class: "ssa-acts" });
    acts.appendChild(h("button", { type: "button", class: "ssa-btn", "data-fk": "photo|" + k + "|" + n, disabled: !S.assetsOk, onclick: function () { pickFile({ mode: "photo", k: k, n: n }); } }, [icon("cam"), h("span", { text: "Change photo" })]));
    if (!x.added && x.photo) acts.appendChild(h("button", { type: "button", class: "ssa-btn ssa-quiet", "data-fk": "orig|" + k + "|" + n, onclick: function () {
      setColour(k, n, "photo", { photo: null, thumb: null }); renderPanel("photo|" + k + "|" + n); toast(n + " will use the original photo when you publish.");
    } }, "Use original photo"));
    li.appendChild(acts);
    return li;
  }
  function pickFile(target) {
    if (!S || !S.assetsOk) return;
    S.pick = target; S.els.file.value = ""; S.els.file.click();
  }
  function onFile() {
    const f = S && S.els.file.files && S.els.file.files[0], t = S && S.pick;
    if (!f || !t) return;
    if (t.mode !== "photo") { newPhoto(f); return; }
    /* "Choose another photo" inside an open photo sheet loads into that same sheet */
    if (t.st && S.sheet && S.sheet === t.st.sheet) t.st.load(f); else photoSheet(t, f);
  }

  /* The photo flow lives in a sheet: prepare → preview → upload with progress → done (or a clear error). */
  function photoSheet(t, file) {
    const st = { phase: "prep", pic: null, err: "", step: 0 };
    openSheet("New photo for " + t.n, function (body, foot) {
      const sheet = st.sheet = S.sheet;
      function draw() {
        while (body.firstChild) body.removeChild(body.firstChild);
        while (foot.firstChild) foot.removeChild(foot.firstChild);
        if (st.phase === "prep") body.appendChild(h("p", { class: "ssa-busy", role: "status" }, [h("span", { class: "ssa-spin", "aria-hidden": "true" }), "Getting the photo ready…"]));
        if (st.pic) {
          const pv = h("div", { class: "ssa-pv" }, [h("figure", { class: "ssa-pv-main" }, [st.pic.main, h("figcaption", { text: "Shop photo · " + picMeta(st.pic) })]), h("figure", { class: "ssa-pv-th" }, [st.pic.thumb, h("figcaption", { text: "Small round photo" })])]);
          body.appendChild(pv);
        }
        if (st.phase === "up") body.appendChild(h("div", { class: "ssa-prog", role: "status" }, [h("progress", { max: "2", value: String(st.step - 1 + 0.5), "aria-label": "Upload progress" }), h("span", { text: st.step === 1 ? "Uploading photo (1 of 2)…" : "Uploading small photo (2 of 2)…" })]));
        if (st.err) body.appendChild(h("p", { class: "ssa-err ssa-err-box", role: "alert", text: st.err }));
        if (st.phase === "ready" || st.phase === "error") {
          if (st.pic) foot.appendChild(h("button", { type: "button", class: "ssa-primary", "data-fk": "sheet-use", onclick: use }, st.pic.ids.photo || st.phase === "error" ? "Try again" : "Use this photo"));
          foot.appendChild(h("button", { type: "button", class: "ssa-btn", "data-fk": "sheet-other", onclick: function () { pickFile({ mode: "photo", k: t.k, n: t.n, st: st }); } }, "Choose another photo"));
          foot.appendChild(h("button", { type: "button", class: "ssa-btn ssa-quiet", onclick: function () { closeSheet(); } }, "Cancel"));
        }
        sheet.locked = st.phase === "up";
      }
      async function use() {
        st.phase = "up"; st.err = ""; st.step = 1; draw();
        sheet.panel.querySelector(".ssa-sheet-t").focus();    /* the buttons are gone while it uploads */
        try {
          const ids = await uploadPair(st.pic, function (s) { st.step = s; draw(); });
          setColour(t.k, t.n, "photo", ids);
          closeSheet(true); renderPanel("photo|" + t.k + "|" + t.n);
          toast("New photo ready for " + t.n + ". Publish to show it in the shop.");
        } catch (e) { st.phase = "error"; st.err = UPLOAD_MSG[code(e)] || UPLOAD_MSG.upstream_error; draw(); focusKey("sheet-use"); }
      }
      st.load = async function (f) {
        st.phase = "prep"; st.pic = null; st.err = ""; draw();
        try { st.pic = await preparePhoto(f); st.phase = "ready"; }
        catch (e) { st.phase = "error"; st.err = PREP_MSG[code(e)] || PREP_MSG.decode; }
        draw();
        if (!focusKey("sheet-use")) focusKey("sheet-other");
      };
      st.load(file);
    });
  }

  /* ---------------------------------------------------------------- New colour */
  function viewNew(p) {
    const nf = S.nf, k = nf.k;
    panelHead(p, "Add a new colour", "Add a colour to Zigzag or Solid. It appears in the shop when you publish.");
    p.appendChild(h("p", { class: "ssa-small", text: "Chenille colours all come from one shared photo, so new colours can only be added to Zigzag and Solid." }));
    const form = h("form", { class: "ssa-card ssa-form", novalidate: true, "aria-label": "New colour" });
    form.appendChild(h("div", { class: "ssa-fld" }, [h("span", { class: "ssa-lbl", id: "ssa-nr-l", text: "Range" }), radios("Range for the new colour", [["zig", "Zigzag"], ["sol", "Solid"]], k, "nrange", function (v) { nf.k = v; nf.errs = {}; saveUi(); renderPanel("nrange|" + v); })]));

    const nameIn = h("input", { id: "ssa-nn", type: "text", class: "ssa-input", maxlength: String(NAME_MAX), autocomplete: "off", autocapitalize: "words", spellcheck: "false", value: nf.name, "data-fk": "new-name",
      "aria-describedby": "ssa-nn-h ssa-nn-e", "aria-invalid": nf.errs.name ? "true" : "false", disabled: nf.busy });
    const nameErr = h("p", { class: "ssa-err", id: "ssa-nn-e", text: nf.errs.name || "", hidden: !nf.errs.name });
    nameIn.addEventListener("input", function () { nf.name = nameIn.value; if (nf.errs.name) { nf.errs.name = ""; nameErr.hidden = true; nameIn.setAttribute("aria-invalid", "false"); } });
    form.appendChild(h("div", { class: "ssa-fld" }, [h("label", { for: "ssa-nn", class: "ssa-lbl", text: "Colour name" }), nameIn,
      h("p", { class: "ssa-hint", id: "ssa-nn-h", text: "For example “Teal & white”. Letters, numbers, spaces, & and - only, up to " + NAME_MAX + " characters." }), nameErr]));

    const photoF = h("div", { class: "ssa-fld" }, [h("span", { class: "ssa-lbl", id: "ssa-np-l", text: "Photo" })]);
    if (nf.prep) photoF.appendChild(h("p", { class: "ssa-busy", role: "status" }, [h("span", { class: "ssa-spin", "aria-hidden": "true" }), "Getting the photo ready…"]));
    if (nf.pic) photoF.appendChild(h("div", { class: "ssa-pv ssa-pv-sm" }, [h("figure", { class: "ssa-pv-main" }, [nf.pic.main, h("figcaption", { text: picMeta(nf.pic) })]), h("figure", { class: "ssa-pv-th" }, [nf.pic.thumb, h("figcaption", { text: "Small round photo" })])]));
    photoF.appendChild(h("button", { type: "button", class: "ssa-btn", "data-fk": "new-photo", "aria-describedby": "ssa-np-l ssa-np-e", disabled: nf.busy || nf.prep || !S.assetsOk,
      onclick: function () { pickFile({ mode: "new", k: k }); } }, [icon("cam"), h("span", { text: nf.pic ? "Choose another photo" : "Choose photo" })]));
    photoF.appendChild(h("p", { class: "ssa-err", id: "ssa-np-e", text: nf.errs.photo || "", hidden: !nf.errs.photo }));
    form.appendChild(photoF);

    const hex = nf.hex || "#8F806F";
    const hexOut = h("span", { class: "ssa-hex", text: hex.toUpperCase() });
    const colIn = h("input", { id: "ssa-nc", type: "color", class: "ssa-colourin", value: hex.toLowerCase(), "data-fk": "new-colour", "aria-describedby": "ssa-nc-h", disabled: nf.busy });
    colIn.addEventListener("input", function () { nf.hex = colIn.value.toUpperCase(); nf.hexTouched = true; hexOut.textContent = nf.hex; });
    form.appendChild(h("div", { class: "ssa-fld" }, [h("label", { for: "ssa-nc", class: "ssa-lbl", text: "Background colour" }), h("div", { class: "ssa-colourrow" }, [colIn, hexOut]),
      h("p", { class: "ssa-hint", id: "ssa-nc-h", text: nf.pic ? (nf.hexTouched ? "Your chosen colour. The panel behind the photo takes this colour." : "Suggested from the photo. Tap the colour to change it.") : "Choose a photo first and a colour will be suggested from it." })]));

    if (nf.busy) form.appendChild(h("div", { class: "ssa-prog", role: "status" }, [h("progress", { max: "2", value: String(nf.step - 0.5), "aria-label": "Upload progress" }), h("span", { text: nf.step === 1 ? "Uploading photo (1 of 2)…" : "Uploading small photo (2 of 2)…" })]));
    if (nf.err) form.appendChild(h("p", { class: "ssa-err ssa-err-box", role: "alert", text: nf.err }));
    form.appendChild(h("button", { type: "submit", class: "ssa-primary", "data-fk": "new-add", disabled: nf.busy || nf.prep || !S.assetsOk }, [icon("plus"), h("span", { text: nf.busy ? "Adding…" : "Add colour" })]));
    form.addEventListener("submit", function (e) { e.preventDefault(); addColour(); });
    p.appendChild(form);

    /* owner-added colours in this range, with delete (after an in-page "Are you sure?") */
    const cat = build(), mine = rangeOf(cat, k).colours.filter(function (x) { return x.added; });
    const gone = rangeOf(S.base, k).colours.filter(function (x) { return x.added && hasEdit("del", k, x.n); });
    p.appendChild(h("h3", { class: "ssa-h3", id: "ssa-added-h", tabindex: "-1", "data-fk": "added-h", text: "Colours you added · " + SHORT[k] }));
    if (!mine.length && !gone.length) p.appendChild(h("p", { class: "ssa-empty", text: "None yet." }));
    if (mine.length) {
      const ul = h("ul", { class: "ssa-list", "aria-labelledby": "ssa-added-h" });
      mine.forEach(function (x) {
        const fresh = isDraftNew(k, x.n);
        ul.appendChild(h("li", { class: "ssa-card ssa-colour ssa-added" + (fresh ? " is-changed" : "") }, [
          h("div", { class: "ssa-c-hd" }, [thumb(k, x), h("div", { class: "ssa-c-t" }, [h("b", { class: "ssa-cname", text: x.n }), h("span", { class: "ssa-dim", text: fresh ? "Not published yet" : x.hidden ? "Hidden from the shop" : "In the shop" })])]),
          h("button", { type: "button", class: "ssa-btn ssa-danger", "data-fk": "del|" + k + "|" + x.n, "aria-label": "Delete " + x.n, onclick: function () { askDelete(k, x.n, fresh); } }, [icon("trash"), h("span", { text: "Delete" })])
        ]));
      });
      p.appendChild(ul);
    }
    if (gone.length) {
      p.appendChild(h("p", { class: "ssa-small", text: "Will be removed when you publish:" }));
      const ul = h("ul", { class: "ssa-list" });
      gone.forEach(function (x) {
        ul.appendChild(h("li", { class: "ssa-card ssa-colour is-changed" }, [h("div", { class: "ssa-c-hd" }, [thumb(k, x), h("div", { class: "ssa-c-t" }, [h("b", { class: "ssa-cname", text: x.n }), h("span", { class: "ssa-dim", text: "Will be deleted" })])]),
          h("button", { type: "button", class: "ssa-btn ssa-quiet", "data-fk": "keep|" + k + "|" + x.n, onclick: function () { S.edits.delete(ek("del", k, x.n)); persist(); renderPanel("added-h"); } }, "Keep it")]));
      });
      p.appendChild(ul);
    }
  }
  async function newPhoto(file) {
    const nf = S.nf;
    nf.prep = true; nf.errs.photo = ""; nf.err = ""; renderPanel("new-photo");
    try {
      const pic = await preparePhoto(file);
      if (!S) return;
      nf.pic = pic; if (!nf.hexTouched) nf.hex = pic.avg;
    } catch (e) { if (!S) return; nf.errs.photo = PREP_MSG[code(e)] || PREP_MSG.decode; }
    nf.prep = false;
    if (S.tab === "new" && S.view === "edit") renderPanel("new-photo");
    if (nf.pic && !nf.errs.photo) announce("Photo ready. Suggested colour " + nf.hex + ".");
  }
  async function addColour() {
    const nf = S.nf, k = nf.k;
    if (nf.busy || nf.prep) return;
    nf.errs = {}; nf.err = "";
    const name = cleanName(nf.name), ne = nameError(k, name);
    if (ne) nf.errs.name = ne;
    if (!nf.pic) nf.errs.photo = "Choose a photo of the new colour.";
    const hex = HEX_RE.test(nf.hex || "") ? nf.hex.toUpperCase() : null;
    if (!hex && !nf.errs.photo) nf.errs.photo = "Choose a photo so a colour can be suggested.";
    if (nf.errs.name || nf.errs.photo) { renderPanel(nf.errs.name ? "new-name" : "new-photo"); announce(nf.errs.name || nf.errs.photo); return; }
    nf.busy = true; nf.step = 1; renderPanel("new-add");
    try {
      const ids = await uploadPair(nf.pic, function (s) { nf.step = s; if (S && S.tab === "new" && S.view === "edit") renderPanel(); });
      if (!S) return;
      if (nameTaken(k, name)) throw { code: "taken" };
      S.edits.set(ek("add", k, name), { n: name, bg: hex, stock: "in", hidden: false, photo: ids.photo, thumb: ids.thumb, added: true });
      persist();
      S.nf = { k: k, name: "", hex: null, hexTouched: false, pic: null, busy: false, prep: false, step: 0, err: "", errs: {} };
      renderPanel("added-h");
      toast(name + " added to " + SHORT[k] + ". Publish to show it in the shop.");
    } catch (e) {
      if (!S) return;
      nf.busy = false;
      nf.err = code(e) === "taken" ? SHORT[k] + " already has a colour called “" + name + "”." : (UPLOAD_MSG[code(e)] || UPLOAD_MSG.upstream_error);
      renderPanel("new-add");
    }
  }
  function askDelete(k, n, fresh) {
    openSheet("Delete “" + n + "”?", function (body, foot) {
      body.appendChild(h("p", { text: fresh ? "It hasn't been published yet, so it will simply be removed from your changes." : "It will be removed from the " + SHORT[k] + " colours in the shop when you publish. You can keep it until then." }));
      foot.appendChild(h("button", { type: "button", class: "ssa-primary ssa-primary-danger", "data-fk": "sheet-yes", onclick: function () {
        if (fresh) S.edits.delete(ek("add", k, n));
        else { ["stock", "hide", "photo"].forEach(function (t) { S.edits.delete(ek(t, k, n)); }); S.edits.set(ek("del", k, n), true); }
        persist(); closeSheet(true); renderPanel("added-h"); toast(fresh ? n + " removed." : n + " will be deleted when you publish.");
      } }, "Yes, delete"));
      foot.appendChild(h("button", { type: "button", class: "ssa-btn", "data-fk": "sheet-no", onclick: function () { closeSheet(); } }, "Keep it"));
    }, "sheet-no");
  }

  /* ---------------------------------------------------------------- Notice */
  function viewNotice(p) {
    panelHead(p, "Shop notice", "A short message shown on the shop, for example a holiday break or a festival offer.");
    const n = build().notice, bn = S.base.notice;
    const card = h("div", { class: "ssa-card ssa-form" });
    card.appendChild(switchBtn("Show a notice on the shop", n.on, "notice|on", function (on) { setNotice({ on: on }); renderPanel(); }, "ssa-notice-on"));
    const fields = [["en", "Notice in English", "Required when the notice is on."], ["gu", "Gujarati (optional)", "If empty, Gujarati readers see the English notice."], ["hi", "Hindi (optional)", "If empty, Hindi readers see the English notice."]];
    let enErr = null;
    fields.forEach(function (f) {
      const l = f[0], id = "ssa-nt-" + l, max = NOTE_MAX[l];
      const val = S.noteRaw[l] != null ? S.noteRaw[l] : n[l];
      const ta = h("textarea", { id: id, class: "ssa-input ssa-ta", rows: l === "en" ? "3" : "2", maxlength: String(max), lang: l, "data-fk": "notice|" + l, "aria-describedby": id + "-h " + id + "-c" + (l === "en" ? " " + id + "-e" : "") });
      ta.value = val;
      const cnt = h("span", { class: "ssa-count", id: id + "-c", text: ta.value.length + " / " + max });
      const fld = h("div", { class: "ssa-fld" }, [h("label", { for: id, class: "ssa-lbl", text: f[1] }), ta, h("div", { class: "ssa-hintrow" }, [h("p", { class: "ssa-hint", id: id + "-h", text: f[2] }), cnt])]);
      if (l === "en") { enErr = h("p", { class: "ssa-err", id: id + "-e" }); fld.appendChild(enErr); }
      ta.addEventListener("input", function () {
        S.noteRaw[l] = ta.value; cnt.textContent = ta.value.length + " / " + max;
        const o = {}; o[l] = ta.value; setNotice(o); syncNotice(); renderBar();
      });
      card.appendChild(fld);
    });
    p.appendChild(card);
    const pvText = h("p", { class: "ssa-notice-pv" });
    p.appendChild(h("div", { class: "ssa-pvbox" }, [h("p", { class: "ssa-lbl", text: "Customers will see" }), pvText]));
    function syncNotice() {
      const d = build().notice, bad = d.on && !d.en;
      const ta = card.querySelector("#ssa-nt-en");
      ta.setAttribute("aria-invalid", bad ? "true" : "false");
      enErr.hidden = !bad; enErr.textContent = bad ? "Write the notice in English, or turn the notice off." : "";
      pvText.textContent = d.on ? (d.en || "…") : "No notice (it's turned off).";
      pvText.classList.toggle("is-off", !d.on);
      card.classList.toggle("is-changed", !same({ on: d.on, en: d.en, gu: d.gu, hi: d.hi }, { on: bn.on, en: bn.en, gu: bn.gu, hi: bn.hi }));
    }
    syncNotice();
  }
  function setNotice(part) {
    const cur = build().notice, b = S.base.notice;
    const raw = { on: cur.on, en: S.noteRaw.en != null ? S.noteRaw.en : cur.en, gu: S.noteRaw.gu != null ? S.noteRaw.gu : cur.gu, hi: S.noteRaw.hi != null ? S.noteRaw.hi : cur.hi };
    Object.assign(raw, part);
    const v = { on: !!raw.on, en: cleanNote(raw.en, NOTE_MAX.en), gu: cleanNote(raw.gu, NOTE_MAX.gu), hi: cleanNote(raw.hi, NOTE_MAX.hi) };
    setEdit("notice", "", "", v, { on: b.on, en: b.en, gu: b.gu, hi: b.hi });
  }

  /* ---------------------------------------------------------------- Review & publish */
  function describe(key, val) {
    const a = pk(key); if (!a) return null;
    const t = a[0], k = a[1], id = a[2], b = S.base, cat = build();
    const col = function (n) { return colourOf(cat, k, n) || colourOf(b, k, n); };
    switch (t) {
      case "price": { const z = sizeOf(b, k, id); return { g: k, text: SHORT[k] + " " + id + " price " + inr(z.price) + " → " + inr(val) }; }
      case "avail": return { g: k, text: SHORT[k] + " " + id + ": " + (val === "out" ? "Not available" : "Available again") };
      case "stock": return { g: k, text: id + ": " + STOCK_WORD[val], c: col(id) };
      case "hide": return { g: k, text: id + ": " + (val ? "Hidden from shop" : "Shown in shop again"), c: col(id) };
      case "photo": return { g: k, text: id + ": " + (val.photo ? "New photo" : "Original photo again"), c: col(id) };
      case "add": {
        const x = [];
        if (val.stock !== "in") x.push(STOCK_WORD[val.stock]);
        if (val.hidden) x.push("hidden");
        return { g: k, text: "New colour: " + val.n + (x.length ? " (" + x.join(", ") + ")" : ""), c: val };
      }
      case "del": return { g: k, text: "Delete colour: " + id, c: colourOf(b, k, id) };
      case "notice": {
        if (!val.on) return { g: "notice", text: "Notice: Off" };
        return { g: "notice", text: (b.notice.on ? "Notice changed: “" : "Notice: On — “") + (val.en || "…") + "”" };
      }
    }
    return null;
  }
  function when(iso) {
    const d = new Date(iso);
    if (!iso || isNaN(d)) return "";
    try { return d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }); } catch (e) { return d.toISOString(); }
  }
  function viewReview() {
    const sec = h("section", { class: "ssa-panel ssa-review", "aria-labelledby": "ssa-rv-h" });
    sec.appendChild(h("h2", { class: "ssa-h2", id: "ssa-rv-h", tabindex: "-1", "data-fk": "review-h", text: S.published ? "Published ✓" : "Review changes" }));
    const n = S.edits.size;
    if (S.published) {
      sec.appendChild(h("div", { class: "ssa-done", role: "status" }, [h("span", { class: "ssa-done-ic", "aria-hidden": "true" }, icon("check")), h("p", { text: "Your changes are live. The shop will refresh in a moment." })]));
      if (S.reloadHint) sec.appendChild(h("button", { type: "button", class: "ssa-btn", "data-fk": "reload", onclick: function () { location.reload(); } }, "Refresh the shop now"));
      return sec;
    }
    sec.appendChild(h("p", { class: "ssa-intro", text: n === 1 ? "This change will go live in the shop for everyone when you publish." : n ? "These " + n + " changes will go live in the shop for everyone when you publish." : "There are no changes to publish." }));
    const last = when(S.base.updatedAt);
    if (last) sec.appendChild(h("p", { class: "ssa-small", text: "Last published: " + last }));
    const groups = {}, order = KEYS.concat(["notice"]), keys = [];
    S.edits.forEach(function (val, key) { const d = describe(key, val); if (!d) return; d.key = key; (groups[d.g] = groups[d.g] || []).push(d); keys.push(key); });
    order.forEach(function (g) {
      if (!groups[g]) return;
      const ul = h("ul", { class: "ssa-rv-list", "aria-labelledby": "ssa-rv-" + g });
      groups[g].forEach(function (d) {
        const i = keys.indexOf(d.key), next = keys[i + 1] || keys[i - 1];
        ul.appendChild(h("li", { class: "ssa-rv-item" }, [
          d.c ? thumb(g, d.c) : h("span", { class: "ssa-rv-dot", "aria-hidden": "true" }),
          h("span", { class: "ssa-rv-t", text: d.text }),
          h("button", { type: "button", class: "ssa-btn ssa-quiet ssa-undo", "data-fk": "undo|" + d.key, "aria-label": "Undo: " + d.text, disabled: S.busy, onclick: function () {
            S.edits.delete(d.key);
            const a = pk(d.key); if (a && a[0] === "price") delete S.rawPrice[d.key];
            if (a && a[0] === "notice") S.noteRaw = {};
            persist();
            if (!S.edits.size) { S.view = "edit"; render("tab|" + S.tab); announce("No changes left."); return; }
            renderPanel(next ? "undo|" + next : "review-h"); announce("Undone: " + d.text);
          } }, [icon("undo"), h("span", { text: "Undo" })])
        ]));
      });
      sec.appendChild(h("h3", { class: "ssa-h3", id: "ssa-rv-" + g, text: g === "notice" ? "Notice" : SHORT[g] }));
      sec.appendChild(ul);
    });
    const pr = problems();
    if (pr.length) sec.appendChild(h("p", { class: "ssa-err ssa-err-box", role: "alert", text: "Fix " + pr.map(function (x) { return x.label; }).join(", ") + " before publishing." }));
    if (S.status) sec.appendChild(statusBox());
    if (n && !S.busy) sec.appendChild(h("div", { class: "ssa-rv-foot" }, h("button", { type: "button", class: "ssa-link ssa-link-danger", "data-fk": "discard", onclick: askDiscard }, "Discard all changes")));
    return sec;
  }
  function statusBox() {
    const s = S.status;
    return h("div", { class: "ssa-status ssa-status-" + s.kind, role: s.kind === "error" ? "alert" : "status", "data-fk": "status", tabindex: "-1" }, [
      s.kind === "busy" ? h("span", { class: "ssa-spin", "aria-hidden": "true" }) : icon(s.kind === "error" ? "warn" : "check"),
      h("p", { text: s.text })
    ]);
  }
  function askDiscard() {
    openSheet("Discard all changes?", function (body, foot) {
      body.appendChild(h("p", { text: "This removes all " + plural(S.edits.size, "change", "changes") + " you haven't published. The shop stays as it is now." }));
      foot.appendChild(h("button", { type: "button", class: "ssa-primary ssa-primary-danger", onclick: function () {
        S.edits.clear(); S.rawPrice = {}; S.noteRaw = {}; S.status = null; persist(); closeSheet(true); S.view = "edit"; render("tab|" + S.tab, true); toast("All changes discarded.");
      } }, "Yes, discard"));
      foot.appendChild(h("button", { type: "button", class: "ssa-btn", "data-fk": "sheet-no", onclick: function () { closeSheet(); } }, "Keep my changes"));
    }, "sheet-no");
  }
  function goReview() {
    if (!S.edits.size) return;
    S.view = "review"; S.status = null; S.restored = null;
    render("review-h", true);
  }
  async function publish() {
    if (!S || S.busy || S.published || !S.edits.size) return;
    if (problems().length) { renderPanel(); return; }
    S.busy = true; S.status = { kind: "busy", text: "Publishing… please keep this page open." };
    persist();                     /* the draft must survive the reload that follows a conflict */
    renderPanel("status");
    try {
      const art = await cap("artifact");
      if (!art || typeof art.publish !== "function") throw { code: "no_artifact" };
      const src = await fetchSource();
      const cat = build();
      cat.updatedAt = new Date().toISOString();
      const html = src.text.slice(0, src.a) + catalogBlock(cat) + src.text.slice(src.b);
      try { await art.publish(html); }
      catch (e) {
        const c = KNOWN_PUBLISH.indexOf(code(e)) >= 0 ? code(e) : "upstream_error";
        if (c !== "upstream_error") throw { code: c };
        await wait(600 + Math.random() * 1400);   /* one retry, after a short random pause */
        await art.publish(html);
      }
      S.published = true; S.busy = false; S.status = null;
      sset("sessionStorage", DRAFT_KEY, null);
      restoreUrl();
      renderPanel("review-h");
      announce("Published. Your changes are live.");
      setTimeout(function () { if (S && S.published) { S.reloadHint = true; renderPanel(); } }, 8000);
    } catch (e) {
      const c = KNOWN_PUBLISH.indexOf(code(e)) >= 0 ? code(e) : "upstream_error";
      S.busy = false; S.status = { kind: "error", text: PUBLISH_MSG[c] };
      if (c === "not_writer" || c === "not_granted" || c === "capability_disabled" || c === "capability_removed" || c === "consent_required" || c === "not_declared" || c === "no_artifact") S.readOnly = true;
      renderPanel("status");
    }
  }

  /* ---------------------------------------------------------------- bottom bar */
  function renderBar() {
    if (!S) return;
    const bar = S.els.bar, n = S.edits.size;
    while (bar.firstChild) bar.removeChild(bar.firstChild);
    const inner = h("div", { class: "ssa-in ssa-bar-in" });
    bar.appendChild(inner);
    if (S.view === "review") {
      if (S.published) { inner.appendChild(h("p", { class: "ssa-bar-ok" }, [icon("check"), "Published"])); inner.appendChild(h("button", { type: "button", class: "ssa-btn", onclick: function () { close(); } }, "View shop")); return; }
      inner.appendChild(h("button", { type: "button", class: "ssa-btn ssa-bar-back", "data-fk": "back", disabled: S.busy, onclick: function () { S.view = "edit"; S.status = null; render("tab|" + S.tab); } }, [icon("back"), h("span", { text: "Back" })]));
      inner.appendChild(h("button", { type: "button", class: "ssa-primary ssa-bar-go", "data-fk": "publish", disabled: S.busy || !n || problems().length > 0 || S.readOnly, onclick: publish }, S.busy ? "Publishing…" : "Publish to shop"));
      return;
    }
    const pr = problems();
    if (pr.length) {
      inner.appendChild(h("p", { class: "ssa-bar-msg ssa-bar-bad", text: "Fix " + (pr.length === 1 ? "the field" : "the " + pr.length + " fields") + " marked in red to continue." }));
      inner.appendChild(h("button", { type: "button", class: "ssa-btn", "data-fk": "fixit", onclick: function () {
        const f = pr[0]; S.tab = f.tab; if (f.range) S.range = f.range; render(f.fk);
      } }, "Show me"));
      return;
    }
    if (!n) { inner.appendChild(h("p", { class: "ssa-bar-msg", text: "No unpublished changes" })); return; }
    inner.appendChild(h("button", { type: "button", class: "ssa-primary ssa-bar-go", "data-fk": "review", onclick: goReview }, [
      h("span", { class: "ssa-count-b", text: String(n) }), h("span", { text: (n === 1 ? " change" : " changes") + " · Review & publish" }), icon("chev")
    ]));
  }

  /* ---------------------------------------------------------------- sheets (in-page dialogs) */
  function openSheet(title, fill, focusFk) {
    closeSheet(true);
    const prev = D.activeElement;
    const body = h("div", { class: "ssa-sheet-b" }), foot = h("div", { class: "ssa-sheet-f" });
    const panel = h("div", { class: "ssa-sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "ssa-sheet-t" }, [
      h("div", { class: "ssa-sheet-hd" }, [h("h2", { id: "ssa-sheet-t", class: "ssa-sheet-t", tabindex: "-1", text: title }),
        h("button", { type: "button", class: "ssa-iconbtn", "aria-label": "Close", onclick: function () { if (S.sheet && !S.sheet.locked) closeSheet(); } }, icon("x"))]),
      body, foot
    ]);
    const scrim = h("div", { class: "ssa-scrim", "aria-hidden": "true", onclick: function () { if (S.sheet && !S.sheet.locked) closeSheet(); } });
    [S.els.hd, S.els.nav, S.els.main, S.els.bar].forEach(function (e) { e.setAttribute("inert", ""); });
    S.sheet = { panel: panel, scrim: scrim, prev: prev, locked: false };
    S.els.sheetHost.appendChild(scrim); S.els.sheetHost.appendChild(panel);
    fill(body, foot);
    if (!(focusFk && focusKey(focusFk))) panel.querySelector(".ssa-sheet-t").focus();
  }
  function closeSheet(silent) {
    if (!S || !S.sheet) return;
    const sh = S.sheet; S.sheet = null;
    sh.panel.remove(); sh.scrim.remove();
    [S.els.hd, S.els.nav, S.els.main, S.els.bar].forEach(function (e) { e.removeAttribute("inert"); });
    if (!silent && sh.prev && sh.prev.isConnected) sh.prev.focus();
  }

  /* ---------------------------------------------------------------- page lock, URL, keys */
  function lockPage() {
    S.inerted = [];
    Array.prototype.forEach.call(D.body.children, function (el) {
      if (el === S.root || /^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(el.tagName) || el.hasAttribute("inert")) return;
      el.setAttribute("inert", ""); S.inerted.push(el);
    });
    S.prevOverflow = D.documentElement.style.overflow;
    D.documentElement.style.overflow = "hidden";
    D.documentElement.classList.add("ssa-open");
  }
  function unlockPage() {
    (S.inerted || []).forEach(function (el) { el.removeAttribute("inert"); });
    D.documentElement.style.overflow = S.prevOverflow || "";
    D.documentElement.classList.remove("ssa-open");
  }
  /* While open the URL carries #admin, so an accidental reload (or the reload after a publish conflict) comes back here. */
  function markUrl() {
    S.prevHash = location.hash;
    if (location.hash === "#admin") return;
    try { history.replaceState(history.state, "", "#admin"); S.markedUrl = true; } catch (e) {}
  }
  function restoreUrl() {
    if (!S || !S.markedUrl) return;
    try { const u = new URL(location.href); u.hash = S.prevHash || ""; history.replaceState(history.state, "", u.href); } catch (e) {}
    S.markedUrl = false;
  }
  /* Tab wraps around inside the editor (or inside an open sheet) instead of leaving for the browser's toolbar */
  function trapTab(e) {
    const box = S.sheet ? S.sheet.panel : S.root;
    const items = Array.prototype.filter.call(box.querySelectorAll('button, input, textarea, select, a[href], [tabindex="0"]'), function (el) {
      return !el.disabled && el.tabIndex >= 0 && !el.closest("[inert]") && el.getClientRects().length > 0;
    });
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1], a = D.activeElement, inside = box.contains(a);
    if (e.shiftKey ? (!inside || a === first) : (!inside || a === last)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
  }
  function onKey(e) {
    if (S && e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey) { trapTab(e); return; }
    if (e.key !== "Escape" || !S) return;
    e.stopPropagation(); e.preventDefault();
    if (S.sheet) { if (!S.sheet.locked) closeSheet(); return; }
    if (S.busy) return;
    if (S.view === "review" && !S.published) { S.view = "edit"; S.status = null; render("tab|" + S.tab); return; }
    close();
  }
  function ensureCss() {
    let link = Array.prototype.find.call(D.querySelectorAll('link[rel~="stylesheet"]'), function (l) { return /(^|\/)admin\.css([?#]|$)/.test(l.getAttribute("href") || ""); });
    if (!link) {
      let href = "admin.css";
      try { href = new URL("admin.css", SELF || location.href).href; } catch (e) {}
      link = h("link", { rel: "stylesheet", href: href });
      D.head.appendChild(link);
    }
    if (link.sheet) return Promise.resolve();
    return new Promise(function (r) { link.addEventListener("load", r, { once: true }); link.addEventListener("error", r, { once: true }); setTimeout(r, 4000); });
  }

  /* ---------------------------------------------------------------- owner-only refusal */
  function showDeny() {
    hideDeny();
    const prev = D.activeElement;
    const btn = h("button", { type: "button", class: "ssa-primary", onclick: hideDeny }, "Close");
    deny = h("div", { class: "ssa-deny", role: "alertdialog", "aria-modal": "true", "aria-labelledby": "ssa-deny-t" }, h("div", { class: "ssa-deny-card" }, [
      h("p", { id: "ssa-deny-t", class: "ssa-deny-t", text: DENY_TEXT }), btn
    ]));
    deny.style.cssText = "position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(20,27,54,.55)";
    deny._prev = prev;
    deny.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); hideDeny(); } });
    D.body.appendChild(deny);
    btn.focus();
  }
  function hideDeny() {
    if (!deny) return;
    const p = deny._prev; deny.remove(); deny = null;
    if (p && p.isConnected && p.focus) p.focus();
  }

  /* ---------------------------------------------------------------- open / close */
  let opening = null;
  function open() {
    if (S && S.root && S.root.isConnected) { const t = D.getElementById("ssa-title"); if (t) t.focus(); return Promise.resolve(true); }
    if (opening) return opening;
    opening = (async function () {
      await ensureCss();
      const ok = await canEdit();
      if (!ok) { showDeny(); return false; }
      hideDeny();
      const assets = await cap("assets");
      if (S && S.root && S.root.isConnected) return true;
      const cat = readCatalog();
      let ui = {}; try { ui = JSON.parse(sget("sessionStorage", UI_KEY) || "{}") || {}; } catch (e) { ui = {}; }
      S = {
        base: cat.cat, raw: cat.raw, edits: new Map(), orig: {}, view: "edit",
        tab: TABS.some(function (t) { return t[0] === ui.tab; }) ? ui.tab : "prices",
        range: KEYS.indexOf(ui.range) >= 0 ? ui.range : "zig",
        onlyOut: false, rawPrice: {}, noteRaw: {}, status: null, busy: false, published: false, assetsOk: !!(assets && typeof assets.upload === "function"),
        nf: { k: PHOTO_OK[ui.newRange] ? ui.newRange : "zig", name: "", hex: null, hexTouched: false, pic: null, busy: false, prep: false, step: 0, err: "", errs: {} },
        prevFocus: D.activeElement
      };
      buildShell();
      lockPage();
      D.addEventListener("keydown", onKey, true);
      if (!S.base) {
        while (S.els.col.firstChild) S.els.col.removeChild(S.els.col.firstChild);
        S.els.nav.hidden = true;
        S.els.col.appendChild(h("div", { class: "ssa-note ssa-note-warn", role: "alert" }, h("p", { text: "The shop's product list couldn't be read on this page, so nothing can be edited here." })));
        S.els.title = D.getElementById("ssa-title"); S.els.title.focus();
        return true;
      }
      harvest(D);
      const r = restoreDraft();
      if (r.n) S.restored = r;
      if (r.dropped) S.dropped = r.dropped;
      markUrl();
      render();
      D.getElementById("ssa-title").focus();
      cap("user").then(function (u) { return u && typeof u.me === "function" ? u.me() : null; }).then(function (me) {
        if (!S || !me) return;
        S.els.who.textContent = me.name ? "Signed in as " + me.name : (me.isOwner ? "Shop owner" : "Shop editor");
        if (typeof me.avatarUrl === "string" && /^(data:image\/|https:\/\/|\/(?!\/))/.test(me.avatarUrl)) { S.els.avatar.src = me.avatarUrl; S.els.avatar.hidden = false; }
      }).catch(function () {});
      preflight();
      return true;
    })();
    return opening.finally(function () { opening = null; });
  }
  function close() {
    if (!S) { hideDeny(); return; }
    if (S.busy) return;
    if (S.sheet) closeSheet(true);
    D.removeEventListener("keydown", onKey, true);
    unlockPage();
    restoreUrl();
    persist();
    const prev = S.prevFocus;
    if (S.root) S.root.remove();
    S = null;
    if (prev && prev.isConnected && prev.focus) { try { prev.focus({ preventScroll: true }); } catch (e) { prev.focus(); } }
  }

  W.SSADMIN = Object.freeze({ open: open, close: close });
})();
