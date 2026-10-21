/* Soft Steps — trust and discovery extras. Each insert waits until its target is out of view. */
(function () {
  "use strict";
  var W=window,D=document,SS=W.SS;
  if(!SS||!D.querySelector)return;
  var $=function(s,r){return(r||D).querySelector(s);},$$=function(s,r){return Array.prototype.slice.call((r||D).querySelectorAll(s));};
  var RM;try{RM=W.matchMedia("(prefers-reduced-motion: reduce)");}catch(e){RM={matches:false};}
  var LINES=[
    {t:"Pay only to panchaljelam@oksbi or UPI number 90994 41429.",ok:true},
    {t:"Before you enter your UPI PIN, check that your app shows the name Jelam Panchal.",ok:false},
    {t:"You never need your UPI PIN to receive money. We never ask for your PIN or an OTP.",ok:false},
    {t:"Your order and payment are confirmed on WhatsApp from +91 90994 41429.",ok:true},
    {t:"Outside Vadodara, the delivery charge is confirmed with you on a call.",ok:true}
  ];
  var CLOSED=[];
  function node(tag,cls,text){var e=D.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function inView(el){if(!el||!el.getBoundingClientRect)return false;var r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<(W.innerHeight||D.documentElement.clientHeight);}
  function idle(fn){try{if(W.requestIdleCallback)W.requestIdleCallback(fn,{timeout:800});else setTimeout(fn,80);}catch(e){setTimeout(fn,80);}}
  function whenQuiet(target,fn,closedDrawer){
    if(!target)return;
    var done=false,io=null;
    function tryIt(){
      if(done)return;
      if(closedDrawer){var dr=$("#drawer");if(dr&&!dr.hidden)return;}
      if(D.hidden||inView(target))return;
      done=true;if(io)io.disconnect();try{fn();}catch(e){try{console.warn("softsteps extras",e);}catch(x){}}
    }
    if("IntersectionObserver"in W){
      io=new IntersectionObserver(function(entries){if(!entries[0])return;if(!entries[0].isIntersecting)idle(tryIt);},{threshold:0});
      io.observe(target);
    }
    var onScroll=function(){tryIt();};
    W.addEventListener("scroll",onScroll,{passive:true});
    W.addEventListener("resize",onScroll,{passive:true});
    D.addEventListener("visibilitychange",onScroll);
    if(closedDrawer){
      var dr=$("#drawer");
      if(dr&&"MutationObserver"in W)new MutationObserver(tryIt).observe(dr,{attributes:true,attributeFilter:["hidden"]});
    }
    idle(tryIt);
  }
  function addStyle(){
    var st=node("style");st.setAttribute("data-softsteps-extras","");
    st.textContent=[
      ".paysafe{display:grid;grid-template-columns:24px minmax(0,1fr);align-items:center;gap:8px 12px;margin-top:8px;padding:18px 20px;border-radius:20px;background:var(--chalk);box-shadow:inset 0 0 0 1px var(--sut)}",
      ".paysafe h3{font:420 20px/1.25 var(--display);font-variation-settings:var(--fvs)}.paysafe ul{grid-column:1/-1;margin:0;padding-left:20px;display:grid;gap:6px;font-size:16px;line-height:1.5;color:var(--kajal)}.paysafe .ps-ic{width:24px;height:24px;fill:none;stroke:var(--neel);stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round}@media(max-width:860px){.paysafe{padding:16px}.paysafe ul{font-size:15px}}",
      ".wwg{grid-column:1/-1;display:grid;gap:10px;margin-top:16px}.wwg .chips{display:flex;flex-wrap:wrap;gap:8px}.wwg .chip[aria-pressed=true]{background:var(--neel);color:var(--chalk);box-shadow:none}.wwg .clab{margin:0}.wwg-live{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}"
    ].join("\n");D.head.appendChild(st);
  }
  addStyle();

  /* X1 — only verified facts appear. Payee display-name and PIN/OTP claims remain gated off. */
  (function payingSafely(){
    var host=$("#order .order-l"),step=host&&$(".stepwrap",host);
    if(!host||!step)return;
    var approved=LINES.filter(function(x){return x.ok;});
    if(approved.length<2)return;
    whenQuiet($("#order"),function(){
      if(host.querySelector(".paysafe"))return;
      var panel=node("section","paysafe");panel.setAttribute("aria-labelledby","paysafe-h");
      var ic=node("div","ps-ic");
      var svg=D.createElementNS("http://www.w3.org/2000/svg","svg");svg.setAttribute("viewBox","0 0 24 24");svg.setAttribute("aria-hidden","true");
      var p1=D.createElementNS("http://www.w3.org/2000/svg","path");p1.setAttribute("d","M12 3l7 3v5c0 4.4-3 8.3-7 9.5C8 19.3 5 15.4 5 11V6z");svg.appendChild(p1);
      var p2=D.createElementNS("http://www.w3.org/2000/svg","path");p2.setAttribute("d","M9 12l2 2 4-4.2");svg.appendChild(p2);ic.appendChild(svg);
      var h=node("h3","", "Paying safely");h.id="paysafe-h";
      var list=node("ul");
      approved.forEach(function(line){var li=node("li","",line.t);list.appendChild(li);});
      panel.appendChild(ic);panel.appendChild(h);panel.appendChild(list);
      if(step.nextSibling)host.insertBefore(panel,step.nextSibling);else host.appendChild(panel);
    });
    /* The short payment-step version stays off while both PIN/OTP claims are unconfirmed. */
    var shortLines=[LINES[1],LINES[2]];
    if(shortLines.every(function(x){return x.ok;})){
      var pay=$("#v-pay"),upi=pay&&$(".upibox",pay),upiid=upi&&$(".upiid",upi);
      if(pay&&upi&&upiid)whenQuiet(pay,function(){var p=node("p","fine paysafe-s",shortLines.map(function(x){return x.t;}).join(" "));upi.insertBefore(p,upiid.nextSibling);},true);
    }
  })();

  /* X2 — current reply window, only for visitors whose device zone is India. */
  (function replyHours(){
    var cardLines=$$(".prod .ask small"),pay=$("#v-pay"),todo=pay&&$("ol.todo",pay),payLine=null;
    if(!cardLines.length)return;
    var zone="";try{zone=Intl.DateTimeFormat().resolvedOptions().timeZone;}catch(e){}
    if(zone!=="Asia/Kolkata"&&zone!=="Asia/Calcutta")return;
    var originals=cardLines.map(function(el){return el.textContent;});
    function ist(d){
      var shifted=new Date(+d+330*60000);
      return {y:shifted.getUTCFullYear(),m:shifted.getUTCMonth()+1,d:shifted.getUTCDate(),h:shifted.getUTCHours(),min:shifted.getUTCMinutes()};
    }
    function ymd(t){return String(t.y).padStart(4,"0")+"-"+String(t.m).padStart(2,"0")+"-"+String(t.d).padStart(2,"0");}
    function status(now){
      var t=ist(now),tm=ist(new Date(+now+864e5)),today=ymd(t),tomorrow=ymd(tm);
      if(CLOSED.indexOf(today)>=0)return "Closed today. We reply when we reopen.";
      if(t.h<10)return "Replies from 10am today";
      if(t.h<20)return "Within reply hours, until 8pm";
      return CLOSED.indexOf(tomorrow)>=0?"Closed tomorrow. We reply when we reopen.":"Replies from 10am tomorrow";
    }
    function nextDelay(now){
      var t=ist(now),target;
      if(t.h<10)target=Date.UTC(t.y,t.m-1,t.d,10,0,0);
      else if(t.h<20)target=Date.UTC(t.y,t.m-1,t.d,20,0,0);
      else target=Date.UTC(t.y,t.m-1,t.d+1,0,0,0);
      return Math.max(2000,target-330*60000-(+now)+2000);
    }
    var timeout=0;
    function quietText(el,txt){
      if(!el)return;
      if(inView(el)){
        el.__ssReplyNext=txt;
        if(!el.__ssReplyWait){
          el.__ssReplyWait=true;
          var done=function(){if(!inView(el)){W.removeEventListener("scroll",done);W.removeEventListener("resize",done);el.__ssReplyWait=false;el.textContent=el.__ssReplyNext||txt;el.__ssReplyNext="";}};
          W.addEventListener("scroll",done,{passive:true});W.addEventListener("resize",done,{passive:true});
        }
      }else {el.textContent=txt;el.__ssReplyNext="";}
    }
    function update(){
      var now=new Date(),txt=status(now);
      cardLines.forEach(function(el){quietText(el,txt);});
      if(todo){
        if(!payLine){payLine=node("p","fine wow-rh");payLine.textContent=txt;todo.parentNode.insertBefore(payLine,todo.nextSibling);}
        else quietText(payLine,txt);
      }
      clearTimeout(timeout);timeout=setTimeout(update,nextDelay(now));
    }
    whenQuiet(cardLines[0],function(){update();});
    /* Schedule immediately too: whenQuiet might wait until the reader leaves the top card. */
    idle(update);
    D.addEventListener("visibilitychange",function(){if(!D.hidden)update();});
  })();

  /* X3 — reuses the existing fit suggestions and pickers; no duplicate recommendation logic. */
  (function whereWillItGo(){
    var head=$("#shop .sechead");
    if(!head||!SS.fitSug||!SS.pickers)return;
    whenQuiet($("#shop"),function(){
      if(head.querySelector(".wwg"))return;
      var box=node("div","wwg");box.setAttribute("role","group");box.setAttribute("aria-labelledby","wwg-l");box.setAttribute("aria-describedby","wwg-d");
      var label=node("p","clab","Where will it go?");label.id="wwg-l";box.appendChild(label);
      var chips=node("div","chips");
      [["main","Main door"],["bath","Bathroom door"],["bed","Bedside"],["kitchen","Kitchen counter"]].forEach(function(pair){
        var b=node("button","chip",pair[1]);b.type="button";b.dataset.wwg=pair[0];b.setAttribute("aria-pressed","false");chips.appendChild(b);
      });
      var desc=node("p","wwg-live","Tap a spot to see the mat we suggest.");desc.id="wwg-d";desc.className="wwg-live";
      var live=node("p","wwg-live");live.id="wwg-live";live.setAttribute("aria-live","polite");
      box.appendChild(chips);box.appendChild(desc);box.appendChild(live);head.appendChild(box);
      box.addEventListener("click",function(e){
        var b=e.target.closest&&e.target.closest("[data-wwg]");if(!b)return;
        var spot=b.dataset.wwg,sug=SS.fitSug[spot];if(!sug||!SS.pickers[sug.k])return;
        $$(".wwg [data-wwg]",box).forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false");});
        var actual=$('#spots [data-spot="'+spot+'"]');if(actual)actual.click();
        SS.pickers[sug.k](sug.l);
        var card=$('.prod[data-k="'+sug.k+'"]');
        if(card){
          card.scrollIntoView({behavior:RM.matches?"auto":"smooth",block:"start"});
          setTimeout(function(){var chosen=$('.sizes-c [aria-checked="true"]',card);if(chosen)try{chosen.focus({preventScroll:true});}catch(e){}},RM.matches?0:320);
        }
        setTimeout(function(){var sugEl=$("#fit-sugg");if(sugEl)live.textContent=sugEl.textContent;},0);
      });
    });
  })();
})();