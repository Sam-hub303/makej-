import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

declare global {
  interface Window {
    _supabaseClient?: SupabaseClient;
  }
}

function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  if (!window._supabaseClient) {
    window._supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return window._supabaseClient;
}

export const supabase = getSupabaseClient();

