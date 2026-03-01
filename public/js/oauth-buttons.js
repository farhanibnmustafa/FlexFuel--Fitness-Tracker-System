(function () {
  const showPromptAlert = (message, options = {}) => {
    if (window.FFPrompt?.alert) {
      return window.FFPrompt.alert(message, options);
    }
    window.alert(message);
    return Promise.resolve();
  };

  function getClient() {
    if (!window.supabaseClient) {
      console.warn('[Supabase] Client unavailable.');
      return null;
    }
    return window.supabaseClient;
  }

  function normalizeRedirectTarget(rawValue, fallbackPath = '/health.html?from=login') {
    if (!rawValue || typeof rawValue !== 'string') {
      return `${window.location.origin}${fallbackPath}`;
    }
    try {
      return new URL(rawValue, window.location.origin).toString();
    } catch {
      return `${window.location.origin}${fallbackPath}`;
    }
  }

  function enforceRedirectOnOAuthUrl(oauthUrl, expectedRedirectTo) {
    if (!oauthUrl || !expectedRedirectTo) return oauthUrl;
    try {
      const parsed = new URL(oauthUrl);
      if (!parsed.searchParams.has('redirect_to')) {
        return oauthUrl;
      }
      const current = parsed.searchParams.get('redirect_to') || '';
      if (current === expectedRedirectTo) {
        return oauthUrl;
      }
      parsed.searchParams.set('redirect_to', expectedRedirectTo);
      return parsed.toString();
    } catch {
      return oauthUrl;
    }
  }

  async function startOAuth(provider, button) {
    const client = getClient();
    if (!client) return;
    const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    const host = window.location.hostname;
    const isLocalhostHost =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '[::1]';

    if (isTouchDevice && isLocalhostHost) {
      showPromptAlert(
        'Use your Mac IP address on phone (example: http://192.168.x.x:3001/login.html), not localhost.'
      );
      return;
    }

    const redirectOverride = button?.dataset?.oauthRedirect;
    const redirectTo = normalizeRedirectTarget(
      redirectOverride,
      '/health.html?from=login'
    );
    const scopes =
      button?.dataset?.oauthScopes ||
      (provider === 'facebook' ? 'public_profile email' : undefined);
    const queryParams =
      provider === 'facebook' && isTouchDevice
        ? { display: 'touch' }
        : undefined;

    const setLoading = (state) => {
      if (!button) return;
      button.disabled = state;
      button.classList.toggle('is-loading', state);
    };

    setLoading(true);
    try {
      const { data, error } = await client.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes,
          queryParams,
          skipBrowserRedirect: true
        }
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Missing OAuth redirect URL');
      const oauthUrl = enforceRedirectOnOAuthUrl(data.url, redirectTo);
      window.location.assign(oauthUrl);
    } catch (error) {
      console.error(`[Supabase] OAuth start failed for ${provider}`, error);
      setLoading(false);
      showPromptAlert('Unable to start social sign-in. Please try again.');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-oauth-provider]').forEach((btn) => {
      const provider = btn.getAttribute('data-oauth-provider');
      if (!provider) return;
      btn.addEventListener('click', () => {
        void startOAuth(provider, btn);
      });
    });
  });
})();
