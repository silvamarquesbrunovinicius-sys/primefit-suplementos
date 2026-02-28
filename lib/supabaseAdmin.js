// lib/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  // aceita os 2 nomes (pra ficar robusto em produção)
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return {
      supabaseAdmin: null,
      envError:
        "Variáveis ausentes: NEXT_PUBLIC_SUPABASE_URL (ou SUPABASE_URL) e/ou SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  return { supabaseAdmin, envError: null };
}