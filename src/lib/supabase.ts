import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jmdiwmvnuggumscdmksr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_vTvyT8GaE2TmERlB7WoVoQ_MQ7xJnjm'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
