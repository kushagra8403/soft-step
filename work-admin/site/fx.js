/* fx.js: Soft Steps effects module (spec §4).
   1  hero choreography: title (split words, ghost, counter, save sync), slide (dye, roll-up,
      unroll, words, sheen sweep), first-load unroll, prefetch
   1b odometer (price hook)          1c autoplay (#h-play rules)
   2  dye-bath (dye hook)            3  lamp / tilt / sheen pointer loop (one rAF)
   5  chenille camera (picked hook)  7  fly-to-cart on a kumkum thread (fly hook)
   Effects 4, 6 and 8 are pure CSS in the page; this file only sets the sheen radius (--rr).
   Contract: loads after the core; registers hooks only through SSFX_on(name, fn); syncs its own
   initial state from window.SS; each effect is isolated in try/catch; every hook returns false
   when it does not animate, so the core falls back to its instant path. ES2017, no libraries. */
(function () {
  "use strict";
  var SS = window.SS;
  if (!SS || !window.SSFX || typeof window.SSFX_on !== "function") return;

  /* ---------- shared helpers ---------- */
  var doc = document;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function on(name, fn) { try { window.SSFX_on(name, fn); } catch (e) {} }
  function mq(q) { try { return window.matchMedia(q); } catch (e) { return { matches: false }; } }
  function listen(m, fn) { try { m.addEventListener("change", fn); } catch (e) { try { m.addListener(fn); } catch (e2) {} } }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function px(n) { return (Math.round(n * 10) / 10) + "px"; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function settled(a) { return a && a.finished ? a.finished.then(function () { return true; }, function () { return false; }) : Promise.resolve(true); }
  function kill(a) { try { a.cancel(); } catch (e) {} }
  function idle(f) { if (window.requestIdleCallback) window.requestIdleCallback(f, { timeout: 2000 }); else setTimeout(f, 300); }
  function centre(el) { var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }
  function centreIn(el) {
    if (!el) return null;
    var c = centre(el);
    return c.w > 0 && c.h > 0 && c.x >= 0 && c.y >= 0 && c.x <= innerWidth && c.y <= innerHeight ? c : null;
  }
  function decoded(im, ms) {
    return new Promise(function (res) {
      var t = setTimeout(res, ms), fin = function () { clearTimeout(t); res(); };
      try {
        if (im.decode) im.decode().then(fin, fin);
        else if (im.complete) fin();
        else { im.addEventListener("load", fin, { once: true }); im.addEventListener("error", fin, { once: true }); }
      } catch (e) { fin(); }
    });
  }

  var RM = mq("(prefers-reduced-motion: reduce)");
  var FINE = mq("(hover:hover) and (pointer:fine)");
  var WAAPI = typeof Element !== "undefined" && "animate" in Element.prototype;
  function motion() { return !RM.matches && WAAPI; }          /* the motion gate, spec §2.8 */
  var E = { out: "cubic-bezier(.22,.8,.2,1)", io: "cubic-bezier(.65,0,.35,1)", inn: "cubic-bezier(.5,0,.75,0)", dye: "cubic-bezier(.7,0,.2,1)", fly: "cubic-bezier(.5,0,.3,1)" };
  var IO = "IntersectionObserver" in window;
  var hero = $("#hero");
  /* Chenille colourway rects in the 1200x1801 photo, row-major, matching the chip order (spec §4.5). */
  var CHEN = [[83, 142, 507, 257], [612, 142, 512, 257], [83, 411, 507, 272], [612, 411, 512, 272], [83, 694, 507, 278],
              [612, 694, 512, 278], [83, 985, 507, 294], [612, 985, 512, 294], [83, 1293, 507, 298], [612, 1293, 512, 298]];
  /* the chip's crop in the photo: data-ci from the core (hidden colours never shift it), else its place in the row */
  function chipIndex(btn) {
    if (btn && btn.hasAttribute && btn.hasAttribute("data-ci")) return +btn.getAttribute("data-ci");
    var g = btn && btn.parentNode; return g ? $$('[role="radio"]', g).indexOf(btn) : -1;
  }
  function chipLabel(btn) { return (btn && (btn.getAttribute("data-label") || btn.textContent) || "").trim(); }

  /* ---------- sheen radius (effects 3 and 4 share it): matches the webp's transparent corners ---------- */
  try {
    (function () {
      var items = $$(".sheen").map(function (s) { return { s: s, img: s.parentNode && $("img", s.parentNode) }; }).filter(function (o) { return o.img; });
      function upd() { items.forEach(function (o) { var w = o.img.clientWidth; if (w) o.s.style.setProperty("--rr", (w * 0.019).toFixed(1) + "px"); }); }
      upd();
      items.forEach(function (o) { o.img.addEventListener("load", upd); });
      if (window.ResizeObserver) { var ro = new ResizeObserver(upd); items.forEach(function (o) { ro.observe(o.img); }); }
    })();
  } catch (e) {}

  /* ---------- 2. Dye-bath colour change ---------- */
  function mixWhite(hex, k) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
    if (!m) return hex;
    var n = parseInt(m[1], 16);
    return "rgb(" + [n >> 16, n >> 8 & 255, n & 255].map(function (v) { return Math.round(v * k + 255 * (1 - k)); }).join(",") + ")";
  }
  try {
    on("dye", function (el, hex, fg, onc, from) {
      var wet, main;
      try {
        if (!el) return false;
        var go = motion() && !doc.hidden, panel = el.matches(".field") ? el : $(".field", el);
        /* rapid clicks: commit the previous dye first. When declining, drop it uncommitted instead,
           because the core is about to paint the new colour instantly and must not be overwritten. */
        if (el._dye) { if (go && panel) el._dye.finish(); else el._dye.abort(); }
        clearTimeout(el._dyeT);
        if (!go || !panel) return false;
        var pr = panel.getBoundingClientRect();
        if (!pr.width || !pr.height) return false;
        var x = pr.width / 2, y = pr.height / 2;
        if (from && from.getBoundingClientRect) { var c = centre(from); if (c.w || c.h) { x = c.x - pr.left; y = c.y - pr.top; } }
        x = clamp(x, 0, pr.width); y = clamp(y, 0, pr.height);   /* clamped, so a swatch outside floods from the nearest edge */
        var R = Math.ceil(Math.hypot(Math.max(x, pr.width - x), Math.max(y, pr.height - y))) + 2;
        wet = doc.createElement("i"); main = doc.createElement("i");
        wet.className = main.className = "dye";
        wet.setAttribute("aria-hidden", "true"); main.setAttribute("aria-hidden", "true");
        wet.style.background = mixWhite(hex, 0.82); main.style.background = hex;
        panel.insertBefore(main, panel.firstChild); panel.insertBefore(wet, main);
        var at = " at " + px(x) + " " + px(y) + ")";
        var kf = [{ clipPath: "circle(0px" + at }, { clipPath: "circle(" + R + "px" + at }];
        var a1 = wet.animate(kf, { duration: 700, easing: E.dye, fill: "both" });
        var a2 = main.animate(kf, { duration: 700, delay: 90, easing: E.dye, fill: "both" });
        var done = false, ctl;
        var swapText = function () { el.style.setProperty("--fg", fg); el.style.setProperty("--on", onc); };
        var end = function (commit) {
          if (done) return;
          done = true;
          if (el._dye === ctl) { clearTimeout(el._dyeT); el._dye = null; }
          if (commit) { swapText(); el.style.setProperty("--f", hex); }
          kill(a1); kill(a2); wet.remove(); main.remove();
        };
        var finish = function () { end(true); };
        ctl = { finish: finish, abort: function () { end(false); }, hex: hex };
        el._dye = ctl;
        el._dyeT = setTimeout(swapText, 350);        /* fg and on switch at 350ms, never interpolated */
        settled(a2).then(finish);
        return true;
      } catch (e) {
        try { if (wet) wet.remove(); if (main) main.remove(); } catch (e2) {}
        return false;
      }
    });
  } catch (e) {}

  /* ---------- 1. Hero choreography and 1b odometer ---------- */
  var heroFx = null;
  try {
    heroFx = (function () {
      var h1 = $("#h-title"), img = $("#h-img"), plane = img && img.closest(".plane");
      if (!hero || !h1 || !img || !plane) return null;
      var roll = $(".roll", plane), sheen = $(".sheen", plane), shI = sheen && $("i", sheen),
          ghostEl = $("#h-ghost"), countEl = $("#h-count"), lead = $("#h-lead"), nameEl = $("#h-name"),
          odoBox = $("#h-odo"), side = odoBox && odoBox.closest(".side");
      var ROLLED = "inset(-4% 94% -8% -4% round 2%)", FULL = "inset(-4% -4% -8% -4% round 2%)";
      /* vis: the aria-hidden split copy for the current slide. attached: the copy in the h1 now.
         vstate: "hidden" (not shown yet, or already leaving), "in" (rising), "rest". */
      var gen = 0, slideGen = -1, anims = [], vis = null, attached = null, vstate = "rest", pendingOut = null, ghostA = null, ghostT = 0, quiet = true;
      function track(a) { if (a) anims.push(a); return a; }
      function killAll() { var l = anims; anims = []; l.forEach(kill); }

      /* title: text + <em>accent</em>; split into span.w > span when motion is allowed */
      function parts(sl) { var h = sl.h, a = sl.a || "", i = a ? h.lastIndexOf(a) : -1; return i < 0 ? [h, "", ""] : [h.slice(0, i), a, h.slice(i + a.length)]; }
      function words(s) { return s.split(/(\s+)/).map(function (t) { return !t ? "" : /^\s+$/.test(t) ? " " : '<span class="w"><span>' + esc(t) + "</span></span>"; }).join(""); }
      function renderTitle(sl) {
        var p = parts(sl);
        if (!motion()) { h1.innerHTML = esc(p[0]) + (p[1] ? "<em>" + esc(p[1]) + "</em>" : "") + esc(p[2]); return null; }
        var sr = doc.createElement("span"), v = doc.createElement("span");
        sr.className = "sr-only"; sr.textContent = sl.h;
        v.className = "hv"; v.setAttribute("aria-hidden", "true");
        v.innerHTML = words(p[0]) + (p[1] ? "<em>" + words(p[1]) + "</em>" : "") + words(p[2]);
        h1.textContent = ""; h1.appendChild(sr); h1.appendChild(v);
        return v;
      }
      function ghost(g) {
        if (!ghostEl) return;
        clearTimeout(ghostT);
        if (ghostA) { kill(ghostA); ghostA = null; }
        if (ghostEl.textContent === g) return;
        if (quiet || !motion() || doc.hidden) { ghostEl.textContent = g; return; }
        /* the colour is already fg at 7%, so element opacity 1 -> 0 -> 1 reads as .07 -> 0 -> .07 */
        ghostA = ghostEl.animate([{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 700, easing: "ease-in-out" });
        ghostT = setTimeout(function () { ghostEl.textContent = g; }, 350);
      }
      function pad(n) { return (n < 10 ? "0" : "") + n; }
      function savedSync(sl) {
        var b = $("#h-save");
        if (!b) return;
        b.setAttribute("aria-label", "Save " + sl.c + " " + SS.P[sl.k].name);
        /* features.js owns ss_saved and its own title hook runs after this one; this is only the fallback */
        var list = null;
        try { list = JSON.parse(localStorage.getItem("ss_saved") || "[]"); } catch (e) {}
        if (Array.isArray(list) && list.every(function (x) { return typeof x === "string"; }))
          b.setAttribute("aria-pressed", list.indexOf(sl.k + "|" + sl.c) >= 0 ? "true" : "false");
      }
      function title(sl, hi) {
        /* a new slide supersedes any running timeline; if no slide hook claims it in this same tick
           (an instant swap, or the slide hook declined), the old timeline is cleared so the core's path is clean */
        var g = ++gen;
        Promise.resolve().then(function () { if (g === gen && slideGen !== g) { killAll(); attachVis(); vstate = "rest"; } });
        /* an instant swap paints without the dye hook: a hero dye still heading for another colour is stale */
        var cur = SS.swatch(sl.k, sl.c);
        if (hero._dye && cur && String(hero._dye.hex).toLowerCase() !== String(cur.dataset.bg).toLowerCase()) hero._dye.abort();
        var prev = attached && vstate !== "hidden" ? attached : null;
        vis = renderTitle(sl); attached = vis; vstate = "rest";
        pendingOut = vis && prev && prev !== vis ? prev : null;
        ghost(sl.g);
        if (countEl) countEl.textContent = pad(hi + 1) + " / " + pad(SS.SLIDES.length);
        savedSync(sl);
      }

      /* 1b. odometer: ₹ + per digit span.dg > span.col of 0-9; commas static; rebuild only on a shape change */
      var DIG = "0123456789".split("").map(function (d) { return "<span>" + d + "</span>"; }).join("");
      function isD(c) { return c >= "0" && c <= "9"; }
      /* Fraunces digits are proportional and ₹ kerns into the first digit, so each digit window takes
         its glyph's own width (in em) and the ₹ gets the pair's kerning; both ease with the roll. */
      var metrics = null;
      function measure(box) {
        var fs = parseFloat(getComputedStyle(box).fontSize) || 0, pr = doc.createElement("span");
        if (!fs || !box.getClientRects().length) return null;
        pr.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;white-space:pre;display:inline-block";
        box.appendChild(pr);
        var w = function (t) { pr.textContent = t; return pr.getBoundingClientRect().width / fs; };
        var m = { d: [], k: [] }, rs = w("₹");
        for (var i = 0; i < 10; i++) { m.d[i] = w(String(i)); m.k[i] = w("₹" + i) - rs - m.d[i]; }
        pr.remove();
        return m.d[0] > 0 ? m : null;
      }
      function odo(box, n) {
        var ch = SS.inr(n).split(""), sig = ch.map(function (c) { return isD(c) ? "#" : c; }).join(""), rebuilt = false;
        if (box._sig !== sig) {
          box.innerHTML = ch.map(function (c) { return isD(c) ? '<span class="dg"><span class="col">' + DIG + "</span></span>" : "<span>" + esc(c) + "</span>"; }).join("");
          rebuilt = !!box._sig; box._sig = sig;
        }
        if (!metrics) metrics = measure(box);
        var cols = $$(".col", box), dgs = $$(".dg", box), ds = ch.filter(isD), sym = box.firstElementChild;
        if (rebuilt) { cols.forEach(function (c) { c.style.transform = "translateY(0)"; }); void box.offsetWidth; }
        cols.forEach(function (c, i) {
          var d = +ds[i], delay = (i * 40) + "ms";
          c.style.transitionDelay = delay; c.style.transform = "translateY(" + (-d * 10) + "%)";
          if (metrics) {
            c.style.textAlign = "center";
            var g = dgs[i].style;
            g.display = "inline-flex"; g.justifyContent = "center"; g.alignItems = "flex-start";
            g.transition = "width .7s cubic-bezier(.22,.8,.2,1) " + delay;
            g.width = metrics.d[d].toFixed(4) + "em";
          }
        });
        if (metrics && sym && !isD(ch[0]) && ds.length) {
          sym.style.transition = "margin .7s cubic-bezier(.22,.8,.2,1)";
          sym.style.marginRight = metrics.k[+ds[0]].toFixed(4) + "em";
        }
      }

      /* one pass of light across the pile. The band rests at 40% (or wherever the pointer put it), so the
         pass leaves from there, exits right, re-enters from fully off the left and settles back: same
         distance as -60% -> 160%, without the band popping at either end. */
      function sweep() {
        if (!shI || !motion()) return;
        var rest = shI.style.transform || "translateX(40%)";
        track(shI.animate([
          { transform: rest, easing: E.inn },
          { transform: "translateX(165%)", offset: 0.5 },
          { transform: "translateX(-85%)", offset: 0.5, easing: E.out },
          { transform: rest }
        ], { duration: 1200 }));
      }
      function prefetch() {
        idle(function () {
          try {
            var S = SS.SLIDES, n = S[(SS.getHi() + 1) % S.length], sw = SS.swatch(n.k, n.c);
            if (sw && sw.dataset.full) { var im = new Image(); im.src = window.SSIMG ? SSIMG.map(sw.dataset.full) : sw.dataset.full; }
          } catch (e) {}
        });
      }
      function rollKF(W) {
        return [{ transform: "translateX(" + px(0.06 * W) + ") scaleX(1)", opacity: 1 },
                { transform: "translateX(" + px(0.97 * W) + ") scaleX(.35)", opacity: 1, offset: 0.9 },
                { transform: "translateX(" + px(W) + ") scaleX(.35)", opacity: 0 }];
      }
      function attachVis() {
        if (vis && attached !== vis && attached && attached.parentNode === h1) h1.replaceChild(vis, attached);
        if (vis) attached = vis;
      }
      function hardSwap(sl, b) {
        killAll();
        try { img.src = b.dataset.full; img.alt = SS.P[sl.k].name + " in " + sl.c; } catch (e) {}
        attachVis(); vstate = "rest";
      }

      /* the slide: dye (already started by paint), words out + roll-up, swap + decode, unroll + words in, sheen sweep */
      function slide(d) {
        if (slideGen === gen) gen++;
        var my = slideGen = gen, sl = d.sl, b = d.b;
        var cs = getComputedStyle(img), clip0 = cs.clipPath && cs.clipPath !== "none" ? cs.clipPath : FULL;
        var rs = roll && getComputedStyle(roll), r0 = rs && +rs.opacity > 0.02 && rs.transform !== "none" ? { transform: rs.transform, opacity: rs.opacity } : null;
        killAll();                                     /* at most one timeline at a time */
        var W = plane.offsetWidth;
        var outNode = pendingOut; pendingOut = null;
        /* 7. lead and name */
        [lead, nameEl].forEach(function (el) { if (el) track(el.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 300, easing: E.out })); });
        /* 6, prepared now: the new words wait below their line (paused at t=0, fill backwards) */
        var inA = vis ? $$(".w > span", vis).map(function (s, i) {
          var a = track(s.animate([{ transform: "translateY(105%)" }, { transform: "translateY(0)" }], { duration: 700, delay: i * 50, easing: E.out, fill: "backwards" }));
          a.pause(); return a;
        }) : [];
        vstate = "hidden";
        /* 2. words out */
        var outLast = null;
        if (outNode && vis && vis.parentNode === h1) {
          h1.replaceChild(outNode, vis); attached = outNode;
          $$(".w > span", outNode).forEach(function (s, i) {
            outLast = track(s.animate([{ transform: "translateY(0)" }, { transform: "translateY(-105%)" }], { duration: 300, delay: i * 20, easing: E.inn, fill: "forwards" }));
          });
        }
        /* 3. roll-up (starts from wherever an interrupted unroll had reached) */
        var kfUp = [{ clipPath: clip0 }, { clipPath: ROLLED }], oUp = { duration: 380, easing: E.inn, fill: "forwards" };
        var up = [track(img.animate(kfUp, oUp))];
        if (sheen) up.push(track(sheen.animate(kfUp, oUp)));
        if (roll) up.push(track(roll.animate([r0 || { transform: "translateX(" + px(W) + ") scaleX(1)", opacity: 0 }, { transform: "translateX(" + px(0.06 * W) + ") scaleX(1)", opacity: 1 }], oUp)));
        Promise.all([settled(up[0]), settled(outLast)]).then(function () {
          if (my !== gen) return false;
          /* 4. swap, then wait for decode (600ms at most) */
          img.src = b.dataset.full; img.alt = SS.P[sl.k].name + " in " + sl.c;
          if (roll) roll.style.setProperty("--f", b.dataset.bg);   /* the cylinder unrolls in the new rug's colour */
          var rug = $("#h-rug"); if (rug) rug.classList.remove("out");
          return decoded(img, 600).then(function () { return my === gen; });
        }).then(function (go) {
          if (!go) return false;
          var W2 = plane.offsetWidth || W;
          /* 5. unroll with the roll cylinder */
          var kfUn = [{ clipPath: ROLLED }, { clipPath: FULL }], oUn = { duration: 900, easing: E.io };
          var un = track(img.animate(kfUn, oUn));
          if (sheen) track(sheen.animate(kfUn, oUn));
          if (roll) track(roll.animate(rollKF(W2), oUn));
          up.forEach(kill);
          /* 6. words in */
          attachVis(); vstate = "in";
          inA.forEach(function (a) { a.play(); });
          settled(inA.length ? inA[inA.length - 1] : null).then(function () { if (my === gen) vstate = "rest"; });
          return settled(un);
        }).then(function (ok) {
          if (!ok || my !== gen) return;
          sweep();                                     /* 9. sheen sweep once the unroll lands */
          prefetch();
        }).catch(function () { if (my === gen) hardSwap(sl, b); });
      }

      function firstLoad() {
        if (!motion() || doc.hidden) return;
        var r = hero.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= innerHeight) return;
        /* if the page was already on screen well before this module arrived (slow network), the finished
           rug has been seen: re-rolling it would flash, so the intro is skipped and only the sheen sweeps */
        try {
          var fcp = performance.getEntriesByType("paint").filter(function (e) { return e.name === "first-contentful-paint"; })[0];
          if (fcp && performance.now() - fcp.startTime > 150) { sweep(); prefetch(); return; }
        } catch (e) {}
        var my = ++gen;
        killAll();
        $$(".hcopy > *", hero).forEach(function (el, i) {
          track(el.animate([{ transform: "translateY(18px)" }, { transform: "none" }], { duration: 700, delay: i * 70, easing: E.out, fill: "backwards" }));
        });
        var go = function () {
          if (my !== gen) return;
          var W = plane.offsetWidth, o = { duration: 1100, delay: 150, easing: E.io, fill: "backwards" };
          var un = track(img.animate([{ clipPath: ROLLED }, { clipPath: FULL }], o));
          if (sheen) track(sheen.animate([{ clipPath: ROLLED }, { clipPath: FULL }], o));
          if (roll) track(roll.animate(rollKF(W), o));
          settled(un).then(function (ok) { if (ok && my === gen) sweep(); prefetch(); });
        };
        if (img.complete && img.naturalWidth) go(); else decoded(img, 600).then(go);
      }

      function sync() {
        quiet = true;
        try {
          var hi = SS.getHi(), sl = SS.SLIDES[hi];
          killAll();
          title(sl, hi); pendingOut = null;
          syncOdo();
          var b = SS.swatch(sl.k, sl.c);     /* after a reduced-motion switch mid-slide, land on the current rug */
          if (b && b.dataset.full && img.getAttribute("src") !== b.dataset.full) { img.src = b.dataset.full; img.alt = SS.P[sl.k].name + " in " + sl.c; }
        } finally { quiet = false; }
      }
      function syncOdo() {
        if (!odoBox || !side) return;
        var sl = SS.SLIDES[SS.getHi()];
        side.classList.add("has-odo");
        odo(odoBox, SS.P[sl.k].sizes[SS.getHs()][3]);
      }
      /* glyph widths are only right once the web fonts are in */
      try { if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { metrics = null; try { syncOdo(); } catch (e) {} }); } catch (e) {}

      on("title", function (sl, hi) { try { title(sl, hi); } catch (e) {} return false; });
      on("price", function (n) { try { if (odoBox && side) { side.classList.add("has-odo"); odo(odoBox, n); } } catch (e) {} return false; });
      on("slide", function (d) {
        try {
          if (!motion() || doc.hidden || !d || !d.b || !d.b.dataset.full) return false;
          slide(d);
          return true;
        } catch (e) {
          try { killAll(); attachVis(); vstate = "rest"; } catch (e2) {}
          return false;                               /* the core's .out path takes over */
        }
      });
      return { sync: sync, firstLoad: firstLoad, prefetch: prefetch };
    })();
    if (heroFx) { heroFx.sync(); heroFx.firstLoad(); }
  } catch (e) {}

  /* ---------- 1c. Autoplay (phones too; it stops for good once the visitor touches the buy controls) ---------- */
  try {
    (function () {
      var btn = $("#h-play"), dots = $("#dots");
      if (!btn || !dots || !hero || !heroFx) return;
      var AP = mq("(prefers-reduced-motion:no-preference)");   /* phones too: most visitors are on a phone */
      var stopped = false, userPaused = false, off = false, modal = false, shown = null;
      var I_PAUSE = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="3.5" y="3" width="3" height="10" rx="1"/><rect x="9.5" y="3" width="3" height="10" rx="1"/></svg>';
      var I_PLAY = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5.2 3.1v9.8c0 .6.7 1 1.2.7l7.3-4.9c.5-.3.5-1 0-1.3L6.4 2.4c-.5-.3-1.2.1-1.2.7z"/></svg>';
      function sync() {
        var elig = !!AP.matches, playing = elig && !stopped, asPlay = !playing || userPaused;
        btn.hidden = !elig;
        hero.classList.toggle("auto", playing);
        hero.classList.toggle("paused", playing && (userPaused || off || modal || doc.hidden));
        if (shown !== asPlay) { shown = asPlay; btn.innerHTML = asPlay ? I_PLAY : I_PAUSE; }
        btn.setAttribute("aria-pressed", asPlay ? "true" : "false");
        btn.setAttribute("aria-label", asPlay ? "Play slideshow" : "Pause slideshow");
      }
      /* any manual interaction stops autoplay for good (only #h-play can restart it) */
      function halt() { if (!stopped) { stopped = true; userPaused = false; sync(); } }
      ["#prev", "#nextBtn", "#h-next", "#h-add", "#h-save"].forEach(function (s) { var el = $(s); if (el) el.addEventListener("click", halt); });
      var hsz = $("#h-sizes");
      if (hsz) {
        hsz.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('[role="radio"]')) halt(); });
        hsz.addEventListener("keydown", function (e) { if (/^Arrow/.test(e.key)) halt(); });
      }
      var tx = null;
      hero.addEventListener("touchstart", function (e) {
        tx = e.touches[0].clientX;
        /* a finger on the price, sizes or Add to cart means the visitor is choosing: never swap the rug under it */
        if (e.target.closest && e.target.closest(".side, .ctas, #h-sizes, .pricebox, .dimsrow")) halt();
      }, { passive: true });
      hero.addEventListener("touchend", function (e) { if (tx !== null && Math.abs(e.changedTouches[0].clientX - tx) > 50) halt(); tx = null; }, { passive: true });
      btn.addEventListener("click", function (e) {
        if (stopped) { stopped = false; userPaused = false; } else userPaused = !userPaused;
        sync();
        /* a mouse click on Play must not leave focus in the hero, which would pause it again (focus-within) */
        if (e.detail > 0 && !userPaused) btn.blur();
      });
      dots.addEventListener("animationend", function (e) {
        if (e.animationName !== "fill" || !hero.classList.contains("auto") || hero.classList.contains("paused")) return;
        try { SS.show(SS.getHi() + 1, false, $("#h-next")); } catch (err) {}
      });
      doc.addEventListener("visibilitychange", sync);
      if (IO) new IntersectionObserver(function (es) { off = !es[es.length - 1].isIntersecting; sync(); }, { threshold: 0.1 }).observe(hero);
      on("drawer", function (open) { try { modal = !!open; sync(); } catch (e) {} return false; });
      listen(AP, sync);
      sync();
    })();
  } catch (e) {}

  /* ---------- 3. Lamp-lit floating rug: lamp, tilt and velvet sheen on one rAF loop ---------- */
  var pointerReset = function () {};
  try {
    (function () {
      var lamp = hero && $(".lamp", hero), tilt = $("#h-rug .tilt"), hImg = $("#h-img"), hSh = $("#h-rug .sheen i");
      if (!lamp || !tilt || !hImg) return;
      var S = { lx: 0, ly: 0, tlx: 0, tly: 0, rx: 0, ry: 0, trx: 0, tr: 0, sx: 40, tsx: 40 }, wrote = {};
      var cards = $$(".prod .pic").map(function (p) { return { p: p, img: $(".plane img", p), i: $(".sheen i", p), x: 40, t: 40, w: null }; })
        .filter(function (c) { return c.img && c.i; });
      var raf = 0, heroOn = true, moving = false;
      function ok() { return FINE.matches && !RM.matches; }
      function ease(cur, tgt, k) { var d = tgt - cur; if (Math.abs(d) < 0.02) return tgt; moving = true; return cur + d * k; }
      function put(el, key, v) { if (wrote[key] !== v) { wrote[key] = v; el.style.transform = v; } }
      function frame() {
        raf = 0;
        if (!ok()) return;
        moving = false;
        if (heroOn) {
          S.lx = ease(S.lx, S.tlx, 0.08); S.ly = ease(S.ly, S.tly, 0.08);
          S.rx = ease(S.rx, S.trx, 0.1); S.ry = ease(S.ry, S.tr, 0.1);
          S.sx = ease(S.sx, S.tsx, 0.12);
          put(lamp, "l", "translate3d(" + S.lx.toFixed(1) + "px," + S.ly.toFixed(1) + "px,0)");
          put(tilt, "t", "rotateX(" + clamp(S.rx, -4, 4).toFixed(2) + "deg) rotateY(" + clamp(S.ry, -4, 4).toFixed(2) + "deg)");
          if (hSh) put(hSh, "s", "translateX(" + S.sx.toFixed(1) + "%)");
        }
        cards.forEach(function (c) {
          c.x = ease(c.x, c.t, 0.12);
          var v = "translateX(" + c.x.toFixed(1) + "%)";
          if (c.w !== v) { c.w = v; c.i.style.transform = v; }
        });
        if (moving) raf = requestAnimationFrame(frame);   /* the loop stops once everything has settled */
      }
      function kick() { if (!raf && ok()) raf = requestAnimationFrame(frame); }
      function ratioOver(el, x) { var r = el.getBoundingClientRect(); return clamp((x - r.left) / (r.width || 1), 0, 1); }
      hero.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch" || !ok() || !heroOn) return;
        var r = hero.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var x = e.clientX - r.left, y = e.clientY - r.top;
        S.tlx = (x - 0.62 * r.width) * 0.5; S.tly = (y - 0.36 * r.height) * 0.5;   /* lamp drifts halfway toward the pointer */
        S.trx = clamp((0.5 - y / r.height) * 6, -4, 4); S.tr = clamp((x / r.width - 0.5) * 8, -4, 4);
        S.tsx = -60 + 220 * ratioOver(hImg, e.clientX);
        kick();
      });
      hero.addEventListener("pointerleave", function () { S.tlx = S.tly = S.trx = S.tr = 0; S.tsx = 40; kick(); });
      cards.forEach(function (c) {
        c.p.addEventListener("pointermove", function (e) { if (e.pointerType === "touch" || !ok()) return; c.t = -60 + 220 * ratioOver(c.img, e.clientX); kick(); });
        c.p.addEventListener("pointerleave", function () { c.t = 40; kick(); });
      });
      if (IO) new IntersectionObserver(function (es) { heroOn = es[es.length - 1].isIntersecting; if (heroOn) kick(); }).observe(hero);
      pointerReset = function () {
        if (raf) cancelAnimationFrame(raf);
        raf = 0; wrote = {};
        S.lx = S.ly = S.tlx = S.tly = S.rx = S.ry = S.trx = S.tr = 0; S.sx = S.tsx = 40;
        lamp.style.transform = ""; tilt.style.transform = ""; if (hSh) hSh.style.transform = "";
        cards.forEach(function (c) { c.x = c.t = 40; c.w = null; c.i.style.transform = ""; });
      };
      listen(FINE, pointerReset);
    })();
  } catch (e) {}

  /* ---------- 5. Chenille camera: zoom to the picked colourway ---------- */
  try {
    (function () {
      var card = $('.prod[data-k="chen"]'), frame = $("#chen-frame"), cimg = frame && $("img", frame),
          cap = $("#chen-cap"), allBtn = $("#chen-all");
      if (!card || !frame || !cimg) return;
      var idx = -1;
      function apply(instant) {
        var fw = frame.clientWidth, fh = frame.clientHeight;
        if (!fw || !fh) return;
        var s, tx, ty, r = CHEN[idx];
        if (!r) { s = Math.min(fw / 1200, fh / 1801); tx = (fw - 1200 * s) / 2; ty = (fh - 1801 * s) / 2; }
        else { s = Math.min(fw / (r[2] * 1.1), fh / (r[3] * 1.1)); tx = fw / 2 - (r[0] + r[2] / 2) * s; ty = fh / 2 - (r[1] + r[3] / 2) * s; }
        var v = "translate(" + px(tx) + "," + px(ty) + ") scale(" + s.toFixed(4) + ")";
        if (instant) cimg.style.transition = "none";
        cimg.style.transform = v;
        if (instant) { void cimg.offsetWidth; cimg.style.transition = ""; }
        frame.classList.toggle("zoomed", !!r);
      }
      function allTen() {
        idx = -1;
        if (cap) cap.textContent = "Showing all ten colourways";
        if (allBtn) allBtn.hidden = true;
      }
      frame.classList.add("cam");
      /* open on the colourway already selected, like the other ranges; "See all ten" keeps the grid a tap away */
      var sel0 = $('.chips [aria-checked="true"]', card), i0 = sel0 ? chipIndex(sel0) : -1;
      if (CHEN[i0]) {
        idx = i0;
        if (cap) cap.textContent = "Showing the " + chipLabel(sel0) + " colourway";
        if (allBtn) allBtn.hidden = false;
      } else allTen();
      apply(true);
      on("picked", function (el, k, b, ready) {
        try {
          if (k !== "chen" || el !== card) return false;
          if (!ready) { allTen(); apply(true); return false; }
          var i = chipIndex(b);
          if (!CHEN[i]) return false;
          idx = i;
          if (cap) cap.textContent = "Showing the " + chipLabel(b) + " colourway";
          if (allBtn) allBtn.hidden = false;
          apply(false);
        } catch (e) {}
        return false;
      });
      if (allBtn) allBtn.addEventListener("click", function () {
        allTen(); apply(false);
        var sel = $('.chips [aria-checked="true"]', card);   /* the button just hid itself; keep focus nearby */
        if (sel) try { sel.focus({ preventScroll: true }); } catch (e) { sel.focus(); }
      });
      if (window.ResizeObserver) new ResizeObserver(function () { apply(true); }).observe(frame);
      else window.addEventListener("resize", function () { apply(true); });
    })();
  } catch (e) {}

  /* ---------- 7. Fly-to-cart on a kumkum thread ---------- */
  try {
    (function () {
      var SVGNS = "http://www.w3.org/2000/svg", lastDock = -1e9, flew = false;
      function chenSrc() { try { var i = $('.prod[data-k="chen"] .pic img'); return i.currentSrc || i.src; } catch (e) { return "img/chen.jpg"; } }
      function srcPoint(src) {
        var list = [];
        if (performance.now() - lastDock < 800) list.push($("#dock-add"));
        if (src && src.nodeType === 1) {
          if (src.matches(".prod")) list.push($(".pic .rugbox", src) || $(".chen-frame", src), $("[data-add]", src));
          else if (src === hero) list.push($("#h-img"), $("#h-add"));
          list.push(src);
        }
        for (var i = 0; i < list.length; i++) { var c = centreIn(list[i]); if (c) return c; }
        return null;
      }
      function target() {
        var hdr = $("#hdr"), hc = $("#hcart"), c;
        if (hdr && hdr.classList.contains("on") && (c = centreIn(hc))) return { el: hc, c: c, badge: $("#hcnt") };
        var cb = $("#cartbtn");
        if ((c = centreIn(cb))) return { el: cb, c: c, badge: $("#cnt") };
        var bar = $("#cbar");
        if (bar && !bar.hidden && (c = centreIn(bar))) return { el: bar, c: c, badge: null };
        var dock = $("#dock");
        if (dock && dock.classList.contains("on") && (c = centreIn(dock))) return { el: dock, c: c, badge: null };
        return null;
      }
      function dress(d, k, sw, B) {
        if (sw && sw.dataset && sw.dataset.bg) d.style.backgroundColor = sw.dataset.bg;
        if (k === "chen") {
          var r = CHEN[chipIndex(sw)];
          if (!r) return;
          var s = B * 1.4 / r[3];
          d.style.backgroundImage = 'url("' + chenSrc() + '")';
          d.style.backgroundSize = px(1200 * s) + " auto";
          d.style.backgroundPosition = px(B / 2 - (r[0] + r[2] / 2) * s) + " " + px(B / 2 - (r[1] + r[3] / 2) * s);
        } else {
          var im = sw && $("img", sw);
          if (im) d.style.backgroundImage = 'url("' + (im.currentSrc || im.src) + '")';
        }
      }
      function thread(p0, p1, p2) {
        var svg = $("#flylayer");
        if (!svg) return;
        var p = doc.createElementNS(SVGNS, "path");
        p.setAttribute("d", "M" + p0.x.toFixed(1) + " " + p0.y.toFixed(1) + " Q" + p1.x.toFixed(1) + " " + p1.y.toFixed(1) + " " + p2.x.toFixed(1) + " " + p2.y.toFixed(1));
        p.setAttribute("pathLength", "1");
        p.style.strokeDasharray = "1"; p.style.strokeDashoffset = "1";
        svg.appendChild(p);
        var a = p.animate([{ strokeDashoffset: "1" }, { strokeDashoffset: "0" }], { duration: 720, easing: E.fly, fill: "forwards" });
        settled(a).then(function () { return settled(p.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" })); })
          .then(function () { p.remove(); });
      }
      function land(t) {
        try {
          var base = getComputedStyle(t.el).boxShadow, tail = base && base !== "none" ? ", " + base : "";
          t.el.animate([{ boxShadow: "0 0 0 0 rgba(169,46,31,.45)" + tail }, { boxShadow: "0 0 0 12px rgba(169,46,31,0)" + tail }], { duration: 500, easing: E.out });
          if (t.badge && !t.badge.hidden) t.badge.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 300, easing: E.out });
        } catch (e) {}
      }
      function fly(src, k, sw) {
        flew = true;
        if (!motion() || doc.hidden) return false;
        var dr = $("#drawer");
        if ((dr && !dr.hidden) || $("dialog[open]")) return false;   /* modals sit in the top layer, above the fly layer */
        var p0 = srcPoint(src), t = target();
        if (!p0 || !t) return false;
        var p2 = t.c, p1 = { x: (p0.x + p2.x) / 2, y: Math.min(p0.y, p2.y) - 160 }, kf = [], m = 24;
        /* keep the arc's peak on screen: the curve's minimum y stays >= m when y1 >= m - sqrt((y0-m)(y2-m)) */
        if (p0.y > m && p2.y > m) p1.y = Math.max(p1.y, m - Math.sqrt((p0.y - m) * (p2.y - m)));
        for (var i = 0; i <= 16; i++) {
          var u = i / 16, a = (1 - u) * (1 - u), m = 2 * u * (1 - u), c = u * u;
          kf.push({ transform: "translate(" + px(a * p0.x + m * p1.x + c * p2.x - 28) + "," + px(a * p0.y + m * p1.y + c * p2.y - 28) + ") scale(" + (1 - 0.65 * u).toFixed(3) + ")" });
        }
        var d = doc.createElement("div");
        d.className = "fly"; d.setAttribute("aria-hidden", "true");
        dress(d, k, sw, 56);
        doc.body.appendChild(d);
        var fa = d.animate(kf, { duration: 720, easing: E.fly, fill: "forwards" });
        thread(p0, p1, p2);
        settled(fa).then(function () { d.remove(); land(t); });
        return true;
      }
      on("fly", function (src, k, sw) { try { return fly(src, k, sw); } catch (e) { return false; } });

      /* where the click came from: the dock flies from the dock; #fit-add flies from the plan mat
         (if features.js adds without calling the fly hook, this fills in after the click) */
      function cartCount() { var c = $("#cnt"); return c ? (parseInt(c.textContent, 10) || 0) : 0; }
      doc.addEventListener("click", function (e) {
        var t = e.target;
        if (!t || !t.closest) return;
        if (t.closest("#dock-add")) lastDock = performance.now();
        if (t.closest("#fit-add")) {
          var before = cartCount();
          flew = false;
          setTimeout(function () {
            if (flew || cartCount() <= before) return;
            try {
              var lbl = ($("#fit-add").textContent || ""), k = /Chenille/.test(lbl) ? "chen" : /Solid/.test(lbl) ? "sol" : "zig";
              var card = $('.prod[data-k="' + k + '"]'), g = card && $(".swatches,.chips", card), sw = g && $('[aria-checked="true"]', g);
              var mat = $("#matR");
              if (!mat || mat.hasAttribute("hidden")) mat = $("#matH");
              fly(mat || $("#fit-add"), k, sw);
            } catch (err) {}
          }, 0);
        }
      }, true);
    })();
  } catch (e) {}

  /* ---------- reduced-motion preference changes at runtime ---------- */
  listen(RM, function () {
    try { $$(".prod, #hero").forEach(function (el) { if (el._dye) el._dye.finish(); }); } catch (e) {}
    try { if (heroFx) heroFx.sync(); } catch (e) {}
    try { pointerReset(); } catch (e) {}
  });
})();
