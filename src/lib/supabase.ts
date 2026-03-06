import { createClient } from '@supabase/supabase-js';

// Since we are mocking auth first, we can just use the public ANON key for frontend interactions
// and use it everywhere. In production with RLS, you'd use proper server/client clients.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
