/* Soft Steps — shopper tools.
   Share a rug on WhatsApp, and a full-screen rug viewer (tap a rug: zoom, pan, flip through colours).
   Uses window.SS from the core; each part is isolated so a failure never touches the shop. */
(function () {
  var doc = document, SS = window.SS;
  if (!SS) return;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function mq(q) { try { return window.matchMedia(q); } catch (e) { return { matches: false }; } }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function safe(f) { try { f(); } catch (e) {} }
  var RM = mq("(prefers-reduced-motion: reduce)");
  var SHARE_URL = "https://claude.ai/artifact/CspLRioTiMjWF3nz8qj3WH";
  var P = SS.P, esc = SS.esc, inr = SS.inr;
  var SEND = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 10 14"/><path d="M21 3 14.5 21l-4.5-7-7-4.5Z"/></svg>';
  var EXPAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>';
  var DOOR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M7 15.5V3.5h10v12"/><path d="M14 9.5h.01"/><path d="M5 20.5 7.5 17h9l2.5 3.5Z"/></svg>';

  function curColour(el) { var c = $("[data-colour]", el); return c ? c.textContent : ""; }
  function curSizeIdx(el) { var b = $('.sizes-c [aria-checked="true"]', el), bs = $$('.sizes-c [role="radio"]', el); return Math.max(0, bs.indexOf(b)); }
  function fullPath(p) { return String(p || "").replace(/^img\/m\/([a-z0-9_]+)\.(avif|webp)$/, function (m, n) { return "img/" + n + (n === "chen" || n === "s2_close" ? ".jpg" : ".webp"); }); }

  try {
    var css = doc.createElement("style");
    css.textContent =
      ".trow .acts{display:flex;gap:2px;margin:-6px -8px 0 0}.trow .acts .heart{margin:0}" +
      ".share svg{fill:none!important}" +
      ".pic .plane img,#h-rug img{cursor:zoom-in}" +
      "#zoom{position:fixed;inset:0;width:100%;max-width:none;height:100%;max-height:none;margin:0;padding:0;border:0;background:#141B36;color:#FBF7F0;overflow:hidden}" +
      "#zoom::backdrop{background:#141B36}#zoom{--focus:#E3A62F}" +
      "#zoom .zh{position:absolute;inset:0 0 auto;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:max(12px,env(safe-area-inset-top)) 16px 12px;background:linear-gradient(#141B36,rgba(20,27,54,0))}" +
      "#zoom .zh b{display:block;font:420 20px/1.2 var(--display);font-variation-settings:var(--fvs)}#zoom .zh small{opacity:.75;font-size:14px}" +
      "#zoom .x{background:rgba(251,247,240,.14);color:#FBF7F0}" +
      "#zoom .zstage{position:absolute;inset:0;display:grid;place-items:center;touch-action:none;user-select:none;-webkit-user-select:none}" +
      "#zoom .zstage img{max-width:92vw;max-height:66vh;width:auto;height:auto;transform-origin:0 0;will-change:transform;filter:drop-shadow(0 18px 30px rgba(0,0,0,.45));-webkit-user-drag:none}" +
      "#zoom .zf{position:absolute;inset:auto 0 0;z-index:2;display:grid;gap:12px;padding:12px 16px max(16px,env(safe-area-inset-bottom));background:linear-gradient(rgba(20,27,54,0),#141B36 40%)}" +
      "#zoom .zrow{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:4px 2px}#zoom .zrow::-webkit-scrollbar{display:none}" +
      "#zoom .zsw{flex:none;width:48px;height:48px;padding:0;border:0;border-radius:50%;overflow:hidden;background:var(--c);box-shadow:inset 0 0 0 2px rgba(251,247,240,.25)}" +
      "#zoom .zsw img{width:100%;height:100%;object-fit:cover;display:block}" +
      "#zoom .zsw[aria-current=true]{box-shadow:0 0 0 3px #E3A62F}" +
      "#zoom .zhint{margin:0;font-size:14px;opacity:.7;text-align:center}" +
      "#zoom .zgo{justify-self:stretch;background:#FBF7F0;color:#141B36}" +
      /* Zoom buttons beside the hint; the try-on hand-off sits beside "Choose this colour" (wraps on phones). */
      "#zoom .zctl{display:flex;align-items:center;gap:12px}#zoom .zctl .zhint{flex:1;min-width:0;text-align:left}" +
      "#zoom .zb{display:grid;place-items:center;flex:none;width:44px;height:44px;padding:0;border:0;border-radius:50%;background:rgba(251,247,240,.14);color:#FBF7F0;font:500 24px/1 var(--text)}" +
      "#zoom .zb[aria-disabled=true]{opacity:.4;cursor:default}" +
      "#zoom .zacts{display:flex;flex-wrap:wrap;gap:10px 12px}#zoom .zacts>.pill{flex:1 1 230px;width:auto}" +
      "#zoom .ztry{gap:10px;padding:0 20px;background:transparent;color:#FBF7F0;box-shadow:inset 0 0 0 1.5px rgba(251,247,240,.55)}#zoom .ztry:hover{background:rgba(251,247,240,.08)}" +
      "#zoom .ztry svg{width:20px;height:20px;flex:none}" +
      /* Keyboard and switch access to the viewer: a small expand button in the rug panel's corner. */
      ".zopen{position:absolute;top:12px;right:12px;z-index:3}.zopen svg{width:18px;height:18px}" +
      ".zopen:not(:hover):not(:focus-visible){opacity:.8}" +
      "#hero .rugwrap .zopen{top:0;left:0;right:auto}";
    doc.head.appendChild(css);
  } catch (e) {}

  /* ---------- Share a rug on WhatsApp ---------- */
  function shareText(k, el) {
    var z = P[k].sizes[curSizeIdx(el)], c = curColour(el);
    return "Look at this rug from Soft Steps, Vadodara:\n" + P[k].name + (c ? " – " + c : "") +
      "\nSize " + z[0] + " (" + z[1] + ") · " + inr(z[3]) + "\n" + SHARE_URL;
  }
  safe(function () {
    $$(".prod").forEach(function (el) {
      var k = el.dataset.k, row = $(".trow", el), heart = row && $("[data-save]", row);
      if (!P[k] || !row || !heart) return;
      var a = doc.createElement("a");
      a.className = "heart share"; a.target = "_blank"; a.rel = "noopener"; a.href = "https://wa.me/?text=";
      a.setAttribute("aria-label", "Share this " + P[k].name + " on WhatsApp"); a.innerHTML = SEND;
      /* The link is rebuilt at tap time so it always names the colour and size on show. */
      function upd() { a.href = "https://wa.me/?text=" + encodeURIComponent(shareText(k, el)); }
      ["pointerdown", "focus", "click"].forEach(function (t) { a.addEventListener(t, upd); });
      var box = doc.createElement("div"); box.className = "acts";
      row.insertBefore(box, heart); box.appendChild(a); box.appendChild(heart);
    });
  });

  /* ---------- Full-screen rug viewer ---------- */
  safe(function () {
    if (typeof HTMLDialogElement !== "function") return;
    var dlg = doc.createElement("dialog");
    dlg.id = "zoom"; dlg.setAttribute("aria-labelledby", "zoom-t");
    dlg.innerHTML =
      '<div class="zh"><div><b id="zoom-t"></b><small id="zoom-c"></small></div><button type="button" class="x" data-zclose aria-label="Close">✕</button></div>' +
      '<div class="zstage"><img id="zoom-img" alt="" draggable="false"></div>' +
      '<div class="zf"><div class="zctl"><p class="zhint" id="zoom-hint">Double-tap or pinch to zoom · swipe for the next colour</p>' +
      '<button type="button" class="zb" id="zoom-out" aria-label="Zoom out">−</button><button type="button" class="zb" id="zoom-in" aria-label="Zoom in">+</button></div>' +
      '<div class="zrow" id="zoom-row" role="group" aria-label="Colours"></div>' +
      '<div class="zacts"><button type="button" class="pill ztry" id="zoom-try" aria-haspopup="dialog" hidden>' + DOOR + 'See it at your door</button>' +
      '<button type="button" class="pill full zgo" id="zoom-go">Choose this colour</button></div></div>';
    doc.body.appendChild(dlg);
    var img = $("#zoom-img"), stage = $(".zstage", dlg), row = $("#zoom-row"), go = $("#zoom-go"), zin = $("#zoom-in"), zout = $("#zoom-out"), tryb = $("#zoom-try");
    var st = { k: null, list: [], i: 0, s: 1, x: 0, y: 0, src: null }, opener = null;
    if (!mq("(hover: none), (pointer: coarse)").matches) $("#zoom-hint").textContent = "Click or press + to zoom · arrow keys for the next colour";

    function apply(anim) {
      img.style.transition = anim && !RM.matches ? "transform .28s cubic-bezier(.22,.8,.2,1)" : "none";
      img.style.transform = "translate(" + st.x + "px," + st.y + "px) scale(" + st.s + ")";
      /* aria-disabled rather than disabled, so a focused button keeps focus at the limit */
      zin.setAttribute("aria-disabled", st.s >= 3.99 ? "true" : "false");
      zout.setAttribute("aria-disabled", st.s <= 1.01 ? "true" : "false");
    }
    function reset(anim) { st.s = 1; st.x = 0; st.y = 0; apply(anim); }
    /* Keep the zoomed image covering its own box: no panning past the edges. */
    function bound() {
      var w = img.offsetWidth, h = img.offsetHeight;
      st.x = clamp(st.x, w - w * st.s, 0); st.y = clamp(st.y, h - h * st.s, 0);
    }
    function zoomAt(cx, cy, s) {
      var r = img.getBoundingClientRect(), ox = (cx - r.left) / st.s, oy = (cy - r.top) / st.s;
      var bx = r.left - st.x, by = r.top - st.y;
      st.s = clamp(s, 1, 4); st.x = cx - bx - ox * st.s; st.y = cy - by - oy * st.s; bound();
    }
    /* Buttons and +/- keys zoom about the middle of the rug's own box. */
    function zoomBy(f) {
      var r = img.getBoundingClientRect(), bx = r.left - st.x, by = r.top - st.y;
      if (st.s * f <= 1.02) { reset(true); return; }
      zoomAt(bx + img.offsetWidth / 2, by + img.offsetHeight / 2, st.s * f); apply(true);
    }
    function show(i, dir) {
      var b = st.list[i]; if (!b) return;
      st.i = i; reset(false);
      var small = b.dataset.full, big = fullPath(small);
      $("#zoom-c").textContent = b.dataset.n;
      img.alt = P[st.k].name + " in " + b.dataset.n;
      img.src = small; st.src = big;
      if (big !== small) { var t = new Image(); t.onload = function () { if (st.src === big) img.src = big; }; t.src = big; }
      $$(".zsw", row).forEach(function (x, j) { x.setAttribute("aria-current", j === i ? "true" : "false"); });
      /* Centre the chosen swatch by scrolling the row only (scrollIntoView would also shift the dialog). */
      var cur = $$(".zsw", row)[i]; if (cur) row.scrollLeft = cur.offsetLeft - row.clientWidth / 2 + cur.offsetWidth / 2;
      if (dir && !RM.matches && img.animate) img.animate([{ opacity: 0, transform: "translateX(" + (dir * 40) + "px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.22,.8,.2,1)" });
    }
    function open(k, colour, from) {
      var card = $('.prod[data-k="' + k + '"]'); if (!card || !P[k]) return;
      st.k = k; st.list = $$("[data-n][data-full]", card);
      if (!st.list.length) return;
      opener = from || doc.activeElement;
      tryb.hidden = typeof SS.tryon !== "function";
      $("#zoom-t").textContent = P[k].name;
      row.innerHTML = st.list.map(function (b, j) {
        var t = $("img", b);
        return '<button type="button" class="zsw" data-j="' + j + '" style="--c:' + esc(b.dataset.bg || "#555") + '" aria-label="' + esc(b.dataset.n) + '">' + (t ? '<img src="' + esc(t.getAttribute("src")) + '" alt="">' : "") + "</button>";
      }).join("");
      var i = Math.max(0, st.list.map(function (b) { return b.dataset.n; }).indexOf(colour));
      try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); }
      doc.documentElement.style.overflow = "hidden";
      show(i, 0);
      if (!RM.matches && dlg.animate) dlg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    }
    function close() { try { dlg.close(); } catch (e) { dlg.removeAttribute("open"); } }
    dlg.addEventListener("close", function () {
      doc.documentElement.style.overflow = ""; img.removeAttribute("src");
      var o = opener; opener = null;
      if (o && o !== doc.body && o.focus && doc.contains(o)) try { o.focus({ preventScroll: true }); } catch (e) {}
    });
    $("[data-zclose]", dlg).addEventListener("click", close);
    zin.addEventListener("click", function () { if (st.s < 3.99) zoomBy(1.5); });
    zout.addEventListener("click", function () { if (st.s > 1.01) zoomBy(1 / 1.5); });
    /* Hand the rug on show to the photo try-on once this viewer has fully closed (its close handler
       unlocks the page scroll, which the try-on then locks again). */
    tryb.addEventListener("click", function () {
      var b = st.list[st.i], k = st.k, o = opener;
      if (!b || typeof SS.tryon !== "function") return;
      dlg.addEventListener("close", function once() {
        dlg.removeEventListener("close", once);
        SS.tryon(k, b.dataset.n, { opener: o });
      });
      close();
    });
    row.addEventListener("click", function (e) { var b = e.target.closest(".zsw"); if (b) show(+b.dataset.j, +b.dataset.j > st.i ? 1 : -1); });
    go.addEventListener("click", function () {
      var b = st.list[st.i]; close();
      if (b) { b.click(); var card = b.closest(".prod"); if (card) try { card.scrollIntoView({ behavior: RM.matches ? "auto" : "smooth", block: "start" }); } catch (e) {} }
    });
    dlg.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var z = { "+": 1.5, "=": 1.5, "-": 1 / 1.5, "_": 1 / 1.5 }[e.key];
      if (z) { e.preventDefault(); if (z > 1 ? st.s < 3.99 : st.s > 1.01) zoomBy(z); return; }
      var d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d && st.s === 1) { e.preventDefault(); show((st.i + d + st.list.length) % st.list.length, d); }
    });

    /* Gestures: double-tap or click toggles 2.5x at the point, pinch zooms, one finger pans when zoomed,
       and a sideways swipe at 1x moves to the next colour. */
    var pts = {}, start = null, pinch = null, lastTap = 0, moved = false;
    function n() { return Object.keys(pts).length; }
    stage.addEventListener("pointerdown", function (e) {
      if (e.target !== img && e.pointerType === "mouse") return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      try { stage.setPointerCapture(e.pointerId); } catch (x) {}
      moved = false; img.style.transition = "none";
      if (n() === 1) start = { x: e.clientX, y: e.clientY, sx: st.x, sy: st.y, t: e.timeStamp };
      if (n() === 2) {
        var a = Object.keys(pts).map(function (id) { return pts[id]; });
        pinch = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1, s: st.s };
      }
    });
    stage.addEventListener("pointermove", function (e) {
      if (!pts[e.pointerId]) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var a = Object.keys(pts).map(function (id) { return pts[id]; });
      if (n() === 2 && pinch) {
        moved = true;
        var d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        zoomAt((a[0].x + a[1].x) / 2, (a[0].y + a[1].y) / 2, pinch.s * d / pinch.d); apply(false);
      } else if (n() === 1 && start) {
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
        if (st.s > 1) { st.x = start.sx + dx; st.y = start.sy + dy; bound(); apply(false); }
        else img.style.transform = "translateX(" + dx * 0.6 + "px)";
      }
    });
    function up(e) {
      if (!pts[e.pointerId]) return;
      delete pts[e.pointerId];
      if (n() < 2) pinch = null;
      if (n() > 0) { var k = Object.keys(pts)[0]; start = { x: pts[k].x, y: pts[k].y, sx: st.x, sy: st.y, t: e.timeStamp }; return; }
      var dx = start ? e.clientX - start.x : 0;
      if (st.s <= 1.02 && Math.abs(dx) > 60 && moved) {
        var d = dx < 0 ? 1 : -1; show((st.i + d + st.list.length) % st.list.length, d);
      } else if (!moved && e.type === "pointerup") {
        var now = e.timeStamp, dbl = now - lastTap < 320;
        if (e.pointerType === "mouse" || dbl) { if (st.s > 1) reset(true); else { zoomAt(e.clientX, e.clientY, 2.5); apply(true); } lastTap = 0; }
        else lastTap = now;
      } else if (st.s <= 1.02) reset(true);
      start = null;
    }
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);
    /* Tap on the dark area (not the rug) closes, like a lightbox. */
    stage.addEventListener("click", function (e) { if (e.target === stage && !moved) close(); });

    /* Openers: the rug photo on each Zigzag/Solid card, and the hero rug (a tap, not a drag). */
    $$(".prod").forEach(function (card) {
      var k = card.dataset.k, im = $(".pic .plane img", card);
      if (!im || k === "chen") return;
      im.addEventListener("click", function () { open(k, curColour(card)); });
    });
    var hero = $("#h-rug");
    function heroOpen(from) { var sl = SS.SLIDES[SS.getHi()]; if (sl) open(sl.k, sl.c, from); }
    if (hero) {
      var hx = 0, hy = 0;
      hero.addEventListener("pointerdown", function (e) { hx = e.clientX; hy = e.clientY; });
      hero.addEventListener("click", function (e) {
        if (Math.abs(e.clientX - hx) + Math.abs(e.clientY - hy) > 10) return;
        heroOpen();
      });
    }
    /* The same viewer for keyboard and switch users: a real button in the corner of each panel,
       named for the rug on show (renamed whenever the colour or the hero slide changes). */
    function viewButton(host, label, go) {
      var b = doc.createElement("button");
      b.type = "button"; b.className = "circle zopen"; b.setAttribute("aria-haspopup", "dialog"); b.innerHTML = EXPAND;
      function name() { b.setAttribute("aria-label", label()); }
      name(); b.addEventListener("focus", name); b.addEventListener("pointerdown", name);
      b.addEventListener("click", function () { go(b); });
      host.appendChild(b);
      return name;
    }
    var names = {};
    $$(".prod").forEach(function (card) {
      var k = card.dataset.k, pic = $(".pic", card);
      if (!pic || !P[k] || !$(".pic .plane img", card)) return;
      names[k] = viewButton(pic, function () { return "View " + P[k].name + " in " + curColour(card) + " larger"; }, function (b) { open(k, curColour(card), b); });
    });
    var hw = $("#hero .rugwrap");
    if (hero && hw) {
      names.hero = viewButton(hw, function () { var sl = SS.SLIDES[SS.getHi()]; return sl ? "View " + P[sl.k].name + " in " + sl.c + " larger" : "View this rug larger"; }, heroOpen);
    }
    if (typeof window.SSFX_on === "function") {
      window.SSFX_on("picked", function (el, k) { if (names[k]) safe(names[k]); return false; });
      window.SSFX_on("title", function () { if (names.hero) safe(names.hero); return false; });
    }
    SS.zoom = open;
  });
})();
