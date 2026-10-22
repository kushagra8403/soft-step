/* A signed-in customer records an order. Sends the confirmation email to the customer and a copy to the owner. */
const L = require("./_lib");

const str = function (v, max) { return typeof v === "string" ? v.trim().slice(0, max) : ""; };

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return L.json(405, { error: "method" });
  if (!L.configured()) return L.json(503, { error: "not_configured" });
  const user = await L.userFrom(event);
  if (!user) return L.json(401, { error: "sign_in" });

  let b; try { b = JSON.parse(event.body || "{}"); } catch (e) { return L.json(400, { error: "bad_json" }); }
  const d = b.details || {};
  const items = Array.isArray(b.items) ? b.items.slice(0, 30).map(function (x) {
    return { name: str(x && x.name, 80), size: str(x && x.size, 40), colour: str(x && x.colour, 60),
      q: Math.floor(Number(x && x.q)), p: Math.floor(Number(x && x.p)) };
  }) : [];
  const o = {
    oid: str(b.oid, 20), name: str(d.name, 100), phone: str(d.phone, 20), address: str(d.address, 500),
    city: str(d.city, 100), pin: str(d.pin, 6), note: str(b.note, 200), items: items,
    email: user.email, user_id: user.id
  };
  if (!/^SS-[A-Z0-9]{3,10}$/.test(o.oid) || !o.name || !/^[6-9]\d{9}$/.test(o.phone.replace(/\D/g, "").slice(-10)) ||
      o.address.length < 8 || !o.city || !/^[1-9]\d{5}$/.test(o.pin) || !items.length ||
      !items.every(function (x) { return x.name && x.size && x.colour && x.q >= 1 && x.q <= 50 && x.p >= 1 && x.p <= 999999; })) {
    return L.json(400, { error: "invalid" });
  }
  o.total = items.reduce(function (s, x) { return s + x.p * x.q; }, 0);

  const db = L.db();
  const ex = await db.from("orders").select("id,user_id").eq("oid", o.oid).maybeSingle();
  if (ex.data) {
    /* the shop retries the same order id; do not create or email twice */
    return L.json(ex.data.user_id === user.id ? 200 : 409, ex.data.user_id === user.id ? { ok: true, duplicate: true } : { error: "oid_taken" });
  }
  const ins = await db.from("orders").insert(o);
  if (ins.error) { console.error("insert failed", ins.error.message); return L.json(500, { error: "save" }); }

  const m = L.customerMail(o, "received");
  const sent = await L.sendMail(o.email, m.subject, m.text, m.html);
  const om = L.ownerMail(o);
  const owner = L.adminEmails()[0];
  if (owner) await L.sendMail(owner, om.subject, om.text, om.html);
  return L.json(200, { ok: true, emailed: sent });
};
