/* Soft Steps — "See it at your door": a photo try-on.
   The visitor photographs their doorway (or plays on a drawn sample floor) and lays the chosen rug on it in
   true perspective: a CSS matrix3d maps the rug cut-out onto four draggable corners. The photo stays in this
   tab as an object URL: it is never uploaded and never drawn to a canvas. Isolated like the other modules. */
(function () {
  var doc = document, SS = window.SS;
  if (!SS || !SS.P || typeof HTMLDialogElement !== "function") return;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function mq(q) { try { return window.matchMedia(q); } catch (e) { return { matches: false }; } }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function safe(f) { try { return f(); } catch (e) { try { console.warn("tryon", e); } catch (x) {} } }
  var RM = mq("(prefers-reduced-motion: reduce)"), FINE = mq("(hover: hover) and (pointer: fine)");
  var P = SS.P, esc = SS.esc, inr = SS.inr;
  /* Chenille is left out: its only photo is a sheet of all ten mats. A range whose colours the owner has all
     hidden is left out too. */
  var KS = ["zig", "sol"].filter(function (k) { var c = document.querySelector('.prod[data-k="' + k + '"]'); return !!(c && !c.hidden && c.querySelector("[data-n][data-full]")); }), SHORT = { zig: "Zigzag", sol: "Solid" };
  /* By size index (M, H, L, XL): inches along the door, inches deep. H is the half-round M. */
  var IN = [[24, 16], [24, 16], [32, 20], [60, 24]];
  var FLOORS = { marble: { n: "White marble", c: "#ECE9E3", g: "#C8C0B2" }, kota: { n: "Kota stone", c: "#7D8A78", g: "#68745F" }, wood: { n: "Wood", c: "#A0714B", g: "#7A5134" } };
  var CORNER = ["Far left", "Far right", "Near right", "Near left"];
  var SHADOW = " drop-shadow(0 1px 1px rgba(0,0,0,.5)) drop-shadow(0 6px 10px rgba(0,0,0,.32))";
  var M = 6, FIT = 28;   /* corners stay 6px inside the stage; a quad placed for the visitor keeps whole handles in view */
  /* On touch screens corners also stay 26px from the left and right edges, out of the system back-swipe strip. */
  var MX = window.matchMedia && matchMedia("(pointer:coarse)").matches ? 26 : M;
  var SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">';
  var CAM = SVG + '<path d="M3.5 8H7l2-3h6l2 3h3.5v11.5h-17Z"/><circle cx="12" cy="13.2" r="3.6"/></svg>';
  var GAL = SVG + '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="m3.5 16 5-5 4 4 2.5-2.5 5 5"/><circle cx="15.5" cy="9" r="1.4"/></svg>';
  var DOOR = SVG + '<path d="M7 15.5V3.5h10v12"/><path d="M14 9.5h.01"/><path d="M5 20.5 7.5 17h9l2.5 3.5Z"/></svg>';

  function card(k) { return $('.prod[data-k="' + k + '"]'); }
  function curColour(el) { var c = el && $("[data-colour]", el); return c ? c.textContent : ""; }
  function curSize(el) { var bs = el ? $$('.sizes-c [role="radio"]', el) : []; return Math.max(0, bs.indexOf($('.sizes-c [aria-checked="true"]', el))); }
  function swatches(k) { var c = card(k); return c ? $$("[data-n][data-full]", c) : []; }
  function rugSrc(k, c) { var b = SS.swatch(k, c), p = b && b.dataset.full; return p && window.SSIMG ? SSIMG.map(p) : p; }
  function cp(p) { return [p[0], p[1]]; }

  try {
    var css = doc.createElement("style");
    css.textContent =
      /* Entry points */
      ".tgo{position:absolute;left:12px;top:12px;z-index:3;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px 0 12px;border:0;border-radius:999px;background:var(--glass);box-shadow:inset 0 0 0 1.5px var(--ring35);color:var(--fg);font:600 14px/1 var(--text);white-space:nowrap;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}" +
      ".tgo:hover{background:var(--ring30)}.tgo svg{width:20px;height:20px;flex:none}" +
      "@media(min-width:861px){.tgo{left:20px;top:20px}}" +
      ".fit .pill.tfit{gap:10px;padding:0 24px 0 20px}.tfit svg{width:20px;height:20px;flex:none}" +
      /* Dialog shell, same family as #zoom */
      "#tryon{position:fixed;inset:0;width:100%;max-width:none;height:100%;max-height:none;margin:0;padding:0;border:0;background:#141B36;color:#FBF7F0;overflow:hidden;overscroll-behavior:contain;--focus:#E3A62F}" +
      "#tryon[open]{display:flex;flex-direction:column}#tryon::backdrop{background:#141B36}" +
      "#tryon .th{flex:none;display:flex;align-items:center;gap:8px;padding:max(10px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) 10px max(16px,env(safe-area-inset-left))}" +
      "#tryon .th h2{flex:1;min-width:0;font:420 clamp(18px,4.8vw,21px)/1.2 var(--display);font-variation-settings:var(--fvs);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      "#tryon .x{background:rgba(251,247,240,.14);color:#FBF7F0}" +
      "#tryon .tbtn{display:inline-flex;align-items:center;justify-content:center;gap:6px;flex:none;min-height:44px;padding:0 14px;border:0;border-radius:999px;background:rgba(251,247,240,.14);color:#FBF7F0;font:600 14px/1 var(--text);white-space:nowrap}" +
      "#tryon .tbtn:hover{background:rgba(251,247,240,.22)}#tryon .tbtn svg{width:18px;height:18px;flex:none}" +
      "#tryon .tbtn[aria-pressed=true]{background:#FBF7F0;color:#141B36}" +
      "@media(max-width:380px){#tryon .th .tbtn svg{display:none}}" +
      /* Step 1 */
      "#tryon .tstart{flex:1;min-height:0;overflow-y:auto;display:grid;place-items:center;padding:8px max(16px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}" +
      "#tryon .tcard{width:min(100%,400px);display:grid;justify-items:center;gap:14px;text-align:center}" +
      "#tryon .tart{width:168px;height:auto;color:#FBF7F0;margin-bottom:4px}" +
      "#tryon .tlead{font-size:17px;line-height:1.5;max-width:32ch;margin-bottom:6px}" +
      "#tryon .tfile{position:relative;gap:10px;padding:0 24px;cursor:pointer}#tryon .tfile svg{width:20px;height:20px;flex:none}" +
      "#tryon .tfile input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:0}" +
      "#tryon .tfile:has(input:focus-visible){outline:3px solid #E3A62F;outline-offset:3px}" +
      "#tryon .tpri{background:#FBF7F0;color:#141B36}#tryon .tpri:hover{background:#fff}" +
      "#tryon .tsec{background:transparent;color:#FBF7F0;box-shadow:inset 0 0 0 1.5px rgba(251,247,240,.55)}#tryon .tsec:hover{background:rgba(251,247,240,.08)}" +
      "#tryon .tcard .link{color:#FBF7F0;margin-top:2px}" +
      "#tryon .terr{color:#FFD9A0;font-size:15px}" +
      "#tryon .twhat{display:inline-flex;align-items:center;gap:10px;margin-top:10px;font-size:14px;opacity:.8}" +
      "#tryon .twhat img{width:28px;height:28px;border-radius:50%;object-fit:cover;flex:none}" +
      /* Step 2: stage over controls (a side panel on wide screens) */
      "#tryon .tbody{flex:1;min-height:0;display:flex;flex-direction:column}" +
      "#tryon .tstage{position:relative;flex:1;min-height:0;overflow:hidden;background:#0E1330;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;--hz:48px}" +
      "@media(pointer:coarse){#tryon .tstage{--hz:52px}}" +
      "#tryon .tphoto{position:absolute;left:0;top:0;max-width:none;display:block;pointer-events:none;-webkit-user-drag:none}" +
      "#tryon .trug{position:absolute;left:0;top:0;display:block;margin:0;padding:0;border:0;background:none;transform-origin:0 0;cursor:grab;-webkit-tap-highlight-color:transparent}" +
      "#tryon .trug img{display:block;width:100%;height:100%;max-width:none;pointer-events:none;-webkit-user-drag:none}" +
      "#tryon .trug.half img{clip-path:ellipse(50% 100% at 50% 0)}" +
      "#tryon .trug:focus-visible{outline:3px solid #E3A62F;outline-offset:3px}" +
      "#tryon .tui{position:absolute;inset:0;pointer-events:none}" +
      "#tryon .tstage.clean .tui{display:none}" +
      "#tryon .tframe{position:absolute;inset:0;width:100%;height:100%;overflow:visible;display:none}#tryon .tstage.half .tframe{display:block}" +
      "#tryon .tframe polygon{fill:none;stroke:#FBF7F0;stroke-width:1.5;stroke-dasharray:5 5;opacity:.75}" +
      "#tryon .thandle{position:absolute;left:0;top:0;width:var(--hz);height:var(--hz);margin:calc(var(--hz) / -2) 0 0 calc(var(--hz) / -2);padding:0;border:0;border-radius:50%;background:none;pointer-events:auto;cursor:grab;touch-action:none;-webkit-tap-highlight-color:transparent}" +
      "#tryon .thandle::before{content:\"\";position:absolute;left:50%;top:50%;width:28px;height:28px;margin:-14px 0 0 -14px;box-sizing:border-box;border-radius:50%;border:3px solid #FBF7F0;background:rgba(20,27,54,.38);box-shadow:0 2px 6px rgba(0,0,0,.6),inset 0 0 0 1px rgba(0,0,0,.3)}" +
      "#tryon .thandle::after{content:\"\";position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#FBF7F0;box-shadow:0 0 2px rgba(0,0,0,.7)}" +
      "#tryon .thandle:focus-visible{outline:none}#tryon .thandle:focus-visible::before{box-shadow:0 0 0 3px #E3A62F,0 2px 6px rgba(0,0,0,.6)}" +
      "#tryon .tstage.drag,#tryon .tstage.drag *{cursor:grabbing}" +
      "#tryon .ttop{position:absolute;left:0;right:0;top:10px;display:grid;justify-items:center;gap:8px;padding:0 12px}" +
      "#tryon .thint{max-width:30em;padding:6px 12px;border-radius:12px;background:rgba(20,27,54,.74);font:500 13px/1.4 var(--text);text-align:center}" +
      "#tryon .tfloors{display:flex;gap:6px;pointer-events:auto}" +
      "#tryon .tfloors button{min-height:44px;padding:0 14px;border:0;border-radius:999px;background:rgba(20,27,54,.74);color:#FBF7F0;font:600 13px/1 var(--text)}" +
      "#tryon .tfloors [aria-checked=true]{background:#FBF7F0;color:#141B36}" +
      "#tryon .ttoast{position:absolute;left:50%;bottom:12px;z-index:2;max-width:calc(100% - 32px);width:max-content;padding:10px 16px;border-radius:14px;background:#FBF7F0;color:#141B36;font:600 14px/1.35 var(--text);box-shadow:0 12px 30px -10px rgba(0,0,0,.6);opacity:0;transform:translate(-50%,8px);pointer-events:none;transition:opacity .2s,transform .24s cubic-bezier(.22,.8,.2,1)}" +
      "#tryon .ttoast.on{opacity:1;transform:translate(-50%,0)}" +
      "#tryon #tryon-cart{color:var(--chalk);box-shadow:inset 0 0 0 1.5px rgba(251,247,240,.6);min-height:48px}#tryon #tryon-cart .chev{background:var(--chalk);color:var(--kajal)}" +
      "#tryon .tf{flex:none;display:grid;grid-template-columns:minmax(0,1fr);gap:10px;padding:10px max(16px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));box-shadow:0 -1px 0 rgba(251,247,240,.1)}" +
      "#tryon .ttools{display:flex;align-items:center;gap:12px}" +
      "#tryon .tlight{flex:1;min-width:0;display:flex;align-items:center;gap:10px;font:600 14px/1 var(--text)}" +
      "#tryon .tlight input{flex:1;min-width:0;height:44px;margin:0;accent-color:#E3A62F;background:none}" +
      "#tryon .tpick{display:flex;align-items:center;gap:10px;min-width:0}" +
      "#tryon .tseg{flex:none;display:flex;gap:4px}" +
      "#tryon .tseg button,#tryon .tsizes button{border:0;background:none;color:#FBF7F0;box-shadow:inset 0 0 0 1.5px rgba(251,247,240,.45)}" +
      "#tryon .tseg button{min-height:44px;padding:0 13px;border-radius:999px;font:600 14px/1 var(--text)}" +
      "#tryon .tseg [aria-checked=true],#tryon .tsizes [aria-checked=true]{background:#FBF7F0;color:#141B36;box-shadow:none}" +
      "#tryon .tsw{position:relative;flex:1;min-width:0;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:3px}#tryon .tsw::-webkit-scrollbar{display:none}" +
      "#tryon .tsw button{flex:none;width:44px;height:44px;padding:0;border:0;border-radius:50%;overflow:hidden;background:var(--c);box-shadow:inset 0 0 0 2px rgba(251,247,240,.25)}" +
      "#tryon .tsw img{width:100%;height:100%;object-fit:cover;display:block}" +
      "#tryon .tsw [aria-checked=true]{box-shadow:0 0 0 3px #E3A62F}" +
      /* stock the owner set: a haldi dot for few left, a fine strike for out of stock (colours and sizes) */
      "#tryon .tsw button{position:relative}#tryon .tsw [data-stock] img{opacity:.5}#tryon .tsw [data-stock=few] img{opacity:1}" +
      "#tryon .tsw [data-stock]::after{content:\"\";position:absolute;inset:0;border-radius:50%;pointer-events:none;background:linear-gradient(135deg,transparent calc(50% - 1px),#FBF7F0 calc(50% - 1px) calc(50% + 1px),transparent calc(50% + 1px))}" +
      "#tryon .tsw [data-stock=few]::after{inset:auto 6px 6px auto;width:10px;height:10px;background:#E3A62F;box-shadow:0 0 0 2px #141B36}" +
      "#tryon .tsizes [data-stock=out]{opacity:.55;background-image:linear-gradient(135deg,transparent calc(50% - .75px),currentColor calc(50% - .75px) calc(50% + .75px),transparent calc(50% + .75px))}" +
      "#tryon .tadd.oos{background:var(--wa);color:#fff}#tryon .tadd.oos:hover{background:#155f3c}" +
      "#tryon .tsizes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}" +
      "#tryon .tsizes button{display:grid;place-items:center;align-content:center;gap:3px;min-height:48px;padding:4px 2px;border-radius:14px;font:600 15px/1 var(--text)}" +
      "#tryon .tsizes small{font:500 12px/1 var(--text);opacity:.85}" +
      "#tryon .tadd{gap:0;padding:0 18px;background:#FBF7F0;color:#141B36;font-size:15px}#tryon .tadd:hover{background:#fff}" +
      "#tryon .tadd span{flex:none}#tryon .tadd .tc{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}#tryon .tadd .td{padding:0 .4em;opacity:.6}" +
      "@media(min-width:900px),(orientation:landscape) and (max-height:540px) and (min-width:560px){" +
        "#tryon .tbody{flex-direction:row}" +
        "#tryon .tf{width:min(400px,42vw);overflow-y:auto;align-content:center;gap:14px;padding:16px max(24px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) 24px;box-shadow:-1px 0 0 rgba(251,247,240,.1)}" +
        "#tryon .tpick{flex-direction:column;align-items:stretch}#tryon .tseg button{flex:1}" +
        "#tryon .tsw{flex-wrap:wrap;overflow:visible}" +
      "}" +
      "@media(prefers-reduced-motion:reduce){#tryon *,.tgo{transition:none!important;animation:none!important}}";
    doc.head.appendChild(css);
  } catch (e) {}

  /* ---------- The dialog ---------- */
  var dlg = doc.createElement("dialog");
  dlg.id = "tryon"; dlg.setAttribute("aria-labelledby", "tryon-t");
  dlg.innerHTML =
    '<div class="th"><h2 id="tryon-t">See it at your door</h2>' +
    '<button type="button" class="tbtn" id="tryon-new" hidden>' + CAM + "New photo</button>" +
    '<button type="button" class="x" id="tryon-x" aria-label="Close">✕</button></div>' +
    '<div class="tstart" id="tryon-start"><div class="tcard">' +
      '<svg class="tart" viewBox="0 0 168 112" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M56 66V8h56v58" opacity=".6"/><path d="M64 66V16h40v50" opacity=".35"/><path d="M14 66h140" opacity=".35"/></g>' +
      '<path d="M58 74h52l16 30H42Z" fill="#E3A62F"/><path d="M66 80h36M62 88h44M56 96h56" stroke="#141B36" stroke-width="3" opacity=".35"/>' +
      '<g fill="#141B36" stroke="#FBF7F0" stroke-width="2.5"><circle cx="58" cy="74" r="5"/><circle cx="110" cy="74" r="5"/><circle cx="126" cy="104" r="5"/><circle cx="42" cy="104" r="5"/></g></svg>' +
      '<p class="tlead">Take a photo of your doorway or floor from standing height. Your photo stays on your phone.</p>' +
      '<label class="pill full tfile tpri" id="tryon-camb">' + CAM + '<span>Take a photo</span><input type="file" accept="image/*" capture="environment" id="tryon-cam"></label>' +
      '<label class="pill full tfile tsec" id="tryon-galb">' + GAL + '<span>Choose from gallery</span><input type="file" accept="image/*" id="tryon-gal"></label>' +
      '<button type="button" class="link" id="tryon-sample">Try a sample floor</button>' +
      '<p class="terr" id="tryon-err" role="alert"></p>' +
      '<p class="twhat" id="tryon-what"></p>' +
    "</div></div>" +
    '<div class="tbody" id="tryon-body" hidden>' +
      '<div class="tstage" id="tryon-stage">' +
        '<img class="tphoto" id="tryon-photo" alt="" draggable="false" decoding="async">' +
        '<button type="button" class="trug" id="tryon-rug" aria-describedby="tryon-kb"><img alt="" draggable="false"></button>' +
        '<div class="tui"><svg class="tframe" aria-hidden="true"><polygon/></svg><div class="ttop"><p class="thint">Drag the corners to the edges of your floor. Screenshot to share.</p>' +
          '<div class="tfloors" id="tryon-floors" role="radiogroup" aria-label="Sample floor" hidden>' +
            Object.keys(FLOORS).map(function (f) { return '<button type="button" role="radio" data-f="' + f + '">' + FLOORS[f].n + "</button>"; }).join("") + "</div></div>" +
          CORNER.map(function (c, i) { return '<button type="button" class="thandle" data-i="' + i + '" aria-label="' + c + ' corner of the rug" aria-describedby="tryon-kb"></button>'; }).join("") +
        "</div>" +
        '<p class="ttoast" id="tryon-toast" role="status"></p>' +
        '<p class="sr-only" id="tryon-kb">Drag it, or use the arrow keys. Hold Shift to move further.</p>' +
      "</div>" +
      '<div class="tf">' +
        '<div class="ttools"><label class="tlight"><span>Light</span><input type="range" id="tryon-light" min="0.7" max="1.25" step="0.01" value="1"></label>' +
        '<button type="button" class="tbtn" id="tryon-hide" aria-pressed="false">Hide handles</button></div>' +
        '<div class="tpick"><div class="tseg" id="tryon-range" role="radiogroup" aria-label="Range"></div><div class="tsw" id="tryon-sw" role="radiogroup" aria-label="Colour"></div></div>' +
        '<div class="tsizes" id="tryon-sizes" role="radiogroup" aria-label="Size"></div>' +
        '<button type="button" class="pill full tadd" id="tryon-add"></button>' +
        '<button type="button" class="pill sec full" id="tryon-cart" hidden>View cart <span class="chev" aria-hidden="true">›</span></button>' +
      "</div>" +
    "</div>";
  doc.body.appendChild(dlg);

  var startEl = $("#tryon-start", dlg), body = $("#tryon-body", dlg), stage = $("#tryon-stage", dlg), photo = $("#tryon-photo", dlg);
  var rug = $("#tryon-rug", dlg), rugImg = $("img", rug), hs = $$(".thandle", dlg), frame = $(".tframe polygon", dlg), floorsEl = $("#tryon-floors", dlg);
  var seg = $("#tryon-range", dlg), sw = $("#tryon-sw", dlg), sizes = $("#tryon-sizes", dlg), add = $("#tryon-add", dlg);
  var light = $("#tryon-light", dlg), hide = $("#tryon-hide", dlg), newBtn = $("#tryon-new", dlg), toastEl = $("#tryon-toast", dlg);
  var cam = $("#tryon-cam", dlg), gal = $("#tryon-gal", dlg), err = $("#tryon-err", dlg), what = $("#tryon-what", dlg);
  var st = { k: "zig", c: "", si: 0, kf: 1, floor: "marble", url: null, ptok: 0, rtok: 0, nat: null, rect: null, sw: 0, sh: 0, q: null, bw: 0, bh: 0, proj: null, opener: null };

  /* On a desktop there is no camera to open: one "Choose a photo" button leads. */
  function desk() {
    var d = FINE.matches;
    $("#tryon-camb", dlg).hidden = d;
    $("#tryon-galb span", dlg).textContent = d ? "Choose a photo" : "Choose from gallery";
    $("#tryon-galb", dlg).className = "pill full tfile " + (d ? "tpri" : "tsec");
  }

  /* ---------- Geometry ---------- */
  /* Unit square to quad (Heckbert's closed form). Corners run far-left, far-right, near-right, near-left. */
  function s2q(q) {
    var x0 = q[0][0], y0 = q[0][1], x1 = q[1][0], y1 = q[1][1], x2 = q[2][0], y2 = q[2][1], x3 = q[3][0], y3 = q[3][1];
    var sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3, g = 0, h = 0;
    if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
      var dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, den = dx1 * dy2 - dx2 * dy1;
      if (!den) return null;
      g = (sx * dy2 - dx2 * sy) / den; h = (dx1 * sy - sx * dy1) / den;
    }
    return { a: x1 - x0 + g * x1, b: x3 - x0 + h * x3, c: x0, d: y1 - y0 + g * y1, e: y3 - y0 + h * y3, f: y0, g: g, h: h };
  }
  function mapU(t, u, v) {
    var w = t.g * u + t.h * v + 1;
    return w > 1e-6 ? [(t.a * u + t.b * v + t.c) / w, (t.d * u + t.e * v + t.f) / w] : null;
  }
  /* The w x h box onto the quad, as a CSS matrix3d (column-major, origin at the box's top-left). */
  function m3d(q, w, h) {
    var t = s2q(q);
    return t ? "matrix3d(" + [t.a / w, t.d / w, 0, t.g / w, t.b / h, t.e / h, 0, t.h / h, 0, 0, 1, 0, t.c, t.f, 0, 1].join(",") + ")" : "none";
  }
  /* A usable quad: corners inside the stage, convex, clockwise, no edge shorter than 24px, no angle near 0 or 180. */
  function ok(q, m) {
    m = m || M;
    var mx = Math.max(m, MX);
    for (var i = 0; i < 4; i++) {
      var a = q[i], b = q[(i + 1) % 4], c = q[(i + 2) % 4];
      if (!a || a[0] < mx - 0.5 || a[1] < m - 0.5 || a[0] > st.sw - mx + 0.5 || a[1] > st.sh - m + 0.5) return false;
      var ux = b[0] - a[0], uy = b[1] - a[1], vx = c[0] - b[0], vy = c[1] - b[1], lu = Math.hypot(ux, uy), lv = Math.hypot(vx, vy);
      if (lu < 24 || ux * vy - uy * vx < 0.12 * lu * lv) return false;
    }
    return true;
  }
  function mid(q) { return [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4]; }
  function sim(q, c, s, r) {
    var co = Math.cos(r) * s, si = Math.sin(r) * s;
    return q.map(function (p) { var x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + co * x - si * y, c[1] + si * x + co * y]; });
  }
  /* A w x d rectangle (inches, centred on 0,0, +Y toward the viewer) through map(), shrunk about its centre
     only if it will not fit the stage at full size. */
  function fitRect(map, w, d) {
    for (var k = 1, n = 0; n < 30; n++, k *= 0.93) {
      var q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (s) { return map(s[0] * w * k / 2, s[1] * d * k / 2); });
      if (q.every(Boolean) && ok(q, FIT)) { q.k = k; return q; }
    }
    return null;
  }
  /* A new size keeps the floor's perspective: the current quad is taken as the old size's rectangle on the
     floor, and the new rectangle, sharing its centre, goes through the same projection. st.kf remembers how
     far a size was shrunk to fit the stage, so M to XL and back lands on the same M. */
  function resized(q, from, to) {
    var t = s2q(q), o = [IN[from][0] * st.kf, IN[from][1] * st.kf], w = IN[to];
    var r = t ? fitRect(function (x, y) { return mapU(t, 0.5 + x / o[0], 0.5 + y / o[1]); }, w[0], w[1]) : null;
    if (r) st.kf = r.k;
    return r;
  }
  /* Default for a photo: a trapezoid on the lower middle, near edge wider. */
  function base() {
    var r = st.rect, n = Math.min(r.w * 0.56, st.sw - 4 * M), d = n * 0.42;
    if (d > r.h * 0.45) { n *= r.h * 0.45 / d; d = r.h * 0.45; }
    var f = n * 0.8, cx = r.x + r.w / 2, cy = Math.min(r.y + r.h * 0.7, st.sh - M - d / 2 - 2);
    return [[cx - f / 2, cy - d / 2], [cx + f / 2, cy - d / 2], [cx + n / 2, cy + d / 2], [cx - n / 2, cy + d / 2]];
  }
  /* Default for the sample floor: the true size, just in front of the door sill. */
  function place(pr, si) {
    var r = st.rect, s = r.w / pr.W, d = IN[si][1], zc = pr.Zw - 3.5 - d / 2;
    return fitRect(function (x, y) { var z = zc - y; if (z < 1) return null; var p = pr.pt(x, z); return [r.x + p[0] * s, r.y + p[1] * s]; }, IN[si][0], d);
  }
  function home() {
    var q = st.proj ? place(st.proj, st.si) : null;
    st.kf = q ? q.k : 1;
    if (!q) { var b = base(); q = (st.si > 1 ? resized(b, 0, st.si) : null) || b; }
    return q;
  }

  /* ---------- Drawing ---------- */
  /* The rug's box is resized to the quad's longest edges when a gesture ends, so it rasterises near its
     on-screen size and stays crisp; during a drag only the transform changes. */
  function commit() {
    var q = st.q; if (!q) return;
    function L(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
    st.bw = Math.round(clamp(Math.max(L(q[0], q[1]), L(q[3], q[2])), 32, 2400));
    st.bh = Math.round(clamp(Math.max(L(q[0], q[3]), L(q[1], q[2])), 24, 2400));
    rug.style.width = st.bw + "px"; rug.style.height = st.bh + "px";
    render();
  }
  function render() {
    var q = st.q; if (!q || !st.bw) return;
    rug.style.transform = m3d(q, st.bw, st.bh);
    hs.forEach(function (h, i) { h.style.transform = "translate(" + q[i][0].toFixed(1) + "px," + q[i][1].toFixed(1) + "px)"; });
    if (rug.classList.contains("half")) frame.setAttribute("points", q.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "));
  }
  function layout() {
    if (!st.nat || body.hidden) return;
    var W = stage.clientWidth, H = stage.clientHeight; if (!W || !H) return;
    var s = Math.min(W / st.nat[0], H / st.nat[1]), r = { w: st.nat[0] * s, h: st.nat[1] * s };
    r.x = (W - r.w) / 2; r.y = (H - r.h) / 2;
    photo.style.cssText = "left:" + r.x + "px;top:" + r.y + "px;width:" + r.w + "px;height:" + r.h + "px";
    var o = st.rect; st.rect = r; st.sw = W; st.sh = H;
    /* After a rotation or window resize, the rug keeps its place on the photo. */
    if (st.q && o && (o.w !== r.w || o.x !== r.x || o.y !== r.y)) {
      var k = r.w / o.w, q = st.q.map(function (p) { return [clamp(r.x + (p[0] - o.x) * k, MX, W - MX), clamp(r.y + (p[1] - o.y) * k, M, H - M)]; });
      st.q = ok(q) ? q : home();
      commit();
    }
  }
  function setLight(v) {
    v = clamp(+v || 1, 0.7, 1.25);
    light.value = v; light.setAttribute("aria-valuetext", Math.round(v * 100) + "%");
    rug.style.filter = "brightness(" + v + ")" + SHADOW;
  }
  function setClean(on) {
    stage.classList.toggle("clean", on); hide.setAttribute("aria-pressed", on ? "true" : "false");
  }
  function note(m) {
    toastEl.textContent = m; toastEl.classList.add("on");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove("on"); }, 2600);
  }

  /* ---------- Picking: range, colour, size ---------- */
  function buyable() { return !SS.canBuy || SS.canBuy(st.k, st.c, st.si); }
  function label() {
    var z = P[st.k].sizes[st.si], b = SS.swatch(st.k, st.c), t = b && $("img", b), ok = buyable();
    add.classList.toggle("oos", !ok);
    add.innerHTML = ok ? '<span>Add to cart</span><span class="td">·</span><span class="tc">' + esc(st.c) + '</span><span class="td">·</span><span>' + z[0] + '</span><span class="td">·</span><span>' + inr(z[3]) + "</span>"
      : '<span class="tc">Out of stock · Ask on WhatsApp</span>';
    what.innerHTML = (t ? '<img src="' + esc(t.getAttribute("src")) + '" alt="">' : "") + "<span>" + esc(SHORT[st.k] + " · " + st.c + " · " + z[0] + " (" + z[1] + ")") + "</span>";
    rug.setAttribute("aria-label", P[st.k].name + " in " + st.c + ", size " + z[0]);
    rug.classList.toggle("half", z[0] === "H"); stage.classList.toggle("half", z[0] === "H");
    render();
  }
  function loadRug() {
    var src = rugSrc(st.k, st.c), tok = ++st.rtok;
    if (!src || rugImg.getAttribute("src") === src) return;
    /* Swap only once the new colour has loaded, so the rug never blinks out of the photo. */
    var t = new Image();
    t.onload = t.onerror = function () { if (tok === st.rtok) rugImg.src = src; };
    t.src = src;
  }
  function pickers() {
    seg.innerHTML = KS.map(function (k) { return '<button type="button" role="radio" data-k="' + k + '">' + SHORT[k] + "</button>"; }).join("");
    SS.radio(seg, $('[data-k="' + st.k + '"]', seg));
    var list = swatches(st.k);
    if (!list.some(function (b) { return b.dataset.n === st.c; })) st.c = list[0] ? list[0].dataset.n : "";
    sw.innerHTML = list.map(function (b) {
      var t = $("img", b), n = esc(b.dataset.n), s = SS.stock ? SS.stock(st.k, b.dataset.n) : "in", l = esc(SS.stockLabel ? SS.stockLabel(b.dataset.n, s) : b.dataset.n);
      return '<button type="button" role="radio" data-n="' + n + '"' + (s !== "in" ? ' data-stock="' + s + '"' : "") + ' aria-label="' + l + '" title="' + l + '" style="--c:' + esc(b.dataset.bg || "#555") + '">' + (t ? '<img src="' + esc(t.getAttribute("src")) + '" alt="">' : "") + "</button>";
    }).join("");
    markColour();
    sizes.innerHTML = P[st.k].sizes.map(function (z, i) {
      var o = SS.sizeStock && SS.sizeStock(st.k, i) === "out";
      return '<button type="button" role="radio" data-i="' + i + '"' + (o ? ' data-stock="out"' : "") + ' aria-label="' + esc(z[0] + ", " + z[1] + ", " + inr(z[3]) + (o ? ", out of stock" : "")) + '"><b>' + z[0] + "</b><small>" + inr(z[3]) + "</small></button>";
    }).join("");
    SS.radio(sizes, $$('[role="radio"]', sizes)[st.si]);
    label();
  }
  function markColour() {
    var b = $$$('[role="radio"]', sw).filter(function (x) { return x.dataset.n === st.c; })[0];
    if (!b) return;
    SS.radio(sw, b);
    sw.scrollLeft = b.offsetLeft - sw.clientWidth / 2 + b.offsetWidth / 2;
  }
  function setRange(k) {
    if (k === st.k || KS.indexOf(k) < 0) return;
    st.k = k; st.c = curColour(card(k));
    pickers(); loadRug();
  }
  function setColour(n) { if (!n) return; st.c = n; markColour(); label(); loadRug(); }
  /* A size drawn smaller than true scale so it fits the screen says so, so XL is never mistaken for M. */
  function shrunk() {
    if (st.kf < 0.995) { var z = P[st.k].sizes[st.si]; note(z[0] + " (" + z[1] + ") shown at " + Math.round(st.kf * 100) + "% so it fits on screen"); }
  }
  function setSize(i) {
    var o = st.si; if (i === o || !P[st.k].sizes[i]) return;
    st.si = i; SS.radio(sizes, $$('[role="radio"]', sizes)[i]); label();
    if (st.q && IN[o][0] !== IN[i][0]) { st.q = resized(st.q, o, i) || home(); commit(); shrunk(); }
  }

  /* ---------- Photo in, photo out ---------- */
  function drop(u) { if (u) try { URL.revokeObjectURL(u); } catch (e) {} }
  function release() {
    st.ptok++;
    photo.onload = photo.onerror = null; photo.removeAttribute("src");
    drop(st.url); st.url = null;
  }
  function fail(m) { step1(); err.textContent = m; }
  /* The previous picture stays up until the new one has decoded, then its URL is let go. */
  function show(url, keep) {
    var tok = ++st.ptok, old = st.url;
    st.url = url;
    photo.onload = function () {
      if (tok !== st.ptok) return;
      if (old !== url) drop(old);
      st.nat = [photo.naturalWidth, photo.naturalHeight];
      if (!st.nat[0] || !st.nat[1]) return fail("That photo would not open here. Try a JPG or PNG.");
      step2(keep);
    };
    photo.onerror = function () { if (tok !== st.ptok) return; if (old !== url) drop(old); fail("That photo would not open here. Try a JPG or PNG."); };
    photo.src = url;
  }
  /* A camera photo: an object URL straight into an <img>, which applies the EXIF rotation itself. */
  function fromFile(f) {
    if (!f) return;
    if (f.type && !/^image\//.test(f.type)) { err.textContent = "That file is not a photo. Choose a JPG or PNG."; return; }
    release(); st.proj = null;
    photo.alt = "Your photo";
    show(URL.createObjectURL(f));
  }
  function step1() {
    release(); st.q = null; st.nat = null; st.rect = null; st.proj = null;
    body.hidden = true; startEl.hidden = false; newBtn.hidden = true; err.textContent = "";
    desk();
  }
  function step2(keep) {
    var was = body.hidden;
    startEl.hidden = true; body.hidden = false; newBtn.hidden = false; err.textContent = "";
    floorsEl.hidden = !st.proj;
    if (st.proj) SS.radio(floorsEl, $('[data-f="' + st.floor + '"]', floorsEl));
    if (!keep) st.rect = null;
    layout();
    if (!keep || !st.q) { st.q = home(); shrunk(); }
    commit();
    if (was) { markColour(); try { rug.focus({ preventScroll: true }); } catch (e) {} }
  }

  /* ---------- The sample floor: a doorway drawn in true perspective ---------- */
  /* A phone held at standing height (60 in), tilted 52° down, 52° tall field of view; the door's sill is 48 in
     away. at(x, y, z) turns inches (x across, y up, z away along the floor) into canvas pixels. */
  function drawSample(kind, W, H) {
    var cv = doc.createElement("canvas"); cv.width = W; cv.height = H;
    var x = cv.getContext("2d"); if (!x) return null;
    var F = FLOORS[kind] || FLOORS.marble, cx = W / 2, cy = H / 2, Zw = 48, HC = 60;
    var tilt = 52 * Math.PI / 180, sn = Math.sin(tilt), cs = Math.cos(tilt), f = Math.max(W, H) / (2 * Math.tan(26 * Math.PI / 180));
    function at(px, py, z) { var d = -(py - HC) * sn + z * cs, u = (py - HC) * cs + z * sn; return [cx + f * px / d, cy - f * u / d]; }
    function pt(px, z) { return at(px, 0, z); }
    var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function shade(hex, a) {
      var n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(function (v) { return clamp(Math.round(v * (1 + a)), 0, 255); });
      return "rgb(" + c.join(",") + ")";
    }
    function poly(p, fill, stroke, lw) {
      x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (var i = 1; i < p.length; i++) x.lineTo(p[i][0], p[i][1]); x.closePath();
      if (fill) { x.fillStyle = fill; x.fill(); }
      if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw || 1.5; x.stroke(); }
    }
    function floorQ(x0, x1, z0, z1, fill, stroke, lw) { poly([pt(x0, z1), pt(x1, z1), pt(x1, z0), pt(x0, z0)], fill, stroke, lw); }
    function wallQ(x0, x1, y0, y1, fill, stroke, lw) { poly([at(x0, y1, Zw), at(x1, y1, Zw), at(x1, y0, Zw), at(x0, y0, Zw)], fill, stroke, lw); }
    /* wall, skirting, door frame, door with two panels and a handle */
    var yw = pt(0, Zw)[1], wg = x.createLinearGradient(0, 0, 0, yw);
    wg.addColorStop(0, "#EFE7DA"); wg.addColorStop(1, "#E0D5C3");
    x.fillStyle = wg; x.fillRect(0, 0, W, yw + 1);
    wallQ(-400, 400, 0, 4, "#D3C6B1");
    wallQ(-21, 21, 0, 90, "#5C3D29");
    wallQ(-17, 17, 0, 86, "#8E5F3C");
    wallQ(-13, 13, 6, 32, null, "rgba(60,36,20,.5)", 2);
    wallQ(-13, 13, 40, 80, null, "rgba(60,36,20,.5)", 2);
    var hp = at(12.5, 37, Zw); x.fillStyle = "#D9B76A"; x.beginPath(); x.arc(hp[0], hp[1], Math.max(3, W / 160), 0, 7); x.fill();
    /* floor tiles, from the wall toward the camera */
    x.fillStyle = F.c; x.fillRect(0, yw, W, H - yw);
    var xm = 80;
    if (kind === "wood") {
      for (var px = -xm, col = 0; px < xm; px += 6, col++) {
        for (var z1 = Zw + ((col * 17) % 40), z0; z1 > 6; z1 = z0) {   /* staggered 6 x 40 in planks */
          z0 = Math.max(z1 - 40, 6);
          if (z0 < Zw) floorQ(px, px + 6, z0, Math.min(z1, Zw), shade(F.c, rnd() * 0.16 - 0.08), F.g, 1.5);
        }
      }
    } else {
      var T = kind === "kota" ? 18 : 24, v = kind === "kota" ? 0.12 : 0.05;
      for (var tz = Zw; tz > 6; tz -= T) {
        for (var tx = -Math.ceil(xm / T) * T - T / 2; tx < xm; tx += T) {
          floorQ(tx, tx + T, Math.max(tz - T, 6), tz, shade(F.c, rnd() * v - v / 2), F.g, 2);
          if (kind === "marble") {   /* a faint vein across each tile */
            x.beginPath();
            for (var j = 0, v0 = rnd(); j <= 6; j++) {
              var p = pt(tx + T * j / 6, tz - T * clamp(0.15 + 0.35 * v0 + 0.4 * j / 6 + (rnd() - 0.5) * 0.12, 0.04, 0.96));
              if (j) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]);
            }
            x.strokeStyle = "rgba(150,138,120,.25)"; x.lineWidth = 1.2; x.stroke();
          }
        }
      }
    }
    floorQ(-21, 21, Zw - 2.5, Zw, "#D8CDBA", "rgba(0,0,0,.18)", 1.5);   /* the sill */
    /* light from the doorway, and a soft vignette like a phone photo */
    var lg = x.createRadialGradient(cx, yw, 0, cx, yw, H); lg.addColorStop(0, "rgba(255,246,228,.16)"); lg.addColorStop(1, "rgba(255,246,228,0)");
    x.fillStyle = lg; x.fillRect(0, 0, W, H);
    var vg = x.createRadialGradient(cx, H * 0.5, Math.min(W, H) * 0.45, cx, H * 0.5, Math.max(W, H) * 0.85); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.3)");
    x.fillStyle = vg; x.fillRect(0, 0, W, H);
    return { cv: cv, proj: { W: W, Zw: Zw, pt: pt } };
  }
  function sample(kind, keep) {
    kind = FLOORS[kind] ? kind : "marble";
    /* Drawn to the stage's shape so it fills it; the size is kept when only the floor changes. */
    var wasHidden = body.hidden;
    if (wasHidden) { startEl.hidden = true; body.hidden = false; }
    var W = 1000, H = keep && st.nat ? st.nat[1] : Math.round(W * clamp((stage.clientHeight || 600) / (stage.clientWidth || 400), 0.6, 1.9));
    var s = safe(function () { return drawSample(kind, W, H); });
    if (wasHidden) { body.hidden = true; startEl.hidden = false; }
    if (!s) { err.textContent = "The sample floor would not draw here."; return; }
    if (!keep) release();
    st.floor = kind; st.proj = s.proj;
    photo.alt = "Sample doorway with a " + FLOORS[kind].n.toLowerCase() + " floor";
    var tok = ++st.ptok;
    function go(u) { if (tok === st.ptok) show(u, keep); else drop(u); }
    if (s.cv.toBlob) s.cv.toBlob(function (b) { if (b) go(URL.createObjectURL(b)); else go(s.cv.toDataURL("image/jpeg", 0.9)); }, "image/jpeg", 0.9);
    else go(s.cv.toDataURL("image/jpeg", 0.9));
  }

  /* ---------- Open and close ---------- */
  function open(k, colour, o) {
    o = o || {};
    if (KS.indexOf(k) < 0) { k = KS[0]; colour = ""; }
    var cd = k && card(k); if (!cd || !P[k]) return;
    st.k = k; st.c = colour || curColour(cd);
    st.si = typeof o.size === "number" && P[k].sizes[o.size] ? o.size : curSize(cd);
    st.floor = FLOORS[o.floor] ? o.floor : "marble";
    st.opener = o.opener || doc.activeElement;
    pickers(); loadRug(); setLight(1); setClean(false); step1();
    if (!dlg.open) { try { dlg.showModal(); } catch (e) { dlg.setAttribute("open", ""); } }
    doc.documentElement.style.overflow = "hidden";
    var first = FINE.matches ? gal : cam;
    try { first.focus({ preventScroll: true }); } catch (e) {}
    if (!RM.matches && dlg.animate) dlg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
  }
  function close() { try { dlg.close(); } catch (e) { dlg.removeAttribute("open"); } }
  var toCart = false;
  dlg.addEventListener("close", function () {
    release(); st.q = null; st.nat = null; st.rect = null; st.proj = null;
    cam.value = ""; gal.value = "";
    toastEl.classList.remove("on");
    doc.documentElement.style.overflow = "";
    var o = st.opener; st.opener = null;
    cartBtn.hidden = true;
    if (toCart) { toCart = false; SS.openD("cart"); return; }
    if (o && o !== doc.body && o.focus && doc.contains(o)) try { o.focus({ preventScroll: true }); } catch (e) {}
  });
  $("#tryon-x", dlg).addEventListener("click", close);
  var cartBtn = $("#tryon-cart", dlg);
  cartBtn.addEventListener("click", function () { toCart = true; close(); });
  newBtn.addEventListener("click", function () { step1(); try { (FINE.matches ? gal : cam).focus({ preventScroll: true }); } catch (e) {} });
  [cam, gal].forEach(function (inp) {
    inp.addEventListener("change", function () { var f = inp.files && inp.files[0]; fromFile(f); inp.value = ""; });
  });
  $("#tryon-sample", dlg).addEventListener("click", function () { sample(st.floor); });
  floorsEl.addEventListener("click", function (e) { var b = e.target.closest("[data-f]"); if (b && b.dataset.f !== st.floor) sample(b.dataset.f, true); });
  SS.arrows(floorsEl, function (b) { sample(b.dataset.f, true); });
  /* A photo dropped anywhere on the dialog (desktop) */
  dlg.addEventListener("dragover", function (e) { if (e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") > -1) e.preventDefault(); });
  dlg.addEventListener("drop", function (e) { var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) { e.preventDefault(); fromFile(f); } });

  seg.addEventListener("click", function (e) { var b = e.target.closest("[data-k]"); if (b) setRange(b.dataset.k); });
  SS.arrows(seg, function (b) { setRange(b.dataset.k); });
  sw.addEventListener("click", function (e) { var b = e.target.closest("[data-n]"); if (b) setColour(b.dataset.n); });
  SS.arrows(sw, function (b) { setColour(b.dataset.n); });
  sizes.addEventListener("click", function (e) { var b = e.target.closest("[data-i]"); if (b) setSize(+b.dataset.i); });
  SS.arrows(sizes, function (b) { setSize(+b.dataset.i); });
  light.addEventListener("input", function () { setLight(light.value); });
  hide.addEventListener("click", function () { setClean(!stage.classList.contains("clean")); });
  /* Added from here, the dialog stays open; the page's own toast is behind it, so this one says so. */
  add.addEventListener("click", function () {
    var z = P[st.k].sizes[st.si];
    if (!buyable()) { if (SS.openAsk) SS.openAsk(st.k, st.c, st.si); return; }
    if (SS.addToCart(st.k, st.si, st.c, 1) === false) { note("Sorry, this one is out of stock right now"); label(); return; }
    var cnt = $("#cnt"), n = cnt ? parseInt(cnt.textContent, 10) || 0 : 0;
    note("Added " + st.c + ", " + z[0] + " · " + inr(z[3]) + (n ? ". Cart: " + n + (n === 1 ? " item" : " items") : ""));
    cartBtn.hidden = false;
  });

  /* ---------- Moving the rug: corners, body, pinch, wheel, keys ---------- */
  function corner(i, x, y) {
    var q = st.q.map(cp);
    q[i] = [clamp(x, MX, st.sw - MX), clamp(y, M, st.sh - M)];
    if (ok(q)) { st.q = q; st.kf = 1; }   /* a corner that would fold the rug stays where it was */
  }
  function shift(q0, dx, dy) {
    var xs = q0.map(function (p) { return p[0]; }), ys = q0.map(function (p) { return p[1]; });
    var a = MX - Math.min.apply(null, xs), b = st.sw - MX - Math.max.apply(null, xs), c = M - Math.min.apply(null, ys), d = st.sh - M - Math.max.apply(null, ys);
    dx = a > b ? 0 : clamp(dx, a, b); dy = c > d ? 0 : clamp(dy, c, d);
    st.q = q0.map(function (p) { return [p[0] + dx, p[1] + dy]; });
  }
  /* Scale and turn about the rug's centre; at the stage edge it backs off to the furthest step that fits. */
  function turn(g, s, r) {
    s = clamp(s, 0.2, 5);
    for (var t = 1; t > 0.02; t /= 2) {
      var s2 = g.s + (s - g.s) * t, r2 = g.r + (r - g.r) * t, q = sim(g.q0, g.c, s2, r2);
      if (ok(q)) { st.q = q; g.s = s2; g.r = r2; st.kf = 1; return; }
    }
  }
  var pts = {}, g = null, sr = null, wt = 0;
  function fingers() { return Object.keys(pts).map(function (id) { return pts[id]; }); }
  function loc(e) { return [e.clientX - sr.left, e.clientY - sr.top]; }
  function angle(a) { return Math.atan2(a[1].y - a[0].y, a[1].x - a[0].x); }
  stage.addEventListener("pointerdown", function (e) {
    if (!st.q || (e.pointerType === "mouse" && e.button !== 0) || e.target.closest(".tfloors")) return;
    sr = stage.getBoundingClientRect();
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    try { stage.setPointerCapture(e.pointerId); } catch (x) {}
    var a = fingers(), p = loc(e), h = e.target.closest(".thandle");
    if (a.length === 1) {
      if (h) { var i = +h.dataset.i; g = { m: "c", i: i, ox: st.q[i][0] - p[0], oy: st.q[i][1] - p[1] }; }
      else if (e.target.closest(".trug")) g = { m: "m", x: p[0], y: p[1], q0: st.q.map(cp) };
      else g = null;
    } else if (a.length === 2) {
      g = { m: "p", q0: st.q.map(cp), c: mid(st.q), d0: Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y) || 1, a0: angle(a), s: 1, r: 0 };
    }
    stage.classList.toggle("drag", !!g && g.m !== "x");
  });
  stage.addEventListener("pointermove", function (e) {
    if (!pts[e.pointerId]) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (!g || !st.q) return;
    var p = loc(e);
    if (g.m === "c") corner(g.i, p[0] + g.ox, p[1] + g.oy);
    else if (g.m === "m") shift(g.q0, p[0] - g.x, p[1] - g.y);
    else if (g.m === "p") {
      var a = fingers(); if (a.length < 2) return;
      var r = angle(a) - g.a0;
      if (r > Math.PI) r -= 2 * Math.PI; else if (r < -Math.PI) r += 2 * Math.PI;
      turn(g, Math.hypot(a[1].x - a[0].x, a[1].y - a[0].y) / g.d0, r);
    }
    render();
  });
  function up(e) {
    if (!pts[e.pointerId]) return;
    delete pts[e.pointerId];
    if (g && g.m === "p" && fingers().length < 2) g = { m: "x" };   /* pinch over: wait for every finger to lift */
    if (!fingers().length) { g = null; stage.classList.remove("drag"); commit(); }
  }
  stage.addEventListener("pointerup", up);
  stage.addEventListener("pointercancel", up);
  stage.addEventListener("wheel", function (e) {
    if (!st.q) return;
    e.preventDefault();
    turn({ q0: st.q.map(cp), c: mid(st.q), s: 1, r: 0 }, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), 0);
    render(); clearTimeout(wt); wt = setTimeout(commit, 160);
  }, { passive: false });
  /* Keys: arrows nudge the focused corner, or the whole rug when it has focus (Shift for 16px); +/- resize it. */
  stage.addEventListener("keydown", function (e) {
    if (!st.q || e.ctrlKey || e.metaKey || e.altKey) return;
    var h = e.target.closest(".thandle"), onRug = e.target === rug;
    if (!h && !onRug) return;
    var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key], z = { "+": 1.06, "=": 1.06, "-": 1 / 1.06, "_": 1 / 1.06 }[e.key];
    if (d) {
      var s = e.shiftKey ? 16 : 4, i = h ? +h.dataset.i : -1;
      if (h) corner(i, st.q[i][0] + d[0] * s, st.q[i][1] + d[1] * s); else shift(st.q.map(cp), d[0] * s, d[1] * s);
    } else if (z && onRug) turn({ q0: st.q.map(cp), c: mid(st.q), s: 1, r: 0 }, z, 0);
    else return;
    e.preventDefault(); commit();
  });
  var rq = 0;
  if (window.ResizeObserver) new ResizeObserver(function () { cancelAnimationFrame(rq); rq = requestAnimationFrame(layout); }).observe(stage);
  else window.addEventListener("resize", layout);

  /* ---------- Entry points ---------- */
  function goButton(cls, html, onClick) {
    var b = doc.createElement("button");
    b.type = "button"; b.className = cls; b.setAttribute("aria-haspopup", "dialog"); b.innerHTML = html;
    b.addEventListener("click", function () { safe(function () { onClick(b); }); });
    return b;
  }
  /* 1. On each Zigzag and Solid rug panel, bottom-left */
  safe(function () {
    KS.forEach(function (k) {
      var cd = card(k), pic = cd && $(".pic", cd); if (!pic) return;
      pic.appendChild(goButton("tgo", DOOR + "<span>See it at your door</span>", function (b) { open(k, curColour(cd), { opener: b }); }));
    });
  });
  /* 3. In the fit tool, beside its Add button: the suggested range and colour, the size and floor on show */
  safe(function () {
    var fa = $("#fit-add"); if (!fa) return;
    fa.parentNode.insertBefore(goButton("pill ringp tfit", CAM + "Try it on a photo of your floor", function (b) {
      var fs = $('#fsizes [aria-checked="true"]'), fl = $('#floors [aria-checked="true"]');
      open(fa.dataset.k === "sol" ? "sol" : "zig", fa.dataset.c || "", { size: fs ? SS.SIZEIDX[fs.dataset.fs] : undefined, floor: fl && fl.dataset.floor, opener: b });
    }), fa.nextSibling);
  });
  /* 2. The #zoom viewer (shop.js) shows its own button and calls this. */
  SS.tryon = function (k, colour, o) { safe(function () { open(k, colour, o); }); };
})();
