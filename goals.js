// Goals Page JavaScript

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
const logoutBtn = document.getElementById('logoutBtn');
const userNameEl = document.getElementById('userName');
const userAvatarEl = document.getElementById('userAvatar');
const userGoalEl = document.getElementById('userGoal');

const addGoalBtn = document.getElementById('addGoalBtn');
const editGoalsBtn = document.getElementById('editGoalsBtn');
const logWeightBtn = document.getElementById('logWeightBtn');
const updateMeasurementsBtn = document.getElementById('updateMeasurementsBtn');
const addStrengthBtn = document.getElementById('addStrengthBtn');

const bodyCompositionCanvas = document.getElementById('bodyCompositionChart');
const startWeightEl = document.getElementById('startWeight');
const currentWeightEl = document.getElementById('currentWeight');
const targetWeightEl = document.getElementById('targetWeight');
const projectedDateEl = document.getElementById('projectedDate');

const measurementsListEl = document.getElementById('measurementsList');

const benchTargetEl = document.getElementById('benchTarget');
const benchCurrentEl = document.getElementById('benchCurrent');
const benchProgressEl = document.getElementById('benchProgress');
const runTargetEl = document.getElementById('runTarget');
const runBestEl = document.getElementById('runBest');
const runProgressEl = document.getElementById('runProgress');
const benchRow = document.querySelector('.milestone-row[data-milestone="bench"]');
const runRow = document.querySelector('.milestone-row[data-milestone="run"]');
const milestoneEmpty = document.getElementById('milestoneEmpty');
const milestoneList = document.getElementById('milestoneList');

const habitTiles = Array.from(document.querySelectorAll('.habit-tile'));
const habitFootnote = document.getElementById('habitFootnote');
const openCheckinBtn = document.getElementById('openCheckinBtn');
const calendarPrev = document.getElementById('calendarPrev');
const calendarNext = document.getElementById('calendarNext');
const calendarMonthEl = document.getElementById('calendarMonth');
const consistencyCalendarEl = document.getElementById('consistencyCalendar');

const photoCompare = document.getElementById('photoCompare');
const photoSlider = photoCompare?.querySelector('.photo-slider');
const photoStrip = document.getElementById('photoStrip');
const photoUploadForm = document.getElementById('photoUploadForm');
const photoFileInput = document.getElementById('photoFileInput');
const photoDateInput = document.getElementById('photoDateInput');
const photoViewInput = document.getElementById('photoViewInput');
const photoNotesInput = document.getElementById('photoNotesInput');
const photoPreview = document.getElementById('photoPreview');
const photoPreviewImage = document.getElementById('photoPreviewImage');
const photoPreviewLabel = document.getElementById('photoPreviewLabel');
const photoDropzone = document.getElementById('photoDropzone');
const photoBeforeSelect = document.getElementById('photoBeforeSelect');
const photoAfterSelect = document.getElementById('photoAfterSelect');
const photoSwapBtn = document.getElementById('swapPhotoBtn');
const openPhotoUploadBtn = document.getElementById('openPhotoUploadBtn');
const photoBeforeDrop = document.getElementById('photoBeforeDrop');
const photoAfterDrop = document.getElementById('photoAfterDrop');
const photoBeforeThumb = document.getElementById('photoBeforeThumb');
const photoAfterThumb = document.getElementById('photoAfterThumb');
const photoBeforeMeta = document.getElementById('photoBeforeMeta');
const photoAfterMeta = document.getElementById('photoAfterMeta');
const analysisDaysEl = document.getElementById('analysisDays');
const analysisWeightEl = document.getElementById('analysisWeight');
const analysisRateEl = document.getElementById('analysisRate');
const analysisViewsEl = document.getElementById('analysisViews');
const analysisNotesEl = document.getElementById('analysisNotes');

const nutritionModeButtons = Array.from(document.querySelectorAll('.mode-btn'));
const calorieRange = document.getElementById('calorieRange');
const calorieValueEl = document.getElementById('calorieValue');
const macroRows = Array.from(document.querySelectorAll('.macro-row'));
const hydrationStatusEl = document.getElementById('hydrationStatus');

const goalSetupModal = document.getElementById('goalSetupModal');
const goalSetupClose = document.getElementById('goalSetupClose');
const goalSetupForm = document.getElementById('goalSetupForm');
const goalFocusInput = document.getElementById('goalFocusInput');
const goalTargetWeightInput = document.getElementById('goalTargetWeightInput');
const benchTargetInput = document.getElementById('benchTargetInput');
const runTargetInput = document.getElementById('runTargetInput');
const runBestInput = document.getElementById('runBestInput');
const goalCaloriesInput = document.getElementById('goalCaloriesInput');
const goalProteinInput = document.getElementById('goalProteinInput');
const goalCarbsInput = document.getElementById('goalCarbsInput');
const goalFatInput = document.getElementById('goalFatInput');

const weightModal = document.getElementById('weightModal');
const weightModalClose = document.getElementById('weightModalClose');
const weightForm = document.getElementById('weightForm');
const currentWeightInput = document.getElementById('currentWeightInput');

const measurementModal = document.getElementById('measurementModal');
const measurementModalClose = document.getElementById('measurementModalClose');
const measurementForm = document.getElementById('measurementForm');

const strengthModal = document.getElementById('strengthModal');
const strengthModalClose = document.getElementById('strengthModalClose');
const strengthForm = document.getElementById('strengthForm');
const exerciseSelect = document.getElementById('exerciseName');
const exerciseOther = document.getElementById('exerciseNameOther');

const checkinModal = document.getElementById('checkinModal');
const checkinModalClose = document.getElementById('checkinModalClose');
const checkinForm = document.getElementById('checkinForm');
const checkinWaterInput = document.getElementById('checkinWater');
const checkinSleepInput = document.getElementById('checkinSleep');
const checkinToggleButtons = Array.from(document.querySelectorAll('[data-toggle="sugar"]'));

const STORAGE_PREFIX = 'flexfule.goals';
const THEME_KEY = 'flexfule-theme';
const STREAK_STORAGE_KEY = 'flexfuel.streaks.v1';
const PHOTO_MAX_SIZE = 4 * 1024 * 1024;
const DEFAULT_PHOTO_JOURNAL = [];

let currentUserId = null;
let currentProfile = {};
let weightLogs = [];
let milestoneTargets = {
  targetWeight: null,
  benchTarget: null,
  runTarget: null,
  runBest: null
};
let nutritionState = {
  mode: 'maintain',
  calories: 2200,
  macros: {
    protein: 180,
    carbs: 200,
    fat: 70
  }
};
let habitState = { sleep: {}, nosugar: {}, water: {} };
let streakSummary = null;
let benchCurrentValue = null;
let hasStrengthPrs = false;
let waterIntakeToday = 0;
let waterTargetToday = 0;
let calendarViewDate = new Date();
let checkinPromptState = {};
let checkinCompletionState = {};
let mealPlanCache = { start: null, end: null, mealsByDate: {} };
let photoJournalEntries = [];
let photoJournalSelection = { beforeId: null, afterId: null };
let pendingPhotoDataUrl = '';
let pendingPhotoName = '';

const toISODate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseISODate = (value) => {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const storageKey = (suffix) => `${STORAGE_PREFIX}.${suffix}.${currentUserId || 'anonymous'}`;

const readStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (err) {
    console.warn('Failed to read storage', err);
    return fallback;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Failed to write storage', err);
  }
};

const parseNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const formatNumber = (value, suffix) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  const formatted = Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, '');
  return suffix ? `${formatted}${suffix}` : formatted;
};

const formatSignedNumber = (value, suffix) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  const sign = num > 0 ? '+' : '';
  const formatted = Number.isInteger(num) ? String(num) : num.toFixed(1).replace(/\.0$/, '');
  return `${sign}${formatted}${suffix || ''}`;
};

const showPromptAlert = (message, options = {}) => {
  if (window.FFPrompt?.alert) {
    return window.FFPrompt.showPromptAlert(message, options);
  }
  window.showPromptAlert(message);
  return Promise.resolve();
};

const showPromptConfirm = (message, options = {}) => {
  if (window.FFPrompt?.confirm) {
    return window.FFPrompt.confirm(message, options);
  }
  return Promise.resolve(window.confirm(message));
};

const formatDateLabel = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 'TBD';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

document.addEventListener('DOMContentLoaded', async () => {
  setupSidebar();
  setupThemeToggle();
  setupGoalSetupModal();
  setupWeightModal();
  setupMeasurementModal();
  setupStrengthModal();
  setupHabitInteractions();
  setupCalendarControls();
  setupCheckinModal();
  setupPhotoCompare();
  setupPhotoJournal();
  setupNutritionControls();

  await fetchCurrentUser();
  hydrateState();
  await loadGoalsData();

  window.addEventListener('resize', () => {
    renderBodyComposition();
  });
});

function setupSidebar() {
  if (hamburgerMenu) {
    hamburgerMenu.addEventListener('click', () => {
      sidebar?.classList.toggle('collapsed');
      sections?.classList.toggle('collapsed');
      hamburgerMenu.classList.toggle('active');
      const isExpanded = !sidebar?.classList.contains('collapsed');
      hamburgerMenu.setAttribute('aria-expanded', String(isExpanded));
      try {
        localStorage.setItem('flexfule-sidebar-state', isExpanded ? 'expanded' : 'collapsed');
        document.body.classList.toggle('sidebar-collapsed', !isExpanded);
      } catch (err) {
        console.warn('Failed to save sidebar state', err);
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      sidebar?.classList.add('hidden');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/logout', { method: 'POST' });
        if (res.ok) {
          window.location.href = 'login.html';
        } else {
          console.error('Logout failed');
        }
      } catch (err) {
        console.error('Logout error', err);
        window.location.href = 'login.html';
      }
    });
  }
}

function setupThemeToggle() {
  if (!themeToggle) return;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  const applyTheme = (mode) => {
    const isLight = mode === 'light';
    document.body.classList.toggle('dark-mode', isLight);
    themeToggle.classList.toggle('dark-mode', isLight);
    themeToggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
  };

  const storedTheme = localStorage.getItem(THEME_KEY);
  const initialTheme = storedTheme || (prefersDark.matches ? 'dark' : 'light');
  applyTheme(initialTheme);

  themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    applyTheme(nextTheme);
  });
}

async function fetchCurrentUser() {
  try {
    const res = await fetch('/api/me');
    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }
    if (!res.ok) throw new Error('Failed to load profile');

    const data = await res.json();
    const user = data.user || {};
    currentUserId = user.id || null;

    const profile = user.profile || {};
    if (!profile.goal && user.goal) {
      profile.goal = user.goal;
    }
    currentProfile = { ...profile };
    const name = user.name || 'Athlete';

    if (userAvatarEl) {
      const src = profile?.avatar_url || 'images/user.png';
      userAvatarEl.src = src;
      userAvatarEl.alt = `${name}'s avatar`;
    }

    if (userNameEl) userNameEl.textContent = name;
    if (userGoalEl && profile.goal) {
      userGoalEl.textContent = `Goal: ${profile.goal}`;
    }

    if (window.FFStreak) {
      streakSummary = window.FFStreak.init(user.id || null);
    }
  } catch (err) {
    console.error(err);
  }
}

function hydrateState() {
  weightLogs = readStorage(storageKey('weight-log'), []);
  habitState = readStorage(storageKey('habits'), { sleep: {}, nosugar: {}, water: {} });
  if (!habitState.water) habitState.water = {};
  checkinPromptState = readStorage(storageKey('checkin-prompt'), {});
  checkinCompletionState = readStorage(storageKey('checkin-complete'), {});

  const storedMilestones = readStorage(storageKey('milestones'), {});
  milestoneTargets = {
    ...milestoneTargets,
    ...storedMilestones
  };

  const defaults = getDefaultNutrition();
  const storedNutrition = readStorage(storageKey('nutrition'), null);
  if (storedNutrition) {
    nutritionState = {
      ...defaults,
      ...storedNutrition,
      macros: {
        ...defaults.macros,
        ...(storedNutrition.macros || {})
      }
    };
  } else {
    nutritionState = defaults;
  }

  if (currentProfile?.target_weight && !milestoneTargets.targetWeight) {
    milestoneTargets.targetWeight = currentProfile.target_weight;
  }

  hydratePhotoJournal();
}

function getDefaultNutrition() {
  const goal = (currentProfile?.goal || '').toLowerCase();
  let mode = 'maintain';
  if (goal.includes('lose') || goal.includes('fat') || goal.includes('cut')) {
    mode = 'cut';
  } else if (goal.includes('build') || goal.includes('gain') || goal.includes('bulk') || goal.includes('muscle')) {
    mode = 'bulk';
  }

  let calories = 2200;
  let macros = { protein: 180, carbs: 200, fat: 70 };
  const todayIso = toISODate(new Date());

  if (window.FlexPlan && todayIso) {
    try {
      const plan = window.FlexPlan.buildDailyPlans(currentProfile || {}, {
        startDate: new Date(),
        days: 7,
        startDay: 1
      });
      const todayPlan = plan?.mealsByDate?.[todayIso];
      if (todayPlan?.targetCalories) {
        calories = Math.round(todayPlan.targetCalories);
      }
      if (todayPlan?.macroTargets) {
        macros = {
          protein: Math.round(todayPlan.macroTargets.protein || macros.protein),
          carbs: Math.round(todayPlan.macroTargets.carbs || macros.carbs),
          fat: Math.round(todayPlan.macroTargets.fat || macros.fat)
        };
      }
    } catch (err) {
      console.warn('Failed to build nutrition plan', err);
    }
  }

  return { mode, calories, macros };
}

async function loadGoalsData() {
  renderBodyComposition();
  renderHabits();
  renderNutrition();
  renderPerformanceMilestones();
  updateHydrationDisplay();
  renderCalendar();
  renderPhotoJournal();

  await Promise.all([
    loadBodyMeasurements(),
    loadStrengthRecords(),
    loadWaterTarget(),
    loadWaterIntake()
  ]);

  renderHabits();
  renderNutrition();
  renderCalendar();
  maybePromptDailyCheckin();
}

function renderBodyComposition() {
  const sortedLogs = [...weightLogs]
    .filter((entry) => entry && typeof entry.date === 'string' && Number.isFinite(Number(entry.weight)))
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayIso = toISODate(new Date());
  const profileWeight = Number(currentProfile?.weight_kg) || null;
  const targetWeight = milestoneTargets.targetWeight || currentProfile?.target_weight || null;

  let series = sortedLogs;

  if (!series.length && profileWeight) {
    const start = profileWeight + 2;
    series = [
      { date: todayIso, weight: start },
      { date: todayIso, weight: profileWeight }
    ];
  } else if (series.length === 1) {
    const first = series[0];
    const start = first.weight + 1.5;
    series = [
      { date: todayIso, weight: start },
      { date: todayIso, weight: first.weight }
    ];
  }

  const startWeight = series[0]?.weight || profileWeight || null;
  const currentWeight = series[series.length - 1]?.weight || profileWeight || null;

  if (startWeightEl) startWeightEl.textContent = formatNumber(startWeight, 'kg');
  if (currentWeightEl) currentWeightEl.textContent = formatNumber(currentWeight, 'kg');
  if (targetWeightEl) targetWeightEl.textContent = formatNumber(targetWeight, 'kg');

  const projected = estimateProjectedDate(series, targetWeight);
  if (projectedDateEl) {
    projectedDateEl.textContent = projected ? formatDateLabel(projected) : 'TBD';
  }

  drawWeightChart(series, targetWeight);
}

function estimateProjectedDate(series, targetWeight) {
  if (!targetWeight || !series || series.length < 2) return null;
  const first = series[0];
  const last = series[series.length - 1];
  const startDate = new Date(`${first.date}T00:00:00`);
  const endDate = new Date(`${last.date}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
  const days = Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)));
  const delta = Number(last.weight) - Number(first.weight);
  if (!Number.isFinite(delta) || delta === 0) return null;
  const dailyChange = delta / days;
  const remaining = targetWeight - Number(last.weight);
  const projectedDays = remaining / dailyChange;
  if (!Number.isFinite(projectedDays) || projectedDays <= 0) return null;
  const projected = new Date(endDate);
  projected.setDate(projected.getDate() + Math.round(projectedDays));
  return projected;
}

function drawWeightChart(series, targetWeight) {
  if (!bodyCompositionCanvas || !series?.length) return;
  const ctx = bodyCompositionCanvas.getContext('2d');
  if (!ctx) return;

  const rect = bodyCompositionCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  bodyCompositionCanvas.width = rect.width * dpr;
  bodyCompositionCanvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = rect.height;
  ctx.clearRect(0, 0, width, height);

  const weights = series.map((entry) => Number(entry.weight));
  const minWeight = Math.min(...weights, targetWeight || Infinity);
  const maxWeight = Math.max(...weights, targetWeight || -Infinity);
  const padding = Math.max(1, (maxWeight - minWeight) * 0.2);
  const min = minWeight - padding;
  const max = maxWeight + padding;
  const range = max - min || 1;

  const pointFor = (value, index) => {
    const x = (index / (series.length - 1 || 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  };

  ctx.beginPath();
  series.forEach((entry, index) => {
    const point = pointFor(Number(entry.weight), index);
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(76, 217, 100, 0.35)');
  gradient.addColorStop(1, 'rgba(76, 217, 100, 0.03)');

  ctx.strokeStyle = '#4cd964';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  if (targetWeight) {
    const targetY = height - ((targetWeight - min) / range) * height;
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(76, 217, 100, 0.35)';
    ctx.beginPath();
    ctx.moveTo(0, targetY);
    ctx.lineTo(width, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const lastPoint = pointFor(Number(series[series.length - 1].weight), series.length - 1);
  ctx.beginPath();
  ctx.arc(lastPoint.x, lastPoint.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#4cd964';
  ctx.fill();
}

async function loadBodyMeasurements() {
  if (!measurementsListEl) return;
  try {
    const res = await fetch('/api/body-measurements?limit=30');
    if (!res.ok) throw new Error('Failed to load measurements');
    const data = await res.json();
    const measurements = data.measurements || [];

    if (!measurements.length) {
      measurementsListEl.innerHTML = '<p class="empty-state">No measurements yet. Add your first check-in.</p>';
      return;
    }

    const latest = measurements[0];
    const previous = measurements[1] || {};
    const items = [
      { key: 'waist_cm', label: 'Waist' },
      { key: 'chest_cm', label: 'Chest' },
      { key: 'hips_cm', label: 'Hips' },
      { key: 'arms_cm', label: 'Arms' }
    ];

    const rows = items
      .filter((item) => latest[item.key])
      .slice(0, 3)
      .map((item) => {
        const value = Number(latest[item.key]);
        const prev = Number(previous[item.key]) || null;
        const change = prev ? Number((value - prev).toFixed(1)) : 0;
        const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : '';
        const changeText = change > 0 ? `(+${change}cm)` : change < 0 ? `(${change}cm)` : '(0cm)';

        return `
          <div class="measurement-item">
            <div class="measurement-info">
              <span class="measurement-label">${item.label}</span>
              <span class="measurement-value">${value}cm <span class="change ${changeClass}">${changeText}</span></span>
            </div>
          </div>
        `;
      })
      .join('');

    measurementsListEl.innerHTML = rows || '<p class="empty-state">No measurements available.</p>';
  } catch (err) {
    console.error('Failed to load body measurements', err);
  }
}

async function loadStrengthRecords() {
  try {
    const res = await fetch('/api/strength-records');
    if (!res.ok) throw new Error('Failed to load strength records');

    const data = await res.json();
    const prs = data.prs || {};
    hasStrengthPrs = Object.keys(prs).length > 0;
    const bench = prs['Bench Press'];
    benchCurrentValue = bench?.weight_kg ? Number(bench.weight_kg) : null;
    renderPerformanceMilestones();
  } catch (err) {
    console.error('Failed to load strength records', err);
    hasStrengthPrs = false;
    renderPerformanceMilestones();
  }
}


function renderPerformanceMilestones() {
  const benchTargetValue = Number(milestoneTargets.benchTarget);
  const hasBenchTarget = Number.isFinite(benchTargetValue) && benchTargetValue > 0;
  const hasBenchData = Number.isFinite(benchCurrentValue) && benchCurrentValue > 0;
  const runBestValue = Number(milestoneTargets.runBest);
  const hasRunData = Number.isFinite(runBestValue) && runBestValue > 0;
  const hasLoggedPr = hasStrengthPrs;

  if (!hasLoggedPr) {
    if (benchTargetEl) benchTargetEl.textContent = '--';
    if (benchCurrentEl) benchCurrentEl.textContent = '--';
    if (benchProgressEl) benchProgressEl.style.width = '0%';
    if (runTargetEl) runTargetEl.textContent = '--';
    if (runBestEl) runBestEl.textContent = '--';
    if (runProgressEl) runProgressEl.style.width = '0%';
    if (benchRow) benchRow.hidden = true;
    if (runRow) runRow.hidden = true;
    if (milestoneList) milestoneList.hidden = true;
    if (milestoneEmpty) milestoneEmpty.hidden = false;
    return;
  }

  if (benchTargetEl) {
    benchTargetEl.textContent = hasBenchTarget ? formatNumber(benchTargetValue, 'kg') : '--';
  }
  if (benchCurrentEl) {
    benchCurrentEl.textContent = benchCurrentValue ? formatNumber(benchCurrentValue, 'kg') : '--';
  }

  const benchProgress = benchCurrentValue && hasBenchTarget
    ? Math.min(100, Math.round((benchCurrentValue / benchTargetValue) * 100))
    : 0;

  if (benchProgressEl) {
    benchProgressEl.style.width = `${benchProgress}%`;
  }

  if (runTargetEl) {
    runTargetEl.textContent = milestoneTargets.runTarget ? `${milestoneTargets.runTarget}m` : '--';
  }
  if (runBestEl) {
    runBestEl.textContent = milestoneTargets.runBest ? `${milestoneTargets.runBest}m` : '--';
  }

  const runProgress = milestoneTargets.runTarget && milestoneTargets.runBest
    ? Math.min(100, Math.round((milestoneTargets.runTarget / milestoneTargets.runBest) * 100))
    : 0;

  if (runProgressEl) {
    runProgressEl.style.width = `${runProgress}%`;
  }

  const hasMilestoneData = hasBenchData || hasRunData;
  if (benchRow) benchRow.hidden = !hasBenchData;
  if (runRow) runRow.hidden = !hasRunData;
  if (milestoneList) milestoneList.hidden = !hasMilestoneData;
  if (milestoneEmpty) milestoneEmpty.hidden = hasMilestoneData;
}

function getLastSevenDays() {
  const days = [];
  const today = new Date();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    days.push(toISODate(day));
  }
  return days;
}

function getUserKey() {
  if (streakSummary?.userKey) return streakSummary.userKey;
  return currentUserId ? `user:${currentUserId}` : 'anonymous';
}

function getStreakDaysMap() {
  try {
    const raw = localStorage.getItem(STREAK_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const userKey = getUserKey();
    return parsed?.[userKey]?.days || {};
  } catch (err) {
    console.warn('Failed to read streak history', err);
    return {};
  }
}

function getMealCompletionMap() {
  const userKey = getUserKey();
  const completionKey = `flexfuel.meals.completed.${userKey}`;
  try {
    const raw = localStorage.getItem(completionKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.warn('Failed to read meal completion data', err);
    return {};
  }
}

function ensureMealPlanCache(viewDate) {
  if (!window.FlexPlan || !(viewDate instanceof Date)) return;
  const viewIso = toISODate(new Date(viewDate.getFullYear(), viewDate.getMonth(), 15));
  if (mealPlanCache.start && mealPlanCache.end && viewIso >= mealPlanCache.start && viewIso <= mealPlanCache.end) {
    return;
  }

  const startDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  startDate.setDate(startDate.getDate() - 7);
  const days = 70;
  let plan = null;
  try {
    plan = window.FlexPlan.buildDailyPlans(currentProfile || {}, {
      startDate,
      days,
      startDay: 1
    });
  } catch (err) {
    console.warn('Failed to build meal plan cache', err);
  }
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days - 1);
  mealPlanCache = {
    start: toISODate(startDate),
    end: toISODate(endDate),
    mealsByDate: plan?.mealsByDate || {}
  };
}

function getMealCompletionRatioForDate(iso) {
  if (!iso) return 0;
  const completionMap = getMealCompletionMap();
  const completed = completionMap[iso] || [];
  const completedCount = Array.isArray(completed) ? completed.length : 0;

  const dateObj = new Date(`${iso}T00:00:00`);
  if (!Number.isNaN(dateObj.getTime())) {
    ensureMealPlanCache(dateObj);
    const totalMeals = mealPlanCache.mealsByDate?.[iso]?.meals?.length || 0;
    if (totalMeals > 0) {
      return Math.min(1, completedCount / totalMeals);
    }
  }

  if (completedCount) return 1;
  const streakDays = getStreakDaysMap();
  return streakDays[iso]?.meal ? 1 : 0;
}

function getWaterAmountForDate(iso) {
  if (!iso) return 0;
  const todayIso = toISODate(new Date());
  const stored = Number(habitState.water?.[iso]);
  const storedAmount = Number.isFinite(stored) ? stored : 0;
  if (iso === todayIso) {
    const apiAmount = Number.isFinite(waterIntakeToday) ? waterIntakeToday : 0;
    return Math.max(storedAmount, apiAmount);
  }
  return storedAmount;
}

function isHabitGoalMet(habitId, iso) {
  if (habitId === 'protein') {
    return getMealCompletionRatioForDate(iso) >= 0.8;
  }
  if (habitId === 'sleep') {
    return Number(habitState.sleep?.[iso]) >= 8;
  }
  if (habitId === 'nosugar') {
    return habitState.nosugar?.[iso] === true;
  }
  if (habitId === 'water') {
    const amount = getWaterAmountForDate(iso);
    if (!waterTargetToday) return amount > 0;
    return amount >= waterTargetToday;
  }
  return false;
}

function getHabitHistory(habitId, days) {
  if (habitId === 'protein') {
    return days.map((iso) => getMealCompletionRatioForDate(iso) >= 0.8);
  }
  if (habitId === 'sleep') {
    return days.map((iso) => Number.isFinite(Number(habitState.sleep?.[iso])));
  }
  if (habitId === 'nosugar') {
    return days.map((iso) => habitState.nosugar?.[iso] === true);
  }
  if (habitId === 'water') {
    return days.map((iso) => getWaterAmountForDate(iso) > 0);
  }
  return days.map(() => false);
}

function renderHabits() {
  if (!habitTiles.length) return;
  const days = getLastSevenDays();

  habitTiles.forEach((tile) => {
    const habitId = tile.dataset.habit;
    const history = getHabitHistory(habitId, days);

    const count = history.filter(Boolean).length;
    const progress = count / history.length;
    const todayComplete = isHabitGoalMet(habitId, days[days.length - 1]);

    tile.style.setProperty('--progress', progress.toFixed(2));
    tile.classList.toggle('is-complete', Boolean(todayComplete));

    const countEl = tile.querySelector('[data-habit-count]');
    if (countEl) {
      countEl.textContent = `${count}/${history.length}`;
    }
  });

  if (habitFootnote) {
    const streak = streakSummary?.stats?.currentStreak || 0;
    habitFootnote.textContent = streak
      ? `Rings show logged check-ins. Current streak: ${streak} days.`
      : 'Rings show logged check-ins. Tap Daily Check-in to log sleep, sugar, and water.';
  }
}

function setupHabitInteractions() {
  if (!habitTiles.length) return;
  habitTiles.forEach((tile) => {
    tile.addEventListener('click', () => {
      const habitId = tile.dataset.habit;
      if (habitId === 'protein') {
        window.location.href = 'meals.html';
        return;
      }
      openCheckinModal();
    });
  });

  window.addEventListener('flexfule:streak-updated', (event) => {
    streakSummary = event?.detail || streakSummary;
    renderHabits();
    renderNutrition();
    renderCalendar();
  });
}

function setupCalendarControls() {
  if (calendarPrev) {
    calendarPrev.addEventListener('click', () => {
      calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
      renderCalendar();
    });
  }
  if (calendarNext) {
    calendarNext.addEventListener('click', () => {
      calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
      renderCalendar();
    });
  }
}

function renderCalendar() {
  if (!consistencyCalendarEl) return;
  const viewDate = calendarViewDate || new Date();
  ensureMealPlanCache(viewDate);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = monthStart.getDay();
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (calendarMonthEl) {
    calendarMonthEl.textContent = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(monthStart);
  }

  const cells = [];
  dayLabels.forEach((label) => {
    cells.push(`<div class=\"calendar-day-label\">${label}</div>`);
  });

  for (let i = 0; i < startDay; i += 1) {
    cells.push('<div class=\"calendar-day is-empty\"></div>');
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const iso = toISODate(date);
    const status = getDaySystemStatus(iso);
    const tooltip = buildDayTooltip(status);
    cells.push(`
      <div class=\"calendar-day ${status.className}\" title=\"${tooltip}\">
        ${day}
        <span class=\"day-score\">${status.score}/5</span>
      </div>
    `);
  }

  consistencyCalendarEl.innerHTML = cells.join('');
}

function getDaySystemStatus(iso) {
  const streakDays = getStreakDaysMap();
  const streakDay = streakDays[iso] || {};
  const workoutDone = Boolean(streakDay.workout);
  const mealDone = Boolean(streakDay.meal) || getMealCompletionRatioForDate(iso) >= 0.8;
  const sleepHours = Number(habitState.sleep?.[iso]);
  const sleepDone = Number.isFinite(sleepHours) && sleepHours >= 8;
  const sugarEntry = habitState.nosugar?.[iso];
  const nosugarDone = sugarEntry === true;
  const waterAmount = getWaterAmountForDate(iso);
  const waterDone = waterTargetToday ? waterAmount >= waterTargetToday : waterAmount > 0;
  const proteinDone = getMealCompletionRatioForDate(iso) >= 0.8;
  const habitsDone = proteinDone && sleepDone && nosugarDone && waterDone;

  const score = [workoutDone, mealDone, habitsDone].filter(Boolean).length;
  let className = '';
  if (score === 0) {
    className = 'is-empty';
  } else if (score === 1) {
    className = 'hit-low';
  } else if (score === 2) {
    className = 'hit-mid';
  } else {
    className = 'hit-high';
  }

  return {
    score,
    className,
    workoutDone,
    mealDone,
    habitsDone
  };
}

function buildDayTooltip(status) {
  const labels = [
    status.workoutDone ? 'Workout hit' : 'Workout missing',
    status.mealDone ? 'Meals hit' : 'Meals missing',
    status.habitsDone ? 'Habits hit' : 'Habits missing'
  ];
  return labels.join(' | ');
}

function setupCheckinModal() {
  if (openCheckinBtn) {
    openCheckinBtn.addEventListener('click', () => {
      openCheckinModal();
    });
  }

  if (checkinModalClose) {
    checkinModalClose.addEventListener('click', () => {
      closeCheckinModal();
    });
  }

  if (checkinModal) {
    checkinModal.addEventListener('click', (event) => {
      if (event.target === checkinModal) {
        closeCheckinModal();
      }
    });
  }

  checkinToggleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.dataset.value;
      setSugarToggle(value);
    });
  });

  if (checkinForm) {
    checkinForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitBtn = checkinForm.querySelector('.submit-btn');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const todayIso = toISODate(new Date());
        const waterRaw = checkinWaterInput?.value ?? '';
        const waterAmount = parseNumber(waterRaw) || 0;
        const sleepHours = parseNumber(checkinSleepInput?.value);
        const sugarChoice = getActiveSugarChoice();

        if (checkinWaterInput && String(waterRaw).trim() === '') {
          showPromptAlert('Please enter your water intake.');
          return;
        }
        if (sleepHours === null) {
          showPromptAlert('Please enter your sleep hours.');
          return;
        }
        if (!sugarChoice) {
          showPromptAlert('Please select if you had added sugar.');
          return;
        }

        if (sleepHours !== null) {
          habitState.sleep[todayIso] = sleepHours;
        }
        if (sugarChoice) {
          habitState.nosugar[todayIso] = sugarChoice === 'no';
        }
        habitState.water[todayIso] = waterAmount;
        await saveWaterIntake(waterAmount);

        writeStorage(storageKey('habits'), habitState);
        checkinCompletionState[todayIso] = true;
        writeStorage(storageKey('checkin-complete'), checkinCompletionState);

        closeCheckinModal();
        renderHabits();
        renderCalendar();
      } catch (err) {
        console.error('Failed to save check-in', err);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

function openCheckinModal() {
  if (!checkinModal) return;
  const todayIso = toISODate(new Date());
  const existingWater = getWaterAmountForDate(todayIso);
  const existingSleep = habitState.sleep?.[todayIso];
  const existingNoSugar = habitState.nosugar?.[todayIso];

  if (checkinWaterInput) {
    checkinWaterInput.value = Number.isFinite(Number(existingWater)) ? String(existingWater) : '';
  }
  if (checkinSleepInput) {
    checkinSleepInput.value = Number.isFinite(Number(existingSleep)) ? String(existingSleep) : '';
  }
  if (existingNoSugar === true) {
    setSugarToggle('no');
  } else if (existingNoSugar === false) {
    setSugarToggle('yes');
  } else {
    setSugarToggle(null);
  }

  checkinModal.classList.add('show');
}

function closeCheckinModal() {
  if (checkinModal) {
    checkinModal.classList.remove('show');
  }
}

function setSugarToggle(value) {
  checkinToggleButtons.forEach((btn) => {
    const isActive = value && btn.dataset.value === value;
    btn.classList.toggle('is-active', Boolean(isActive));
  });
}

function getActiveSugarChoice() {
  const active = checkinToggleButtons.find((btn) => btn.classList.contains('is-active'));
  return active?.dataset.value || null;
}

function setupPhotoJournal() {
  if (openPhotoUploadBtn && photoFileInput) {
    openPhotoUploadBtn.addEventListener('click', () => {
      photoFileInput.click();
    });
  }

  if (photoDateInput && !photoDateInput.value) {
    photoDateInput.value = toISODate(new Date());
  }

  if (photoFileInput) {
    photoFileInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0] || null;
      handlePhotoFile(file);
    });
  }

  if (photoDropzone) {
    ['dragenter', 'dragover'].forEach((eventName) => {
      photoDropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        photoDropzone.classList.add('is-dragging');
      });
    });
    ['dragleave', 'drop'].forEach((eventName) => {
      photoDropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        photoDropzone.classList.remove('is-dragging');
      });
    });
    photoDropzone.addEventListener('drop', (event) => {
      const file = event.dataTransfer?.files?.[0] || null;
      handlePhotoFile(file);
    });
  }

  if (photoUploadForm) {
    photoUploadForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const dateValue = photoDateInput?.value || '';
      if (!pendingPhotoDataUrl) {
        showPromptAlert('Please upload a photo before saving.');
        return;
      }
      if (!dateValue) {
        showPromptAlert('Please select a date for this check-in.');
        return;
      }

      const entry = {
        id: `photo-${Date.now()}`,
        date: dateValue,
        view: photoViewInput?.value || 'Front',
        notes: photoNotesInput?.value?.trim() || '',
        src: pendingPhotoDataUrl,
        createdAt: Date.now(),
        source: 'upload'
      };

      const previousAfter = photoJournalSelection.afterId;
      photoJournalEntries = [entry, ...photoJournalEntries];

      photoJournalSelection.afterId = entry.id;
      if (!photoJournalSelection.beforeId || photoJournalSelection.beforeId === entry.id) {
        photoJournalSelection.beforeId = previousAfter || entry.id;
      }

      pendingPhotoDataUrl = '';
      pendingPhotoName = '';
      if (photoFileInput) photoFileInput.value = '';
      if (photoNotesInput) photoNotesInput.value = '';
      if (photoDateInput) photoDateInput.value = toISODate(new Date());
      setPhotoPreview('', 'No image selected yet.');

      savePhotoJournal();
      renderPhotoJournal();
    });
  }

  if (photoBeforeSelect) {
    photoBeforeSelect.addEventListener('change', () => {
      photoJournalSelection.beforeId = photoBeforeSelect.value;
      if (photoJournalSelection.beforeId === photoJournalSelection.afterId) {
        photoJournalSelection.afterId = getAlternatePhotoId(photoJournalSelection.beforeId, 'latest');
      }
      savePhotoJournal();
      renderPhotoJournal();
    });
  }

  if (photoAfterSelect) {
    photoAfterSelect.addEventListener('change', () => {
      photoJournalSelection.afterId = photoAfterSelect.value;
      if (photoJournalSelection.afterId === photoJournalSelection.beforeId) {
        photoJournalSelection.beforeId = getAlternatePhotoId(photoJournalSelection.afterId, 'earliest');
      }
      savePhotoJournal();
      renderPhotoJournal();
    });
  }

  if (photoSwapBtn) {
    photoSwapBtn.addEventListener('click', () => {
      const before = photoJournalSelection.beforeId;
      photoJournalSelection.beforeId = photoJournalSelection.afterId;
      photoJournalSelection.afterId = before;
      savePhotoJournal();
      renderPhotoJournal();
    });
  }

  if (photoStrip) {
    photoStrip.addEventListener('click', (event) => {
      const deleteBtn = event.target.closest('.photo-delete');
      if (deleteBtn) {
        const deleteId = deleteBtn.dataset.photoId;
        if (deleteId) {
          deletePhotoEntry(deleteId);
        }
        return;
      }
      const target = event.target.closest('.photo-thumb');
      if (!target) return;
      const photoId = target.dataset.photoId;
      if (!photoId) return;
      if (event.shiftKey) {
        photoJournalSelection.beforeId = photoId;
      } else {
        photoJournalSelection.afterId = photoId;
      }
      savePhotoJournal();
      renderPhotoJournal();
    });

    photoStrip.addEventListener('dragstart', (event) => {
      const target = event.target.closest('.photo-thumb');
      if (!target) return;
      const photoId = target.dataset.photoId;
      if (!photoId || !event.dataTransfer) return;
      event.dataTransfer.setData('text/plain', photoId);
      event.dataTransfer.effectAllowed = 'copy';
      target.classList.add('is-dragging');
    });

    photoStrip.addEventListener('dragend', (event) => {
      const target = event.target.closest('.photo-thumb');
      if (target) target.classList.remove('is-dragging');
    });
  }

  [photoBeforeDrop, photoAfterDrop].filter(Boolean).forEach((target) => {
    ['dragenter', 'dragover'].forEach((eventName) => {
      target.addEventListener(eventName, (event) => {
        event.preventDefault();
        target.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      target.addEventListener(eventName, (event) => {
        event.preventDefault();
        target.classList.remove('is-dragover');
      });
    });

    target.addEventListener('drop', (event) => {
      const photoId = event.dataTransfer?.getData('text/plain');
      if (!photoId) return;
      const role = target.dataset.dropRole || 'after';
      applyPhotoDropSelection(photoId, role);
    });
  });
}

function handlePhotoFile(file) {
  if (!file) return;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const fileType = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();
  const isHeic =
    fileType === 'image/heic' ||
    fileType === 'image/heif' ||
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif');
  const isAllowed =
    allowedTypes.includes(fileType) ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png') ||
    fileName.endsWith('.webp') ||
    fileName.endsWith('.heic') ||
    fileName.endsWith('.heif');

  if (!isAllowed) {
    showPromptAlert('Please select an image file.');
    return;
  }
  if (file.size > PHOTO_MAX_SIZE) {
    showPromptAlert('Please choose a photo under 4MB.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === 'string' ? reader.result : '';
    if (!result) {
      showPromptAlert('Failed to load the image preview.');
      return;
    }
    const probe = new Image();
    probe.onload = () => {
      pendingPhotoDataUrl = result;
      pendingPhotoName = file.name || 'Selected photo';
      setPhotoPreview(pendingPhotoDataUrl, `Ready: ${pendingPhotoName}`);
    };
    probe.onerror = () => {
      if (!isHeic) {
        pendingPhotoDataUrl = '';
        pendingPhotoName = '';
        setPhotoPreview('', 'Preview unavailable. Try JPG/PNG/WEBP.');
        showPromptAlert('This photo format is not supported in your browser. Try JPG, PNG, or WEBP.');
        return;
      }

      pendingPhotoDataUrl = '';
      pendingPhotoName = '';
      setPhotoPreview('', 'Converting HEIC to JPG...');
      void convertHeicToJpeg(result, file.name)
        .then((converted) => {
          if (!converted) return;
          pendingPhotoDataUrl = converted;
          pendingPhotoName = replaceExtension(file.name || 'photo.heic', 'jpg');
          setPhotoPreview(pendingPhotoDataUrl, `Converted: ${pendingPhotoName}`);
        })
        .catch((err) => {
          console.warn('HEIC conversion failed', err);
          pendingPhotoDataUrl = '';
          pendingPhotoName = '';
          setPhotoPreview('', 'HEIC conversion failed. Try JPG/PNG/WEBP.');
          showPromptAlert('HEIC conversion failed. Please try a JPG or PNG.');
        });
    };
    probe.src = result;
  };
  reader.onerror = () => {
    console.warn('Failed to read photo');
    showPromptAlert('Unable to read this photo. Please try another file.');
  };
  reader.readAsDataURL(file);
}

function replaceExtension(name, nextExt) {
  const clean = String(name || 'photo').trim();
  const base = clean.replace(/\.[^/.]+$/, '');
  return `${base}.${nextExt}`;
}

async function convertHeicToJpeg(dataUrl, fileName) {
  try {
    const res = await fetch('/api/convert-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl, filename: fileName || null })
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('HEIC conversion failed', text);
      showPromptAlert('HEIC conversion failed. Please try a JPG or PNG.');
      return '';
    }
    const payload = await res.json();
    if (!payload?.dataUrl) {
      showPromptAlert('HEIC conversion returned an invalid response.');
      return '';
    }
    return payload.dataUrl;
  } catch (err) {
    console.warn('HEIC conversion request failed', err);
    showPromptAlert('Unable to convert HEIC right now. Please try JPG or PNG.');
    return '';
  }
}

function setPhotoPreview(dataUrl, label) {
  if (photoPreview) {
    photoPreview.classList.toggle('has-image', Boolean(dataUrl));
  }
  if (photoPreviewImage) {
    photoPreviewImage.src = dataUrl || '';
  }
  if (photoPreviewLabel) {
    photoPreviewLabel.textContent = label || 'No image selected yet.';
  }
}

function hydratePhotoJournal() {
  const stored = readStorage(storageKey('photo-journal'), null);
  if (stored?.entries && Array.isArray(stored.entries) && stored.entries.length) {
    photoJournalEntries = stored.entries.filter((entry) => entry && entry.id && entry.src && entry.source !== 'default');
    if (stored.selection) {
      photoJournalSelection = {
        ...photoJournalSelection,
        ...stored.selection
      };
    }
  } else {
    photoJournalEntries = [...DEFAULT_PHOTO_JOURNAL];
    photoJournalSelection = {
      beforeId: null,
      afterId: null
    };
  }

  if (ensurePhotoSelection()) {
    savePhotoJournal();
  }
}

function savePhotoJournal() {
  writeStorage(storageKey('photo-journal'), {
    entries: photoJournalEntries,
    selection: photoJournalSelection
  });
}

function renderPhotoJournal() {
  if (!photoStrip) return;

  const hasEntries = Array.isArray(photoJournalEntries) && photoJournalEntries.length > 0;
  if (photoBeforeSelect && photoAfterSelect) {
    photoBeforeSelect.disabled = !hasEntries;
    photoAfterSelect.disabled = !hasEntries;
  }

  if (!hasEntries) {
    photoStrip.innerHTML = '<p class="empty-state">No photos yet. Upload your first check-in.</p>';
    applyPhotoCompareImages('', '');
    updatePhotoDropTargets(null, null);
    updatePhotoAnalysis(null, null);
    return;
  }

  if (ensurePhotoSelection()) {
    savePhotoJournal();
  }

  const sortedEntries = getSortedPhotoEntries();
  if (photoBeforeSelect && photoAfterSelect) {
    const optionMarkup = sortedEntries
      .map((entry) => {
        const label = formatPhotoOption(entry);
        return `<option value="${entry.id}">${label}</option>`;
      })
      .join('');

    photoBeforeSelect.innerHTML = optionMarkup;
    photoAfterSelect.innerHTML = optionMarkup;
    photoBeforeSelect.value = photoJournalSelection.beforeId || sortedEntries[0].id;
    photoAfterSelect.value = photoJournalSelection.afterId || sortedEntries[0].id;
  }

  const beforeEntry = getPhotoEntry(photoJournalSelection.beforeId);
  const afterEntry = getPhotoEntry(photoJournalSelection.afterId);
  applyPhotoCompareImages(beforeEntry?.src || '', afterEntry?.src || '');
  updatePhotoDropTargets(beforeEntry, afterEntry);
  updatePhotoAnalysis(beforeEntry, afterEntry);

  photoStrip.innerHTML = sortedEntries
    .map((entry) => {
      const isBefore = entry.id === photoJournalSelection.beforeId;
      const isAfter = entry.id === photoJournalSelection.afterId;
      const caption = formatPhotoCaption(entry);
      const badges = [
        isBefore ? '<span class="photo-badge before">Before</span>' : '',
        isAfter ? '<span class="photo-badge after">After</span>' : ''
      ].join('');
      const classes = ['photo-thumb'];
      if (isBefore) classes.push('is-before');
      if (isAfter) classes.push('is-after');
      return `
        <figure class="${classes.join(' ')}" data-photo-id="${entry.id}" draggable="true">
          ${badges}
          <button class="photo-delete" type="button" data-photo-id="${entry.id}" aria-label="Delete photo">&times;</button>
          <img src="${entry.src}" alt="${caption}" loading="lazy" />
          <figcaption>${caption}</figcaption>
        </figure>
      `;
    })
    .join('');
}

async function deletePhotoEntry(photoId) {
  const entry = getPhotoEntry(photoId);
  if (!entry) return;
  const ok = await showPromptConfirm('Delete this photo from your journal?', {
    title: 'Delete photo',
    confirmText: 'Delete',
    cancelText: 'Keep',
    tone: 'danger'
  });
  if (!ok) return;
  photoJournalEntries = photoJournalEntries.filter((item) => item.id !== photoId);
  if (photoJournalSelection.beforeId === photoId) {
    photoJournalSelection.beforeId = null;
  }
  if (photoJournalSelection.afterId === photoId) {
    photoJournalSelection.afterId = null;
  }
  ensurePhotoSelection();
  savePhotoJournal();
  renderPhotoJournal();
}

function ensurePhotoSelection() {
  const chronological = getChronologicalPhotoEntries();
  if (!chronological.length) {
    const hadSelection = Boolean(photoJournalSelection.beforeId || photoJournalSelection.afterId);
    photoJournalSelection = { beforeId: null, afterId: null };
    return hadSelection;
  }

  let updated = false;
  const earliest = chronological[0];
  const latest = chronological[chronological.length - 1];

  if (!getPhotoEntry(photoJournalSelection.beforeId)) {
    photoJournalSelection.beforeId = earliest.id;
    updated = true;
  }

  if (!getPhotoEntry(photoJournalSelection.afterId)) {
    photoJournalSelection.afterId = latest.id;
    updated = true;
  }

  if (photoJournalSelection.beforeId === photoJournalSelection.afterId && chronological.length > 1) {
    photoJournalSelection.beforeId = earliest.id;
    photoJournalSelection.afterId = latest.id;
    updated = true;
  }

  return updated;
}

function getPhotoEntry(id) {
  if (!id) return null;
  return photoJournalEntries.find((entry) => entry.id === id) || null;
}

function getChronologicalPhotoEntries() {
  return [...photoJournalEntries].sort((a, b) => {
    const aKey = a.date || '';
    const bKey = b.date || '';
    if (aKey !== bKey) return aKey.localeCompare(bKey);
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

function getSortedPhotoEntries() {
  return [...photoJournalEntries].sort((a, b) => {
    const aKey = a.date || '';
    const bKey = b.date || '';
    if (aKey !== bKey) return bKey.localeCompare(aKey);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

function getAlternatePhotoId(currentId, mode) {
  const entries = mode === 'earliest' ? getChronologicalPhotoEntries() : getSortedPhotoEntries();
  const candidate = entries.find((entry) => entry.id !== currentId);
  return candidate?.id || currentId;
}

function applyPhotoDropSelection(photoId, role) {
  if (role === 'before') {
    photoJournalSelection.beforeId = photoId;
    if (photoJournalSelection.beforeId === photoJournalSelection.afterId) {
      photoJournalSelection.afterId = getAlternatePhotoId(photoId, 'latest');
    }
  } else {
    photoJournalSelection.afterId = photoId;
    if (photoJournalSelection.afterId === photoJournalSelection.beforeId) {
      photoJournalSelection.beforeId = getAlternatePhotoId(photoId, 'earliest');
    }
  }
  savePhotoJournal();
  renderPhotoJournal();
}

function formatPhotoCaption(entry) {
  const date = parseISODate(entry.date);
  const dateLabel = date ? formatDateLabel(date) : 'Unknown date';
  const viewLabel = entry.view ? ` - ${entry.view}` : '';
  return `${dateLabel}${viewLabel}`;
}

function formatPhotoOption(entry) {
  const date = parseISODate(entry.date);
  const dateLabel = date ? formatDateLabel(date) : 'Unknown date';
  const viewLabel = entry.view ? ` (${entry.view})` : '';
  return `${dateLabel}${viewLabel}`;
}

function updatePhotoAnalysis(beforeEntry, afterEntry) {
  if (!analysisDaysEl || !analysisWeightEl || !analysisRateEl || !analysisViewsEl || !analysisNotesEl) return;

  if (!beforeEntry || !afterEntry) {
    analysisDaysEl.textContent = '--';
    analysisWeightEl.textContent = '--';
    analysisRateEl.textContent = '--';
    analysisViewsEl.textContent = '--';
    analysisNotesEl.textContent = 'Select two check-ins to see your change summary.';
    return;
  }

  const beforeDate = parseISODate(beforeEntry.date);
  const afterDate = parseISODate(afterEntry.date);
  const dayDiff = beforeDate && afterDate ? Math.abs(afterDate - beforeDate) / (1000 * 60 * 60 * 24) : null;

  analysisDaysEl.textContent = Number.isFinite(dayDiff) ? `${Math.round(dayDiff)} days` : '--';

  const beforeWeight = getWeightForDate(beforeEntry.date);
  const afterWeight = getWeightForDate(afterEntry.date);
  const weightDelta = Number.isFinite(beforeWeight) && Number.isFinite(afterWeight) ? afterWeight - beforeWeight : null;
  analysisWeightEl.textContent =
    weightDelta === null ? '--' : formatSignedNumber(weightDelta, ' kg');

  if (weightDelta !== null && dayDiff && dayDiff > 0) {
    const weeklyRate = weightDelta / (dayDiff / 7);
    analysisRateEl.textContent = formatSignedNumber(weeklyRate, ' kg/week');
  } else {
    analysisRateEl.textContent = '--';
  }

  const beforeView = beforeEntry.view || 'Unknown';
  const afterView = afterEntry.view || 'Unknown';
  analysisViewsEl.textContent = `${beforeView} to ${afterView}`;

  const beforeNotes = beforeEntry.notes ? `Before: ${beforeEntry.notes}` : 'Before: no notes';
  const afterNotes = afterEntry.notes ? `After: ${afterEntry.notes}` : 'After: no notes';
  const weightNote =
    weightDelta === null ? ' Weight logs missing for one or both dates.' : '';
  analysisNotesEl.textContent = `${beforeNotes} | ${afterNotes}.${weightNote}`;
}

function updatePhotoDropTargets(beforeEntry, afterEntry) {
  const updateTarget = (target, imageEl, metaEl, entry, fallback) => {
    if (!target) return;
    const hasPhoto = Boolean(entry?.src);
    target.classList.toggle('has-photo', hasPhoto);
    if (imageEl) {
      imageEl.src = hasPhoto ? entry.src : '';
      imageEl.alt = hasPhoto ? formatPhotoCaption(entry) : '';
    }
    if (metaEl) {
      metaEl.textContent = hasPhoto ? formatPhotoOption(entry) : fallback;
    }
  };

  updateTarget(photoBeforeDrop, photoBeforeThumb, photoBeforeMeta, beforeEntry, 'Drag a photo here');
  updateTarget(photoAfterDrop, photoAfterThumb, photoAfterMeta, afterEntry, 'Drag a photo here');
}

function getWeightForDate(dateIso) {
  if (!dateIso || !Array.isArray(weightLogs) || weightLogs.length === 0) return null;
  const sorted = weightLogs
    .filter((entry) => entry && typeof entry.date === 'string' && Number.isFinite(Number(entry.weight)))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!sorted.length) return null;

  let candidate = null;
  sorted.forEach((entry) => {
    if (entry.date <= dateIso) {
      candidate = entry;
    }
  });

  const target = candidate || sorted[0];
  return Number(target.weight);
}

function applyPhotoCompareImages(beforeUrl, afterUrl) {
  if (!photoCompare) return;
  const beforeEl = photoCompare.querySelector('.photo-before');
  const afterEl = photoCompare.querySelector('.photo-after');

  if (beforeEl) {
    beforeEl.style.backgroundImage = beforeUrl ? `url("${beforeUrl}")` : '';
  }
  if (afterEl) {
    afterEl.style.backgroundImage = afterUrl ? `url("${afterUrl}")` : '';
  }

  photoCompare.dataset.before = beforeUrl || '';
  photoCompare.dataset.after = afterUrl || '';
}

function updatePhotoSplit(value) {
  if (!photoCompare) return;
  const percent = Math.min(100, Math.max(0, Number(value) || 0));
  photoCompare.style.setProperty('--split', `${percent}%`);
}

function setupPhotoCompare() {
  if (!photoCompare) return;
  const before = photoCompare.dataset.before;
  const after = photoCompare.dataset.after;
  if (before || after) {
    applyPhotoCompareImages(before, after);
  }

  if (photoSlider) {
    photoSlider.addEventListener('input', (event) => {
      updatePhotoSplit(event.target.value);
    });
    updatePhotoSplit(photoSlider.value || 55);
  }
}

function setupNutritionControls() {
  nutritionModeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      nutritionModeButtons.forEach((item) => item.classList.remove('active'));
      btn.classList.add('active');
      nutritionState.mode = btn.dataset.mode || 'maintain';
      writeStorage(storageKey('nutrition'), nutritionState);
    });
  });

  if (calorieRange) {
    calorieRange.addEventListener('input', () => {
      nutritionState.calories = Number(calorieRange.value) || nutritionState.calories;
      writeStorage(storageKey('nutrition'), nutritionState);
      renderNutrition();
    });
  }
}

function renderNutrition() {
  if (calorieRange) {
    calorieRange.value = nutritionState.calories || 2200;
  }
  if (calorieValueEl) {
    calorieValueEl.textContent = `${nutritionState.calories || 0} kcal`;
  }

  nutritionModeButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === nutritionState.mode);
  });

  const completionRatio = getMealCompletionRatio();

  macroRows.forEach((row) => {
    const macro = row.dataset.macro;
    const target = Number(nutritionState.macros?.[macro]) || 0;
    const consumed = Math.round(target * completionRatio);

    const currentEl = row.querySelector('[data-macro-current]');
    const targetEl = row.querySelector('[data-macro-target]');
    if (currentEl) currentEl.textContent = `${consumed}g`;
    if (targetEl) targetEl.textContent = `${target}g`;

    const fill = row.querySelector('.macro-fill');
    if (fill) {
      const progress = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
      fill.style.width = `${progress}%`;
    }
  });
}

function getMealCompletionRatio() {
  const todayIso = toISODate(new Date());
  if (!todayIso) return 0;
  return getMealCompletionRatioForDate(todayIso);
}

function setupGoalSetupModal() {
  if (addGoalBtn) {
    addGoalBtn.addEventListener('click', () => {
      openGoalSetupModal();
    });
  }

  if (editGoalsBtn) {
    editGoalsBtn.addEventListener('click', () => {
      openGoalSetupModal();
    });
  }

  if (goalSetupClose) {
    goalSetupClose.addEventListener('click', () => {
      closeGoalSetupModal();
    });
  }

  if (goalSetupModal) {
    goalSetupModal.addEventListener('click', (event) => {
      if (event.target === goalSetupModal) {
        closeGoalSetupModal();
      }
    });
  }

  if (goalSetupForm) {
    goalSetupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitBtn = goalSetupForm.querySelector('.submit-btn');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const focus = goalFocusInput?.value ? goalFocusInput.value.trim() : '';
        const targetWeight = parseNumber(goalTargetWeightInput?.value);
        const benchTarget = parseNumber(benchTargetInput?.value);
        const runTarget = parseNumber(runTargetInput?.value);
        const runBest = parseNumber(runBestInput?.value);
        const calories = parseNumber(goalCaloriesInput?.value);
        const protein = parseNumber(goalProteinInput?.value);
        const carbs = parseNumber(goalCarbsInput?.value);
        const fat = parseNumber(goalFatInput?.value);

        if (benchTarget !== null) milestoneTargets.benchTarget = benchTarget;
        if (runTarget !== null) milestoneTargets.runTarget = runTarget;
        if (runBest !== null) milestoneTargets.runBest = runBest;
        if (targetWeight !== null) {
          milestoneTargets.targetWeight = targetWeight;
          currentProfile.target_weight = targetWeight;
        }
        if (calories !== null) nutritionState.calories = calories;
        if (protein !== null) nutritionState.macros.protein = protein;
        if (carbs !== null) nutritionState.macros.carbs = carbs;
        if (fat !== null) nutritionState.macros.fat = fat;
        if (focus) {
          currentProfile.goal = focus;
          if (userGoalEl) {
            userGoalEl.textContent = `Goal: ${focus}`;
          }
        }

        mealPlanCache = { start: null, end: null, mealsByDate: {} };
        writeStorage(storageKey('milestones'), milestoneTargets);
        writeStorage(storageKey('nutrition'), nutritionState);

        if (currentUserId) {
          await saveProfileUpdate({
            goal: focus || currentProfile.goal || null,
            target_weight: milestoneTargets.targetWeight || currentProfile.target_weight || null
          });
        }

        closeGoalSetupModal();
        renderBodyComposition();
        renderPerformanceMilestones();
        renderNutrition();
        renderCalendar();
      } catch (err) {
        console.error('Failed to save goal settings', err);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

function openGoalSetupModal() {
  if (!goalSetupModal) return;
  if (goalFocusInput) goalFocusInput.value = currentProfile.goal || '';
  if (goalTargetWeightInput) {
    goalTargetWeightInput.value = milestoneTargets.targetWeight || currentProfile.target_weight || '';
  }
  if (benchTargetInput) benchTargetInput.value = milestoneTargets.benchTarget || '';
  if (runTargetInput) runTargetInput.value = milestoneTargets.runTarget || '';
  if (runBestInput) runBestInput.value = milestoneTargets.runBest || '';
  if (goalCaloriesInput) goalCaloriesInput.value = nutritionState.calories || '';
  if (goalProteinInput) goalProteinInput.value = nutritionState.macros.protein || '';
  if (goalCarbsInput) goalCarbsInput.value = nutritionState.macros.carbs || '';
  if (goalFatInput) goalFatInput.value = nutritionState.macros.fat || '';

  goalSetupModal.classList.add('show');
}

function closeGoalSetupModal() {
  if (goalSetupModal) {
    goalSetupModal.classList.remove('show');
  }
}

function setupWeightModal() {
  if (logWeightBtn) {
    logWeightBtn.addEventListener('click', () => {
      if (weightModal) {
        weightModal.classList.add('show');
        if (currentWeightInput) {
          currentWeightInput.value = currentProfile.weight_kg || '';
        }
      }
    });
  }

  if (weightModalClose) {
    weightModalClose.addEventListener('click', () => {
      weightModal?.classList.remove('show');
    });
  }

  if (weightModal) {
    weightModal.addEventListener('click', (event) => {
      if (event.target === weightModal) {
        weightModal.classList.remove('show');
      }
    });
  }

  if (weightForm) {
    weightForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitBtn = weightForm.querySelector('.submit-btn');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const weightValue = parseNumber(currentWeightInput?.value);
        if (!weightValue) {
          showPromptAlert('Please enter your current weight.');
          return;
        }

        const todayIso = toISODate(new Date());
        const existingIndex = weightLogs.findIndex((entry) => entry.date === todayIso);
        if (existingIndex >= 0) {
          weightLogs[existingIndex].weight = weightValue;
        } else {
          weightLogs.push({ date: todayIso, weight: weightValue });
        }
        writeStorage(storageKey('weight-log'), weightLogs);
        currentProfile.weight_kg = weightValue;

        if (currentUserId) {
          await saveProfileUpdate({ weight_kg: weightValue });
        }

        weightModal?.classList.remove('show');
        renderBodyComposition();
        await loadWaterTarget();
      } catch (err) {
        console.error('Failed to log weight', err);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

async function saveProfileUpdate(fields) {
  if (!currentUserId) return;
  const payload = {
    weight_kg: currentProfile.weight_kg ?? null,
    height_cm: currentProfile.height_cm ?? null,
    age: currentProfile.age ?? null,
    goal: currentProfile.goal ?? null,
    target_weight: currentProfile.target_weight ?? null,
    preference: currentProfile.preference ?? null,
    allergies: currentProfile.allergies ?? null,
    ...fields
  };

  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const data = await res.json();
    if (data?.profile) {
      currentProfile = { ...data.profile };
      if (data.profile.goal && userGoalEl) {
        userGoalEl.textContent = `Goal: ${data.profile.goal}`;
      }
    }
  } catch (err) {
    console.error('Profile update failed', err);
  }
}

function setupMeasurementModal() {
  if (updateMeasurementsBtn) {
    updateMeasurementsBtn.addEventListener('click', () => {
      if (measurementModal) {
        measurementModal.classList.add('show');
        const dateInput = document.getElementById('measurementDate');
        if (dateInput) {
          dateInput.value = toISODate(new Date());
        }
      }
    });
  }

  if (measurementModalClose) {
    measurementModalClose.addEventListener('click', () => {
      if (measurementModal) measurementModal.classList.remove('show');
    });
  }

  if (measurementModal) {
    measurementModal.addEventListener('click', (event) => {
      if (event.target === measurementModal) {
        measurementModal.classList.remove('show');
      }
    });
  }

  if (measurementForm) {
    measurementForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitBtn = measurementForm.querySelector('.submit-btn');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const data = {
          measurement_date: document.getElementById('measurementDate')?.value,
          chest_cm: document.getElementById('chestCm')?.value || null,
          arms_cm: document.getElementById('armsCm')?.value || null,
          waist_cm: document.getElementById('waistCm')?.value || null,
          hips_cm: document.getElementById('hipsCm')?.value || null,
          thighs_cm: document.getElementById('thighsCm')?.value || null,
          neck_cm: document.getElementById('neckCm')?.value || null
        };

        const res = await fetch('/api/body-measurements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          measurementModal?.classList.remove('show');
          measurementForm.reset();
          await loadBodyMeasurements();
        } else {
          throw new Error('Failed to save measurement');
        }
      } catch (err) {
        console.error('Error saving measurement', err);
        showPromptAlert('Failed to save measurement. Please try again.');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

function setupStrengthModal() {
  if (addStrengthBtn) {
    addStrengthBtn.addEventListener('click', () => {
      if (strengthModal) {
        strengthModal.classList.add('show');
        const dateInput = document.getElementById('strengthDate');
        if (dateInput) {
          dateInput.value = toISODate(new Date());
        }
      }
    });
  }

  if (strengthModalClose) {
    strengthModalClose.addEventListener('click', () => {
      if (strengthModal) strengthModal.classList.remove('show');
    });
  }

  if (strengthModal) {
    strengthModal.addEventListener('click', (event) => {
      if (event.target === strengthModal) {
        strengthModal.classList.remove('show');
      }
    });
  }

  if (exerciseSelect && exerciseOther) {
    exerciseSelect.addEventListener('change', () => {
      exerciseOther.style.display = exerciseSelect.value === 'Other' ? 'block' : 'none';
      if (exerciseSelect.value !== 'Other') {
        exerciseOther.value = '';
      }
    });
  }

  if (strengthForm) {
    strengthForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitBtn = strengthForm.querySelector('.submit-btn');
      if (submitBtn) submitBtn.disabled = true;

      try {
        let exerciseName = exerciseSelect?.value || '';
        if (exerciseName === 'Other') {
          exerciseName = exerciseOther.value.trim();
          if (!exerciseName) {
            showPromptAlert('Please enter an exercise name');
            return;
          }
        }

        const data = {
          exercise_name: exerciseName,
          weight_kg: document.getElementById('weightKg')?.value,
          reps: document.getElementById('reps')?.value || null,
          sets: document.getElementById('sets')?.value || null,
          record_date: document.getElementById('strengthDate')?.value,
          notes: document.getElementById('strengthNotes')?.value || null
        };

        const res = await fetch('/api/strength-records', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          strengthModal?.classList.remove('show');
          strengthForm.reset();
          if (exerciseOther) exerciseOther.style.display = 'none';
          await loadStrengthRecords();
        } else {
          throw new Error('Failed to save strength record');
        }
      } catch (err) {
        console.error('Error saving strength record', err);
        showPromptAlert('Failed to save strength record. Please try again.');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
}

async function saveWaterIntake(amount) {
  try {
    const today = toISODate(new Date());
    const res = await fetch('/api/water-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, amount })
    });

    if (res.ok) {
      const data = await res.json();
      waterIntakeToday = data.amount || amount;
      updateHydrationDisplay();
    } else {
      throw new Error('Failed to save water intake');
    }
  } catch (err) {
    console.error('Error saving water intake', err);
    showPromptAlert('Failed to save water intake. Please try again.');
  }
}

async function loadWaterTarget() {
  try {
    const res = await fetch('/api/water-target');
    if (res.ok) {
      const data = await res.json();
      waterTargetToday = data.target || 0;
      updateHydrationDisplay();
    }
  } catch (err) {
    console.warn('Failed to load water target', err);
  }
}

async function loadWaterIntake() {
  try {
    const today = toISODate(new Date());
    const res = await fetch(`/api/water-intake?date=${today}`);
    if (res.ok) {
      const data = await res.json();
      waterIntakeToday = data.amount || 0;
      if (waterIntakeToday > 0) {
        habitState.water[today] = waterIntakeToday;
        writeStorage(storageKey('habits'), habitState);
      }
      updateHydrationDisplay();
    }
  } catch (err) {
    console.warn('Failed to load water intake', err);
  }
}

function updateHydrationDisplay() {
  if (!hydrationStatusEl) return;
  const current = Number.isFinite(waterIntakeToday) ? waterIntakeToday : 0;
  const target = Number.isFinite(waterTargetToday) ? waterTargetToday : 0;
  hydrationStatusEl.textContent = `${current} / ${target} ml`;
}

function maybePromptDailyCheckin() {
  if (!checkinModal) return;
  const todayIso = toISODate(new Date());
  if (!todayIso) return;
  const completed = checkinCompletionState[todayIso];
  const prompted = checkinPromptState[todayIso];
  if (completed || prompted) return;

  const hasSleep = Number.isFinite(Number(habitState.sleep?.[todayIso]));
  const hasSugar = habitState.nosugar?.[todayIso] === true || habitState.nosugar?.[todayIso] === false;
  const hasWater = getWaterAmountForDate(todayIso) > 0;
  const hasAll = hasSleep && hasSugar && hasWater;

  if (hasAll) {
    checkinCompletionState[todayIso] = true;
    writeStorage(storageKey('checkin-complete'), checkinCompletionState);
    return;
  }

  checkinPromptState[todayIso] = true;
  writeStorage(storageKey('checkin-prompt'), checkinPromptState);

  setTimeout(() => {
    openCheckinModal();
  }, 800);
}
