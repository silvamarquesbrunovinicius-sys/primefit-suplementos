// pages/api/produtos.js
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { pegarImagemProduto } from "@/lib/imagem";
function isAdmin(req) {
  const pass = req.headers["x-admin-password"];
  return pass && pass === process.env.ADMIN_PASSWORD;
}

// ✅ aceita array, string JSON, ou null
function normalizeImagens(v) {
  if (!v) return null;
  if (Array.isArray(v)) return v.filter(Boolean);

  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // se não for JSON, ignora
    }
  }
  return null;
}

export default async function handler(req, res) {
  try {
    // =========================
    // GET - listar produtos
    // =========================
    if (req.method === "GET") {
      const adminMode = req.query.admin === "1";

      let query = supabaseAdmin
        .from("produtos")
        .select("*")
        .order("created_at", { ascending: false });

      if (!adminMode) {
        query = query.eq("ativo", true);
      } else {
        if (!isAdmin(req)) {
          return res.status(401).json({ error: "Senha inválida" });
        }
      }

      const { data, error } = await query;

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data || []);
    }

    // =========================
    // POST - criar produto (admin)
    // =========================
    if (req.method === "POST") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Senha inválida" });

      const {
        nome,
        preco,
        categoria,
        destaque,
        descricao,
        imagem_url,
        imagens, // ✅ NOVO
        ativo,
      } = req.body || {};

      const imagensNorm = normalizeImagens(imagens);

      // ✅ se veio galeria e não veio imagem_url, usa a primeira como principal
      const imagemPrincipal =
        (imagem_url ? String(imagem_url).trim() : "") ||
        (imagensNorm?.[0] ? String(imagensNorm[0]).trim() : "") ||
        null;

      const payload = {
        nome: String(nome || "").trim(),
        preco: Number(preco || 0),
        categoria: String(categoria || "Outro").trim(),
        destaque: destaque ? String(destaque).trim() : null,
        descricao: descricao ? String(descricao).trim() : null,
        imagem_url: imagemPrincipal,
        imagens: imagensNorm, // ✅ SALVA NO BANCO
        ativo: ativo !== false,
      };

      if (!payload.nome) return res.status(400).json({ error: "Nome é obrigatório" });
      if (!payload.preco || payload.preco <= 0) {
        return res.status(400).json({ error: "Preço inválido" });
      }

      const { data, error } = await supabaseAdmin
        .from("produtos")
        .insert(payload)
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // =========================
    // PUT - atualizar produto (admin)
    // =========================
    if (req.method === "PUT") {
      if (!isAdmin(req)) return res.status(401).json({ error: "Senha inválida" });

      const {
        id,
        nome,
        preco,
        categoria,
        destaque,
        descricao,
        imagem_url,
        imagens, // ✅ NOVO
        ativo,
      } = req.body || {};

      if (!id) return res.status(400).json({ error: "ID é obrigatório" });

      const imagensNorm = normalizeImagens(imagens);

      // ✅ se veio galeria e não veio imagem_url, usa a primeira como principal
      const imagemPrincipal =
        (imagem_url ? String(imagem_url).trim() : "") ||
        (imagensNorm?.[0] ? String(imagensNorm[0]).trim() : "") ||
        null;

      const payload = {
        nome: String(nome || "").trim(),
        preco: Number(preco || 0),
        categoria: String(categoria || "Outro").trim(),
        destaque: destaque ? String(destaque).trim() : null,
        descricao: descricao ? String(descricao).trim() : null,
        imagem_url: imagemPrincipal,
        // ✅ só atualiza "imagens" se foi enviado
        ...(imagens !== undefined ? { imagens: imagensNorm } : {}),
        ativo: ativo !== false,
      };

      const { data, error } = await supabaseAdmin
        .from("produtos")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    }

    // =========================
    // DELETE - remover produto (admin)
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
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Erro interno" });
  }
}