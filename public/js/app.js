document.addEventListener('DOMContentLoaded', async function () {
    // Hamburger menu functionality
   /* ==== Replace your hamburger handler with this ==== */
const hamburgerMenu = document.querySelector('.hamburger-menu');
const sidebar = document.querySelector('.sidebar');
const sections = document.querySelector('.sections');
const closeBtn = document.querySelector('.sidebar-close');

document.body.classList.add('sidebar-init');

const SIDEBAR_STATE_KEY = 'flexfule-sidebar-state';
const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
const THEME_KEY = 'flexfule-theme';

const showPromptAlert = (message, options = {}) => {
  if (window.FFPrompt?.alert) {
    return window.FFPrompt.alert(message, options);
  }
  window.alert(message);
  return Promise.resolve();
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
      // On phones: slide sidebar in/out without changing content margin
      sidebar.classList.toggle('is-open');
      // Ensure desktop-only classes are cleared
      sidebar.classList.remove('collapsed');
      sections.classList.remove('collapsed');
      document.body.classList.remove('sidebar-collapsed');
      syncHamburgerExpandedState();
    } else {
      // On desktop/tablet: collapse to icon rail
      sidebar.classList.toggle('collapsed');
      sections.classList.toggle('collapsed');
      // Ensure mobile-only open state is cleared
      sidebar.classList.remove('is-open');
      syncBodySidebarState();
      syncHamburgerExpandedState();
      persistSidebarState();
    }
  });

  // Keep classes sane across breakpoint changes
  window.addEventListener('resize', () => {
    if (isMobile()) {
      // Reset desktop collapse when entering mobile
      sections.classList.remove('collapsed');
      sidebar.classList.remove('collapsed');
      sidebar.classList.remove('is-open');
      document.body.classList.remove('sidebar-collapsed');
    } else {
      // Hide mobile drawer when leaving mobile
      sidebar.classList.remove('is-open');
      applySavedSidebarState();
      persistSidebarState();
    }
    syncHamburgerExpandedState();
  });
}

// Dedicated close button for mobile drawer
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

if (window.FFSupa?.syncFromHash) {
  try {
    await window.FFSupa.syncFromHash();
  } catch (err) {
    console.warn('Failed to sync Supabase session from hash', err);
  }
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


    // Dark mode toggle functionality
    const themeToggle = document.querySelector('.theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (mode) => {
        const isLight = mode === 'light';
        document.body.classList.toggle('dark-mode', isLight);
        themeToggle?.classList.toggle('dark-mode', isLight);
        themeToggle?.setAttribute('aria-pressed', isLight ? 'true' : 'false');
        localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
    };

    const storedTheme = localStorage.getItem(THEME_KEY);
    const initialTheme = storedTheme || (prefersDark.matches ? 'light' : 'dark');
    applyTheme(initialTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            applyTheme(nextTheme);
        });
    }

    // ... existing code ...
    function normalizeKey(text) {
        return (text || '').toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
    }

    const workoutListEl = document.querySelector('[data-workout-list]');
    const workoutGridEl = document.querySelector('[data-workout-grid]');
    const mainMediaEl = document.querySelector('[data-main-media]');
    const mainTitleEl = document.querySelector('[data-main-title]');
    const mainPrescriptionEl = document.querySelector('[data-main-prescription]');
    const mainIntensityEl = document.querySelector('[data-main-intensity]');
    const mainBurnEl = document.querySelector('[data-main-burn]');
    const mainWatchLink = document.querySelector('[data-main-watch]');
    const logWorkoutButton = document.querySelector('[data-log-workout]');
    const addExerciseButton = document.querySelector('[data-add-workout]');
    const addExerciseModal = document.getElementById('addExerciseModal');
    const addExerciseClose = document.getElementById('addExerciseClose');
    const addExerciseSearch = document.getElementById('addExerciseSearch');
    const addExerciseResults = document.getElementById('addExerciseResults');
    const addExerciseFilters = Array.from(document.querySelectorAll('[data-add-exercise-filter]'));
    const todayLabelEl = document.querySelector('[data-workout-date]');
    const logMessageEl = document.querySelector('[data-log-message]');
    const workoutHistoryListEl = document.querySelector('[data-workout-history]');
    const searchInputEl = document.querySelector('[data-workout-search]');
    const viewFilterButtons = Array.from(document.querySelectorAll('[data-view-filter]'));
    const levelFilterButtons = Array.from(document.querySelectorAll('[data-level-filter]'));

    let currentWorkoutDay = null;
    let selectedExerciseIndex = 0;
    let currentExercise = null;
    let currentExerciseIndex = null;
    let activeVideoElement = null;
    let activeYouTubePlayer = null;
    let activeVideoWatchTimer = null;
    let activeVideoLastTick = null;
    let lastWorkoutCacheSaveAt = 0;
    let youtubeApiReady = false;
    let youtubeApiLoading = false;
    let isLoggingWorkout = false;
    const youtubeReadyQueue = [];
    const VIDEO_COMPLETION_THRESHOLD = 0.9;
    let currentUserId = null;
    let currentUserKey = 'anonymous';
    const WORKOUT_COMPLETION_STORAGE_KEY = 'ff-workout-completion-state';
    const WORKOUT_EXERCISE_COMPLETION_KEY = 'ff-workout-exercise-completion';
    const WORKOUT_ACTIVE_DAY_STORAGE_KEY = 'ff-workout-active-day';
    const WORKOUT_DAY_CACHE_KEY = 'ff-workout-day-cache';
    const ACTIVE_DAY_STORAGE_KEY = 'flexfule.active-day';
    const MEAL_PLAN_CACHE_KEY = 'flexfuel.meals.planCache';
    const MEAL_CUSTOM_PLAN_KEY = 'flexfuel.meals.customPlan';
    const MEAL_COMPLETION_PREFIX = 'flexfuel.meals.completed';
    const MEAL_PLAN_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
    const WORKOUT_PLAN_VERSION = '2026-02-05-1';
    const WORKOUT_DAY_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 48;
    const WORKOUT_HISTORY_LIMIT = 10;
    let workoutLibrary = [];
    let exerciseVideoLibraryError = null;
    let supplementalWorkouts = [];
    let exerciseVideoCategoryOverrides = null;
    let filteredWorkouts = [];
    let selectedLevelFilter = 'all';
    let selectedViewFilter = 'plan';
    let searchQuery = '';
    let addExerciseCategory = 'all';
    let addExerciseQuery = '';
    let addExerciseResultsList = [];
    let profileContext = {};
    let exerciseVideoLibraryLoaded = false;
    let exerciseVideoLibraryPromise = null;
    let workoutHistoryEntries = [];

    const clearWorkoutPlanCache = () => {
        try {
            const keys = Object.keys(window.localStorage || {});
            keys.forEach((key) => {
                if (
                    key.startsWith(`${WORKOUT_DAY_CACHE_KEY}.`) ||
                    key.startsWith(`${WORKOUT_ACTIVE_DAY_STORAGE_KEY}.`) ||
                    key === WORKOUT_EXERCISE_COMPLETION_KEY ||
                    key === WORKOUT_COMPLETION_STORAGE_KEY
                ) {
                    window.localStorage.removeItem(key);
                }
            });
        } catch (err) {
            console.warn('Failed to clear workout plan cache', err);
        }
    };

    const maybeForcePlanRefresh = () => {
        if (!window.location?.search) return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('refreshPlan') !== '1') return;
        params.delete('refreshPlan');
        clearWorkoutPlanCache();
        const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
        window.history.replaceState({}, '', nextUrl);
        window.location.reload();
    };
    maybeForcePlanRefresh();

    const CATEGORY_LABELS = {
        cardio: 'Cardio',
        legs: 'Legs',
        chest: 'Chest',
        shoulders: 'Shoulders',
        back: 'Back',
        arms: 'Arms',
        bicep: 'Biceps',
        tricep: 'Triceps',
        core: 'Core',
        belly: 'Belly',
        hips: 'Hips / Glutes',
        mobility: 'Mobility',
        height: 'Height Increasing',
        fullbody: 'Full Body'
    };

    const CATEGORY_SYNONYMS = {
        cardio: [
            'cardio',
            'hiit',
            'conditioning',
            'aerobic',
            'run',
            'running',
            'jog',
            'jogging',
            'sprint',
            'jump rope',
            'jumping jack',
            'jumping jacks',
            'high knees',
            'burpee',
            'burpees',
            'mountain climber',
            'mountain climbers'
        ],
        legs: [
            'leg',
            'legs',
            'lower',
            'lower-body',
            'quad',
            'quads',
            'thigh',
            'hamstring',
            'squat',
            'squats',
            'lunge',
            'lunges',
            'deadlift',
            'deadlifts',
            'romanian',
            'goblet',
            'step-up',
            'step ups',
            'split squat',
            'leg press',
            'leg extension',
            'leg curl'
        ],
        chest: ['chest', 'pec', 'pushup', 'push-ups', 'bench', 'bench press', 'chest fly', 'cable crossover'],
        shoulders: [
            'shoulder',
            'shoulders',
            'deltoid',
            'delts',
            'overhead press',
            'arnold press',
            'lateral raise',
            'front raise',
            'upright row',
            'face pull',
            'reverse pec deck'
        ],
        back: ['back', 'row', 'pull', 'lat', 'lats', 'pull-up', 'pull ups'],
        arms: ['arm', 'arms', 'upper-body'],
        bicep: ['bicep', 'biceps', 'curl', 'curls', 'hammer curl', 'concentration curl'],
        tricep: ['tricep', 'triceps', 'skull crusher', 'pushdown', 'dips', 'close-grip', 'kickback', 'overhead extension'],
        core: ['core', 'plank', 'planks', 'side plank', 'stability', 'dead bug', 'bird-dog', 'hollow body'],
        belly: [
            'belly',
            'midsection',
            'waist',
            'oblique',
            'obliques',
            'ab',
            'abs',
            'abdominal',
            'crunch',
            'crunches',
            'sit-up',
            'situp',
            'bicycle',
            'russian twist',
            'leg raise',
            'leg raises',
            'flutter kick',
            'flutter kicks',
            'reverse crunch',
            'v-up',
            'v ups',
            'toe touch'
        ],
        hips: [
            'hip',
            'hips',
            'glute',
            'glutes',
            'gluteus',
            'hip thrust',
            'glute bridge',
            'clamshell',
            'donkey kick',
            'monster walk',
            'fire hydrant',
            'hip circle'
        ],
        mobility: ['mobility', 'stretch', 'stretching', 'flexibility', 'yoga', 'recovery'],
        height: [
            'height increasing',
            'height',
            'grow taller',
            'tall',
            'posture',
            'bar hang',
            'cobra stretch',
            'child',
            'pelvic tilt',
            'superman stretch',
            'bridge pose',
            'toe touch',
            'side stretch',
            'jump rope'
        ],
        fullbody: ['full', 'full-body', 'total', 'compound', 'circuit', 'all-body']
    };

    const CATEGORY_LOOKUP = {};
    Object.entries(CATEGORY_SYNONYMS).forEach(([canonical, terms]) => {
        terms.forEach((term) => {
            CATEGORY_LOOKUP[term.toLowerCase()] = canonical;
        });
    });

    const CATEGORY_SEARCH_ALIASES = {
        belly: ['core'],
        arms: ['bicep', 'tricep']
    };

    const getWorkoutLibraryDataset = () => {
        const baseLibrary = Array.isArray(workoutLibrary) ? workoutLibrary : [];
        const extraLibrary = Array.isArray(supplementalWorkouts) ? supplementalWorkouts : [];
        if (!extraLibrary.length) return baseLibrary;
        return [...baseLibrary, ...extraLibrary];
    };

    const getSearchLibraryDataset = () => {
        const extraLibrary = Array.isArray(supplementalWorkouts) ? supplementalWorkouts : [];
        if (extraLibrary.length) return extraLibrary;
        return Array.isArray(workoutLibrary) ? workoutLibrary : [];
    };

    const searchApiCache = new Map();
    let activeSearchApiQuery = null;

    const fetchSearchLibraryResults = async (query) => {
        const normalizedQuery = String(query || '').trim();
        if (!normalizedQuery) return [];
        if (searchApiCache.has(normalizedQuery)) {
            return searchApiCache.get(normalizedQuery);
        }
        const response = await fetch(
            `/api/workout-videos?q=${encodeURIComponent(normalizedQuery)}&limit=200&refresh=1`
        );
        if (!response.ok) {
            throw new Error(`Search request failed with status ${response.status}`);
        }
        const payload = await response.json();
        if (!Array.isArray(payload?.items)) return [];
        const mapped = payload.items.map(mapVideoLibraryItemToWorkout).filter(Boolean);
        const dedupedByName = dedupeExercisesByName(mapped);
        const dedupedByVideo = dedupeExercisesByVideo(
            dedupedByName,
            getQueryCategoryPreferences(normalizedQuery)
        );
        searchApiCache.set(normalizedQuery, dedupedByVideo);
        return dedupedByVideo;
    };

    const dedupeExercisesByName = (items) => {
        if (!Array.isArray(items)) return [];
        const seen = new Set();
        const deduped = [];
        items.forEach((item, index) => {
            const exercise = item?.exercise || item;
            const nameKey = normalizeKey(exercise?.name || exercise?.exercise || '');
            const key = nameKey || `item-${index}`;
            if (seen.has(key)) return;
            seen.add(key);
            deduped.push(item);
        });
        return deduped;
    };

    const dedupeExercisesByVideo = (items, preferredCategories = []) => {
        if (!Array.isArray(items)) return [];
        const preferred = new Set(
            Array.isArray(preferredCategories) ? preferredCategories.filter(Boolean) : []
        );
        const seen = new Map();
        const deduped = [];
        items.forEach((item, index) => {
            const exercise = item?.exercise || item;
            const videoKey = String(exercise?.video || exercise?.videoEmbed || '').trim();
            const nameFallback = normalizeKey(exercise?.name || exercise?.exercise || '');
            const key = videoKey || nameFallback || `item-${index}`;
            if (!key) return;
            if (!seen.has(key)) {
                seen.set(key, deduped.length);
                deduped.push(item);
                return;
            }
            if (!preferred.size) return;
            const existingIndex = seen.get(key);
            const existing = deduped[existingIndex];
            const existingExercise = existing?.exercise || existing;
            const existingCats = Array.isArray(existingExercise?.categories) ? existingExercise.categories : [];
            const candidateCats = Array.isArray(exercise?.categories) ? exercise.categories : [];
            const existingScore = existingCats.some((cat) => preferred.has(cat)) ? 1 : 0;
            const candidateScore = candidateCats.some((cat) => preferred.has(cat)) ? 1 : 0;
            if (candidateScore > existingScore) {
                deduped[existingIndex] = item;
            }
        });
        return deduped;
    };

    const getQueryCategoryPreferences = (query) => {
        if (!query) return [];
        return detectCategoriesFromText(query);
    };

    const getCurrentUserKey = () => currentUserKey || 'anonymous';

    const getWorkoutDayCacheKey = (userKey) => `${WORKOUT_DAY_CACHE_KEY}.${userKey || 'anonymous'}`;

    const loadWorkoutDayCache = () => {
        const readCache = (key) => {
            try {
                const raw = window.localStorage?.getItem(key);
                if (!raw) return null;
                const parsed = JSON.parse(raw);
                if (!parsed || typeof parsed !== 'object') return null;
                if (!parsed.savedAt || !parsed.day || !parsed.dateIso) return null;
                if (Date.now() - Number(parsed.savedAt) > WORKOUT_DAY_CACHE_MAX_AGE_MS) return null;
                if (parsed.version && parsed.version !== WORKOUT_PLAN_VERSION) return null;
                return parsed;
            } catch (err) {
                console.warn('Failed to read workout cache', err);
                return null;
            }
        };
        const primary = readCache(getWorkoutDayCacheKey(getCurrentUserKey()));
        if (primary) return primary;
        if (getCurrentUserKey() !== 'anonymous') {
            return readCache(getWorkoutDayCacheKey('anonymous'));
        }
        return null;
    };

    const saveWorkoutDayCache = (day) => {
        if (!day || !day.dateIso) return;
        const payload = {
            savedAt: Date.now(),
            dateIso: day.dateIso,
            day,
            version: WORKOUT_PLAN_VERSION
        };
        const primaryKey = getWorkoutDayCacheKey(getCurrentUserKey());
        try {
            window.localStorage?.setItem(primaryKey, JSON.stringify(payload));
            if (getCurrentUserKey() !== 'anonymous') {
                window.localStorage?.setItem(getWorkoutDayCacheKey('anonymous'), JSON.stringify(payload));
            }
        } catch (err) {
            console.warn('Failed to persist workout cache', err);
        }
    };

    const canonicalCategory = (value) => {
        if (!value) return null;
        const lower = String(value).toLowerCase();
        if (CATEGORY_LABELS[lower]) return lower;
        if (CATEGORY_LOOKUP[lower]) return CATEGORY_LOOKUP[lower];
        if (lower.includes('belly')) return 'belly';
        if (/\babs?\b/.test(lower) || lower.includes('abdominal')) return 'belly';
        if (lower.includes('core')) return 'core';
        if (lower.includes('hip') || lower.includes('glute')) return 'hips';
        if (lower.includes('bicep')) return 'bicep';
        if (lower.includes('tricep')) return 'tricep';
        if (lower.includes('leg') || lower.includes('lower')) return 'legs';
        if (lower.includes('cardio') || lower.includes('aerobic') || lower.includes('run') || lower.includes('jog')) return 'cardio';
        if (lower.includes('chest') || lower.includes('push')) return 'chest';
        if (lower.includes('shoulder') || lower.includes('deltoid')) return 'shoulders';
        if (lower.includes('back') || lower.includes('row') || lower.includes('pull')) return 'back';
        if (lower.includes('arm')) return 'arms';
        if (lower.includes('mobility') || lower.includes('stretch') || lower.includes('yoga') || lower.includes('flex')) return 'mobility';
        if (lower.includes('height')) return 'height';
        if (lower.includes('full')) return 'fullbody';
        return null;
    };

    const normalizeSearchText = (value) =>
        String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

    const detectCategoriesFromText = (text) => {
        if (!text) return [];
        const normalized = normalizeSearchText(text);
        const tokens = normalized.split(' ').filter(Boolean);
        const tokenSet = new Set(tokens);
        const matches = new Set();
        Object.entries(CATEGORY_SYNONYMS).forEach(([category, synonyms]) => {
            if (
                synonyms.some((syn) => {
                    const synNorm = normalizeSearchText(syn);
                    if (!synNorm) return false;
                    if (synNorm.includes(' ')) {
                        return normalized.includes(synNorm);
                    }
                    if (synNorm.length <= 3) {
                        return tokenSet.has(synNorm);
                    }
                    return normalized.includes(synNorm);
                })
            ) {
                matches.add(category);
            }
        });
        return Array.from(matches);
    };

    const deriveExerciseCategories = (explicitCategories, textParts = [], extraTags = []) => {
        const resolved = new Set();
        if (Array.isArray(explicitCategories)) {
            explicitCategories.forEach((category) => {
                const canonical = canonicalCategory(category);
                if (canonical) {
                    resolved.add(canonical);
                }
            });
        }
        if (resolved.has('arms') && !resolved.has('bicep') && !resolved.has('tricep')) {
            const armSpecific = new Set();
            [...textParts, ...extraTags].forEach((value) => {
                detectCategoriesFromText(value).forEach((category) => {
                    if (category === 'bicep' || category === 'tricep') {
                        armSpecific.add(category);
                    }
                });
            });
            if (armSpecific.size) {
                armSpecific.forEach((category) => resolved.add(category));
                resolved.delete('arms');
            }
        }
        // If we already have explicit categories, trust them and avoid auto-tagging
        // from names/keywords to prevent cross-category pollution (e.g., "Back Squats").
        if (!resolved.size) {
            [...textParts, ...extraTags].forEach((value) => {
                detectCategoriesFromText(value).forEach((category) => resolved.add(category));
            });
        }
        if (!resolved.size) {
            resolved.add('fullbody');
        }
        return Array.from(resolved);
    };

    const formatCategoryLabel = (category) => {
        if (!category) return '';
        return CATEGORY_LABELS[category] || category.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const formatLevelLabel = (level) => {
        const text = String(level || '').trim();
        if (!text) return 'Mixed';
        const lower = text.toLowerCase();
        if (lower.startsWith('begin')) return 'Beginner';
        if (lower.startsWith('inter')) return 'Intermediate';
        if (lower.startsWith('adv')) return 'Advanced';
        return text.charAt(0).toUpperCase() + text.slice(1);
    };

    const WEEKDAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const DEFAULT_GOAL_ORDER = ['Build Muscle', 'Improve Endurance', 'General Fitness', 'Lose Weight'];

    const derivePlanGoalLabel = (input) => {
        const text = String(input || '').trim();
        if (!text) return 'General Fitness';
        const normalized = text.toLowerCase();
        if (normalized.includes('build') && normalized.includes('muscle')) return 'Build Muscle';
        if (normalized.includes('endurance')) return 'Improve Endurance';
        if (normalized.includes('lose') || normalized.includes('weight')) return 'Lose Weight';
        if (normalized.includes('general')) return 'General Fitness';
        return text
            .replace(/[-_]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const buildPlanExercisesForLevel = (levelKey) => {
        if (!window.FlexPlan) {
            return [];
        }
        const normalizedKey = String(levelKey || '').toLowerCase();
        const levelLabel = formatLevelLabel(normalizedKey);
        const goalSource =
            currentWorkoutDay?.goal ||
            profileContext?.goal ||
            currentWorkoutDay?.goalSlug ||
            profileContext?.goalSlug ||
            'General Fitness';
        const goalLabel = derivePlanGoalLabel(goalSource);
        const goalOrder = Array.from(
            new Set([goalLabel, ...DEFAULT_GOAL_ORDER.filter((label) => label !== goalLabel)])
        );
        const previewItems = [];
        const categoryOverrides = getExerciseVideoCategoryOverrides();
        goalOrder.forEach((goalOption, goalIndex) => {
            const seedWeek = window.FlexPlan.getWorkoutSeed(goalOption, levelLabel);
            if (!seedWeek) return;
            WEEKDAY_ORDER.forEach((dayKey) => {
                const session = seedWeek[dayKey];
                if (!session?.workouts?.length) return;
                const baseBurn = Number(session.baseBurn || 0);
                const burnPerExercise =
                    session.workouts.length && Number.isFinite(baseBurn)
                        ? Math.max(0, Math.round(baseBurn / session.workouts.length))
                        : null;
                let intensity = '';
                if (Number.isFinite(baseBurn) && baseBurn > 0) {
                    if (baseBurn >= 350) intensity = 'High';
                    else if (baseBurn <= 200) intensity = 'Low';
                    else intensity = 'Moderate';
                }
                session.workouts.forEach((workout, workoutIndex) => {
                    const youtubeId =
                        typeof extractYouTubeId === 'function' ? extractYouTubeId(workout.video) : null;
                    const videoEmbed = youtubeId ? `https://www.youtube.com/embed/${youtubeId}?rel=0` : null;
                    const dayIndex = WEEKDAY_ORDER.indexOf(dayKey);
                    const nameKey = normalizeKey(workout.exercise || '');
                    const overrideCategories = nameKey ? categoryOverrides.get(nameKey) : null;
                    const derivedCategories = deriveExerciseCategories(
                        overrideCategories || workout.categories,
                        [workout.exercise, workout.prescription, goalOption, dayKey],
                        workout.tags
                    );
                    const mergedExercise = {
                        id:
                            workout.id ||
                            `${goalOption.toLowerCase().replace(/\s+/g, '-')}-${normalizedKey}-${dayKey.toLowerCase()}-${workoutIndex}`,
                        name: workout.exercise,
                        prescription: workout.prescription,
                        video: workout.video,
                        videoEmbed,
                        level: levelLabel,
                        intensity,
                        targetBurn: burnPerExercise,
                        planDayLabel: dayKey,
                        planDayIndex: dayIndex >= 0 ? dayIndex : workoutIndex,
                        planBaseBurn: baseBurn,
                        planGoalLabel: goalOption,
                        planGoalIndex: goalIndex,
                        categories: derivedCategories,
                        tags: Array.isArray(workout.tags) ? Array.from(new Set(workout.tags)) : []
                    };
                    previewItems.push({
                        exercise: mergedExercise,
                        originalIndex: -1,
                        previewOnly: true
                    });
                });
            });
        });
        return previewItems;
    };

    const categoryMatches = (categories, categoryKey) => {
        if (!categoryKey) return false;
        if (categoryKey === 'belly') {
            const hasBelly = categories.includes('belly');
            const hasCore = categories.includes('core');
            const hasCardio = categories.includes('cardio');
            if ((hasBelly || hasCore) && !hasCardio) return true;
            return false;
        }
        if (categories.includes(categoryKey)) return true;
        const aliases = CATEGORY_SEARCH_ALIASES[categoryKey] || [];
        return aliases.some((alias) => categories.includes(alias));
    };

    const detectCategoryFilter = (query) => {
        if (!query) return null;
        const normalized = normalizeSearchText(query);
        if (!normalized) return null;
        let detected = null;
        Object.entries(CATEGORY_SYNONYMS).some(([category, terms]) => {
            if (
                terms.some((term) => {
                    const termNorm = normalizeSearchText(term);
                    return termNorm && normalized.includes(termNorm);
                })
            ) {
                detected = category;
                return true;
            }
            return false;
        });
        if (detected) return detected;
        const tokens = normalized.split(' ').filter(Boolean);
        for (const token of tokens) {
            const canonical = CATEGORY_LOOKUP[token] || canonicalCategory(token);
            if (canonical) return canonical;
        }
        return null;
    };

    const matchesSearch = (exercise, query) => {
        if (!query) return true;
        const categories = Array.isArray(exercise.categories) ? exercise.categories : [];
        const tags = Array.isArray(exercise.tags) ? exercise.tags : [];
        const haystack = [
            exercise.name,
            exercise.prescription,
            ...categories,
            ...tags
        ]
            .join(' ')
            .toLowerCase();
        const queryLower = query.toLowerCase();
        const tokens = queryLower.split(/\s+/).filter(Boolean);
        const queryCategories = new Set();

        Object.entries(CATEGORY_SYNONYMS).forEach(([canonical, terms]) => {
            if (!terms.some((term) => queryLower.includes(term))) return;
            queryCategories.add(canonical);
            (CATEGORY_SEARCH_ALIASES[canonical] || []).forEach((alias) => queryCategories.add(alias));
        });

        tokens.forEach((token) => {
            const canonical = CATEGORY_LOOKUP[token] || canonicalCategory(token);
            if (canonical) {
                queryCategories.add(canonical);
                (CATEGORY_SEARCH_ALIASES[canonical] || []).forEach((alias) => queryCategories.add(alias));
            }
        });

        for (const category of queryCategories) {
            if (categoryMatches(categories, category)) return true;
            const synonyms = CATEGORY_SYNONYMS[category];
            if (synonyms && synonyms.some((term) => haystack.includes(term))) return true;
        }

        if (!tokens.length) return true;
        return tokens.every((token) => {
            if (haystack.includes(token)) return true;
            const canonical = CATEGORY_LOOKUP[token] || canonicalCategory(token);
            if (canonical && categoryMatches(categories, canonical)) return true;
            return false;
        });
    };

    const mergeExerciseResults = (primaryItems, secondaryItems) => {
        const merged = [];
        const seen = new Set();
        const pushItem = (item) => {
            if (!item) return;
            const exercise = item.exercise || item;
            const nameKey = normalizeKey(exercise?.name || exercise?.exercise || '');
            const key = nameKey || `item-${merged.length}`;
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(item);
        };
        (primaryItems || []).forEach(pushItem);
        (secondaryItems || []).forEach(pushItem);
        return merged;
    };

    const applyWorkoutFilters = () => {
        const levelKey = (selectedLevelFilter || 'all').toLowerCase();
        const query = searchQuery;
        const categoryFilter = detectCategoryFilter(query);

        if (selectedViewFilter !== 'all') {
            let planExercises = [];
            if (levelKey === 'all') {
                planExercises = Array.isArray(currentWorkoutDay?.exercises)
                    ? currentWorkoutDay.exercises.map((exercise, originalIndex) => ({
                          exercise,
                          originalIndex,
                          previewOnly: false
                      }))
                    : [];
            } else {
                planExercises = buildPlanExercisesForLevel(levelKey);
                if (!planExercises?.length && Array.isArray(currentWorkoutDay?.exercises)) {
                    planExercises = currentWorkoutDay.exercises.map((exercise, originalIndex) => ({
                        exercise,
                        originalIndex,
                        previewOnly: false
                    }));
                }
            }
            const filteredPlan = planExercises
                .filter(({ exercise }) => Boolean(exercise))
                .filter(({ exercise }) => {
                    if (levelKey !== 'all') {
                        const levelValue = String(exercise.level || '').toLowerCase();
                        if (levelValue && levelValue !== levelKey) {
                            return false;
                        }
                    }
                    const categories = Array.isArray(exercise.categories) ? exercise.categories : [];
                    if (categoryFilter && !categoryMatches(categories, categoryFilter)) {
                        return false;
                    }
                    if (!categoryFilter && query && !matchesSearch(exercise, query)) {
                        return false;
                    }
                    return true;
                });
            if (query) {
                const libraryDataset = getSearchLibraryDataset();
                const libraryMatches = libraryDataset
                    .filter((exercise) => {
                        const categories = Array.isArray(exercise.categories) ? exercise.categories : [];
                        if (categoryFilter && !categoryMatches(categories, categoryFilter)) {
                            return false;
                        }
                        if (!categoryFilter && !matchesSearch(exercise, query)) {
                            return false;
                        }
                        return true;
                    })
                const preferredCategories = categoryFilter
                    ? [categoryFilter]
                    : getQueryCategoryPreferences(query);
                const dedupedByName = dedupeExercisesByName(libraryMatches);
                const dedupedByVideo = dedupeExercisesByVideo(dedupedByName, preferredCategories);
                const deduped = dedupedByVideo.map((exercise) => ({
                    exercise,
                    originalIndex: -1,
                    previewOnly: true
                }));
                renderWorkoutGrid(deduped);
                return;
            }
            renderWorkoutGrid(filteredPlan);
            return;
        }

        const libraryDataset = query ? getSearchLibraryDataset() : getWorkoutLibraryDataset();
        if (!Array.isArray(libraryDataset) || !libraryDataset.length) {
            filteredWorkouts = [];
            renderWorkoutGrid([]);
            return;
        }

        filteredWorkouts = libraryDataset.filter((exercise) => {
            if (levelKey !== 'all') {
                const levelValue = String(exercise.level || '').toLowerCase();
                if (levelValue && levelValue !== 'all levels' && levelValue !== levelKey) {
                    return false;
                }
            }
            const categories = Array.isArray(exercise.categories) ? exercise.categories : [];
            if (categoryFilter && !categoryMatches(categories, categoryFilter)) {
                return false;
            }
            if (!categoryFilter && query && !matchesSearch(exercise, query)) {
                return false;
            }
            return true;
        });
        if (query) {
            const preferredCategories = categoryFilter
                ? [categoryFilter]
                : getQueryCategoryPreferences(query);
            filteredWorkouts = dedupeExercisesByName(filteredWorkouts);
            filteredWorkouts = dedupeExercisesByVideo(filteredWorkouts, preferredCategories);
        }
        if (query && !filteredWorkouts.length) {
            const normalizedQuery = query.trim();
            if (normalizedQuery && activeSearchApiQuery !== normalizedQuery) {
                activeSearchApiQuery = normalizedQuery;
                fetchSearchLibraryResults(normalizedQuery)
                    .then((results) => {
                        if (activeSearchApiQuery !== normalizedQuery) return;
                        if (Array.isArray(results) && results.length) {
                            filteredWorkouts = results;
                            renderWorkoutGrid();
                        }
                    })
                    .catch((err) => {
                        console.warn('Search API fallback failed', err);
                    });
            }
        }
        renderWorkoutGrid();
    };

    const buildWorkoutLibrary = (profile) => {
        if (!window.FlexPlan) {
            workoutLibrary = [];
            applyWorkoutFilters();
            return;
        }
        const goalInput = profile?.goal || 'general fitness';
        let programWindow = [];
        try {
            programWindow =
                window.FlexPlan.buildProgramWindow(goalInput, 1, 28, { startDate: new Date() }) || [];
        } catch (err) {
            console.warn('Unable to build workout library', err);
            workoutLibrary = [];
            applyWorkoutFilters();
            return;
        }
        const seen = new Map();
        const library = [];
        const categoryOverrides = getExerciseVideoCategoryOverrides();
        programWindow.forEach(({ workoutDay }) => {
            if (!workoutDay?.exercises?.length) return;
            workoutDay.exercises.forEach((exercise) => {
                const levelLabel = workoutDay.level || exercise.level || '';
                const nameKey = normalizeKey(exercise.name || '');
                const key = `${normalizeKey(levelLabel)}::${nameKey}`;
                if (seen.has(key)) return;
                const overrideCategories = nameKey ? categoryOverrides.get(nameKey) : null;
                const categories = deriveExerciseCategories(
                    overrideCategories || exercise.categories,
                    [exercise.name, exercise.prescription, workoutDay.dayOfWeek, workoutDay.goal || ''],
                    exercise.tags
                );
                const tags = Array.isArray(exercise.tags) ? Array.from(new Set(exercise.tags)) : [];
                library.push({
                    id: exercise.id || key,
                    name: exercise.name || 'Workout',
                    prescription: exercise.prescription || '',
                    level: levelLabel,
                    intensity: workoutDay.intensity || '',
                    categories,
                    tags,
                    video: exercise.video || null,
                    videoEmbed: exercise.videoEmbed || null,
                    targetBurn: Number(exercise.targetBurn || workoutDay.burn || 0),
                    dayOfWeek: workoutDay.dayOfWeek || '',
                    sourceDay: workoutDay.dayNumber || null
                });
                seen.set(key, true);
            });
        });
        const levelOrder = { beginner: 0, intermediate: 1, advanced: 2 };
        library.sort((a, b) => {
            const levelA = levelOrder[String(a.level || '').toLowerCase()] ?? 3;
            const levelB = levelOrder[String(b.level || '').toLowerCase()] ?? 3;
            if (levelA !== levelB) return levelA - levelB;
            return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        });
        workoutLibrary = library;
        applyWorkoutFilters();
    };

    const loadCompletionState = () => {
        try {
            const raw = window.localStorage?.getItem(WORKOUT_COMPLETION_STORAGE_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                const looksLegacy = Object.values(parsed).every(
                    (value) => value && typeof value === 'object' && 'logged' in value
                );
                return looksLegacy ? { anonymous: parsed } : parsed;
            }
        } catch (err) {
            console.warn('Failed to read stored workout completions', err);
        }
        return {};
    };

    const persistCompletionState = (state) => {
        try {
            window.localStorage?.setItem(WORKOUT_COMPLETION_STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
            console.warn('Failed to persist workout completions', err);
        }
    };

    const fetchWorkoutCompletionsFromServer = async () => {
        if (!currentUserId) return [];
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90);
        const startIso = toISODate(start);
        const endIso = toISODate(today);
        try {
            const res = await fetch(`/api/workout-completions?start=${startIso}&end=${endIso}`);
            if (!res.ok) return [];
            const data = await res.json();
            return Array.isArray(data?.entries) ? data.entries : [];
        } catch (err) {
            console.warn('Failed to load workout completions from server', err);
            return [];
        }
    };

    const persistWorkoutCompletionToServer = async (dateIso, logged) => {
        if (!currentUserId || !dateIso) return;
        try {
            await fetch('/api/workout-completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entries: [
                        logged
                            ? { workout_date: dateIso, logged: true }
                            : { workout_date: dateIso, logged: false }
                    ]
                })
            });
        } catch (err) {
            console.warn('Failed to persist workout completion', err);
        }
    };

    const syncWorkoutCompletionsFromServer = async () => {
        if (!currentUserId) return;
        const serverEntries = await fetchWorkoutCompletionsFromServer();
        const state = loadCompletionState();
        const bucket = state[currentUserKey] && typeof state[currentUserKey] === 'object' ? state[currentUserKey] : {};

        serverEntries.forEach((entry) => {
            const date = entry?.workout_date;
            if (!date) return;
            if (!bucket[date]) {
                bucket[date] = { logged: true, loggedAt: new Date().toISOString() };
            } else if (!bucket[date].logged) {
                bucket[date].logged = true;
            }
        });

        state[currentUserKey] = bucket;
        persistCompletionState(state);

        const localEntries = Object.entries(bucket)
            .filter(([, info]) => info?.logged)
            .map(([date]) => ({ workout_date: date, logged: true }));
        if (localEntries.length) {
            await fetch('/api/workout-completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entries: localEntries })
            });
        }
    };

    const loadExerciseCompletionState = () => {
        try {
            const raw = window.localStorage?.getItem(WORKOUT_EXERCISE_COMPLETION_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch (err) {
            console.warn('Failed to read exercise completion state', err);
        }
        return {};
    };

    const persistExerciseCompletionState = (state) => {
        try {
            window.localStorage?.setItem(WORKOUT_EXERCISE_COMPLETION_KEY, JSON.stringify(state));
        } catch (err) {
            console.warn('Failed to persist exercise completion state', err);
        }
    };

    const loadActiveDayState = () => {
        const raw = window.localStorage?.getItem(WORKOUT_ACTIVE_DAY_STORAGE_KEY);
        if (!raw) return {};
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === 'string') {
                return { anonymous: parsed };
            }
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed;
            }
        } catch (err) {
            if (typeof raw === 'string' && raw.trim()) {
                return { anonymous: raw.trim() };
            }
            console.warn('Failed to read active workout day', err);
        }
        return {};
    };

    const persistActiveDayState = (state) => {
        try {
            window.localStorage?.setItem(WORKOUT_ACTIVE_DAY_STORAGE_KEY, JSON.stringify(state));
        } catch (err) {
            console.warn('Failed to persist active workout day', err);
        }
    };

    const ensureUserBucket = (state, create = false) => {
        const key = getCurrentUserKey();
        let bucket = state[key];
        if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket)) {
            if (create) {
                bucket = {};
                state[key] = bucket;
            } else {
                bucket = {};
            }
        }
        return { bucket, key };
    };

    const getExerciseStorageKey = (exercise, index) => {
        if (!exercise) return `exercise-${index}`;
        if (exercise.id) return String(exercise.id);
        const name = String(exercise.name || '').trim();
        const prescription = String(exercise.prescription || '').trim();
        const fallback = `${name}::${prescription}::${index}`;
        return normalizeKey(fallback) || `exercise-${index}`;
    };

    const getStoredExerciseCompletions = (dateIso) => {
        if (!dateIso) return {};
        const state = loadExerciseCompletionState();
        const { bucket } = ensureUserBucket(state, false);
        const byDate = bucket?.[dateIso];
        if (!byDate || typeof byDate !== 'object' || Array.isArray(byDate)) {
            return {};
        }
        return byDate;
    };

    const setStoredExerciseCompletion = (dateIso, exerciseKey, completed) => {
        if (!dateIso || !exerciseKey) return;
        const state = loadExerciseCompletionState();
        const { bucket, key } = ensureUserBucket(state, true);
        const dayBucket = bucket[dateIso] && typeof bucket[dateIso] === 'object' ? bucket[dateIso] : {};
        if (completed) {
            dayBucket[exerciseKey] = true;
        } else {
            delete dayBucket[exerciseKey];
        }
        bucket[dateIso] = dayBucket;
        state[key] = bucket;
        persistExerciseCompletionState(state);
    };

    const clearStoredExerciseCompletions = (dateIso) => {
        if (!dateIso) return;
        const state = loadExerciseCompletionState();
        const { bucket, key } = ensureUserBucket(state, true);
        if (bucket[dateIso]) {
            delete bucket[dateIso];
            state[key] = bucket;
            persistExerciseCompletionState(state);
        }
    };

    const applyStoredExerciseCompletions = (workoutDay) => {
        if (!workoutDay || !Array.isArray(workoutDay.exercises)) return;
        const dateIso = workoutDay.dateIso;
        const stored = getStoredExerciseCompletions(dateIso);
        workoutDay.exercises.forEach((exercise, index) => {
            const key = getExerciseStorageKey(exercise, index);
            if (stored[key]) {
                exercise.completed = true;
            }
        });
    };

    const getStoredActiveDay = () => {
        const state = loadActiveDayState();
        const key = getCurrentUserKey();
        const value = state?.[key];
        return typeof value === 'string' && value.trim() ? value.trim() : null;
    };

    const setStoredActiveDay = (iso) => {
        if (!iso) return;
        const state = loadActiveDayState();
        const key = getCurrentUserKey();
        state[key] = iso;
        persistActiveDayState(state);
    };

    const clearStoredActiveDay = () => {
        const state = loadActiveDayState();
        const key = getCurrentUserKey();
        if (state[key]) {
            delete state[key];
            persistActiveDayState(state);
        }
    };

    const markStoredCompletion = (dateIso, logged) => {
        if (!dateIso) return;
        const state = loadCompletionState();
        const { bucket, key } = ensureUserBucket(state, true);
        if (logged) {
            bucket[dateIso] = {
                logged: true,
                loggedAt: new Date().toISOString()
            };
            setStoredActiveDay(dateIso);
            window.FFStreak?.recordWorkout(dateIso, true);
        } else {
            delete bucket[dateIso];
            clearStoredExerciseCompletions(dateIso);
            const activeDay = getStoredActiveDay();
            if (activeDay === dateIso) {
                clearStoredActiveDay();
            }
            window.FFStreak?.recordWorkout(dateIso, false);
            removeWorkoutHistoryEntry(dateIso);
        }
        const entries = Object.entries(bucket).sort((a, b) =>
            String(b[1]?.loggedAt || '').localeCompare(String(a[1]?.loggedAt || ''))
        );
        const trimmed = {};
        entries.slice(0, 14).forEach(([iso, info]) => {
            trimmed[iso] = info;
        });
        state[key] = trimmed;
        persistCompletionState(state);
        persistWorkoutCompletionToServer(dateIso, logged);
    };

    const hasStoredCompletion = (dateIso) => {
        if (!dateIso) return false;
        const state = loadCompletionState();
        const { bucket } = ensureUserBucket(state, false);
        return Boolean(bucket[dateIso]?.logged);
    };

    const updateCurrentUserContext = (userId) => {
        const nextId = userId || null;
        const nextKey = nextId ? `user:${nextId}` : 'anonymous';
        if (nextKey === currentUserKey) {
            currentUserId = nextId;
            window.FFStreak?.init(nextId);
            return;
        }

        const completionState = loadCompletionState();
        if (currentUserKey === 'anonymous' && completionState.anonymous && nextId) {
            const existingBucket =
                completionState[nextKey] && typeof completionState[nextKey] === 'object'
                    ? completionState[nextKey]
                    : {};
            completionState[nextKey] = { ...existingBucket, ...completionState.anonymous };
            delete completionState.anonymous;
            persistCompletionState(completionState);
        }

        const activeState = loadActiveDayState();
        if (currentUserKey === 'anonymous' && activeState.anonymous && nextId) {
            activeState[nextKey] = activeState.anonymous;
            delete activeState.anonymous;
            persistActiveDayState(activeState);
        }

        currentUserId = nextId;
        currentUserKey = nextKey;
        window.FFStreak?.init(nextId);
        syncWorkoutCompletionsFromServer();
        syncActivePlanDayFromServer();
        syncMealCompletionsFromServer();
    };

    const toISODate = (date) => {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
        return date.toISOString().slice(0, 10);
    };

    const parseISODate = (value) => {
        if (value instanceof Date) return new Date(value.getTime());
        if (typeof value !== 'string') return null;
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const getActivePlanStorageKey = () => `${ACTIVE_DAY_STORAGE_KEY}.${getCurrentUserKey()}`;

    const readActivePlanDay = () => {
        try {
            const raw = window.localStorage?.getItem(getActivePlanStorageKey());
            return raw && typeof raw === 'string' ? raw : null;
        } catch (err) {
            return null;
        }
    };

    const writeActivePlanDay = (iso) => {
        if (!iso) return;
        try {
            window.localStorage?.setItem(getActivePlanStorageKey(), iso);
        } catch (err) {
            /* ignore */
        }
        persistActivePlanDayToServer(iso);
    };

    const fetchActivePlanDayFromServer = async () => {
        if (!currentUserId) return null;
        try {
            const res = await fetch('/api/active-day');
            if (!res.ok) return null;
            const data = await res.json();
            return data?.active_date || null;
        } catch (err) {
            console.warn('Failed to load active day from server', err);
            return null;
        }
    };

    const persistActivePlanDayToServer = async (iso) => {
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

    const syncActivePlanDayFromServer = async () => {
        const localIso = readActivePlanDay();
        const serverIso = await fetchActivePlanDayFromServer();
        const todayIso = toISODate(new Date());
        const candidates = [localIso, serverIso].filter(Boolean);
        if (!candidates.length) return null;
        let chosen = candidates.sort().pop();
        if (todayIso && chosen > todayIso) chosen = todayIso;
        if (chosen) {
            writeActivePlanDay(chosen);
            if (serverIso !== chosen) {
                await persistActivePlanDayToServer(chosen);
            }
        }
        return chosen;
    };

    const shiftIsoDate = (iso, days) => {
        const base = parseISODate(iso);
        if (!(base instanceof Date) || Number.isNaN(base.getTime())) return null;
        const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
        return toISODate(next);
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
            return null;
        }
    };

    const loadMealOverrides = () => {
        try {
            const raw = window.localStorage?.getItem(MEAL_CUSTOM_PLAN_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (err) {
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
        const completionKey = `${MEAL_COMPLETION_PREFIX}.${getCurrentUserKey() || 'anonymous'}`;
        try {
            const raw = window.localStorage?.getItem(completionKey);
            const parsed = raw ? JSON.parse(raw) : null;
            const completedIds = Array.isArray(parsed?.[dateIso]) ? parsed[dateIso] : [];
            return new Set(completedIds);
        } catch (err) {
            return new Set();
        }
    };

    const syncMealCompletionsFromServer = async () => {
        if (!currentUserId) return;
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 90);
        const startIso = toISODate(start);
        const endIso = toISODate(today);
        const completionKey = `${MEAL_COMPLETION_PREFIX}.${getCurrentUserKey() || 'anonymous'}`;
        try {
            const res = await fetch(`/api/meal-completions?start=${startIso}&end=${endIso}`);
            if (!res.ok) return;
            const data = await res.json();
            const entries = Array.isArray(data?.entries) ? data.entries : [];
            const raw = window.localStorage?.getItem(completionKey);
            const state = raw ? JSON.parse(raw) : {};

            entries.forEach((entry) => {
                const date = entry?.meal_date;
                const mealId = entry?.meal_id;
                if (!date || !mealId) return;
                if (!Array.isArray(state[date])) state[date] = [];
                if (!state[date].includes(mealId)) state[date].push(mealId);
            });

            window.localStorage?.setItem(completionKey, JSON.stringify(state));

            const localEntries = Object.entries(state).flatMap(([date, ids]) =>
                (ids || []).map((mealId) => ({ meal_date: date, meal_id: mealId }))
            );
            if (localEntries.length) {
                await fetch('/api/meal-completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ entries: localEntries })
                });
            }
        } catch (err) {
            console.warn('Failed to sync meal completions', err);
        }
    };

    const isMealDayComplete = (dateIso) => {
        const cachedPlan = getCachedMealPlanForDate(dateIso);
        const meals = (cachedPlan?.meals || []).filter((meal) => meal && !meal.removed);
        if (!meals.length) return true;
        const completionSet = getMealCompletionSet(dateIso);
        return meals.every((meal) => completionSet.has(meal.id));
    };

    const isWorkoutDayComplete = (dateIso) => hasStoredCompletion(dateIso);

    const isActivityDayComplete = (dateIso) => isMealDayComplete(dateIso) && isWorkoutDayComplete(dateIso);

    const resolveActivePlanDate = (today = new Date()) => {
        const todayIso = toISODate(today);
        if (!todayIso) return today;
        let activeIso = readActivePlanDay();
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
        writeActivePlanDay(activeIso);
        return parseISODate(activeIso) || today;
    };

    const differenceInDays = (start, end) => {
        const a = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        const diffMs = b.getTime() - a.getTime();
        return Math.round(diffMs / (1000 * 60 * 60 * 24));
    };

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const formatDisplayDate = (value) => {
        const baseDate =
            value instanceof Date
                ? value
                : typeof value === 'string'
                ? new Date(value)
                : new Date();
        if (Number.isNaN(baseDate.getTime())) {
            return null;
        }
        return baseDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const updateTodayLabel = (value) => {
        if (!todayLabelEl) return;
        const formatted = formatDisplayDate(value) || 'Today';
        todayLabelEl.textContent = formatted;
    };
    updateTodayLabel();

    const scheduleDayRolloverRefresh = () => {
        const currentDay = toISODate(new Date());
        const refresh = () => window.location.reload();
        const now = new Date();
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const msUntil = nextMidnight.getTime() - now.getTime();
        if (Number.isFinite(msUntil) && msUntil > 0) {
            setTimeout(refresh, msUntil + 1000);
        }
        setInterval(() => {
            const latest = toISODate(new Date());
            if (latest && currentDay && latest !== currentDay) {
                refresh();
            }
        }, 60 * 1000);
    };
    scheduleDayRolloverRefresh();

    const renderWorkoutHistory = () => {
        if (!workoutHistoryListEl) return;
        workoutHistoryListEl.innerHTML = '';
        if (!workoutHistoryEntries.length) {
            const empty = document.createElement('li');
            empty.className = 'history-empty';
            empty.textContent = 'No workouts logged yet.';
            workoutHistoryListEl.appendChild(empty);
            return;
        }
        workoutHistoryEntries.forEach((entry) => {
            const item = document.createElement('li');
            item.className = 'history-entry';
            const displayDate = formatDisplayDate(entry.iso) || entry.iso;
            const caloriesLabel = entry.calories ? `${Math.round(entry.calories)} kcal` : 'Logged';
            item.innerHTML = `
                <div>
                    <p class="history-date">${displayDate}</p>
                    <p class="history-status">${caloriesLabel}</p>
                </div>
                <span class="history-badge">Completed</span>
            `;
            workoutHistoryListEl.appendChild(item);
        });
    };

    const setWorkoutHistoryEntries = (entries = []) => {
        const normalized = entries
            .filter((entry) => entry && (entry.iso || entry.date))
            .map((entry) => {
                const iso = entry.iso || toISODate(entry.date);
                return {
                    iso,
                    date: entry.date || parseISODate(iso),
                    calories: Number(entry.calories || 0)
                };
            })
            .filter((entry) => Boolean(entry.iso));
        normalized.sort((a, b) => String(b.iso).localeCompare(String(a.iso)));
        workoutHistoryEntries = normalized.slice(0, WORKOUT_HISTORY_LIMIT);
        renderWorkoutHistory();
    };

    const upsertWorkoutHistoryEntry = (iso, calories) => {
        if (!iso) return;
        const normalizedIso = String(iso).slice(0, 10);
        const entry = {
            iso: normalizedIso,
            date: parseISODate(normalizedIso),
            calories: Number(calories || 0)
        };
        const existing = workoutHistoryEntries.filter((item) => item.iso !== normalizedIso);
        workoutHistoryEntries = [entry, ...existing]
            .sort((a, b) => String(b.iso).localeCompare(String(a.iso)))
            .slice(0, WORKOUT_HISTORY_LIMIT);
        renderWorkoutHistory();
    };

    renderWorkoutHistory();

    const removeWorkoutHistoryEntry = (iso) => {
        if (!iso) return;
        const normalizedIso = String(iso).slice(0, 10);
        const nextEntries = workoutHistoryEntries.filter((entry) => entry.iso !== normalizedIso);
        if (nextEntries.length !== workoutHistoryEntries.length) {
            workoutHistoryEntries = nextEntries;
            renderWorkoutHistory();
        }
    };

    const hideLogSuccessMessage = () => {
        if (!logMessageEl) return;
        logMessageEl.hidden = true;
        logMessageEl.classList.remove('is-visible');
    };

    const showLogSuccessMessage = (dateIso) => {
        if (!logMessageEl) return;
        const todayIso = toISODate(new Date());
        const isToday = dateIso && dateIso === todayIso;
        const label = formatDisplayDate(dateIso) || 'Today';
        logMessageEl.textContent = isToday ? "Today's workout completed!" : `${label} workout completed!`;
        logMessageEl.hidden = false;
        logMessageEl.classList.add('is-visible');
    };

    const ensureYouTubeApi = () => {
        if (youtubeApiReady) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            youtubeReadyQueue.push(resolve);
            if (!youtubeApiLoading) {
                youtubeApiLoading = true;
                const script = document.createElement('script');
                script.src = 'https://www.youtube.com/iframe_api';
                document.head.appendChild(script);
            }
        });
    };

    window.onYouTubeIframeAPIReady = () => {
        youtubeApiReady = true;
        youtubeReadyQueue.splice(0).forEach((cb) => cb());
    };

    const WORKOUT_THUMB_FALLBACK = 'images/athlete-lift.jpg';

    const extractYouTubeId = (url) => {
        if (!url) return null;
        const value = String(url);
        const embedMatch = value.match(/youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]+)/i);
        if (embedMatch) return embedMatch[1];
        const shortsMatch = value.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
        if (shortsMatch) return shortsMatch[1];
        const watchMatch = value.match(/[?&]v=([a-zA-Z0-9_-]+)/i);
        if (watchMatch) return watchMatch[1];
        const shortMatch = value.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
        if (shortMatch) return shortMatch[1];
        const legacyMatch = value.match(/youtube\.com\/v\/([a-zA-Z0-9_-]+)/i);
        if (legacyMatch) return legacyMatch[1];
        return null;
    };

    const getWorkoutThumbnailUrl = (exercise) => {
        const explicitThumbnail = typeof exercise?.thumbnail === 'string' ? exercise.thumbnail.trim() : '';
        if (explicitThumbnail) {
            return explicitThumbnail;
        }
        const youtubeId =
            extractYouTubeId(exercise?.videoEmbed || exercise?.video) ||
            (exercise?.videoId ? String(exercise.videoId).trim() : null);
        if (youtubeId) {
            return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
        }
        return null;
    };

    const applyWorkoutThumbnail = (imgEl, exercise) => {
        if (!imgEl) return;
        const thumbUrl = getWorkoutThumbnailUrl(exercise);
        imgEl.loading = 'eager';
        imgEl.decoding = 'async';
        imgEl.referrerPolicy = 'no-referrer';
        imgEl.src = WORKOUT_THUMB_FALLBACK;
        imgEl.addEventListener(
            'error',
            () => {
                imgEl.src = WORKOUT_THUMB_FALLBACK;
            },
            { once: true }
        );
        if (!thumbUrl) {
            return;
        }
        const preloader = new Image();
        preloader.onload = () => {
            imgEl.src = thumbUrl;
        };
        preloader.onerror = () => {
            imgEl.src = WORKOUT_THUMB_FALLBACK;
        };
        preloader.src = thumbUrl;
    };

    const parsePrescriptionTargets = (prescription) => {
        const text = String(prescription || '').toLowerCase();
        if (!text) return { sets: null, reps: null, durationSec: null };
        let sets = null;
        let reps = null;
        let durationSec = null;

        const setRepMatch = text.match(/(\d+)\s*[x×]\s*(\d+)\s*(s|sec|secs|seconds|m|min|mins|minutes)?/);
        if (setRepMatch) {
            sets = Number(setRepMatch[1]);
            const second = Number(setRepMatch[2]);
            const unit = setRepMatch[3];
            if (unit) {
                const unitLower = unit.toLowerCase();
                const multiplier = unitLower.startsWith('m') ? 60 : 1;
                durationSec = second * multiplier;
            } else {
                reps = second;
            }
        }

        if (!durationSec) {
            const durationMatch = text.match(/(\d+(?:\.\d+)?)\s*(seconds|secs|sec|s|minutes|mins|min|m)\b/);
            if (durationMatch) {
                const value = Number(durationMatch[1]);
                const unit = durationMatch[2].toLowerCase();
                const multiplier = unit.startsWith('m') ? 60 : 1;
                durationSec = value * multiplier;
            }
        }

        if (!reps) {
            const repsMatch = text.match(/(\d+)\s*(?:reps?|rep)\b/);
            if (repsMatch) reps = Number(repsMatch[1]);
        }

        if (!sets) {
            const setsMatch = text.match(/(\d+)\s*(?:sets?|set)\b/);
            if (setsMatch) sets = Number(setsMatch[1]);
        }

        return {
            sets: Number.isFinite(sets) && sets > 0 ? sets : null,
            reps: Number.isFinite(reps) && reps > 0 ? reps : null,
            durationSec: Number.isFinite(durationSec) && durationSec > 0 ? durationSec : null
        };
    };

    const ensureExerciseMetrics = (exercise) => {
        if (!exercise || typeof exercise !== 'object') return null;
        if (!exercise.metrics || typeof exercise.metrics !== 'object') {
            exercise.metrics = {};
        }
        const metrics = exercise.metrics;
        const targets = parsePrescriptionTargets(exercise.prescription);
        if (metrics.targetSets == null && targets.sets != null) metrics.targetSets = targets.sets;
        if (metrics.targetReps == null && targets.reps != null) metrics.targetReps = targets.reps;
        if (metrics.targetDurationSec == null && targets.durationSec != null) {
            metrics.targetDurationSec = targets.durationSec;
        }
        if (metrics.performedSets == null && metrics.targetSets != null) metrics.performedSets = metrics.targetSets;
        if (metrics.performedReps == null && metrics.targetReps != null) metrics.performedReps = metrics.targetReps;
        if (!Number.isFinite(Number(metrics.watchedSeconds))) metrics.watchedSeconds = 0;
        return metrics;
    };

    const updateExerciseWatchMetrics = (exercise, { durationSec, watchedIncrement, forceComplete } = {}) => {
        const metrics = ensureExerciseMetrics(exercise);
        if (!metrics) return null;
        if (Number.isFinite(Number(durationSec)) && durationSec > 0) {
            metrics.videoDurationSec = Number(durationSec);
        }
        if (Number.isFinite(Number(watchedIncrement)) && watchedIncrement > 0) {
            metrics.watchedSeconds = (metrics.watchedSeconds || 0) + Number(watchedIncrement);
        }
        if (metrics.videoDurationSec && metrics.watchedSeconds != null) {
            metrics.percentWatched = Math.min(
                100,
                Math.round((Number(metrics.watchedSeconds) / Number(metrics.videoDurationSec)) * 100)
            );
        }
        if (forceComplete) {
            metrics.percentWatched = 100;
        }
        if (Number.isFinite(Number(metrics.percentWatched))) {
            metrics.completed = metrics.percentWatched >= VIDEO_COMPLETION_THRESHOLD * 100;
        }
        if (metrics.completed && !metrics.completedAt) {
            metrics.completedAt = new Date().toISOString();
        }
        if (currentWorkoutDay?.dateIso) {
            const now = Date.now();
            if (now - lastWorkoutCacheSaveAt > 2000) {
                lastWorkoutCacheSaveAt = now;
                saveWorkoutDayCache(currentWorkoutDay);
            }
        }
        return metrics;
    };

    const stopVideoWatchTracking = () => {
        if (activeVideoWatchTimer) {
            clearInterval(activeVideoWatchTimer);
            activeVideoWatchTimer = null;
        }
        activeVideoLastTick = null;
        if (currentWorkoutDay?.dateIso) {
            saveWorkoutDayCache(currentWorkoutDay);
        }
    };

    const startVideoWatchTracking = (exercise, getDurationFn) => {
        stopVideoWatchTracking();
        if (!exercise) return;
        ensureExerciseMetrics(exercise);
        activeVideoLastTick = Date.now();
        activeVideoWatchTimer = setInterval(() => {
            if (!activeVideoLastTick) {
                activeVideoLastTick = Date.now();
                return;
            }
            const now = Date.now();
            const delta = (now - activeVideoLastTick) / 1000;
            activeVideoLastTick = now;
            const duration = typeof getDurationFn === 'function' ? Number(getDurationFn()) : null;
            updateExerciseWatchMetrics(exercise, { durationSec: duration, watchedIncrement: delta });
        }, 1000);
    };

    const mapVideoLibraryItemToWorkout = (item) => {
        if (!item || !item.exercise) return null;
        const categories = deriveExerciseCategories(
            [item.categorySlug || item.category],
            [item.exercise, item.prescription],
            item.keywords
        );
        const tags = Array.isArray(item.keywords)
            ? item.keywords.filter((token) => typeof token === 'string' && token.trim().length)
            : [];
        if (item.category) {
            tags.push(String(item.category));
        }
        const youtubeId = extractYouTubeId(item.video) || (item.videoId ? String(item.videoId).trim() : null);
        const videoUrl = item.video || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : null);
        const libraryId = item.id ? `video-${item.id}` : `video-${normalizeKey(item.exercise)}`;
        return {
            id: libraryId,
            name: item.exercise,
            prescription: item.prescription || '',
            level: item.level || 'All Levels',
            intensity: item.intensity || '',
            categories,
            tags: Array.from(new Set(tags)),
            video: videoUrl,
            videoEmbed: youtubeId ? `https://www.youtube.com/embed/${youtubeId}?rel=0` : null,
            targetBurn: Number.isFinite(item.baseBurn) ? Math.max(0, Math.round(item.baseBurn)) : null,
            dayOfWeek: '',
            sourceDay: null,
            librarySource: 'video-library'
        };
    };

    const integrateExerciseVideoLibrary = (items) => {
        if (!Array.isArray(items)) return;
        const mapped = items.map(mapVideoLibraryItemToWorkout).filter(Boolean);
        supplementalWorkouts = mapped;
        exerciseVideoCategoryOverrides = null;
        if (Array.isArray(workoutLibrary) && workoutLibrary.length) {
            const categoryOverrides = getExerciseVideoCategoryOverrides();
            if (categoryOverrides.size) {
                workoutLibrary = workoutLibrary.map((exercise) => {
                    if (!exercise) return exercise;
                    const nameKey = normalizeKey(exercise.name || '');
                    const overrideCategories = nameKey ? categoryOverrides.get(nameKey) : null;
                    if (!overrideCategories) return exercise;
                    return { ...exercise, categories: overrideCategories.slice() };
                });
            }
        }
        if (currentWorkoutDay?.exercises?.length) {
            applyExerciseVideoOverrides(currentWorkoutDay);
        }
        if (selectedViewFilter === 'all' || searchQuery) {
            applyWorkoutFilters();
        }
    };

    const buildExerciseVideoOverrideMap = () => {
        const map = new Map();
        const library = Array.isArray(supplementalWorkouts) ? supplementalWorkouts : [];
        library.forEach((item) => {
            const nameKey = normalizeKey(item?.name || item?.exercise);
            if (!nameKey || map.has(nameKey)) return;
            const url = item?.video || item?.videoEmbed || null;
            if (url) {
                map.set(nameKey, url);
            }
        });
        return map;
    };

    const getExerciseVideoCategoryOverrides = () => {
        if (exerciseVideoCategoryOverrides instanceof Map) {
            return exerciseVideoCategoryOverrides;
        }
        const map = new Map();
        const library = Array.isArray(supplementalWorkouts) ? supplementalWorkouts : [];
        library.forEach((item) => {
            const nameKey = normalizeKey(item?.name || item?.exercise || '');
            if (!nameKey || map.has(nameKey)) return;
            const categories = Array.isArray(item?.categories) ? item.categories.filter(Boolean) : [];
            if (categories.length) {
                map.set(nameKey, categories.slice());
            }
        });
        exerciseVideoCategoryOverrides = map;
        return map;
    };

    const applyExerciseVideoOverrides = (day) => {
        if (!day || !Array.isArray(day.exercises)) return;
        const overrides = buildExerciseVideoOverrideMap();
        const categoryOverrides = getExerciseVideoCategoryOverrides();
        if (!overrides.size && !categoryOverrides.size) return;
        day.exercises = day.exercises.map((exercise) => {
            if (!exercise) return exercise;
            const nameKey = normalizeKey(exercise.name || exercise.exercise || '');
            const hasVideoOverride = nameKey && overrides.has(nameKey);
            const overrideCategories = nameKey ? categoryOverrides.get(nameKey) : null;
            if (!hasVideoOverride && !overrideCategories) return exercise;
            const url = hasVideoOverride ? overrides.get(nameKey) : exercise.video;
            const youtubeId = extractYouTubeId(url);
            return {
                ...exercise,
                video: url,
                videoEmbed: youtubeId ? `https://www.youtube.com/embed/${youtubeId}?rel=0` : exercise.videoEmbed,
                categories: Array.isArray(overrideCategories) ? overrideCategories.slice() : exercise.categories
            };
        });
    };

    const ensureExerciseVideoLibrary = async () => {
        if (exerciseVideoLibraryLoaded) {
            return supplementalWorkouts;
        }
        if (exerciseVideoLibraryPromise) {
            return exerciseVideoLibraryPromise;
        }
        exerciseVideoLibraryPromise = (async () => {
            try {
                exerciseVideoLibraryError = null;
                const refreshParam = exerciseVideoLibraryLoaded ? '' : '&refresh=1';
                const response = await fetch(`/api/workout-videos?limit=500${refreshParam}`);
                if (!response.ok) {
                    let details = `Request failed with status ${response.status}`;
                    try {
                        const errorPayload = await response.json();
                        if (errorPayload?.details) {
                            details = errorPayload.details;
                        } else if (errorPayload?.error) {
                            details = errorPayload.error;
                        }
                    } catch (err) {
                        // Ignore JSON parse failures; we already have a status fallback.
                    }
                    throw new Error(details);
                }
                const payload = await response.json();
                if (!Array.isArray(payload?.items)) {
                    throw new Error('Invalid exercise video payload');
                }
                integrateExerciseVideoLibrary(payload.items);
                exerciseVideoLibraryLoaded = true;
                return supplementalWorkouts;
            } catch (err) {
                exerciseVideoLibraryError =
                    err instanceof Error && err.message ? err.message : 'Unable to load exercise video library';
                console.warn('Unable to load exercise video library', err);
                if (selectedViewFilter === 'all') {
                    applyWorkoutFilters();
                }
                throw err;
            } finally {
                exerciseVideoLibraryPromise = null;
            }
        })();
        return exerciseVideoLibraryPromise;
    };
    const fetchProfileGoal = async () => {
        try {
            const response = await fetch('/api/me');
            if (response.status === 401) {
                const bootstrapResult = await (window.FFSupa?.bootstrapSessionFromSupabase?.() ?? Promise.resolve({ ok: false }));
                if (bootstrapResult?.ok) {
                    return fetchProfileGoal();
                }
                if (bootstrapResult?.reason === 'missing-account') {
                    window.location.href = 'health.html';
                    return {};
                }
                window.location.href = 'login.html';
                return {};
            }
            if (response.ok) {
                const payload = await response.json();
                updateCurrentUserContext(payload?.user?.id || null);
                return payload?.user?.profile || {};
            }
        } catch (err) {
            console.warn('Unable to load profile for workouts', err);
        }
        return { goal: 'General Fitness' };
    };

    const fetchWorkoutHistory = async () => {
        try {
            const res = await fetch('/api/workouts/activity');
            if (!res.ok) {
                return [];
            }
            const payload = await res.json();
            if (Array.isArray(payload.entries)) {
                return payload.entries;
            }
        } catch (err) {
            console.warn('Unable to load workout history', err);
        }
        return [];
    };

    const renderMainExercise = (index) => {
        if (!currentWorkoutDay || !Array.isArray(currentWorkoutDay.exercises)) return;
        const exercise = currentWorkoutDay.exercises[index];
        if (!exercise) return;
        cleanupActivePlayers();
        selectedExerciseIndex = index;
        currentExerciseIndex = index;
        currentExercise = exercise;
        ensureExerciseMetrics(currentExercise);
        if (typeof exercise.completed !== 'boolean') {
            exercise.completed = false;
        }

        if (mainTitleEl) {
            mainTitleEl.textContent = exercise.name || 'Workout';
        }
        if (mainPrescriptionEl) {
            mainPrescriptionEl.textContent = exercise.prescription || '';
        }
        if (mainIntensityEl) {
            const levelLabel = currentWorkoutDay.level ? `${currentWorkoutDay.level}` : '';
            const intensityLabel = currentWorkoutDay.intensity
                ? currentWorkoutDay.intensity.charAt(0).toUpperCase() + currentWorkoutDay.intensity.slice(1)
                : '';
            mainIntensityEl.textContent = [levelLabel, intensityLabel].filter(Boolean).join(' • ');
        }
        if (mainBurnEl) {
            const burnTarget = Number.isFinite(exercise.targetBurn) ? Math.max(0, Math.round(exercise.targetBurn)) : null;
            mainBurnEl.textContent = burnTarget ? `≈ ${burnTarget} kcal` : '';
        }

        if (mainMediaEl) {
            mainMediaEl.innerHTML = '';
            const placeholder = document.createElement('p');
            placeholder.className = 'empty-message';
            if (exercise.videoEmbed || exercise.video) {
                placeholder.textContent = 'Press "Watch Video" to play the tutorial here.';
            } else {
                placeholder.textContent = 'Video preview unavailable for this movement.';
            }
            mainMediaEl.appendChild(placeholder);
        }

        if (mainWatchLink) {
            const hasVideo = Boolean(exercise.videoEmbed || exercise.video);
            mainWatchLink.hidden = !hasVideo;
            mainWatchLink.disabled = !hasVideo;
            mainWatchLink.setAttribute('aria-disabled', hasVideo ? 'false' : 'true');
        }

        if (workoutListEl) {
            Array.from(workoutListEl.children).forEach((node, idx) => {
                node.classList.toggle('active', idx === index);
                node.setAttribute('aria-current', idx === index ? 'true' : 'false');
                const exerciseRef = currentWorkoutDay.exercises[idx];
                if (exerciseRef?.completed) {
                    node.classList.add('completed');
                } else {
                    node.classList.remove('completed');
                }
            });
        }

        updateLogButtonState();
    };

    const cleanupActivePlayers = () => {
        stopVideoWatchTracking();
        if (activeVideoElement) {
            activeVideoElement.pause?.();
            activeVideoElement.removeEventListener('ended', handleVideoEnded);
            activeVideoElement = null;
        }
        if (activeYouTubePlayer) {
            try {
                activeYouTubePlayer.stopVideo();
                activeYouTubePlayer.destroy();
            } catch {
                /* no-op */
            }
            activeYouTubePlayer = null;
        }
    };

    const previewExercise = (exercise) => {
        if (!exercise) return;
        cleanupActivePlayers();
        currentExercise = { ...exercise };
        ensureExerciseMetrics(currentExercise);
        currentExerciseIndex = null;
        selectedExerciseIndex = -1;
        if (mainTitleEl) {
            mainTitleEl.textContent = exercise.name || 'Workout';
        }
        if (mainPrescriptionEl) {
            mainPrescriptionEl.textContent = exercise.prescription || '';
        }
        if (mainIntensityEl) {
            const metaSegments = [];
            if (exercise.level) {
                metaSegments.push(formatLevelLabel(exercise.level));
            }
            if (exercise.intensity) {
                metaSegments.push(exercise.intensity);
            }
            if (Array.isArray(exercise.categories) && exercise.categories.length) {
                metaSegments.push(
                    exercise.categories
                        .map((cat) => formatCategoryLabel(cat))
                        .slice(0, 2)
                        .join(', ')
                );
            }
            mainIntensityEl.textContent = metaSegments.filter(Boolean).join(' • ');
        }
        if (mainBurnEl) {
            const burnTarget = Number.isFinite(exercise.targetBurn)
                ? Math.max(0, Math.round(exercise.targetBurn))
                : '';
            mainBurnEl.textContent = burnTarget ? `≈ ${burnTarget} kcal` : '';
        }
        if (mainMediaEl) {
            mainMediaEl.innerHTML = '';
            const placeholder = document.createElement('p');
            placeholder.className = 'empty-message';
            if (exercise.videoEmbed || exercise.video) {
                placeholder.textContent = 'Press "Watch Video" to play the tutorial here.';
            } else {
                placeholder.textContent = 'Video preview unavailable for this movement.';
            }
            mainMediaEl.appendChild(placeholder);
        }
        if (mainWatchLink) {
            const hasVideo = Boolean(exercise.videoEmbed || exercise.video);
            mainWatchLink.hidden = !hasVideo;
            mainWatchLink.disabled = !hasVideo;
            mainWatchLink.setAttribute('aria-disabled', hasVideo ? 'false' : 'true');
        }
    };

    const playCurrentExerciseVideo = () => {
        if (!currentExercise || !mainMediaEl) return;
        cleanupActivePlayers();
        mainMediaEl.innerHTML = '';

        const youtubeId = extractYouTubeId(currentExercise.videoEmbed || currentExercise.video);
        if (youtubeId) {
            const containerId = `yt-player-${Date.now()}`;
            const container = document.createElement('div');
            container.id = containerId;
            container.className = 'yt-embed-player';
            mainMediaEl.appendChild(container);
            ensureYouTubeApi().then(() => {
                const containerEl = document.getElementById(containerId);
                if (!containerEl) {
                    return;
                }
                cleanupActivePlayers();
                activeYouTubePlayer = new YT.Player(containerId, {
                    videoId: youtubeId,
                    playerVars: {
                        autoplay: 1,
                        rel: 0,
                        modestbranding: 1
                    },
                    events: {
                        onStateChange: (event) => {
                            if (event.data === YT.PlayerState.PLAYING) {
                                startVideoWatchTracking(currentExercise, () => event.target?.getDuration?.());
                            }
                            if (
                                event.data === YT.PlayerState.PAUSED ||
                                event.data === YT.PlayerState.BUFFERING ||
                                event.data === YT.PlayerState.CUED
                            ) {
                                stopVideoWatchTracking();
                            }
                            if (event.data === YT.PlayerState.ENDED) {
                                stopVideoWatchTracking();
                                updateExerciseWatchMetrics(currentExercise, {
                                    durationSec: event.target?.getDuration?.(),
                                    forceComplete: true
                                });
                                handleVideoEnded();
                            }
                        }
                    }
                });
            });
            return;
        }

        if (currentExercise.video) {
            const videoEl = document.createElement('video');
            videoEl.src = currentExercise.video;
            videoEl.controls = true;
            videoEl.autoplay = true;
            videoEl.playsInline = true;
            videoEl.style.width = '100%';
            videoEl.style.maxHeight = '360px';
            videoEl.addEventListener('play', () => {
                startVideoWatchTracking(currentExercise, () => videoEl.duration);
            });
            videoEl.addEventListener('pause', () => {
                stopVideoWatchTracking();
            });
            videoEl.addEventListener(
                'ended',
                () => {
                    stopVideoWatchTracking();
                    updateExerciseWatchMetrics(currentExercise, { durationSec: videoEl.duration, forceComplete: true });
                    handleVideoEnded();
                },
                { once: true }
            );
            mainMediaEl.appendChild(videoEl);
            activeVideoElement = videoEl;
            videoEl.focus();
            return;
        }

        if (currentExercise.videoEmbed) {
            const iframe = document.createElement('iframe');
            iframe.src = currentExercise.videoEmbed;
            iframe.title = `${currentExercise.name} tutorial`;
            iframe.width = '100%';
            iframe.height = '315';
            iframe.loading = 'lazy';
            iframe.allow =
                'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            iframe.allowFullscreen = true;
            mainMediaEl.appendChild(iframe);
            return;
        }

        const placeholder = document.createElement('p');
        placeholder.className = 'empty-message';
        placeholder.textContent = 'Video preview unavailable for this movement.';
        mainMediaEl.appendChild(placeholder);
    };

    const updateLogButtonState = () => {
        if (!logWorkoutButton) return;
        if (!currentWorkoutDay) {
            logWorkoutButton.hidden = true;
            logWorkoutButton.disabled = true;
            logWorkoutButton.classList.remove('is-logged', 'is-ready');
            logWorkoutButton.textContent = 'Log Completed';
            logWorkoutButton.setAttribute('aria-disabled', 'true');
            hideLogSuccessMessage();
            return;
        }

        logWorkoutButton.hidden = false;

        if (isLoggingWorkout) {
            logWorkoutButton.textContent = 'Logging...';
            logWorkoutButton.disabled = true;
            logWorkoutButton.classList.remove('is-logged', 'is-ready');
            logWorkoutButton.setAttribute('aria-disabled', 'true');
            return;
        }

        if (currentWorkoutDay.isFuture) {
            logWorkoutButton.textContent = 'Upcoming';
            logWorkoutButton.disabled = true;
            logWorkoutButton.classList.remove('is-logged', 'is-ready');
            logWorkoutButton.setAttribute('aria-disabled', 'true');
            hideLogSuccessMessage();
            return;
        }

        const logged = Boolean(currentWorkoutDay.logged);
        const allCompleted =
            Array.isArray(currentWorkoutDay.exercises) &&
            currentWorkoutDay.exercises.length > 0 &&
            currentWorkoutDay.exercises.every((exercise) => exercise.completed);

        logWorkoutButton.textContent = 'Log Completed';
        logWorkoutButton.disabled = logged;
        logWorkoutButton.setAttribute('aria-disabled', logged ? 'true' : 'false');
        logWorkoutButton.classList.toggle('is-logged', logged);
        logWorkoutButton.classList.toggle('is-ready', allCompleted && !logged);
        if (logged) {
            showLogSuccessMessage(currentWorkoutDay.dateIso);
        } else {
            hideLogSuccessMessage();
        }
    };

    const prepareWorkoutForLog = (exercise) => {
        if (!exercise || typeof exercise !== 'object') return null;
        const metrics = ensureExerciseMetrics(exercise);
        if (metrics) {
            if (!Number.isFinite(Number(metrics.percentWatched)) && metrics.videoDurationSec && metrics.watchedSeconds != null) {
                metrics.percentWatched = Math.min(
                    100,
                    Math.round((Number(metrics.watchedSeconds) / Number(metrics.videoDurationSec)) * 100)
                );
            }
            const completedFlag = typeof exercise.completed === 'boolean' ? exercise.completed : null;
            if (!Number.isFinite(Number(metrics.percentWatched)) && completedFlag) {
                metrics.percentWatched = 100;
            }
            if (!Number.isFinite(Number(metrics.watchedSeconds)) && completedFlag) {
                if (Number.isFinite(Number(metrics.videoDurationSec))) {
                    metrics.watchedSeconds = Number(metrics.videoDurationSec);
                } else if (Number.isFinite(Number(metrics.targetDurationSec))) {
                    metrics.watchedSeconds = Number(metrics.targetDurationSec);
                    metrics.videoDurationSec = Number(metrics.targetDurationSec);
                }
            }
            if (Number.isFinite(Number(metrics.percentWatched))) {
                metrics.completed = metrics.percentWatched >= VIDEO_COMPLETION_THRESHOLD * 100;
            } else if (completedFlag != null) {
                metrics.completed = completedFlag;
            }
        }
        return {
            ...exercise,
            targetSets: metrics?.targetSets ?? exercise.targetSets ?? null,
            targetReps: metrics?.targetReps ?? exercise.targetReps ?? null,
            targetDurationSec: metrics?.targetDurationSec ?? exercise.targetDurationSec ?? null,
            performedSets: metrics?.performedSets ?? exercise.performedSets ?? null,
            performedReps: metrics?.performedReps ?? exercise.performedReps ?? null,
            performedWeight: metrics?.performedWeight ?? exercise.performedWeight ?? null,
            watchedSeconds: metrics?.watchedSeconds ?? exercise.watchedSeconds ?? null,
            percentWatched: metrics?.percentWatched ?? exercise.percentWatched ?? null,
            videoDurationSec: metrics?.videoDurationSec ?? exercise.videoDurationSec ?? null,
            videoCompleted: metrics?.completed ?? exercise.videoCompleted ?? null
        };
    };

    const logWorkoutCompletion = async () => {
        if (!logWorkoutButton || !currentWorkoutDay || isLoggingWorkout) return;
        if (currentWorkoutDay.isFuture) {
            logWorkoutButton.textContent = 'Upcoming';
            logWorkoutButton.disabled = true;
            logWorkoutButton.classList.remove('is-logged', 'is-ready');
            return;
        }
        stopVideoWatchTracking();
        const burnValue = Number(currentWorkoutDay.burn || 0);
        const baseBurnValue = Number(currentWorkoutDay.baseBurn || burnValue || 0);
        const numericBurn = Number.isFinite(burnValue) ? Math.max(0, Math.round(burnValue)) : 0;
        const dateIso = currentWorkoutDay.dateIso || new Date().toISOString().slice(0, 10);
        const payload = {
            dateIso,
            burn: numericBurn,
            baseBurn: Number.isFinite(baseBurnValue) ? Math.max(0, Math.round(baseBurnValue)) : numericBurn,
            goalSlug: currentWorkoutDay.goalSlug || currentWorkoutDay.goal || null,
            level: currentWorkoutDay.level || null,
            dayIndex: currentWorkoutDay.dayNumber || currentWorkoutDay.dayIndex || 1,
            schemaVersion: currentWorkoutDay.schemaVersion || '1.0',
            workouts: Array.isArray(currentWorkoutDay.exercises)
                ? currentWorkoutDay.exercises.map((exercise) => prepareWorkoutForLog(exercise)).filter(Boolean)
                : []
        };

        isLoggingWorkout = true;
        updateLogButtonState();

        try {
            const res = await fetch('/api/workouts/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                throw new Error(`Request failed with status ${res.status}`);
            }
            const responsePayload = await res.json().catch(() => ({}));
            currentWorkoutDay.logged = true;
            currentWorkoutDay.loggedCalories = Number(
                responsePayload?.entry?.calories ?? numericBurn
            );
            if (Array.isArray(currentWorkoutDay.exercises)) {
                currentWorkoutDay.exercises.forEach((exercise) => {
                    exercise.completed = true;
                });
                currentWorkoutDay.exercises.forEach((exercise, index) => {
                    const key = getExerciseStorageKey(exercise, index);
                    setStoredExerciseCompletion(dateIso, key, true);
                });
            }
            if (responsePayload?.totals) {
                try {
                    window.localStorage?.setItem('ff-workout-activity-totals', JSON.stringify(responsePayload.totals));
                } catch (storageErr) {
                    console.warn('Unable to persist workout totals', storageErr);
                }
                if (typeof window.CustomEvent === 'function') {
                    window.dispatchEvent(new CustomEvent('flexfule:workout-logged', { detail: responsePayload }));
                }
            }
            markStoredCompletion(dateIso, true);
            renderWorkoutList();
            renderWorkoutGrid();
            renderMainExercise(Math.min(selectedExerciseIndex, (currentWorkoutDay.exercises?.length || 1) - 1));
            showLogSuccessMessage(currentWorkoutDay.dateIso);
            upsertWorkoutHistoryEntry(dateIso, currentWorkoutDay.loggedCalories || numericBurn);
        } catch (err) {
            console.error('Failed to log workout completion', err);
            showPromptAlert('Could not log your workout right now. Please try again.');
        } finally {
            isLoggingWorkout = false;
            updateLogButtonState();
        }
    };

    const loadLoggedStateForCurrentDay = async () => {
        if (!currentWorkoutDay) {
            updateLogButtonState();
            return;
        }

        const dateIso =
            typeof currentWorkoutDay.dateIso === 'string' && currentWorkoutDay.dateIso
                ? currentWorkoutDay.dateIso
                : toISODate(new Date());
        const hadStoredCompletion = hasStoredCompletion(dateIso);

        if (Array.isArray(currentWorkoutDay.exercises)) {
            currentWorkoutDay.exercises.forEach((exercise) => {
                exercise.completed = false;
            });
        }
        currentWorkoutDay.logged = false;
        currentWorkoutDay.loggedCalories = 0;
        const todayIso = toISODate(new Date());
        if (dateIso && todayIso && dateIso > todayIso) {
            updateLogButtonState();
            return;
        }

        if (hadStoredCompletion) {
            currentWorkoutDay.logged = true;
            currentWorkoutDay.loggedCalories = Number(currentWorkoutDay.burn || 0);
            if (Array.isArray(currentWorkoutDay.exercises)) {
                currentWorkoutDay.exercises.forEach((exercise) => {
                    exercise.completed = true;
                });
                currentWorkoutDay.exercises.forEach((exercise, index) => {
                    const key = getExerciseStorageKey(exercise, index);
                    setStoredExerciseCompletion(dateIso, key, true);
                });
            }
            setStoredActiveDay(dateIso);
            showLogSuccessMessage(currentWorkoutDay.dateIso || dateIso);
            window.FFStreak?.recordWorkout(dateIso, true);
            upsertWorkoutHistoryEntry(dateIso, currentWorkoutDay.loggedCalories);
        }

        try {
            const res = await fetch(`/api/workouts/activity?date=${encodeURIComponent(dateIso)}`);
            if (res.ok) {
                const payload = await res.json();
                const entry = Array.isArray(payload.entries) ? payload.entries[0] : null;
                if (entry) {
                    currentWorkoutDay.logged = true;
                    currentWorkoutDay.loggedCalories = Number(entry.calories || 0);
                    if (Array.isArray(currentWorkoutDay.exercises)) {
                        currentWorkoutDay.exercises.forEach((exercise) => {
                            exercise.completed = true;
                        });
                        currentWorkoutDay.exercises.forEach((exercise, index) => {
                            const key = getExerciseStorageKey(exercise, index);
                            setStoredExerciseCompletion(dateIso, key, true);
                        });
                    }
                    markStoredCompletion(dateIso, true);
                    showLogSuccessMessage(currentWorkoutDay.dateIso || dateIso);
                    upsertWorkoutHistoryEntry(dateIso, currentWorkoutDay.loggedCalories);
                    renderWorkoutList();
                    renderWorkoutGrid();
                } else {
                    if (!hadStoredCompletion) {
                        markStoredCompletion(dateIso, false);
                    }
                    if (!hasStoredCompletion(dateIso)) {
                        hideLogSuccessMessage();
                    }
                    renderWorkoutList();
                    renderWorkoutGrid();
                }
            }
        } catch (err) {
            console.warn('Unable to load workout completion state', err);
        }

        updateLogButtonState();
    };

    const markExerciseCompleted = (index) => {
        if (!currentWorkoutDay?.exercises) return;
        const exercise = currentWorkoutDay.exercises[index];
        if (!exercise || exercise.completed) return;
        updateExerciseWatchMetrics(exercise, { forceComplete: true });
        exercise.completed = true;
        if (currentWorkoutDay?.dateIso) {
            const key = getExerciseStorageKey(exercise, index);
            setStoredExerciseCompletion(currentWorkoutDay.dateIso, key, true);
        }
        const node = workoutListEl?.children?.[index];
        if (node) {
            node.classList.add('completed');
        }
        updateLogButtonState();
    };

    const handleVideoEnded = () => {
        if (currentExerciseIndex == null || !currentWorkoutDay?.exercises) return;
        updateExerciseWatchMetrics(currentWorkoutDay.exercises[currentExerciseIndex], { forceComplete: true });
        markExerciseCompleted(currentExerciseIndex);
        const nextIndex = currentExerciseIndex + 1;
        if (nextIndex < currentWorkoutDay.exercises.length) {
            renderMainExercise(nextIndex);
            playCurrentExerciseVideo();
        } else {
            updateLogButtonState();
        }
    };

    if (mainWatchLink) {
        mainWatchLink.addEventListener('click', () => {
            playCurrentExerciseVideo();
        });
    }

    if (logWorkoutButton) {
        logWorkoutButton.addEventListener('click', () => {
            logWorkoutCompletion();
        });
    }

    const setActiveFilterButton = (buttons, activeButton) => {
        buttons.forEach((btn) => {
            btn.classList.toggle('active', btn === activeButton);
        });
    };

    const closeAddExerciseModal = () => {
        if (!addExerciseModal) return;
        addExerciseModal.hidden = true;
    };

    const openAddExerciseModal = () => {
        if (!addExerciseModal) return;
        addExerciseQuery = '';
        addExerciseCategory = 'all';
        if (addExerciseSearch) {
            addExerciseSearch.value = '';
        }
        if (!workoutLibrary.length) {
            buildWorkoutLibrary(profileContext);
        }
        const allFilter = addExerciseFilters.find((btn) => btn.dataset.addExerciseFilter === 'all');
        if (allFilter) setActiveFilterButton(addExerciseFilters, allFilter);
        renderAddExerciseResults();
        addExerciseModal.hidden = false;
        addExerciseSearch?.focus();
    };

    const removeExerciseAtIndex = (index) => {
        if (!currentWorkoutDay || !Array.isArray(currentWorkoutDay.exercises)) return;
        if (index < 0 || index >= currentWorkoutDay.exercises.length) return;
        currentWorkoutDay.exercises.splice(index, 1);
        if (currentExerciseIndex === index) {
            currentExerciseIndex = null;
        } else if (currentExerciseIndex != null && currentExerciseIndex > index) {
            currentExerciseIndex -= 1;
        }
        if (selectedExerciseIndex === index) {
            selectedExerciseIndex = Math.max(0, Math.min(index, currentWorkoutDay.exercises.length - 1));
        } else if (selectedExerciseIndex > index) {
            selectedExerciseIndex -= 1;
        }
        renderWorkoutList();
        renderWorkoutGrid();
        if (currentWorkoutDay.exercises.length) {
            const nextIndex = Math.min(selectedExerciseIndex, currentWorkoutDay.exercises.length - 1);
            renderMainExercise(nextIndex);
        } else {
            mainMediaEl.innerHTML = '<p class="empty-message">Select a workout to preview</p>';
            if (mainTitleEl) mainTitleEl.textContent = 'Workout';
            if (mainPrescriptionEl) mainPrescriptionEl.textContent = '';
            if (mainIntensityEl) mainIntensityEl.textContent = '';
            if (mainBurnEl) mainBurnEl.textContent = '';
        }
        updateLogButtonState();
        saveWorkoutDayCache(currentWorkoutDay);
    };

    const addExerciseToDay = (template) => {
        if (!template) return;
        if (!currentWorkoutDay) {
            currentWorkoutDay = {
                dateIso: toISODate(new Date()),
                exercises: [],
                level: template.level || 'Custom',
                dayNumber: null
            };
        }
        if (!Array.isArray(currentWorkoutDay.exercises)) {
            currentWorkoutDay.exercises = [];
        }
        const baseId = template.id || normalizeKey(template.name || 'custom');
        const newExercise = {
            ...template,
            id: `${baseId}-${Date.now()}`,
            completed: false,
            planDayIndex: currentWorkoutDay.exercises.length,
            planGoalIndex: currentWorkoutDay.exercises.length
        };
        ensureExerciseMetrics(newExercise);
        currentWorkoutDay.exercises.push(newExercise);
        const planButton = viewFilterButtons.find((btn) => (btn.dataset.viewFilter || '').toLowerCase() === 'plan');
        if (planButton) setActiveFilterButton(viewFilterButtons, planButton);
        selectedViewFilter = 'plan';
        applyWorkoutFilters();
        renderWorkoutList();
        renderMainExercise(currentWorkoutDay.exercises.length - 1);
        updateLogButtonState();
        saveWorkoutDayCache(currentWorkoutDay);
    };

    const renderAddExerciseResults = () => {
        if (!addExerciseResults) return;
        const libraryDataset = getWorkoutLibraryDataset();
        const categoryKey = addExerciseCategory === 'all' ? null : canonicalCategory(addExerciseCategory) || addExerciseCategory;
        const filtered = libraryDataset.filter((exercise) => {
            if (!exercise) return false;
            if (categoryKey) {
                const categories = Array.isArray(exercise.categories) ? exercise.categories : [];
                if (!categoryMatches(categories, categoryKey)) return false;
            }
            if (addExerciseQuery && !matchesSearch(exercise, addExerciseQuery)) return false;
            return true;
        });
        addExerciseResultsList = filtered.slice(0, 40);
        if (!addExerciseResultsList.length) {
            addExerciseResults.innerHTML = '<div class="workout-add-empty">No exercises found. Try a different search.</div>';
            return;
        }
        addExerciseResults.innerHTML = addExerciseResultsList
            .map((exercise, index) => {
                const tags = Array.isArray(exercise.categories) ? exercise.categories.slice(0, 3) : [];
                const tagHtml = tags.length
                    ? `<div class="tag-list">${tags
                          .map((tag) => `<span class="tag">${CATEGORY_LABELS[tag] || tag}</span>`)
                          .join('')}</div>`
                    : '';
                return `
                <div class="workout-add-result">
                    <div>
                        <h4>${exercise.name || 'Workout'}</h4>
                        <p>${exercise.prescription || 'Custom prescription'}</p>
                        ${tagHtml}
                    </div>
                    <button type="button" data-add-index="${index}">Add</button>
                </div>
            `;
            })
            .join('');
    };

    viewFilterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (button.classList.contains('active')) return;
            setActiveFilterButton(viewFilterButtons, button);
            selectedViewFilter = (button.dataset.viewFilter || 'plan').toLowerCase();
            if (selectedViewFilter === 'plan') {
                selectedLevelFilter = 'all';
                searchQuery = '';
                if (searchInputEl) searchInputEl.value = '';
                const allLevelBtn = levelFilterButtons.find(
                    (btn) => (btn.dataset.levelFilter || '').toLowerCase() === 'all'
                );
                if (allLevelBtn) {
                    setActiveFilterButton(levelFilterButtons, allLevelBtn);
                } else {
                    levelFilterButtons.forEach((btn) => btn.classList.remove('active'));
                }
            }
            applyWorkoutFilters();
            if (selectedViewFilter === 'plan' && currentWorkoutDay?.exercises?.length) {
                renderMainExercise(Math.min(selectedExerciseIndex, currentWorkoutDay.exercises.length - 1));
            }
            if (selectedViewFilter === 'all') {
                ensureExerciseVideoLibrary();
            }
        });
    });

    searchInputEl?.addEventListener('input', async (event) => {
        searchQuery = event.target.value.trim().toLowerCase();
        if (searchQuery && selectedViewFilter !== 'all') {
            const allButton = viewFilterButtons.find(
                (btn) => (btn.dataset.viewFilter || '').toLowerCase() === 'all'
            );
            if (allButton) {
                setActiveFilterButton(viewFilterButtons, allButton);
            }
            selectedViewFilter = 'all';
            try {
                await ensureExerciseVideoLibrary();
            } catch (err) {
                // Library load errors will be handled by the render state.
            }
        } else if (searchQuery) {
            try {
                await ensureExerciseVideoLibrary();
            } catch (err) {
                // Library load errors will be handled by the render state.
            }
        } else if (!searchQuery && selectedViewFilter === 'all' && viewFilterButtons.length) {
            // Keep the view selection as-all so the user can browse the catalog unless they switch back manually.
        }
        applyWorkoutFilters();
    });

    levelFilterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (button.classList.contains('active')) return;
            setActiveFilterButton(levelFilterButtons, button);
            selectedLevelFilter = (button.dataset.levelFilter || 'all').toLowerCase();
            viewFilterButtons.forEach((btn) => btn.classList.remove('active'));
            selectedViewFilter = 'plan';
            applyWorkoutFilters();
        });
    });

    if (addExerciseButton) {
        addExerciseButton.addEventListener('click', () => {
            openAddExerciseModal();
        });
    }

    if (addExerciseClose) {
        addExerciseClose.addEventListener('click', closeAddExerciseModal);
    }

    if (addExerciseModal) {
        addExerciseModal.addEventListener('click', (event) => {
            if (event.target === addExerciseModal) {
                closeAddExerciseModal();
            }
        });
    }

    if (addExerciseSearch) {
        addExerciseSearch.addEventListener('input', (event) => {
            addExerciseQuery = event.target.value.trim().toLowerCase();
            renderAddExerciseResults();
        });
    }

    addExerciseFilters.forEach((button) => {
        button.addEventListener('click', () => {
            if (button.classList.contains('active')) return;
            setActiveFilterButton(addExerciseFilters, button);
            addExerciseCategory = button.dataset.addExerciseFilter || 'all';
            renderAddExerciseResults();
        });
    });

    if (addExerciseResults) {
        addExerciseResults.addEventListener('click', (event) => {
            const btn = event.target.closest('[data-add-index]');
            if (!btn) return;
            const index = Number(btn.dataset.addIndex);
            const exercise = addExerciseResultsList[index];
            if (!exercise) return;
            addExerciseToDay(exercise);
            closeAddExerciseModal();
        });
    }

    if (workoutListEl) {
        workoutListEl.addEventListener('click', (event) => {
            const btn = event.target.closest('[data-delete-index]');
            if (!btn) return;
            event.stopPropagation();
            const index = Number(btn.dataset.deleteIndex);
            if (Number.isFinite(index)) {
                removeExerciseAtIndex(index);
            }
        });
    }

    const renderWorkoutList = () => {
        if (!workoutListEl) return;
        workoutListEl.innerHTML = '';
        if (!currentWorkoutDay || !currentWorkoutDay.exercises?.length) {
            const empty = document.createElement('p');
            empty.className = 'empty-message';
            empty.textContent = 'No workouts scheduled for today.';
            workoutListEl.appendChild(empty);
            return;
        }
        currentWorkoutDay.exercises.forEach((exercise, index) => {
            if (typeof exercise.completed !== 'boolean') {
                exercise.completed = false;
            }
            ensureExerciseMetrics(exercise);
            const item = document.createElement('span');
            item.className = 'name';
            item.dataset.exercise = exercise.name || `exercise-${index}`;
            item.innerHTML = `
                <img src="images/Vector 9.png" alt="" aria-hidden="true">
                <p><strong>${exercise.name || 'Workout'}</strong> — ${exercise.prescription || ''}</p>
                <button class="workout-delete-btn" type="button" data-delete-index="${index}" aria-label="Remove exercise">×</button>
            `;
            item.addEventListener('click', () => renderMainExercise(index));
            if (exercise.completed) {
                item.classList.add('completed');
            }
            workoutListEl.appendChild(item);
        });

        updateLogButtonState();
        if (currentWorkoutDay) {
            saveWorkoutDayCache(currentWorkoutDay);
        }
    };

    const renderPlannedWorkoutGrid = (customItems) => {
        if (!workoutGridEl) return;
        const items = Array.isArray(customItems)
            ? customItems
            : currentWorkoutDay?.exercises?.slice?.() || [];
        workoutGridEl.innerHTML = '';
        if (!items.length) {
            const empty = document.createElement('p');
            empty.className = 'empty-message';
            empty.textContent = 'Add workouts to see them here.';
            workoutGridEl.appendChild(empty);
            return;
        }
        const list =
            items.every((entry) => entry && entry.previewOnly)
                ? [...items].sort((a, b) => {
                      const exA = a?.exercise || {};
                      const exB = b?.exercise || {};
                      const goalIndexA =
                          typeof exA.planGoalIndex === 'number' ? exA.planGoalIndex : Number.MAX_SAFE_INTEGER;
                      const goalIndexB =
                          typeof exB.planGoalIndex === 'number' ? exB.planGoalIndex : Number.MAX_SAFE_INTEGER;
                      if (goalIndexA !== goalIndexB) {
                          return goalIndexA - goalIndexB;
                      }
                      const dayIndexA =
                          typeof exA.planDayIndex === 'number' ? exA.planDayIndex : Number.MAX_SAFE_INTEGER;
                      const dayIndexB =
                          typeof exB.planDayIndex === 'number' ? exB.planDayIndex : Number.MAX_SAFE_INTEGER;
                      if (dayIndexA !== dayIndexB) {
                          return dayIndexA - dayIndexB;
                      }
                      return (exA.name || '').localeCompare(exB.name || '', undefined, { sensitivity: 'base' });
                  })
                : items;

        list.forEach((item, index) => {
            const exercise = item && typeof item === 'object' && item.exercise ? item.exercise : item;
            if (!exercise) return;
            const originalIndex = typeof item?.originalIndex === 'number'
                ? item.originalIndex
                : currentWorkoutDay?.exercises?.indexOf?.(exercise) ?? index;
            const previewOnly =
                Boolean(item?.previewOnly) ||
                originalIndex < 0 ||
                !Array.isArray(currentWorkoutDay?.exercises) ||
                !currentWorkoutDay.exercises[originalIndex];
            const dayBadgeLabel = exercise.planDayLabel || '';
            const levelLabel = formatLevelLabel(exercise.level || currentWorkoutDay?.level || '');
            const badgeLabel = dayBadgeLabel || levelLabel;
            const metaPieces = [];
            if (exercise.planGoalLabel) {
                metaPieces.push(exercise.planGoalLabel);
            }
            if (levelLabel && levelLabel !== badgeLabel) {
                metaPieces.push(levelLabel);
            }
            const intensityLabel = exercise.intensity || currentWorkoutDay?.intensity || '';
            if (intensityLabel) {
                metaPieces.push(intensityLabel);
            }
            const burnEstimate = Number.isFinite(exercise.targetBurn)
                ? Math.round(exercise.targetBurn)
                : Number.isFinite(exercise.planBaseBurn)
                ? Math.round(exercise.planBaseBurn)
                : null;
            if (burnEstimate) {
                metaPieces.push(`${burnEstimate} kcal`);
            }
            const metaHtml = metaPieces.length
                ? `<div class="workout-meta">${metaPieces.map((itemMeta) => `<span>${itemMeta}</span>`).join('')}</div>`
                : '';
            const prescriptionHtml = exercise.prescription
                ? `<p class="workout-prescription">${exercise.prescription}</p>`
                : '';
            const card = document.createElement('div');
            card.className = 'workout-card';
            const videoContent = `<img class="workout-thumb-img" src="${WORKOUT_THUMB_FALLBACK}" alt="${exercise.name || 'Workout'} thumbnail" loading="eager" decoding="async" fetchpriority="high">`;
            card.innerHTML = `
                <div class="workout-video">
                    <div class="workout-thumb">
                        ${videoContent}
                    </div>
                </div>
                <div class="workout-info">
                    <div class="workout-header">
                        <h4>${exercise.name || 'Workout'}</h4>
                        ${badgeLabel ? `<span class="workout-level">${badgeLabel}</span>` : ''}
                        ${
                            !previewOnly
                                ? `<button class="workout-card-delete" type="button" data-delete-index="${originalIndex}" aria-label="Remove exercise">×</button>`
                                : ''
                        }
                    </div>
                    ${prescriptionHtml}
                    ${metaHtml}
                    ${exercise.video
                        ? `<a class="watch-link" href="${exercise.video}" target="_blank" rel="noopener">Open video</a>`
                        : ''}
                </div>
            `;
            applyWorkoutThumbnail(card.querySelector('.workout-thumb-img'), exercise);
            card.addEventListener('click', () => {
                if (!previewOnly) {
                    renderMainExercise(originalIndex >= 0 ? originalIndex : index);
                } else {
                    previewExercise(exercise);
                }
            });
            const deleteBtn = card.querySelector('.workout-card-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (event) => {
                    event.stopPropagation();
                    removeExerciseAtIndex(originalIndex);
                });
            }
            workoutGridEl.appendChild(card);
        });
    };

    const renderLibraryWorkoutGrid = () => {
        if (!workoutGridEl) return;
        workoutGridEl.innerHTML = '';
        const items = filteredWorkouts;
        if (!items.length) {
            const empty = document.createElement('p');
            empty.className = 'empty-message';
            if (exerciseVideoLibraryError && !exerciseVideoLibraryLoaded) {
                empty.textContent = `Exercise library unavailable: ${exerciseVideoLibraryError}`;
            } else {
                empty.textContent = getWorkoutLibraryDataset().length
                    ? 'No workouts match these filters yet.'
                    : 'Workouts will populate here once loaded.';
            }
            workoutGridEl.appendChild(empty);
            return;
        }
        items.forEach((exercise) => {
            const card = document.createElement('div');
            card.className = 'workout-card is-library';
            const levelLabel = formatLevelLabel(exercise.level);
            const scheduleLabel =
                exercise.planDayLabel || exercise.dayOfWeek || (exercise.sourceDay ? `Day ${exercise.sourceDay}` : 'Any day');
            const prescriptionText = exercise.prescription || 'Follow along with guided reps.';
            const featuredTag =
                exercise.planGoalLabel ||
                (Array.isArray(exercise.categories) && exercise.categories.length
                    ? formatCategoryLabel(exercise.categories[0])
                    : null);
            const metaItems = [
                featuredTag,
                levelLabel,
                exercise.intensity,
                Number.isFinite(exercise.targetBurn) ? `${Math.round(exercise.targetBurn)} kcal` : null
            ]
                .filter(Boolean)
                .map((item) => `<span>${item}</span>`)
                .join('');
            const youtubeId = extractYouTubeId(exercise.videoEmbed || exercise.video);
            const embedUrl = exercise.videoEmbed || (youtubeId ? `https://www.youtube.com/embed/${youtubeId}?rel=0` : null);
            const videoHref = exercise.video || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : embedUrl);
            const videoSection = `<div class="workout-thumb"><img class="workout-thumb-img" src="${WORKOUT_THUMB_FALLBACK}" alt="${exercise.name || 'Workout'} thumbnail" loading="eager" decoding="async" fetchpriority="high"></div>`;
            card.innerHTML = `
                <div class="workout-video">
                    ${videoSection}
                </div>
                <div class="workout-info">
                    <p class="workout-schedule">${scheduleLabel}</p>
                    <h4>${exercise.name || 'Workout'}</h4>
                    <p class="workout-prescription">${prescriptionText}</p>
                    <div class="workout-meta">${metaItems}</div>
                    ${
                        videoHref
                            ? `<a class="watch-link" href="${videoHref}" target="_blank" rel="noopener">Open video</a>`
                            : ''
                    }
                </div>
            `;
            applyWorkoutThumbnail(card.querySelector('.workout-thumb-img'), exercise);
            card.addEventListener('click', () => previewExercise(exercise));
            workoutGridEl.appendChild(card);
        });
    };

    const renderWorkoutGrid = (dataset) => {
        if (selectedViewFilter === 'all') {
            if (Array.isArray(dataset)) {
                filteredWorkouts = dataset;
            }
            renderLibraryWorkoutGrid();
        } else {
            renderPlannedWorkoutGrid(dataset);
        }
    };

    const hydrateWorkoutPage = async () => {
        if (!workoutListEl || !workoutGridEl || !mainMediaEl) return;
        ensureExerciseVideoLibrary().catch(() => {});
        if (!window.FlexPlan) {
            workoutListEl.innerHTML = '<p class="empty-message">Plan engine unavailable.</p>';
            currentWorkoutDay = null;
            updateLogButtonState();
            return;
        }
        const cached = loadWorkoutDayCache();
        if (cached?.day && Array.isArray(cached.day.exercises) && cached.day.exercises.length) {
            currentWorkoutDay = cached.day;
            updateTodayLabel(currentWorkoutDay.dateIso || cached.dateIso);
            selectedExerciseIndex = 0;
            applyStoredExerciseCompletions(currentWorkoutDay);
            renderWorkoutList();
            renderWorkoutGrid();
            renderMainExercise(0);
            updateLogButtonState();
        }
        cleanupActivePlayers();
        const profile = await fetchProfileGoal();
        profileContext = { ...(profile || {}) };
        try {
            await ensureExerciseVideoLibrary();
        } catch (err) {
            // Keep hydration moving even if the library fails to load.
        }
        const history = await fetchWorkoutHistory();
        try {
            const today = new Date();
            const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const todayIso = toISODate(normalizedToday);
            const normalizedHistory = history
                .map((entry) => {
                    if (!entry?.activity_date) return null;
                    const iso = String(entry.activity_date).slice(0, 10);
                    const dateObj = parseISODate(iso);
                    if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return null;
                    const calories = Number(entry.calories ?? entry.adjusted_burn ?? 0);
                    return { iso, date: dateObj, calories };
                })
                .filter((item) => item && item.iso <= todayIso)
                .sort((a, b) => a.iso.localeCompare(b.iso));
            const lastEntry = normalizedHistory.length
                ? new Date(
                      normalizedHistory[normalizedHistory.length - 1].date.getFullYear(),
                      normalizedHistory[normalizedHistory.length - 1].date.getMonth(),
                      normalizedHistory[normalizedHistory.length - 1].date.getDate()
                  )
                : null;
            setWorkoutHistoryEntries(normalizedHistory);
            const earliestEntry = normalizedHistory.length
                ? new Date(
                      normalizedHistory[0].date.getFullYear(),
                      normalizedHistory[0].date.getMonth(),
                      normalizedHistory[0].date.getDate()
                  )
                : null;

            const activePlanDate = resolveActivePlanDate(normalizedToday);

            const determinePlan = (baseDate) => {
                if (!(baseDate instanceof Date) || Number.isNaN(baseDate.getTime())) return null;
                const normalized = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
                const baseline = earliestEntry instanceof Date ? earliestEntry : normalized;
                const dayNumber = clamp(differenceInDays(baseline, normalized) + 1, 1, 90);
                const planAttempt = window.FlexPlan.buildDailyPlans(profile || {}, {
                    startDate: normalized,
                    days: 1,
                    startDay: dayNumber
                });
                const [dateKey] = Object.keys(planAttempt.workoutsByDate || {});
                if (!dateKey) {
                    throw new Error('Plan did not include a workout date');
                }
                return {
                    plan: planAttempt,
                    dateKey,
                    dayNumber,
                    targetDate: normalized
                };
            };

            let resolvedPlanBundle = null;
            const planCandidates = [];
            if (activePlanDate instanceof Date) {
                planCandidates.push(activePlanDate);
            }
            if (!planCandidates.some((date) => toISODate(date) === toISODate(normalizedToday))) {
                planCandidates.push(normalizedToday);
            }

            let lastPlanError = null;
            for (const candidateDate of planCandidates) {
                try {
                    resolvedPlanBundle = determinePlan(candidateDate);
                    if (resolvedPlanBundle) {
                        writeActivePlanDay(resolvedPlanBundle.dateKey);
                        break;
                    }
                } catch (planErr) {
                    lastPlanError = planErr;
                }
            }

            if (!resolvedPlanBundle) {
                try {
                    resolvedPlanBundle = determinePlan(normalizedToday);
                } catch (fallbackErr) {
                    lastPlanError = fallbackErr;
                }
            }

            if (!resolvedPlanBundle) {
                if (lastPlanError) {
                    throw lastPlanError;
                }
                throw new Error('Unable to build workout plan for today');
            }

            const { plan: resolvedPlan, dateKey: resolvedDateKey, dayNumber: resolvedDayNumber } = resolvedPlanBundle;
            currentWorkoutDay = resolvedPlan.workoutsByDate[resolvedDateKey];
            currentWorkoutDay.goalSlug = resolvedPlan.goalKey || currentWorkoutDay.goalSlug || null;
            if (!currentWorkoutDay.goal) {
                currentWorkoutDay.goal = resolvedPlan.goalLabel || resolvedPlan.goalKey || currentWorkoutDay.goalSlug || null;
            }
            currentWorkoutDay.dayNumber = resolvedDayNumber;
            currentWorkoutDay.schemaVersion = '1.0';
            currentWorkoutDay.dateIso = resolvedDateKey;
            if (Array.isArray(currentWorkoutDay.exercises)) {
                const categoryOverrides = getExerciseVideoCategoryOverrides();
                currentWorkoutDay.exercises = currentWorkoutDay.exercises.map((exercise) => {
                    if (!exercise) return exercise;
                    const tags = Array.isArray(exercise.tags) ? Array.from(new Set(exercise.tags)) : [];
                    const nameKey = normalizeKey(exercise.name || exercise.exercise || '');
                    const overrideCategories = nameKey ? categoryOverrides.get(nameKey) : null;
                    const categories = deriveExerciseCategories(
                        overrideCategories || exercise.categories,
                        [exercise.name, exercise.prescription, currentWorkoutDay.goal || '', currentWorkoutDay.dayNumber],
                        tags
                    );
                    return { ...exercise, tags, categories };
                });
            }
            applyExerciseVideoOverrides(currentWorkoutDay);
            if (
                cached?.day?.dateIso === resolvedDateKey &&
                Array.isArray(cached.day.exercises) &&
                Array.isArray(currentWorkoutDay.exercises)
            ) {
                const planKey = (exercise) => {
                    if (!exercise) return '';
                    if (exercise.id) return String(exercise.id);
                    return normalizeKey(`${exercise.name || ''}::${exercise.prescription || ''}`);
                };
                const planIndex = new Map();
                currentWorkoutDay.exercises.forEach((exercise, index) => {
                    const key = planKey(exercise);
                    if (key) planIndex.set(key, index);
                });
                const categoryOverrides = getExerciseVideoCategoryOverrides();
                cached.day.exercises.forEach((exercise) => {
                    if (!exercise) return;
                    const key = planKey(exercise);
                    if (key && planIndex.has(key)) {
                        const idx = planIndex.get(key);
                        const existing = currentWorkoutDay.exercises[idx];
                        currentWorkoutDay.exercises[idx] = {
                            ...existing,
                            completed: typeof exercise.completed === 'boolean' ? exercise.completed : existing.completed,
                            metrics: exercise.metrics && typeof exercise.metrics === 'object' ? exercise.metrics : existing.metrics
                        };
                        return;
                    }
                    const tags = Array.isArray(exercise.tags) ? Array.from(new Set(exercise.tags)) : [];
                    const nameKey = normalizeKey(exercise.name || exercise.exercise || '');
                    const overrideCategories = nameKey ? categoryOverrides.get(nameKey) : null;
                    const categories = deriveExerciseCategories(
                        overrideCategories || exercise.categories,
                        [exercise.name, exercise.prescription, currentWorkoutDay.goal || '', currentWorkoutDay.dayNumber],
                        tags
                    );
                    currentWorkoutDay.exercises.push({ ...exercise, tags, categories });
                });
            }
            setStoredActiveDay(resolvedDateKey);
            const historyMatch = normalizedHistory.find(
                (item) => item.iso === resolvedDateKey && Number(item.calories) > 0
            );
            if (historyMatch) {
                currentWorkoutDay.logged = true;
                currentWorkoutDay.loggedCalories =
                    Number(historyMatch.calories) || Number(currentWorkoutDay.burn || 0) || 0;
                if (Array.isArray(currentWorkoutDay.exercises)) {
                    currentWorkoutDay.exercises.forEach((exercise) => {
                        exercise.completed = true;
                    });
                }
                markStoredCompletion(resolvedDateKey, true);
                upsertWorkoutHistoryEntry(resolvedDateKey, currentWorkoutDay.loggedCalories);
            }
            const planDateObj = parseISODate(resolvedDateKey);
            const normalizedPlanDate =
                planDateObj instanceof Date && !Number.isNaN(planDateObj.getTime())
                    ? new Date(planDateObj.getFullYear(), planDateObj.getMonth(), planDateObj.getDate())
                    : null;
            const futureDistance =
                normalizedPlanDate instanceof Date ? differenceInDays(normalizedToday, normalizedPlanDate) : 0;
            currentWorkoutDay.isFuture = futureDistance > 0;
            updateTodayLabel(currentWorkoutDay.dateIso || resolvedDateKey);
            await loadLoggedStateForCurrentDay();
            applyStoredExerciseCompletions(currentWorkoutDay);
            selectedExerciseIndex = 0;
            renderWorkoutList();
            renderWorkoutGrid();
            renderMainExercise(0);
            updateLogButtonState();
            saveWorkoutDayCache(currentWorkoutDay);
        } catch (err) {
            console.error('Failed to build workout plan', err);
            workoutListEl.innerHTML = '<p class="empty-message">Unable to load today\'s workouts.</p>';
            currentWorkoutDay = null;
            updateTodayLabel();
            hideLogSuccessMessage();
            updateLogButtonState();
        }
        buildWorkoutLibrary(profileContext);
    };

    hydrateWorkoutPage();
});
