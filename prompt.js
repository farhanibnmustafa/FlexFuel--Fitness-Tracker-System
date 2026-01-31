(() => {
  const STATE = {
    resolver: null,
    mode: 'alert',
    open: false
  };

  const promptMarkup = `
    <div class="ff-prompt-backdrop" data-ff-prompt-backdrop aria-hidden="true">
      <div class="ff-prompt" role="dialog" aria-modal="true" aria-labelledby="ffPromptTitle" aria-describedby="ffPromptMessage">
        <div class="ff-prompt-header">
          <span class="ff-prompt-icon" aria-hidden="true"></span>
          <h3 class="ff-prompt-title" id="ffPromptTitle"></h3>
        </div>
        <p class="ff-prompt-message" id="ffPromptMessage"></p>
        <div class="ff-prompt-actions">
          <button class="ff-prompt-btn ghost" type="button" data-action="cancel">Cancel</button>
          <button class="ff-prompt-btn primary" type="button" data-action="confirm">OK</button>
        </div>
      </div>
    </div>
  `;

  const ensurePrompt = () => {
    if (document.querySelector('[data-ff-prompt-backdrop]')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = promptMarkup.trim();
    document.body.appendChild(wrapper.firstElementChild);
  };

  const getElements = () => {
    const backdrop = document.querySelector('[data-ff-prompt-backdrop]');
    if (!backdrop) return null;
    return {
      backdrop,
      dialog: backdrop.querySelector('.ff-prompt'),
      title: backdrop.querySelector('.ff-prompt-title'),
      message: backdrop.querySelector('.ff-prompt-message'),
      cancelBtn: backdrop.querySelector('[data-action="cancel"]'),
      confirmBtn: backdrop.querySelector('[data-action="confirm"]')
    };
  };

  const closePrompt = (result) => {
    const els = getElements();
    if (!els) return;
    els.backdrop.classList.remove('is-open');
    els.backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ff-prompt-open');
    STATE.open = false;
    const resolver = STATE.resolver;
    STATE.resolver = null;
    if (resolver) resolver(result);
  };

  const openPrompt = ({ title, message, mode, confirmText, cancelText, tone }) => {
    ensurePrompt();
    const els = getElements();
    if (!els) return Promise.resolve(false);

    if (STATE.open) {
      closePrompt(false);
    }

    STATE.open = true;
    STATE.mode = mode;
    els.title.textContent = title || (mode === 'confirm' ? 'Please confirm' : 'Heads up');
    els.message.textContent = message || '';
    els.dialog.dataset.tone = tone || 'info';
    els.confirmBtn.textContent = confirmText || (mode === 'confirm' ? 'Confirm' : 'OK');
    els.cancelBtn.textContent = cancelText || 'Cancel';
    els.cancelBtn.style.display = mode === 'confirm' ? 'inline-flex' : 'none';
    els.confirmBtn.classList.toggle('danger', tone === 'danger');

    els.backdrop.classList.add('is-open');
    els.backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ff-prompt-open');

    setTimeout(() => {
      els.confirmBtn?.focus();
    }, 0);

    return new Promise((resolve) => {
      STATE.resolver = resolve;
    });
  };

  const onBackdropClick = (event) => {
    const els = getElements();
    if (!els || event.target !== els.backdrop) return;
    closePrompt(false);
  };

  const onButtonClick = (event) => {
    const action = event.target?.dataset?.action;
    if (!action) return;
    closePrompt(action === 'confirm');
  };

  const onKeyDown = (event) => {
    if (!STATE.open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closePrompt(false);
    }
  };

  const bindEvents = () => {
    const els = getElements();
    if (!els) return;
    els.backdrop.addEventListener('click', onBackdropClick);
    els.backdrop.addEventListener('click', onButtonClick);
    document.addEventListener('keydown', onKeyDown);
  };

  const boot = () => {
    ensurePrompt();
    bindEvents();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.FFPrompt = {
    alert(message, options = {}) {
      return openPrompt({ ...options, message, mode: 'alert' });
    },
    confirm(message, options = {}) {
      return openPrompt({ ...options, message, mode: 'confirm' });
    }
  };
})();
