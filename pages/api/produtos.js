// pages/api/produtos.js
import { supabaseAdmin } from "../../lib/supabaseAdmin";

function isAdmin(req) {
  // no Node/Vercel os headers chegam em lowercase
  const pass = req.headers["x-admin-password"];
  return !!pass && pass === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  return res.status(200).json({ ok: true, method: req.method });
}