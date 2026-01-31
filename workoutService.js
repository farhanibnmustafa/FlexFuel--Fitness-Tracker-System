import { supabase } from './supabaseClient.js';

const GOAL_ALIASES = {
  'lose weight': 'lose-weight',
  'fat loss': 'lose-weight',
  'weight loss': 'lose-weight',
  'lean down': 'lose-weight',
  'lose-weight': 'lose-weight',
  'build muscle': 'build-muscle',
  'gain muscle': 'build-muscle',
  hypertrophy: 'build-muscle',
  'build-muscle': 'build-muscle',
  'improve endurance': 'improve-endurance',
  endurance: 'improve-endurance',
  stamina: 'improve-endurance',
  'improve-endurance': 'improve-endurance',
  'general fitness': 'general-fitness',
  maintenance: 'general-fitness',
  wellness: 'general-fitness',
  'general-fitness': 'general-fitness',
  default: 'general-fitness'
};

const GOAL_LABELS = {
  'lose-weight': 'Lose Weight',
  'build-muscle': 'Build Muscle',
  'improve-endurance': 'Improve Endurance',
  'general-fitness': 'General Fitness'
};

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const configCache = new Map();
const configLoaders = new Map();
const videoLibraryCache = new Map();

const VIDEO_CATEGORY_SLUGS = {
  'leg exercises': 'legs',
  legs: 'legs',
  leg: 'legs',
  chest: 'chest',
  shoulder: 'shoulders',
  shoulders: 'shoulders',
  belly: 'core',
  core: 'core',
  abs: 'core',
  hip: 'hips',
  hips: 'hips',
  glute: 'hips',
  tricep: 'arms',
  triceps: 'arms',
  arms: 'arms',
  'height increasing': 'mobility',
  mobility: 'mobility',
  stretch: 'mobility'
};

function normalizeGoal(goalInput) {
  if (!goalInput) return GOAL_ALIASES.default;
  const lowered = String(goalInput).trim().toLowerCase();
  if (!lowered) return GOAL_ALIASES.default;
  if (GOAL_ALIASES[lowered]) return GOAL_ALIASES[lowered];

  const slug = lowered.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (GOAL_ALIASES[slug]) return GOAL_ALIASES[slug];
  const labelMatch = Object.entries(GOAL_LABELS).find(([, label]) => label.toLowerCase() === lowered);
  if (labelMatch) return labelMatch[0];
  return GOAL_ALIASES.default;
}

function selectLevelForDay(levelByDay = {}, dayNumber) {
  for (const [rangeKey, levelName] of Object.entries(levelByDay)) {
    const [startStr, endStr] = rangeKey.split('-');
    const start = Number(startStr);
    const end = Number(endStr);
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (dayNumber >= start && dayNumber <= end) {
      return levelName;
    }
  }
  return null;
}

function clampProgression(level, rules = {}, dayNumber) {
  const progression = rules.progression?.[level] || { weeklyIncrementPct: 0, maxPct: 0 };
  const weeklyIncrement = progression.weeklyIncrementPct || 0;
  const maxIncrement = progression.maxPct || 0;
  if (!weeklyIncrement || !dayNumber) return 0;
  const weekNumber = Math.max(1, Math.ceil(dayNumber / 7));
  return Math.min(maxIncrement, weeklyIncrement * (weekNumber - 1));
}

async function loadWorkoutPlanConfig(schemaVersion = '1.0') {
  const versionKey =
    typeof schemaVersion === 'string' && schemaVersion.trim() ? schemaVersion.trim() : '1.0';
  if (configCache.has(versionKey)) {
    return configCache.get(versionKey);
  }
  if (configLoaders.has(versionKey)) {
    return configLoaders.get(versionKey);
  }
  const loader = (async () => {
    try {
      const { data, error } = await supabase
        .from('workout_plan_configs')
        .select('config')
        .eq('schema_version', versionKey)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to load workout configuration: ${error.message}`);
      }
      if (!data?.config) {
        throw new Error(`Workout configuration ${versionKey} not found`);
      }
      configCache.set(versionKey, data.config);
      return data.config;
    } finally {
      configLoaders.delete(versionKey);
    }
  })();
  configLoaders.set(versionKey, loader);
  return loader;
}

function extractYouTubeId(url) {
  if (typeof url !== 'string') return null;
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/i);
  if (embedMatch) return embedMatch[1];
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/i);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
  if (shortMatch) return shortMatch[1];
  return null;
}

function normalizeCategoryLabel(value) {
  if (!value) return null;
  const lower = String(value).trim().toLowerCase();
  if (!lower) return null;
  if (VIDEO_CATEGORY_SLUGS[lower]) return VIDEO_CATEGORY_SLUGS[lower];
  const match = Object.entries(VIDEO_CATEGORY_SLUGS).find(([key]) => lower.includes(key));
  if (match) return match[1];
  return lower.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function classifyIntensityFromBurn(burn) {
  const value = Number(burn);
  if (!Number.isFinite(value) || value <= 0) return '';
  if (value >= 400) return 'High';
  if (value <= 220) return 'Low';
  return 'Moderate';
}

function tokenizeText(value) {
  return String(value || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter(Boolean);
}

function buildExerciseVideoLibrary(config, schemaVersion) {
  if (!config || !Array.isArray(config.categories)) {
    return [];
  }
  const entries = [];
  config.categories.forEach((category, categoryIndex) => {
    const categoryLabel = String(category?.category || 'General').trim();
    const categorySlug = normalizeCategoryLabel(categoryLabel);
    const baseBurn = Number(category?.baseBurn);
    const intensity = classifyIntensityFromBurn(baseBurn);
    const workouts = Array.isArray(category?.workouts) ? category.workouts : [];
    workouts.forEach((workout, workoutIndex) => {
      if (!workout) return;
      const exerciseName =
        String(workout.exercise || '').trim() || `Exercise ${categoryIndex + 1}-${workoutIndex + 1}`;
      const prescription = String(workout.prescription || '').trim();
      const video = typeof workout.video === 'string' ? workout.video.trim() : null;
      const videoId = extractYouTubeId(video);
      const keywordSet = new Set([
        ...tokenizeText(exerciseName),
        ...tokenizeText(categoryLabel),
        ...tokenizeText(prescription)
      ]);
      if (categorySlug) {
        keywordSet.add(categorySlug);
      }
      const keywords = Array.from(keywordSet);
      entries.push({
        id: `${categorySlug || 'category'}-${categoryIndex}-${workoutIndex}`,
        schemaVersion,
        category: categoryLabel,
        categorySlug: categorySlug || null,
        baseBurn: Number.isFinite(baseBurn) ? baseBurn : null,
        intensity,
        exercise: exerciseName,
        prescription,
        video,
        videoId,
        level: 'All Levels',
        keywords,
        searchText: keywords.join(' '),
        orderIndex: entries.length
      });
    });
  });
  return entries;
}

async function getExerciseVideoLibrary(schemaVersion = 'exercise_videos_v1') {
  const versionKey =
    typeof schemaVersion === 'string' && schemaVersion.trim()
      ? schemaVersion.trim()
      : 'exercise_videos_v1';
  if (videoLibraryCache.has(versionKey)) {
    return videoLibraryCache.get(versionKey);
  }
  const config = await loadWorkoutPlanConfig(versionKey);
  const library = buildExerciseVideoLibrary(config, versionKey);
  videoLibraryCache.set(versionKey, library);
  return library;
}

function normalizeCategoryFilters(categories) {
  if (!categories) return [];
  const list = Array.isArray(categories) ? categories : [categories];
  return list
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean)
    .map((value) => normalizeCategoryLabel(value) || value);
}

function tokenizeQuery(query) {
  return tokenizeText(query);
}

function scoreVideoMatch(entry, tokens) {
  if (!tokens.length) return 1;
  let score = 0;
  tokens.forEach((token) => {
    if (!token) return;
    if (entry.searchText.includes(token)) {
      score += 2;
    } else if (entry.keywords.some((keyword) => keyword.startsWith(token))) {
      score += 1;
    }
  });
  return score;
}

export async function getDailyWorkout({ goalSlug, dayNumber, schemaVersion = '1.0' }) {
  const normalizedGoal = normalizeGoal(goalSlug);
  const day = Number(dayNumber);
  if (!Number.isInteger(day) || day < 1 || day > 90) {
    throw new Error('dayNumber must be an integer between 1 and 90');
  }

  const config = await loadWorkoutPlanConfig(schemaVersion);
  const rules = config.rules || {};
  const plan = config.plan || {};
  const goalLabel = GOAL_LABELS[normalizedGoal] || GOAL_LABELS[GOAL_ALIASES.default];
  const goalPlan = plan[goalLabel];

  if (!goalPlan?.seedWeek) {
    throw new Error(`Workout plan for goal "${goalLabel}" is not available`);
  }

  const level = selectLevelForDay(rules.levelByDay, day);
  if (!level) {
    throw new Error(`No level defined for day ${day}`);
  }

  const seedWeek = goalPlan.seedWeek[level];
  if (!seedWeek) {
    throw new Error(`Seed week missing for level "${level}" on goal "${goalLabel}"`);
  }

  const dayName = DAYS_OF_WEEK[(day - 1) % DAYS_OF_WEEK.length];
  const session = seedWeek[dayName];
  if (!session) {
    throw new Error(`No workout defined for ${dayName} (${level})`);
  }

  const baseBurn = Number(session.baseBurn || 0);
  const progressionPct = clampProgression(level, rules, day);
  const burnMultiplier = Number(rules.burnMultipliers?.[level] || 1);
  const adjustedBurn = Math.round(baseBurn * (1 + progressionPct / 100) * burnMultiplier);
  const weekNumber = Math.ceil(day / 7);

  return {
    schemaVersion,
    goalSlug: normalizedGoal,
    goalLabel,
    dayNumber: day,
    dayName,
    weekNumber,
    level,
    workouts: session.workouts || [],
    baseBurn,
    adjustedBurn,
    progressionAppliedPct: progressionPct,
    burnMultiplier
  };
}

export async function searchExerciseVideos({
  query = '',
  categories = [],
  limit = 40,
  schemaVersion = 'exercise_videos_v1'
} = {}) {
  const library = await getExerciseVideoLibrary(schemaVersion);
  const normalizedCategories = normalizeCategoryFilters(categories);
  const tokens = tokenizeQuery(query);
  let filtered = library;
  if (normalizedCategories.length) {
    filtered = filtered.filter((entry) => {
      if (!entry.categorySlug) return false;
      return normalizedCategories.includes(entry.categorySlug);
    });
  }
  if (tokens.length) {
    filtered = filtered
      .map((entry) => ({ entry, score: scoreVideoMatch(entry, tokens) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.entry.orderIndex - b.entry.orderIndex;
      })
      .map(({ entry }) => entry);
  }
  const filteredCount = filtered.length;
  const normalizedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 40;
  const capped =
    normalizedLimit > 0 ? filtered.slice(0, Math.min(Math.max(Math.trunc(normalizedLimit), 1), 100)) : filtered;
  const responseItems = capped.map(({ searchText, orderIndex, ...rest }) => rest);
  return {
    schemaVersion,
    total: library.length,
    filtered: filteredCount,
    items: responseItems
  };
}
