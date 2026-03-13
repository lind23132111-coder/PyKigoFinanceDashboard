import { createClient } from '@supabase/supabase-js'

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
const schema = process.env.NEXT_PUBLIC_DB_SCHEMA || 'public'

// Provide dummy values for demo mode to prevent build-time crashes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || (isDemo ? 'https://demo.supabase.co' : '')
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || (isDemo ? 'demo-key' : '')

if (!supabaseUrl || !supabaseAnonKey) {
    if (!isDemo) {
        console.warn('⚠️ Supabase URL or Anon Key is missing. This will break non-demo functionality.')
    }
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder',
    {
        db: {
            schema: schema
        }
    }
)
