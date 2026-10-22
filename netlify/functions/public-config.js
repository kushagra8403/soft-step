/* Public (browser-safe) settings: the Supabase address and anon key. The anon key is designed to be public;
   the orders table has no public access, so it can't read or write orders. */
const { env, configured, json } = require("./_lib");
exports.handler = async function () {
  if (!configured()) return json(404, { enabled: false });
  return { statusCode: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
    body: JSON.stringify({ enabled: true, url: env("SUPABASE_URL"), anonKey: env("SUPABASE_ANON_KEY") }) };
};
