// pages/api/upload.js
import formidable from "formidable";
import fs from "fs";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export const config = { api: { bodyParser: false } };

function isAdmin(req) {
  const pass = req.headers["x-admin-password"];
  return pass && pass === process.env.ADMIN_PASSWORD;
}

function getExtFromMime(mime = "") {
  const m = String(mime).toLowerCase();
  if (m.includes("jpeg")) return "jpg";
  if (m.includes("jpg")) return "jpg";
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  return "bin";
}

function stripExt(name = "") {
  return String(name).replace(/\.(webp|png|jpg|jpeg)$/i, "");
}

function safeBaseName(name = "") {
  return stripExt(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseForm(req) {
  const form = formidable({ multiples: true, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!isAdmin(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { fields, files } = await parseForm(req);

    const produtoId = String(fields.produtoId || "novo");
    const arr = files.files
      ? Array.isArray(files.files)
        ? files.files
        : [files.files]
      : [];

    if (!arr.length) return res.status(400).json({ error: "Nenhum arquivo enviado" });

    const publicUrls = [];

    for (const f of arr) {
      const mime = f.mimetype || "application/octet-stream";
      const ext = getExtFromMime(mime);

      const original = f.originalFilename || "imagem";
      const base = safeBaseName(original) || "imagem";

      const fileName = `${Date.now()}-${base}.${ext}`;
      const pathInBucket = `${produtoId}/${fileName}`;

      const buffer = fs.readFileSync(f.filepath);

      const { error: upErr } = await supabaseAdmin.storage
        .from("produtos")
        .upload(pathInBucket, buffer, {
          contentType: mime,
          upsert: true,
          cacheControl: "31536000",
        });

      if (upErr) throw upErr;

      const { data: pub } = supabaseAdmin.storage
        .from("produtos")
        .getPublicUrl(pathInBucket);

      publicUrls.push(pub.publicUrl);
    }

    return res.status(200).json({ publicUrls });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e?.message || "Erro no upload" });
  }
}