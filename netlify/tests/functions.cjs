/* Offline test of the order functions with Supabase and Gmail replaced by in-memory fakes. Run: node netlify/tests/functions.cjs */
const Module = require("module"), assert = require("assert"), path = require("path");
const rows = [], mails = [];
const users = {
  tc: { id: "u1", email: "cust@example.com", email_confirmed_at: "x" },
  ta: { id: "u2", email: "Owner@Example.com", email_confirmed_at: "x" },
  tu: { id: "u3", email: "owner@example.com", email_confirmed_at: null }
};
function q(table) {
  const f = []; let op = "select", patch = null, lim = 1e9;
  const api = {
    select() { return api; }, order() { return api; }, limit(n) { lim = n; return api; },
    eq(k, v) { f.push([k, v]); return api; },
    insert(o) { rows.push(Object.assign({ id: "id" + rows.length, status: "received", created_at: "2026-10-22T00:00:00Z" }, o)); return Promise.resolve({ error: null }); },
    update(p) { op = "update"; patch = p; return api; },
    maybeSingle() { const m = rows.filter(r => f.every(([k, v]) => r[k] === v)); if (op === "update" && m[0]) Object.assign(m[0], patch); return Promise.resolve({ data: m[0] || null, error: null }); },
    then(res) { res({ data: rows.filter(r => f.every(([k, v]) => r[k] === v)).slice(0, lim), error: null }); }
  };
  return api;
}
const real = Module._load;
Module._load = function (req, ...a) {
  if (req === "@supabase/supabase-js") return { createClient: () => ({ from: q, auth: { getUser: async t => ({ data: { user: users[t] || null } }) } }) };
  if (req === "nodemailer") return { createTransport: () => ({ sendMail: async m => { mails.push(m); } }) };
  return real.call(this, req, ...a);
};
Object.assign(process.env, { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "a", SUPABASE_SERVICE_KEY: "s", GMAIL_USER: "shop@gmail.com", GMAIL_APP_PASSWORD: "p", ADMIN_EMAILS: "owner@example.com" });
const fn = n => require(path.join(__dirname, "..", "functions", n)).handler;
const ev = (m, t, b) => ({ httpMethod: m, headers: t ? { authorization: "Bearer " + t } : {}, body: b ? JSON.stringify(b) : null });
const order = { oid: "SS-AB12CD", items: [{ name: "Solid Premium Rug", size: "M", colour: "Royal blue", q: 2, p: 450 }],
  details: { name: "Asha Shah", phone: "98765 43210", address: "12 Alkapuri Road", city: "Vadodara", pin: "390007" }, total: 1 };
(async () => {
  let r = await fn("place-order")(ev("POST", null, order)); assert.equal(r.statusCode, 401);
  r = await fn("place-order")(ev("POST", "tu", order)); assert.equal(r.statusCode, 401, "unconfirmed email rejected");
  r = await fn("place-order")(ev("POST", "tc", Object.assign({}, order, { details: { name: "A" } }))); assert.equal(r.statusCode, 400);
  r = await fn("place-order")(ev("POST", "tc", order)); assert.equal(r.statusCode, 200);
  assert.equal(rows[0].total, 900, "total is computed on the server, not trusted");
  assert.equal(mails.length, 2); assert.equal(mails[0].to, "cust@example.com"); assert.equal(mails[1].to, "owner@example.com");
  r = await fn("place-order")(ev("POST", "tc", order)); assert.equal(JSON.parse(r.body).duplicate, true); assert.equal(mails.length, 2, "no second email");
  r = await fn("place-order")(ev("POST", "ta", order)); assert.equal(r.statusCode, 409, "order id belongs to someone else");
  r = await fn("my-orders")(ev("GET", "tc")); assert.equal(JSON.parse(r.body).orders.length, 1); assert.equal(JSON.parse(r.body).admin, false);
  r = await fn("my-orders")(ev("GET", "ta")); assert.equal(JSON.parse(r.body).admin, true, "admin match ignores case");
  r = await fn("admin-orders")(ev("GET", "tc")); assert.equal(r.statusCode, 403);
  r = await fn("admin-orders")(ev("GET", "ta")); assert.equal(JSON.parse(r.body).orders.length, 1);
  r = await fn("admin-orders")(ev("POST", "tc", { id: rows[0].id, status: "shipped" })); assert.equal(r.statusCode, 403);
  r = await fn("admin-orders")(ev("POST", "ta", { id: rows[0].id, status: "bogus" })); assert.equal(r.statusCode, 400);
  r = await fn("admin-orders")(ev("POST", "ta", { id: rows[0].id, status: "shipped", note: "Courier: DTDC 123" }));
  assert.equal(JSON.parse(r.body).emailed, true); assert.equal(rows[0].status, "shipped");
  const m = mails[mails.length - 1]; assert.equal(m.to, "cust@example.com"); assert.ok(/Shipped/.test(m.subject) && /DTDC 123/.test(m.text));
  r = await fn("public-config")(ev("GET")); assert.equal(JSON.parse(r.body).anonKey, "a"); assert.ok(!r.body.includes("\"s\""), "service key never exposed");
  delete process.env.SUPABASE_SERVICE_KEY; r = await fn("public-config")(ev("GET")); assert.equal(r.statusCode, 404);
  console.log("functions OK");
})().catch(e => { console.error(e); process.exit(1); });
