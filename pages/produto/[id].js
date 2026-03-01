import { getSupabaseAdmin } from "../../../lib/supabaseAdmin";

export default async function handler(req, res) {
  try {
    const { supabaseAdmin, envError } = getSupabaseAdmin();
    if (envError) return res.status(500).json({ error: envError });

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "ID é obrigatório" });

    const { data, error } = await supabaseAdmin
      .from("produtos")
      .select("id,nome,preco,categoria,destaque,descricao,ativo,imagem_url,imagens,created_at")
      .eq("id", id)
      .eq("ativo", true)
      .maybeSingle();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Produto não encontrado" });

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Erro interno" });
  }
}