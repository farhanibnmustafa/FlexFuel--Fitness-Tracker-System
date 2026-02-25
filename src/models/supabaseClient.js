import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// ESM imports are hoisted — this runs before server.js body.
// Try multiple .env locations to handle both local dev and sandbox environments.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try: alongside package.json (../../ from src/models/), then CWD
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const p of envPaths) {
  const result = dotenv.config({ path: p });
  if (!result.error) break;
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

