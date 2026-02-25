(function () {
  const LOGOUT_SELECTOR = '#logoutBtn, [data-logout]';
  const BOUND_FLAG = 'ffLogoutBound';
  let logoutInProgress = false;

  async function runLogout({ redirectTo = 'login.html' } = {}) {
    if (logoutInProgress) return;
    logoutInProgress = true;
    try {
      if (window.supabaseClient?.auth) {
        try {
          await window.supabaseClient.auth.signOut();
        } catch (err) {
          console.warn('Failed to sign out Supabase session', err);
        }
      }
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Failed to logout', err);
    } finally {
      window.location.href = redirectTo;
    }
  }

  function bindLogoutElement(element) {
    if (!element || element.dataset[BOUND_FLAG] === 'true') return;
    element.dataset[BOUND_FLAG] = 'true';

    const tagName = element.tagName?.toUpperCase();
    const isNativeControl = tagName === 'BUTTON' || tagName === 'A';
    if (!isNativeControl) {
      if (!element.hasAttribute('role')) {
        element.setAttribute('role', 'button');
      }
      if (!element.hasAttribute('tabindex')) {
        element.setAttribute('tabindex', '0');
      }
    }

    element.addEventListener('click', (event) => {
      event.preventDefault();
      runLogout();
    });

    element.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      runLogout();
    });
  }

  function bindLogout(root = document) {
    root.querySelectorAll(LOGOUT_SELECTOR).forEach((element) => {
      bindLogoutElement(element);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bindLogout());
  } else {
    bindLogout();
  }

  window.FFLogout = Object.freeze({
    bind: bindLogout,
    run: runLogout
  });
})();
