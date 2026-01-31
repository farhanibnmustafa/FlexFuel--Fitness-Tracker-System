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

  function startOAuth(provider, button) {
    const client = getClient();
    if (!client) return;
    const redirectOverride = button?.dataset?.oauthRedirect;
    const redirectTo =
      redirectOverride ||
      `${window.location.origin}/health.html`;
    const scopes =
      button?.dataset?.oauthScopes ||
      (provider === 'facebook' ? 'public_profile email' : undefined);

    const setLoading = (state) => {
      if (!button) return;
      button.disabled = state;
      button.classList.toggle('is-loading', state);
    };

    setLoading(true);
    client.auth
      .signInWithOAuth({
        provider,
        options: { redirectTo, scopes }
      })
      .catch((error) => {
        console.error(`[Supabase] OAuth start failed for ${provider}`, error);
        setLoading(false);
        showPromptAlert('Unable to start social sign-in. Please try again.');
      });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-oauth-provider]').forEach((btn) => {
      const provider = btn.getAttribute('data-oauth-provider');
      if (!provider) return;
      btn.addEventListener('click', () => startOAuth(provider, btn));
    });
  });
})();
