/* Shared helpers for the order functions. Secrets come from Netlify environment variables, never from code. */
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

const STATUSES = ["received", "confirmed", "packed", "shipped", "delivered", "cancelled"];
const STATUS_LABEL = {
  received: "Order received", confirmed: "Payment confirmed", packed: "Packed",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled"
};
const STATUS_LINE = {
  received: "We have received your order. Please pay by UPI and send the payment screenshot to Jelam on WhatsApp.",
  confirmed: "Your payment is confirmed. We will pack your order soon.",
  packed: "Your order is packed and will be handed to the courier shortly.",
  shipped: "Your order is on its way.",
  delivered: "Your order has been delivered. We hope you enjoy it.",
  cancelled: "Your order has been cancelled. If this is a surprise, please message us on WhatsApp."
};

function env(name) { return process.env[name] || ""; }
function configured() {
  return !!(env("SUPABASE_URL") && env("SUPABASE_ANON_KEY") && env("SUPABASE_SERVICE_KEY"));
}
let _db;
function db() {
  if (!_db) _db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
  return _db;
}
function json(status, body) {
  return { statusCode: status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) };
}
function adminEmails() {
  return env("ADMIN_EMAILS").split(",").map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
}
/* The signed-in customer for this request, or null. The email must be confirmed, because the admin check
   is by email address and an unconfirmed sign-up could otherwise claim the owner's address. */
async function userFrom(event) {
  const h = event.headers || {};
  const m = /^Bearer (.+)$/.exec(h.authorization || h.Authorization || "");
  if (!m) return null;
  const r = await db().auth.getUser(m[1]);
  const u = r && r.data && r.data.user;
  if (!u || !u.email || !u.email_confirmed_at) return null;
  return u;
}
function isAdmin(u) { return !!u && adminEmails().indexOf(u.email.toLowerCase()) >= 0; }

function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
}
const inr = function (n) { return "₹" + Number(n).toLocaleString("en-IN"); };

let _tx;
function transport() {
  if (!_tx) _tx = nodemailer.createTransport({ service: "gmail", auth: { user: env("GMAIL_USER"), pass: env("GMAIL_APP_PASSWORD") } });
  return _tx;
}
async function sendMail(to, subject, text, html) {
  if (!env("GMAIL_USER") || !env("GMAIL_APP_PASSWORD")) return false;
  try {
    await transport().sendMail({ from: '"Soft Steps" <' + env("GMAIL_USER") + ">", to: to, subject: subject, text: text, html: html });
    return true;
  } catch (e) { console.error("mail failed", e && e.message); return false; }
}

function itemsText(o) {
  return o.items.map(function (x) { return "- " + x.name + ", " + x.size + " (" + x.colour + ") x " + x.q + " = " + inr(x.p * x.q); }).join("\n");
}
function itemsHtml(o) {
  return "<ul>" + o.items.map(function (x) {
    return "<li>" + esc(x.name) + ", " + esc(x.size) + " (" + esc(x.colour) + ") &times; " + x.q + " = " + esc(inr(x.p * x.q)) + "</li>";
  }).join("") + "</ul>";
}
/* kind: "received" for a new order, otherwise the new status. */
function customerMail(o, status, note) {
  const first = String(o.name).split(" ")[0];
  const subject = (status === "received" ? "We got your order " : STATUS_LABEL[status] + ": order ") + o.oid + " – Soft Steps";
  const text = "Hi " + first + ",\n\n" + STATUS_LINE[status] + (note ? "\n\nNote from Jelam: " + note : "") +
    "\n\nOrder " + o.oid + "\n" + itemsText(o) + "\nTotal: " + inr(o.total) + "\n\nDeliver to: " + o.name + ", " + o.address + ", " + o.city + " " + o.pin +
    "\n\nQuestions? Reply on WhatsApp: https://wa.me/919099441429\nSoft Steps, Vadodara";
  const html = "<p>Hi " + esc(first) + ",</p><p>" + esc(STATUS_LINE[status]) + "</p>" +
    (note ? "<p><b>Note from Jelam:</b> " + esc(note) + "</p>" : "") +
    "<p><b>Order " + esc(o.oid) + "</b></p>" + itemsHtml(o) + "<p>Total: <b>" + esc(inr(o.total)) + "</b></p>" +
    "<p>Deliver to: " + esc(o.name) + ", " + esc(o.address) + ", " + esc(o.city) + " " + esc(o.pin) + "</p>" +
    '<p>Questions? <a href="https://wa.me/919099441429">Message Jelam on WhatsApp</a>.<br>Soft Steps, Vadodara</p>';
  return { subject: subject, text: text, html: html };
}
function ownerMail(o) {
  const text = "New order " + o.oid + " from " + o.name + " (" + o.email + ", " + o.phone + ")\n\n" + itemsText(o) + "\nTotal: " + inr(o.total) +
    "\n\nAddress: " + o.address + ", " + o.city + " " + o.pin + (o.note ? "\nGift note: " + o.note : "");
  return { subject: "New order " + o.oid + " – " + inr(o.total), text: text, html: "<pre>" + esc(text) + "</pre>" };
}
module.exports = { STATUSES, STATUS_LABEL, env, configured, db, json, adminEmails, userFrom, isAdmin, sendMail, customerMail, ownerMail };
