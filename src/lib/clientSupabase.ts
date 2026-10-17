import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supaUrl = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL)) || '';
const supaKey = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY || import.meta.env.SUPABASE_KEY)) || '';

let client: SupabaseClient | null = null;

export function getClientSupabase(): SupabaseClient | null {
  if (client) return client;
  if (supaUrl && supaKey) {
    try {
      client = createClient(supaUrl, supaKey, {
        auth: { persistSession: false }
      });
      return client;
    } catch {
      return null;
    }
  }
  return null;
}

export async function hashPasswordClient(password: string): Promise<string> {
  const text = password + '_oshesh_salt_2026';
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
