import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const SUPABASE_URL = 'https://mdpvsvbbtuysazzdyjqr.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kcHZzdmJidHV5c2F6emR5anFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQzMjQsImV4cCI6MjA2ODUxMDMyNH0.WjiQxCBNuPpwdjfVrnx3cM8hbJRAvhD4QaUzp3xJmeY'

if (SUPABASE_URL === 'https://<PROJECT-ID>.supabase.co' || SUPABASE_ANON_KEY === '<ANON_KEY>') {
  throw new Error('Missing Supabase variables');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

export default supabase