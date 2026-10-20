/* Soft Steps — language switch: English | ગુજરાતી | हिन्दी.
   The page is written in English; a chosen language is applied on top of it from a reviewed dictionary
   (lang-gu.js / lang-hi.js, loaded on demand) and kept applied as scripts change the page.
   Product names, colour names, prices and the WhatsApp order text stay in English on purpose. */
(function () {
  var doc = document, root = doc.documentElement;
  var LANGS = [["en", "English"], ["gu", "ગુજરાતી"], ["hi", "हिन्दी"]];
  var FONTS = {
    gu: "https://fonts.googleapis.com/css2?family=Noto+Serif+Gujarati:wght@400;500&display=swap",
    hi: "https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;500&family=Hind:wght@400;500;600&display=swap"
  };
  var ATTRS = ["aria-label", "placeholder", "alt", "title", "data-d"];   /* data-d: the size caption under each size button */
  var SKIP = "script,style,noscript,textarea,input,select,[data-noi18n],.odo";
  var cur = "en", dict = null, obs = null;
  var origText = new WeakMap(), setText = new WeakMap();   /* text node -> English source / value we wrote */
  var origAttr = new WeakMap();                            /* element -> {attr: English} */
  var origRich = new WeakMap(), setRich = new WeakMap();   /* element -> English innerHTML / innerHTML we wrote */
  var touched = [];                                        /* nodes changed, so English can be restored */
  var slidesEn = null;

  function sget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }
  function decode(s) { var t = doc.createElement("textarea"); t.innerHTML = s; return t.value; }
  function reserialize(html) { var t = doc.createElement("template"); t.innerHTML = html; return norm(t.innerHTML); }
  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  /* Dictionary files register themselves here: SSI18N.gu = {text:{}, rich:{}, attr:{}, pat:[[en, tr]], slides:[{h,a,t}]} */
  var REG = window.SSI18N = window.SSI18N || {};
  /* Typed placeholders: a colour only matches a real colour name, a price only "₹1,234", and so on,
     so a loose pattern such as "{product} in {colour}" can't catch "16×24 in · 450 g". */
  function alt(list) { return "(?:" + list.slice().sort(function (a, b) { return b.length - a.length; }).map(esc).join("|") + ")"; }
  function types() {
    var SS = window.SS, names = [], cols = {};
    if (SS && SS.P) Object.keys(SS.P).forEach(function (k) { names.push(SS.P[k].name); });
    /* full colour names plus the short forms the page shows ("Forest green" for "Forest green stripe" / "... & black") */
    Array.prototype.forEach.call(doc.querySelectorAll(".prod [data-n]"), function (b) {
      var n = b.dataset.n; cols[n] = 1; cols[n.replace(/ stripe$/, "")] = 1; cols[n.split(" & ")[0]] = 1;
    });
    var NUM = "\\d+(?:\\.\\d+)?", t = { price: "₹[\\d,]+", n: NUM, q: NUM, i: NUM, w: NUM, mat: NUM, spare: NUM, over: NUM, depth: NUM,
      range: alt(["Multicolour Zigzag", "Solid Premium", "Striped Chenille", "Zigzag", "Chenille", "Solid"]) };
    if (names.length) t.product = alt(names);
    if (Object.keys(cols).length) t.colour = alt(Object.keys(cols));
    return t;
  }
  function compilePat(list, T, rich) {
    var out = [];
    list.forEach(function (p) {
      var names = [], en = rich ? reserialize(p[0]) : norm(decode(p[0]));
      var src = "^" + esc(en).replace(/\\\{(\w+)\\\}/g, function (m, n) { names.push(n); return "(" + (T[n] || ".+?") + ")"; }) + "$";
      try { out.push({ re: new RegExp(src), names: names, tr: p[1] }); } catch (e) {}
    });
    /* longer patterns first, so "View cart · {n} items" wins over a looser one */
    return out.sort(function (a, b) { return b.re.source.length - a.re.source.length; });
  }
  function compile(d) {
    if (d._ready) return d;
    var text = {}, rich = {}, attr = {}, T = types();
    Object.keys(d.text || {}).forEach(function (k) { text[norm(decode(k))] = d.text[k]; });
    Object.keys(d.attr || {}).forEach(function (k) { attr[norm(decode(k))] = d.attr[k]; });
    Object.keys(d.rich || {}).forEach(function (k) { rich[reserialize(k)] = d.rich[k]; });
    var all = d.pat || [];
    d.rpat = compilePat(all.filter(function (p) { return p[0].indexOf("<") >= 0; }), T, true);
    d.pat = compilePat(all.filter(function (p) { return p[0].indexOf("<") < 0; }), T, false);
    d.text = text; d.attr = attr; d.rich = rich; d._ready = true;
    return d;
  }
  /* a captured value that is itself a known phrase (e.g. "Main door") is translated too */
  function fill(p, m) {
    return p.tr.replace(/\{(\w+)\}/g, function (x, n) {
      var j = p.names.indexOf(n); if (j < 0) return x;
      var v = m[j + 1], t = dict && dict.text && Object.prototype.hasOwnProperty.call(dict.text, v) ? dict.text[v] : null;
      return t == null ? v : t;
    });
  }
  function lookup(table, s) {
    var k = norm(s); if (!k) return null;
    if (Object.prototype.hasOwnProperty.call(table, k)) return table[k];
    for (var i = 0; i < dict.pat.length; i++) {
      var p = dict.pat[i], m = p.re.exec(k);
      if (m) return fill(p, m);
    }
    return null;
  }
  function skip(el) { return !el || (el.closest && el.closest(SKIP)); }

  /* ---------- apply to a subtree ---------- */
  function doRich(el) {
    if (!el.children.length || skip(el)) return false;
    var html = norm(el.innerHTML);
    if (setRich.get(el) === html) return true;
    var tr = Object.prototype.hasOwnProperty.call(dict.rich, html) ? dict.rich[html] : null;
    for (var i = 0; tr == null && i < dict.rpat.length; i++) { var m = dict.rpat[i].re.exec(html); if (m) tr = fill(dict.rpat[i], m); }
    if (tr == null) return false;
    if (!origRich.has(el)) touched.push(el);
    origRich.set(el, el.innerHTML); el.innerHTML = tr; setRich.set(el, norm(el.innerHTML));
    return true;
  }
  function doText(n) {
    var v = n.nodeValue; if (!v || !/[A-Za-z]/.test(v)) return;
    if (setText.get(n) === v) return;
    if (skip(n.parentNode)) return;
    var tr = lookup(dict.text, v);
    if (tr == null) return;
    var lead = v.match(/^\s*/)[0], tail = v.match(/\s*$/)[0];
    if (!origText.has(n)) touched.push(n);
    origText.set(n, v); n.nodeValue = lead + tr + tail; setText.set(n, n.nodeValue);
  }
  function doAttrs(el) {
    if (el.closest && el.closest("script,style,[data-noi18n]")) return;   /* form fields keep their typed text, but their placeholder/label attributes translate */
    ATTRS.forEach(function (a) {
      var v = el.getAttribute(a); if (!v || !/[A-Za-z]/.test(v)) return;
      var o = origAttr.get(el) || {};
      if (o["_" + a] === v) return;                      /* the value we wrote */
      var tr = lookup(dict.attr, v); if (tr == null) tr = lookup(dict.text, v);
      if (tr == null) return;
      if (!origAttr.has(el)) touched.push(el);
      o[a] = v; o["_" + a] = tr; origAttr.set(el, o); el.setAttribute(a, tr);
    });
  }
  function walk(node) {
    if (!dict || !node) return;
    if (node.nodeType === 3) { doText(node); return; }
    if (node.nodeType !== 1 || skip(node)) return;
    var stack = [node];
    while (stack.length) {
      var el = stack.pop();
      doAttrs(el);
      Array.prototype.forEach.call(el.querySelectorAll ? el.querySelectorAll(":scope > input, :scope > textarea") : [], doAttrs);
      if (doRich(el)) { Array.prototype.forEach.call(el.querySelectorAll("*"), doAttrs); continue; }
      for (var c = el.lastChild; c; c = c.previousSibling) {
        if (c.nodeType === 3) doText(c);
        else if (c.nodeType === 1 && !(c.matches && c.matches(SKIP))) stack.push(c);
      }
    }
  }
  function restore() {
    if (obs) obs.disconnect();
    touched.forEach(function (n) {
      if (n.nodeType === 3) { if (origText.has(n) && n.nodeValue === setText.get(n)) n.nodeValue = origText.get(n); origText.delete(n); setText.delete(n); return; }
      if (origRich.has(n)) { if (norm(n.innerHTML) === setRich.get(n)) n.innerHTML = origRich.get(n); origRich.delete(n); setRich.delete(n); }
      var o = origAttr.get(n);
      if (o) { ATTRS.forEach(function (a) { if (a in o && n.getAttribute(a) === o["_" + a]) n.setAttribute(a, o[a]); }); origAttr.delete(n); }
    });
    touched = [];
  }

  /* Hero slides are data the effects layer splits into words, so they are swapped at the source. */
  function slides(code) {
    var SS = window.SS; if (!SS || !SS.SLIDES) return;
    if (!slidesEn) slidesEn = SS.SLIDES.map(function (s) { return { h: s.h, a: s.a, t: s.t }; });
    var tr = code !== "en" && dict && dict.slides;
    SS.SLIDES.forEach(function (s, i) {
      var src = (tr && tr[i]) || slidesEn[i];
      s.h = src.h; s.a = src.a; s.t = src.t;
    });
    try { SS.show(SS.getHi(), true); } catch (e) {}
  }

  function watch() {
    if (!("MutationObserver" in window)) return;
    obs = new MutationObserver(function (ms) {
      if (cur === "en" || !dict) return;
      ms.forEach(function (m) {
        if (m.type === "childList") {
          /* a script rewrote an element's innerHTML: try the whole element as a rich string first */
          if (m.target.nodeType === 1 && m.target !== doc.body && doRich(m.target)) return;
          Array.prototype.forEach.call(m.addedNodes, walk);
        }
        else if (m.type === "characterData") doText(m.target);
        else if (m.type === "attributes") doAttrs(m.target);
      });
    });
    obs.observe(doc.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function loadFont(code) {
    if (!FONTS[code] || doc.getElementById("font-" + code)) return;
    var l = doc.createElement("link"); l.id = "font-" + code; l.rel = "stylesheet"; l.href = FONTS[code]; doc.head.appendChild(l);
  }
  function loadDict(code, cb) {
    if (REG[code]) return cb(compile(REG[code]));
    var s = doc.createElement("script"); s.src = "lang-" + code + ".js";
    s.onload = function () { cb(REG[code] ? compile(REG[code]) : null); };
    s.onerror = function () { cb(null); };
    doc.head.appendChild(s);
  }

  function sync() {
    Array.prototype.forEach.call(doc.querySelectorAll("[data-lang]"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === cur ? "true" : "false");
    });
  }
  function set(code, quiet) {
    if (!LANGS.some(function (l) { return l[0] === code; })) code = "en";
    if (code === cur && (code === "en" || dict)) { sync(); return; }
    restore(); dict = null;
    if (code === "en") { cur = "en"; root.lang = "en"; slides("en"); sset("ss_lang", "en"); sync(); return; }
    loadFont(code);
    loadDict(code, function (d) {
      if (!d) { cur = "en"; root.lang = "en"; sync(); return; }
      cur = code; dict = d; root.lang = code; sset("ss_lang", code);
      slides(code); walk(doc.body); watch(); sync();
      if (!quiet && d.done) { try { window.SS && SS.toast(d.done); } catch (e) {} }
    });
  }

  /* ---------- switch UI: a slim strip above the hero, and the same buttons in the menu and footer ---------- */
  try {
    var css = doc.createElement("style");
    css.textContent =
      ".langs{display:flex;justify-content:flex-end;gap:4px;margin:0 0 8px;padding:0}" +
      ".langs button{min-height:36px;padding:0 12px;border:0;border-radius:999px;background:transparent;color:var(--mitti);font:500 14px/1 var(--text)}" +
      ".langs button[aria-pressed=true]{background:var(--chalk);color:var(--kajal);box-shadow:inset 0 0 0 1px var(--sut)}" +
      "@media(hover:none),(pointer:coarse){.langs button{min-height:44px}}" +
      "#menu .langs{justify-content:flex-start;margin-top:20px}#menu .langs button{color:var(--chalk)}#menu .langs button[aria-pressed=true]{background:rgba(251,247,240,.16);color:var(--chalk);box-shadow:none}" +
      ".foot .langs{justify-content:flex-start;margin-top:16px}.foot .langs button{color:var(--fg);opacity:.85}.foot .langs button[aria-pressed=true]{background:rgba(251,247,240,.14);color:var(--fg);box-shadow:none;opacity:1}" +
      /* Gujarati and Devanagari: Latin keeps Fraunces/Hind Vadodara, Indic glyphs fall through to the matching faces */
      "html[lang=gu]{--display:Fraunces,'Noto Serif Gujarati',Georgia,serif}" +
      "html[lang=hi]{--display:Fraunces,'Noto Serif Devanagari',Georgia,serif;--text:'Hind Vadodara',Hind,system-ui,sans-serif}" +
      "html[lang=gu] em,html[lang=hi] em{font-style:normal}" +
      "html[lang=gu] .htitle,html[lang=hi] .htitle,html[lang=gu] .h2,html[lang=hi] .h2,html[lang=gu] h3,html[lang=hi] h3{line-height:1.3;letter-spacing:0}" +
      "html[lang=gu] .htitle .w,html[lang=hi] .htitle .w{overflow:visible}" +
      "html[lang=gu] body,html[lang=hi] body{line-height:1.65}";
    doc.head.appendChild(css);
  } catch (e) {}
  function strip(cls) {
    var nav = doc.createElement("div");
    nav.className = "langs" + (cls ? " " + cls : ""); nav.setAttribute("role", "group"); nav.setAttribute("aria-label", "Language / ભાષા / भाषा");
    nav.setAttribute("data-noi18n", "");
    nav.innerHTML = LANGS.map(function (l) { return '<button type="button" data-lang="' + l[0] + '" lang="' + l[0] + '" aria-pressed="false">' + l[1] + "</button>"; }).join("");
    return nav;
  }
  try {
    var hero = doc.getElementById("hero");
    if (hero && hero.parentNode) hero.parentNode.insertBefore(strip(), hero);
    var mnav = doc.querySelector("#menu nav"); if (mnav) mnav.parentNode.insertBefore(strip(), mnav.nextSibling);
    var foot = doc.querySelector(".foot .foot-row"); if (foot) foot.parentNode.insertBefore(strip(), foot.nextSibling);
    doc.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-lang]"); if (!b) return;
      set(b.getAttribute("data-lang"));
      var m = doc.getElementById("menu"); if (m && m.open && b.closest("#menu")) try { m.close(); } catch (x) {}
    });
  } catch (e) {}

  window.SSLANG = { set: set, get: function () { return cur; } };
  var saved = sget("ss_lang");
  if (saved && saved !== "en") set(saved, true); else sync();
})();
