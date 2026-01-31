(function () {
  const config = window.__SUPABASE_CONFIG__ || {};
  if (!window.supabase) {
    console.warn('[Supabase] CDN script not loaded. Social login buttons will be disabled.');
    return;
  }
  if (!config.url || !config.anonKey) {
    console.warn('[Supabase] Missing public URL or anon key. Add SUPABASE_URL and SUPABASE_ANON_KEY to your environment.');
    return;
  }
  try {
    window.supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  } catch (err) {
    console.error('[Supabase] Failed to create client', err);
  }
})();
