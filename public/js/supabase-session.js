(function () {
  let bootstrapInFlight = null;
  let lastBootstrapResult = null;

  async function syncFromHash() {
    if (!window.supabaseClient) return false;
    const rawHash = window.location.hash || '';
    if (!rawHash.startsWith('#') || rawHash.length <= 1) return false;

    const params = new URLSearchParams(rawHash.substring(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const hasError = params.get('error');

    try {
      if (accessToken && refreshToken) {
        await window.supabaseClient.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
      }
    } catch (err) {
      console.warn('[Supabase] Failed to persist session from hash', err);
    } finally {
      if (accessToken || refreshToken || hasError) {
        const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
    return Boolean(accessToken && refreshToken);
  }

  async function bootstrapSessionFromSupabase(force = false) {
    if (!force && lastBootstrapResult?.final) {
      return lastBootstrapResult.value;
    }

  if (!window.supabaseClient) {
    const result = { ok: false, reason: 'missing-client' };
    lastBootstrapResult = { final: false, value: result };
    return result;
  }

    if (!bootstrapInFlight) {
      bootstrapInFlight = (async () => {
        await syncFromHash();
        try {
          const { data, error } = await window.supabaseClient.auth.getSession();
          if (error || !data?.session?.access_token) {
            const result = { ok: false, reason: 'no-session' };
            lastBootstrapResult = { final: false, value: result };
            return result;
          }

          const res = await fetch('/api/oauth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: data.session.access_token })
          });

          if (res.status === 404) {
            const result = { ok: false, reason: 'missing-account' };
            lastBootstrapResult = { final: true, value: result };
            return result;
          }

          if (!res.ok) {
            const result = { ok: false, reason: 'server-error' };
            lastBootstrapResult = { final: false, value: result };
            return result;
          }

          const result = { ok: true };
          lastBootstrapResult = { final: true, value: result };
          return result;
        } catch (err) {
          console.warn('[Supabase] Unable to bootstrap session', err);
          const result = { ok: false, reason: 'network-error' };
          lastBootstrapResult = { final: false, value: result };
          return result;
        }
      })().finally(() => {
        bootstrapInFlight = null;
      });
    }

    return bootstrapInFlight;
  }

  window.FFSupa = Object.freeze({
    syncFromHash,
    bootstrapSessionFromSupabase
  });
})();
