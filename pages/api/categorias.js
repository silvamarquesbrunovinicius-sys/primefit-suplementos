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

async function garantirCategoriasBase() {
  // cria "Outro" e "Promoções" se não existirem
  const { data: existentes, error } = await supabaseAdmin
    .from("categorias")
    .select("slug");

  if (error) throw new Error(error.message);

  const slugs = new Set((existentes || []).map((c) => c.slug));

  const paraCriar = [];
  if (!slugs.has("outro")) paraCriar.push({ nome: "Outro", slug: "outro", ativo: true });
  if (!slugs.has("promocoes"))
    paraCriar.push({ nome: "Promoções", slug: "promocoes", ativo: true });

  if (paraCriar.length) {
    const { error: e2 } = await supabaseAdmin.from("categorias").insert(paraCriar);
    if (e2) throw new Error(e2.message);
  }
}

function normalizeId(id) {
  if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
  return id;
}

export default async function handler(req, res) {
  try {
    // GET público
    if (req.method === "GET") {
      await garantirCategoriasBase();

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

    // DELETE admin
    if (req.method === "DELETE") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Senha inválida" });

      const id = normalizeId(req.query.id);
      if (!id) return res.status(400).json({ error: "ID é obrigatório" });

      const { data: cat, error: e1 } = await supabaseAdmin
        .from("categorias")
        .select("slug")
        .eq("id", id)
        .maybeSingle();

      if (e1) return res.status(400).json({ error: e1.message });
      if (!cat) return res.status(404).json({ error: "Categoria não encontrada" });

      if (cat.slug === "promocoes" || cat.slug === "outro") {
        return res.status(400).json({ error: "Essa categoria não pode ser removida." });
      }

      const { error } = await supabaseAdmin.from("categorias").delete().eq("id", id);
      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Erro interno" });
  }
}