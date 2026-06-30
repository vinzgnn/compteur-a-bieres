import { createClient } from '@supabase/supabase-js'

// Client côté navigateur (clé anon publique)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)