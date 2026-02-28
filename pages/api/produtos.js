// pages/api/produtos.js
import { supabaseAdmin } from "../../lib/supabaseAdmin";

function isAdmin(req) {
  const pass = req.headers["x-admin-password"];
  return pass && pass === process.env.ADMIN_PASSWORD;
}

function toNumberPreco(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function cleanStr(v) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function ensureArray(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return [];
}

export default async function handler(req, res) {
  try {
    // =========================
    // GET (público ou admin)
    // =========================
    if (req.method === "GET") {
      const isAdminMode = String(req.query.admin || "") === "1";

      // admin precisa senha
      if (isAdminMode && !isAdmin(req)) {
        return res.status(401).json({ error: "Senha inválida" });
      }

      const q = supabaseAdmin
        .from("produtos")
        .select("id,nome,preco,categoria,destaque,descricao,ativo,imagem_url,imagens,created_at")
        .order("created_at", { ascending: false });

      // público só ativos
      if (!isAdminMode) q.eq("ativo", true);

      const { data, error } = await q;
      if (error) return res.status(400).json({ error: error.message });

      return res.status(200).json(Array.isArray(data) ? data : []);
    }

    // =========================
    // POST (criar) - admin
    // =========================
    if (req.method === "POST") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Senha inválida" });

      const body = req.body || {};

      const nome = cleanStr(body.nome);
      const preco = toNumberPreco(body.preco);
      const categoria = cleanStr(body.categoria) || "Outro";

      if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });
      if (!preco || preco <= 0) return res.status(400).json({ error: "Preço inválido" });

      const imagens = ensureArray(body.imagens);
      const imagem_url = cleanStr(body.imagem_url) || (imagens[0] || null);

      if (!imagem_url) {
        return res.status(400).json({ error: "Envie pelo menos 1 imagem (imagem_url) ou imagens[]" });
      }

      const payload = {
        nome,
        preco,
        categoria,
        destaque: cleanStr(body.destaque),
        descricao: cleanStr(body.descricao),
        ativo: body.ativo !== false,
        imagem_url,
        imagens: imagens.length ? imagens : null,
      };

      const { data, error } = await supabaseAdmin
        .from("produtos")
        .insert(payload)
        .select("*")
        .maybeSingle();

      if (error) return res.status(400).json({ error: error.message });
      if (!data) return res.status(500).json({ error: "Falha ao criar produto" });

      return res.status(200).json(data);
    }

    // =========================
    // PUT (editar) - admin
    // =========================
    if (req.method === "PUT") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Senha inválida" });

      const body = req.body || {};
      const id = body.id;

      // ✅ aqui resolve 90% dos casos
      if (!id) return res.status(400).json({ error: "ID do produto é obrigatório para editar" });

      const nome = cleanStr(body.nome);
      const preco = toNumberPreco(body.preco);
      const categoria = cleanStr(body.categoria) || "Outro";

      if (!nome) return res.status(400).json({ error: "Nome é obrigatório" });
      if (!preco || preco <= 0) return res.status(400).json({ error: "Preço inválido" });

      const imagens = ensureArray(body.imagens);
      const imagem_url = cleanStr(body.imagem_url) || (imagens[0] || null);

      if (!imagem_url) {
        return res.status(400).json({ error: "imagem_url é obrigatório (ou imagens[0])" });
      }

      const payload = {
        nome,
        preco,
        categoria,
        destaque: cleanStr(body.destaque),
        descricao: cleanStr(body.descricao),
        ativo: body.ativo !== false,
        imagem_url,
        imagens: imagens.length ? imagens : null,
      };

      const { data, error } = await supabaseAdmin
        .from("produtos")
        .update(payload)
        .eq("id", id) // ✅ garante 1 linha
        .select("*")
        .maybeSingle(); // ✅ evita “Cannot coerce…”

      if (error) return res.status(400).json({ error: error.message });
      if (!data) return res.status(404).json({ error: "Produto não encontrado para editar" });

      return res.status(200).json(data);
    }

    // =========================
    // DELETE (remover) - admin
    // =========================
    if (req.method === "DELETE") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Senha inválida" });

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