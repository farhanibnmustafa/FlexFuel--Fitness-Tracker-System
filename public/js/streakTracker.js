(function () {
  const STORAGE_KEY = 'flexfuel.streaks.v1';
  const HISTORY_LENGTH = 7;

  const LEVELS = [
    { id: 'advanced', label: 'Advanced', min: 21, description: 'Elite consistency. Keep the fire burning!' },
    { id: 'intermediate', label: 'Intermediate', min: 7, description: 'Solid momentum. Stay the course!' },
    { id: 'beginner', label: 'Beginner', min: 1, description: 'Great start! Build the habit one day at a time.' },
    { id: 'new', label: 'Getting Started', min: 0, description: 'Log both your workout and meals to begin your streak.' }
  ];

  const toISODate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseISODate = (iso) => {
    if (typeof iso !== 'string') return null;
    const parts = iso.split('-').map(Number);
    if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) return null;
    return date;
  };

  const differenceInDays = (previous, next) => {
    if (!(previous instanceof Date) || !(next instanceof Date)) return Number.POSITIVE_INFINITY;
    const prev = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate());
    const nxt = new Date(next.getFullYear(), next.getMonth(), next.getDate());
    return Math.round((nxt.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
  };

  const normalizeUserKey = (userId) => {
    if (!userId) return 'anonymous';
    return `user:${userId}`;
  };

  const safeParse = (raw) => {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const loadState = () => {
    try {
      return safeParse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return {};
    }
  };

  const persistState = (state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to persist streak data', err);
    }
  };

  const ensureUserState = (state, userKey) => {
    if (!state[userKey] || typeof state[userKey] !== 'object') {
      state[userKey] = { days: {}, longest: 0, updatedAt: null };
    }
    if (!state[userKey].days || typeof state[userKey].days !== 'object') {
      state[userKey].days = {};
    }
    return state[userKey];
  };

  let currentUserKey = 'anonymous';
  let lastSummary = null;

  const determineLevel = (streak) => {
    const entry = LEVELS.find((level) => streak >= level.min) || LEVELS[LEVELS.length - 1];
    return entry;
  };

  const computeMetrics = (userState) => {
    const { days = {} } = userState || {};
    const completedDays = Object.entries(days)
      .filter(([, info]) => info && info.workout && info.meal)
      .map(([iso]) => iso)
      .sort();

    let longest = 0;
    let currentRun = 0;
    let lastDate = null;

    completedDays.forEach((iso) => {
      const date = parseISODate(iso);
      if (!date) return;
      if (lastDate && differenceInDays(lastDate, date) === 1) {
        currentRun += 1;
      } else {
        currentRun = 1;
      }
      longest = Math.max(longest, currentRun);
      lastDate = date;
    });

    const today = toISODate(new Date());
    let currentStreak = 0;
    if (today) {
      let pointer = parseISODate(today);
      while (pointer) {
        const iso = toISODate(pointer);
        const info = days[iso];
        if (info && info.workout && info.meal) {
          currentStreak += 1;
          pointer.setDate(pointer.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const totalDays = completedDays.length;
    const lastCompletedDate = completedDays.length ? completedDays[completedDays.length - 1] : null;
    return {
      currentStreak,
      longestStreak: Math.max(longest, userState.longest || 0),
      totalCompletedDays: totalDays,
      lastCompletedDate
    };
  };

  const buildHistory = (userState) => {
    const history = [];
    const { days = {} } = userState || {};
    const today = new Date();
    for (let offset = HISTORY_LENGTH - 1; offset >= 0; offset -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
      const iso = toISODate(date);
      const info = days[iso] || { workout: false, meal: false };
      history.push({
        iso,
        workout: Boolean(info.workout),
        meal: Boolean(info.meal),
        complete: Boolean(info.workout && info.meal)
      });
    }
    return history;
  };

  const calculateSummary = (userKey, { skipPersist = false } = {}) => {
    const state = loadState();
    const userState = ensureUserState(state, userKey);
    const metrics = computeMetrics(userState);
    userState.longest = Math.max(userState.longest || 0, metrics.longestStreak);
    userState.updatedAt = new Date().toISOString();
    if (!skipPersist) {
      persistState(state);
    }
    const level = determineLevel(metrics.currentStreak);
    const summary = {
      userKey,
      stats: metrics,
      level,
      history: buildHistory(userState),
      todayComplete: Boolean(
        userState.days[toISODate(new Date())]?.workout && userState.days[toISODate(new Date())]?.meal
      )
    };
    lastSummary = summary;
    window.dispatchEvent(new CustomEvent('flexfule:streak-updated', { detail: summary }));
    return summary;
  };

  const updateDay = (userKey, dateIso, updates = {}) => {
    if (typeof dateIso !== 'string' || !dateIso.trim()) return null;
    const normalizedIso = dateIso.trim();
    const state = loadState();
    const userState = ensureUserState(state, userKey);
    const day = userState.days[normalizedIso] || { workout: false, meal: false };
    if (updates.workout !== undefined) {
      day.workout = Boolean(updates.workout);
    }
    if (updates.meal !== undefined) {
      day.meal = Boolean(updates.meal);
    }
    if (!day.workout && !day.meal) {
      delete userState.days[normalizedIso];
    } else {
      userState.days[normalizedIso] = day;
    }
    persistState(state);
    return calculateSummary(userKey, { skipPersist: true });
  };

  const api = {
    init(userId) {
      const nextKey = normalizeUserKey(userId);
      const state = loadState();
      if (currentUserKey === 'anonymous' && nextKey !== 'anonymous' && state.anonymous) {
        const nextState = ensureUserState(state, nextKey);
        const anonymousState = ensureUserState(state, 'anonymous');
        nextState.days = { ...anonymousState.days, ...nextState.days };
        nextState.longest = Math.max(nextState.longest || 0, anonymousState.longest || 0);
        delete state.anonymous;
      }
      currentUserKey = nextKey;
      ensureUserState(state, currentUserKey);
      persistState(state);
      return calculateSummary(currentUserKey);
    },
    recordWorkout(dateIso, completed) {
      return updateDay(currentUserKey, dateIso, { workout: Boolean(completed) });
    },
    recordMeal(dateIso, completed) {
      return updateDay(currentUserKey, dateIso, { meal: Boolean(completed) });
    },
    recordCombined(dateIso, { workout, meal }) {
      const updates = {};
      if (workout !== undefined) updates.workout = workout;
      if (meal !== undefined) updates.meal = meal;
      return updateDay(currentUserKey, dateIso, updates);
    },
    getSummary() {
      if (lastSummary) return lastSummary;
      return calculateSummary(currentUserKey);
    },
    debugReset() {
      const state = loadState();
      delete state[currentUserKey];
      persistState(state);
      lastSummary = null;
      return calculateSummary(currentUserKey);
    }
  };

  window.FFStreak = api;
})();
