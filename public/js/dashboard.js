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
const greetingPrefix = document.getElementById('greetingPrefix');
const greetingName = document.getElementById('greetingName');
const userGoalEl = document.getElementById('userGoal');
const notificationTrigger = document.querySelector('[data-dashboard-notification-trigger]');
const notificationPopover = document.querySelector('[data-dashboard-notifications]');
const notificationList = document.querySelector('[data-dashboard-notification-list]');
const notificationEmpty = document.querySelector('[data-dashboard-notification-empty]');
const notificationBadge = document.querySelector('[data-dashboard-notification-badge]');
const notificationCount = document.querySelector('[data-dashboard-notification-count]');
const notificationClose = document.querySelector('[data-dashboard-notification-close]');
const greetingSub = document.getElementById('greetingSub');
const greetingDate = document.getElementById('greetingDate');
const datePickerInput = document.getElementById('dashboardDatePicker');
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
const goalTrendLine = document.querySelector('.goal-trend-line');
const goalTrendArea = document.querySelector('.goal-trend-area');
const streakCardEl = document.getElementById('streakCard');
const streakLevelLabel = document.getElementById('streakLevelLabel');
const streakCurrentEl = document.getElementById('streakCurrent');

const GOAL_STORAGE_PREFIX = 'flexfule.goals';
const MEAL_PLAN_CACHE_KEY = 'flexfuel.meals.planCache';
const MEAL_PLAN_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const MEAL_CUSTOM_PLAN_KEY = 'flexfuel.meals.customPlan';
const MEAL_LAST_USER_KEY = 'flexfuel.meals.lastUserKey';
const WORKOUT_COMPLETION_STORE_KEY = 'ff-workout-completion-state';
const MEAL_COMPLETION_PREFIX = 'flexfuel.meals.completed';
const ACTIVE_DAY_STORAGE_KEY = 'flexfule.active-day';
const DEFAULT_NOTIFICATION_PREFS = {
  workout_reminders: true,
  goal_milestones: true,
  missed_workouts: true,
  meal_plan_reminders: true,
  weekly_progress_summary: true,
  goal_achievements: true,
  account_security_alerts: true
};
const WEEKLY_REPORT_STORAGE_KEY = 'flexfule.weekly-report';
const WEEK_ANCHOR_STORAGE_KEY = 'flexfule.week-anchor';
const NEW_USER_WELCOME_KEY = 'flexfule.new-user-welcome';
const NEW_USER_SUBLINES = [
  'Welcome to FlexFule. Let’s build your momentum today.',
  'New start, new strength. Let’s get moving.',
  'Glad you’re here. Today is about progress.'
];
const NOTIFICATION_COPY = {
  workout_reminders: {
    title: 'Workout Reminders',
    message: "Sends a notification before your scheduled workout."
  },
  goal_milestones: {
    title: 'Goal Milestones',
    message: 'Celebrate when you achieve key milestones.'
  },
  missed_workouts: {
    title: 'Missed Workouts',
    message: 'Reminds you to stay on track if you miss a workout.'
  },
  meal_plan_reminders: {
    title: 'Meal Plan Reminders',
    message: 'Pre-plan your meals for tomorrow based on your plan.'
  },
  weekly_progress_summary: {
    title: 'Weekly Progress Summary',
    message: 'Recap your weekly fitness progress.'
  },
  goal_achievements: {
    title: 'Goal Achievements',
    message: 'Celebrate your milestones.'
  },
  account_security_alerts: {
    title: 'Account Alerts',
    message: 'Inactivity alerts and account updates.'
  }
};
const WORKOUT_REMINDER_MESSAGES = [
  'Time to work out 💪 Let’s get moving!',
  'Get up — your workout is waiting. Let’s build that discipline.',
  'Do it for the progress, not the mood. Workout time!'
];
const WORKOUT_REMINDER_STORAGE_PREFIX = 'flexfule.notifications.workoutReminder';
const MISSED_WORKOUT_STORAGE_PREFIX = 'flexfule.notifications.missedWorkout';
const MEAL_REMINDER_STORAGE_PREFIX = 'flexfule.notifications.missedMeals';
const NOTIFICATION_FEED_STORAGE_PREFIX = 'flexfule.notifications.feed';
const ACHIEVEMENT_STORAGE_PREFIX = 'flexfule.achievements.sent';
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
const MISSED_WORKOUT_TRIGGER_HOUR = 18;
const MEAL_REMINDER_TRIGGER_HOUR = 18;
const PERFORMANCE_ACHIEVEMENT_THRESHOLD = 75;
const WORKOUT_MILESTONE_STEP = 15;
let missedWorkoutTimerId = null;
let missedMealTimerId = null;
let weekAnchorDate = null;

const showPromptAlert = (message, options = {}) => {
  if (window.FFPrompt?.alert) {
    return window.FFPrompt.alert(message, options);
  }
  window.alert(message);
  return Promise.resolve();
};

const getNotificationStorageKey = () => `flexfule.notifications.${notificationUserKey}`;
const getWorkoutReminderStorageKey = () => `${WORKOUT_REMINDER_STORAGE_PREFIX}.${notificationUserKey}`;
const getMissedWorkoutStorageKey = () => `${MISSED_WORKOUT_STORAGE_PREFIX}.${notificationUserKey}`;
const getMissedMealStorageKey = () => `${MEAL_REMINDER_STORAGE_PREFIX}.${notificationUserKey}`;
const getNotificationFeedKey = () => `${NOTIFICATION_FEED_STORAGE_PREFIX}.${notificationUserKey}`;

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

const readMissedWorkoutState = () => {
  try {
    const raw = localStorage.getItem(getMissedWorkoutStorageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (err) {
    console.warn('Failed to read missed workout state', err);
    return null;
  }
};

const writeMissedWorkoutState = (state) => {
  try {
    localStorage.setItem(getMissedWorkoutStorageKey(), JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save missed workout state', err);
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

const getAchievementStorageKey = (userKey) => `${ACHIEVEMENT_STORAGE_PREFIX}.${userKey || 'anonymous'}`;

const readAchievementIds = (userKey) => {
  try {
    const raw = localStorage.getItem(getAchievementStorageKey(userKey));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item) => typeof item === 'string'));
  } catch (err) {
    console.warn('Failed to read achievement state', err);
    return new Set();
  }
};

const writeAchievementIds = (userKey, ids) => {
  try {
    localStorage.setItem(getAchievementStorageKey(userKey), JSON.stringify(Array.from(ids || [])));
  } catch (err) {
    console.warn('Failed to save achievement state', err);
  }
};

const registerAchievement = (userKey, achievement) => {
  if (!achievement?.id) return false;
  const ids = readAchievementIds(userKey);
  if (ids.has(achievement.id)) return false;
  ids.add(achievement.id);
  writeAchievementIds(userKey, ids);
  return true;
};

const fetchAchievementsFromServer = async () => {
  if (!currentUserId) return [];
  try {
    const res = await fetch('/api/achievements');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.achievements) ? data.achievements : [];
  } catch (err) {
    console.warn('Failed to load achievements from server', err);
    return [];
  }
};

const syncAchievementState = async (userKey) => {
  if (!currentUserId) return readAchievementIds(userKey);
  const localIds = readAchievementIds(userKey);
  const serverList = await fetchAchievementsFromServer();
  const serverIds = new Set(serverList.map((item) => item?.achievement_key).filter(Boolean));
  const missingIds = Array.from(localIds).filter((id) => !serverIds.has(id));

  if (missingIds.length) {
    try {
      await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          achievements: missingIds.map((id) => ({ id }))
        })
      });
    } catch (err) {
      console.warn('Failed to sync local achievements to server', err);
    }
  }

  const merged = new Set([...serverIds, ...localIds]);
  writeAchievementIds(userKey, merged);
  return merged;
};

const persistAchievementsToServer = async (achievements) => {
  if (!currentUserId || !Array.isArray(achievements) || achievements.length === 0) return;
  try {
    await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ achievements })
    });
  } catch (err) {
    console.warn('Failed to persist achievements to server', err);
  }
};

const addNotificationToFeed = (item) => {
  if (!item) return;
  const feed = readNotificationFeed();
  if (item.id && feed.some((entry) => entry && entry.id === item.id)) return;
  const normalized = { read: false, ...item };
  const nextFeed = [normalized, ...feed].slice(0, MAX_NOTIFICATION_ITEMS);
  writeNotificationFeed(nextFeed);
  updateNotificationUI();
  persistNotificationsToServer([
    {
      id: buildNotificationKey(normalized),
      title: normalized.title,
      message: normalized.message,
      type: normalized.type,
      createdAt: normalized.createdAt,
      read: normalized.read
    }
  ]);
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
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...(readNotificationPrefs() || {}) };
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

const hasPlannedWorkoutForDate = (date) => {
  const planDetails = getDailyPlanForDate(date);
  const exercises = planDetails?.workout?.exercises;
  return Array.isArray(exercises) && exercises.length > 0;
};

const hasLoggedWorkoutForDate = (iso) => {
  if (!iso) return false;
  const completionBucket = getWorkoutCompletionBucket();
  return Boolean(completionBucket?.[iso]?.logged);
};

const scheduleMissedWorkoutCheck = (now = new Date()) => {
  if (missedWorkoutTimerId) return;
  const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), MISSED_WORKOUT_TRIGGER_HOUR, 0, 0, 0);
  const delay = targetTime.getTime() - now.getTime();
  if (delay <= 0) {
    maybeCreateMissedWorkoutReminder(true);
    return;
  }
  missedWorkoutTimerId = window.setTimeout(() => {
    missedWorkoutTimerId = null;
    maybeCreateMissedWorkoutReminder(true);
  }, delay);
};

const maybeCreateMissedWorkoutReminder = (force = false) => {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...(readNotificationPrefs() || {}) };
  if (!prefs.missed_workouts) return;
  const now = new Date();
  const todayIso = toISODate(now);
  if (!todayIso) return;
  const state = readMissedWorkoutState();
  if (state?.lastShown === todayIso) return;
  if (!force && now.getHours() < MISSED_WORKOUT_TRIGGER_HOUR) {
    scheduleMissedWorkoutCheck(now);
    return;
  }
  if (!hasPlannedWorkoutForDate(now)) {
    writeMissedWorkoutState({ lastChecked: todayIso, lastShown: state?.lastShown || null });
    return;
  }
  if (hasLoggedWorkoutForDate(todayIso)) {
    writeMissedWorkoutState({ lastChecked: todayIso, lastShown: state?.lastShown || null });
    return;
  }
  addNotificationToFeed({
    id: `missed-workout-${todayIso}`,
    type: 'missed_workout',
    title: 'Missed Workout',
    message: "You missed today's workout video. Get back on track tomorrow.",
    createdAt: new Date().toISOString()
  });
  writeMissedWorkoutState({ lastChecked: todayIso, lastShown: todayIso });
};

const getMealCompletionSet = (dateIso) => {
  if (!dateIso) return new Set();
  const lastUserKey = window.localStorage?.getItem(MEAL_LAST_USER_KEY);
  const userKey = lastUserKey || (currentUserId ? `user:${currentUserId}` : 'anonymous');
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

const getMealCompletionStorageKey = (userKey) => `${MEAL_COMPLETION_PREFIX}.${userKey || 'anonymous'}`;

const readMealCompletionState = (userKey) => {
  try {
    const raw = window.localStorage?.getItem(getMealCompletionStorageKey(userKey));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    return {};
  }
};

const writeMealCompletionState = (userKey, state) => {
  try {
    window.localStorage?.setItem(getMealCompletionStorageKey(userKey), JSON.stringify(state || {}));
  } catch (err) {
    console.warn('Failed to persist meal completion state', err);
  }
};

const syncMealCompletionsFromServer = async (userKey) => {
  if (!currentUserId) return;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90);
  const startIso = toISODate(start);
  const endIso = toISODate(today);
  try {
    const res = await fetch(`/api/meal-completions?start=${startIso}&end=${endIso}`);
    if (!res.ok) return;
    const data = await res.json();
    const serverEntries = Array.isArray(data?.entries) ? data.entries : [];
    const localState = readMealCompletionState(userKey);
    const serverKeys = new Set();

    serverEntries.forEach((entry) => {
      const date = entry?.meal_date;
      const mealId = entry?.meal_id;
      if (!date || !mealId) return;
      serverKeys.add(`${date}::${mealId}`);
      if (!Array.isArray(localState[date])) localState[date] = [];
      if (!localState[date].includes(mealId)) localState[date].push(mealId);
    });

    writeMealCompletionState(userKey, localState);

    const missingEntries = Object.entries(localState).flatMap(([date, ids]) =>
      (ids || [])
        .filter((mealId) => !serverKeys.has(`${date}::${mealId}`))
        .map((mealId) => ({ meal_date: date, meal_id: mealId }))
    );
    if (missingEntries.length) {
      await fetch('/api/meal-completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: missingEntries })
      });
    }
  } catch (err) {
    console.warn('Failed to sync meal completions', err);
  }
};

const getActiveDayStorageKey = (userKey) => `${ACTIVE_DAY_STORAGE_KEY}.${userKey || 'anonymous'}`;

const readActiveDay = (userKey) => {
  try {
    const raw = window.localStorage?.getItem(getActiveDayStorageKey(userKey));
    return raw && typeof raw === 'string' ? raw : null;
  } catch (err) {
    return null;
  }
};

const writeActiveDay = (userKey, iso) => {
  if (!iso) return;
  try {
    window.localStorage?.setItem(getActiveDayStorageKey(userKey), iso);
  } catch (err) {
    /* ignore */
  }
  persistActiveDayToServer(iso);
};

const fetchActiveDayFromServer = async () => {
  if (!currentUserId) return null;
  try {
    const res = await fetch('/api/active-day');
    if (!res.ok) return null;
    const data = await res.json();
    return parseISODate(data?.active_date);
  } catch (err) {
    console.warn('Failed to load active day from server', err);
    return null;
  }
};

const persistActiveDayToServer = async (iso) => {
  if (!currentUserId || !iso) return;
  try {
    await fetch('/api/active-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active_date: iso })
    });
  } catch (err) {
    console.warn('Failed to save active day to server', err);
  }
};

const syncActiveDayFromServer = async (userKey) => {
  const localIso = readActiveDay(userKey);
  const serverDate = await fetchActiveDayFromServer();
  const serverIso = serverDate ? toISODate(serverDate) : null;
  const todayIso = toISODate(new Date());
  const candidates = [localIso, serverIso].filter(Boolean);
  if (!candidates.length) return null;
  let chosen = candidates.sort().pop();
  if (todayIso && chosen > todayIso) {
    chosen = todayIso;
  }
  if (chosen) {
    writeActiveDay(userKey, chosen);
    if (serverIso !== chosen) {
      await persistActiveDayToServer(chosen);
    }
  }
  return chosen ? parseISODate(chosen) : null;
};

const shiftIsoDate = (iso, days) => {
  const base = parseISODate(iso);
  if (!(base instanceof Date) || Number.isNaN(base.getTime())) return null;
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return toISODate(next);
};

const isMealPlanCompleteForDate = (dateIso) => {
  if (!dateIso) return false;
  const cachedPlan = getCachedMealPlanForDate(dateIso);
  const planDetails = cachedPlan ? null : getDailyPlanForDate(parseISODate(dateIso) || new Date());
  const meals = (cachedPlan?.meals || planDetails?.meals?.meals || []).filter((meal) => meal && !meal.removed);
  if (!meals.length) return true;
  const completionSet = getMealCompletionSet(dateIso);
  return meals.every((meal) => completionSet.has(meal.id));
};

const isWorkoutCompleteForDate = (dateIso) => {
  if (!dateIso) return false;
  const dateObj = parseISODate(dateIso);
  if (dateObj instanceof Date && !Number.isNaN(dateObj.getTime())) {
    if (!hasPlannedWorkoutForDate(dateObj)) return true;
  }
  return hasLoggedWorkoutForDate(dateIso);
};

const isActivityDayComplete = (dateIso) => {
  return isMealPlanCompleteForDate(dateIso) && isWorkoutCompleteForDate(dateIso);
};

const resolveActivePlanDate = (userKey, today = new Date()) => {
  const todayIso = toISODate(today);
  if (!todayIso) return today;
  let activeIso = readActiveDay(userKey);
  if (!activeIso || !parseISODate(activeIso)) {
    activeIso = todayIso;
  }
  if (activeIso > todayIso) {
    activeIso = todayIso;
  }
  if (activeIso < todayIso) {
    let guard = 0;
    while (activeIso < todayIso && isActivityDayComplete(activeIso) && guard < 31) {
      const nextIso = shiftIsoDate(activeIso, 1);
      if (!nextIso || nextIso > todayIso) break;
      activeIso = nextIso;
      guard += 1;
    }
  }
  writeActiveDay(userKey, activeIso);
  return parseISODate(activeIso) || today;
};

const getMealPlanMealsForDate = (date) => {
  const iso = toISODate(date);
  if (!iso) return [];
  const cachedPlan = getCachedMealPlanForDate(iso);
  if (cachedPlan && Array.isArray(cachedPlan.meals)) {
    return cachedPlan.meals;
  }
  const planDetails = getDailyPlanForDate(date);
  const planMeals = planDetails?.meals?.meals;
  return Array.isArray(planMeals) ? planMeals : [];
};

const getMissingMealNamesForDate = (date) => {
  const iso = toISODate(date);
  if (!iso) return [];
  const meals = getMealPlanMealsForDate(date).filter((meal) => meal && !meal.removed);
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

const maybeCreateMissingMealReminder = (force = false) => {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...(readNotificationPrefs() || {}) };
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

const formatKg = (value) => {
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}kg`;
};

const getPlanDayFromAnchor = (date, anchorDate) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  if (!(anchorDate instanceof Date) || Number.isNaN(anchorDate.getTime())) return null;
  const diff = differenceInDays(anchorDate, date);
  return diff + 1;
};

const isTargetWeightReached = (profile) => {
  const current = Number(profile?.weight_kg);
  const target = Number(profile?.target_weight);
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) return false;
  const start = Number(profile?.starting_weight_kg);
  const baseline = Number.isFinite(start) && start > 0 ? start : current;
  if (target >= baseline) {
    return current >= target;
  }
  return current <= target;
};

const buildTargetWeightAchievement = (profile) => {
  if (!isTargetWeightReached(profile)) return null;
  const target = Number(profile?.target_weight);
  const targetLabel = formatKg(target) || 'your target';
  const targetKey = Number.isFinite(target) ? Math.round(target * 10) : 'goal';
  return {
    id: `achievement-target-weight-${targetKey}`,
    type: 'goal_achievements',
    title: 'Target Weight Reached',
    message: `You reached ${targetLabel}. Incredible work!`
  };
};

const buildWeeklyHabitAchievement = (weekStart) => {
  const summary = getWeeklyHabitSummary(currentUserId, weekStart);
  const fullStreak =
    Number(summary.totalDays || 0) >= 7 &&
    Number(summary.proteinDays || 0) >= 7 &&
    Number(summary.sleepDays || 0) >= 7 &&
    Number(summary.noSugarDays || 0) >= 7 &&
    Number(summary.waterDays || 0) >= 7;
  if (!fullStreak) return null;
  const weekKey = toISODate(weekStart) || 'week';
  return {
    id: `achievement-habit-streak-${weekKey}`,
    type: 'goal_achievements',
    title: 'Weekly Habit Streak',
    message: '7/7 habits completed this week. Keep the streak alive!'
  };
};

const buildPlanMilestoneAchievement = (userKey) => {
  const activeDate = resolveActivePlanDate(userKey, new Date());
  const anchor = weekAnchorDate || activeDate;
  const dayNumber = getPlanDayFromAnchor(activeDate, anchor);
  if (!Number.isFinite(dayNumber) || dayNumber < WORKOUT_MILESTONE_STEP) return null;
  if (dayNumber % WORKOUT_MILESTONE_STEP !== 0) return null;
  const anchorKey = toISODate(anchor) || 'anchor';
  return {
    id: `achievement-plan-day-${anchorKey}-${dayNumber}`,
    type: 'goal_achievements',
    title: 'Workout Plan Milestone',
    message: `Day ${dayNumber} completed. Keep pushing forward!`
  };
};

const buildPerformanceAchievement = async (weekStart, weekEnd) => {
  const startIso = toISODate(weekStart);
  const endIso = toISODate(weekEnd);
  if (!startIso || !endIso) return null;
  try {
    const res = await fetch(`/api/workouts/performance-weekly?start=${startIso}&end=${endIso}`);
    if (!res.ok) return null;
    const data = await res.json();
    const percent = Number(data.percentWatched);
    if (!Number.isFinite(percent) || percent < PERFORMANCE_ACHIEVEMENT_THRESHOLD) return null;
    const rounded = Math.round(percent);
    return {
      id: `achievement-performance-${startIso}`,
      type: 'goal_achievements',
      title: 'Performance Milestone',
      message: `Performance score hit ${rounded}%. Strong consistency!`
    };
  } catch (err) {
    console.warn('Failed to check performance achievements', err);
    return null;
  }
};

const maybeSendGoalAchievementEmail = async (user, achievements) => {
  if (!user?.email || !Array.isArray(achievements) || achievements.length === 0) return;
  try {
    await fetch('/api/reports/goal-achievements-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ achievements })
    });
  } catch (err) {
    console.warn('Failed to send goal achievement email', err);
  }
};

const maybeCreateGoalAchievements = async (user) => {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...(readNotificationPrefs() || {}) };
  if (!prefs.goal_achievements) return;
  const userKey = currentUserId ? `user:${currentUserId}` : 'anonymous';
  const achievements = [];
  const targetAchievement = buildTargetWeightAchievement(profileContext);
  if (targetAchievement) achievements.push(targetAchievement);

  const { start, end } = getWeekRange(new Date());
  const habitAchievement = buildWeeklyHabitAchievement(start);
  if (habitAchievement) achievements.push(habitAchievement);

  const planMilestone = buildPlanMilestoneAchievement(userKey);
  if (planMilestone) achievements.push(planMilestone);

  const performanceAchievement = await buildPerformanceAchievement(start, end);
  if (performanceAchievement) achievements.push(performanceAchievement);

  if (!achievements.length) return;

  const createdAt = new Date().toISOString();
  const newlyAdded = [];
  achievements.forEach((achievement) => {
    if (registerAchievement(userKey, achievement)) {
      addNotificationToFeed({ ...achievement, createdAt });
      newlyAdded.push(achievement);
    }
  });

  if (newlyAdded.length) {
    await persistAchievementsToServer(newlyAdded);
    await maybeSendGoalAchievementEmail(user, newlyAdded);
  }
};

let mealRolloverTimerId = null;

const scheduleMealRollover = (now = new Date()) => {
  if (mealRolloverTimerId) return;
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2, 0);
  const delay = target.getTime() - now.getTime();
  mealRolloverTimerId = window.setTimeout(() => {
    mealRolloverTimerId = null;
    maybeAdvanceMealDay();
  }, Math.max(delay, 1000));
};

const maybeAdvanceMealDay = () => {
  const now = new Date();
  const userKey = currentUserId ? `user:${currentUserId}` : 'anonymous';
  const nextDate = resolveActivePlanDate(userKey, now);
  if (!isSameDay(selectedDate, nextDate)) {
    setSelectedDate(nextDate);
  }
  scheduleMealRollover(now);
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

  try {
    localStorage.setItem(getNotificationStorageKey(), JSON.stringify(merged));
  } catch (err) {
    console.warn('Failed to persist notification preferences', err);
  }
  return merged;
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

  const payload = mergedFeed.map((item) => ({
    id: buildNotificationKey(item),
    title: item.title,
    message: item.message,
    type: item.type,
    createdAt: item.createdAt,
    read: item.read
  }));
  await persistNotificationsToServer(payload);
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
          id: buildNotificationKey(updatedItem),
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
    entry.className = 'dashboard-notification-item';
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
    icon.className = 'dashboard-notification-icon';
    icon.textContent = item.title.charAt(0).toUpperCase();

    const copy = document.createElement('div');
    copy.className = 'dashboard-notification-copy';

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
  updateNotificationUI();
};

const setNotificationUserKey = (userId) => {
  const nextKey = userId ? `user-${userId}` : 'anonymous';
  if (notificationUserKey === nextKey) return;
  notificationUserKey = nextKey;
  initNotificationPrefs();
  maybeCreateWorkoutReminder();
};

const setNotificationPopoverState = (isOpen) => {
  if (!notificationPopover || !notificationTrigger) return;
  notificationPopover.hidden = !isOpen;
  notificationTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  notificationTrigger.classList.toggle('is-open', isOpen);
};

const toggleNotificationPopover = (force) => {
  if (!notificationPopover) return;
  const nextOpen = typeof force === 'boolean' ? force : notificationPopover.hidden;
  setNotificationPopoverState(nextOpen);
};

const setupNotificationPopover = () => {
  initNotificationPrefs();

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
    const item = target instanceof Element ? target.closest('.dashboard-notification-item') : null;
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
    const item = target instanceof Element ? target.closest('.dashboard-notification-item') : null;
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
    if (event.key === getNotificationStorageKey()) {
      initNotificationPrefs();
      maybeCreateWorkoutReminder();
      maybeCreateMissedWorkoutReminder();
      maybeCreateMissingMealReminder();
    }
    if (event.key === getNotificationFeedKey()) {
      updateNotificationUI();
    }
  });
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
let notificationUserKey = 'anonymous';
let goalNutritionTarget = 0;
let workoutEntries = [];
let setDayActiveFn = null;
const planCache = new Map();
let targetWorkoutMinutes = 45;
const CALORIES_PER_MINUTE_ESTIMATE = 8;
const DEFAULT_NUTRITION_TARGET = 2000;
const DEFAULT_HYDRATION_BASE_ML = 2000;
const WATER_ML_PER_KCAL = 2;
const WATER_ML_PER_WORKOUT_MIN = 12;
const MIN_HYDRATION_ML = 2000;
const MAX_HYDRATION_ML = 6000;
let hydrationTargetBaseMl = DEFAULT_HYDRATION_BASE_ML;
let todayTargetData = null;
const DASH_TARGET_CACHE_KEY = 'ff-dashboard-target-cache';
let suppressTargetUpdates = false;
let hasCachedTargets = false;
let fallbackNutritionTarget = DEFAULT_NUTRITION_TARGET;
let targetsLoading = true;

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

const setTargetPlaceholders = () => {
  if (targetCaloriesEl) targetCaloriesEl.textContent = '—';
  if (targetWaterEl) targetWaterEl.textContent = '—';
  if (targetWorkoutEl) targetWorkoutEl.textContent = '—';
};

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

const loadMealPlanCache = () => {
  try {
    const raw = window.localStorage?.getItem(MEAL_PLAN_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.savedAt || !parsed.mealsByDate) return null;
    if (Date.now() - Number(parsed.savedAt) > MEAL_PLAN_CACHE_MAX_AGE_MS) return null;
    const lastUserKey = window.localStorage?.getItem(MEAL_LAST_USER_KEY);
    if (lastUserKey && parsed.userKey && parsed.userKey !== lastUserKey) return null;
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

const getWorkoutCompletionBucket = () => {
  try {
    const raw = window.localStorage?.getItem(WORKOUT_COMPLETION_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const userKey = currentUserId ? `user:${currentUserId}` : 'anonymous';
    return parsed[userKey] || parsed.anonymous || {};
  } catch (err) {
    console.warn('Failed to read workout completion state', err);
    return {};
  }
};

const readWorkoutCompletionState = () => {
  try {
    const raw = window.localStorage?.getItem(WORKOUT_COMPLETION_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    return {};
  }
};

const writeWorkoutCompletionState = (state) => {
  try {
    window.localStorage?.setItem(WORKOUT_COMPLETION_STORE_KEY, JSON.stringify(state || {}));
  } catch (err) {
    console.warn('Failed to persist workout completion state', err);
  }
};

const syncWorkoutCompletionsFromServer = async (userKey) => {
  if (!currentUserId) return;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90);
  const startIso = toISODate(start);
  const endIso = toISODate(today);
  try {
    const res = await fetch(`/api/workout-completions?start=${startIso}&end=${endIso}`);
    if (!res.ok) return;
    const data = await res.json();
    const serverEntries = Array.isArray(data?.entries) ? data.entries : [];
    const serverDates = new Set(serverEntries.map((entry) => entry?.workout_date).filter(Boolean));
    const state = readWorkoutCompletionState();
    const bucket = state[userKey] && typeof state[userKey] === 'object' ? state[userKey] : {};

    serverEntries.forEach((entry) => {
      const date = entry?.workout_date;
      if (!date) return;
      if (!bucket[date]) {
        bucket[date] = { logged: true, loggedAt: new Date().toISOString() };
      } else if (!bucket[date].logged) {
        bucket[date].logged = true;
      }
    });

    state[userKey] = bucket;
    writeWorkoutCompletionState(state);

    const missingEntries = Object.entries(bucket)
      .filter(([, info]) => info?.logged)
      .filter(([date]) => !serverDates.has(date))
      .map(([date]) => ({ workout_date: date, logged: true }));
    if (missingEntries.length) {
      await fetch('/api/workout-completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: missingEntries })
      });
    }
  } catch (err) {
    console.warn('Failed to sync workout completions', err);
  }
};

const getMealCompletionRatio = (dateIso) => {
  if (!dateIso) return 0;
  const plan = getCachedMealPlanForDate(dateIso);
  if (!plan || !Array.isArray(plan.meals)) return 0;
  const activeMeals = plan.meals.filter((meal) => meal && !meal.removed);
  if (!activeMeals.length) return 0;
  const lastUserKey = window.localStorage?.getItem(MEAL_LAST_USER_KEY);
  const userKey = lastUserKey || (currentUserId ? `user:${currentUserId}` : 'anonymous');
  const completionKey = `${MEAL_COMPLETION_PREFIX}.${userKey || 'anonymous'}`;
  let completedIds = [];
  try {
    const raw = window.localStorage?.getItem(completionKey);
    const parsed = raw ? JSON.parse(raw) : null;
    completedIds = Array.isArray(parsed?.[dateIso]) ? parsed[dateIso] : [];
  } catch (err) {
    completedIds = [];
  }
  const completedSet = new Set(completedIds);
  const completedCount = activeMeals.reduce((sum, meal) => sum + (completedSet.has(meal.id) ? 1 : 0), 0);
  return activeMeals.length ? Math.min(completedCount / activeMeals.length, 1) : 0;
};

const formatDayAbbrev = (iso) => {
  if (!iso) return '--';
  const date = parseISODate(iso);
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '--';
  return SHORT_DAY_FORMATTER.format(date);
};

const isSameDay = (first, second) => {
  if (!(first instanceof Date) || Number.isNaN(first.getTime())) return false;
  if (!(second instanceof Date) || Number.isNaN(second.getTime())) return false;
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
};

const restoreCachedTargets = () => {
  if (!targetCaloriesEl || !targetWaterEl || !targetWorkoutEl) return;
  try {
    const raw = window.localStorage?.getItem(DASH_TARGET_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    const todayIso = new Date().toISOString().slice(0, 10);
    if (parsed.dateIso !== todayIso) return;
    const calories = Number(parsed.calories || 0);
    const minutes = Number(parsed.workoutMinutes || 0);
    const waterMl = Number(parsed.waterMl || 0);
    if (calories > 0) {
      targetCaloriesEl.textContent = formatCalories(calories);
    }
    targetWorkoutEl.textContent = `${Math.max(0, Math.round(minutes))} mins`;
    targetWaterEl.textContent = formatLiters(waterMl);
    hasCachedTargets = true;
    suppressTargetUpdates = true;
    targetsLoading = false;
  } catch (err) {
    console.warn('Failed to restore cached targets', err);
  }
};

const persistTargetCache = (payload) => {
  try {
    window.localStorage?.setItem(DASH_TARGET_CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to persist target cache', err);
  }
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
  snack: {
    title: 'Snack',
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
let greetingTone = 'returning';
let newUserSubline = null;

function readNewUserWelcome() {
  try {
    const raw = localStorage.getItem(NEW_USER_WELCOME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (err) {
    return null;
  }
}

function consumeNewUserWelcome(email) {
  if (!email) return false;
  const record = readNewUserWelcome();
  if (!record) return false;
  const target = String(email).trim().toLowerCase();
  const stored = record.email ? String(record.email).trim().toLowerCase() : '';
  if (stored && stored !== target) return false;
  localStorage.removeItem(NEW_USER_WELCOME_KEY);
  return true;
}

function pickNewUserSubline() {
  if (!NEW_USER_SUBLINES.length) return '';
  const idx = Math.floor(Math.random() * NEW_USER_SUBLINES.length);
  return NEW_USER_SUBLINES[idx];
}

function getGreetingSubline(dayName) {
  if (greetingTone === 'new') {
    return newUserSubline || 'Welcome to FlexFule. Let’s get started.';
  }
  return `It's ${dayName}. You're one step closer to your goal today!`;
}

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
    if (currentUserId) {
      setNotificationUserKey(currentUserId);
    }
    goalNutritionTarget = readGoalNutritionTarget(currentUserId);
    const activeUserKey = currentUserId ? `user:${currentUserId}` : 'anonymous';
    weekAnchorDate = resolveWeekAnchorDate(user, activeUserKey);
    if (!(weekAnchorDate instanceof Date) || Number.isNaN(weekAnchorDate.getTime())) {
      weekAnchorDate = new Date();
    }
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
    const isNewUserGreeting = consumeNewUserWelcome(user.email);
    greetingTone = isNewUserGreeting ? 'new' : 'returning';
    newUserSubline = isNewUserGreeting ? pickNewUserSubline() : null;
    if (greetingPrefix) {
      greetingPrefix.textContent = isNewUserGreeting ? 'Welcome,' : 'Welcome back,';
    }
    if (profile.goal) {
      userGoalEl.textContent = `Goal: ${profile.goal}`;
    }
    profileContext = { ...profile };
    updateTargets(profileContext);
    void fetchTodayTarget();
    void loadWorkoutActivitySummary();
    updateDatePickerBounds();
    setSelectedDate(resolveActivePlanDate(activeUserKey, new Date()));
    scheduleMealRollover();
    if (window.FFStreak) {
      renderStreakSummary(window.FFStreak.getSummary());
    }

    const bootstrapSyncTasks = [
      syncWeekAnchorFromServer(user, activeUserKey).then((anchor) => {
        if (anchor instanceof Date && !Number.isNaN(anchor.getTime())) {
          weekAnchorDate = anchor;
        }
      }),
      syncNotificationPrefsFromServer(),
      syncNotificationFeedFromServer(),
      syncActiveDayFromServer(activeUserKey),
      syncMealCompletionsFromServer(activeUserKey),
      syncWorkoutCompletionsFromServer(activeUserKey),
      syncHabitLogsFromServer(),
      syncDailyCheckinStateFromServer(activeUserKey),
      syncAchievementState(activeUserKey)
    ];
    void Promise.allSettled(bootstrapSyncTasks).then(() => {
      setSelectedDate(resolveActivePlanDate(activeUserKey, new Date()));
      updateWeeklyGoalsForSelectedDate();
      updateMealSummaryForSelectedDate();
      maybeCreateMissedWorkoutReminder();
      maybeCreateMissingMealReminder();
      // Show daily check-in prompt once per day after sync.
      maybeShowDailyCheckinPrompt();
    });

    void maybeSendWeeklyReport(user);
    void maybeCreateGoalAchievements(user);
  } catch (err) {
    console.error(err);
    window.location.href = 'login.html';
  }
}

async function fetchTodayTarget() {
  try {
    const res = await fetch('/api/today-target');
    if (!res.ok) return;
    const data = await res.json();
    todayTargetData = data?.target || null;
  } catch (err) {
    console.warn('Failed to fetch today target', err);
  } finally {
    if (!hasCachedTargets) {
      suppressTargetUpdates = false;
    }
    targetsLoading = false;
    if (!hasCachedTargets) {
      updateDailyTargetsForSelectedDate(selectedDate);
    }
  }
}

const DAILY_CHECKIN_STORAGE_KEY = 'flexfule.daily-checkin';

const fetchDailyCheckinFromServer = async () => {
  if (!currentUserId) return null;
  try {
    const res = await fetch('/api/daily-checkin');
    if (!res.ok) return null;
    const data = await res.json();
    return data?.last_checkin_date || null;
  } catch (err) {
    console.warn('Failed to load daily check-in state', err);
    return null;
  }
};

const persistDailyCheckinToServer = async (dateIso) => {
  if (!currentUserId || !dateIso) return;
  try {
    await fetch('/api/daily-checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ last_checkin_date: dateIso })
    });
  } catch (err) {
    console.warn('Failed to save daily check-in state', err);
  }
};

const syncDailyCheckinStateFromServer = async (userKey) => {
  const localKey = `${DAILY_CHECKIN_STORAGE_KEY}.${userKey}`;
  const localValue = localStorage.getItem(localKey);
  const serverValue = await fetchDailyCheckinFromServer();
  const candidates = [localValue, serverValue].filter(Boolean).sort();
  if (!candidates.length) return null;
  const latest = candidates[candidates.length - 1];
  if (latest) {
    localStorage.setItem(localKey, latest);
    if (serverValue !== latest) {
      await persistDailyCheckinToServer(latest);
    }
  }
  return latest;
};

function maybeShowDailyCheckinPrompt() {
  const today = new Date().toISOString().split('T')[0];
  const userKey = currentUserId ? `user:${currentUserId}` : 'anonymous';
  const storageKey = `${DAILY_CHECKIN_STORAGE_KEY}.${userKey}`;
  const lastShown = localStorage.getItem(storageKey);
  if (lastShown === today) return;
  localStorage.setItem(storageKey, today);
  persistDailyCheckinToServer(today);
  setTimeout(() => {
    showDailyCheckinPrompt();
  }, 1200);
}

function showDailyCheckinPrompt() {
  let popup = document.getElementById('dailyCheckinOverlay');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'dailyCheckinOverlay';
    popup.className = 'daily-checkin-overlay';
    popup.innerHTML = `
      <div class="daily-checkin-card">
        <button class="daily-checkin-close" id="dailyCheckinClose">&times;</button>
        <h2>Daily Check‑In</h2>
        <p>Take a quick moment to check in and stay consistent with your plan.</p>
        <div class="daily-checkin-actions">
          <button class="daily-checkin-skip" id="dailyCheckinSkip">Not now</button>
          <button class="daily-checkin-start" id="dailyCheckinStart">Start Check‑In</button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);

    if (!document.getElementById('dailyCheckinStyles')) {
      const style = document.createElement('style');
      style.id = 'dailyCheckinStyles';
      style.textContent = `
        .daily-checkin-overlay {
          position: fixed;
          inset: 0;
          background: rgba(8, 12, 18, 0.78);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(4px);
        }
        .daily-checkin-overlay.show {
          display: flex;
        }
        .daily-checkin-card {
          background: linear-gradient(180deg, #1b2636, #121a26);
          border-radius: 22px;
          padding: 30px;
          max-width: 420px;
          width: 90%;
          border: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
        }
        .daily-checkin-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: transparent;
          border: none;
          color: #9aa7c2;
          font-size: 26px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .daily-checkin-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #f3f3f3;
        }
        .daily-checkin-card h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #f3f3f3;
        }
        .daily-checkin-card p {
          font-size: 14px;
          color: #9aa7c2;
          margin: 0 0 24px 0;
        }
        .daily-checkin-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }
        .daily-checkin-skip {
          padding: 10px 16px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #cbd5f1;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .daily-checkin-skip:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .daily-checkin-start {
          padding: 10px 18px;
          background: #4cd964;
          border: none;
          border-radius: 12px;
          color: #0f0f0f;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .daily-checkin-start:hover {
          background: #3dc954;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(76, 217, 100, 0.35);
        }
      `;
      document.head.appendChild(style);
    }

    const closeBtn = popup.querySelector('#dailyCheckinClose');
    const skipBtn = popup.querySelector('#dailyCheckinSkip');
    const startBtn = popup.querySelector('#dailyCheckinStart');
    const closePopup = () => popup.classList.remove('show');

    closeBtn?.addEventListener('click', closePopup);
    skipBtn?.addEventListener('click', closePopup);
    startBtn?.addEventListener('click', () => {
      closePopup();
      window.location.href = 'goals.html';
    });

    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        closePopup();
      }
    });
  }

  popup.classList.add('show');
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
    greetingSub.textContent = getGreetingSubline(dayName);
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
    const activity = Number(barEl.dataset.activity || 0);
    const status = barEl.dataset.status || '';
    goalTooltip.querySelector('.goal-tooltip-day').textContent = day;
    goalTooltip.querySelector('.goal-tooltip-minutes').textContent = `Activity ${Math.round(activity)}%`;
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
  const minutesSeries = [];
  const completionBucket = getWorkoutCompletionBucket();

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
    const isFuture = iso > todayIso;
    let activityScore = 0;
    if (!isFuture) {
      const caloriesBurned = Number(dayTotals.totalCalories || 0);
      const planDetails = getDailyPlanForDate(date);
      const plannedMinutes =
        estimateWorkoutMinutesFromWorkout(planDetails?.workout || null, null) || targetMinutes || 45;
      const loggedWorkout = Boolean(completionBucket?.[iso]?.logged);
      const workoutMinutes =
        caloriesBurned > 0 ? Math.max(0, Math.round(caloriesBurned / CALORIES_PER_MINUTE_ESTIMATE)) : 0;
      const workoutRatio = loggedWorkout
        ? 1
        : plannedMinutes > 0
        ? Math.min(workoutMinutes / plannedMinutes, 1)
        : 0;
      const mealRatio = getMealCompletionRatio(iso);
      const otherRatio = 0;
      activityScore = Math.min(workoutRatio * 0.6 + mealRatio * 0.4 + otherRatio, 1);
    }
    const ratio = activityScore;
    minutesSeries[index] = isFuture ? null : activityScore;

    barEl.dataset.day = FULL_DATE_FORMATTER.format(date);
    barEl.dataset.activity = Math.round(activityScore * 100).toString();
    let status = '';
    if (isFuture) {
      status = 'Upcoming';
    } else if (activityScore >= 0.75) {
      status = 'High activity';
    } else if (activityScore > 0) {
      status = 'Low activity';
    } else {
      status = 'No activity';
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

  if (goalTrendLine || goalTrendArea) {
    const points = weekDates.map((_, idx) =>
      minutesSeries[idx] == null ? null : Math.max(0, Number(minutesSeries[idx]) || 0)
    );
    const width = 300;
    const height = 80;
    const paddingTop = 8;
    const paddingBottom = 10;
    const usableHeight = height - paddingTop - paddingBottom;
    const lastIndex = points.reduce((acc, value, idx) => (value != null ? idx : acc), -1);
    const maxValue = Math.max(1, ...points.filter((value) => value != null));
    const stepX = points.length > 1 ? width / (points.length - 1) : width;
    const linePoints = points
      .map((value, idx) => ({ value, idx }))
      .filter((entry) => entry.value != null && entry.idx <= lastIndex)
      .map(({ value, idx }) => {
      const x = idx * stepX;
      const normalized = maxValue > 0 ? Math.min(value / maxValue, 1) : 0;
      const y = height - paddingBottom - normalized * usableHeight;
      return { x, y };
    });

    const linePath = linePoints.length
      ? linePoints
      .map((point, idx) => `${idx === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
      .join(' ')
      : `M0 ${(height - paddingBottom).toFixed(1)}`;
    const endX = linePoints.length ? linePoints[linePoints.length - 1].x : 0;
    const areaPath = `${linePath} L${endX.toFixed(1)} ${height} L0 ${height} Z`;

    if (goalTrendLine) {
      goalTrendLine.setAttribute('d', linePath);
    }
    if (goalTrendArea) {
      goalTrendArea.setAttribute('d', areaPath);
    }
  }
}

function updateMealSummaryForSelectedDate() {
  if (!mealSegments.length && !mealLegendItems.length) return;
  const dateIso = toISODate(selectedDate);
  const cachedPlan = getCachedMealPlanForDate(dateIso);
  const planDetails = cachedPlan ? null : getDailyPlanForDate(selectedDate);
  const mealPlan = cachedPlan?.meals || planDetails?.meals?.meals;
  const order = ['breakfast', 'lunch', 'snack', 'dinner'];
  const summary = {};
  const normalizeMealKey = (value) => {
    const lower = String(value || '').toLowerCase();
    if (lower.includes('breakfast')) return 'breakfast';
    if (lower.includes('lunch')) return 'lunch';
    if (lower.includes('snack')) return 'snack';
    if (lower.includes('dinner')) return 'dinner';
    return lower;
  };
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
      if (meal?.removed) return;
      const key = normalizeMealKey(meal.type || meal.label || '');
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
  const hydrationTarget = weight ? Math.round(weight * 35) : DEFAULT_HYDRATION_BASE_ML; // ml heuristic
  const calorieTarget = weight ? Math.round(weight * 7) : 400;
  fallbackNutritionTarget = weight ? Math.round(weight * 30) : DEFAULT_NUTRITION_TARGET;
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
  setTargetPlaceholders();
  restoreCachedTargets();
  setupNotificationPopover();
  setDayActiveFn = setupDayPicker();
  renderDayPicker();
  applyDateContext(setDayActiveFn);
  datePickerInput?.addEventListener('change', (event) => {
    if (event.target.value) {
      setSelectedDate(event.target.value);
    }
  });
  setupSidebarNav();
  handleHamburgerToggle();
  requestAnimationFrame(() => document.body.classList.remove('sidebar-init'));
  setupThemeToggle();
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

const getWeekAnchorStorageKey = (userKey) => `${WEEK_ANCHOR_STORAGE_KEY}.${userKey || 'anonymous'}`;

const readWeekAnchor = (userKey) => {
  try {
    const raw = window.localStorage?.getItem(getWeekAnchorStorageKey(userKey));
    return raw ? parseISODate(raw) : null;
  } catch (err) {
    return null;
  }
};

const writeWeekAnchor = (userKey, date) => {
  const iso = toISODate(date);
  if (!iso) return;
  try {
    window.localStorage?.setItem(getWeekAnchorStorageKey(userKey), iso);
  } catch (err) {
    /* ignore storage errors */
  }
};

const resolveWeekAnchorDate = (user, userKey) => {
  const stored = readWeekAnchor(userKey);
  const created = parseISODate(user?.created_at || user?.createdAt);
  let anchor = stored || created || new Date();
  if (stored && created && created < stored) {
    anchor = created;
    writeWeekAnchor(userKey, created);
  } else if (!stored && anchor) {
    writeWeekAnchor(userKey, anchor);
  }
  return anchor;
};

const fetchWeekAnchorFromServer = async () => {
  if (!currentUserId) return null;
  try {
    const res = await fetch('/api/week-anchor');
    if (!res.ok) return null;
    const data = await res.json();
    return parseISODate(data?.anchor_date);
  } catch (err) {
    console.warn('Failed to load week anchor from server', err);
    return null;
  }
};

const syncWeekAnchorFromServer = async (user, userKey) => {
  const localAnchor = readWeekAnchor(userKey);
  const createdAnchor = parseISODate(user?.created_at || user?.createdAt);
  const serverAnchor = await fetchWeekAnchorFromServer();
  const today = new Date();
  const candidates = [localAnchor, serverAnchor, createdAnchor].filter(
    (date) => date instanceof Date && !Number.isNaN(date.getTime())
  );

  let anchor = candidates.length
    ? candidates.reduce((min, date) => (date < min ? date : min), candidates[0])
    : today;

  if (anchor > today) anchor = today;
  writeWeekAnchor(userKey, anchor);

  if (currentUserId) {
    const serverIso = serverAnchor ? toISODate(serverAnchor) : null;
    const anchorIso = toISODate(anchor);
    if (anchorIso && (!serverIso || anchorIso < serverIso)) {
      try {
        await fetch('/api/week-anchor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ anchor_date: anchorIso })
        });
      } catch (err) {
        console.warn('Failed to sync week anchor to server', err);
      }
    }
  }

  return anchor;
};

const getWeekStartDate = (date) => {
  const base = date instanceof Date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : new Date();
  const day = base.getDay(); // 0 = Sun
  const diff = (day + 6) % 7; // Monday start
  base.setDate(base.getDate() - diff);
  return base;
};

const getWeekRange = (date, anchorDate = weekAnchorDate) => {
  const base = date instanceof Date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : new Date();
  if (!(anchorDate instanceof Date) || Number.isNaN(anchorDate.getTime())) {
    const start = getWeekStartDate(base);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return { start, end };
  }
  const anchor = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((base.getTime() - anchor.getTime()) / msPerDay);
  const weekIndex = Math.floor(diffDays / 7);
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + weekIndex * 7);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start, end };
};

const readHabitState = (userId) => {
  const key = `flexfule.goals.habits.${userId || 'anonymous'}`;
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : { sleep: {}, nosugar: {}, water: {} };
  } catch (err) {
    return { sleep: {}, nosugar: {}, water: {} };
  }
};

const writeHabitState = (userId, state) => {
  const key = `flexfule.goals.habits.${userId || 'anonymous'}`;
  try {
    localStorage.setItem(key, JSON.stringify(state || { sleep: {}, nosugar: {}, water: {} }));
  } catch (err) {
    console.warn('Failed to persist habit state', err);
  }
};

const syncHabitLogsFromServer = async () => {
  if (!currentUserId) return;
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90);
  const startIso = toISODate(start);
  const endIso = toISODate(today);
  try {
    const res = await fetch(`/api/habit-logs?start=${startIso}&end=${endIso}`);
    if (!res.ok) return;
    const data = await res.json();
    const entries = Array.isArray(data?.entries) ? data.entries : [];
    const habitState = readHabitState(currentUserId);

    entries.forEach((entry) => {
      const date = entry?.habit_date;
      const key = entry?.habit_key;
      if (!date || !key) return;
      if (!habitState[key]) habitState[key] = {};
      if (key === 'nosugar') {
        habitState[key][date] = Boolean(entry?.status);
      } else {
        const value = Number(entry?.value);
        if (Number.isFinite(value)) habitState[key][date] = value;
      }
    });

    writeHabitState(currentUserId, habitState);

    const localEntries = [];
    Object.entries(habitState || {}).forEach(([habitKey, dates]) => {
      if (!dates || typeof dates !== 'object') return;
      Object.entries(dates).forEach(([date, value]) => {
        if (!date) return;
        if (habitKey === 'nosugar') {
          localEntries.push({ habit_date: date, habit_key: habitKey, status: Boolean(value) });
        } else {
          const numeric = Number(value);
          if (Number.isFinite(numeric)) {
            localEntries.push({ habit_date: date, habit_key: habitKey, value: numeric });
          }
        }
      });
    });

    if (localEntries.length) {
      await fetch('/api/habit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: localEntries })
      });
    }
  } catch (err) {
    console.warn('Failed to sync habit logs', err);
  }
};

const getWeeklyHabitSummary = (userId, startDate) => {
  const habitState = readHabitState(userId);
  const totalDays = 7;
  let proteinDays = 0;
  let sleepDays = 0;
  let noSugarDays = 0;
  let waterDays = 0;
  const waterTarget = Number.isFinite(hydrationTargetBaseMl) && hydrationTargetBaseMl > 0
    ? hydrationTargetBaseMl
    : DEFAULT_HYDRATION_BASE_ML;

  for (let i = 0; i < totalDays; i += 1) {
    const day = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const iso = toISODate(day);
    if (!iso) continue;
    const mealRatio = getMealCompletionRatio(iso);
    if (mealRatio >= 0.8) proteinDays += 1;
    if (Number(habitState.sleep?.[iso]) >= 8) sleepDays += 1;
    if (habitState.nosugar?.[iso] === true) noSugarDays += 1;
    const waterAmount = Number(habitState.water?.[iso] || 0);
    if (waterAmount >= waterTarget) waterDays += 1;
  }

  return {
    totalDays,
    proteinDays,
    sleepDays,
    noSugarDays,
    waterDays
  };
};

const fetchWeeklyReportStateFromServer = async () => {
  if (!currentUserId) return null;
  try {
    const res = await fetch('/api/weekly-report-state');
    if (!res.ok) return null;
    const data = await res.json();
    return data?.last_week_start || null;
  } catch (err) {
    console.warn('Failed to load weekly report state', err);
    return null;
  }
};

const persistWeeklyReportStateToServer = async (weekStartIso) => {
  if (!currentUserId || !weekStartIso) return;
  try {
    await fetch('/api/weekly-report-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ last_week_start: weekStartIso })
    });
  } catch (err) {
    console.warn('Failed to save weekly report state', err);
  }
};

const syncWeeklyReportStateFromServer = async (userKey) => {
  const localKey = `${WEEKLY_REPORT_STORAGE_KEY}.${userKey}`;
  const localValue = localStorage.getItem(localKey);
  const serverValue = await fetchWeeklyReportStateFromServer();
  const candidates = [localValue, serverValue].filter(Boolean).sort();
  if (!candidates.length) return null;
  const latest = candidates[candidates.length - 1];
  if (latest) {
    localStorage.setItem(localKey, latest);
    if (serverValue !== latest) {
      await persistWeeklyReportStateToServer(latest);
    }
  }
  return latest;
};

const maybeSendWeeklyReport = async (user) => {
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...(readNotificationPrefs() || {}) };
  if (!prefs.weekly_progress_summary) return;
  if (!user?.email) return;
  const userKey = currentUserId ? `user:${currentUserId}` : 'anonymous';
  await syncWeeklyReportStateFromServer(userKey);
  const { start, end } = getWeekRange(new Date());
  const weekKey = toISODate(start);
  if (!weekKey) return;
  const sentKey = `${WEEKLY_REPORT_STORAGE_KEY}.${userKey}`;
  const lastSent = localStorage.getItem(sentKey);
  if (lastSent === weekKey) return;

  const startIso = weekKey;
  const endIso = toISODate(end);
  const habits = getWeeklyHabitSummary(currentUserId, start);

  let performance = {};
  try {
    const res = await fetch(`/api/workouts/performance-weekly?start=${startIso}&end=${endIso}`);
    if (res.ok) {
      const data = await res.json();
      performance = {
        sessionsCompleted: data.sessionsCompleted || 0,
        totalWatchedMinutes: Number.isFinite(Number(data.totalWatchedSeconds))
          ? Math.round(Number(data.totalWatchedSeconds) / 60)
          : 0,
        percentWatched: data.percentWatched,
        performanceLabel: data.performanceLabel
      };
    }
  } catch (err) {
    console.warn('Failed to load weekly performance summary', err);
  }

  try {
    const res = await fetch('/api/reports/weekly-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekStart: startIso,
        weekEnd: endIso,
        performance,
        habits
      })
    });
    if (res.ok) {
      localStorage.setItem(sentKey, weekKey);
      await persistWeeklyReportStateToServer(weekKey);
    }
  } catch (err) {
    console.warn('Failed to send weekly report email', err);
  }
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

const getWeekDates = (date) => {
  const { start } = getWeekRange(date);
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

function computeHydrationTargetMl(caloriesBurned = 0, calorieTarget = 0, workoutMinutes = 0) {
  const base =
    Number.isFinite(hydrationTargetBaseMl) && hydrationTargetBaseMl > 0
      ? hydrationTargetBaseMl
      : DEFAULT_HYDRATION_BASE_ML;
  const activityBonus = caloriesBurned > 0 ? Math.round((caloriesBurned / 100) * 120) : 0;
  const calorieDriven = calorieTarget > 0 ? Math.round(calorieTarget * WATER_ML_PER_KCAL) : 0;
  const workoutDriven = workoutMinutes > 0 ? Math.round(workoutMinutes * WATER_ML_PER_WORKOUT_MIN) : 0;
  const target = Math.max(base + activityBonus, calorieDriven + workoutDriven, base);
  return Math.min(MAX_HYDRATION_ML, Math.max(MIN_HYDRATION_ML, target));
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
  const isToday = isSameDay(safeDate, new Date());
  if (isToday && targetsLoading) {
    return;
  }
  if (suppressTargetUpdates && isToday && hasCachedTargets) {
    return;
  }
  let caloriesValue = 0;
  let minutesValue = 0;
  let hydrationMl = 0;

  if (todayTargetData && isToday) {
    const targetCalories = Number(todayTargetData.target_kcal || todayTargetData.base_daily_kcal || 0);
    const fallbackCalories = Number(planDetails?.meals?.targetCalories || 0);
    caloriesValue = targetCalories > 0 ? targetCalories : fallbackCalories;
    const viewMinutes = Number(todayTargetData.workout_minutes || 0);
    const planMinutes = estimateWorkoutMinutesFromWorkout(workoutPlan, entry);
    minutesValue = planMinutes > 0 ? planMinutes : viewMinutes;
    if (!caloriesValue) {
      caloriesValue = fallbackNutritionTarget;
    }
    const waterLiters = Number(todayTargetData.water_liters || 0);
    const apiHydrationMl = Number.isFinite(waterLiters) && waterLiters > 0 ? Math.round(waterLiters * 1000) : 0;
    const activityBurn = Math.max(
      0,
      Math.round(
        dayTotals.totalCalories ||
          Number(workoutPlan?.burn || 0) ||
          (minutesValue > 0 ? minutesValue * CALORIES_PER_MINUTE_ESTIMATE : 0)
      )
    );
    const computedHydrationMl = computeHydrationTargetMl(activityBurn, caloriesValue, minutesValue);
    hydrationMl = Math.max(apiHydrationMl, computedHydrationMl);
  } else {
    const mealTarget = Number(planDetails?.meals?.targetCalories || 0);
    const nutritionTarget = goalNutritionTarget > 0 ? goalNutritionTarget : mealTarget;
    const resolvedNutritionTarget = nutritionTarget > 0 ? nutritionTarget : fallbackNutritionTarget;
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
    caloriesValue = resolvedNutritionTarget > 0 ? resolvedNutritionTarget : plannedBurn;
    minutesValue = estimateWorkoutMinutesFromWorkout(workoutPlan, entry);
    const activityBurn = dayTotals.totalCalories > 0 ? dayTotals.totalCalories : plannedBurn;
    hydrationMl = computeHydrationTargetMl(activityBurn, caloriesValue, minutesValue);
  }

  if (Number.isFinite(caloriesValue) && caloriesValue > 0) {
    targetCaloriesEl.textContent = formatCalories(caloriesValue);
  }
  targetWorkoutEl.textContent = `${Math.max(0, Math.round(minutesValue || 0))} mins`;
  targetWaterEl.textContent = formatLiters(hydrationMl || 0);

  if (isToday && (todayTargetData || planDetails?.meals?.targetCalories)) {
    persistTargetCache({
      dateIso: new Date().toISOString().slice(0, 10),
      calories: Math.max(0, Math.round(caloriesValue || 0)),
      workoutMinutes: Math.max(0, Math.round(minutesValue || 0)),
      waterMl: Math.max(0, Math.round(hydrationMl || 0))
    });
  }
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
