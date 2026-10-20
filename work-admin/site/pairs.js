/* Soft Steps — "Colours that go together": door + bath pairs, added to the cart in one tap. */
(function () {
  "use strict";
  var SS = window.SS, box = document.getElementById("pairs-list");
  if (!SS || !box) return;
  var P = SS.P, inr = SS.inr, esc = SS.esc;
  var SHORT = { zig: "Zigzag", sol: "Solid Premium", chen: "Chenille" };
  /* [title, why, [range, colour, size] for the door, then the same for the bath] */
  var PAIRS = [
    ["Calm blues", "Deep navy at the door, clear aqua by the bath. One family, two moods.", ["zig", "Navy & cream", "L"], ["sol", "Aqua", "M"]],
    ["Green & rust", "Opposites on the colour wheel, so each makes the other look richer.", ["chen", "Forest green stripe", "L"], ["sol", "Rust", "M"]],
    ["Blue & mustard", "The classic bright pair. Bold at the door, sunny in the bathroom.", ["sol", "Royal blue", "L"], ["chen", "Mustard stripe", "M"]],
    ["Warm earth", "Cocoa and gold, the warm browns of tea and jaggery.", ["zig", "Cocoa & cream", "L"], ["chen", "Mustard stripe", "M"]],
    ["Soft rose", "Blush pink brings warmth; plain grey keeps it calm.", ["zig", "Blush pink & black", "L"], ["sol", "Grey", "M"]],
    ["Olive & burnt orange", "Earthy olive with a deep mustard. Made for wooden doors.", ["zig", "Olive & cream", "L"], ["sol", "Mustard", "M"]],
    ["Berry & grey", "A rich berry stripe, steadied by grey and black.", ["chen", "Berry stripe", "L"], ["zig", "Grey & black", "M"]],
    ["Quiet neutrals", "Black, grey and beige suit any floor and any wall.", ["zig", "Black & beige", "L"], ["sol", "Black", "M"]]
  ];
  var ROLE = ["Door", "Bath"];

  function size(it) { return P[it[0]].sizes[SS.SIZEIDX[it[2]]]; }
  function bg(it) { var b = SS.swatch(it[0], it[1]); return b ? b.dataset.bg : "#E8DDCB"; }
  /* Chenille colourway rects in the 1200x1801 photo (same as features.js); the pair thumb fills
     its square with the middle of the mat, inside the binding. */
  var RECTS = [[83,142,507,257],[612,142,512,257],[83,411,507,272],[612,411,512,272],[83,694,507,278],[612,694,512,278],[83,985,507,294],[612,985,512,294],[83,1293,507,298],[612,1293,512,298]];
  function chenCrop(c) {
    var bs = Array.prototype.slice.call(document.querySelectorAll('.prod[data-k="chen"] [data-n]')), i = 0;
    bs.forEach(function (b, j) { if (b.dataset.n === c) i = b.hasAttribute("data-ci") ? +b.getAttribute("data-ci") : j; });
    var r = RECTS[i], k = 1 / (r[3] * 0.78), cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
    var src = window.SSIMG ? SSIMG.map("img/chen.jpg") : "img/chen.jpg";
    return "background-image:url(" + src + ");background-size:" + (1200 * k * 100).toFixed(2) + "% auto;background-position:" +
      ((0.5 - cx * k) / (1 - 1200 * k) * 100).toFixed(2) + "% " + ((0.5 - cy * k) / (1 - 1801 * k) * 100).toFixed(2) + "%";
  }
  function thumb(it) {
    if (it[0] === "chen") return '<span class="lthumb" style="--c:' + esc(bg(it)) + ";" + chenCrop(it[1]) + '"></span>';
    return SS.lineThumb ? SS.lineThumb(it[0], it[1]) : '<span class="lthumb" style="--c:' + esc(bg(it)) + '"></span>';
  }

  /* Only pairs the shop can sell right now: a colour the owner hid or marked out of stock (or a size out) drops
     its pair, and the section goes when none are left. Buttons keep their PAIRS index. */
  function ok(it) { return SS.canBuy ? SS.canBuy(it[0], it[1], SS.SIZEIDX[it[2]]) : !!SS.swatch(it[0], it[1]); }
  var live = PAIRS.map(function (p, i) { return ok(p[2]) && ok(p[3]) ? i : -1; }).filter(function (i) { return i >= 0; });
  if (!live.length) { var sec = document.getElementById("pairs"); if (sec) sec.hidden = true; return; }
  box.innerHTML = live.map(function (i) { var p = PAIRS[i];
    var a = p[2], b = p[3], total = size(a)[3] + size(b)[3];
    var rows = [a, b].map(function (it, j) {
      var z = size(it);
      return '<li><span class="pr">' + ROLE[j] + '</span><span class="pn"><b>' + esc(it[1]) + '</b> ' + SHORT[it[0]] + " · " + z[0] + " " + z[1].replace(" in", "") + '</span><span class="pp">' + inr(z[3]) + "</span></li>";
    }).join("");
    return '<li class="pair" style="--a:' + esc(bg(a)) + ";--b:" + esc(bg(b)) + '">' +
      '<div class="pv" aria-hidden="true"><span class="t1">' + thumb(a) + '</span><span class="t2">' + thumb(b) + "</span></div>" +
      '<h3 class="disp" id="pair-' + i + '">' + esc(p[0]) + "</h3><p>" + esc(p[1]) + "</p>" +
      '<ul class="pl">' + rows + "</ul>" +
      '<button type="button" class="pill" data-pair="' + i + '" aria-describedby="pair-' + i + '">Add both · ' + inr(total) + ' <span class="chev" aria-hidden="true">›</span></button></li>';
  }).join("");

  box.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-pair]");
    if (!btn) return;
    var p = PAIRS[+btn.dataset.pair];
    if (!ok(p[2]) || !ok(p[3])) { SS.toast("Sorry, this one is out of stock right now"); return; }
    [p[2], p[3]].forEach(function (it) { SS.addToCart(it[0], SS.SIZEIDX[it[2]], it[1], 1); });
    SS.toast("Added both mats");
    btn.classList.add("done");
    setTimeout(function () { btn.classList.remove("done"); }, 1200);
  });
})();
