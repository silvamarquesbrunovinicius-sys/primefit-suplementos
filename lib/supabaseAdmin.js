// lib/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl) {
    return { supabaseAdmin: null, envError: "SUPABASE_URL não definida na Vercel." };
  }

  if (!serviceRoleKey) {
    return { supabaseAdmin: null, envError: "SUPABASE_SERVICE_ROLE_KEY não definida na Vercel." };
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { supabaseAdmin, envError: null };
}