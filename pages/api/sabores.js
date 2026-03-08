import { getSupabaseAdmin } from "../../lib/supabaseAdmin";

export default async function handler(req, res) {

  const { supabaseAdmin, envError } = getSupabaseAdmin();

  if (envError) {
    return res.status(500).json({ error: envError });
  }

  if (req.method === "GET") {

    const { data, error } = await supabaseAdmin
      .from("sabores")
      .select("*")
      .order("nome");

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json(data);

  }

  if (req.method === "POST") {

    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({ error: "Nome obrigatório" });
    }

    const { data, error } = await supabaseAdmin
      .from("sabores")
      .insert({ nome })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json(data);

  }

  res.status(405).json({ error: "Método não permitido" });

}