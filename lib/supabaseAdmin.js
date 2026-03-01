// lib/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

function resolveEnv() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL; // (mantém)

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl) {
    return { envError: "SUPABASE_URL não definida. Defina SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_URL na Vercel." };
  }

  if (!serviceRoleKey) {
    return { envError: "SUPABASE_SERVICE_ROLE_KEY não definida. Defina SUPABASE_SERVICE_ROLE_KEY na Vercel." };
  }

  return { supabaseUrl, serviceRoleKey };
}

// ✅ FUNÇÃO (novo padrão)
export function getSupabaseAdmin() {
  const cfg = resolveEnv();
  if (cfg.envError) return { supabaseAdmin: null, envError: cfg.envError };

  const client = createClient(cfg.supabaseUrl, cfg.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { supabaseAdmin: client, envError: null };
}

// ✅ EXPORT ANTIGO (compatibilidade)
// Assim, mesmo que algum arquivo ainda importe { supabaseAdmin }, não quebra.
export const supabaseAdmin = (() => {
  const cfg = resolveEnv();
  if (cfg.envError) return null;

  return createClient(cfg.supabaseUrl, cfg.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
})();