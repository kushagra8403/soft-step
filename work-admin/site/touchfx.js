/* Soft Steps — phone effects layer.
   Finger-follow rug (drag to tilt, swipe to change), ambient shimmer, tap ripples, light haptics.
   Touch-only, behind the reduced-motion gate; each part is isolated so a failure never touches the shop. */
(function () {
  var doc = document;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function mq(q) { try { return window.matchMedia(q); } catch (e) { return { matches: false }; } }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  var RM = mq("(prefers-reduced-motion: reduce)");
  var TOUCH = mq("(hover: none), (pointer: coarse)");
  var WAAPI = "animate" in Element.prototype;
  function motion() { return !RM.matches && WAAPI; }
  var EASE = "cubic-bezier(.22,.8,.2,1)";

  try {
    var css = doc.createElement("style");
    css.textContent =
      ".rp{position:absolute;border-radius:50%;pointer-events:none;background:currentColor;opacity:.22;transform:scale(0);animation:rp .6s " + EASE + " forwards}" +
      "@keyframes rp{to{transform:scale(1);opacity:0}}" +
      
      "@media (hover:none),(pointer:coarse){#h-play{width:44px;height:44px}#hero .rugwrap{touch-action:pan-y}}";
    doc.head.appendChild(css);
  } catch (e) {}

  /* Light haptics on phones that allow it */
  function buzz(p) { try { if (TOUCH.matches && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  try {
    doc.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-add], #h-add, #dock-add, #fit-add, #order-btn, .sz, .sw, .chip, [data-save], #h-save");
      if (!t) return;
      buzz(t.matches("[data-add], #h-add, #dock-add, #fit-add, #order-btn") ? [12, 40, 18] : 8);
    }, true);
  } catch (e) {}

  /* Tap ripple where the finger lands */
  try {
    var HOSTS = ".pill, .sz, .chip, .sw, .circle, .copy, .x, #dock-add, .btn";
    doc.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "touch" || !motion()) return;
      var h = e.target.closest && e.target.closest(HOSTS);
      if (!h || h.disabled) return;
      /* The ripple lives in its own overlay clipped to the control's shape, because some controls
         rewrite their own content on tap (Add to cart relabels itself). */
      var r = h.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, cs = getComputedStyle(h);
      var box = doc.createElement("div"), s = doc.createElement("span");
      box.style.cssText = "position:fixed;z-index:80;pointer-events:none;overflow:hidden;left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;border-radius:" + cs.borderRadius + ";color:" + cs.color;
      s.className = "rp";
      s.style.cssText = "width:" + d + "px;height:" + d + "px;left:" + (e.clientX - r.left - d / 2) + "px;top:" + (e.clientY - r.top - d / 2) + "px";
      box.appendChild(s);
      doc.body.appendChild(box);
      setTimeout(function () { box.remove(); }, 650);
    }, { passive: true });
  } catch (e) {}

  /* Finger-follow hero rug: drag sideways to tilt it in 3D and slide the sheen; it springs back on release.
     The core's swipe handler still changes the slide when the drag passes 50px. */
  var dragging = false;
  try {
    (function () {
      var wrap = $("#hero .rugwrap"), tilt = $("#h-rug .tilt"), sh = $("#h-rug .sheen i");
      if (!wrap || !tilt) return;
      var sx = 0, sy = 0, horiz = null;
      wrap.addEventListener("touchstart", function (e) {
        if (!motion()) return;
        var t = e.touches[0]; sx = t.clientX; sy = t.clientY; horiz = null; dragging = true;
        tilt.style.transition = "none"; if (sh) sh.style.transition = "none";
      }, { passive: true });
      wrap.addEventListener("touchmove", function (e) {
        if (!dragging) return;
        var t = e.touches[0], dx = t.clientX - sx, dy = t.clientY - sy;
        if (horiz === null && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) horiz = Math.abs(dx) > Math.abs(dy);
        if (!horiz) return;
        var r = wrap.getBoundingClientRect(), p = clamp((t.clientX - r.left) / (r.width || 1), 0, 1);
        tilt.style.transform = "translateX(" + (dx * 0.35).toFixed(1) + "px) rotateY(" + clamp(dx / 10, -14, 14).toFixed(2) + "deg) rotateX(" + clamp(-dy / 18, -6, 6).toFixed(2) + "deg)";
        if (sh) sh.style.transform = "translateX(" + (-60 + 220 * p).toFixed(1) + "%)";
      }, { passive: true });
      function release() {
        if (!dragging) return;
        dragging = false;
        tilt.style.transition = "transform .7s " + EASE; tilt.style.transform = "";
        if (sh) { sh.style.transition = "transform .7s " + EASE; sh.style.transform = ""; }
        setTimeout(function () { tilt.style.transition = ""; if (sh) sh.style.transition = ""; }, 750);
      }
      wrap.addEventListener("touchend", release, { passive: true });
      wrap.addEventListener("touchcancel", release, { passive: true });
    })();
  } catch (e) {}

  /* Ambient shimmer: a slow light sweep across the hero rug every few seconds, and once across
     each range rug as it comes into view. */
  try {
    (function () {
      if (!("IntersectionObserver" in window)) return;
      function sweep(i) {
        if (!i || !motion() || !TOUCH.matches) return;
        try { i.animate([{ transform: "translateX(-60%)" }, { transform: "translateX(160%)" }], { duration: 1500, easing: "cubic-bezier(.65,0,.35,1)" }); } catch (e) {}
      }
      var heroI = $("#h-rug .sheen i"), heroOn = false;
      if (heroI) {
        new IntersectionObserver(function (es) { heroOn = es[es.length - 1].isIntersecting; }, { threshold: 0.4 }).observe($("#hero"));
        setInterval(function () {
          if (heroOn && !dragging && !doc.hidden && !$("#drawer:not([hidden])") && !$("dialog[open]")) sweep(heroI);
        }, 4800);
      }
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var i = $(".sheen i", e.target);
          setTimeout(function () { sweep(i); }, 500);
        });
      }, { threshold: 0.6 });
      $$$(".prod .pic").forEach(function (p) { io.observe(p); });
    })();
  } catch (e) {}
})();
