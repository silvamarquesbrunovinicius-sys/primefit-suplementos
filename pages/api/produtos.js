// pages/api/produtos.js
import { SupabaseAdmin } from "../../lib/supabaseAdmin";

function isAdmin(req) {
  const pass = req.headers["x-admin-password"];
  return pass && pass === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  try {
    const { supabaseAdmin, envError } = SupabaseAdmin();
    if (envError) return res.status(500).json({ error: envError });

    // =========================
    // GET (público ou admin)
    // =========================
    if (req.method === "GET") {
      const adminMode = req.query.admin === "1";

      if (adminMode && !isAdmin(req)) {
        return res.status(401).json({ error: "Senha inválida" });
      }

      let q = supabaseAdmin
        .from("produtos")
        .select(
          "id,nome,preco,categoria,destaque,descricao,ativo,imagem_url,imagens,created_at"
        )
        .order("created_at", { ascending: false });

      if (!adminMode) q = q.eq("ativo", true);

      const { data, error } = await q;
      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json(data || []);
    }

    // A partir daqui: só admin
    if (!isAdmin(req)) {
      return res.status(401).json({ error: "Senha inválida" });
    }

    // =========================
    // POST
    // =========================
    if (req.method === "POST") {
      const body = req.body || {};

      const nome = String(body.nome || "").trim();
      const preco = Number(String(body.preco || "").replace(",", "."));
      const categoria = String(body.categoria || "Outro").trim() || "Outro";

      if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });
      if (!preco || preco <= 0)
        return res.status(400).json({ error: "Preço inválido" });

      const payload = {
        nome,
        preco,
        categoria,
        destaque: body.destaque ? String(body.destaque).trim() : null,
        descricao: body.descricao ? String(body.descricao).trim() : null,
        ativo: body.ativo !== false,
        imagem_url: body.imagem_url ? String(body.imagem_url).trim() : null,
        imagens: Array.isArray(body.imagens) ? body.imagens : null,
      };

      const { data, error } = await supabaseAdmin
        .from("produtos")
        .insert(payload)
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // =========================
    // PUT
    // =========================
    if (req.method === "PUT") {
      const body = req.body || {};
      const id = body.id;

      if (!id) return res.status(400).json({ error: "ID do produto é obrigatório" });

      const nome = String(body.nome || "").trim();
      const preco = Number(String(body.preco || "").replace(",", "."));
      const categoria = String(body.categoria || "Outro").trim() || "Outro";

      if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });
      if (!preco || preco <= 0)
        return res.status(400).json({ error: "Preço inválido" });

      const payload = {
        nome,
        preco,
        categoria,
        destaque: body.destaque ? String(body.destaque).trim() : null,
        descricao: body.descricao ? String(body.descricao).trim() : null,
        ativo: body.ativo !== false,
        imagem_url: body.imagem_url ? String(body.imagem_url).trim() : null,
        imagens: Array.isArray(body.imagens) ? body.imagens : null,
      };

      const { data, error } = await supabaseAdmin
        .from("produtos")
        .update(payload)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) return res.status(400).json({ error: error.message });
      if (!data) return res.status(404).json({ error: "Produto não encontrado" });

      return res.status(200).json(data);
    }

    // =========================
    // DELETE
    // =========================
    if (req.method === "DELETE") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "ID é obrigatório" });

      const { error } = await supabaseAdmin.from("produtos").delete().eq("id", id);
      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Erro interno" });
  }
}