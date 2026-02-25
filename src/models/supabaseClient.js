import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env from every plausible root location.
// The sandbox copies files to /vercel/share/v0-next-shadcn/, so we try
// both 2-levels-up from this file AND process.cwd() as fallbacks.
const candidates = [
  path.resolve(__dirname, '../../.env'),          // local project root
  path.resolve(process.cwd(), '.env'),             // cwd (sandbox runtime)
  '/vercel/share/v0-project/.env',                 // absolute sandbox project path
];
for (const p of candidates) {
  const result = dotenv.config({ path: p });
  if (!result.error) break;
}

// Use a lazy getter so we never throw at module-load time.
// The client is created on first use, by which point env vars must be set.
let _client = null;

function getSupabase() {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
    );
  }

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  return _client;
}

export const supabase = new Proxy({}, {
  get(_target, prop) {
    return getSupabase()[prop];
  }
});
