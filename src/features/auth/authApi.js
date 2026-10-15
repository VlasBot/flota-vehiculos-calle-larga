import { supabase } from '../../lib/supabaseClient'

export async function iniciarSesion(email, password) {
  return supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
}
