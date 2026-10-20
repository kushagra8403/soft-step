/* Soft Steps — small, isolated tactile effects.
   No libraries, no network calls, no changes to cart or payment state. */
(function () {
  "use strict";
  var W = window, D = document, SS = W.SS;
  if (!SS || !D.querySelector) return;
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  var RM = safeMQ("(prefers-reduced-motion: reduce)");
  var PHONE = safeMQ("(max-width: 620px)");
  var MOTION = safeMQ("(prefers-reduced-motion: no-preference)");
  var EOUT = "cubic-bezier(.22,.8,.2,1)";
  var EINT = "cubic-bezier(.5,0,.75,0)";
  var EDYE = "cubic-bezier(.7,0,.2,1)";
  var timers = [];
  function safeMQ(q) { try { return W.matchMedia(q); } catch (e) { return { matches: false, addEventListener: function () {} }; } }
  function motion() { return !RM.matches && typeof Element.prototype.animate === "function"; }
  function idle(fn) { try { if (W.requestIdleCallback) W.requestIdleCallback(fn, { timeout: 700 }); else setTimeout(fn, 80); } catch (e) { setTimeout(fn, 80); } }
  function on(name, fn) { try { if (typeof W.SSFX_on === "function") W.SSFX_on(name, fn); } catch (e) {} }
  function element(tag, cls) { var e = D.createElement(tag); if (cls) e.className = cls; return e; }
  function svgEl(tag) { return D.createElementNS("http://www.w3.org/2000/svg", tag); }
  function listenMq(m, fn) { try { m.addEventListener("change", fn); } catch (e) { try { m.addListener(fn); } catch (x) {} } }
  function visible(el, ratio) {
    if (!el || !el.getBoundingClientRect) return false;
    var r = el.getBoundingClientRect(), h = W.innerHeight || D.documentElement.clientHeight;
    var overlap = Math.max(0, Math.min(r.bottom, h) - Math.max(r.top, 0));
    return r.height > 0 && overlap / r.height >= (ratio || 0.5);
  }
  function near(el, fn, margin) {
    if (!el) return function () {};
    if (!("IntersectionObserver" in W)) { idle(fn); return function () {}; }
    var done = false, io;
    io = new IntersectionObserver(function (entries) {
      if (done || !entries.some(function (e) { return e.isIntersecting; })) return;
      done = true; io.disconnect(); fn();
    }, { rootMargin: margin || "600px 0px" });
    io.observe(el);
    return function () { done = true; try { io.disconnect(); } catch (e) {} };
  }
  function injectCss(css) {
    try { var st = element("style"); st.setAttribute("data-softsteps-wow", ""); st.textContent = css; D.head.appendChild(st); } catch (e) {}
  }
  injectCss([
    ":root{--wow-cord:var(--mitti);--wow-peg:var(--kora-2);--wow-peg-hi:var(--edge);--wow-dust:var(--mitti);--wow-dot:var(--mitti);--wow-loop:var(--kumkum);--wow-petal:var(--haldi);--wow-foot:var(--neel);--wow-damp:color-mix(in srgb,var(--neel) 27%,transparent);--wow-bead:var(--chalk);--wow-lit:var(--chalk);--wow-shade:var(--night)}",
    "@media(max-width:620px){#pairs-list{padding-top:24px!important;margin-top:-20px!important;overflow-y:hidden;background:linear-gradient(var(--wow-cord),var(--wow-cord)) 0 10px/100% 1.5px repeat-x;background-attachment:local}#pairs-list::after{content:'';flex:0 0 12px}#pairs-list>.pair{position:relative;transform-origin:50% -10px}#pairs-list>.pair::before{content:'';position:absolute;left:calc(50% - 4px);top:-15px;width:8px;height:22px;border-radius:3px;z-index:1;pointer-events:none;background:linear-gradient(90deg,transparent 3.25px,var(--wow-peg-hi) 3.25px 4.75px,transparent 4.75px),var(--wow-peg);box-shadow:0 1px 1px color-mix(in srgb,var(--kajal) 18%,transparent)}}",
    ".wow-nap{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;border-radius:var(--rr,10px);-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:0 0;mask-position:0 0}",
    ".wow-hint{position:absolute;left:12px;bottom:12px;z-index:3;display:inline-flex;align-items:center;gap:8px;min-height:32px;padding:0 12px;border-radius:999px;background:var(--glass);box-shadow:inset 0 0 0 1px var(--ring35);color:var(--fg);font:600 13px/1 var(--text);pointer-events:none;opacity:0;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}.wow-hint svg{width:18px;height:10px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round}.wow-hint.on{opacity:1}@media(prefers-reduced-motion:no-preference){.wow-hint{transition:opacity .24s var(--e-out)}}@media(min-width:861px){.wow-hint{left:20px;bottom:20px}}",
    ".wow-sole{fill:var(--wow-dust);opacity:0;pointer-events:none}",
    ".wow-print{position:absolute;inset:0;pointer-events:none;background:none;transform:translateZ(71px);will-change:auto}",
    ".wow-foot{position:absolute;left:var(--x,52%);top:var(--y,56%);width:20%;aspect-ratio:2/3;translate:-50% -50%;rotate:-8deg;background:var(--wow-damp);opacity:0;-webkit-mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-1 -1 12 18'%3E%3Cellipse cx='5' cy='10.5' rx='3.2' ry='5'/%3E%3Ccircle cx='2.2' cy='3.4' r='1.1'/%3E%3Ccircle cx='4.3' cy='2.3' r='1.1'/%3E%3Ccircle cx='6.4' cy='2.6' r='1'/%3E%3Ccircle cx='8.1' cy='3.9' r='.9'/%3E%3C/svg%3E\") center/contain no-repeat;mask:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-1 -1 12 18'%3E%3Cellipse cx='5' cy='10.5' rx='3.2' ry='5'/%3E%3Ccircle cx='2.2' cy='3.4' r='1.1'/%3E%3Ccircle cx='4.3' cy='2.3' r='1.1'/%3E%3Ccircle cx='6.4' cy='2.6' r='1'/%3E%3Ccircle cx='8.1' cy='3.9' r='.9'/%3E%3C/svg%3E\") center/contain no-repeat}",
    ".wow-drop{position:absolute;width:3.2%;aspect-ratio:1;border-radius:50%;translate:-50% -50%;opacity:0;background:radial-gradient(circle at 35% 30%,var(--wow-bead) 0 22%,color-mix(in srgb,var(--wow-bead) 35%,transparent) 45%,transparent 72%)}",
    ".wow-tap{position:absolute;left:0;bottom:6px;margin:0;font:500 14px/1.3 var(--text);color:var(--mitti);opacity:0;pointer-events:none}.wow-tap.on{opacity:1}@media(prefers-reduced-motion:no-preference){.wow-tap{transition:opacity .24s var(--e-out)}}",
    "#sentbox.wow-has-rg{grid-template-columns:64px minmax(0,1fr);column-gap:14px;align-items:start}#sentbox.wow-has-rg>.wow-rg{grid-area:1/1;margin:0;width:64px;height:64px}#sentbox.wow-has-rg>.wow-wb{grid-area:2/1;margin:-6px 0 0}#sentbox.wow-has-rg>p:not(.wow-wb){grid-area:1/2/3/3}#sentbox.wow-has-rg>#newcart{grid-area:3/1/4/3;justify-self:start}.wow-rg svg{display:block;width:64px;height:64px;overflow:visible}.wow-rg .d{fill:var(--wow-dot)}.wow-rg .lp{fill:none;stroke:var(--wow-loop);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.wow-rg .pt{fill:var(--wow-petal)}.wow-rg .ft{fill:var(--wow-foot)}.wow-rg .d,.wow-rg .pt,.wow-rg .ft{transform-box:fill-box;transform-origin:center}.wow-wb{font:italic 400 14px/1.25 var(--display);font-variation-settings:var(--fvs);color:var(--kajal);text-align:center;overflow-wrap:anywhere;visibility:hidden}#sentbox.wow-welcomed .wow-wb{visibility:visible}"
  ].join("\n"));

  /* W1 — low-resolution normal field, masked to the actual Solid rug image. */
  (function brushPile() {
    var card = $("#r-sol"), pic = $("#r-sol .pic"), plane = $("#r-sol .plane"), img = $("#r-sol .pic .plane img");
    if (!card || !pic || !plane || !img) return;
    var canvas = null, ctx = null, imageData = null, normals = null, raf = 0, active = false, pressed = false;
    var last = null, lastInput = 0, hint = null, tint = { lit:[251,247,240], shade:[20,27,54] }, lastDraw = 0;
    var NX = 48, NY = 40, R = 4.5, RESTX = 0, RESTY = 1, LX = .94, LY = -.34, S0 = -.34;
    function parseRgb(s, fallback) {
      var m = String(s || "").match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i);
      if (m) return [Math.round(+m[1]),Math.round(+m[2]),Math.round(+m[3])];
      m = String(s || "").match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (!m) return fallback;
      var h=m[1]; if(h.length===3)h=h.split("").map(function(c){return c+c;}).join("");
      return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
    }
    function colours() {
      var cs=getComputedStyle(card);
      tint.lit=parseRgb(cs.getPropertyValue("--wow-lit"),[251,247,240]);
      tint.shade=parseRgb(cs.getPropertyValue("--wow-shade"),[20,27,54]);
    }
    function setMask() {
      if (!canvas) return;
      var src=img.currentSrc||img.src||"";
      if (src) {
        canvas.style.webkitMaskImage='url("'+src.replace(/["\\]/g,"")+'")';
        canvas.style.maskImage=canvas.style.webkitMaskImage;
      }
      colours();
    }
    function makeCanvas() {
      if (canvas) return;
      canvas=element("canvas","wow-nap");canvas.width=NX;canvas.height=NY;canvas.setAttribute("aria-hidden","true");
      ctx=canvas.getContext("2d",{alpha:true}); if(!ctx){canvas=null;return;}
      imageData=ctx.createImageData(NX,NY);normals=new Float32Array(NX*NY*2);
      for(var i=0;i<NX*NY;i++){normals[i*2]=RESTX;normals[i*2+1]=RESTY;}
      var sheen=$(".sheen",plane); plane.insertBefore(canvas,sheen||null);setMask();
      img.addEventListener("load",setMask);
      if(!hint){
        hint=element("span","wow-hint");hint.innerHTML='<svg viewBox="0 0 24 12" aria-hidden="true"><path d="M2 6h17m-5-4 5 4-5 4"/></svg><span>Stroke the pile</span>';
        hint.setAttribute("aria-hidden","true");pic.appendChild(hint);
        try { if(W.SSLANG&&W.SSLANG.get()!=="en")translateHint(); }catch(e){}
      }
    }
    function translateHint(){try{var code=W.SSLANG.get(),d=W.SSI18N&&W.SSI18N[code];if(d&&d.text&&d.text["Stroke the pile"])hint.lastChild.textContent=d.text["Stroke the pile"];}catch(e){}}
    function resetField() {
      if (!normals) return;
      for(var i=0;i<NX*NY;i++){normals[i*2]=RESTX;normals[i*2+1]=RESTY;}
      if(ctx)ctx.clearRect(0,0,NX,NY);
      if(raf){cancelAnimationFrame(raf);raf=0;}
      last=null;active=false;pressed=false;lastDraw=0;
    }
    function push(x,y,dx,dy) {
      var len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;
      var cx=x*NX,cy=y*NY,rr=R*R;
      for(var yy=Math.max(0,Math.floor(cy-R));yy<Math.min(NY,Math.ceil(cy+R));yy++){
        for(var xx=Math.max(0,Math.floor(cx-R));xx<Math.min(NX,Math.ceil(cx+R));xx++){
          var vx=xx+.5-cx,vy=yy+.5-cy,dist2=vx*vx+vy*vy;if(dist2>rr)continue;
          var w=.85*Math.pow(1-Math.sqrt(dist2)/R,2),n=(yy*NX+xx)*2;
          normals[n]+=(dx-normals[n])*w;normals[n+1]+=(dy-normals[n+1])*w;
          var nl=Math.hypot(normals[n],normals[n+1])||1;normals[n]/=nl;normals[n+1]/=nl;
        }
      }
      active=true;lastInput=performance.now();schedule();
    }
    function strokeTo(e) {
      if(!canvas||!normals)return;
      var r=img.getBoundingClientRect(),x=(e.clientX-r.left)/(r.width||1),y=(e.clientY-r.top)/(r.height||1);
      if(x<0||x>1||y<0||y>1)return;
      var evs=[];try{evs=e.getCoalescedEvents?e.getCoalescedEvents():[]}catch(xe){}
      if(!evs.length)evs=[e];
      evs.forEach(function(ev){
        var xx=(ev.clientX-r.left)/(r.width||1),yy=(ev.clientY-r.top)/(r.height||1);
        if(!last){last={x:xx,y:yy};return;}
        var dx=xx-last.x,dy=yy-last.y,dist=Math.hypot(dx*NX,dy*NY);
        if(dist<.2)return;
        var steps=Math.max(1,Math.ceil(dist/.75));
        for(var j=1;j<=steps;j++)push(last.x+dx*j/steps,last.y+dy*j/steps,dx,dy);
        last={x:xx,y:yy};
      });
      if(hint)hint.classList.remove("on");
      try{localStorage.setItem("ss_wow_nap","1")}catch(e){}
    }
    function draw() {
      if(!ctx||!imageData||!normals)return;
      var a=imageData.data,settled=true,maxDelta=0;
      for(var i=0;i<NX*NY;i++){
        var nx=normals[i*2],ny=normals[i*2+1],d=(nx*LX+ny*LY)/(Math.hypot(nx,ny)||1)-S0,alpha=0,col=tint.lit;
        if(d>.02){alpha=.26*Math.min(1,d/1.1);col=tint.lit;}
        else if(d<-.02){alpha=.18*Math.min(1,-d/.6);col=tint.shade;}
        if(card.dataset.tone==="light"){if(d>.02){alpha=.14*Math.min(1,d/1.1);col=tint.lit;}else if(d<-.02){alpha=.24*Math.min(1,-d/.6);col=tint.shade;}}
        var p=i*4;a[p]=col[0];a[p+1]=col[1];a[p+2]=col[2];a[p+3]=Math.round(Math.max(0,Math.min(1,alpha))*255);
        maxDelta=Math.max(maxDelta,Math.hypot(nx-RESTX,ny-RESTY));
      }
      ctx.putImageData(imageData,0,0);return maxDelta;
    }
    function frame(now) {
      raf=0;if(!active||!ctx)return;
      var dt=Math.max(0,Math.min(48,now-lastDraw||16));lastDraw=now;
      if(now-lastInput>300){
        if(RM.matches){resetField();return;}
        var blend=1-Math.exp(-dt/900);
        for(var i=0;i<NX*NY;i++){var p=i*2;normals[p]+=(RESTX-normals[p])*blend;normals[p+1]+=(RESTY-normals[p+1])*blend;}
      }
      var delta=draw();
      if(now-lastInput>300 && delta<.03){resetField();return;}
      schedule();
    }
    function schedule(){if(!raf)raf=requestAnimationFrame(frame);}
    function begin(e) {
      if(!canvas){makeCanvas();if(!canvas)return;}
      if(img.currentSrc&&canvas.style.maskImage.indexOf(img.currentSrc)<0)setMask();
      if(e.pointerType==="mouse") { if(!last)last={x:(e.clientX-img.getBoundingClientRect().left)/(img.clientWidth||1),y:(e.clientY-img.getBoundingClientRect().top)/(img.clientHeight||1)}; strokeTo(e); return; }
      pressed=true;last=null;strokeTo(e);
    }
    img.addEventListener("pointerenter",function(e){if(e.pointerType==="mouse")begin(e);});
    img.addEventListener("pointerdown",function(e){if(e.pointerType!=="mouse"){begin(e);try{img.setPointerCapture(e.pointerId)}catch(x){}}});
    img.addEventListener("pointermove",function(e){if(e.pointerType==="mouse"||pressed)strokeTo(e);});
    function end(e){if(e&&e.pointerType==="mouse"&&!RM.matches){pressed=false;lastInput=performance.now();schedule();return;}pressed=false;last=null;if(RM.matches)resetField();else{lastInput=performance.now();schedule();}}
    img.addEventListener("pointerup",end);img.addEventListener("pointercancel",end);
    img.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse"){pressed=false;last=null;lastInput=performance.now();schedule();}});
    on("picked",function(el,k,b,ready){if(k!=="sol"||el!==card)return;resetField();if(canvas)ctx.clearRect(0,0,NX,NY);if(hint)hint.classList.remove("on");if(ready){if(img.complete)setMask();else img.addEventListener("load",setMask,{once:true});}});
    try{
      new IntersectionObserver(function(entries,io){if(!entries.some(function(e){return e.isIntersecting&&e.intersectionRatio>=.6;}))return;io.disconnect();if(localStorage.getItem("ss_wow_nap"))return;setTimeout(function(){if(visible(pic,.6)&&hint&&!active){hint.classList.add("on");setTimeout(function(){if(hint)hint.classList.remove("on");},5000);try{localStorage.setItem("ss_wow_nap","1")}catch(e){}}},900);},{threshold:[.6]}).observe(pic);
    }catch(e){}
    listenMq(RM,function(){if(RM.matches)resetField();translateHint();});
    var langObserver=new MutationObserver(function(){translateHint();});try{langObserver.observe(D.documentElement,{attributes:true,attributeFilter:["lang"]});}catch(e){}
  })();

  /* W2 — washing line: velocity-driven, damped card rotation only on narrow viewports. */
  (function clothesline() {
    var list=$("#pairs-list");if(!list)return;
    var active=false,ioNear=null,raf=0,lastScroll=0,lastTime=0,vel=0,target=0,lastFrame=0;
    var cards=[],visibleCards=new Set();
    function clear(){
      if(raf)cancelAnimationFrame(raf);raf=0;active=false;vel=target=0;lastScroll=0;lastTime=lastFrame=0;
      cards.forEach(function(c){c.el.style.removeProperty("rotate");c.el.style.removeProperty("will-change");c.a=0;c.v=0;});
      visibleCards.clear();
    }
    function measure(){cards=$$(".pair",list).map(function(el,i){return {el:el,i:i,a:0,v:0,w:2*Math.PI*1.05*[1,.94,1.07][i%3],z:.32};});}
    function start(){
      if(active||!PHONE.matches||RM.matches)return;active=true;measure();
      if("IntersectionObserver" in W){ioNear=new IntersectionObserver(function(es){es.forEach(function(e){var c=cards.filter(function(x){return x.el===e.target;})[0];if(!c)return;if(e.isIntersecting)visibleCards.add(c);else{visibleCards.delete(c);c.el.style.removeProperty("rotate");c.el.style.removeProperty("will-change");}});},{root:list,threshold:.01});cards.forEach(function(c){ioNear.observe(c.el);});}
      list.addEventListener("scroll",scroll,{passive:true});listenMq(PHONE,refresh);listenMq(RM,refresh);
    }
    function scroll(){var now=performance.now(),left=list.scrollLeft,dt=Math.max(1,now-lastTime);if(lastTime){var vn=(left-lastScroll)/dt;vel=.6*vel+.4*vn;}lastScroll=left;lastTime=now;target=Math.max(-3.5,Math.min(3.5,-1.4*vel));if(!raf)raf=requestAnimationFrame(frame);}
    function frame(now){
      raf=0;if(!active||D.hidden)return;
      if(now-lastTime>=80)target=0;
      var dt=Math.min(.032,Math.max(.001,(now-(lastFrame||now-16))/1000)),sub=Math.max(1,Math.ceil(dt/.016)),step=dt/sub,settled=true;
      for(var s=0;s<sub;s++)cards.forEach(function(c){c.v+=(-c.w*c.w*(c.a-target)-2*c.z*c.w*c.v)*step;c.a+=c.v*step;});
      cards.forEach(function(c){if(!visibleCards.has(c))return;if(Math.abs(c.a)>.03||Math.abs(c.v)>.05){settled=false;var rot=c.a.toFixed(2)+"deg";if(c.el.style.rotate!==rot){c.el.style.rotate=rot;c.el.style.willChange="rotate";}}else{c.a=0;c.v=0;c.el.style.removeProperty("rotate");c.el.style.removeProperty("will-change");}});
      lastFrame=now;
      if(settled&&now-lastTime>150){clear();return;}
      raf=requestAnimationFrame(frame);
    }
    function refresh(){if(!PHONE.matches||RM.matches){clear();if(ioNear)ioNear.disconnect();list.removeEventListener("scroll",scroll);return;}clear();start();}
    near(list,start,"300px 0px");
    D.addEventListener("visibilitychange",function(){if(D.hidden)clear();else if(PHONE.matches&&!RM.matches&&visible(list,.01))start();});
    listenMq(PHONE,refresh);listenMq(RM,refresh);
  })();

  /* W3 — chappals step aside and bare feet land on the existing measured plan. */
  (function chappalsOff() {
    var fit=$("#fit"),svg=$(".plan svg",fit),ch=$("#chappals",fit),feet=$("#feet",fit),mat=$("#matR",fit),matH=$("#matH",fit),spotText=$("#spotlbl");
    if(!fit||!svg||!ch||!feet||!mat)return;
    var ready=false,planVisible=false,firstPlayed=false,lastSpot=null,walk=null,chInner=null,ftInner=null,prints=null,allAnims=[];
    function make(){
      if(ready||RM.matches||typeof Element.prototype.animate!=="function")return;
      ready=true;
      chInner=svgEl("g");chInner.setAttribute("class","wow-ch");while(ch.firstChild)chInner.appendChild(ch.firstChild);ch.appendChild(chInner);
      ftInner=svgEl("g");ftInner.setAttribute("class","wow-ft");while(feet.firstChild)ftInner.appendChild(feet.firstChild);feet.appendChild(ftInner);
      walk=svgEl("g");walk.setAttribute("class","wow-walk");walk.setAttribute("aria-hidden","true");
      for(var i=0;i<12;i++){
        var rect=svgEl("rect");rect.setAttribute("class","wow-sole");rect.setAttribute("x",i%2?42.4:38);rect.setAttribute("y",12+Math.floor(i/2)*4.6);rect.setAttribute("width","3.6");rect.setAttribute("height","9.5");rect.setAttribute("rx","1.8");
        rect.setAttribute("transform",i%2?"rotate(6 44.2 20)":"rotate(-6 39.8 20)");walk.appendChild(rect);
      }
      svg.insertBefore(walk,ch);
    }
    function finishAll(){
      allAnims.forEach(function(a){try{a.cancel();}catch(e){}});allAnims=[];
      if(chInner){chInner.style.removeProperty("transform");chInner.style.removeProperty("opacity");}
      if(ftInner){ftInner.style.removeProperty("transform");ftInner.style.removeProperty("opacity");}
      if(prints)prints.forEach(function(p){p.style.opacity="0";});
      if(walk)while(walk.firstChild)walk.removeChild(walk.firstChild);
    }
    function animate(el,frames,opts){try{var a=el.animate(frames,Object.assign({fill:"both"},opts||{}));allAnims.push(a);a.finished.then(function(){var i=allAnims.indexOf(a);if(i>=0)allAnims.splice(i,1);}).catch(function(){});return a;}catch(e){return null;}}
    function play(short){
      if(RM.matches||!make())return;
      finishAll();
      var visibleSpot=$('#spots [aria-checked="true"]');
      var spot=visibleSpot?visibleSpot.getAttribute("data-spot"):"main";
      if(spot==="bed"||spot==="kitchen"){
        animate(ftInner,[{opacity:0,transform:"translateY(3px)"},{opacity:1,transform:"none"}],{duration:300,delay:short?0:150,easing:EOUT});
        return;
      }
      var bbox=mat.getBBox(),yBottom=bbox.y+bbox.height;
      var cm=null;try{var con=ch.transform.baseVal.consolidate();cm=con&&con.matrix;}catch(e){}
      var cx=cm?cm.e:58,cy=cm?cm.f:12,dx=38-cx,dy=yBottom+1-cy;
      prints=Array.prototype.slice.call(walk.children);
      prints.forEach(function(p,i){
        var ys=yBottom+1+(i%2?6.5:13);
        p.setAttribute("y",ys);p.setAttribute("transform",i%2?"rotate(6 44.2 "+(ys+4.75)+")":"rotate(-6 39.8 "+(ys+4.75)+")");
        animate(p,[{opacity:0,offset:0},{opacity:.22,offset:.08},{opacity:.22,offset:.68},{opacity:0,offset:1}],{duration:short?800:1600,delay:short?0:(i%2?200:0),easing:"linear"});
      });
      animate(chInner,[{opacity:0,transform:"translate("+dx+"px,"+dy+"px)",offset:0},{opacity:0,transform:"translate("+dx+"px,"+dy+"px)",offset:.374},{opacity:1,transform:"translate("+dx+"px,"+dy+"px)",offset:.514},{opacity:1,transform:"none",offset:1}],{duration:short?670:1070,delay:short?0:0,easing:EOUT});
      animate(ftInner,[{opacity:0,transform:"translateY(3px)"},{opacity:1,transform:"none"}],{duration:300,delay:short?300:900,easing:EOUT});
    }
    var io;
    try{
      io=new IntersectionObserver(function(es){es.forEach(function(e){
        if(e.intersectionRatio===0){planVisible=false;if(allAnims.length)finishAll();return;}
        planVisible=e.intersectionRatio>=.5;
        if(e.intersectionRatio>=.5&&!firstPlayed){firstPlayed=true;make();play(false);}
      });},{threshold:[0,.05,.5]});
      io.observe($(".plan",fit));
    }catch(e){}
    on("fit",function(state){
      if(!state)return;
      if(state.spot!==lastSpot){lastSpot=state.spot;if(planVisible&&firstPlayed)play(true);else if(allAnims.length)finishAll();}
      else if(allAnims.length)finishAll();
    });
    on("picked",function(el,k){if(k==="zig"||k==="sol"||k==="chen"){if(allAnims.length)finishAll();}});
    listenMq(RM,function(){if(RM.matches){finishAll();if(io)io.disconnect();ready=false;}});
  })();

  /* W4 — the mat compresses beneath a soft, water-like footprint. */
  (function stepOnIt() {
    var stack=$("#stack"),layers=$(".layers",stack),pile=$(".ly-pile",stack),latex=$(".ly-latex",stack);
    if(!stack||!layers||!pile||!latex)return;
    var print=null,foot=null,drops=[],hint=null,anims=[],autoOnce=false,hideHintTimer=0;
    function create(){
      if(print)return;
      print=element("span","ly wow-print");print.setAttribute("aria-hidden","true");
      foot=element("i","wow-foot");print.appendChild(foot);
      for(var i=0;i<3;i++){var d=element("b","wow-drop");print.appendChild(d);drops.push(d);}
      layers.appendChild(print);
      hint=element("p","wow-tap");hint.textContent="Tap the mat to step on it";hint.setAttribute("aria-hidden","true");stack.appendChild(hint);
    }
    function finish(){
      anims.forEach(function(a){try{a.cancel();}catch(e){}});anims=[];
      [pile,latex].forEach(function(el){el.style.removeProperty("translate");});
      if(foot){foot.style.opacity="0";foot.style.scale="1";}
      drops.forEach(function(d){d.style.opacity="0";d.style.scale="1";});
    }
    function anim(el,frames,opts){try{var a=el.animate(frames,opts);anims.push(a);a.finished.then(function(){var i=anims.indexOf(a);if(i>=0)anims.splice(i,1);}).catch(function(){});return a;}catch(e){return null;}}
    function press(u,v){
      create();finish();
      u=Math.max(.18,Math.min(.82,u));v=Math.max(.2,Math.min(.8,v));
      foot.style.setProperty("--x",(u*100)+"%");foot.style.setProperty("--y",(v*100)+"%");
      drops.forEach(function(d,i){d.style.left=(Math.max(5,Math.min(95,u*100+[0,5,-4][i])))+"%";d.style.top=(Math.max(5,Math.min(94,v*100+[-9,-7,-10][i])))+"%";});
      if(RM.matches){
        foot.style.opacity=".3";foot.style.scale="1";if(hint)hint.classList.add("on");
        clearTimeout(hideHintTimer);hideHintTimer=setTimeout(function(){if(foot)foot.style.opacity="0";},1500);return;
      }
      try{if(PHONE.matches&&W.navigator.vibrate)W.navigator.vibrate(10);}catch(e){}
      anim(pile,[{translate:"0px 0px 0px",easing:EINT},{translate:"0px 0px -44px" ,offset:.167},{translate:"0px 0px -44px",offset:.357,easing:EOUT},{translate:"0px 0px 0px",offset:1}],{duration:840,fill:"none"});
      anim(latex,[{translate:"0px 0px 0px",easing:EINT},{translate:"0px 0px -8px",offset:.167},{translate:"0px 0px -8px",offset:.357,easing:EOUT},{translate:"0px 0px 0px",offset:1}],{duration:840,fill:"none"});
      anim(foot,[{opacity:0,scale:.94},{opacity:.34,scale:1,offset:.05},{opacity:.34,scale:1,offset:.107,easing:EOUT},{opacity:0,scale:1.06}],{duration:2800,fill:"none"});
      drops.forEach(function(d,i){anim(d,[{opacity:0,scale:1},{opacity:1,scale:1,offset:.12},{opacity:1,scale:1,offset:.3,easing:EINT},{opacity:0,scale:0}],{duration:1200,delay:i*60,fill:"none"});});
      if(hint)hint.classList.add("on");
      clearTimeout(hideHintTimer);hideHintTimer=setTimeout(function(){if(hint)hint.classList.remove("on");},2200);
    }
    stack.addEventListener("click",function(e){
      if(e.target.closest("button,a,input,select,textarea"))return;
      var u=.52,v=.56,r=pile.getBoundingClientRect();
      if(e.target===pile||pile.contains(e.target)){u=(e.clientX-r.left)/(r.width||1);v=(e.clientY-r.top)/(r.height||1);}
      press(u,v);
    });
    near(stack,function(){
      create();
      if(!motion()||autoOnce)return;
      try{if(sessionStorage.getItem("ss_wow_step"))return;}catch(e){}
      var io;
      try{
        io=new IntersectionObserver(function(es){
          if(!es.some(function(e){return e.isIntersecting;}))return;
          io.disconnect();setTimeout(function(){
            if(D.hidden||!visible(stack,.01))return;
            autoOnce=true;try{sessionStorage.setItem("ss_wow_step","1");}catch(e){}
            press(.52,.56);
          },500);
        },{rootMargin:"0px 0px -55% 0px"});
        io.observe(stack);
      }catch(e){}
    },"600px 0px");
    listenMq(RM,function(){if(RM.matches){finish();if(!print)return;foot.style.opacity="0";if(hint)hint.classList.add("on");}});
  })();

  /* W5 — a small rangoli appears only when a WhatsApp hand-off returns to the pay step. */
  (function rangoliReturn() {
    var box=$("#sentbox"),drawer=$("#drawer"),pay=$("#v-pay"),link=$("#sendwa"),oidEl=$("#oid");
    if(!box||!drawer||!pay||!link||!oidEl)return;
    var armed=null,viewReturned=false,animations=[],rg=null,caption=null,path=null,lastOid="",waiting=null;
    function orderId(){return (oidEl.textContent||"").trim();}
    function finished(){animations.forEach(function(a){try{a.cancel();}catch(e){}});animations=[];if(path){path.style.removeProperty("stroke-dasharray");path.style.removeProperty("stroke-dashoffset");}if(box)box.classList.remove("wow-welcomed");}
    function insertWhenSafe(){
      if(box.querySelector(".wow-rg"))return;
      if(!drawer.hidden&&!pay.hidden&&!box.hidden){setTimeout(insertWhenSafe,120);return;}
      rg=element("figure","wow-rg");rg.setAttribute("aria-hidden","true");
      var svg=svgEl("svg");svg.setAttribute("viewBox","0 0 72 72");svg.setAttribute("focusable","false");
      [[12,12,45],[60,12,-45],[60,60,45],[12,60,-45]].forEach(function(p){var e=svgEl("ellipse");e.setAttribute("class","pt");e.setAttribute("cx",p[0]);e.setAttribute("cy",p[1]);e.setAttribute("rx","5.5");e.setAttribute("ry","2.6");e.setAttribute("transform","rotate("+p[2]+" "+p[0]+" "+p[1]+")");svg.appendChild(e);});
      path=svgEl("path");path.setAttribute("class","lp");path.setAttribute("pathLength","1");path.setAttribute("d","M30 30A9 9 0 1 1 42 30A9 9 0 1 1 42 42A9 9 0 1 1 30 42A9 9 0 1 1 30 30Z");svg.appendChild(path);
      [[18,18],[54,18],[54,54],[18,54],[36,18],[54,36],[36,54],[18,36],[36,6],[66,36],[36,66],[6,36]].forEach(function(p){var c=svgEl("circle");c.setAttribute("class","d");c.setAttribute("cx",p[0]);c.setAttribute("cy",p[1]);c.setAttribute("r","1.6");svg.appendChild(c);});
      var g=svgEl("g");g.setAttribute("class","ft");g.setAttribute("transform","translate(32.4 30.24) scale(.72)");
      var e=svgEl("ellipse");e.setAttribute("cx","5");e.setAttribute("cy","10.5");e.setAttribute("rx","3.2");e.setAttribute("ry","5");g.appendChild(e);
      [[2.2,3.4,1.1],[4.3,2.3,1.1],[6.4,2.6,1],[8.1,3.9,.9]].forEach(function(p){var c=svgEl("circle");c.setAttribute("cx",p[0]);c.setAttribute("cy",p[1]);c.setAttribute("r",p[2]);g.appendChild(c);});
      svg.appendChild(g);rg.appendChild(svg);caption=element("p","wow-wb");caption.textContent="Welcome back.";
      box.insertBefore(rg,box.firstChild);box.insertBefore(caption,rg.nextSibling);box.classList.add("wow-has-rg");
    }
    function play(id){
      if(!rg||!caption||!path||!box||box.hidden||drawer.hidden||pay.hidden)return;
      if(!id||sessionGet("ss_wow_rg")===id)return;
      finished();sessionSet("ss_wow_rg",id);box.classList.add("wow-welcomed");
      if(!motion())return;
      function an(el,frames,opts){try{var a=el.animate(frames,Object.assign({fill:"backwards"},opts||{}));animations.push(a);a.finished.then(function(){var i=animations.indexOf(a);if(i>=0)animations.splice(i,1);}).catch(function(){});}catch(e){}}
      an(caption,[{opacity:0},{opacity:1}],{duration:300,easing:EOUT});
      $$(".d",rg).forEach(function(el,i){an(el,[{opacity:0,scale:0},{opacity:1,scale:1}],{duration:240,delay:i*30,easing:EOUT});});
      path.style.strokeDasharray="1";path.style.strokeDashoffset="1";
      an(path,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:1100,delay:250,easing:EDYE});
      $$(".pt",rg).forEach(function(el,i){an(el,[{opacity:0,scale:.6},{opacity:1,scale:1}],{duration:300,delay:1000+i*60,easing:EOUT});});
      an($(".ft",rg),[{opacity:0,scale:1.15},{opacity:1,scale:1}],{duration:320,delay:1450,easing:EOUT});
      setTimeout(function(){if(path)path.style.removeProperty("stroke-dasharray");},1900);
    }
    function sessionGet(k){try{return sessionStorage.getItem(k)||"";}catch(e){return "";}}
    function sessionSet(k,v){try{sessionStorage.setItem(k,v);}catch(e){}}
    function tryPlay(){
      if(!armed||!armed.left||drawer.hidden||pay.hidden||box.hidden)return;
      var id=orderId();if(!id||id!==armed.oid)return;
      play(id);armed=null;
    }
    link.addEventListener("click",function(){armed={oid:orderId(),left:false};viewReturned=false;},true);
    D.addEventListener("visibilitychange",function(){if(D.hidden){if(armed)armed.left=true;}else{viewReturned=true;tryPlay();}});
    W.addEventListener("blur",function(){if(armed)armed.left=true;});
    W.addEventListener("focus",function(){viewReturned=true;tryPlay();});
    var mo=new MutationObserver(function(){if(box.querySelector(".wow-rg"))tryPlay();});
    try{mo.observe(box,{attributes:true,attributeFilter:["hidden"]});}catch(e){}
    var dm=new MutationObserver(function(){if(!drawer.hidden&&!pay.hidden&&!box.hidden){if(armed)tryPlay();else{var p=null;try{p=JSON.parse(localStorage.getItem("ss_pending")||"null");}catch(e){}if(p&&p.opened&&p.oid===orderId())play(p.oid);}}});
    try{dm.observe(drawer,{attributes:true,attributeFilter:["hidden"]});dm.observe(pay,{attributes:true,attributeFilter:["hidden"]});}catch(e){}
    var om=new MutationObserver(function(){var id=orderId();if(id!==lastOid){lastOid=id;finished();if(armed&&armed.oid!==id)armed=null;}});
    try{om.observe(oidEl,{childList:true,subtree:true,characterData:true});}catch(e){}
    on("drawer",function(open){if(open&&!pay.hidden&&!box.hidden){if(armed)tryPlay();else{var p=null;try{p=JSON.parse(localStorage.getItem("ss_pending")||"null");}catch(e){}if(p&&p.opened&&p.oid===orderId())play(p.oid);}}});
    lastOid=orderId();near(box,insertWhenSafe,"400px 0px");idle(insertWhenSafe);
  })();

  /* A language switch should not leave the aria-hidden brushing hint in the old language. */
  try {
    var langMO = new MutationObserver(function () {
      var h=$("#r-sol .wow-hint span"); if(!h||!W.SSLANG)return;
      var c=W.SSLANG.get(),d=W.SSI18N&&W.SSI18N[c]; if(d&&d.text&&d.text["Stroke the pile"])h.textContent=d.text["Stroke the pile"];
    });
    langMO.observe(D.documentElement,{attributes:true,attributeFilter:["lang"]});
  } catch(e) {}
})();