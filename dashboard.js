if (window.FFSupa?.syncFromHash) {
  window.FFSupa.syncFromHash().catch((err) => {
    console.warn('Failed to sync Supabase session from hash', err);
  });
}

const sidebar = document.querySelector('.sidebar');
const sections = document.querySelector('.sections');
const hamburgerMenu = document.querySelector('.hamburger-menu');
const closeBtn = document.querySelector('.sidebar-close');
const themeToggle = document.querySelector('.theme-toggle');
const dayButtons = document.querySelectorAll('.day-picker .day');
const userNameEl = document.getElementById('userName');
const userAvatarEl = document.getElementById('userAvatar');
const userAvatarPlaceholder = userAvatarEl?.dataset?.avatarPlaceholder || 'images/user.png';
const greetingName = document.getElementById('greetingName');
const userGoalEl = document.getElementById('userGoal');
const greetingSub = document.getElementById('greetingSub');
const greetingDate = document.getElementById('greetingDate');
const datePickerInput = document.getElementById('dashboardDatePicker');
const logoutBtn = document.getElementById('logoutBtn');
const activityPercentEl = document.getElementById('activityPercent');
const activitySummaryEl = document.getElementById('activitySummary');
const targetCaloriesEl = document.getElementById('targetCalories');
const targetWaterEl = document.getElementById('targetWater');
const targetWorkoutEl = document.getElementById('targetWorkout');
const goalStreakEl = document.getElementById('goalStreak');
const progressCircle = document.querySelector('.ring .progress');
const mealSegments = document.querySelectorAll('.meal-segment');
const mealLegendItems = document.querySelectorAll('.meal-legend li');
const mealTooltip = document.getElementById('mealTooltip');
const mealTooltipTitle = document.getElementById('mealTooltipTitle');
const mealTooltipSummary = document.getElementById('mealTooltipSummary');
const goalBars = document.querySelectorAll('.goal-bars li');
const goalTooltip = document.getElementById('goalTooltip');
const goalWeekRangeEl = document.querySelector('.goal-week-range');
const goalFillEl = document.querySelector('.goal-fill');
const streakCardEl = document.getElementById('streakCard');
const streakLevelLabel = document.getElementById('streakLevelLabel');
const streakCurrentEl = document.getElementById('streakCurrent');

const GOAL_STORAGE_PREFIX = 'flexfule.goals';

const showPromptAlert = (message, options = {}) => {
  if (window.FFPrompt?.alert) {
    return window.FFPrompt.showPromptAlert(message, options);
  }
  window.showPromptAlert(message);
  return Promise.resolve();
};
const streakBestEl = document.getElementById('streakBest');
const streakTotalEl = document.getElementById('streakTotal');
const streakHistoryEl = document.getElementById('streakHistory');
const streakStatusMessageEl = document.getElementById('streakStatusMessage');

let dailyCalorieTarget = 0;
let latestActivityTotals = { totalCalories: 0, todayCalories: 0 };
let selectedDate = new Date();
const HISTORY_LOOKBACK_DAYS = 90;
let earliestAvailableDate = null;
let profileContext = null;
let currentUserId = null;
let goalNutritionTarget = 0;
let workoutEntries = [];
let setDayActiveFn = null;
const planCache = new Map();
let targetWorkoutMinutes = 45;
const CALORIES_PER_MINUTE_ESTIMATE = 8;
let hydrationTargetBaseMl = 600;

const formatCalories = (value) => `${Math.max(0, Math.round(Number(value) || 0))} kcal`;
const DAY_NAME_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: 'long' });
const FULL_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric'
});
const SHORT_LABEL_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const SHORT_DAY_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: 'short' });

const getGoalStorageKey = (suffix, userId) =>
  `${GOAL_STORAGE_PREFIX}.${suffix}.${userId || 'anonymous'}`;

const readGoalNutritionTarget = (userId) => {
  try {
    const raw = localStorage.getItem(getGoalStorageKey('nutrition', userId));
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const calories = Number(parsed?.calories || 0);
    return Number.isFinite(calories) ? Math.max(0, Math.round(calories)) : 0;
  } catch (err) {
    console.warn('Failed to read goal nutrition target', err);
    return 0;
  }
};

const formatDayAbbrev = (iso) => {
  if (!iso) return '--';
  const date = parseISODate(iso);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--';
  return SHORT_DAY_FORMATTER.format(date);
};

const renderStreakSummary = (summary) => {
  if (!streakCardEl) return;
  const stats = summary?.stats || { currentStreak: 0, longestStreak: 0, totalCompletedDays: 0 };
  const level = summary?.level || { label: 'Getting Started', description: "Log today's workout and meals to start your streak." };
  const history = Array.isArray(summary?.history) ? summary.history : [];
  const currentStreakValue = Math.max(0, Number(stats.currentStreak) || 0);
  if (streakCurrentEl) {
    streakCurrentEl.textContent = String(currentStreakValue);
  }
  if (streakBestEl) {
    streakBestEl.textContent = `${Math.max(0, Number(stats.longestStreak) || 0)} days`;
  }
  if (streakTotalEl) {
    streakTotalEl.textContent = `${Math.max(0, Number(stats.totalCompletedDays) || 0)} total days logged`;
  }
  if (streakLevelLabel) {
    streakLevelLabel.textContent = level?.label || 'Getting Started';
  }
  if (streakStatusMessageEl) {
    streakStatusMessageEl.textContent =
      level?.description || "Log today's workout and meals to start your streak.";
  }
  if (streakCardEl) {
    streakCardEl.classList.toggle('is-active', Boolean(stats.currentStreak));
  }

  if (streakHistoryEl) {
    if (history.length) {
      const todayIso = toISODate(new Date());
      streakHistoryEl.innerHTML = history
        .map((day) => {
          const liClasses = ['streak-day'];
          if (day.complete) liClasses.push('is-complete');
          if (day.iso === todayIso) liClasses.push('is-today');
          const workoutClasses = ['day-dot', 'workout'];
          if (day.workout) workoutClasses.push('is-complete');
          const mealClasses = ['day-dot', 'meal'];
          if (day.meal) mealClasses.push('is-complete');
          const workoutLabel = `Workout ${day.workout ? 'complete' : 'not complete'}`;
          const mealLabel = `Meals ${day.meal ? 'complete' : 'not complete'}`;
          return `<li class="${liClasses.join(' ')}" data-iso="${day.iso}">
            <span class="day-label">${formatDayAbbrev(day.iso)}</span>
            <div class="day-dots">
              <span class="${workoutClasses.join(' ')}" role="img" aria-label="${workoutLabel}"></span>
              <span class="${mealClasses.join(' ')}" role="img" aria-label="${mealLabel}"></span>
            </div>
          </li>`;
        })
        .join('');
    } else {
      streakHistoryEl.innerHTML = '<li class="streak-day"><span class="day-label">--</span></li>';
    }
  }

  if (goalStreakEl) {
    const label = currentStreakValue === 1 ? '1 day' : `${currentStreakValue} days`;
    goalStreakEl.textContent = label;
  }
  if (goalFillEl) {
    const weeklyTarget = 7;
    const clamped = Math.min(currentStreakValue / weeklyTarget, 1);
    goalFillEl.style.width = `${Math.round(clamped * 100)}%`;
  }
};

window.addEventListener('flexfule:streak-updated', (event) => {
  renderStreakSummary(event?.detail || null);
});

const mealDetails = {
  breakfast: {
    title: 'Breakfast',
    summary: '350 kcal (35% of daily goal)',
    macros: [
      { label: 'Protein', value: '25g (30%)' },
      { label: 'Carbs', value: '55g (50%)' },
      { label: 'Fat', value: '18g (20%)' }
    ]
  },
  lunch: {
    title: 'Lunch',
    summary: '600 kcal (40% of daily goal)',
    macros: [
      { label: 'Protein', value: '30g (28%)' },
      { label: 'Carbs', value: '70g (52%)' },
      { label: 'Fat', value: '22g (20%)' }
    ]
  },
  snacks: {
    title: 'Snacks',
    summary: '150 kcal (10% of daily goal)',
    macros: [
      { label: 'Protein', value: '6g (15%)' },
      { label: 'Carbs', value: '22g (63%)' },
      { label: 'Fat', value: '5g (22%)' }
    ]
  },
  dinner: {
    title: 'Dinner',
    summary: '500 kcal (15% of daily goal)',
    macros: [
      { label: 'Protein', value: '28g (35%)' },
      { label: 'Carbs', value: '45g (45%)' },
      { label: 'Fat', value: '16g (20%)' }
    ]
  }
};

const DASH_TOTAL = 326;
const SIDEBAR_STATE_KEY = 'flexfule-sidebar-state';
const THEME_KEY = 'flexfule-theme';
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

const requiresHealthProfile = (profile) => {
  if (!profile) return true;
  const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };
  const hasPositive = (value) => {
    const num = toNumber(value);
    return num !== null && num > 0;
  };
  const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
  return !(hasPositive(profile.height_cm) && hasPositive(profile.weight_kg) && hasText(profile.goal));
};

const applyTheme = (mode) => {
  const isLight = mode === 'light';
  document.body.classList.toggle('dark-mode', isLight);
  themeToggle?.classList.toggle('dark-mode', isLight);
  themeToggle?.setAttribute('aria-pressed', isLight ? 'true' : 'false');
  localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
};

const storedTheme = localStorage.getItem(THEME_KEY);
const initialTheme = storedTheme || (prefersDark.matches ? 'dark' : 'light');
applyTheme(initialTheme);

let attemptedOAuthBootstrap = false;

async function maybeBootstrapSession() {
  if (attemptedOAuthBootstrap) return { ok: false, reason: 'already-attempted' };
  attemptedOAuthBootstrap = true;
  if (!window.FFSupa?.bootstrapSessionFromSupabase) {
    return { ok: false, reason: 'unavailable' };
  }
  return window.FFSupa.bootstrapSessionFromSupabase();
}

async function fetchCurrentUser() {
  try {
    const res = await fetch('/api/me');
    if (res.status === 401) {
      const bootstrapResult = await maybeBootstrapSession();
      if (bootstrapResult?.ok) {
        attemptedOAuthBootstrap = true;
        return fetchCurrentUser();
      }
      if (bootstrapResult?.reason === 'missing-account') {
        window.location.href = 'health.html';
        return;
      }
      window.location.href = 'login.html';
      return;
    }
    if (!res.ok) throw new Error('Failed to load profile');
    const data = await res.json();
    const user = data.user || {};
    currentUserId = user.id || null;
    goalNutritionTarget = readGoalNutritionTarget(currentUserId);
    if (window.FFStreak) {
      window.FFStreak.init(user.id || null);
    }
    const profile = user.profile || {};
    const needsHealthInfo = Boolean(user.needsHealthInfo) || requiresHealthProfile(user.profile ?? null);
    if (needsHealthInfo) {
      window.location.href = 'health.html?from=login';
      return;
    }
    const name = user.name || 'Athlete';
    const fallbackAvatar = userAvatarPlaceholder;
    if (userAvatarEl) {
      const src = profile?.avatar_url || fallbackAvatar;
      userAvatarEl.src = src;
      userAvatarEl.alt = `${name}'s avatar`;
    }
    userNameEl.textContent = name;
    const firstName = (name || 'Athlete').split(' ')[0];
    greetingName && (greetingName.textContent = firstName);
    if (profile.goal) {
      userGoalEl.textContent = `Goal: ${profile.goal}`;
    }
    profileContext = { ...profile };
    updateTargets(profileContext);
    await loadWorkoutActivitySummary();
    updateDatePickerBounds();
    setSelectedDate(new Date());
    if (window.FFStreak) {
      renderStreakSummary(window.FFStreak.getSummary());
    }
    
    // Check and show water intake popup if needed
    checkWaterIntakePopup();
  } catch (err) {
    console.error(err);
    window.location.href = 'login.html';
  }
}

async function checkWaterIntakePopup() {
  try {
    // Check if user has already logged water today
    const today = new Date().toISOString().split('T')[0];
    const lastLogged = localStorage.getItem('water-logged-today');
    
    // Only show popup if not logged today and not already shown
    if (lastLogged !== today) {
      const res = await fetch(`/api/water-intake?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.hasLoggedToday) {
          // Show popup after a short delay
          setTimeout(() => {
            showWaterIntakePopup();
          }, 1500);
        }
      }
    }
  } catch (err) {
    console.warn('Failed to check water intake status', err);
  }
}

function showWaterIntakePopup() {
  // Create popup if it doesn't exist
  let popup = document.getElementById('waterPopupOverlay');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'waterPopupOverlay';
    popup.className = 'water-popup-overlay';
    popup.innerHTML = `
      <div class="water-popup">
        <button class="water-popup-close" id="waterPopupClose">&times;</button>
        <h2>Track Your Water Intake</h2>
        <p>How much water have you drunk today?</p>
        <div class="water-input-group">
          <input type="number" id="waterInput" min="0" step="50" placeholder="Enter amount in ml" />
          <span class="water-unit-label">ml</span>
        </div>
        <div class="water-quick-buttons">
          <button class="water-quick-btn" data-amount="250">250ml</button>
          <button class="water-quick-btn" data-amount="500">500ml</button>
          <button class="water-quick-btn" data-amount="750">750ml</button>
          <button class="water-quick-btn" data-amount="1000">1000ml</button>
        </div>
        <button class="water-submit-btn" id="waterSubmitBtn">Save</button>
      </div>
    `;
    document.body.appendChild(popup);
    
    // Add styles if not already present
    if (!document.getElementById('waterPopupStyles')) {
      const style = document.createElement('style');
      style.id = 'waterPopupStyles';
      style.textContent = `
        .water-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(4px);
        }
        .water-popup-overlay.show {
          display: flex;
        }
        .water-popup {
          background: linear-gradient(180deg, #1d2736, #151c27);
          border-radius: 20px;
          padding: 32px;
          max-width: 400px;
          width: 90%;
          border: 1px solid rgba(255, 255, 255, 0.06);
          position: relative;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .water-popup-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          color: #9aa7c2;
          font-size: 28px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .water-popup-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f3f3f3;
        }
        .water-popup h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #f3f3f3;
        }
        .water-popup p {
          font-size: 14px;
          color: #9aa7c2;
          margin: 0 0 24px 0;
        }
        .water-input-group {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }
        #waterInput {
          flex: 1;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          color: #f3f3f3;
          font-size: 16px;
          transition: all 0.2s ease;
        }
        #waterInput:focus {
          outline: none;
          border-color: #4cd964;
          background: rgba(255, 255, 255, 0.08);
        }
        .water-unit-label {
          font-size: 14px;
          color: #9aa7c2;
        }
        .water-quick-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }
        .water-quick-btn {
          padding: 12px;
          background: rgba(76, 217, 100, 0.1);
          border: 1px solid rgba(76, 217, 100, 0.3);
          border-radius: 10px;
          color: #4cd964;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .water-quick-btn:hover {
          background: rgba(76, 217, 100, 0.2);
          transform: translateY(-2px);
        }
        .water-submit-btn {
          width: 100%;
          padding: 14px;
          background: #4cd964;
          border: none;
          border-radius: 12px;
          color: #0f0f0f;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .water-submit-btn:hover {
          background: #3dc954;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 217, 100, 0.4);
        }
      `;
      document.head.appendChild(style);
    }
    
    // Setup event listeners
    const closeBtn = popup.querySelector('#waterPopupClose');
    const submitBtn = popup.querySelector('#waterSubmitBtn');
    const input = popup.querySelector('#waterInput');
    const quickBtns = popup.querySelectorAll('.water-quick-btn');
    const today = new Date().toISOString().split('T')[0];
    
    closeBtn.addEventListener('click', () => {
      popup.classList.remove('show');
      localStorage.setItem('water-popup-dismissed', today);
    });
    
    submitBtn.addEventListener('click', async () => {
      const amount = parseInt(input.value) || 0;
      if (amount > 0) {
        try {
          const res = await fetch('/api/water-intake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: today, amount })
          });
          
          if (res.ok) {
            localStorage.setItem('water-logged-today', today);
            popup.classList.remove('show');
            // Refresh water display if on goals page
            if (window.location.pathname.includes('goals.html')) {
              window.location.reload();
            }
          }
        } catch (err) {
          console.error('Failed to save water intake', err);
          showPromptAlert('Failed to save water intake. Please try again.');
        }
      }
    });
    
    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.dataset.amount;
      });
    });
    
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        popup.classList.remove('show');
        localStorage.setItem('water-popup-dismissed', today);
      }
    });
  }
  
  popup.classList.add('show');
  const input = popup.querySelector('#waterInput');
  if (input) input.focus();
}

function setupDayPicker() {
  if (!dayButtons.length) return () => {};
  const buttons = Array.from(dayButtons);

  const setActiveByIso = (iso) => {
    buttons.forEach((btn) => {
      const isActive = btn.dataset.date === iso;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };

  buttons.forEach((btn) => {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const iso = btn.dataset.date;
      if (!iso) return;
      const nextDate = parseISODate(iso);
      if (nextDate) {
        setSelectedDate(nextDate);
      }
    });
  });

  return setActiveByIso;
}

function renderDayPicker() {
  if (!dayButtons.length) return null;
  const buttons = Array.from(dayButtons);
  const weekDates = getWeekDates(selectedDate);
  const todayIso = toISODate(new Date());
  const minDate = getMinimumSelectableDate();
  const minIso = minDate ? toISODate(minDate) : null;

  buttons.forEach((btn, index) => {
    const date = weekDates[index] || null;
    if (!date) return;
    const iso = toISODate(date);
    btn.dataset.date = iso || '';
    const label = SHORT_LABEL_FORMATTER.format(date);
    btn.textContent = label;

    const isFuture = iso > todayIso;
    const isBeforeMin = minIso && iso < minIso;
    const disabled = Boolean(isFuture || isBeforeMin);
    btn.disabled = disabled;
    btn.classList.toggle('is-disabled', disabled);
    btn.setAttribute('aria-disabled', disabled ? 'true' : 'false');
    if (!disabled) {
      btn.title = FULL_DATE_FORMATTER.format(date);
    } else if (isBeforeMin) {
      btn.title = 'No data available for this date';
    } else {
      btn.title = 'Future date not available';
    }
  });

  return weekDates;
}

function updateDatePickerBounds() {
  if (!datePickerInput) return;
  const todayIso = toISODate(new Date());
  const minDate = getMinimumSelectableDate();
  const minIso = minDate ? toISODate(minDate) : todayIso;
  datePickerInput.min = minIso || '';
  datePickerInput.max = todayIso || '';
  datePickerInput.disabled = !(minIso && todayIso);
}

function setSelectedDate(nextDate) {
  const today = new Date();
  const minDate = getMinimumSelectableDate() || today;
  let normalized = parseISODate(nextDate) || today;
  if (normalized > today) normalized = today;
  if (normalized < minDate) normalized = new Date(minDate.getTime());
  const newIso = toISODate(normalized);
  const currentIso = toISODate(selectedDate);
  if (newIso === currentIso) {
    renderDayPicker();
    if (setDayActiveFn) setDayActiveFn(newIso);
    applyDateContext(setDayActiveFn, normalized);
    renderActivitySummaryForSelectedDate();
    return;
  }

  selectedDate = normalized;
  renderDayPicker();
  if (setDayActiveFn) setDayActiveFn(newIso);
  applyDateContext(setDayActiveFn, normalized);
  renderActivitySummaryForSelectedDate();
  updateWeeklyGoalsForSelectedDate();
  updateMealSummaryForSelectedDate();
}

function applyDateContext(setDayActive, referenceDate = selectedDate) {
  const safeDate = referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime()) ? referenceDate : new Date();
  const iso = toISODate(safeDate);
  if (typeof setDayActive === 'function' && iso) {
    setDayActive(iso);
  }
  const dayName = DAY_NAME_FORMATTER.format(safeDate);
  if (greetingSub) {
    greetingSub.textContent = `It's ${dayName}. You're one step closer to your goal today!`;
  }
  if (greetingDate) {
    greetingDate.textContent = FULL_DATE_FORMATTER.format(safeDate);
  }
  if (datePickerInput) {
    datePickerInput.value = iso || '';
  }
}

function setupSidebarNav() {
  const navLinks = Array.from(document.querySelectorAll('.sidebar-nav a.property'));
  if (!navLinks.length) return;

  const setActiveLink = (targetLink) => {
    navLinks.forEach((link) => {
      const isActive = link === targetLink;
      const label = link.querySelector('.label');
      if (label) {
        label.classList.toggle('active', isActive);
      }

      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }

      const icon = link.querySelector('img');
      if (icon) {
        const defaultSrc = link.dataset.iconDefault || icon.dataset.defaultSrc || icon.getAttribute('src');
        if (!icon.dataset.defaultSrc) {
          icon.dataset.defaultSrc = defaultSrc;
        }
        const activeSrc = link.dataset.iconActive || icon.dataset.defaultSrc;
        icon.src = isActive ? activeSrc : icon.dataset.defaultSrc;
      }
    });
  };

  navLinks.forEach((link) => {
    const icon = link.querySelector('img');
    if (icon) {
      const defaultSrc = link.dataset.iconDefault || icon.dataset.defaultSrc || icon.getAttribute('src');
      icon.dataset.defaultSrc = defaultSrc;
      const isActive = link.getAttribute('aria-current') === 'page' || link.querySelector('.label')?.classList.contains('active');
      const activeSrc = link.dataset.iconActive || defaultSrc;
      icon.src = isActive ? activeSrc : defaultSrc;
    }

    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href') || '';
      const isHashLink = href.startsWith('#');
      if (isHashLink) {
        event.preventDefault();
        const targetSection = document.querySelector(href);
        targetSection?.scrollIntoView({ behavior: 'smooth' });
      }
      setActiveLink(link);
    });
  });
}

function updateMealTooltip(mealKey, color) {
  if (!mealTooltip || !mealDetails[mealKey]) return;
  const { title, summary, macros } = mealDetails[mealKey];
  mealTooltipTitle.textContent = title;
  mealTooltipSummary.textContent = summary;
  const list = mealTooltip.querySelector('ul');
  if (list) {
    list.innerHTML = macros
      .map((m) => `<li><span>${m.label}:</span><strong>${m.value}</strong></li>`)
      .join('');
  }
  mealTooltip.style.setProperty('--tooltip-accent', color);
  mealTooltip.classList.add('active');
  const hintDot = document.querySelector('.hint-dot');
  if (hintDot) {
    hintDot.style.background = color;
  }
}

function resetMealTooltip() {
  mealTooltip?.classList.remove('active');
  const hintDot = document.querySelector('.hint-dot');
  if (hintDot) {
    hintDot.style.background = '';
  }
}

function setupMealHover() {
  if (!mealSegments.length && !mealLegendItems.length) return;

  const handleEnter = (mealKey, color) => {
    updateMealTooltip(mealKey, color);
    mealSegments.forEach((seg) => {
      if (seg.dataset.meal === mealKey) {
        seg.style.filter = 'drop-shadow(0 12px 20px rgba(0,0,0,0.35))';
        seg.style.strokeWidth = '22';
      } else {
        seg.style.filter = 'brightness(0.85)';
      }
    });
    mealLegendItems.forEach((item) => {
      const dot = item.querySelector('.legend-dot');
      const label = item.querySelector('div div');
      const isActive = item.dataset.meal === mealKey;
      item.classList.toggle('is-active', isActive);
      if (dot) {
        dot.style.transform = isActive ? 'scale(1.15)' : '';
      }
      if (label) {
        label.style.color = isActive ? '#1b1b1b99' : '';
      }
    });
  };

  const handleLeave = () => {
    resetMealTooltip();
    mealSegments.forEach((seg) => {
      seg.style.filter = '';
      seg.style.strokeWidth = '';
    });
    mealLegendItems.forEach((item) => {
      const dot = item.querySelector('.legend-dot');
      const label = item.querySelector('div div');
      item.classList.remove('is-active');
      if (dot) dot.style.transform = '';
      if (label) label.style.color = '';
    });
  };

  mealSegments.forEach((segment) => {
    const mealKey = segment.dataset.meal;
    const color = segment.dataset.color;
    segment.addEventListener('mouseenter', () => handleEnter(mealKey, color));
    segment.addEventListener('mouseleave', handleLeave);
  });

  mealLegendItems.forEach((item) => {
    const mealKey = item.dataset.meal;
    const color = item.dataset.color;
    item.addEventListener('mouseenter', () => handleEnter(mealKey, color));
    item.addEventListener('mouseleave', handleLeave);
  });
}

function setupGoalBarHover() {
  if (!goalBars.length || !goalTooltip) return;

  const showTooltip = (barEl) => {
    goalBars.forEach((item) => item.classList.toggle('is-active', item === barEl));
    const day = barEl.dataset.day || 'Day';
    const minutes = barEl.dataset.minutes || '0';
    const status = barEl.dataset.status || '';
    goalTooltip.querySelector('.goal-tooltip-day').textContent = day;
    goalTooltip.querySelector('.goal-tooltip-minutes').textContent = `${minutes} minutes`;
    goalTooltip.querySelector('.goal-tooltip-status').textContent = status ? `(${status})` : '';

    const bar = barEl.querySelector('.bar');
    if (!bar) return;
    const barRect = bar.getBoundingClientRect();
    const chartRect = bar.closest('.goal-chart').getBoundingClientRect();
    const x = barRect.left + barRect.width / 2 - chartRect.left;
    const maxX = chartRect.width - 24;
    const minX = 24;
    const clampedX = Math.min(Math.max(x, minX), maxX);
    const y = barRect.top - chartRect.top;
    goalTooltip.style.left = `${clampedX}px`;
    goalTooltip.style.top = `${y}px`;
    goalTooltip.classList.add('active');
    goalTooltip.setAttribute('aria-hidden', 'false');
  };

  const hideTooltip = () => {
    goalTooltip.classList.remove('active');
    goalTooltip.setAttribute('aria-hidden', 'true');
    goalBars.forEach((item) => item.classList.remove('is-active'));
  };

  goalBars.forEach((item) => {
    item.addEventListener('mouseenter', () => showTooltip(item));
    item.addEventListener('mouseleave', hideTooltip);
    item.addEventListener('focus', () => showTooltip(item));
    item.addEventListener('blur', hideTooltip);
  });
}

const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

const persistSidebarState = () => {
  if (!sidebar) return;
  const collapsed = sidebar.classList.contains('collapsed');
  localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? 'collapsed' : 'expanded');
};

const syncBodySidebarState = () => {
  if (!sidebar) return;
  const collapsed = sidebar.classList.contains('collapsed');
  document.body.classList.toggle('sidebar-collapsed', collapsed);
};

const applySavedSidebarState = () => {
  if (!sidebar || !sections) return;
  const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
  if (isMobile()) {
    sidebar.classList.remove('collapsed');
    sections.classList.remove('collapsed');
    hamburgerMenu?.classList.remove('active');
    document.body.classList.remove('sidebar-collapsed');
    return;
  }
  if (saved === 'collapsed') {
    sidebar.classList.add('collapsed');
    sections.classList.add('collapsed');
    hamburgerMenu?.classList.add('active');
  } else {
    sidebar.classList.remove('collapsed');
    sections.classList.remove('collapsed');
    hamburgerMenu?.classList.remove('active');
  }
  syncBodySidebarState();
};

function handleHamburgerToggle() {
  if (!sidebar || !sections || !hamburgerMenu) return;

  const syncHamburgerState = () => {
    const expanded = isMobile()
      ? sidebar.classList.contains('is-open')
      : !sidebar.classList.contains('collapsed');
    hamburgerMenu.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  };

  const openForMobile = () => {
    sidebar.classList.toggle('is-open');
    sidebar.classList.remove('collapsed');
    sections.classList.remove('collapsed');
    document.body.classList.remove('sidebar-collapsed');
    syncHamburgerState();
  };

  const toggleCollapse = () => {
    sidebar.classList.toggle('collapsed');
    sections.classList.toggle('collapsed');
    sidebar.classList.remove('is-open');
    syncHamburgerState();
    syncBodySidebarState();
    persistSidebarState();
  };

  hamburgerMenu.addEventListener('click', () => {
    hamburgerMenu.classList.toggle('active');
    if (isMobile()) {
      openForMobile();
    } else {
      toggleCollapse();
    }
  });

  hamburgerMenu.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      hamburgerMenu.click();
    }
  });

  closeBtn?.addEventListener('click', () => {
    if (!isMobile()) return;
    sidebar.classList.remove('is-open');
    hamburgerMenu.classList.remove('active');
    syncHamburgerState();
  });

  window.addEventListener('resize', () => {
    if (isMobile()) {
      sidebar.classList.remove('collapsed');
      sections.classList.remove('collapsed');
      sidebar.classList.remove('is-open');
      document.body.classList.remove('sidebar-collapsed');
    } else {
      sidebar.classList.remove('is-open');
      persistSidebarState();
    }
    applySavedSidebarState();
    syncHamburgerState();
    syncBodySidebarState();
  });

  applySavedSidebarState();
  syncHamburgerState();
  syncBodySidebarState();
}

function setupThemeToggle() {
  if (!themeToggle) return;

  themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    applyTheme(nextTheme);
  });
  themeToggle.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const nextTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
      applyTheme(nextTheme);
    }
  });
}

function setupLogout() {
  logoutBtn?.addEventListener('click', async () => {
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
      window.location.href = 'login.html';
    }
  });
}

function setActivityProgress(percent = 0) {
  const safePercent = Math.max(0, Math.min(100, percent));
  const offset = DASH_TOTAL - (DASH_TOTAL * safePercent) / 100;
  if (progressCircle) {
    progressCircle.style.strokeDashoffset = offset.toString();
  }
  activityPercentEl.textContent = `${safePercent}%`;
}

function renderActivitySummaryForSelectedDate() {
  const iso = toISODate(selectedDate);
  const dayTotals = getWorkoutTotalsForDate(selectedDate);
  const calories = dayTotals.totalCalories;
  const planDetails = getDailyPlanForDate(selectedDate);
  const plannedBurn = Number(planDetails?.workout?.burn || 0);
  const target = plannedBurn > 0 ? plannedBurn : dailyCalorieTarget > 0 ? dailyCalorieTarget : 0;
  const percent = target > 0 ? Math.min(100, Math.round((calories / target) * 100)) : 0;
  setActivityProgress(percent);
  if (activitySummaryEl) {
    const dateLabel = FULL_DATE_FORMATTER.format(selectedDate);
    const totalText = `${formatCalories(latestActivityTotals.totalCalories)} total`;
    activitySummaryEl.textContent = dayTotals.entries.length
      ? `${formatCalories(calories)} on ${dateLabel} • ${totalText}`
      : `No activities logged on ${dateLabel} • ${totalText}`;
  }
  updateDailyTargetsForSelectedDate(selectedDate);
}

function updateWeeklyGoalsForSelectedDate() {
  if (!goalBars.length) return;
  const weekDates = getWeekDates(selectedDate);
  const targetMinutes = Number.isFinite(Number(targetWorkoutMinutes)) ? Number(targetWorkoutMinutes) : 45;
  const todayIso = toISODate(new Date());

  if (goalWeekRangeEl && weekDates.length) {
    const start = weekDates[0];
    const end = weekDates[weekDates.length - 1];
    const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
    goalWeekRangeEl.textContent = `${formatter.format(start)} – ${formatter.format(end)}`;
  }

  goalBars.forEach((barEl, index) => {
    const date = weekDates[index];
    if (!date) return;
    const iso = toISODate(date);
    const dayTotals = getWorkoutTotalsForDate(date);
    const minutesEarned = dayTotals.totalCalories > 0 ? targetMinutes : 0;
    const ratio = targetMinutes > 0 ? Math.min(minutesEarned / targetMinutes, 1) : 0;

    barEl.dataset.day = FULL_DATE_FORMATTER.format(date);
    barEl.dataset.minutes = minutesEarned.toString();
    let status = '';
    if (iso > todayIso) {
      status = 'Upcoming';
    } else if (minutesEarned >= targetMinutes) {
      status = 'Goal met';
    } else if (dayTotals.totalCalories > 0) {
      status = 'Partial effort';
    } else {
      status = 'No workout logged';
    }
    barEl.dataset.status = status;
    barEl.style.setProperty('--bar-height', ratio.toFixed(2));

    const label = barEl.querySelector('.goal-day');
    if (label) {
      label.textContent = date.toLocaleDateString(undefined, { weekday: 'short' });
    }
  });

  goalTooltip?.classList.remove('active');
  goalTooltip?.setAttribute('aria-hidden', 'true');
  goalBars.forEach((item) => item.classList.remove('is-active'));
}

function updateMealSummaryForSelectedDate() {
  if (!mealSegments.length && !mealLegendItems.length) return;
  const planDetails = getDailyPlanForDate(selectedDate);
  const mealPlan = planDetails?.meals?.meals;
  const order = ['breakfast', 'lunch', 'snacks', 'dinner'];
  const summary = {};
  order.forEach((key) => {
    summary[key] = {
      title: key.charAt(0).toUpperCase() + key.slice(1),
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };
  });

  const circumference = 2 * Math.PI * 45;

  if (!Array.isArray(mealPlan) || !mealPlan.length) {
    let cumulative = 0;
    order.forEach((key) => {
      const segment = Array.from(mealSegments).find((seg) => seg.dataset.meal === key);
      if (segment) {
        segment.setAttribute('stroke-dasharray', `0 ${circumference.toFixed(1)}`);
        segment.setAttribute('stroke-dashoffset', `-${cumulative.toFixed(1)}`);
      }
      const legendItem = Array.from(mealLegendItems).find((item) => item.dataset.meal === key);
      if (legendItem) {
        const detailLine = legendItem.querySelector('div div:last-child');
        if (detailLine) {
          detailLine.textContent = 'No data';
        }
      }
      mealDetails[key] = {
        title: summary[key].title,
        summary: 'No data',
        macros: [
          { label: 'Protein', value: '0g' },
          { label: 'Carbs', value: '0g' },
          { label: 'Fat', value: '0g' }
        ]
      };
    });
    resetMealTooltip();
    return;
  }

  if (Array.isArray(mealPlan)) {
    mealPlan.forEach((meal) => {
      const key = String(meal.type || meal.label || '').toLowerCase();
      if (!summary[key]) return;
      summary[key].calories += Number(meal.calories || 0);
      summary[key].protein += Number(meal.protein || 0);
      summary[key].carbs += Number(meal.carbs || 0);
      summary[key].fat += Number(meal.fat || 0);
    });
  }

  const totalCalories = order.reduce((sum, key) => sum + summary[key].calories, 0);
  let cumulative = 0;

  order.forEach((key) => {
    const share = totalCalories > 0 ? summary[key].calories / totalCalories : 0;
    const segmentLength = share * circumference;

    const segment = Array.from(mealSegments).find((seg) => seg.dataset.meal === key);
    if (segment) {
      segment.setAttribute(
        'stroke-dasharray',
        `${segmentLength.toFixed(1)} ${(circumference - segmentLength).toFixed(1)}`
      );
      segment.setAttribute('stroke-dashoffset', `-${cumulative.toFixed(1)}`);
    }
    cumulative += segmentLength;

    const legendItem = Array.from(mealLegendItems).find((item) => item.dataset.meal === key);
    const percent = Math.round(share * 100);
    if (legendItem) {
      const detailLine = legendItem.querySelector('div div:last-child');
      if (detailLine) {
        detailLine.textContent = `${summary[key].calories ? summary[key].calories : 0} kcal (${percent}%)`;
      }
    }

    mealDetails[key] = {
      title: summary[key].title,
      summary: `${summary[key].calories} kcal (${percent}%)`,
      macros: [
        { label: 'Protein', value: `${Math.round(summary[key].protein)}g` },
        { label: 'Carbs', value: `${Math.round(summary[key].carbs)}g` },
        { label: 'Fat', value: `${Math.round(summary[key].fat)}g` }
      ]
    };
  });

  resetMealTooltip();
}

function applyActivitySummary({ totalCalories = 0, todayCalories = 0 } = {}) {
  latestActivityTotals = {
    totalCalories: Number(totalCalories) || 0,
    todayCalories: Number(todayCalories) || 0
  };
  renderActivitySummaryForSelectedDate();
}

async function loadWorkoutActivitySummary() {
  try {
    const res = await fetch('/api/workouts/activity');
    if (!res.ok) {
      throw new Error(`Failed to load workout activity (${res.status})`);
    }
    const payload = await res.json();
    workoutEntries = Array.isArray(payload.entries) ? payload.entries : [];
    const totals = {
      totalCalories: Number(payload.totalCalories || 0),
      todayCalories: Number(payload.todayCalories || 0)
    };
    const sorted = [...workoutEntries].sort((a, b) => (a.activity_date || '').localeCompare(b.activity_date || ''));
    earliestAvailableDate = sorted.length ? parseISODate(sorted[0].activity_date) : null;
    planCache.clear();
    applyActivitySummary(totals);
    try {
      window.localStorage?.setItem('ff-workout-activity-totals', JSON.stringify(totals));
    } catch (storageErr) {
      console.warn('Unable to persist workout totals', storageErr);
    }
  } catch (err) {
    console.warn('Failed to load workout activity summary', err);
  }
  updateDatePickerBounds();
  renderDayPicker();
  renderActivitySummaryForSelectedDate();
}

function setupWorkoutActivitySync() {
  try {
    const cached = window.localStorage?.getItem('ff-workout-activity-totals');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        applyActivitySummary({
          totalCalories: Number(parsed.totalCalories || 0),
          todayCalories: Number(parsed.todayCalories || 0)
        });
      }
    }
  } catch (err) {
    console.warn('Failed to restore cached workout totals', err);
  }

  window.addEventListener('flexfule:workout-logged', (event) => {
    const totals = event?.detail?.totals;
    if (!totals) return;
    const normalizedTotals = {
      totalCalories: Number(totals.totalCalories || 0),
      todayCalories: Number(totals.todayCalories || 0)
    };
    applyActivitySummary(normalizedTotals);
    try {
      window.localStorage?.setItem('ff-workout-activity-totals', JSON.stringify(normalizedTotals));
    } catch (storageErr) {
      console.warn('Unable to persist workout totals', storageErr);
    }
    const entryDetail = event?.detail?.entry;
    if (entryDetail) {
      const iso = entryDetail.activity_date;
      const existingIndex = workoutEntries.findIndex((item) => item.activity_date === iso);
      if (existingIndex >= 0) {
        workoutEntries[existingIndex] = entryDetail;
      } else {
        workoutEntries.push(entryDetail);
        workoutEntries.sort((a, b) => (a.activity_date || '').localeCompare(b.activity_date || ''));
      }
      earliestAvailableDate = workoutEntries.length ? parseISODate(workoutEntries[0].activity_date) : null;
      updateDatePickerBounds();
      planCache.clear();
    }
    renderDayPicker();
    renderActivitySummaryForSelectedDate();
    updateWeeklyGoalsForSelectedDate();
    updateMealSummaryForSelectedDate();
  });
}

function updateTargets(profile) {
  if (!profile) return;
  const weight = Number(profile.weight_kg) || 0;
  const target = Number(profile.target_weight) || weight;
  const hydrationTarget = weight ? Math.round(weight * 35) : 600; // ml heuristic
  const calorieTarget = weight ? Math.round(weight * 7) : 400;
  const workoutMinutes = profile.goal && /muscle/i.test(profile.goal) ? 60 : 45;

  targetWorkoutMinutes = workoutMinutes;
  hydrationTargetBaseMl = hydrationTarget;

  dailyCalorieTarget = calorieTarget;
  planCache.clear();
  applyActivitySummary(latestActivityTotals);
  updateWeeklyGoalsForSelectedDate();
  updateMealSummaryForSelectedDate();
  updateDailyTargetsForSelectedDate();
}

function init() {
  document.body.classList.add('sidebar-init');
  progressCircle?.setAttribute('stroke-dasharray', DASH_TOTAL);
  setDayActiveFn = setupDayPicker();
  renderDayPicker();
  applyDateContext(setDayActiveFn);
  updateDailyTargetsForSelectedDate(selectedDate);
  datePickerInput?.addEventListener('change', (event) => {
    if (event.target.value) {
      setSelectedDate(event.target.value);
    }
  });
  setupSidebarNav();
  handleHamburgerToggle();
  requestAnimationFrame(() => document.body.classList.remove('sidebar-init'));
  setupThemeToggle();
  setupLogout();
  setupMealHover();
  setupGoalBarHover();
  setupWorkoutActivitySync();
  applyActivitySummary(latestActivityTotals);
  fetchCurrentUser();
}

document.addEventListener('DOMContentLoaded', init);
const toISODate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseISODate = (value) => {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    const y = Number(year);
    const m = Number(month) - 1;
    const d = Number(day);
    if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
    return new Date(y, m, d);
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

function getMinimumSelectableDate() {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const fallback = new Date(todayStart);
  const lookback = Math.max(0, HISTORY_LOOKBACK_DAYS - 1);
  fallback.setDate(fallback.getDate() - lookback);
  if (earliestAvailableDate instanceof Date && !Number.isNaN(earliestAvailableDate.getTime())) {
    const normalized = new Date(
      earliestAvailableDate.getFullYear(),
      earliestAvailableDate.getMonth(),
      earliestAvailableDate.getDate()
    );
    return normalized < fallback ? normalized : fallback;
  }
  return fallback;
}

const startOfWeek = (date) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = base.getDay(); // 0 sunday
  base.setDate(base.getDate() - day);
  return base;
};

const getWeekDates = (date) => {
  const start = startOfWeek(date);
  const week = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    week.push(d);
  }
  return week;
};

const differenceInDays = (a, b) => {
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const diffMs = end - start;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

function getWorkoutEntriesForDate(date) {
  const iso = toISODate(date);
  if (!iso) return [];
  return workoutEntries.filter((item) => item.activity_date === iso);
}

function getWorkoutTotalsForDate(date) {
  const entries = getWorkoutEntriesForDate(date);
  const totalCalories = entries.reduce((sum, item) => sum + Number(item.calories || 0), 0);
  return {
    entries,
    totalCalories: Math.max(0, Math.round(totalCalories)),
    primaryEntry: entries.length ? entries[0] : null
  };
}

function estimateExerciseMinutes(exercise) {
  if (!exercise || typeof exercise.prescription !== 'string') return 0;
  const text = exercise.prescription.toLowerCase();
  if (!text.trim()) return 0;

  const minutePattern = /(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\b/;
  const minuteMatch = text.match(minutePattern);
  if (minuteMatch) {
    return Number(minuteMatch[1]);
  }

  const secSetPattern = /(\d+)\s*x\s*(\d+)\s*(?:seconds?|secs?|s)\b/;
  const secCompactPattern = /(\d+)x(\d+)\s*(?:seconds?|secs?|s)\b/;
  let seconds = 0;
  const secSetMatch = text.match(secSetPattern);
  const secCompactMatch = text.match(secCompactPattern);
  if (secSetMatch) {
    seconds = Number(secSetMatch[1]) * Number(secSetMatch[2]);
  } else if (secCompactMatch) {
    seconds = Number(secCompactMatch[1]) * Number(secCompactMatch[2]);
  } else {
    const plainSecondsPattern = /(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/;
    const plain = text.match(plainSecondsPattern);
    if (plain) {
      seconds = Number(plain[1]);
    }
  }
  if (seconds > 0) {
    if (/(?:each|per)\s+side|\/side/.test(text)) {
      seconds *= 2;
    }
    return seconds / 60;
  }

  const repsPattern = /(\d+)\s*x\s*(\d+)\b/;
  const repsCompactPattern = /(\d+)x(\d+)\b/;
  let sets = 0;
  let reps = 0;
  const repsMatch = text.match(repsPattern) || text.match(repsCompactPattern);
  if (repsMatch) {
    sets = Number(repsMatch[1]);
    reps = Number(repsMatch[2]);
  }
  if (sets > 0 && reps > 0) {
    const SECONDS_PER_REP = 4;
    const SECONDS_PER_SET_BUFFER = 20;
    let estimatedSeconds = sets * reps * SECONDS_PER_REP;
    if (/(?:each|per)\s+side|\/side/.test(text)) {
      estimatedSeconds *= 2;
    }
    estimatedSeconds += Math.max(0, sets - 1) * SECONDS_PER_SET_BUFFER;
    return estimatedSeconds / 60;
  }

  const roundsPattern = /(\d+)\s*(?:rounds?|circuits?)/;
  const roundsMatch = text.match(roundsPattern);
  if (roundsMatch) {
    const rounds = Number(roundsMatch[1]);
    if (rounds > 0) {
      const DEFAULT_SECONDS_PER_ROUND = 180;
      return (rounds * DEFAULT_SECONDS_PER_ROUND) / 60;
    }
  }

  return 0;
}

function estimateWorkoutMinutesFromWorkout(workout, entry) {
  if (workout && Number.isFinite(workout.estimatedMinutes)) {
    return Math.max(0, Math.round(workout.estimatedMinutes));
  }
  let estimated = 0;
  if (workout && Array.isArray(workout.exercises)) {
    estimated = workout.exercises.reduce((sum, exercise) => sum + estimateExerciseMinutes(exercise), 0);
  }
  if (estimated > 0) {
    return Math.max(1, Math.round(estimated));
  }
  const burnSource = Number(
    (entry && entry.calories) || (workout && workout.burn) || dailyCalorieTarget || 0
  );
  if (burnSource > 0 && CALORIES_PER_MINUTE_ESTIMATE > 0) {
    const derived = Math.round(burnSource / CALORIES_PER_MINUTE_ESTIMATE);
    if (derived > 0) {
      return derived;
    }
  }
  if (Number.isFinite(targetWorkoutMinutes) && targetWorkoutMinutes > 0) {
    return Math.round(targetWorkoutMinutes);
  }
  return 0;
}

function computeHydrationTargetMl(caloriesBurned = 0) {
  const base = Number.isFinite(hydrationTargetBaseMl) && hydrationTargetBaseMl > 0 ? hydrationTargetBaseMl : 2000;
  const activityBonus = caloriesBurned > 0 ? Math.round((caloriesBurned / 100) * 120) : 0;
  return Math.max(0, base + activityBonus);
}

function formatLiters(milliliters) {
  if (!Number.isFinite(milliliters) || milliliters <= 0) {
    return '0 L';
  }
  const liters = milliliters / 1000;
  const precision = liters >= 10 ? 0 : liters >= 1 ? 1 : 2;
  const formatted = liters.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
  return `${formatted} L`;
}

function updateDailyTargetsForSelectedDate(date = selectedDate) {
  if (!targetCaloriesEl || !targetWaterEl || !targetWorkoutEl) return;
  const safeDate =
    date instanceof Date && !Number.isNaN(date.getTime()) ? date : parseISODate(date) || selectedDate;
  if (!(safeDate instanceof Date) || Number.isNaN(safeDate.getTime())) return;

  const dayTotals = getWorkoutTotalsForDate(safeDate);
  const entry = dayTotals.primaryEntry || { calories: dayTotals.totalCalories };
  const planDetails = getDailyPlanForDate(safeDate);
  const workoutPlan = planDetails?.workout || null;
  const mealTarget = Number(planDetails?.meals?.targetCalories || 0);
  const nutritionTarget = goalNutritionTarget > 0 ? goalNutritionTarget : mealTarget;
  const caloriesBurned = dayTotals.totalCalories;
  const plannedBurn = Math.max(
    0,
    Math.round(
      Number(
        (workoutPlan && workoutPlan.burn) ||
          dailyCalorieTarget ||
          (targetWorkoutMinutes > 0 ? targetWorkoutMinutes * CALORIES_PER_MINUTE_ESTIMATE : 0)
      ) || 0
    )
  );
  const caloriesValue = nutritionTarget > 0 ? nutritionTarget : plannedBurn;
  targetCaloriesEl.textContent = formatCalories(caloriesValue);

  const minutes = estimateWorkoutMinutesFromWorkout(workoutPlan, entry);
  targetWorkoutEl.textContent = `${Math.max(0, Math.round(minutes))} mins`;

  const hydrationMl = computeHydrationTargetMl(caloriesBurned);
  targetWaterEl.textContent = formatLiters(hydrationMl);
}

const getDayNumberForDate = (date) => {
  const baseline =
    earliestAvailableDate instanceof Date && !Number.isNaN(earliestAvailableDate.getTime())
      ? earliestAvailableDate
      : getMinimumSelectableDate();
  const diff = differenceInDays(baseline, date);
  const dayIndex = diff + 1;
  return Math.max(1, Math.min(90, dayIndex));
};

const getDailyPlanForDate = (date) => {
  if (!window.FlexPlan) return null;
  const iso = toISODate(date);
  if (!iso) return null;
  if (planCache.has(iso)) {
    return planCache.get(iso);
  }
  const goalInput = profileContext?.goal || 'general fitness';
  const goalKey = window.FlexPlan.normalizeGoal
    ? window.FlexPlan.normalizeGoal(goalInput)
    : goalInput;
  const dayNumber = getDayNumberForDate(date);
  const plan = window.FlexPlan.buildDailyPlans(profileContext || {}, {
    startDate: date,
    startDay: dayNumber,
    days: 1,
    nutritionTarget: goalNutritionTarget
  });
  const details = {
    goalKey: plan.goalKey,
    goalLabel: plan.goalLabel,
    workout: plan.workoutsByDate?.[iso] || null,
    meals: plan.mealsByDate?.[iso] || null,
    dayNumber
  };
  planCache.set(iso, details);
  return details;
};
