/* features.js: Soft Steps features module (spec §5).
   Colour index, sticky header and phone buy dock, Saved shortlist, ask-about-this-mat links,
   PIN check, Compare dialog, fit-tool upgrade, gift note, Menu sheet and the drawer hook.
   Loads after the core and fx.js. Hooks are registered only through SSFX_on, and every
   feature is wrapped in its own try/catch so a failure here never breaks the shop. */
(function () {
  "use strict";
  var SS = window.SS;
  if (!SS || !SS.P) return;

  /* ---------- Shared helpers ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function safe(name, fn) { try { return fn(); } catch (e) { try { console.warn("features/" + name, e); } catch (x) {} } }
  function on(n, f) { try { window.SSFX_on(n, f); } catch (e) {} }
  function mq(q) { try { return matchMedia(q); } catch (e) { return { matches: false }; } }
  function onMq(m, f) { try { m.addEventListener("change", f); } catch (e) { try { m.addListener(f); } catch (x) {} } }
  var RM = mq("(prefers-reduced-motion: reduce)");
  var PHONE = mq("(max-width: 860px)");
  var E_OUT = "cubic-bezier(.22,.8,.2,1)";
  function canAnim() { return !RM.matches && "animate" in Element.prototype; }
  function behavior() { return RM.matches ? "auto" : "smooth"; }

  var P = SS.P, inr = SS.inr, esc = SS.esc;
  var PH = "919099441429";
  var RN = { zig: "Multicolour Zigzag", sol: "Solid Premium", chen: "Striped Chenille" };
  var RS = { zig: "Zigzag", sol: "Solid", chen: "Chenille" };
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z"/></svg>';
  var BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  /* Chenille colourway rects in the 1200x1801 photo (x, y, w, h), chip order (spec §4.5). */
  var RECTS = [[83,142,507,257],[612,142,512,257],[83,411,507,272],[612,411,512,272],[83,694,507,278],[612,694,512,278],[83,985,507,294],[612,985,512,294],[83,1293,507,298],[612,1293,512,298]];

  function cardOf(k) { return $('.prod[data-k="' + k + '"]'); }
  function curColour(el) { var c = $("[data-colour]", el); return c ? c.textContent : ""; }
  function curSize(el) { var b = $('.sizes-c [aria-checked="true"]', el); return b ? b.textContent.trim() : "M"; }
  function fromPrice(k) { return Math.min.apply(null, P[k].sizes.map(function (z) { return z[3]; })); }
  /* A chenille chip's crop in the photo: data-ci (set by the core, so hiding a colour never shifts the others). */
  function chenIdx(c) {
    var i = -1, cc = cardOf("chen"); if (!cc) return 0;
    $$$("[data-n]", cc).forEach(function (b, j) { if (b.dataset.n === c) i = b.hasAttribute("data-ci") ? +b.getAttribute("data-ci") : j; });
    return i;
  }
  /* Stock as the owner set it (the core's SS.stock); "in" when the core predates the catalog. */
  function stockOf(k, c, si) { try { return SS.stock ? SS.stock(k, c, si) : "in"; } catch (e) { return "in"; } }
  function sizeOut(k, si) { try { return !!(SS.sizeStock && SS.sizeStock(k, si) === "out"); } catch (e) { return false; } }
  function stkHTML(st) { return st === "few" || st === "out" ? '<span class="stk' + (st === "out" ? " out" : "") + '">' + (st === "few" ? "Few left" : "Out of stock") + "</span>" : ""; }
  function stkSuffix(st) { return st === "few" ? ", few left" : st === "out" ? ", out of stock" : ""; }
  /* Chenille crop as percentages, so one rule fits any square box (tile, dock, saved thumb):
     s = B*1.4/h; size = 1200*s; offset = B/2 - centre*s, converted to background-position %. */
  function cropCss(i) {
    var r = RECTS[i] || RECTS[0], k = 1.4 / r[3], cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
    var size = 1200 * k * 100, px = (0.5 - cx * k) / (1 - 1200 * k) * 100, py = (0.5 - cy * k) / (1 - 1801 * k) * 100;
    return "background-image:url(" + (window.SSIMG ? SSIMG.map("img/chen.jpg") : "img/chen.jpg") + ");background-repeat:no-repeat;background-size:" + size.toFixed(2) + "% auto;background-position:" + px.toFixed(2) + "% " + py.toFixed(2) + "%";
  }
  /* Thumbnail for a colour: {src} for swatch photos, {crop} for chenille. */
  function thumbOf(k, c) {
    var b = SS.swatch(k, c), im = b && $("img", b);
    if (im) return { src: im.getAttribute("src"), bg: b.dataset.bg };
    if (!b) return { crop: "", bg: "#E8DDCB" };   /* a colour no longer on show: plain swatch, never another colour's photo */
    return { crop: cropCss(chenIdx(c)), bg: b.dataset.bg };
  }

  SS.lineThumb = function (k, c) {
    var th = thumbOf(k, c);
    return th.src ? '<img src="' + esc(th.src) + '" alt="">' : '<span class="lthumb" style="--c:' + esc(th.bg) + ";" + th.crop + '"></span>';
  };

  /* Storage with an in-memory fallback (private mode or blocked storage). */
  var MEM = {};
  function sget(key) { if (key in MEM) return MEM[key]; try { return localStorage.getItem(key); } catch (e) { return null; } }
  function sset(key, v) { MEM[key] = v; try { localStorage.setItem(key, v); } catch (e) {} }

  /* IntersectionObserver against this document's own viewport (root: document), so rootMargin
     still applies when the page runs inside a cross-origin iframe. */
  function makeIO(cb, o) {
    if (!("IntersectionObserver" in window)) return null;
    try { return new IntersectionObserver(cb, Object.assign({ root: document }, o)); }
    catch (e) { try { return new IntersectionObserver(cb, o); } catch (x) { return null; } }
  }

  /* Scroll an element into view, then run cb on scrollend (or once scrolling goes quiet). */
  function afterScroll(cb) {
    var done = false, t;
    function fin() {
      if (done) return; done = true; clearTimeout(t);
      window.removeEventListener("scroll", onS); window.removeEventListener("scrollend", fin);
      cb();
    }
    function onS() { clearTimeout(t); t = setTimeout(fin, 220); }
    window.addEventListener("scroll", onS, { passive: true });
    window.addEventListener("scrollend", fin);
    t = setTimeout(fin, 500);
  }
  /* Bring a card into view: the whole card when it fits, else the part that matters (inner). */
  function reveal(card, inner) {
    var fits = card.offsetHeight <= window.innerHeight - 88;
    var t = fits || !inner ? card : inner;
    try { t.scrollIntoView({ behavior: behavior(), block: "center" }); } catch (e) { t.scrollIntoView(); }
  }

  /* Dialog helpers (native <dialog>, showModal, backdrop-click close). */
  function openDlg(d) {
    if (!d || d.open) return;
    try { d.showModal(); } catch (e) { d.setAttribute("open", ""); }
    safe("dock", pickDock);
  }
  function closeDlg(d) { if (d && d.open) { try { d.close(); } catch (e) { d.removeAttribute("open"); } } }

  /* Copy inside a modal dialog: same "Copied" feedback as the core's copyText, but the fallback
     textarea goes inside the open dialog, because the page behind a modal is inert. */
  function dlgCopy(text, btn, host) {
    if (btn._cp) return;
    function done() {
      var o = btn.textContent; btn._cp = 1; btn.textContent = "Copied";
      setTimeout(function () { btn.textContent = o; btn._cp = 0; }, 1500);
    }
    function fb() {
      var ta = document.createElement("textarea"), ok = false;
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
      host.appendChild(ta);
      try { ta.focus({ preventScroll: true }); } catch (e) {}
      ta.select();
      try { ok = document.execCommand("copy"); } catch (e) {}
      ta.remove();
      try { btn.focus({ preventScroll: true }); } catch (e) {}
      if (ok) done(); else SS.toast("Select and copy: " + text);
    }
    try { navigator.clipboard.writeText(text).then(done, fb); } catch (e) { fb(); }
  }

  /* ---------- 3. Saved shortlist: store (needed by the colour index) ---------- */
  var saved = [];
  safe("saved-load", function () {
    var a = JSON.parse(sget("ss_saved") || "[]");
    if (!Array.isArray(a)) return;
    a.forEach(function (id) {
      if (typeof id !== "string") return;
      var i = id.indexOf("|"), k = id.slice(0, i), c = id.slice(i + 1);
      if (i > 0 && P[k] && SS.swatch(k, c) && saved.indexOf(id) < 0) saved.push(id);
    });
  });
  function isSaved(k, c) { return saved.indexOf(k + "|" + c) >= 0; }
  function toggleSaved(k, c) {
    var id = k + "|" + c, i = saved.indexOf(id);
    if (i >= 0) saved.splice(i, 1); else saved.push(id);
    sset("ss_saved", JSON.stringify(saved));
    syncSaved();
    SS.toast(i >= 0 ? "Removed " + c + " from Saved" : "Saved " + c);
    return i < 0;
  }

  /* ---------- 1. Shop by colour index ---------- */
  var FAM = {
    blues: ["Navy & cream", "Navy & white", "Royal blue", "Aqua", "Navy stripe", "Blue stripe"],
    greens: ["Forest green & black", "Olive & cream", "Forest green stripe", "Olive stripe"],
    pinks: ["Blush pink & black", "Berry red & pink", "Blush pink stripe", "Berry stripe"],
    earth: ["Cocoa & cream", "Mustard & tan", "Mustard", "Rust", "Cocoa stripe", "Mustard stripe"],
    greys: ["Grey & black", "Black & beige", "Black", "Grey", "Grey stripe", "Black stripe"]
  };
  var FAMORDER = ["blues", "greens", "pinks", "earth", "greys"];
  var FAMNAME = { blues: "Blues", greens: "Greens", pinks: "Pinks & reds", earth: "Mustard & earth", greys: "Greys & blacks" };
  var KORDER = { zig: 0, sol: 1, chen: 2 };
  var tiles = [];
  /* Known colours by name; an owner-added colour by the hue of its swatch colour. */
  function famOf(n, bg) { for (var f in FAM) if (FAM[f].indexOf(n) >= 0) return f; return famByHex(bg); }
  function famByHex(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "")); if (!m) return "other";
    var v = parseInt(m[1], 16), r = (v >> 16) / 255, g = (v >> 8 & 255) / 255, b = (v & 255) / 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, s = d ? d / (1 - Math.abs(2 * l - 1)) : 0, h = 0;
    if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
    if (s < 0.18 || l < 0.12 || l > 0.94) return "greys";
    if (h >= 170 && h < 265) return "blues";
    if (h >= 65 && h < 170) return "greens";
    if (h >= 265 || h < 12) return "pinks";
    return "earth";
  }

  safe("index", function () {
    var grid = $("#cgrid"); if (!grid) return;
    var list = [];
    $$$(".prod").forEach(function (p) {
      var k = p.dataset.k;
      $$$("[data-n]", p).forEach(function (b, i) {
        var n = b.dataset.n, f = famOf(n, b.dataset.bg), fi = FAMORDER.indexOf(f);
        list.push({ k: k, n: n, i: b.hasAttribute("data-ci") ? +b.getAttribute("data-ci") : i, bg: b.dataset.bg, fam: f, ord: (fi < 0 ? 9 : fi) * 1000 + (KORDER[k] || 0) * 100 + i, img: $("img", b), st: stockOf(k, n) });
      });
    });
    list.sort(function (a, b) { return a.ord - b.ord; });
    grid.innerHTML = list.map(function (t) {
      var fp = inr(fromPrice(t.k));
      var ti = t.img ? '<img src="' + esc(t.img.getAttribute("src")) + '" alt="" width="200" height="200" decoding="async">'
                     : '<span class="cc" style="' + cropCss(t.i) + '"></span>';
      return '<div class="tile" data-fam="' + t.fam + '"' + (t.st !== "in" ? ' data-stock="' + t.st + '"' : "") + ' style="--c:' + esc(t.bg) + '">' +
        '<button type="button" class="tb" aria-label="' + esc(t.n + ", " + RN[t.k] + ", from " + fp + stkSuffix(t.st)) + '">' +
          '<span class="ti">' + ti + stkHTML(t.st) + '</span><span class="bar"></span>' +
          '<span class="tn">' + esc(t.n) + '</span><span class="tr">' + RS[t.k] + '<span class="fromp"> · from ' + fp + '</span></span>' +
        '</button>' +
        '<button type="button" class="heart tile-heart" aria-pressed="false" aria-label="' + esc("Save " + t.n + " " + P[t.k].name) + '">' + HEART + '</button>' +
      '</div>';
    }).join("");
    $$$(".tile", grid).forEach(function (el, j) {
      var t = list[j]; t.el = el; tiles.push(t);
      $(".tb", el).addEventListener("click", function () { goToColour(t.k, t.n); });
      $(".tile-heart", el).addEventListener("click", function () { toggleSaved(t.k, t.n); });
    });

    /* Family filter: radiogroup, FLIP, live region, remembered in ss_fam. */
    var fam = $("#fam"), live = $("#fam-live");
    if (!fam) return;
    /* Counts follow the colours on show; a family with none left is dropped. */
    $$$('[role="radio"]', fam).forEach(function (c) {
      var f = c.dataset.fam, n = f === "all" ? tiles.length : tiles.filter(function (t) { return t.fam === f; }).length, ns = $(".n", c);
      if (ns && ns.textContent !== String(n)) ns.textContent = n;
      if (!n && f !== "all") c.remove();
    });
    var chips = $$('[role="radio"]', fam);
    function apply(f, user) {
      var chip = chips.filter(function (c) { return c.dataset.fam === f; })[0];
      if (!chip) { f = "all"; chip = chips[0]; }
      var before = new Map(), anim = user && canAnim();
      if (anim) tiles.forEach(function (t) { if (!t.el.hidden) before.set(t.el, t.el.getBoundingClientRect()); });
      tiles.forEach(function (t) { t.el.hidden = !(f === "all" || t.fam === f); });
      SS.radio(fam, chip);
      if (anim) tiles.forEach(function (t) {
        if (t.el.hidden) return;
        var b = before.get(t.el);
        if (b) {
          var a = t.el.getBoundingClientRect(), dx = b.left - a.left, dy = b.top - a.top;
          if (dx || dy) t.el.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], { duration: 300, easing: E_OUT });
        } else t.el.animate([{ transform: "scale(.96)" }, { transform: "none" }], { duration: 240, easing: E_OUT });
      });
      if (user) {
        var n = tiles.filter(function (t) { return !t.el.hidden; }).length;
        if (live) live.textContent = f === "all" ? "Showing all " + n + " colours" : "Showing " + n + " colours: " + FAMNAME[f];
        sset("ss_fam", f);
      }
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { apply(c.dataset.fam, true); }); });
    SS.arrows(fam, function (c) { apply(c.dataset.fam, true); });
    apply(sget("ss_fam") || "all", false);
  });

  /* Tile click: bring the card into view, then pick the swatch (dye-bath, chenille camera). */
  function goToColour(k, n) {
    var card = cardOf(k), sw = SS.swatch(k, n);
    if (!card || !sw) return;
    reveal(card, $(".pic", card));
    afterScroll(function () {
      try { sw.focus({ preventScroll: true }); } catch (e) {}
      sw.click();
    });
  }

  /* ---------- 3. Saved: hearts, counts, dialog ---------- */
  var savedDlg = $("#saved");
  var savedSize = {};
  function syncHeroHeart() {
    var h = $("#h-save"); if (!h) return;
    var sl = SS.SLIDES[SS.getHi()];
    h.setAttribute("aria-pressed", isSaved(sl.k, sl.c) ? "true" : "false");
    h.setAttribute("aria-label", "Save " + sl.c + " " + P[sl.k].name);
  }
  function syncCardHeart(el, k) {
    var h = $("[data-save]", el); if (!h) return;
    var c = curColour(el);
    h.setAttribute("aria-pressed", isSaved(k, c) ? "true" : "false");
    h.setAttribute("aria-label", "Save " + c + " " + P[k].name);
  }
  function syncSaved() {
    var n = saved.length;
    [["#h-savedn", "#h-savedbtn"], ["#hsavedn", "#hsaved"]].forEach(function (p) {
      var b = $(p[0]), btn = $(p[1]);
      if (b) { b.textContent = n; b.hidden = !n; }
      if (btn) btn.setAttribute("aria-label", "Saved colours, " + n);
    });
    tiles.forEach(function (t) { var h = $(".tile-heart", t.el); if (h) h.setAttribute("aria-pressed", isSaved(t.k, t.n) ? "true" : "false"); });
    $$$(".prod").forEach(function (p) { syncCardHeart(p, p.dataset.k); });
    syncHeroHeart();
    if (savedDlg && savedDlg.open) renderSaved();
  }
  function savedItems() { return saved.map(function (id) { var i = id.indexOf("|"); return { id: id, k: id.slice(0, i), c: id.slice(i + 1) }; }); }
  function familyText(items) {
    return "Which one should we get? Soft Steps mats:\n" + items.map(function (x) { return "• " + P[x.k].name + " – " + x.c + " (from " + inr(fromPrice(x.k)) + ")"; }).join("\n") +
      "\nSee them here: https://claude.ai/artifact/CspLRioTiMjWF3nz8qj3WH\nInstagram @softsteps.home · WhatsApp +91 90994 41429";
  }
  function renderSaved() {
    var list = $("#saved-list"), empty = $("#saved-empty"), foot = $(".dlg-f", savedDlg);
    var items = savedItems();
    list.innerHTML = items.map(function (x) {
      var th = thumbOf(x.k, x.c), si = savedSize[x.id] || 0, z = P[x.k].sizes[si];
      var thumb = th.src ? '<img src="' + esc(th.src) + '" alt="" width="64" height="64">'
                         : '<span class="sthumb" aria-hidden="true" style="--c:' + esc(th.bg) + ";" + th.crop + '"></span>';
      return '<div class="srow">' + thumb +
        '<div class="smeta"><b>' + esc(P[x.k].name) + '</b><small>' + esc(x.c) + '</small><span class="sstk"></span></div>' +
        '<span class="sp">' + inr(z[3]) + '</span>' +
        '<div class="mini" role="radiogroup" aria-label="' + esc("Size for " + x.c) + '">' +
          P[x.k].sizes.map(function (s, j) { var o = sizeOut(x.k, j); return '<button type="button" class="msz" role="radio" aria-checked="' + (j === si) + '" tabindex="' + (j === si ? 0 : -1) + '"' + (o ? ' data-stock="out"' : "") + ' aria-label="' + esc(s[0] + ", " + s[1] + (o ? ", out of stock" : "")) + '">' + s[0] + '</button>'; }).join("") +
        '</div>' +
        '<div class="sacts"><button type="button" class="pill sm" data-sadd aria-label="' + esc("Add to cart: " + x.c + " " + P[x.k].name + ", " + z[0]) + '">Add to cart</button>' +
        '<button type="button" class="link" data-srm aria-label="' + esc("Remove " + x.c + " " + P[x.k].name + " from Saved") + '">Remove</button></div>' +
      '</div>';
    }).join("");
    if (empty) empty.hidden = items.length > 0;
    if (foot) foot.hidden = !items.length;
    $$$(".srow", list).forEach(function (row, j) {
      var x = items[j], mini = $(".mini", row), bs = $$(".msz", mini);
      /* A colour or size that cannot be bought says so, and its Add button is off (the footer still asks Jelam). */
      function mark(si) {
        var st = stockOf(x.k, x.c, si), add = $("[data-sadd]", row), z = P[x.k].sizes[si], tag = $(".sstk", row);
        if (tag) tag.innerHTML = stkHTML(st);
        if (add._t) return;
        add.disabled = st === "out";
        var t = st === "out" ? "Out of stock" : "Add to cart"; if (add.textContent !== t) add.textContent = t;
        add.setAttribute("aria-label", st === "out" ? x.c + " " + P[x.k].name + ", " + z[0] + ", out of stock" : "Add to cart: " + x.c + " " + P[x.k].name + ", " + z[0]);
      }
      function pick(b) {
        var si = bs.indexOf(b); savedSize[x.id] = si; SS.radio(mini, b);
        var z = P[x.k].sizes[si];
        $(".sp", row).textContent = inr(z[3]);
        mark(si);
      }
      mark(savedSize[x.id] || 0);
      bs.forEach(function (b) { b.addEventListener("click", function () { pick(b); }); });
      SS.arrows(mini, pick);
      var add = $("[data-sadd]", row);
      add.addEventListener("click", function () {
        if (add._t) return;
        if (SS.addToCart(x.k, savedSize[x.id] || 0, x.c, 1) === false) { mark(savedSize[x.id] || 0); return; }
        add.textContent = "Added ✓"; add._t = setTimeout(function () { add.textContent = "Add to cart"; add._t = 0; mark(savedSize[x.id] || 0); }, 1500);
      });
      $("[data-srm]", row).addEventListener("click", function () {
        var i = saved.indexOf(x.id); if (i < 0) return;
        saved.splice(i, 1); sset("ss_saved", JSON.stringify(saved));
        syncSaved(); /* re-renders the open list */
        focusSavedRow(j);
      });
    });
    var ask = $("#saved-ask"), fam = $("#saved-family");
    if (ask) ask.href = "https://wa.me/" + PH + "?text=" + encodeURIComponent("Hi Jelam, are these in stock?\n" + items.map(function (x) { return "• " + P[x.k].name + " – " + x.c; }).join("\n"));
    if (fam) fam.href = "https://wa.me/?text=" + encodeURIComponent(familyText(items));
  }
  function focusSavedRow(j) {
    var rows = $$("#saved-list .srow"), r = rows[Math.min(j, rows.length - 1)];
    var f = r ? $("[data-srm]", r) : $("[data-close]", savedDlg);
    try { f.focus(); } catch (e) {}
  }
  safe("saved", function () {
    $$$("[data-save]").forEach(function (h) {
      h.addEventListener("click", function () { var p = h.closest(".prod"); if (p) toggleSaved(p.dataset.k, curColour(p)); });
    });
    var hs = $("#h-save");
    if (hs) hs.addEventListener("click", function () { var sl = SS.SLIDES[SS.getHi()]; toggleSaved(sl.k, sl.c); });
    if (!savedDlg) return;
    [$("#h-savedbtn"), $("#hsaved")].forEach(function (b) {
      if (b) b.addEventListener("click", function () { renderSaved(); openDlg(savedDlg); });
    });
    var cp = $("#saved-copy");
    if (cp) cp.addEventListener("click", function () { dlgCopy(familyText(savedItems()), cp, savedDlg); });
  });

  /* ---------- 4. Ask about this exact mat ---------- */
  function syncAsk(el, k) {
    var a = $("a[data-ask]", el); if (!a) return;
    var cp = $("[data-askcopy]", el), c = curColour(el), z = P[k].sizes[SS.SIZEIDX[curSize(el)] || 0], label = c;
    if (k === "chen") { var b = SS.swatch(k, c); if (b) label = b.getAttribute("data-label") || b.textContent.trim() || c; }
    var msg = "Hi Jelam, is the " + P[k].name + " in " + c + ", size " + z[0] + " (" + z[1] + "), in stock?";
    a.textContent = "Ask if " + label + " (" + z[0] + ") is in stock";
    a.href = "https://wa.me/" + PH + "?text=" + encodeURIComponent(msg);
    if (cp) { cp.dataset.copy = msg; cp.setAttribute("aria-label", "Copy the question about " + label + " (" + z[0] + ")"); }
  }

  /* ---------- 2. Sticky header ---------- */
  var heroVisible = true;
  safe("header", function () {
    var hdr = $("#hdr"), hero = $("#hero"); if (!hdr || !hero) return;
    function set(show) {
      heroVisible = !show;
      hdr.classList.toggle("on", show);
      if (show) hdr.removeAttribute("aria-hidden"); else hdr.setAttribute("aria-hidden", "true");
      /* hidden header content must not take focus during its fade */
      hdr.inert = !show || drawerOpen;
    }
    var io = makeIO(function (es) { es.forEach(function (e) { set(!e.isIntersecting); }); }, { rootMargin: "-64px 0px 0px 0px", threshold: 0 });
    if (io) io.observe(hero);
    var hc = $("#hcart"); if (hc) hc.addEventListener("click", function () { SS.openD("cart"); });
  });
  function onRendered(n) {
    var b = $("#hcnt"), hc = $("#hcart");
    if (b) { b.textContent = n; b.hidden = !n; }
    if (hc) hc.setAttribute("aria-label", "Open cart, " + n + (n === 1 ? " item" : " items"));
  }

  /* ---------- 2. Contextual buy dock (phone) ---------- */
  var dock = $("#dock"), dockCard = null, cardVis = new Map(), addVis = new Map();
  function dockBlocked() {
    var dr = $("#drawer");
    return !PHONE.matches || (dr && !dr.hidden) || !!document.querySelector("dialog[open]");
  }
  function fillDock(p) {
    var k = p.dataset.k, c = curColour(p), l = curSize(p), pr = $("[data-price]", p), th = thumbOf(k, c), im = $("#dock-img");
    var ok = stockOf(k, c, SS.SIZEIDX[l]) !== "out", da = $("#dock-add"), dt = ok ? "Add" : "Ask";
    $("#dock-t").textContent = c + " · " + l;
    $("#dock-p").textContent = ok ? (pr ? pr.textContent : "") : "Out of stock";
    if (da.textContent !== dt) da.textContent = dt;
    if (ok) da.setAttribute("aria-label", "Add " + c + ", size " + l + ", to cart");
    else { var b = SS.swatch(k, c); da.setAttribute("aria-label", "Ask if " + (k === "chen" && b ? b.getAttribute("data-label") || c : c) + " (" + l + ") is in stock"); }
    if (im) {
      if (th.src) { im.style.cssText = ""; if (im.getAttribute("src") !== th.src) im.src = th.src; }
      else { im.src = BLANK; im.style.cssText = "background-color:" + th.bg + ";" + th.crop; }
    }
  }
  function pickDock() {
    if (!dock) return;
    var best = null, bd = 1e9;
    if (!dockBlocked()) $$$(".prod").forEach(function (p) {
      if (cardVis.get(p) && addVis.get(p) === false) {
        var r = p.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - window.innerHeight / 2);
        if (d < bd) { bd = d; best = p; }
      }
    });
    dockCard = best;
    if (best) fillDock(best);
    dock.classList.toggle("on", !!best);
    dock.setAttribute("aria-hidden", best ? "false" : "true");
    dock.inert = !best || drawerOpen;
    document.body.classList.toggle("docked", !!best);
  }
  safe("dock", function () {
    if (!dock) return;
    var ioC = makeIO(function (es) { es.forEach(function (e) { cardVis.set(e.target, e.isIntersecting && e.intersectionRatio >= 0.299); }); pickDock(); }, { threshold: [0, 0.3] });
    var ioA = makeIO(function (es) { es.forEach(function (e) { addVis.set(e.target.closest(".prod"), e.isIntersecting); }); pickDock(); }, { threshold: 0, rootMargin: "-56px 0px -84px 0px" });
    if (!ioC || !ioA) return;
    $$$(".prod").forEach(function (p) { ioC.observe(p); var a = $("[data-add]", p); if (a) ioA.observe(a); });
    $("#dock-add").addEventListener("click", function () { var a = dockCard && $("[data-add]", dockCard); if (a) a.click(); });
    onMq(PHONE, pickDock);
  });

  /* ---------- 5. PIN delivery check ---------- */
  function pinMsg(pin) {
    if (/^390\d{3}$/.test(pin)) return "Vadodara: free delivery. We confirm on WhatsApp.";
    if (/^391\d{3}$/.test(pin)) return "Vadodara district: we'll confirm delivery charges on WhatsApp.";
    if (/^[1-9]\d{5}$/.test(pin)) return "Delivery across India: charges extra, confirmed on call. We confirm on WhatsApp.";
    return "Enter a 6-digit PIN code.";
  }
  safe("pin", function () {
    var f = $("#pinf"), inp = $("#pin-in"), out = $("#pin-out");
    if (f && inp && out) {
      var st = sget("ss_pin"); if (st && /^[1-9]\d{5}$/.test(st)) inp.value = st;
      inp.addEventListener("input", function () { var v = inp.value.replace(/\D/g, "").slice(0, 6); if (v !== inp.value) inp.value = v; });
      /* A pasted "390 007" would be cut by maxlength before the input event, so clean it first. */
      inp.addEventListener("paste", function (e) {
        var t = ""; try { t = (e.clipboardData || window.clipboardData).getData("text"); } catch (x) { return; }
        e.preventDefault();
        var s = inp.selectionStart || 0, en = inp.selectionEnd || 0;
        inp.value = (inp.value.slice(0, s) + t + inp.value.slice(en)).replace(/\D/g, "").slice(0, 6);
      });
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var v = inp.value.trim();
        out.textContent = pinMsg(v);
        if (/^[1-9]\d{5}$/.test(v)) sset("ss_pin", v);
      });
    }
    var op = $("#o-pin"), note = $("#pinnote");
    if (!op || !note) return;
    function sync() {
      var v = op.value.trim();
      if (!/^\d{6}$/.test(v)) { note.textContent = ""; return; }
      note.textContent = pinMsg(v);
      if (/^[1-9]\d{5}$/.test(v)) sset("ss_pin", v);
      var r = /^390\d{3}$/.test(v) ? "vad" : /^[1-9]\d{5}$/.test(v) ? "out" : null;
      if (!r) return;
      var radio = $('input[name="dl"][value="' + r + '"]'); if (!radio) return;
      radio.checked = true;
      radio.dispatchEvent(new Event("change"));
    }
    op.addEventListener("input", sync);
    var go = $("#go");
    if (go) go.addEventListener("click", function () {
      if (!op.value.trim()) { var s = sget("ss_pin"); if (s && /^[1-9]\d{5}$/.test(s)) op.value = s; }
      sync();
    });
  });

  /* ---------- 6. Compare sizes dialog ---------- */
  safe("compare", function () {
    var dlg = $("#compare"), tb = $("#cmp-table"); if (!dlg || !tb) return;
    var ks = ["zig", "sol", "chen"].filter(function (k) { var c = cardOf(k); return P[k] && !(c && c.hidden); });
    var head = P[ks[0]].sizes, SHORT = { zig: "Zigzag", sol: "Solid Premium", chen: "Chenille" };
    /* One row per size and one column per range, so all three prices fit across a phone. */
    tb.innerHTML = '<caption class="sr-only">Price and weight of every range in each size</caption>' +
      '<thead><tr><th scope="col"><span class="sr-only">Size</span></th>' +
      ks.map(function (k) { return '<th scope="col">' + esc(SHORT[k] || P[k].name) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      head.map(function (h, i) {
        return '<tr><th scope="row"><b>' + esc(h[0]) + "</b><small>" + esc(h[1]) + "</small></th>" + ks.map(function (k) {
          var z = P[k].sizes[i], o = sizeOut(k, i);
          return '<td><button type="button" class="cmpc" data-k="' + k + '" data-l="' + z[0] + '"' + (o ? ' data-stock="out"' : "") + ' aria-label="' + esc("Choose " + P[k].name + " size " + z[0] + ", " + inr(z[3]) + (o ? ", out of stock" : "")) + '"><b>' + inr(z[3]) + "</b>" + (o ? stkHTML("out") : "<small>" + esc(z[2] || "") + "</small>") + "</button></td>";
        }).join("") + "</tr>";
      }).join("") + "</tbody>";
    tb.addEventListener("click", function (e) {
      var b = e.target.closest(".cmpc"); if (!b) return;
      var k = b.dataset.k, l = b.dataset.l, card = cardOf(k);
      if (SS.pickers[k]) SS.pickers[k](l);
      closeDlg(dlg);
      if (!card) return;
      reveal(card, $(".sizes-c", card));
      var s = $('.sizes-c [aria-checked="true"]', card);
      try { s.focus({ preventScroll: true }); } catch (x) {}
    });
    var openers = $$("[data-compare]"); var hc = $("#h-compare"); if (hc) openers.push(hc);
    openers.forEach(function (b) { b.addEventListener("click", function () { openDlg(dlg); }); });
  });

  /* ---------- 7. Fit tool upgrade ---------- */
  var FS = { M: [24, 16], H: [24, 16], L: [32, 20], XL: [60, 24] };
  var SUG = {
    main: { t: "Suggested: Multicolour Zigzag L (20×32 in), 2 in to spare each side.", k: "zig", l: "L" },
    bath: { t: "Suggested: Solid Premium M or H (16×24 in), plush and absorbent for the bathroom door.", k: "sol", l: "M" },
    bed: { t: "Suggested: a 24×60 in XL runner along the side of the bed.", k: "zig", l: "XL" },
    kitchen: { t: "Suggested: a 24×60 in XL runner along the counter.", k: "sol", l: "XL" }
  };
  var FN = { zig: "Zigzag", sol: "Solid Premium", chen: "Chenille" };
  var lastPick = null, patTok = 0, NH = {}, fitState = { spot: "main", size: "M" };
  function setLastPick(k, c) {
    if (!P[k] || !c || (lastPick && lastPick.k === k && lastPick.c === c)) return;
    lastPick = { k: k, c: c };
    var cap = $("#fitcap");
    if (cap) cap.textContent = "Adult feet, 10 in long, for scale. Mat shown in " + RN[k] + " · " + c + ".";
    if (fitNear) paintPat(k, c);
    syncFitAdd();
  }
  /* The doorway diagram's rug image loads only once the fit tool is near, at the size this screen uses. */
  var fitNear = false;
  try {
    new IntersectionObserver(function (es, o) {
      if (!es[es.length - 1].isIntersecting) return;
      o.disconnect(); fitNear = true; if (lastPick) paintPat(lastPick.k, lastPick.c);
    }, { rootMargin: "800px 0px" }).observe($("#fit"));
  } catch (e) { fitNear = true; }
  function imgPath(p) { return window.SSIMG ? SSIMG.map(p) : p; }
  function paintPat(k, c) {
    var pat = $("#rugpat"), im = $("#rugimg");
    if (!pat || !im) return;
    var tok = ++patTok;
    if (k === "chen") {
      var r = RECTS[chenIdx(c)] || RECTS[0];
      pat.setAttribute("viewBox", r.join(" "));
      im.setAttribute("width", 1200); im.setAttribute("height", 1801); im.setAttribute("href", imgPath("img/chen.jpg"));
      return;
    }
    var b = SS.swatch(k, c), src = b && b.dataset.full && imgPath(b.dataset.full); if (!src) return;
    function apply(h) {
      if (tok !== patTok) return;
      pat.setAttribute("viewBox", "0 0 1600 " + h);
      im.setAttribute("width", 1600); im.setAttribute("height", h); im.setAttribute("href", src);
    }
    if (NH[src]) return apply(NH[src]);
    var t = new Image();
    t.onload = function () { NH[src] = Math.round(t.naturalHeight * 1600 / (t.naturalWidth || 1600)); apply(NH[src]); };
    t.src = src;
  }
  /* The colour the fit tool adds: the one drawn when it is the suggested range, else that range's card colour. */
  function fitColour(k) { return lastPick && lastPick.k === k ? lastPick.c : curColour(cardOf(k)); }
  function syncFitAdd() {
    var s = SUG[fitState.spot], btn = $("#fit-add"), sg = $("#fit-sugg"); if (!s || !btn) return;
    var z = P[s.k].sizes[SS.SIZEIDX[s.l]], c = fitColour(s.k), ok = stockOf(s.k, c, SS.SIZEIDX[s.l]) !== "out";
    if (sg) sg.textContent = s.t;
    btn.classList.toggle("oos", !ok);
    btn.innerHTML = esc(ok ? "Add " + FN[s.k] + " " + s.l + " · " + c.split(" & ")[0] + " · " + inr(z[3]) : "Out of stock · Ask on WhatsApp") + ' <span class="chev" aria-hidden="true">›</span>';
    btn.setAttribute("aria-label", ok ? "Add " + FN[s.k] + " " + s.l + " in " + c + ", " + inr(z[3]) : "Ask if " + c + " (" + s.l + ") is in stock");
    btn.dataset.k = s.k; btn.dataset.c = c;   /* for the photo try-on, whatever language the label is in */
  }
  function onFit(fit, sp, d) {
    if (fit && fit.spot !== fitState.spot) { var ns = SUG[fit.spot]; if (ns && (!lastPick || lastPick.k !== ns.k)) setLastPick(ns.k, curColour(cardOf(ns.k))); }
    if (fit) fitState = { spot: fit.spot, size: fit.size };
    sp = sp || {}; d = d || FS[fitState.size] || FS.M;
    var door = sp.kind === "door", W = 84, sill = $("#sill"), ch = $("#chappals");
    if (sill) {
      if (door) { sill.removeAttribute("hidden"); sill.setAttribute("x", (W - sp.w) / 2); sill.setAttribute("width", sp.w); }
      else sill.setAttribute("hidden", "");
    }
    if (ch) {
      if (door) { ch.removeAttribute("hidden"); ch.setAttribute("transform", "translate(" + Math.min(W / 2 + d[0] / 2 + 4, 75.4) + " 12)"); }
      else ch.setAttribute("hidden", "");
    }
    syncFitAdd();
  }
  safe("fit", function () {
    var fl = $("#floors"), floor = $("#floor"), FB = { marble: "#ECE9E3", kota: "#7D8A78", wood: "#A0714B", tile: "#A7ABAE", oxide: "#8E3B2E" };
    if (fl && floor) {
      var pickFloor = function (b) { SS.radio(fl, b); var f = b.dataset.floor; floor.style.fill = "url(#fl-" + f + ") " + (FB[f] || "#ECE9E3"); };
      $$$('[role="radio"]', fl).forEach(function (b) { b.addEventListener("click", function () { pickFloor(b); }); });
      SS.arrows(fl, pickFloor);
    }
    /* Compare all sizes: dashed outlines for M, L, XL and the H arc, labelled in SVG text. */
    var cmp = $("#cmpall"), g = $("#cmpg");
    if (cmp && g) {
      var y = 8, s = "";
      ["XL", "L", "M"].forEach(function (l) { var d = FS[l]; s += '<rect class="cmpo" x="' + (84 - d[0]) / 2 + '" y="' + y + '" width="' + d[0] + '" height="' + d[1] + '" rx=".6"/>'; });
      s += '<path class="cmpo" d="M30 8h24a12 16 0 0 1 -24 0z"/>';
      s += '<text class="cmpt" x="42" y="31.1" text-anchor="middle">XL</text><text class="cmpt" x="42" y="27.1" text-anchor="middle">L</text>' +
           '<text class="cmpt" x="30.9" y="23.1">M</text><text class="cmpt" x="49.6" y="14.4">H</text>';
      g.innerHTML = s;
      cmp.addEventListener("click", function () {
        var p = cmp.getAttribute("aria-pressed") !== "true";
        cmp.setAttribute("aria-pressed", p ? "true" : "false");
        if (p) g.removeAttribute("hidden"); else g.setAttribute("hidden", "");
      });
    }
    var add = $("#fit-add");
    if (add) add.addEventListener("click", function () {
      var sg = SUG[fitState.spot]; if (!sg) return;
      var c = fitColour(sg.k), sw = SS.swatch(sg.k, c);
      if (stockOf(sg.k, c, SS.SIZEIDX[sg.l]) === "out" && SS.openAsk) { SS.openAsk(sg.k, c, SS.SIZEIDX[sg.l]); return; }
      if (SS.addToCart(sg.k, SS.SIZEIDX[sg.l], c, 1) === false) return;
      var m = $("#matR"); if (!m || m.hasAttribute("hidden")) m = $("#matH");
      try { if (window.SSFX && typeof SSFX.fly === "function") SSFX.fly(m || add, sg.k, sw); } catch (e) {}
    });
  });

  /* ---------- 8. Gift note (CSS :has reveals it; this covers browsers without :has) ---------- */
  safe("gift", function () {
    var cb = $("#o-gift-on"), box = $(".gift .gmsg");
    if (!cb || !box) return;
    var hasOK = false; try { hasOK = CSS.supports("selector(:has(*))"); } catch (e) {}
    if (hasOK) return;
    var sync = function () { box.hidden = !cb.checked; };
    cb.addEventListener("change", sync); sync();
  });

  /* ---------- Dialogs: backdrop close, close buttons, copy, dock ---------- */
  safe("dialogs", function () {
    function outside(d, e) { var r = d.getBoundingClientRect(); return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom; }
    $$$("dialog").forEach(function (d) {
      var down = false;
      d.addEventListener("pointerdown", function (e) { down = e.target === d && outside(d, e); });
      d.addEventListener("click", function (e) {
        if (e.target === d && down && outside(d, e)) { down = false; closeDlg(d); return; }
        down = false;
        var x = e.target.closest("[data-close]"); if (x && d.contains(x)) { closeDlg(d); return; }
        var c = e.target.closest("[data-copy]");
        if (c && d.contains(c)) { e.stopPropagation(); dlgCopy(c.dataset.copy, c, d); }
      });
      d.addEventListener("close", function () { safe("dock", pickDock); });
    });
  });

  /* ---------- Menu sheet ---------- */
  safe("menu", function () {
    var menu = $("#menu"); if (!menu) return;
    [$("#h-menu"), $("#hmenu")].forEach(function (b) { if (b) b.addEventListener("click", function () { openDlg(menu); }); });
    menu.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a || !menu.contains(a)) return;
      var t = document.getElementById(a.getAttribute("href").slice(1)); if (!t) return;
      e.preventDefault();
      closeDlg(menu);
      try { t.scrollIntoView({ behavior: behavior(), block: "start" }); } catch (x) { t.scrollIntoView(); }
      var h = t.matches("h1,h2") ? t : $("h1, h2", t);
      if (h) { if (!h.hasAttribute("tabindex")) { h.setAttribute("tabindex", "-1"); h.style.outline = "none"; } try { h.focus({ preventScroll: true }); } catch (x) {} }
    });
  });

  /* ---------- Drawer hook: page inert, dock hidden, Tab trapped ---------- */
  var drawerOpen = false;
  function onDrawer(open) {
    drawerOpen = !!open;
    [$(".page"), $("#hdr"), $(".skip")].forEach(function (n) {
      if (!n) return;
      if (drawerOpen) { n.setAttribute("inert", ""); n.classList.add("inert"); }
      else { n.removeAttribute("inert"); n.classList.remove("inert"); }
    });
    safe("dock", pickDock);
  }
  safe("drawer", function () {
    var dr = $("#drawer"); if (!dr) return;
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !drawerOpen || dr.hidden) return;
      var f = $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', dr)
        .filter(function (n) { return n.getClientRects().length && !n.closest("[hidden]"); });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1], a = document.activeElement;
      if (e.shiftKey && (a === first || !dr.contains(a))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (a === last || !dr.contains(a))) { e.preventDefault(); first.focus(); }
    });
  });

  /* ---------- Hooks (registered only through SSFX_on) ---------- */
  function syncCard(el, k) {
    safe("ask", function () { syncAsk(el, k); });
    safe("saved", function () { syncCardHeart(el, k); });
    if (el === dockCard) safe("dock", function () { fillDock(el); });
  }
  on("rendered", function (n) { safe("header", function () { onRendered(n); }); });
  on("updated", function (el, k) { syncCard(el, k); });
  on("picked", function (el, k, b, ready) {
    syncCard(el, k);
    safe("fit", function () { if (ready && b) setLastPick(k, b.dataset.n); syncFitAdd(); });
  });
  on("title", function (sl) {
    safe("saved", syncHeroHeart);
    /* Autoplay keeps running while the hero is off-screen; only a slide change the visitor can see moves the fit mat. */
    safe("fit", function () { if (heroVisible && sl) setLastPick(sl.k, sl.c); });
  });
  on("fit", function (fit, sp, d) { safe("fit", function () { onFit(fit, sp, d); }); });
  on("drawer", function (open) { safe("drawer", function () { onDrawer(open); }); });

  /* ---------- Fallback when the hook pipe is broken (e.g. window.SSFX = null): drive the same
     syncs from the DOM so header counts, ask links, hearts, dock and fit text never go stale. ---------- */
  safe("fallback", function () {
    if (window.SSFX && typeof window.SSFX.rendered === "function") return;
    var cnt = $("#cnt");
    if (cnt && "MutationObserver" in window) new MutationObserver(function () { onRendered(parseInt(cnt.textContent, 10) || 0); })
      .observe(cnt, { childList: true, characterData: true, subtree: true });
    function later(f) { setTimeout(function () { safe("fallback", f); }, 0); }
    function resync(e) {
      var p = e.target.closest && e.target.closest(".prod");
      if (p) later(function () { syncCard(p, p.dataset.k); });
      if (e.target.closest && e.target.closest("#spots, #fsizes")) later(function () {
        var s = $('#spots [aria-checked="true"]'), z = $('#fsizes [aria-checked="true"]'), W = { main: 36, bath: 30, bed: 75, kitchen: 72 };
        if (!s || !z) return;
        onFit({ spot: s.dataset.spot, size: z.dataset.fs }, { kind: s.dataset.spot === "main" || s.dataset.spot === "bath" ? "door" : "block", w: W[s.dataset.spot] }, FS[z.dataset.fs]);
      });
    }
    document.addEventListener("click", resync);
    document.addEventListener("keyup", resync);
  });

  /* ---------- Initial sync: the core ran its hooks before this module loaded ---------- */
  safe("sync", function () {
    onRendered(parseInt(($("#cnt") || {}).textContent, 10) || 0);
    if ($("#v-cart .line")) SS.render();
    syncSaved();
    $$$(".prod").forEach(function (p) { syncCard(p, p.dataset.k); });
    var sl = SS.SLIDES[SS.getHi()]; if (sl) setLastPick(sl.k, sl.c);
    var sp = $('#spots [aria-checked="true"]'); if (sp) sp.click(); else onFit(null, { kind: "door", w: 36 }, FS.M);
    var dr = $("#drawer"); if (dr && !dr.hidden) onDrawer(true);
  });
})();
