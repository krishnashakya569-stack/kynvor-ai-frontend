import { createClient } from '@supabase/supabase-js'

function cleanEnv(value) {
  return String(value || '').trim().replace(/^["']|["']$/g, '')
}

function isValidSupabaseUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

const envSupabaseUrl = cleanEnv(import.meta.env.VITE_SUPABASE_URL)
const envSupabaseAnonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)

export const supabaseUrl = isValidSupabaseUrl(envSupabaseUrl) ? envSupabaseUrl : ''

export const supabaseAnonKey = envSupabaseAnonKey || ''

export const supabaseConfigError = !isValidSupabaseUrl(supabaseUrl) || !supabaseAnonKey
  ? 'Supabase is not configured correctly.'
  : ''

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  })