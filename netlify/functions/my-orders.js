/* The signed-in customer's own orders, plus whether they are the shop admin. */
const L = require("./_lib");
exports.handler = async function (event) {
  if (!L.configured()) return L.json(503, { error: "not_configured" });
  const user = await L.userFrom(event);
  if (!user) return L.json(401, { error: "sign_in" });
  const r = await L.db().from("orders")
    .select("oid,items,total,status,status_note,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
  if (r.error) return L.json(500, { error: "load" });
  return L.json(200, { email: user.email, admin: L.isAdmin(user), orders: r.data });
};
