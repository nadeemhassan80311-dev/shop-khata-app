// ============================================
// Supabase Configuration
// ============================================
// Apne Supabase project se URL aur ANON KEY yahan dalein.
// Ye Project Settings > API me milte hain (supabase.com/dashboard)
// ============================================

const SUPABASE_URL = "https://cgcltmtaeipfkkflxgzm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnY2x0bXRhZWlwZmtrZmx4Z3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MDE0MDQsImV4cCI6MjEwNjA3NzQwNH0.H97WXixDtyKLkVQGcKoUPUqhnWCqFDUbk_68zr0NA7o";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);