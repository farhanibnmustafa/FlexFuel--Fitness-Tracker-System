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

// Fallback credentials used when .env cannot be found (e.g. sandbox runtime).
const FALLBACK_URL = 'https://cfiblaukeslitumlbpuh.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaWJsYXVrZXNsaXR1bWxicHVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU4NzMyMiwiZXhwIjoyMDc2MTYzMzIyfQ.GaAoWoTqPGtYzWZm3QFcvU0n7q5LIUTh8Copc0WCPlo';

const supabaseUrl = process.env.SUPABASE_URL || FALLBACK_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
