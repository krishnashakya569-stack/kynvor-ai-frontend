import { createClient } from '@supabase/supabase-js'

const DEFAULT_SUPABASE_URL = 'https://cctuzcommxsfyxzvfqpq.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjdHV6Y29tbXhzZnl4enZmcXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzkzMzYsImV4cCI6MjA5NDUxNTMzNn0.6k11UZi3FWr2Hzy1DYpgXVsLAK64CjLT2WEZbaJPhus'

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

export const supabaseUrl = isValidSupabaseUrl(envSupabaseUrl)
  ? envSupabaseUrl
  : DEFAULT_SUPABASE_URL

export const supabaseAnonKey = envSupabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY

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
