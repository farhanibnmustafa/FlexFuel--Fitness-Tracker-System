import { supabase } from '../models/supabaseClient.js';
import { buildWeeklyReportEmail } from '../controllers/apiController.js';
import { sendEmail } from './emailService.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_HYDRATION_BASE_ML = 2000;
let sweepInProgress = false;

const parseDateOnly = (value) => {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toISODate = (value) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStartDate = (date) => {
  const base = date instanceof Date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : new Date();
  const day = base.getDay(); // 0 = Sun
  const diff = (day + 6) % 7; // Monday start
  base.setDate(base.getDate() - diff);
  return base;
};

const getWeekRange = (date, anchorDate) => {
  const base = date instanceof Date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : new Date();
  if (!(anchorDate instanceof Date) || Number.isNaN(anchorDate.getTime())) {
    const start = getWeekStartDate(base);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return { start, end };
  }
  const anchor = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate());
  const diffDays = Math.floor((base.getTime() - anchor.getTime()) / MS_PER_DAY);
  const weekIndex = Math.floor(diffDays / 7);
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + weekIndex * 7);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  return { start, end };
};

const toWeekdayIndex = (date) => {
  const day = date.getDay();
  return day === 0 ? 7 : day;
};

const normalizeGoalSlug = (goalValue) => {
  if (!goalValue) return null;
  const slug = String(goalValue)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || null;
};

const parsePrescriptionDuration = (prescription) => {
  const text = String(prescription || '').toLowerCase();
  if (!text) return null;
  const setRepMatch = text.match(/(\d+)\s*[x×]\s*(\d+)\s*(s|sec|secs|seconds|m|min|mins|minutes)?/);
  if (setRepMatch) {
    const value = Number(setRepMatch[2]);
    const unit = setRepMatch[3];
    if (unit) {
      const unitLower = unit.toLowerCase();
      return value * (unitLower.startsWith('m') ? 60 : 1);
    }
  }
  const durationMatch = text.match(/(\d+(?:\.\d+)?)\s*(seconds|secs|sec|s|minutes|mins|min|m)\b/);
  if (durationMatch) {
    const value = Number(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    return value * (unit.startsWith('m') ? 60 : 1);
  }
  return null;
};

const resolveWeeklyPref = (row) => {
  const pref = row?.user_notification_preferences;
  if (Array.isArray(pref) && pref.length) {
    const value = pref[0]?.weekly_progress_summary;
    return typeof value === 'boolean' ? value : true;
  }
  if (pref && typeof pref.weekly_progress_summary === 'boolean') {
    return pref.weekly_progress_summary;
  }
  return true;
};

const resolveWeekAnchor = (row) => {
  const anchor = row?.user_week_anchors;
  const value = Array.isArray(anchor) && anchor.length ? anchor[0]?.anchor_date : anchor?.anchor_date;
  return parseDateOnly(value);
};

const resolveLastWeekStart = (row) => {
  const state = row?.user_weekly_report_state;
  return Array.isArray(state) && state.length ? state[0]?.last_week_start : state?.last_week_start;
};

const fetchWeeklyPerformance = async (userId, startIso, endIso) => {
  const filters = supabase
    .from('user_workout_sessions')
    .select('scheduled_date, status, completed_at, workouts, user_workout_plans!inner(user_id)')
    .eq('user_workout_plans.user_id', userId);

  if (startIso) filters.gte('scheduled_date', startIso);
  if (endIso) filters.lte('scheduled_date', endIso);

  const { data, error } = await filters.order('scheduled_date', { ascending: true });
  if (error) throw error;

  const sessions = Array.isArray(data) ? data : [];
  let totalWatchedSeconds = 0;
  let totalTargetSeconds = 0;
  let sessionsCompleted = 0;

  sessions.forEach((session) => {
    const isCompleted = Boolean(session?.completed_at) || session?.status === 'completed';
    if (isCompleted) sessionsCompleted += 1;
    const workouts = Array.isArray(session?.workouts) ? session.workouts : [];
    workouts.forEach((workout) => {
      if (!workout || typeof workout !== 'object') return;
      const watched = Number(workout.watchedSeconds);
      if (Number.isFinite(watched) && watched > 0) {
        totalWatchedSeconds += watched;
      }
      let target = Number(workout.targetDurationSec);
      if (!Number.isFinite(target) || target <= 0) {
        const fallback = parsePrescriptionDuration(workout.prescription);
        if (Number.isFinite(fallback) && fallback > 0) {
          target = fallback;
        }
      }
      if (Number.isFinite(target) && target > 0) {
        totalTargetSeconds += target;
      }
    });
  });

  const percentWatched =
    totalTargetSeconds > 0 ? Math.min(100, (totalWatchedSeconds / totalTargetSeconds) * 100) : null;
  let performanceLabel = 'Getting started';
  if (Number.isFinite(percentWatched)) {
    if (percentWatched >= 90) performanceLabel = 'Excellent';
    else if (percentWatched >= 75) performanceLabel = 'Good';
    else if (percentWatched >= 50) performanceLabel = 'Fair';
    else performanceLabel = 'Needs Work';
  }

  return {
    sessionsCompleted,
    totalWatchedMinutes: Math.round(totalWatchedSeconds / 60),
    percentWatched,
    performanceLabel
  };
};

const buildHabitMap = (entries) => {
  const map = new Map();
  entries.forEach((entry) => {
    const iso = entry?.habit_date;
    const key = entry?.habit_key;
    if (!iso || !key) return;
    const record = map.get(iso) || { sleep: null, nosugar: null, water: null };
    if (key === 'sleep') {
      const value = Number(entry?.value);
      if (Number.isFinite(value)) {
        record.sleep = record.sleep == null ? value : Math.max(record.sleep, value);
      }
    } else if (key === 'water') {
      const value = Number(entry?.value);
      if (Number.isFinite(value)) {
        record.water = record.water == null ? value : Math.max(record.water, value);
      }
    } else if (key === 'nosugar') {
      if (entry?.status === true) record.nosugar = true;
      if (record.nosugar == null && entry?.status === false) record.nosugar = false;
    }
    map.set(iso, record);
  });
  return map;
};

const resolveMealGoal = async (profileGoal) => {
  const goalSlug = normalizeGoalSlug(profileGoal) || 'general-fitness';
  let { data: goalRow, error: goalError } = await supabase
    .from('meal_goals')
    .select('id, slug, title')
    .eq('slug', goalSlug)
    .maybeSingle();
  if (goalError && goalError.code !== 'PGRST116') throw goalError;

  if (!goalRow && profileGoal) {
    const { data: goalByTitle, error: titleError } = await supabase
      .from('meal_goals')
      .select('id, slug, title')
      .ilike('title', profileGoal)
      .maybeSingle();
    if (titleError && titleError.code !== 'PGRST116') throw titleError;
    goalRow = goalByTitle || null;
  }

  if (!goalRow && goalSlug !== 'general-fitness') {
    const { data: fallbackGoal, error: fallbackError } = await supabase
      .from('meal_goals')
      .select('id, slug, title')
      .eq('slug', 'general-fitness')
      .maybeSingle();
    if (fallbackError && fallbackError.code !== 'PGRST116') throw fallbackError;
    goalRow = fallbackGoal || null;
  }

  return goalRow;
};

const resolveMealLevel = async (userId) => {
  const { data: activePlan, error: planError } = await supabase
    .from('user_meal_plans')
    .select('current_level_id')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();
  if (planError && planError.code !== 'PGRST116') throw planError;

  let levelRow = null;
  if (activePlan?.current_level_id) {
    const { data, error } = await supabase
      .from('plan_levels')
      .select('id, code')
      .eq('id', activePlan.current_level_id)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    levelRow = data || null;
  }

  if (!levelRow) {
    const { data, error } = await supabase
      .from('plan_levels')
      .select('id, code')
      .eq('code', 'Beginner')
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    levelRow = data || null;
  }

  return levelRow;
};

const templateCache = new Map();
const getMealTemplateForGoalLevel = async (goalId, levelId) => {
  if (!goalId || !levelId) return new Map();
  const cacheKey = `${goalId}:${levelId}`;
  if (templateCache.has(cacheKey)) return templateCache.get(cacheKey);
  const { data, error } = await supabase
    .from('meal_template_days')
    .select('weekday, meal_template_meals(id)')
    .eq('goal_id', goalId)
    .eq('level_id', levelId)
    .order('weekday', { ascending: true });
  if (error && error.code !== 'PGRST116') throw error;
  const map = new Map();
  (data || []).forEach((day) => {
    const weekday = day?.weekday;
    if (!weekday) return;
    const meals = Array.isArray(day?.meal_template_meals) ? day.meal_template_meals : [];
    map.set(Number(weekday), meals);
  });
  templateCache.set(cacheKey, map);
  return map;
};

const fetchMealCompletionsByDate = async (userId, startIso, endIso) => {
  const { data, error } = await supabase
    .from('user_meal_completions')
    .select('meal_date, meal_id')
    .eq('user_id', userId)
    .gte('meal_date', startIso)
    .lte('meal_date', endIso);
  if (error && error.code !== 'PGRST116') throw error;
  const map = new Map();
  (data || []).forEach((row) => {
    const date = row?.meal_date;
    const mealId = row?.meal_id;
    if (!date || !mealId) return;
    const entry = map.get(date) || new Set();
    entry.add(String(mealId));
    map.set(date, entry);
  });
  return map;
};

const fetchHabitSummary = async ({ userId, startIso, endIso, weightKg, profileGoal }) => {
  const { data: habitRows, error: habitError } = await supabase
    .from('user_habit_logs')
    .select('habit_date, habit_key, value, status')
    .eq('user_id', userId)
    .gte('habit_date', startIso)
    .lte('habit_date', endIso);
  if (habitError && habitError.code !== 'PGRST116') throw habitError;

  const habitMap = buildHabitMap(Array.isArray(habitRows) ? habitRows : []);
  const hydrationBase = weightKg && Number.isFinite(weightKg) ? Math.round(weightKg * 35) : DEFAULT_HYDRATION_BASE_ML;

  const goalRow = await resolveMealGoal(profileGoal);
  const levelRow = await resolveMealLevel(userId);
  const templateByWeekday = await getMealTemplateForGoalLevel(goalRow?.id, levelRow?.id);
  const mealCompletionsByDate = await fetchMealCompletionsByDate(userId, startIso, endIso);

  let proteinDays = 0;
  let sleepDays = 0;
  let noSugarDays = 0;
  let waterDays = 0;

  const startDate = parseDateOnly(startIso);
  if (!startDate) {
    return { totalDays: 7, proteinDays, sleepDays, noSugarDays, waterDays };
  }

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
    const iso = toISODate(date);
    if (!iso) continue;
    const entry = habitMap.get(iso);
    if (entry?.sleep != null && Number(entry.sleep) >= 8) sleepDays += 1;
    if (entry?.nosugar === true) noSugarDays += 1;
    if (entry?.water != null && Number(entry.water) >= hydrationBase) waterDays += 1;

    const weekday = toWeekdayIndex(date);
    const plannedMeals = templateByWeekday.get(weekday) || [];
    if (!plannedMeals.length) continue;
    const completedSet = mealCompletionsByDate.get(iso) || new Set();
    const completedCount = plannedMeals.reduce(
      (sum, meal) => (completedSet.has(String(meal?.id)) ? sum + 1 : sum),
      0
    );
    const ratio = plannedMeals.length ? completedCount / plannedMeals.length : 0;
    if (ratio >= 0.8) proteinDays += 1;
  }

  return { totalDays: 7, proteinDays, sleepDays, noSugarDays, waterDays };
};

const markWeeklyReportSent = async (userId, weekStartIso) => {
  if (!userId || !weekStartIso) return;
  await supabase
    .from('user_weekly_report_state')
    .upsert(
      [
        {
          user_id: userId,
          last_week_start: weekStartIso,
          updated_at: new Date().toISOString()
        }
      ],
      { onConflict: 'user_id' }
    );
};

export async function runWeeklyReportSweep() {
  if (sweepInProgress) return;
  sweepInProgress = true;
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        'id, name, email, user_notification_preferences(weekly_progress_summary), user_week_anchors(anchor_date), user_weekly_report_state(last_week_start)'
      );

    if (error) {
      if (error.code === '42P01') {
        console.warn('Weekly report sweep skipped: missing tables. Run migrations.');
        return;
      }
      throw error;
    }

    const rows = Array.isArray(data) ? data : [];
    const now = new Date();

    for (const row of rows) {
      if (!row?.email) continue;
      if (!resolveWeeklyPref(row)) continue;

      const anchorDate = resolveWeekAnchor(row);
      const { start, end } = getWeekRange(now, anchorDate);
      const weekStartIso = toISODate(start);
      const weekEndIso = toISODate(end);
      if (!weekStartIso || !weekEndIso) continue;

      const lastWeekStart = resolveLastWeekStart(row);
      if (lastWeekStart && String(lastWeekStart) === weekStartIso) continue;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('weight_kg, goal')
        .eq('user_id', row.id)
        .maybeSingle();
      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      const performance = await fetchWeeklyPerformance(row.id, weekStartIso, weekEndIso);
      const habits = await fetchHabitSummary({
        userId: row.id,
        startIso: weekStartIso,
        endIso: weekEndIso,
        weightKg: profile?.weight_kg ? Number(profile.weight_kg) : null,
        profileGoal: profile?.goal || null
      });

      const report = buildWeeklyReportEmail({
        userName: row.name,
        weekStart: weekStartIso,
        weekEnd: weekEndIso,
        performance,
        habits,
        appUrl: process.env.APP_URL || undefined
      });

      try {
        const result = await sendEmail({
          to: row.email,
          subject: report.subject,
          html: report.html,
          text: report.text
        });
        if (result?.ok || result?.skipped) {
          await markWeeklyReportSent(row.id, weekStartIso);
        }
      } catch (sendErr) {
        console.warn('Failed to send weekly report email', sendErr);
      }
    }
  } catch (err) {
    console.error('Weekly report sweep failed', err);
  } finally {
    sweepInProgress = false;
  }
}

export function startWeeklyReportMonitor() {
  if (
    String(process.env.DISABLE_WEEKLY_REPORT_JOBS || '').toLowerCase() === 'true' ||
    String(process.env.DISABLE_INACTIVITY_JOBS || '').toLowerCase() === 'true'
  ) {
    console.log('Weekly report monitor disabled via env flag.');
    return;
  }
  if (!process.env.SUPABASE_URL && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Weekly report monitor skipped: Supabase env vars not set.');
    return;
  }
  const intervalHours = Number(process.env.WEEKLY_REPORT_SWEEP_HOURS || 12);
  runWeeklyReportSweep();
  setInterval(runWeeklyReportSweep, Math.max(1, intervalHours) * 60 * 60 * 1000);
}
