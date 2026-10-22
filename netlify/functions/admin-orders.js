/* Shop owner only. GET lists recent orders; POST changes an order's status and emails the customer. */
const L = require("./_lib");
exports.handler = async function (event) {
  if (!L.configured()) return L.json(503, { error: "not_configured" });
  const user = await L.userFrom(event);
  if (!user) return L.json(401, { error: "sign_in" });
  if (!L.isAdmin(user)) return L.json(403, { error: "not_admin" });
  const db = L.db();

  if (event.httpMethod === "GET") {
    const r = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
    if (r.error) return L.json(500, { error: "load" });
    return L.json(200, { orders: r.data });
  }
  if (event.httpMethod !== "POST") return L.json(405, { error: "method" });

  let b; try { b = JSON.parse(event.body || "{}"); } catch (e) { return L.json(400, { error: "bad_json" }); }
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 300) : "";
  if (typeof b.id !== "string" || L.STATUSES.indexOf(b.status) < 0) return L.json(400, { error: "invalid" });

  const r = await db.from("orders").update({ status: b.status, status_note: note || null, updated_at: new Date().toISOString() })
    .eq("id", b.id).select("*").maybeSingle();
  if (r.error || !r.data) return L.json(r.error ? 500 : 404, { error: r.error ? "save" : "not_found" });
  const m = L.customerMail(r.data, b.status, note);
  const emailed = await L.sendMail(r.data.email, m.subject, m.text, m.html);
  return L.json(200, { ok: true, emailed: emailed, order: r.data });
};
