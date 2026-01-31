document.addEventListener('DOMContentLoaded', async () => {
  const nameEl = document.querySelector('[data-profile-name]');
  const emailEl = document.querySelector('[data-profile-email]');
  const avatarImg = document.querySelector('[data-profile-avatar] img');
  const avatarWrapper = document.querySelector('[data-profile-avatar]');
  const avatarInput = document.querySelector('[data-profile-avatar-input]');
  const avatarPlaceholder = avatarImg?.dataset?.avatarPlaceholder || 'images/user.png';

  const profileForm = document.querySelector('[data-profile-form]');
  const formInputs = {
    weight_kg: document.querySelector('[data-profile-input="weight_kg"]'),
    height_cm: document.querySelector('[data-profile-input="height_cm"]'),
    age: document.querySelector('[data-profile-input="age"]'),
    target_weight: document.querySelector('[data-profile-input="target_weight"]')
  };

  const preferenceSelect = document.querySelector('[data-profile-select="preference"]');
  const preferenceOtherInput = document.querySelector('[data-profile-input="preference-other"]');
  const allergyPickerEl = document.querySelector('[data-profile-allergies]');
  const allergyListEl = document.querySelector('[data-allergy-list]');
  const allergyCustomInput = document.querySelector('[data-allergy-custom]');
  const allergyAddBtn = document.querySelector('[data-allergy-add]');

  const bmiOutput = document.querySelector('[data-profile-bmi]');
  const activityOutput = document.querySelector('[data-profile-activity]');
  const goalOutput = document.querySelector('[data-profile-goal]');
  const caloriesOutput = document.querySelector('[data-profile-calories]');
  const targetWeightOutput = document.querySelector('[data-profile-target-weight]');
  const proteinOutput = document.querySelector('[data-profile-protein]');
  const macroBars = Array.from(document.querySelectorAll('[data-profile-macro]'));
  const macroLabels = Array.from(document.querySelectorAll('[data-profile-macro-label]'));
  const feedbackEl = document.querySelector('[data-profile-feedback]');

  const editBtn = document.querySelector('[data-profile-edit]');
  const cancelBtn = document.querySelector('[data-profile-cancel]');
  const saveBtn = document.querySelector('[data-profile-save]');
  const passwordBtn = document.querySelector('[data-profile-password]');

  const passwordModal = document.querySelector('[data-password-modal]');
  const passwordForm = document.querySelector('[data-password-form]');
  const passwordFeedback = document.querySelector('[data-password-feedback]');
  const passwordCloseButtons = Array.from(document.querySelectorAll('[data-password-close]'));

  const tabButtons = Array.from(document.querySelectorAll('[data-profile-tab]'));
  const panels = Array.from(document.querySelectorAll('[data-profile-panel]'));

  const APPLY_MACROS = {
    'lose weight': { protein: 35, carbs: 35, fat: 30 },
    'fat loss': { protein: 35, carbs: 35, fat: 30 },
    'weight loss': { protein: 33, carbs: 37, fat: 30 },
    'build muscle': { protein: 35, carbs: 45, fat: 20 },
    'muscle gain': { protein: 35, carbs: 45, fat: 20 },
    'improve endurance': { protein: 25, carbs: 55, fat: 20 },
    endurance: { protein: 25, carbs: 55, fat: 20 },
    'general fitness': { protein: 30, carbs: 45, fat: 25 },
    default: { protein: 30, carbs: 45, fat: 25 }
  };

  let profileData = null;
  let isEditing = false;
  let hasChanges = false;
  let selectedAllergies = new Set();

  const formatNumber = (value, options = {}) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    return number.toLocaleString('en-US', options);
  };

  const calcBMI = (weightKg, heightCm) => {
    const weight = Number(weightKg);
    const height = Number(heightCm);
    if (!(weight > 0) || !(height > 0)) return null;
    const meters = height / 100;
    if (!meters) return null;
    return Number((weight / (meters * meters)).toFixed(1));
  };

  const parseInputNumber = (inputEl) => {
    if (!inputEl) return null;
    const raw = inputEl.value;
    if (raw === '' || raw === null || raw === undefined) return null;
    const num = Number(raw);
    return Number.isFinite(num) ? num : null;
  };

  const parseInputText = (inputEl) => {
    if (!inputEl) return null;
    const value = String(inputEl.value || '').trim();
    return value ? value : null;
  };

  const setFeedback = (message, tone = 'info') => {
    if (!feedbackEl) return;
    feedbackEl.textContent = message || '';
    if (message) {
      feedbackEl.dataset.tone = tone;
    } else {
      delete feedbackEl.dataset.tone;
    }
  };

  const markDirty = () => {
    if (!isEditing) return;
    hasChanges = true;
    if (saveBtn) saveBtn.disabled = false;
    setFeedback('Unsaved changes');
  };

  const syncPreferenceVisibility = () => {
    if (!preferenceSelect || !preferenceOtherInput) return;
    const isOther = preferenceSelect.value === 'other';
    preferenceOtherInput.hidden = !isOther;
    preferenceOtherInput.disabled = !isEditing || !isOther;
  };

  const parsePreferenceValue = (value) => {
    if (!value) return '';
    if (Array.isArray(value)) return value[0] || '';
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed[0] || '';
      } catch (err) {
        /* ignore */
      }
      const trimmed = value.trim();
      const lowered = trimmed.toLowerCase();
      if (!trimmed || lowered === 'none' || lowered === 'no preference') return '';
      return trimmed;
    }
    return '';
  };

  const parseAllergies = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.toLowerCase() === 'none') return [];
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        const parts = trimmed.split(',');
        if (parts.length > 1) return parts.map((item) => item.trim()).filter(Boolean);
      }
      return trimmed ? [trimmed] : [];
    }
    return [];
  };

  const ensureAllergyChip = (value) => {
    if (!allergyListEl) return null;
    const trimmed = String(value || '').trim();
    if (!trimmed) return null;
    const existing = Array.from(allergyListEl.querySelectorAll('[data-allergy-chip]')).find(
      (chip) => chip.dataset.allergyChip === trimmed
    );
    if (existing) return existing;
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'allergy-chip';
    chip.dataset.allergyChip = trimmed;
    chip.textContent = trimmed;
    allergyListEl.appendChild(chip);
    return chip;
  };

  const renderAllergyChips = () => {
    if (!allergyListEl) return;
    const chips = Array.from(allergyListEl.querySelectorAll('[data-allergy-chip]'));
    selectedAllergies.forEach((value) => {
      ensureAllergyChip(value);
    });
    const updatedChips = Array.from(allergyListEl.querySelectorAll('[data-allergy-chip]'));
    updatedChips.forEach((chip) => {
      const selected = selectedAllergies.has(chip.dataset.allergyChip);
      chip.classList.toggle('is-selected', selected);
    });
  };

  if (window.FFSupa?.syncFromHash) {
    try {
      await window.FFSupa.syncFromHash();
    } catch (err) {
      console.warn('Failed to sync Supabase session from hash', err);
    }
  }

  renderAllergyChips();
  syncPreferenceVisibility();

  const determineActivityLevel = (totalLoad) => {
    if (!Number.isFinite(totalLoad)) return 'Moderate';
    if (totalLoad >= 14) return 'Very Active';
    if (totalLoad >= 9) return 'Active';
    if (totalLoad >= 5) return 'Light';
    return 'Recovery';
  };

  const inferMacros = (goalText) => {
    if (!goalText) return APPLY_MACROS.default;
    const key = goalText.toLowerCase();
    const matched = Object.keys(APPLY_MACROS).find((preset) => key.includes(preset));
    return APPLY_MACROS[matched || 'default'];
  };

  const updateMacroDisplay = (percentages) => {
    macroBars.forEach((bar) => {
      const key = bar.dataset.profileMacro;
      if (!key) return;
      const pct = Math.max(0, Math.min(100, Math.round(percentages[key] || 0)));
      bar.style.width = `${pct}%`;
    });
    macroLabels.forEach((label) => {
      const key = label.dataset.profileMacroLabel;
      if (!key) return;
      const pct = Math.max(0, Math.min(100, Math.round(percentages[key] || 0)));
      label.textContent = `${pct}%`;
    });
  };

  const buildPlanSummary = (profile) => {
    if (!window.FlexPlan || !profile) return null;
    try {
      const plan = window.FlexPlan.buildDailyPlans(profile, { startDate: new Date(), days: 1 });
      const dateKey = Object.keys(plan.mealsByDate || {})[0];
      if (!dateKey) return null;
      const summary = plan.mealsByDate[dateKey];
      const workouts = (plan.workoutsByDate || {})[dateKey] || {};
      return {
        calories: summary?.targetCalories || null,
        macros: summary?.macroTargets || null,
        load: workouts.totalLoad || null
      };
    } catch (err) {
      console.warn('Failed to build plan summary', err);
      return null;
    }
  };

  const updatePlanDisplay = (profile) => {
    const goalText = profile?.goal || 'General Fitness';
    goalOutput && (goalOutput.textContent = goalText);

    let plannedCalories = null;
    let macroPercentages = null;
    const summary = buildPlanSummary(profile);
    if (summary) {
      plannedCalories = summary.calories;
      if (summary.macros) {
        const macroTargets = summary.macros;
        const proteinCalories = (macroTargets.protein || 0) * 4;
        const carbCalories = (macroTargets.carbs || 0) * 4;
        const fatCalories = (macroTargets.fat || 0) * 9;
        const totalCalories = proteinCalories + carbCalories + fatCalories;
        if (totalCalories > 0) {
          macroPercentages = {
            protein: (proteinCalories / totalCalories) * 100,
            carbs: (carbCalories / totalCalories) * 100,
            fat: (fatCalories / totalCalories) * 100
          };
        }
        if (proteinOutput) {
          proteinOutput.textContent = formatNumber(macroTargets.protein || 0);
        }
      }
      activityOutput && (activityOutput.textContent = determineActivityLevel(summary.load));
    } else {
      activityOutput && (activityOutput.textContent = determineActivityLevel(null));
      if (proteinOutput) {
        proteinOutput.textContent = '—';
      }
    }

    if (!macroPercentages) {
      macroPercentages = inferMacros(goalText);
    }
    updateMacroDisplay(macroPercentages);

    const fallbackCalories = profile?.weight_kg ? Math.round(Number(profile.weight_kg) * 30) : 1800;
    const caloriesValue = plannedCalories || fallbackCalories;
    caloriesOutput && (caloriesOutput.textContent = formatNumber(caloriesValue));
    if (proteinOutput && (!summary || !summary.macros)) {
      const proteinPercent = macroPercentages.protein || 0;
      const proteinGrams = Math.round((caloriesValue * proteinPercent) / 400);
      proteinOutput.textContent = formatNumber(proteinGrams);
    }
    targetWeightOutput && (targetWeightOutput.textContent = profile?.target_weight ? formatNumber(profile.target_weight) : '—');
  };

  const populateForm = (profile) => {
    if (!profileForm) return;
    Object.entries(formInputs).forEach(([key, input]) => {
      if (!input) return;
      const value = profile && key in profile ? profile[key] : null;
      input.value = value !== null && value !== undefined ? value : '';
      input.disabled = !isEditing;
    });
    const bmiValue = calcBMI(formInputs.weight_kg?.value, formInputs.height_cm?.value);
    bmiOutput && (bmiOutput.textContent = bmiValue ? formatNumber(bmiValue, { maximumFractionDigits: 1 }) : '—');

    const preferenceValue = parsePreferenceValue(profile?.preference);
    if (preferenceSelect) {
      const options = Array.from(preferenceSelect.options);
      const match = options.find((option) =>
        option.value && preferenceValue && option.value.toLowerCase() === preferenceValue.toLowerCase()
      );
      if (match) {
        preferenceSelect.value = match.value;
        if (preferenceOtherInput) {
          preferenceOtherInput.value = '';
        }
      } else {
        preferenceSelect.value = preferenceValue ? 'other' : '';
        if (preferenceOtherInput) {
          preferenceOtherInput.value = preferenceValue;
        }
      }
    }
    selectedAllergies = new Set(
      parseAllergies(profile?.allergies)
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    );
    renderAllergyChips();
    syncPreferenceVisibility();
    if (allergyCustomInput) allergyCustomInput.value = '';
  };

  const populateHero = (user, profile) => {
    const name = user?.name || 'FlexFule Member';
    const username = user?.username || 'athlete';
    const email = user?.email || `@${username}`;
    nameEl && (nameEl.textContent = name);
    emailEl && (emailEl.textContent = email);
    if (avatarImg) {
      avatarImg.src = profile?.avatar_url || avatarPlaceholder;
      avatarImg.alt = `${name}'s avatar`;
    }
  };

  const setEditingState = (state) => {
    isEditing = state;
    hasChanges = false;
    Object.values(formInputs).forEach((input) => {
      if (!input) return;
      input.disabled = !state;
    });
    avatarWrapper && avatarWrapper.classList.toggle('is-editable', state);
    if (editBtn) {
      editBtn.textContent = state ? 'Stop Editing' : 'Edit';
      editBtn.setAttribute('aria-pressed', state ? 'true' : 'false');
    }
    if (preferenceSelect) {
      preferenceSelect.disabled = !state;
    }
    syncPreferenceVisibility();
    if (allergyCustomInput) {
      allergyCustomInput.disabled = !state;
      if (!state) allergyCustomInput.value = '';
    }
    if (allergyAddBtn) {
      allergyAddBtn.disabled = !state;
    }
    allergyPickerEl && allergyPickerEl.classList.toggle('is-editable', state);
    if (saveBtn) {
      saveBtn.disabled = true;
    }
    if (cancelBtn) {
      cancelBtn.hidden = !state;
    }
    if (!state) {
      setFeedback('');
      populateForm(profileData?.profile || {});
      if (avatarInput) avatarInput.value = '';
    } else {
      setFeedback('Editing enabled. Update your details and click Save.');
      formInputs.weight_kg?.focus({ preventScroll: true });
    }
    renderAllergyChips();
  };

  const openPasswordModal = () => {
    if (!passwordModal) return;
    passwordModal.hidden = false;
    passwordModal.dataset.open = 'true';
    passwordFeedback && (passwordFeedback.textContent = '');
    passwordForm?.reset();
    const firstField = passwordForm?.querySelector('input');
    firstField?.focus();
  };

  const closePasswordModal = () => {
    if (!passwordModal) return;
    delete passwordModal.dataset.open;
    passwordModal.hidden = true;
    passwordFeedback && (passwordFeedback.textContent = '');
    passwordForm?.reset();
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.profileTab;
      tabButtons.forEach((button) => {
        const isActive = button === btn;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      panels.forEach((panel) => {
        const active = panel.dataset.profilePanel === target;
        panel.classList.toggle('is-hidden', !active);
        panel.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
    });
  });

  profileForm?.addEventListener('input', (event) => {
    if (!isEditing) return;
    if (event.target instanceof HTMLInputElement) {
      const key = event.target.dataset.profileInput;
      if (['weight_kg', 'height_cm'].includes(key)) {
        const bmiValue = calcBMI(formInputs.weight_kg?.value, formInputs.height_cm?.value);
        bmiOutput && (bmiOutput.textContent = bmiValue ? formatNumber(bmiValue, { maximumFractionDigits: 1 }) : '—');
      }
    }
    markDirty();
  });

  preferenceSelect?.addEventListener('change', () => {
    syncPreferenceVisibility();
    if (preferenceSelect.value !== 'other' && preferenceOtherInput) {
      preferenceOtherInput.value = '';
    }
    markDirty();
  });

  preferenceOtherInput?.addEventListener('input', markDirty);

  const addCustomAllergy = () => {
    if (!isEditing) return;
    const value = parseInputText(allergyCustomInput);
    if (!value) {
      setFeedback('Enter a valid allergy to add.', 'error');
      return;
    }
    selectedAllergies.add(value);
    ensureAllergyChip(value);
    renderAllergyChips();
    if (allergyCustomInput) allergyCustomInput.value = '';
    markDirty();
  };

  allergyListEl?.addEventListener('click', (event) => {
    if (!isEditing) return;
    const chip = event.target.closest('[data-allergy-chip]');
    if (!chip) return;
    const value = chip.dataset.allergyChip;
    if (!value) return;
    if (selectedAllergies.has(value)) {
      selectedAllergies.delete(value);
    } else {
      selectedAllergies.add(value);
    }
    renderAllergyChips();
    markDirty();
  });

  allergyAddBtn?.addEventListener('click', addCustomAllergy);
  allergyCustomInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addCustomAllergy();
    }
  });

  profileForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isEditing || !profileData) return;
    if (!hasChanges) {
      setFeedback('No changes to save.');
      return;
    }
    if (saveBtn) saveBtn.disabled = true;
    setFeedback('Saving...');
    const preferenceValue = preferenceSelect
      ? preferenceSelect.value === 'other'
        ? parseInputText(preferenceOtherInput)
        : preferenceSelect.value || null
      : null;
    if (preferenceSelect && preferenceSelect.value === 'other' && !preferenceValue) {
      setFeedback('Please specify your dietary preference.', 'error');
      if (saveBtn) saveBtn.disabled = false;
      return;
    }
    const normalizedPreference = preferenceValue ? String(preferenceValue).trim() : null;
    const allergiesArray = Array.from(selectedAllergies)
      .map((item) => String(item || '').trim())
      .filter(Boolean);

    const payload = {
      weight_kg: parseInputNumber(formInputs.weight_kg),
      height_cm: parseInputNumber(formInputs.height_cm),
      age: parseInputNumber(formInputs.age),
      target_weight: parseInputNumber(formInputs.target_weight),
      preference: normalizedPreference,
      allergies: allergiesArray
    };
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to update profile' }));
        throw new Error(error.error || 'Failed to update profile');
      }
      const data = await res.json();
      if (!profileData.user) profileData.user = {};
      profileData.profile = { ...(profileData.profile || {}), ...(data.profile || {}) };
      populateForm(profileData.profile);
      updatePlanDisplay(profileData.profile);
      setEditingState(false);
      setFeedback('Profile updated successfully.', 'success');
    } catch (err) {
      console.error(err);
      setFeedback(err.message || 'Failed to update profile', 'error');
      if (saveBtn) saveBtn.disabled = false;
    }
  });

  editBtn?.addEventListener('click', () => {
    setEditingState(!isEditing);
  });

  cancelBtn?.addEventListener('click', () => {
    setEditingState(false);
  });

  avatarWrapper?.addEventListener('click', () => {
    if (!isEditing) return;
    avatarInput?.click();
  });

  avatarInput?.addEventListener('change', () => {
    const file = avatarInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedback('Please choose an image file', 'error');
      avatarInput.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Please choose an image smaller than 2MB', 'error');
      avatarInput.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl !== 'string') return;
      if (avatarImg) avatarImg.src = dataUrl;
      setFeedback('Uploading photo...');
      try {
        const res = await fetch('/api/profile/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: dataUrl })
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({ error: 'Failed to update avatar' }));
          throw new Error(error.error || 'Failed to update avatar');
        }
        if (profileData) {
          if (!profileData.profile) profileData.profile = {};
          profileData.profile.avatar_url = dataUrl;
        }
        setFeedback('Profile photo updated.', 'success');
        avatarInput.value = '';
      } catch (err) {
        console.error(err);
        setFeedback(err.message || 'Failed to update avatar', 'error');
        avatarInput.value = '';
      }
    };
    reader.readAsDataURL(file);
  });

  passwordBtn?.addEventListener('click', openPasswordModal);
  passwordCloseButtons.forEach((btn) => btn.addEventListener('click', closePasswordModal));
  passwordModal?.addEventListener('click', (event) => {
    if (event.target === passwordModal) {
      closePasswordModal();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && passwordModal?.dataset.open === 'true') {
      closePasswordModal();
    }
  });

  passwordForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!passwordForm) return;
    const current = passwordForm.querySelector('[data-password-current]')?.value || '';
    const next = passwordForm.querySelector('[data-password-new]')?.value || '';
    const confirm = passwordForm.querySelector('[data-password-confirm]')?.value || '';
    if (!current || !next || !confirm) {
      passwordFeedback && (passwordFeedback.textContent = 'Please fill in all fields.');
      return;
    }
    if (next !== confirm) {
      passwordFeedback && (passwordFeedback.textContent = 'New passwords do not match.');
      return;
    }
    if (next.length < 8) {
      passwordFeedback && (passwordFeedback.textContent = 'Password must be at least 8 characters long.');
      return;
    }
    passwordFeedback && (passwordFeedback.textContent = 'Updating password...');
    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next })
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to change password' }));
        throw new Error(error.error || 'Failed to change password');
      }
      passwordFeedback && (passwordFeedback.textContent = 'Password updated.');
      setTimeout(() => {
        closePasswordModal();
      }, 900);
    } catch (err) {
      console.error(err);
      passwordFeedback && (passwordFeedback.textContent = err.message || 'Failed to change password.');
    }
  });

  const applyProfile = (payload) => {
    if (!payload) return;
    const user = payload.user || profileData?.user || {};
    const profile = payload.profile || payload.user?.profile || profileData?.profile || {};
    profileData = { user, profile };
    populateHero(user, profile);
    populateForm(profile);
    updatePlanDisplay(profile);
    setEditingState(false);
    setFeedback('');
  };

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.status === 401) {
        const bootstrapResult = await (window.FFSupa?.bootstrapSessionFromSupabase?.() ?? Promise.resolve({ ok: false }));
        if (bootstrapResult?.ok) {
          return loadProfile();
        }
        if (bootstrapResult?.reason === 'missing-account') {
          window.location.href = 'health.html';
        } else {
          window.location.href = 'login.html';
        }
        return;
      }
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      applyProfile({ user: data.user, profile: data.user?.profile || null });
    } catch (err) {
      console.error('Unable to load profile', err);
      setFeedback('Unable to load profile details.', 'error');
    }
  };

  loadProfile();
});
