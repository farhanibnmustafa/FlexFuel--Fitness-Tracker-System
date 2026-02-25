document.addEventListener('DOMContentLoaded', async () => {
  document.body.classList.add('sidebar-init');
  const sidebar = document.querySelector('.sidebar');
  const sections = document.querySelector('.sections');
  const hamburgerMenu = document.querySelector('.hamburger-menu');
  const closeBtn = document.querySelector('.sidebar-close');
  const themeToggle = document.querySelector('.theme-toggle');

  const userNameEl = document.querySelector('[data-settings-name]');
  const userGoalEl = document.querySelector('[data-settings-goal]');
  const userAvatarEl = document.querySelector('[data-settings-avatar]');
  const userEmailEl = document.querySelector('[data-settings-email]');
  const emailEditBtn = document.querySelector('[data-settings-email-edit]');
  const passwordBtn = document.querySelector('[data-settings-password]');
  const passwordRow = passwordBtn?.closest('.settings-row') || null;
  const connectBtns = Array.from(document.querySelectorAll('[data-settings-connect]'));
  const deleteBtn = document.querySelector('[data-settings-delete]');
  const notificationPanel = document.querySelector('[data-settings-panel="notifications"]');
  const notificationToggles = Array.from(
    notificationPanel?.querySelectorAll('input[type="checkbox"][data-notify-key]') ?? []
  );
  const notificationBadge = document.querySelector('[data-settings-notification-badge]');
  const notificationTrigger = document.querySelector('[data-settings-notification-trigger]');
  const notificationPopover = document.querySelector('[data-settings-notifications]');
  const notificationList = document.querySelector('[data-settings-notification-list]');
  const notificationEmpty = document.querySelector('[data-settings-notification-empty]');
  const notificationCount = document.querySelector('[data-settings-notification-count]');
  const notificationClose = document.querySelector('[data-settings-notification-close]');
  let notificationUserKey = 'anonymous';

  const passwordModal = document.querySelector('[data-password-modal]');
  const passwordForm = document.querySelector('[data-password-form]');
  const passwordFeedback = document.querySelector('[data-password-feedback]');
  const passwordCloseButtons = Array.from(document.querySelectorAll('[data-password-close]'));

  const SIDEBAR_STATE_KEY = 'flexfule-sidebar-state';
  const THEME_KEY = 'flexfule-theme';
  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;

  const showPromptAlert = (message, options = {}) => {
    if (window.FFPrompt?.alert) {
      return window.FFPrompt.alert(message, options);
    }
    window.alert(message);
    return Promise.resolve();
  };

  const WORKOUT_REMINDER_MESSAGES = [
    'Time to work out 💪 Let’s get moving!',
    'Get up — your workout is waiting. Let’s build that discipline.',
    'Do it for the progress, not the mood. Workout time!'
  ];
  const WORKOUT_REMINDER_STORAGE_PREFIX = 'flexfule.notifications.workoutReminder';
  const NOTIFICATION_FEED_STORAGE_PREFIX = 'flexfule.notifications.feed';
  const MAX_NOTIFICATION_ITEMS = 25;
  const NOTIFICATION_ROUTE_MAP = {
    workout_reminder: 'workout.html',
    missed_workout: 'workout.html',
    meal_plan_reminder: 'meals.html',
    meal_plan_reminders: 'meals.html',
    missed_meal: 'meals.html',
    goal_milestones: 'goals.html',
    goal_achievements: 'goals.html'
  };
  const MEAL_PLAN_CACHE_KEY = 'flexfuel.meals.planCache';
  const MEAL_PLAN_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
  const MEAL_CUSTOM_PLAN_KEY = 'flexfuel.meals.customPlan';
  const MEAL_LAST_USER_KEY = 'flexfuel.meals.lastUserKey';
  const MEAL_COMPLETION_PREFIX = 'flexfuel.meals.completed';
  const MEAL_REMINDER_STORAGE_PREFIX = 'flexfule.notifications.missedMeals';
  const MEAL_REMINDER_TRIGGER_HOUR = 18;
  let missedMealTimerId = null;

  const getNotificationStorageKey = () => `flexfule.notifications.${notificationUserKey}`;
  const getWorkoutReminderStorageKey = () =>
    `${WORKOUT_REMINDER_STORAGE_PREFIX}.${notificationUserKey}`;
  const getNotificationFeedKey = () => `${NOTIFICATION_FEED_STORAGE_PREFIX}.${notificationUserKey}`;
  const getMissedMealStorageKey = () => `${MEAL_REMINDER_STORAGE_PREFIX}.${notificationUserKey}`;

  const toISODate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const readWorkoutReminderState = () => {
    try {
      const raw = localStorage.getItem(getWorkoutReminderStorageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (err) {
      console.warn('Failed to read workout reminder state', err);
      return null;
    }
  };

  const writeWorkoutReminderState = (state) => {
    try {
      localStorage.setItem(getWorkoutReminderStorageKey(), JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to save workout reminder state', err);
    }
  };

  const readMissedMealState = () => {
    try {
      const raw = localStorage.getItem(getMissedMealStorageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (err) {
      console.warn('Failed to read missed meal state', err);
      return null;
    }
  };

  const writeMissedMealState = (state) => {
    try {
      localStorage.setItem(getMissedMealStorageKey(), JSON.stringify(state));
    } catch (err) {
      console.warn('Failed to save missed meal state', err);
    }
  };

  const loadMealPlanCache = () => {
    try {
      const raw = window.localStorage?.getItem(MEAL_PLAN_CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== 'object') return null;
      if (!parsed.savedAt || !parsed.mealsByDate) return null;
      if (Date.now() - Number(parsed.savedAt) > MEAL_PLAN_CACHE_MAX_AGE_MS) return null;
      return parsed.mealsByDate;
    } catch (err) {
      console.warn('Failed to read meal plan cache', err);
      return null;
    }
  };

  const loadMealOverrides = () => {
    try {
      const raw = window.localStorage?.getItem(MEAL_CUSTOM_PLAN_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed;
    } catch (err) {
      console.warn('Failed to read meal overrides', err);
      return {};
    }
  };

  const getCachedMealPlanForDate = (dateIso) => {
    if (!dateIso) return null;
    const mealsByDate = loadMealPlanCache();
    if (!mealsByDate || !mealsByDate[dateIso]) return null;
    const basePlan = mealsByDate[dateIso];
    const overrides = loadMealOverrides()[dateIso];
    if (!overrides || !Object.keys(overrides).length) return basePlan;
    const mergedMeals = (basePlan.meals || []).map((meal) => {
      const override = overrides[meal.id];
      return override ? { ...meal, ...override } : meal;
    });
    return { ...basePlan, meals: mergedMeals };
  };

  const getMealCompletionSet = (dateIso) => {
    if (!dateIso) return new Set();
    const lastUserKey = window.localStorage?.getItem(MEAL_LAST_USER_KEY);
    const fallbackUserId = notificationUserKey.startsWith('user-')
      ? notificationUserKey.replace('user-', '')
      : '';
    const userKey = lastUserKey || (fallbackUserId ? `user:${fallbackUserId}` : 'anonymous');
    const completionKey = `${MEAL_COMPLETION_PREFIX}.${userKey || 'anonymous'}`;
    let completedIds = [];
    try {
      const raw = window.localStorage?.getItem(completionKey);
      const parsed = raw ? JSON.parse(raw) : null;
      completedIds = Array.isArray(parsed?.[dateIso]) ? parsed[dateIso] : [];
    } catch (err) {
      completedIds = [];
    }
    return new Set(completedIds);
  };

  const getMissingMealNamesForDate = (date) => {
    const iso = toISODate(date);
    if (!iso) return [];
    const plan = getCachedMealPlanForDate(iso);
    const meals = Array.isArray(plan?.meals) ? plan.meals.filter((meal) => meal && !meal.removed) : [];
    if (!meals.length) return [];
    const completedSet = getMealCompletionSet(iso);
    const missing = [];
    meals.forEach((meal) => {
      if (!completedSet.has(meal.id)) {
        const label = meal.type || meal.label || meal.name || 'Meal';
        missing.push(label);
      }
    });
    return Array.from(new Set(missing));
  };

  const scheduleMissingMealCheck = (now = new Date()) => {
    if (missedMealTimerId) return;
    const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), MEAL_REMINDER_TRIGGER_HOUR, 0, 0, 0);
    const delay = targetTime.getTime() - now.getTime();
    if (delay <= 0) {
      maybeCreateMissingMealReminder(true);
      return;
    }
    missedMealTimerId = window.setTimeout(() => {
      missedMealTimerId = null;
      maybeCreateMissingMealReminder(true);
    }, delay);
  };

  const readNotificationFeed = () => {
    try {
      const raw = localStorage.getItem(getNotificationFeedKey());
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Failed to read notification feed', err);
      return [];
    }
  };

  const writeNotificationFeed = (feed) => {
    try {
      localStorage.setItem(getNotificationFeedKey(), JSON.stringify(feed));
    } catch (err) {
      console.warn('Failed to save notification feed', err);
    }
  };

  const buildNotificationKey = (item) => {
    if (!item) return null;
    if (item.notification_key) return String(item.notification_key);
    if (item.id) return String(item.id);
    const created = item.createdAt || item.created_at || '';
    const title = item.title || '';
    return `${item.type || 'generic'}:${created}:${title}`.trim() || null;
  };

  const fetchNotificationsFromServer = async () => {
    try {
      const res = await fetch('/api/notifications?limit=25');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data?.notifications) ? data.notifications : [];
    } catch (err) {
      console.warn('Failed to load notifications from server', err);
      return [];
    }
  };

  const persistNotificationsToServer = async (items) => {
    if (!Array.isArray(items) || !items.length) return;
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: items })
      });
    } catch (err) {
      console.warn('Failed to persist notifications', err);
    }
  };

  const syncNotificationFeedFromServer = async () => {
    const localFeed = readNotificationFeed();
    const serverItems = await fetchNotificationsFromServer();
    const mergedByKey = new Map();

    localFeed.forEach((item) => {
      const key = buildNotificationKey(item);
      if (!key) return;
      mergedByKey.set(key, { ...item, id: item.id || key });
    });

    serverItems.forEach((item) => {
      const key = buildNotificationKey(item);
      if (!key) return;
      const existing = mergedByKey.get(key);
      const read = Boolean(item.read_at) || existing?.read;
      const createdAt = item.created_at || existing?.createdAt || existing?.created_at || new Date().toISOString();
      mergedByKey.set(key, {
        id: existing?.id || key,
        title: item.title || existing?.title || 'Notification',
        message: item.message || existing?.message || '',
        type: item.type || existing?.type || 'generic',
        read,
        createdAt
      });
    });

    const mergedFeed = Array.from(mergedByKey.values()).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    writeNotificationFeed(mergedFeed);
    updateNotificationUI();

    const missingForServer = mergedFeed.map((item) => ({
      id: buildNotificationKey(item),
      title: item.title,
      message: item.message,
      type: item.type,
      createdAt: item.createdAt,
      read: item.read
    }));
    await persistNotificationsToServer(missingForServer);
  };

  const addNotificationToFeed = (item) => {
    if (!item) return;
    const feed = readNotificationFeed();
    if (item.id && feed.some((entry) => entry && entry.id === item.id)) return;
    const normalized = { read: false, ...item };
    const nextFeed = [normalized, ...feed].slice(0, MAX_NOTIFICATION_ITEMS);
    writeNotificationFeed(nextFeed);
    updateNotificationUI();
  };

  const normalizeNotificationFeed = (feed) =>
    feed.map((item, index) => ({
      id: item?.id ?? null,
      sourceIndex: index,
      read: Boolean(item?.read),
      title: item?.title || 'Notification',
      message: item?.message || 'Notification update.',
      type: item?.type || 'generic',
      createdAt: item?.createdAt || null
    }));

  const getNotificationRoute = (type) => {
    if (!type) return null;
    return NOTIFICATION_ROUTE_MAP[type] || null;
  };

  const pickNextWorkoutReminderMessage = (state) => {
    const lastIndex = Number(state?.lastIndex);
    const nextIndex = Number.isFinite(lastIndex)
      ? (lastIndex + 1) % WORKOUT_REMINDER_MESSAGES.length
      : 0;
    return {
      index: nextIndex,
      message: WORKOUT_REMINDER_MESSAGES[nextIndex] || WORKOUT_REMINDER_MESSAGES[0]
    };
  };

  const maybeCreateWorkoutReminder = (force = false) => {
    const prefs = collectNotificationPrefs();
    if (!prefs.workout_reminders) return;
    const todayIso = new Date().toISOString().slice(0, 10);
    const state = readWorkoutReminderState();
    if (!force && state?.lastShown === todayIso) return;
    const next = pickNextWorkoutReminderMessage(state);
    addNotificationToFeed({
      id: `workout-reminder-${todayIso}-${next.index}`,
      type: 'workout_reminder',
      title: 'Workout Reminder',
      message: next.message,
      createdAt: new Date().toISOString()
    });
    writeWorkoutReminderState({ lastShown: todayIso, lastIndex: next.index });
  };

  const maybeCreateMissingMealReminder = (force = false) => {
    const prefs = collectNotificationPrefs();
    if (!prefs.meal_plan_reminders) return;
    const now = new Date();
    const todayIso = toISODate(now);
    if (!todayIso) return;
    const state = readMissedMealState();
    if (state?.lastShown === todayIso) return;
    if (!force && now.getHours() < MEAL_REMINDER_TRIGGER_HOUR) {
      scheduleMissingMealCheck(now);
      return;
    }
    const missingMeals = getMissingMealNamesForDate(now);
    if (!missingMeals.length) {
      writeMissedMealState({ lastChecked: todayIso, lastShown: state?.lastShown || null });
      return;
    }
    addNotificationToFeed({
      id: `missed-meal-${todayIso}`,
      type: 'missed_meal',
      title: 'Meal Plan Reminder',
      message: `Missing meals: ${missingMeals.join(', ')}.`,
      createdAt: new Date().toISOString()
    });
    writeMissedMealState({ lastChecked: todayIso, lastShown: todayIso });
  };

  const readNotificationPrefs = () => {
    try {
      const raw = localStorage.getItem(getNotificationStorageKey());
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (err) {
      console.warn('Failed to read notification settings', err);
      return null;
    }
  };

  const writeNotificationPrefs = (prefs) => {
    try {
      localStorage.setItem(getNotificationStorageKey(), JSON.stringify(prefs));
    } catch (err) {
      console.warn('Failed to save notification settings', err);
    }
  };

  const DEFAULT_NOTIFICATION_PREFS = {
    workout_reminders: true,
    goal_milestones: true,
    missed_workouts: true,
    meal_plan_reminders: true,
    weekly_progress_summary: true,
    goal_achievements: true,
    account_security_alerts: true
  };

  const fetchNotificationPrefsFromServer = async () => {
    try {
      const res = await fetch('/api/notification-preferences');
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.preferences || typeof data.preferences !== 'object') return null;
      return data.preferences;
    } catch (err) {
      console.warn('Failed to load notification preferences', err);
      return null;
    }
  };

  const saveNotificationPrefsToServer = async (prefs) => {
    try {
      await fetch('/api/notification-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs })
      });
    } catch (err) {
      console.warn('Failed to save notification preferences', err);
    }
  };

  const prefsEqual = (a, b) => {
    if (!a || !b) return false;
    return Object.keys(DEFAULT_NOTIFICATION_PREFS).every((key) => Boolean(a[key]) === Boolean(b[key]));
  };

  const syncNotificationPrefsFromServer = async () => {
    const localPrefs = readNotificationPrefs();
    const serverPrefs = await fetchNotificationPrefsFromServer();
    let merged = { ...DEFAULT_NOTIFICATION_PREFS, ...(localPrefs || {}), ...(serverPrefs || {}) };

    const serverIsDefault = serverPrefs && prefsEqual(serverPrefs, DEFAULT_NOTIFICATION_PREFS);
    if (localPrefs && serverIsDefault && !prefsEqual(localPrefs, serverPrefs)) {
      merged = { ...DEFAULT_NOTIFICATION_PREFS, ...localPrefs };
      await saveNotificationPrefsToServer({
        ...merged,
        account_alerts_enabled: Boolean(merged.account_security_alerts)
      });
    } else if (serverPrefs) {
      merged = {
        ...DEFAULT_NOTIFICATION_PREFS,
        ...(serverPrefs || {}),
        account_security_alerts: Boolean(serverPrefs.account_alerts_enabled ?? merged.account_security_alerts)
      };
    }

    if (typeof merged.account_alerts_enabled === 'boolean') {
      merged.account_security_alerts = merged.account_alerts_enabled;
      delete merged.account_alerts_enabled;
    }

    writeNotificationPrefs(merged);
    applyNotificationPrefs(merged);
    updateNotificationUI();
  };

  const collectNotificationPrefs = () =>
    notificationToggles.reduce((acc, toggle) => {
      const key = toggle.dataset.notifyKey;
      if (!key) return acc;
      acc[key] = Boolean(toggle.checked);
      return acc;
    }, {});

  const applyNotificationPrefs = (prefs) => {
    if (!prefs) return;
    notificationToggles.forEach((toggle) => {
      const key = toggle.dataset.notifyKey;
      if (!key) return;
      if (Object.prototype.hasOwnProperty.call(prefs, key)) {
        toggle.checked = Boolean(prefs[key]);
      }
    });
  };

  const getNotificationItems = () =>
    normalizeNotificationFeed(readNotificationFeed())
      .filter((item) => item && (item.title || item.message))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const markNotificationRead = ({ id, index }) => {
    const feed = readNotificationFeed();
    let updated = false;
    let updatedItem = null;
    if (id) {
      feed.forEach((entry) => {
        if (entry?.id === id && !entry.read) {
          entry.read = true;
          updated = true;
          updatedItem = entry;
        }
      });
    } else if (typeof index === 'number' && feed[index] && !feed[index].read) {
      feed[index].read = true;
      updated = true;
      updatedItem = feed[index];
    }
    if (updated) {
      writeNotificationFeed(feed);
      updateNotificationUI();
      if (updatedItem) {
        persistNotificationsToServer([
          {
            id: updatedItem.id,
            title: updatedItem.title,
            message: updatedItem.message,
            type: updatedItem.type,
            createdAt: updatedItem.createdAt,
            read: true
          }
        ]);
      }
    }
  };

  const renderNotificationList = (items) => {
    if (!notificationList) return;
    notificationList.innerHTML = '';
    items.forEach((item) => {
      const entry = document.createElement('div');
      entry.className = 'settings-notification-item';
      const route = getNotificationRoute(item.type);
      if (item.read) {
        entry.classList.add('is-read');
      }
      if (route) {
        entry.dataset.notificationRoute = route;
        entry.setAttribute('role', 'button');
        entry.tabIndex = 0;
      }
      if (item.id) {
        entry.dataset.notificationId = item.id;
      }
      entry.dataset.notificationIndex = String(item.sourceIndex);

      const icon = document.createElement('div');
      icon.className = 'settings-notification-icon';
      icon.textContent = item.title.charAt(0).toUpperCase();

      const copy = document.createElement('div');
      copy.className = 'settings-notification-copy';

      const titleEl = document.createElement('strong');
      titleEl.textContent = item.title;
      const messageEl = document.createElement('span');
      messageEl.textContent = item.message;

      copy.appendChild(titleEl);
      copy.appendChild(messageEl);
      entry.appendChild(icon);
      entry.appendChild(copy);
      notificationList.appendChild(entry);
    });
  };

  const updateNotificationUI = () => {
    const items = getNotificationItems();
    const unreadCount = items.filter((item) => !item.read).length;
    const totalCount = items.length;

    if (notificationBadge) {
      if (unreadCount > 0) {
        notificationBadge.textContent = String(unreadCount);
        notificationBadge.hidden = false;
        notificationBadge.setAttribute('aria-label', `${unreadCount} unread notifications`);
      } else {
        notificationBadge.hidden = true;
      }
    }

    if (notificationCount) {
      notificationCount.textContent = String(unreadCount);
    }

    if (notificationEmpty) {
      notificationEmpty.hidden = totalCount > 0;
    }

    renderNotificationList(items);
  };

  const initNotificationPrefs = () => {
    if (!notificationToggles.length) return;
    applyNotificationPrefs(readNotificationPrefs());
    updateNotificationUI();
  };

  const setNotificationUserKey = (userId) => {
    const nextKey = userId ? `user-${userId}` : 'anonymous';
    if (notificationUserKey === nextKey) return;
    notificationUserKey = nextKey;
    initNotificationPrefs();
    maybeCreateWorkoutReminder();
    maybeCreateMissingMealReminder();
  };

  const setNotificationPopoverState = (isOpen) => {
    if (!notificationPopover || !notificationTrigger) return;
    notificationPopover.hidden = !isOpen;
    notificationTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };

  const toggleNotificationPopover = (force) => {
    if (!notificationPopover) return;
    const nextOpen = typeof force === 'boolean' ? force : notificationPopover.hidden;
    setNotificationPopoverState(nextOpen);
  };

  const syncConnectedAccounts = (providers = []) => {
    if (!connectBtns.length) return;
    const normalized = new Set(
      (Array.isArray(providers) ? providers : [])
        .map((provider) => String(provider || '').toLowerCase())
        .filter(Boolean)
    );

    connectBtns.forEach((btn) => {
      const provider = String(btn.dataset.settingsConnect || '').toLowerCase();
      const isConnected = provider && normalized.has(provider);
      btn.classList.toggle('is-connected', isConnected);
      btn.disabled = isConnected;
      btn.textContent = isConnected ? 'Connected' : 'Connect';
      btn.setAttribute('aria-pressed', isConnected ? 'true' : 'false');
    });
  };

  const syncPasswordAvailability = (providers = []) => {
    const normalized = new Set(
      (Array.isArray(providers) ? providers : [])
        .map((provider) => String(provider || '').toLowerCase())
        .filter(Boolean)
    );
    const hasLocal = normalized.has('local') || normalized.has('email');
    if (!hasLocal) {
      if (passwordRow) passwordRow.style.display = 'none';
      if (passwordBtn) passwordBtn.disabled = true;
      if (passwordModal) passwordModal.hidden = true;
    } else {
      if (passwordRow) passwordRow.style.display = '';
      if (passwordBtn) passwordBtn.disabled = false;
    }
  };

  const formatGoalLabel = (goal) => {
    if (!goal) return 'General fitness';
    return String(goal)
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const syncBodySidebarState = () => {
    if (!sidebar) return;
    const shouldCollapse = sidebar.classList.contains('collapsed') && !isMobile();
    document.body.classList.toggle('sidebar-collapsed', shouldCollapse);
  };

  const syncHamburgerExpandedState = () => {
    if (!hamburgerMenu || !sidebar) return;
    const expanded = isMobile()
      ? sidebar.classList.contains('is-open')
      : !sidebar.classList.contains('collapsed');
    hamburgerMenu.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  };

  const persistSidebarState = () => {
    if (!sidebar) return;
    const collapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? 'collapsed' : 'expanded');
  };

  const applySavedSidebarState = () => {
    if (!sidebar || !sections) return;
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (isMobile()) {
      sidebar.classList.remove('collapsed');
      sections.classList.remove('collapsed');
      hamburgerMenu?.classList.remove('active');
      document.body.classList.remove('sidebar-collapsed');
      syncHamburgerExpandedState();
      return;
    }
    if (saved === 'collapsed') {
      sidebar.classList.add('collapsed');
      sections.classList.add('collapsed');
      hamburgerMenu?.classList.add('active');
    } else if (saved === 'expanded') {
      sidebar.classList.remove('collapsed');
      sections.classList.remove('collapsed');
      hamburgerMenu?.classList.remove('active');
    }
    syncBodySidebarState();
    syncHamburgerExpandedState();
  };

  if (hamburgerMenu && sidebar && sections) {
    hamburgerMenu.addEventListener('click', () => {
      hamburgerMenu.classList.toggle('active');
      if (isMobile()) {
        sidebar.classList.toggle('is-open');
        sidebar.classList.remove('collapsed');
        sections.classList.remove('collapsed');
        document.body.classList.remove('sidebar-collapsed');
        syncHamburgerExpandedState();
      } else {
        sidebar.classList.toggle('collapsed');
        sections.classList.toggle('collapsed');
        sidebar.classList.remove('is-open');
        syncBodySidebarState();
        syncHamburgerExpandedState();
        persistSidebarState();
      }
    });

    window.addEventListener('resize', () => {
      if (isMobile()) {
        sections.classList.remove('collapsed');
        sidebar.classList.remove('collapsed');
        sidebar.classList.remove('is-open');
        document.body.classList.remove('sidebar-collapsed');
      } else {
        sidebar.classList.remove('is-open');
        applySavedSidebarState();
        persistSidebarState();
      }
      syncHamburgerExpandedState();
    });
  }

  if (closeBtn && sidebar && hamburgerMenu) {
    closeBtn.addEventListener('click', () => {
      if (isMobile()) {
        sidebar.classList.remove('is-open');
        hamburgerMenu.classList.remove('active');
        syncHamburgerExpandedState();
      }
    });
  }

  applySavedSidebarState();
  requestAnimationFrame(() => document.body.classList.remove('sidebar-init'));

  const applyTheme = (mode) => {
    const isLight = mode === 'light';
    document.body.classList.toggle('dark-mode', isLight);
    themeToggle?.classList.toggle('dark-mode', isLight);
    themeToggle?.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
  };

  const storedTheme = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const initialTheme = storedTheme || (prefersDark.matches ? 'light' : 'dark');
  applyTheme(initialTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
    themeToggle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        applyTheme(nextTheme);
      }
    });
  }

  const setupSidebarNavIcons = () => {
    const navItems = Array.from(document.querySelectorAll('.sidebar .property'));
    if (!navItems.length) return;

    const getLabel = (item) => item.querySelector('.label') || item.querySelector('p');

    const setActiveItem = (target) => {
      navItems.forEach((item) => {
        const label = getLabel(item);
        const isActive = item === target;
        if (label) {
          label.classList.toggle('active', isActive);
        }

        const icon = item.querySelector('img');
        if (icon) {
          const defaultSrc = item.dataset.iconDefault || icon.dataset.defaultSrc || icon.getAttribute('src');
          if (!icon.dataset.defaultSrc) {
            icon.dataset.defaultSrc = defaultSrc;
          }
          const activeSrc = item.dataset.iconActive || icon.dataset.defaultSrc;
          icon.src = isActive ? activeSrc : icon.dataset.defaultSrc;
        }

        if (isActive) {
          item.setAttribute('aria-current', 'page');
        } else {
          item.removeAttribute('aria-current');
        }
      });
    };

    navItems.forEach((item) => {
      const icon = item.querySelector('img');
      if (icon) {
        const defaultSrc = item.dataset.iconDefault || icon.dataset.defaultSrc || icon.getAttribute('src');
        icon.dataset.defaultSrc = defaultSrc;
        const label = getLabel(item);
        if (label?.classList.contains('active') && item.dataset.iconActive) {
          icon.src = item.dataset.iconActive;
        }
      }

      item.addEventListener('click', () => {
        setActiveItem(item);
      });
    });

    const initialActive = navItems.find((item) => {
      const label = getLabel(item);
      return label?.classList.contains('active') || item.getAttribute('aria-current') === 'page';
    });

    if (initialActive) {
      setActiveItem(initialActive);
    }
  };

  setupSidebarNavIcons();

  const tabButtons = Array.from(document.querySelectorAll('[data-settings-tab]'));
  const panels = Array.from(document.querySelectorAll('[data-settings-panel]'));

  const setActiveTab = (target) => {
    const targetKey = target?.dataset?.settingsTab;
    if (!targetKey) return;
    tabButtons.forEach((btn) => {
      const active = btn.dataset.settingsTab === targetKey;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach((panel) => {
      const active = panel.dataset.settingsPanel === targetKey;
      panel.classList.toggle('is-hidden', !active);
    });
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab(btn));
  });

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
      setTimeout(closePasswordModal, 800);
    } catch (err) {
      passwordFeedback && (passwordFeedback.textContent = err.message || 'Failed to change password.');
    }
  });

  emailEditBtn?.addEventListener('click', () => {
    showPromptAlert('Email updates are not available yet.');
  });

  connectBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      showPromptAlert('Account connections are coming soon.');
    });
  });

  notificationToggles.forEach((toggle) => {
    toggle.addEventListener('change', async () => {
      const nextPrefs = collectNotificationPrefs();
      writeNotificationPrefs(nextPrefs);
      updateNotificationUI();
      if (toggle.dataset.notifyKey === 'workout_reminders' && toggle.checked) {
        maybeCreateWorkoutReminder(true);
      }
      if (toggle.dataset.notifyKey === 'meal_plan_reminders' && toggle.checked) {
        maybeCreateMissingMealReminder(true);
      }
      await saveNotificationPrefsToServer({
        ...nextPrefs,
        account_alerts_enabled: Boolean(nextPrefs.account_security_alerts)
      });
    });
  });

  if (notificationTrigger) {
    notificationTrigger.addEventListener('click', () => {
      toggleNotificationPopover();
    });
    notificationTrigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleNotificationPopover();
      }
    });
  }

  notificationClose?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setNotificationPopoverState(false);
    notificationTrigger?.focus();
  });

  notificationList?.addEventListener('click', (event) => {
    const target = event.target;
    const item = target instanceof Element ? target.closest('.settings-notification-item') : null;
    if (!item) return;
    const id = item.dataset.notificationId || null;
    const index = item.dataset.notificationIndex ? Number(item.dataset.notificationIndex) : null;
    markNotificationRead({ id, index });
    const route = item.dataset.notificationRoute;
    if (!route) return;
    window.location.href = route;
  });

  notificationList?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target;
    const item = target instanceof Element ? target.closest('.settings-notification-item') : null;
    if (!item) return;
    const id = item.dataset.notificationId || null;
    const index = item.dataset.notificationIndex ? Number(item.dataset.notificationIndex) : null;
    markNotificationRead({ id, index });
    const route = item.dataset.notificationRoute;
    if (!route) return;
    event.preventDefault();
    window.location.href = route;
  });

  document.addEventListener('click', (event) => {
    if (!notificationPopover || notificationPopover.hidden) return;
    const target = event.target;
    if (notificationPopover.contains(target) || notificationTrigger?.contains(target)) {
      return;
    }
    setNotificationPopoverState(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && notificationPopover && !notificationPopover.hidden) {
      setNotificationPopoverState(false);
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === getNotificationFeedKey()) {
      updateNotificationUI();
    }
    if (event.key === getNotificationStorageKey()) {
      applyNotificationPrefs(readNotificationPrefs());
      updateNotificationUI();
      maybeCreateMissingMealReminder();
    }
  });

  deleteBtn?.addEventListener('click', async () => {
    if (!deleteBtn) return;
    const originalText = deleteBtn.textContent;
    deleteBtn.disabled = true;
    deleteBtn.textContent = 'Deleting...';
    try {
      const res = await fetch('/api/delete-account', { method: 'POST' });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to delete account' }));
        throw new Error(error.error || 'Failed to delete account');
      }
      if (window.supabaseClient?.auth) {
        try {
          await window.supabaseClient.auth.signOut();
        } catch (err) {
          console.warn('Failed to sign out Supabase session', err);
        }
      }
      window.location.href = 'login.html';
    } catch (err) {
      deleteBtn.disabled = false;
      deleteBtn.textContent = originalText || 'Delete Account';
      showPromptAlert(err.message || 'Failed to delete account.', { tone: 'danger' });
    }
  });

  if (window.FFSupa?.syncFromHash) {
    try {
      await window.FFSupa.syncFromHash();
    } catch (err) {
      console.warn('Failed to sync Supabase session from hash', err);
    }
  }

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
        window.location.href = 'login.html';
        return;
      }
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      const user = data.user || {};
      if (user?.id) {
        setNotificationUserKey(user.id);
      }
      const profile = user.profile || {};
      const name = user.name || 'FlexFule Member';
      const goalLabel = formatGoalLabel(profile.goal);
      if (userNameEl) userNameEl.textContent = name;
      if (userGoalEl) userGoalEl.textContent = `Goal, ${goalLabel}`;
      if (userEmailEl) userEmailEl.textContent = user.email || '--';
      if (userAvatarEl) {
        userAvatarEl.src = profile?.avatar_url || 'images/user.png';
        userAvatarEl.alt = `${name}'s avatar`;
      }
      syncConnectedAccounts(user.providers || []);
      syncPasswordAvailability(user.providers || []);
      await syncNotificationPrefsFromServer();
      await syncNotificationFeedFromServer();
    } catch (err) {
      console.error('Unable to load profile', err);
      window.location.href = 'login.html';
    }
  }

  initNotificationPrefs();
  fetchCurrentUser();
});
