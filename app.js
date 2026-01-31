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
    return window.FFPrompt.showPromptAlert(message, options);
  }
  window.showPromptAlert(message);
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
    let youtubeApiReady = false;
    let youtubeApiLoading = false;
    let isLoggingWorkout = false;
    const youtubeReadyQueue = [];
    let currentUserId = null;
    let currentUserKey = 'anonymous';
    const WORKOUT_COMPLETION_STORAGE_KEY = 'ff-workout-completion-state';
    const WORKOUT_ACTIVE_DAY_STORAGE_KEY = 'ff-workout-active-day';
    const WORKOUT_HISTORY_LIMIT = 10;
    let workoutLibrary = [];
    let supplementalWorkouts = [];
    let filteredWorkouts = [];
    let selectedLevelFilter = 'all';
    let selectedViewFilter = 'plan';
    let searchQuery = '';
    let profileContext = {};
    let exerciseVideoLibraryLoaded = false;
    let exerciseVideoLibraryPromise = null;
    let workoutHistoryEntries = [];

    const CATEGORY_LABELS = {
        cardio: 'Cardio',
        legs: 'Legs',
        chest: 'Chest',
        shoulders: 'Shoulders',
        back: 'Back',
        arms: 'Arms',
        tricep: 'Triceps',
        core: 'Core',
        belly: 'Belly',
        hips: 'Hips / Glutes',
        mobility: 'Mobility',
        height: 'Height Increasing',
        fullbody: 'Full Body'
    };

    const CATEGORY_SYNONYMS = {
        cardio: ['cardio', 'hiit', 'conditioning', 'aerobic', 'run', 'running', 'jog', 'jogging', 'sprint'],
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
        arms: ['arm', 'arms', 'bicep', 'biceps', 'curl', 'upper-body', 'hammer curl'],
        tricep: ['tricep', 'triceps', 'skull crusher', 'pushdown', 'dips', 'close-grip', 'kickback', 'overhead extension'],
        core: ['core', 'ab', 'abs', 'abdominal', 'plank', 'crunch', 'sit-up', 'situp', 'mountain climber', 'bicycle', 'russian twist'],
        belly: ['belly', 'midsection', 'waist', 'oblique'],
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
            'hip circle',
            'leg raise'
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

    const getWorkoutLibraryDataset = () => {
        const baseLibrary = Array.isArray(workoutLibrary) ? workoutLibrary : [];
        const extraLibrary = Array.isArray(supplementalWorkouts) ? supplementalWorkouts : [];
        if (!extraLibrary.length) return baseLibrary;
        return [...baseLibrary, ...extraLibrary];
    };

    const getCurrentUserKey = () => currentUserKey || 'anonymous';

    const canonicalCategory = (value) => {
        if (!value) return null;
        const lower = String(value).toLowerCase();
        if (CATEGORY_LABELS[lower]) return lower;
        if (CATEGORY_LOOKUP[lower]) return CATEGORY_LOOKUP[lower];
        if (lower.includes('belly')) return 'belly';
        if (lower.includes('core') || lower.includes('ab')) return 'core';
        if (lower.includes('hip') || lower.includes('glute')) return 'hips';
        if (lower.includes('tricep')) return 'tricep';
        if (lower.includes('leg') || lower.includes('lower')) return 'legs';
        if (lower.includes('cardio') || lower.includes('aerobic') || lower.includes('run') || lower.includes('jog')) return 'cardio';
        if (lower.includes('chest') || lower.includes('push')) return 'chest';
        if (lower.includes('shoulder') || lower.includes('deltoid')) return 'shoulders';
        if (lower.includes('back') || lower.includes('row') || lower.includes('pull')) return 'back';
        if (lower.includes('arm') || lower.includes('bicep') || lower.includes('tricep')) return 'arms';
        if (lower.includes('mobility') || lower.includes('stretch') || lower.includes('yoga') || lower.includes('flex')) return 'mobility';
        if (lower.includes('height')) return 'height';
        if (lower.includes('full')) return 'fullbody';
        return null;
    };

    const detectCategoriesFromText = (text) => {
        if (!text) return [];
        const lower = String(text).toLowerCase();
        const matches = new Set();
        Object.entries(CATEGORY_SYNONYMS).forEach(([category, synonyms]) => {
            if (synonyms.some((syn) => lower.includes(syn))) {
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
        [...textParts, ...extraTags].forEach((value) => {
            detectCategoriesFromText(value).forEach((category) => resolved.add(category));
        });
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
                    const derivedCategories = deriveExerciseCategories(
                        workout.categories,
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

    const matchesSearch = (exercise, query) => {
        if (!query) return true;
        const haystack = [
            exercise.name,
            exercise.prescription,
            exercise.level,
            exercise.intensity,
            ...(exercise.categories || []),
            ...(exercise.tags || [])
        ]
            .join(' ')
            .toLowerCase();
        const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (!tokens.length) return true;
        return tokens.every((token) => {
            if (haystack.includes(token)) return true;
            const canonical = CATEGORY_LOOKUP[token] || canonicalCategory(token);
            if (canonical && exercise.categories && exercise.categories.includes(canonical)) {
                return true;
            }
            return false;
        });
    };

    const applyWorkoutFilters = () => {
        const levelKey = (selectedLevelFilter || 'all').toLowerCase();
        const query = searchQuery;

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
                    if (query && !matchesSearch(exercise, query)) {
                        return false;
                    }
                    return true;
                });
            renderWorkoutGrid(filteredPlan);
            return;
        }

        const libraryDataset = getWorkoutLibraryDataset();
        if (!Array.isArray(libraryDataset) || !libraryDataset.length) {
            filteredWorkouts = [];
            renderWorkoutGrid([]);
            return;
        }

        filteredWorkouts = libraryDataset.filter((exercise) => {
            if (levelKey !== 'all') {
                const levelValue = String(exercise.level || '').toLowerCase();
                if (levelValue !== levelKey) {
                    return false;
                }
            }
            if (query && !matchesSearch(exercise, query)) {
                return false;
            }
            return true;
        });
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
        programWindow.forEach(({ workoutDay }) => {
            if (!workoutDay?.exercises?.length) return;
            workoutDay.exercises.forEach((exercise) => {
                const levelLabel = workoutDay.level || exercise.level || '';
                const key = `${normalizeKey(levelLabel)}::${normalizeKey(exercise.name || '')}`;
                if (seen.has(key)) return;
                const categories = deriveExerciseCategories(
                    exercise.categories,
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

    const extractYouTubeId = (url) => {
        if (!url) return null;
        const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/i);
        if (embedMatch) return embedMatch[1];
        const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/i);
        if (watchMatch) return watchMatch[1];
        const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
        if (shortMatch) return shortMatch[1];
        return null;
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
        const youtubeId = extractYouTubeId(item.video);
        const libraryId = item.id ? `video-${item.id}` : `video-${normalizeKey(item.exercise)}`;
        return {
            id: libraryId,
            name: item.exercise,
            prescription: item.prescription || '',
            level: item.level || 'All Levels',
            intensity: item.intensity || '',
            categories,
            tags: Array.from(new Set(tags)),
            video: item.video || null,
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
        if (selectedViewFilter === 'all') {
            applyWorkoutFilters();
        }
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
                const response = await fetch('/api/workout-videos');
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                const payload = await response.json();
                if (!Array.isArray(payload?.items)) {
                    throw new Error('Invalid exercise video payload');
                }
                integrateExerciseVideoLibrary(payload.items);
                exerciseVideoLibraryLoaded = true;
                return supplementalWorkouts;
            } catch (err) {
                console.warn('Unable to load exercise video library', err);
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
                            if (event.data === YT.PlayerState.ENDED) {
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
            videoEl.addEventListener('ended', handleVideoEnded, { once: true });
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

    const logWorkoutCompletion = async () => {
        if (!logWorkoutButton || !currentWorkoutDay || isLoggingWorkout) return;
        if (currentWorkoutDay.isFuture) {
            logWorkoutButton.textContent = 'Upcoming';
            logWorkoutButton.disabled = true;
            logWorkoutButton.classList.remove('is-logged', 'is-ready');
            return;
        }
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
            workouts: Array.isArray(currentWorkoutDay.exercises) ? currentWorkoutDay.exercises : []
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
        exercise.completed = true;
        const node = workoutListEl?.children?.[index];
        if (node) {
            node.classList.add('completed');
        }
        updateLogButtonState();
    };

    const handleVideoEnded = () => {
        if (currentExerciseIndex == null || !currentWorkoutDay?.exercises) return;
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

    searchInputEl?.addEventListener('input', (event) => {
        searchQuery = event.target.value.trim().toLowerCase();
        if (searchQuery && selectedViewFilter !== 'all') {
            const allButton = viewFilterButtons.find(
                (btn) => (btn.dataset.viewFilter || '').toLowerCase() === 'all'
            );
            if (allButton) {
                setActiveFilterButton(viewFilterButtons, allButton);
            }
            selectedViewFilter = 'all';
            ensureExerciseVideoLibrary();
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

    if (addExerciseButton && workoutGridEl) {
        addExerciseButton.addEventListener('click', () => {
            workoutGridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            const item = document.createElement('span');
            item.className = 'name';
            item.dataset.exercise = exercise.name || `exercise-${index}`;
            item.innerHTML = `
                <img src="images/Vector 9.png" alt="" aria-hidden="true">
                <p><strong>${exercise.name || 'Workout'}</strong> — ${exercise.prescription || ''}</p>
            `;
            item.addEventListener('click', () => renderMainExercise(index));
            if (exercise.completed) {
                item.classList.add('completed');
            }
            workoutListEl.appendChild(item);
        });

        updateLogButtonState();
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
            const videoContent = exercise.videoEmbed
                ? `<iframe src="${exercise.videoEmbed}" title="${exercise.name} demonstration" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
                : exercise.video
                ? `<p class="empty-message">Press "Open video" to watch the tutorial.</p>`
                : `<p class="empty-message">Video preview unavailable</p>`;
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
                    </div>
                    ${prescriptionHtml}
                    ${metaHtml}
                    ${exercise.video
                        ? `<a class="watch-link" href="${exercise.video}" target="_blank" rel="noopener">Open video</a>`
                        : ''}
                </div>
            `;
            card.addEventListener('click', () => {
                if (!previewOnly) {
                    renderMainExercise(originalIndex >= 0 ? originalIndex : index);
                } else {
                    previewExercise(exercise);
                }
            });
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
            empty.textContent = getWorkoutLibraryDataset().length
                ? 'No workouts match these filters yet.'
                : 'Workouts will populate here once loaded.';
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
            const youtubeId = extractYouTubeId(exercise.video || exercise.videoEmbed);
            const embedUrl =
                exercise.videoEmbed ||
                (youtubeId ? `https://www.youtube.com/embed/${youtubeId}?rel=0` : null);
            const videoSection = embedUrl
                ? `<div class="workout-thumb"><iframe src="${embedUrl}" title="${exercise.name || 'Workout'} tutorial" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
                : `<div class="workout-thumb is-placeholder"><span>No video preview</span></div>`;
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
                        exercise.video || embedUrl
                            ? `<a class="watch-link" href="${
                                  exercise.video || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : embedUrl)
                              }" target="_blank" rel="noopener">Open video</a>`
                            : ''
                    }
                </div>
            `;
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
        if (!window.FlexPlan) {
            workoutListEl.innerHTML = '<p class="empty-message">Plan engine unavailable.</p>';
            currentWorkoutDay = null;
            updateLogButtonState();
            return;
        }
        cleanupActivePlayers();
        const profile = await fetchProfileGoal();
        profileContext = { ...(profile || {}) };
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

            const storedActiveIso = getStoredActiveDay();
            const storedActiveIsLogged = storedActiveIso ? hasStoredCompletion(storedActiveIso) : false;
            if (storedActiveIso && !storedActiveIsLogged) {
                clearStoredActiveDay();
            }
            let preferredDate = null;
            if (storedActiveIso && storedActiveIsLogged) {
                const parsedStored = parseISODate(storedActiveIso);
                if (parsedStored instanceof Date && !Number.isNaN(parsedStored.getTime())) {
                    const normalizedStored = new Date(
                        parsedStored.getFullYear(),
                        parsedStored.getMonth(),
                        parsedStored.getDate()
                    );
                    const diffFromToday = differenceInDays(normalizedToday, normalizedStored);
                    if (diffFromToday >= 0 && diffFromToday <= 1) {
                        preferredDate = normalizedStored;
                    } else if (diffFromToday < 0) {
                        clearStoredActiveDay();
                    }
                }
            }

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
            if (preferredDate instanceof Date) planCandidates.push(preferredDate);
            planCandidates.push(normalizedToday);
            if (!preferredDate && lastEntry instanceof Date && !Number.isNaN(lastEntry.getTime())) {
                const lastIso = toISODate(lastEntry);
                if (lastIso && lastIso >= todayIso) {
                    const next = new Date(lastEntry.getFullYear(), lastEntry.getMonth(), lastEntry.getDate());
                    next.setDate(next.getDate() + 1);
                    planCandidates.push(next);
                }
            }

            let lastPlanError = null;
            for (const candidateDate of planCandidates) {
                try {
                    resolvedPlanBundle = determinePlan(candidateDate);
                    if (resolvedPlanBundle) {
                        if (preferredDate && candidateDate === preferredDate) {
                            setStoredActiveDay(resolvedPlanBundle.dateKey);
                        }
                        break;
                    }
                } catch (planErr) {
                    lastPlanError = planErr;
                    if (preferredDate && candidateDate === preferredDate) {
                        clearStoredActiveDay();
                    }
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
                currentWorkoutDay.exercises = currentWorkoutDay.exercises.map((exercise) => {
                    if (!exercise) return exercise;
                    const tags = Array.isArray(exercise.tags) ? Array.from(new Set(exercise.tags)) : [];
                    const categories = deriveExerciseCategories(
                        exercise.categories,
                        [exercise.name, exercise.prescription, currentWorkoutDay.goal || '', currentWorkoutDay.dayNumber],
                        tags
                    );
                    return { ...exercise, tags, categories };
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
            selectedExerciseIndex = 0;
            renderWorkoutList();
            renderWorkoutGrid();
            renderMainExercise(0);
            updateLogButtonState();
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
    ensureExerciseVideoLibrary().catch(() => {});
});
