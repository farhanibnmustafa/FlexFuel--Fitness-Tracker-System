import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

let _client = null;

function getClient() {
  if (_client) return _client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[v0] Supabase env vars not set — client unavailable. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    return null;
  }

  _client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return _client;
}

export const supabase = new Proxy({}, {
  get(_target, prop) {
    const client = getClient();
    if (!client) throw new Error('Supabase client is not initialized. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    return client[prop];
  }
});

