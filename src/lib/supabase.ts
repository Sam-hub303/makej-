import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

declare global {
  interface Window {
    _supabaseClient?: SupabaseClient;
  }
}

function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // SSR / build-time: create a throwaway client (never used at runtime in static export)
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  if (!window._supabaseClient) {
    window._supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // localStorage persists sessions correctly in Capacitor WebView,
        // unlike cookies which fail on capacitor:// and custom schemes
        persistSession: true,
        storageKey: 'makej-auth',
        storage: window.localStorage,
      },
    });
  }
  return window._supabaseClient;
}

export const supabase = getSupabaseClient();

