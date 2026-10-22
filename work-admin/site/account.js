/* Soft Steps — customer sign-in, order emails and the owner's order list.
   Only runs where the Netlify build added <meta name="ss-accounts"> (the order functions are set up and answer). Everywhere else
   (the claude.ai artifact, a saved file, a Netlify Drop upload) it quietly does nothing, so the shop never depends on it.
   Checkout still ends on WhatsApp; signing in only adds a saved order and emails. Exposes window.SSACCT = {open, record}.
   Every element is built with createElement/textContent; server values never pass through innerHTML. */
(function () {
  "use strict";
  if (window.SSACCT) return;
  var D = document, W = window;
  var FN = "/.netlify/functions/";
  var SB_SRC = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
  var STATUS = [["received", "Order received"], ["confirmed", "Payment confirmed"], ["packed", "Packed"],
    ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]];
  var STATUS_NAME = {}; STATUS.forEach(function (s) { STATUS_NAME[s[0]] = s[1]; });

  var cfg = null, sb = null, sbLoading = null, user = null, info = null, dlg = null, body = null, hint = null, menuLink = null;
  var mode = "in", msg = "", msgBad = false, busy = false, recovery = false, prevFocus = null;

  function h(tag, attrs, kids) {
    var e = D.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "on") Object.keys(attrs.on).forEach(function (ev) { e.addEventListener(ev, attrs.on[ev]); });
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? D.createTextNode(c) : c); });
    return e;
  }
  function toast(m) { try { W.SS.toast(m); } catch (e) {} }
  function inr(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
  function when(s) { try { return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; } }

  /* ---------------------------------------------------------------- Supabase client */
  function ensureSB() {
    if (sb) return Promise.resolve(sb);
    if (sbLoading) return sbLoading;
    sbLoading = new Promise(function (res, rej) {
      function make() {
        try {
          sb = W.supabase.createClient(cfg.url, cfg.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
          sb.auth.onAuthStateChange(function (ev, s) {
            user = s && s.user ? s.user : null;
            if (ev === "PASSWORD_RECOVERY") { recovery = true; open(); }
            if (!user) info = null;
            syncUi();
            if (user && !info) loadInfo();
          });
          sb.auth.getSession().then(function (r) { user = r.data && r.data.session ? r.data.session.user : null; syncUi(); if (user) loadInfo(); });
          res(sb);
        } catch (e) { rej(e); }
      }
      if (W.supabase) return make();
      var s = h("script", { src: SB_SRC, crossorigin: "anonymous" });
      s.onload = make; s.onerror = function () { sbLoading = null; rej(new Error("load")); };
      D.head.appendChild(s);
    });
    return sbLoading;
  }
  function token() {
    return ensureSB().then(function () { return sb.auth.getSession(); }).then(function (r) { return r.data && r.data.session ? r.data.session.access_token : null; });
  }
  function api(name, opts) {
    return token().then(function (t) {
      if (!t) throw new Error("sign_in");
      opts = opts || {};
      return fetch(FN + name, { method: opts.method || "GET", headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" }, body: opts.body ? JSON.stringify(opts.body) : undefined });
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j && j.error || "error"); return j; }); });
  }
  function loadInfo() {
    return api("my-orders").then(function (j) { info = j; syncUi(); }).catch(function () {});
  }

  /* ---------------------------------------------------------------- entry points in the page */
  function syncUi() {
    if (menuLink) menuLink.textContent = user ? "My account" : "Sign in";
    if (hint) {
      while (hint.firstChild) hint.removeChild(hint.firstChild);
      if (user) hint.appendChild(h("span", { text: "Order updates will be emailed to your account address." }));
      else {
        hint.appendChild(h("span", { text: "Want email updates for this order?" }));
        hint.appendChild(D.createTextNode(" "));
        hint.appendChild(h("button", { type: "button", class: "ssacct-link", text: "Sign in", on: { click: function () { open(); } } }));
      }
    }
    if (dlg && dlg.open) render();
  }
  function mount() {
    var list = D.querySelector(".mlinks");
    if (list) {
      menuLink = h("a", { href: "#account", text: "Sign in", style: "--i:8", on: { click: function (e) { e.preventDefault(); var m = D.getElementById("menu"); if (m && m.open) m.close(); open(); } } });
      list.appendChild(h("li", null, [menuLink]));
    }
    var em = D.getElementById("o-email");
    var lab = em && em.closest("label");
    if (lab && lab.parentNode) {
      hint = h("p", { class: "ssacct-hint", "aria-live": "polite" });
      lab.parentNode.insertBefore(hint, lab.nextSibling);
    }
    var st = h("style", { text:
      ".ssacct-hint{margin:0;font:400 14px/1.4 var(--text);color:var(--mitti)}" +
      ".ssacct-link{min-height:44px;padding:0 6px;border:0;background:none;color:var(--neel);font:600 14px/1 var(--text);text-decoration:underline;cursor:pointer}" +
      "#ssacct .tabs{display:flex;gap:8px;margin:0 0 14px}" +
      "#ssacct .tabs button{flex:1;min-height:44px;border:1px solid var(--edge);border-radius:999px;background:none;color:var(--kajal);font:600 15px/1 var(--text)}" +
      "#ssacct .tabs button[aria-pressed=true]{background:var(--kajal);color:var(--chalk);border-color:var(--kajal)}" +
      "#ssacct form{display:grid;gap:12px}#ssacct .m{margin:0;font:500 14px/1.4 var(--text);color:var(--mitti)}#ssacct .m.bad{color:#9a2b1f}" +
      "#ssacct .ord{padding:14px 0;border-bottom:1px solid var(--sut);display:grid;gap:6px;font:400 15px/1.4 var(--text)}" +
      "#ssacct .ord b{font-weight:600}#ssacct .ord .st{display:inline-block;padding:2px 10px;border-radius:999px;background:var(--kora-2);font-weight:600;font-size:13px}" +
      "#ssacct .ord select,#ssacct .ord input{min-height:44px}#ssacct .ord .row{display:grid;gap:8px}" +
      "#ssacct pre{margin:0;white-space:pre-wrap;font:400 14px/1.4 var(--text)}" +
      "@media(min-width:560px){#ssacct .ord .row{grid-template-columns:200px 1fr auto}}" });
    D.head.appendChild(st);
  }

  /* ---------------------------------------------------------------- dialog */
  function build() {
    body = h("div", { class: "dlg-b" });
    dlg = h("dialog", { class: "dlg", id: "ssacct", "aria-labelledby": "ssacct-t" }, [
      h("div", { class: "dlg-h" }, [h("h2", { id: "ssacct-t", text: "Sign in" }),
        h("button", { type: "button", class: "x", "aria-label": "Close", text: "✕", on: { click: close } })]),
      body]);
    dlg.addEventListener("close", function () { if (prevFocus && prevFocus.isConnected) try { prevFocus.focus(); } catch (e) {} });
    D.body.appendChild(dlg);
  }
  function open() {
    if (!dlg) build();
    if (!dlg.open) { prevFocus = D.activeElement; msg = ""; dlg.showModal(); }
    render();
    ensureSB().then(function () { render(); }).catch(function () { msg = "Sign-in could not load. Check your internet and try again."; msgBad = true; render(); });
  }
  function close() { if (dlg && dlg.open) dlg.close(); }

  function field(label, type, name, extra) {
    var i = h("input", Object.assign({ id: "ssacct-" + name, name: name, type: type, required: true, maxlength: 254 }, extra || {}));
    return h("label", { class: "field-in", for: "ssacct-" + name }, [label, i]);
  }
  function note() { return msg ? h("p", { class: "m" + (msgBad ? " bad" : ""), role: "status", text: msg }) : null; }
  function setMsg(t, bad) { msg = t; msgBad = !!bad; render(); }

  function render() {
    if (!dlg) return;
    var title = D.getElementById("ssacct-t");
    while (body.firstChild) body.removeChild(body.firstChild);
    if (!sb) { title.textContent = "Sign in"; body.appendChild(h("p", { class: "m", text: "Loading…" })); if (note()) body.appendChild(note()); return; }
    if (recovery) { title.textContent = "Set new password"; return renderRecovery(); }
    if (user) { title.textContent = "My account"; return renderAccount(); }
    title.textContent = "Sign in";
    var up = mode === "up";
    var tabs = h("div", { class: "tabs" }, [
      h("button", { type: "button", "aria-pressed": String(!up), text: "Sign in", on: { click: function () { mode = "in"; msg = ""; render(); } } }),
      h("button", { type: "button", "aria-pressed": String(up), text: "Create account", on: { click: function () { mode = "up"; msg = ""; render(); } } })]);
    var form = h("form", { novalidate: true }, [
      field("Email", "email", "email", { autocomplete: "email" }),
      field("Password", "password", "password", { autocomplete: up ? "new-password" : "current-password", minlength: 8, maxlength: 72 }),
      h("button", { type: "submit", class: "pill", disabled: busy ? true : false }, [up ? "Create account" : "Sign in"]),
      up ? h("p", { class: "m", text: "Use at least 8 characters. We email you a link to confirm your address." }) : h("button", { type: "button", class: "ssacct-link", text: "Forgot password?", on: { click: forgot } }),
      note()]);
    form.addEventListener("submit", function (e) { e.preventDefault(); submit(form); });
    body.appendChild(tabs); body.appendChild(form);
    var f = D.getElementById("ssacct-email"); if (f && !f._f) { f._f = 1; f.focus(); }
  }
  function creds(form) {
    var email = form.elements.email.value.trim(), pw = form.elements.password.value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMsg("Check your email address.", true); return null; }
    if (pw.length < 8) { setMsg("Use at least 8 characters for the password.", true); return null; }
    return { email: email, password: pw };
  }
  function submit(form) {
    var c = creds(form); if (!c || busy) return;
    busy = true; setMsg("Please wait…");
    var p = mode === "up" ? sb.auth.signUp({ email: c.email, password: c.password, options: { emailRedirectTo: location.origin + "/" } }) : sb.auth.signInWithPassword(c);
    p.then(function (r) {
      busy = false;
      if (r.error) return setMsg(/invalid login/i.test(r.error.message) ? "Wrong email or password." : /confirm/i.test(r.error.message) ? "Confirm your email first. Check your inbox for the link." : "That didn't work. Please try again.", true);
      if (mode === "up" && !(r.data && r.data.session)) { mode = "in"; return setMsg("Check your email to confirm your account, then sign in."); }
      msg = ""; render();
    }).catch(function () { busy = false; setMsg("That didn't work. Check your internet and try again.", true); });
  }
  function forgot() {
    var e = D.getElementById("ssacct-email"), v = e ? e.value.trim() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setMsg("Type your email above first.", true);
    sb.auth.resetPasswordForEmail(v, { redirectTo: location.origin + "/" }).then(function (r) {
      setMsg(r.error ? "That didn't work. Please try again." : "Reset link sent. Check your email.", !!r.error);
    });
  }
  function renderRecovery() {
    var form = h("form", { novalidate: true }, [
      field("New password", "password", "password", { autocomplete: "new-password", minlength: 8, maxlength: 72 }),
      h("button", { type: "submit", class: "pill", text: "Save password" }), note()]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var pw = form.elements.password.value;
      if (pw.length < 8) return setMsg("Use at least 8 characters for the password.", true);
      sb.auth.updateUser({ password: pw }).then(function (r) {
        if (r.error) return setMsg("That didn't work. Please try again.", true);
        recovery = false; msg = "Your password is updated."; render();
      });
    });
    body.appendChild(form);
  }
  function renderAccount() {
    body.appendChild(h("p", { class: "m", text: (info && info.email) || user.email }));
    var orders = info && info.orders;
    body.appendChild(h("h3", { text: "My orders" }));
    if (!orders) body.appendChild(h("p", { class: "m", text: "Loading…" }));
    else if (!orders.length) body.appendChild(h("p", { class: "m", text: "No orders yet." }));
    else orders.forEach(function (o) {
      body.appendChild(h("div", { class: "ord" }, [
        h("div", null, [h("b", { text: o.oid }), " · " + when(o.created_at) + " · " + inr(o.total)]),
        h("div", null, [h("span", { class: "st", text: STATUS_NAME[o.status] || o.status })]),
        h("div", { text: o.items.map(function (x) { return x.name + " (" + x.colour + ", " + x.size + ") × " + x.q; }).join("; ") }),
        o.status_note ? h("div", { class: "m", text: o.status_note }) : null]));
    });
    if (note()) body.appendChild(note());
    var acts = h("div", { class: "dlg-f" });
    if (info && info.admin) acts.appendChild(h("button", { type: "button", class: "pill", text: "Manage orders", on: { click: adminView } }));
    acts.appendChild(h("button", { type: "button", class: "pill", text: "Sign out", on: { click: function () { sb.auth.signOut().then(function () { info = null; msg = ""; render(); }); } } }));
    body.appendChild(acts);
  }

  /* ---------------------------------------------------------------- owner's order list (English only, owner tool) */
  function adminView() {
    var title = D.getElementById("ssacct-t"); title.textContent = "Orders";
    while (body.firstChild) body.removeChild(body.firstChild);
    body.appendChild(h("p", { class: "m", text: "Loading…" }));
    api("admin-orders").then(function (j) {
      while (body.firstChild) body.removeChild(body.firstChild);
      body.appendChild(h("button", { type: "button", class: "ssacct-link", text: "← Back", on: { click: render } }));
      if (!j.orders.length) body.appendChild(h("p", { class: "m", text: "No orders yet." }));
      j.orders.forEach(function (o) { body.appendChild(orderRow(o)); });
    }).catch(function () { body.appendChild(h("p", { class: "m bad", text: "Could not load orders." })); });
  }
  function orderRow(o) {
    var sel = h("select", { "aria-label": "Status for " + o.oid }, STATUS.map(function (s) { return h("option", { value: s[0], selected: s[0] === o.status, text: s[1] }); }));
    var nt = h("input", { type: "text", maxlength: 300, placeholder: "Note to customer (optional)", "aria-label": "Note for " + o.oid, value: o.status_note || "" });
    var out = h("span", { class: "m", role: "status" });
    var btn = h("button", { type: "button", class: "pill", text: "Update & email" });
    btn.addEventListener("click", function () {
      btn.disabled = true; out.textContent = "Sending…";
      api("admin-orders", { method: "POST", body: { id: o.id, status: sel.value, note: nt.value } }).then(function (j) {
        out.textContent = j.emailed ? "Saved. Customer emailed." : "Saved, but the email could not be sent.";
      }).catch(function () { out.textContent = "Could not save. Try again."; }).then(function () { btn.disabled = false; });
    });
    return h("div", { class: "ord" }, [
      h("div", null, [h("b", { text: o.oid }), " · " + when(o.created_at) + " · " + inr(o.total)]),
      h("pre", { text: o.name + " · " + o.phone + " · " + o.email + "\n" + o.address + ", " + o.city + " " + o.pin + "\n" +
        o.items.map(function (x) { return x.name + " (" + x.colour + ", " + x.size + ") × " + x.q + " = " + inr(x.p * x.q); }).join("\n") + (o.note ? "\nGift note: " + o.note : "") }),
      h("div", { class: "row" }, [sel, nt, btn]), out]);
  }

  /* ---------------------------------------------------------------- called by checkout */
  function record(oid, items, details, note) {
    if (!user) return;
    api("place-order", { method: "POST", body: { oid: oid, items: items, details: details, note: note || "" } }).then(function (j) {
      if (j && !j.duplicate) toast(j.emailed ? "Order saved. A confirmation email is on its way." : "Order saved to your account.");
      loadInfo();
    }).catch(function () { toast("We couldn't save this order to your account. Your WhatsApp order still works."); });
  }

  /* ---------------------------------------------------------------- start */
  function start() {
    if (!D.querySelector('meta[name="ss-accounts"]')) return;   /* the Netlify build adds this tag only when the order functions are set up */
    var ctl = typeof AbortController === "function" ? new AbortController() : null;
    var t = ctl && setTimeout(function () { ctl.abort(); }, 4000);
    fetch(FN + "public-config", { signal: ctl ? ctl.signal : undefined }).then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
      if (!c || !c.enabled || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(c.url || "") || !c.anonKey) return;
      cfg = c; mount(); syncUi();
      var hasSession = false;
      try { for (var i = 0; i < localStorage.length; i++) if (/^sb-.*-auth-token$/.test(localStorage.key(i))) hasSession = true; } catch (e) {}
      if (hasSession || /type=recovery|access_token=/.test(location.hash)) ensureSB().catch(function () {});
    }).catch(function () {}).then(function () { if (t) clearTimeout(t); });
  }
  W.SSACCT = Object.freeze({ open: open, record: record });
  if (location.protocol === "http:" || location.protocol === "https:") start();
})();
