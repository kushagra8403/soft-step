/* Test shim for the claude.ai artifact runtime (contract 0.2.87), for Playwright's addInitScript.
   Defines window.claude.use(name) for "user", "artifact" and "assets"; every other name resolves null.

   Configure it through localStorage on the page's origin (set before the page's scripts run, e.g. in an earlier
   addInitScript):
     mock_canEdit        "1" → user.canEdit()/isOwner() resolve true; anything else → false (a public visitor)
     mock_name           display name returned by user.me() (default "Jelam Panchal")
     mock_noassets       "1" → use("assets") resolves null
     mock_publish_fail   comma list of error codes; each artifact.publish() call consumes the first one and rejects
                         with {code, message} (e.g. "upstream_error" → the first call fails, the retry succeeds)
     mock_upload_fail    the same for assets.upload()
     mock_delay          milliseconds each publish/upload takes (default 120)
   Results:
     window.__published / localStorage mock_published   the last html passed to a successful publish()
     window.__publishCalls                              how many times publish() was called
     window.__blobs                                     {id: Blob} uploaded through assets.upload()
   If the test exposes a binding window.__mockBlobSink(id, type, base64), every upload is also handed to it, so the
   test can serve "/_blob/<id>" with page.route. */
(function () {
  "use strict";
  var W = window;
  function ls(k) { try { return W.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { W.localStorage.setItem(k, v); } catch (e) {} }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function delay() { var d = parseInt(ls("mock_delay") || "120", 10); return isFinite(d) ? d : 120; }
  function takeFail(key) {
    var list = (ls(key) || "").split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    if (!list.length) return null;
    var c = list.shift(); lsSet(key, list.join(","));
    return c;
  }
  function err(code, message) { var e = new Error(message || code); e.code = code; return e; }
  function hex32() {
    var a = new Uint8Array(16); (W.crypto || W.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  var canEdit = function () { return ls("mock_canEdit") === "1"; };
  var name = function () { var n = ls("mock_name"); return n == null ? "Jelam Panchal" : n; };
  var avatar = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#805400"/><text x="40" y="52" font-family="sans-serif" font-size="32" font-weight="700" fill="#FBF7F0" text-anchor="middle">JP</text></svg>');

  var user = Object.freeze({
    isOwner: function () { return Promise.resolve(canEdit()); },
    canEdit: function () { return Promise.resolve(canEdit()); },
    can: function (c) { return Promise.resolve(c === "files.write" || c === "assets.write" ? canEdit() : false); },
    me: function () {
      var ok = canEdit();
      return Promise.resolve({ id: ok ? "u_owner_test" : null, name: ok ? name() : "", avatarUrl: avatar, color: "#805400", email: null, isOwner: ok, canEdit: ok });
    },
    id: function () { return Promise.resolve(canEdit() ? "u_owner_test" : null); },
    name: function () { return Promise.resolve(canEdit() ? name() : ""); },
    avatarUrl: function () { return Promise.resolve(canEdit() ? avatar : null); },
    profiles: function (ids) { var o = {}; [].concat(ids).forEach(function (i) { o[i] = { id: i, name: "", avatarUrl: avatar, color: "#805400", email: null, isMe: i === "u_owner_test", guest: false }; }); return Promise.resolve(o); },
    search: function () { return Promise.resolve([]); },
    email: function () { return Promise.resolve(null); }
  });

  W.__publishCalls = 0;
  var artifact = Object.freeze({
    publish: function (html) {
      W.__publishCalls++;
      return wait(delay()).then(function () {
        if (!canEdit()) throw err("not_writer", "viewer cannot write");
        var f = takeFail("mock_publish_fail"); if (f) throw err(f, "mock failure: " + f);
        if (typeof html !== "string") throw err("capability_disabled", "the files form is disabled on publicly shared artifacts");
        if (!/^<!doctype html/i.test(html)) throw err("invalid_content", "not an HTML page");
        W.__published = html; lsSet("mock_published", html);
        return { version: "v-test" };
      });
    },
    metadata: function () { return Promise.resolve({}); }
  });

  var TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml", "video/mp4", "video/webm", "application/pdf"];
  W.__blobs = {};
  var assets = Object.freeze({
    upload: function (blob, opts) {
      return wait(delay()).then(function () {
        if (!canEdit()) throw err("not_granted", "assets not granted");
        var f = takeFail("mock_upload_fail"); if (f) throw err(f, "mock failure: " + f);
        if (!(blob instanceof Blob) || !blob.size) throw err("invalid_request", "not a non-empty Blob");
        var type = (opts && opts.type) || blob.type;
        if (TYPES.indexOf(type) < 0) throw err("unsupported_type", "type " + type);
        if (blob.size > 20 * 1024 * 1024) throw err("too_large", "over 20 MiB");
        var id = hex32(); W.__blobs[id] = blob;
        var sink = typeof W.__mockBlobSink === "function" ? new Promise(function (res, rej) {
          var fr = new FileReader();
          fr.onload = function () { var s = String(fr.result); res(W.__mockBlobSink(id, type, s.slice(s.indexOf(",") + 1))); };
          fr.onerror = rej; fr.readAsDataURL(blob);
        }) : Promise.resolve();
        return sink.then(function () { return { id: id, url: "/_blob/" + id, sizeBytes: blob.size, contentType: type }; });
      });
    },
    list: function () { return Promise.resolve({ assets: Object.keys(W.__blobs).map(function (id) { return { id: id, url: "/_blob/" + id, contentType: W.__blobs[id].type, sizeBytes: W.__blobs[id].size, createdAt: new Date().toISOString() }; }), usage: { files: 0, bytes: 0, maxFiles: 1000, maxBytes: 1e9 } }); },
    delete: function (ref) { var id = String(ref).replace(/^\/_blob\//, ""); var had = !!W.__blobs[id]; delete W.__blobs[id]; return Promise.resolve({ deleted: had }); }
  });

  var memo = {};
  var NS = { user: user, artifact: artifact, assets: function () { return ls("mock_noassets") === "1" || !canEdit() ? null : assets; } };
  var claude = Object.freeze({
    use: function (n) {
      if (!Object.prototype.hasOwnProperty.call(NS, n)) return wait(5).then(function () { return null; });
      if (!memo[n]) memo[n] = wait(15).then(function () { return typeof NS[n] === "function" ? NS[n]() : NS[n]; });
      return memo[n];
    }
  });
  Object.defineProperty(W, "claude", { value: claude, configurable: false, writable: false });
})();
