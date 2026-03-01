// lib/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

let _client = null;

function getEnv() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE;

  return { supabaseUrl, serviceRoleKey };
}

// ✅ Exporta uma FUNÇÃO (lazy), para evitar "throw" em tempo de import/build
export function supabaseAdmin() {
  const { supabaseUrl, serviceRoleKey } = getEnv();

  if (!supabaseUrl) {
    return {
      supabaseAdmin: null,
      envError:
        "SUPABASE_URL não definida. Defina SUPABASE_URL (recomendado) ou NEXT_PUBLIC_SUPABASE_URL na Vercel.",
    };
  }

  if (!serviceRoleKey) {
    return {
      supabaseAdmin: null,
      envError:
        "SUPABASE_SERVICE_ROLE_KEY não definida. Defina SUPABASE_SERVICE_ROLE_KEY na Vercel.",
    };
  }

  if (!_client) {
    _client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return { supabaseAdmin: _client, envError: null };
}

// (Opcional) Se em algum lugar você precisar do client direto:
// export function supabaseAdminClient() {
//   const { supabaseAdmin, envError } = supabaseAdmin();
//   if (envError) throw new Error(envError);
//   return supabaseAdmin;
// }