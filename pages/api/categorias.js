// pages/api/categorias.js
import { supabaseAdmin } from "../../lib/supabaseAdmin";

function isAdmin(req) {
  const pass = req.headers["x-admin-password"];
  return pass && pass === process.env.ADMIN_PASSWORD;
}

function slugify(str = "") {
  return String(str)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default async function handler(req, res) {
  try {
    // GET público
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("categorias")
        .select("id,nome,slug,ativo,created_at")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data || []);
    }

    // POST admin
    if (req.method === "POST") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Senha inválida" });

      const { nome } = req.body || {};
      const nomeOk = String(nome || "").trim();
      if (!nomeOk) return res.status(400).json({ error: "Nome é obrigatório" });

      const slug = slugify(nomeOk);
      if (!slug) return res.status(400).json({ error: "Nome inválido" });

      const { data, error } = await supabaseAdmin
        .from("categorias")
        .insert({ nome: nomeOk, slug, ativo: true })
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // DELETE admin (por id)
    if (req.method === "DELETE") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Senha inválida" });

      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "ID é obrigatório" });

      // não deixa apagar Promoções e Outro
      const { data: cat } = await supabaseAdmin
        .from("categorias")
        .select("slug")
        .eq("id", id)
        .single();

      if (cat?.slug === "promocoes" || cat?.slug === "outro") {
        return res.status(400).json({ error: "Essa categoria não pode ser removida." });
      }

      const { error } = await supabaseAdmin.from("categorias").delete().eq("id", id);
      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Erro interno" });
  }
}