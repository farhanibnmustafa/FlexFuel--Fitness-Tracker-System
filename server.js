import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import os from 'os';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { supabase } from './supabaseClient.js';
import { getDailyWorkout, searchExerciseVideos } from './workoutService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.APP_PORT || process.env.PORT) || 3000;
const execFileAsync = promisify(execFile);

function usernameFromName(name) {
  return String(name || '').trim().replace(/\s+/g, '').toLowerCase();
}

function sanitizeUsername(value) {
  const trimmed = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return trimmed || null;
}

function deriveDisplayName(authUser) {
  const meta = authUser?.user_metadata || {};
  const candidates = [
    meta.full_name,
    meta.name,
    [meta.given_name, meta.family_name].filter(Boolean).join(' ').trim(),
    authUser?.email ? authUser.email.split('@')[0] : null
  ];
  const name = candidates.find((item) => item && String(item).trim().length) || 'Athlete';
  return String(name).trim();
}


async function generateUniqueUsername(baseValue, email) {
  const fallback = email ? email.split('@')[0] : 'user';
  const base = sanitizeUsername(baseValue) || sanitizeUsername(usernameFromName(baseValue)) || sanitizeUsername(fallback) || `user${Date.now()}`;
  let candidate = base;
  let attempt = 0;
  while (attempt < 8) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', candidate)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') {
      console.warn('Username lookup failed', error);
      return candidate;
    }
    if (!error && !data) {
      return candidate;
    }
    candidate = sanitizeUsername(`${base}${Math.floor(Math.random() * 10000)}`) || `${base}${Date.now()}`;
    attempt += 1;
  }
  return `${base}${Date.now()}`;
}

function generateRandomPassword() {
  return crypto.randomBytes(24).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
}

function hasPositiveNumber(value) {
  if (value === null || value === undefined) return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}

function hasMeaningfulText(value) {
  if (typeof value !== 'string') return false;
  return value.trim().length > 0;
}

function needsHealthProfile(profile) {
  if (!profile) return true;
  const heightOk = hasPositiveNumber(profile.height_cm);
  const weightOk = hasPositiveNumber(profile.weight_kg);
  const goalOk = hasMeaningfulText(profile.goal);
  return !(heightOk && weightOk && goalOk);
}

function normalizeProfileRow(profile) {
  if (!profile) return null;
  const normalized = { ...profile };
  if (typeof normalized.allergies === 'string') {
    try {
      const parsed = JSON.parse(normalized.allergies);
      if (Array.isArray(parsed)) normalized.allergies = parsed;
    } catch {
      /* leave as-is */
    }
  }
  return normalized;
}

function extractProviderIdentity(authUser) {
  if (!authUser) return { provider: null, providerUserId: null };
  const identities = Array.isArray(authUser.identities) ? authUser.identities : [];
  const preferredProvider = authUser.app_metadata?.provider || null;
  const primaryIdentity = identities.find((item) => item.provider === preferredProvider) || identities[0] || null;
  const providerRaw = primaryIdentity?.provider || preferredProvider || authUser.user_metadata?.provider || null;
  const provider = providerRaw ? String(providerRaw).toLowerCase() : null;
  const providerUserId = primaryIdentity?.provider_id || authUser.id || null;
  return { provider, providerUserId };
}

function resolveProviderAvatar(authUser) {
  if (!authUser) return null;
  const meta = authUser.user_metadata || {};
  const candidates = [
    meta.avatar_url,
    meta.avatarUrl,
    meta.avatar,
    meta.picture,
    meta.photo_url,
    authUser.picture
  ];
  const match = candidates.find((value) => typeof value === 'string' && value.trim().length);
  return match ? match.trim() : null;
}

async function findUserByProvider(provider, providerUserId) {
  if (!provider || !providerUserId) return null;
  const providerKey = String(provider).toLowerCase();
  const identityKey = String(providerUserId);
  const { data, error } = await supabase
    .from('user_providers')
    .select('user_id')
    .eq('provider', providerKey)
    .eq('provider_user_id', identityKey)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data?.user_id) {
    if (providerKey === 'local') {
      const { data: userRow, error: legacyError } = await supabase
        .from('users')
        .select('id, username, name')
        .eq('email', identityKey)
        .maybeSingle();
      if (legacyError) {
        throw legacyError;
      }
      if (userRow?.id) {
        await recordProviderIdentity(userRow.id, providerKey, identityKey);
        return userRow;
      }
    }
    return null;
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id, username, name')
    .eq('id', data.user_id)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  return userRow || null;
}


async function recordProviderIdentity(userId, provider, providerUserId) {
  if (!userId || !provider || !providerUserId) return;
  const normalizedProvider = String(provider).toLowerCase();
  const normalizedProviderUserId = String(providerUserId);
  const { error } = await supabase
    .from('user_providers')
    .upsert(
      [
        {
          user_id: userId,
          provider: normalizedProvider,
          provider_user_id: normalizedProviderUserId
        }
      ],
      { onConflict: 'provider,provider_user_id' }
    );
  if (error && error.code !== '23505') {
    console.warn('Failed to record provider identity', error);
  }
}

const VALID_PLAN_LEVELS = new Set(['Beginner', 'Intermediate', 'Advanced']);

function normalizeGoalSlug(goalValue) {
  if (!goalValue) return null;
  const slug = String(goalValue)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || null;
}

function toISODate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return null;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toWeekdayIndex(date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function formatPlanDateLabel(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

async function fetchActiveWorkoutPlans(userId) {
  const { data, error } = await supabase
    .from('user_workout_plans')
    .select('id, goal_slug, schema_version, archived')
    .eq('user_id', userId)
    .eq('archived', false);

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data : [];
}

async function ensureWorkoutPlanForUser({ userId, activityDate, goalSlug, schemaVersion }) {
  const plans = await fetchActiveWorkoutPlans(userId);
  const normalizedGoal = normalizeGoalSlug(goalSlug) || 'general-fitness';
  const matchingPlan = plans.find((plan) => normalizeGoalSlug(plan.goal_slug) === normalizedGoal) || plans[0];

  if (matchingPlan) {
    return { plan: matchingPlan, plans };
  }

  const todayIso = activityDate || new Date().toISOString().slice(0, 10);

  const insertPayload = {
    user_id: userId,
    schema_version: schemaVersion || '1.0',
    goal_slug: normalizedGoal,
    start_date: todayIso
  };

  const { data: created, error: insertError } = await supabase
    .from('user_workout_plans')
    .insert([insertPayload], { returning: 'representation' })
    .select('id, goal_slug, schema_version, archived')
    .single();

  if (insertError) {
    throw insertError;
  }

  const nextPlans = [...plans, created];
  return { plan: created, plans: nextPlans };
}

function sanitizeWorkoutsPayload(workouts) {
  if (!Array.isArray(workouts)) return [];
  return workouts
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const name = typeof item.exercise === 'string' && item.exercise.trim() ? item.exercise.trim() : item.name?.trim();
      const prescription =
        typeof item.prescription === 'string' && item.prescription.trim() ? item.prescription.trim() : item.description?.trim();
      const video = typeof item.video === 'string' && item.video.trim() ? item.video.trim() : null;
      const videoEmbed = typeof item.videoEmbed === 'string' && item.videoEmbed.trim() ? item.videoEmbed.trim() : null;
      const targetBurn = Number.isFinite(Number(item.targetBurn)) ? Number(item.targetBurn) : null;
      return {
        name: name || 'Workout',
        prescription: prescription || '',
        video,
        videoEmbed,
        targetBurn
      };
    })
    .filter(Boolean);
}

async function loadWorkoutSessionsForPlans(planIds, { date } = {}) {
  if (!Array.isArray(planIds) || planIds.length === 0) {
    return [];
  }

  let query = supabase
    .from('user_workout_sessions')
    .select('plan_id, scheduled_date, adjusted_burn, base_burn, level_code, status, actual_metrics')
    .in('plan_id', planIds)
    .order('scheduled_date', { ascending: false });

  if (date) {
    query = query.eq('scheduled_date', date);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return Array.isArray(data) ? data : [];
}

function buildActivityEntries(plans, sessions) {
  if (!Array.isArray(plans) || !Array.isArray(sessions)) {
    return [];
  }
  const planGoalLookup = new Map(
    plans
      .filter((plan) => plan && plan.id)
      .map((plan) => [plan.id, normalizeGoalSlug(plan.goal_slug)])
  );

  return sessions
    .filter((session) => session.status === 'completed')
    .map((session) => {
      const sessionMetrics = session.actual_metrics && typeof session.actual_metrics === 'object' ? session.actual_metrics : {};
      const calories = Number(session.adjusted_burn ?? session.base_burn ?? 0);
      const fallbackGoal = planGoalLookup.get(session.plan_id) || null;
      return {
        plan_id: session.plan_id,
        activity_date: session.scheduled_date,
        calories: Number.isFinite(calories) ? calories : 0,
        level: session.level_code || null,
        goal_slug: normalizeGoalSlug(sessionMetrics.goal_slug) || fallbackGoal
      };
    })
    .filter((entry) => entry.activity_date);
}

function summarizeWorkoutEntries(entries) {
  const safeEntries = Array.isArray(entries) ? entries : [];
  const totalCalories = safeEntries.reduce((sum, entry) => sum + Number(entry.calories || 0), 0);
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayCalories = safeEntries
    .filter((entry) => entry.activity_date === todayIso)
    .reduce((sum, entry) => sum + Number(entry.calories || 0), 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysIso = sevenDaysAgo.toISOString().slice(0, 10);
  const recent = safeEntries.filter((entry) => entry.activity_date >= sevenDaysIso);

  return {
    entries: safeEntries,
    totalCalories,
    todayCalories,
    recent
  };
}

async function getWorkoutActivitySummary(userId) {
  const plans = await fetchActiveWorkoutPlans(userId);
  if (!plans.length) {
    return {
      plans: [],
      entries: [],
      recent: [],
      totalCalories: 0,
      todayCalories: 0
    };
  }

  const planIds = plans.map((plan) => plan.id).filter(Boolean);
  const sessions = await loadWorkoutSessionsForPlans(planIds);
  const { entries, totalCalories, todayCalories, recent } = summarizeWorkoutEntries(buildActivityEntries(plans, sessions));
  return {
    plans,
    entries,
    recent,
    totalCalories,
    todayCalories
  };
}

async function getWorkoutActivityByDate(userId, date) {
  const plans = await fetchActiveWorkoutPlans(userId);
  if (!plans.length) {
    return { plans: [], entries: [] };
  }
  const planIds = plans.map((plan) => plan.id).filter(Boolean);
  const sessions = await loadWorkoutSessionsForPlans(planIds, { date });
  const entries = buildActivityEntries(plans, sessions);
  return { plans, entries };
}

async function provisionOAuthAccount(authUser) {
  const email = String(authUser?.email || '').trim().toLowerCase();
  if (!email) {
    throw new Error('OAuth user missing email');
  }

  const { provider, providerUserId } = extractProviderIdentity(authUser);
  if (!provider || !providerUserId) {
    throw new Error('OAuth user missing provider identity');
  }

  const providerAvatar = resolveProviderAvatar(authUser);

  const existing = await findUserByProvider(provider, providerUserId);
  if (existing) {
    return existing;
  }

  const name = deriveDisplayName(authUser);
  const username = await generateUniqueUsername(name, email);
  const password = generateRandomPassword();
  const password_hash = await bcrypt.hash(password, 10);

  const { data: newUser, error: userInsertError } = await supabase
    .from('users')
    .insert(
      [
        {
          email,
          username,
          password_hash,
          name,
          gender: null
        }
      ],
      { returning: 'representation' }
    )
    .select('id, username, name')
    .single();

  if (userInsertError) {
    throw userInsertError;
  }

  if (newUser?.id) {
    await recordProviderIdentity(newUser.id, provider, providerUserId);
    const { error: profileInsertError } = await supabase.from('profiles').insert([
      {
        user_id: newUser.id,
        age: null,
        height_cm: null,
        weight_kg: null,
        bmi: null,
        goal: null,
        target_weight: null,
        preference: null,
        allergies: null,
        avatar_url: providerAvatar
      }
    ]);

    if (profileInsertError && profileInsertError.code !== '23505') {
      console.warn('Failed to create profile for OAuth user', profileInsertError);
    }
  }

  return newUser;
}

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

const PUBLIC_SUPABASE_URL = process.env.SUPABASE_URL || '';
const PUBLIC_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// APIs
app.post('/api/register', async (req, res) => {
  const { name, email, age, gender, password, height_cm, weight_kg, goal, target_weight } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
  const username = req.body.username ? String(req.body.username).trim().toLowerCase() : usernameFromName(name);
  const password_hash = await bcrypt.hash(password, 10);
  const normalizedEmail = String(email).trim().toLowerCase();

  let userId = null;
  try {
    const existingLocal = await findUserByProvider('local', normalizedEmail);
    if (existingLocal) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .insert(
        [
          {
            email: normalizedEmail,
            username,
            password_hash,
            name,
            gender: gender || null
          }
        ],
        { returning: 'representation' }
      )
      .select('id')
      .single();

    if (userError) {
      if (userError.code === '23505') {
        return res.status(409).json({ error: 'Email or username already exists' });
      }
      throw userError;
    }

    userId = userRow?.id;
    if (!userId) {
      throw new Error('Failed to create user record');
    }

    await recordProviderIdentity(userId, 'local', normalizedEmail);

    let bmi = null;
    const h = parseFloat(height_cm);
    const w = parseFloat(weight_kg);
    if (h > 0 && w > 0) {
      const m = h / 100.0;
      bmi = w / (m * m);
    }
    const ageValue = age ? Number(age) : null;
    const heightValue = height_cm ? Number(height_cm) : null;
    const weightValue = weight_kg ? Number(weight_kg) : null;
    const targetValue = target_weight ? Number(target_weight) : null;
    const profilePayload = {
      user_id: userId,
      age: ageValue,
      height_cm: heightValue,
      weight_kg: weightValue,
      bmi: bmi ? Number(bmi.toFixed(1)) : null,
      goal: goal || null,
      target_weight: targetValue
    };

    const { error: profileError } = await supabase.from('profiles').insert([profilePayload]);
    if (profileError) {
      await supabase.from('users').delete().eq('id', userId);
      throw profileError;
    }

    req.session.user = { id: userId, username, name, needsHealthInfo: false };
    res.json({ ok: true, username, needsHealthInfo: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const ekey = String(email).trim().toLowerCase();
  let userProviderTarget = null;
  try {
    userProviderTarget = await findUserByProvider('local', ekey);
  } catch (err) {
    console.error('Login provider lookup failed', err);
    return res.status(500).json({ error: 'Server error' });
  }
  if (!userProviderTarget?.id) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, password_hash, name, username')
    .eq('id', userProviderTarget.id)
    .maybeSingle();
  if (error) {
    console.error('Login lookup failed', error);
    return res.status(500).json({ error: 'Server error' });
  }
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('age, height_cm, weight_kg, goal, target_weight, bmi, preference, allergies, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle();
  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Failed to load profile during login', profileError);
    return res.status(500).json({ error: 'Server error' });
  }
  const normalizedProfile = normalizeProfileRow(profile);
  const needsHealthInfo = needsHealthProfile(normalizedProfile);
  req.session.user = { id: user.id, username: user.username, name: user.name, needsHealthInfo };
  res.json({ ok: true, username: user.username, name: user.name, needsHealthInfo });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.post('/api/oauth/session', async (req, res) => {
  const { access_token: accessToken } = req.body || {};
  if (req.session.user) {
    return res.json({ ok: true });
  }
  if (!accessToken) {
    return res.status(400).json({ error: 'Missing access token' });
  }

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid OAuth session' });
    }

    const { provider, providerUserId } = extractProviderIdentity(data.user);
    const providerAvatar = resolveProviderAvatar(data.user);
    if (!provider || !providerUserId) {
      return res.status(400).json({ error: 'OAuth profile missing provider identity' });
    }

    let resolvedAccount = null;
    try {
      resolvedAccount = await findUserByProvider(provider, providerUserId);
    } catch (lookupError) {
      console.error('Failed to lookup provider account', lookupError);
      return res.status(500).json({ error: 'Failed to verify provider account' });
    }

    if (!resolvedAccount) {
      try {
        resolvedAccount = await provisionOAuthAccount(data.user);
      } catch (provisionErr) {
        console.error('Failed to provision OAuth account', provisionErr);
        return res.status(500).json({ error: 'Failed to provision account' });
      }
      if (!resolvedAccount) {
        return res.status(500).json({ error: 'Account provisioning incomplete' });
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('age, height_cm, weight_kg, goal, target_weight, bmi, preference, allergies, avatar_url')
      .eq('user_id', resolvedAccount.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Failed to load profile during OAuth session', profileError);
      return res.status(500).json({ error: 'Failed to load profile' });
    }

    let normalizedProfile = normalizeProfileRow(profile);
    if (providerAvatar && !(normalizedProfile && normalizedProfile.avatar_url)) {
      try {
        await supabase
          .from('profiles')
          .upsert(
            [
              {
                user_id: resolvedAccount.id,
                avatar_url: providerAvatar,
                updated_at: new Date().toISOString()
              }
            ],
            { onConflict: 'user_id' }
          );
        normalizedProfile = { ...(normalizedProfile || {}), avatar_url: providerAvatar };
      } catch (avatarSyncError) {
        console.warn('Failed to sync provider avatar', avatarSyncError);
      }
    }
    const needsHealthInfo = needsHealthProfile(normalizedProfile);

    req.session.user = {
      id: resolvedAccount.id,
      username: resolvedAccount.username,
      name: resolvedAccount.name,
      needsHealthInfo
    };

    res.json({ ok: true, needsHealthInfo });
  } catch (err) {
    console.error('Failed to bootstrap OAuth session', err);
    res.status(401).json({ error: 'Failed to validate OAuth session' });
  }
});

app.get('/api/me', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { data: account, error: accountError } = await supabase
      .from('users')
      .select('name, username, email')
      .eq('id', req.session.user.id)
      .maybeSingle();

    if (accountError) {
      throw accountError;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('age, height_cm, weight_kg, bmi, goal, target_weight, preference, allergies, avatar_url')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    const normalizedProfile = normalizeProfileRow(profile);
    const needsHealthInfo = needsHealthProfile(normalizedProfile);
    res.json({
      user: {
        id: req.session.user.id,
        name: account?.name || req.session.user.name,
        username: account?.username || req.session.user.username,
        email: account?.email || null,
        profile: normalizedProfile,
        needsHealthInfo
      }
    });
  } catch (err) {
    console.error('Failed to load profile', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

app.get('/api/meal-plans', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const startParam = String(req.query.start || '').trim();
  const daysParam = Number(req.query.days || 90);
  const days = Number.isFinite(daysParam) ? Math.min(90, Math.max(1, Math.round(daysParam))) : 90;
  const startDate = startParam ? new Date(`${startParam}T00:00:00`) : new Date();
  if (Number.isNaN(startDate.getTime())) {
    return res.status(400).json({ error: 'Invalid start date' });
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('goal')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    const goalSlug = normalizeGoalSlug(profile?.goal) || 'general-fitness';
    let { data: goalRow, error: goalError } = await supabase
      .from('meal_goals')
      .select('id, slug, title')
      .eq('slug', goalSlug)
      .maybeSingle();

    if (goalError && goalError.code !== 'PGRST116') {
      throw goalError;
    }

    if (!goalRow && profile?.goal) {
      const { data: goalByTitle, error: titleError } = await supabase
        .from('meal_goals')
        .select('id, slug, title')
        .ilike('title', profile.goal)
        .maybeSingle();
      if (titleError && titleError.code !== 'PGRST116') {
        throw titleError;
      }
      goalRow = goalByTitle || null;
    }

    if (!goalRow && goalSlug !== 'general-fitness') {
      const { data: fallbackGoal, error: fallbackError } = await supabase
        .from('meal_goals')
        .select('id, slug, title')
        .eq('slug', 'general-fitness')
        .maybeSingle();
      if (fallbackError && fallbackError.code !== 'PGRST116') {
        throw fallbackError;
      }
      goalRow = fallbackGoal || null;
    }

    if (!goalRow) {
      return res.json({ mealsByDate: {}, source: 'supabase' });
    }

    const { data: activePlan, error: planError } = await supabase
      .from('user_meal_plans')
      .select('current_level_id')
      .eq('user_id', req.session.user.id)
      .eq('active', true)
      .maybeSingle();

    if (planError && planError.code !== 'PGRST116') {
      throw planError;
    }

    let { data: levelRow, error: levelError } = activePlan?.current_level_id
      ? await supabase
          .from('plan_levels')
          .select('id, code, portion_multiplier, notes')
          .eq('id', activePlan.current_level_id)
          .maybeSingle()
      : { data: null, error: null };

    if (levelError && levelError.code !== 'PGRST116') {
      throw levelError;
    }

    if (!levelRow) {
      const { data: defaultLevel, error: defaultError } = await supabase
        .from('plan_levels')
        .select('id, code, portion_multiplier, notes')
        .eq('code', 'Beginner')
        .maybeSingle();
      if (defaultError && defaultError.code !== 'PGRST116') {
        throw defaultError;
      }
      levelRow = defaultLevel || null;
    }

    if (!levelRow) {
      return res.json({ mealsByDate: {}, source: 'supabase' });
    }

    const { data: templateDays, error: templateError } = await supabase
      .from('meal_template_days')
      .select(
        `id, weekday, base_daily_kcal, base_daily_protein, base_daily_carbs, base_daily_fat,
         meal_template_meals (id, meal_label, food_description, base_kcal, base_protein, base_carbs, base_fat, meal_order)`
      )
      .eq('goal_id', goalRow.id)
      .eq('level_id', levelRow.id)
      .order('weekday', { ascending: true })
      .order('meal_order', { foreignTable: 'meal_template_meals', ascending: true });

    if (templateError) {
      throw templateError;
    }

    if (!templateDays?.length) {
      return res.json({ mealsByDate: {}, source: 'supabase' });
    }

    const mealIds = templateDays
      .flatMap((day) => (Array.isArray(day.meal_template_meals) ? day.meal_template_meals : []))
      .map((meal) => meal.id)
      .filter(Boolean);

    const optionsByMealId = new Map();
    if (mealIds.length) {
      const { data: optionRows, error: optionError } = await supabase
        .from('meal_template_options')
        .select('id, template_meal_id, option_label, food_description, base_kcal, base_protein, base_carbs, base_fat, option_order')
        .in('template_meal_id', mealIds)
        .order('option_order', { ascending: true });

      if (optionError) {
        throw optionError;
      }

      (optionRows || []).forEach((option) => {
        const list = optionsByMealId.get(option.template_meal_id) || [];
        list.push(option);
        optionsByMealId.set(option.template_meal_id, list);
      });
    }

    const sumMacros = (meals) =>
      meals.reduce(
        (totals, meal) => {
          totals.calories += Number(meal.calories || 0);
          totals.protein += Number(meal.protein || 0);
          totals.carbs += Number(meal.carbs || 0);
          totals.fat += Number(meal.fat || 0);
          return totals;
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

    const templateByWeekday = new Map(templateDays.map((day) => [day.weekday, day]));
    const mealsByDate = {};
    const baseDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    for (let offset = 0; offset < days; offset += 1) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + offset);
      const iso = toISODate(date);
      const weekday = toWeekdayIndex(date);
      const templateDay = templateByWeekday.get(weekday);
      if (!templateDay || !iso) continue;

      const rawMeals = Array.isArray(templateDay.meal_template_meals)
        ? templateDay.meal_template_meals
        : [];
      const meals = rawMeals
        .slice()
        .sort((a, b) => Number(a.meal_order || 0) - Number(b.meal_order || 0))
        .map((meal, index) => {
          const baseOption = {
            id: meal.id || `${templateDay.id}-${index}`,
            label: meal.meal_label,
            foods: meal.food_description,
            quantity: 'Standard serving',
            calories: meal.base_kcal,
            protein: meal.base_protein,
            carbs: meal.base_carbs,
            fat: meal.base_fat
          };
          const extraOptions = (optionsByMealId.get(meal.id) || []).map((option) => ({
            id: option.id,
            label: option.option_label || meal.meal_label,
            foods: option.food_description,
            quantity: 'Standard serving',
            calories: option.base_kcal,
            protein: option.base_protein,
            carbs: option.base_carbs,
            fat: option.base_fat
          }));
          const options = [baseOption, ...extraOptions];
          return {
            id: baseOption.id,
            type: meal.meal_label,
            label: meal.meal_label,
            foods: meal.food_description,
            quantity: 'Standard serving',
            calories: meal.base_kcal,
            protein: meal.base_protein,
            carbs: meal.base_carbs,
            fat: meal.base_fat,
            options: options.length > 1 ? options : undefined
          };
        });

      const totals = sumMacros(meals);
      const targetCalories = templateDay.base_daily_kcal || totals.calories;
      const macroTargets = {
        protein: templateDay.base_daily_protein ?? totals.protein,
        carbs: templateDay.base_daily_carbs ?? totals.carbs,
        fat: templateDay.base_daily_fat ?? totals.fat
      };

      mealsByDate[iso] = {
        dateIso: iso,
        label: formatPlanDateLabel(date),
        goal: goalRow.title,
        level: levelRow.code,
        dayOfWeek: date.toLocaleDateString(undefined, { weekday: 'long' }),
        portionMultiplier: levelRow.portion_multiplier,
        targetCalories,
        macroTargets,
        meals,
        subtitle: levelRow.notes ? `${levelRow.code} plan • ${levelRow.notes}` : 'Goal-based meals'
      };
    }

    return res.json({ mealsByDate, source: 'supabase' });
  } catch (err) {
    console.error('Failed to load meal plans', err);
    return res.status(500).json({ error: 'Failed to load meal plans' });
  }
});

app.put('/api/profile', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { weight_kg, height_cm, age, goal, target_weight, preference, allergies } = req.body || {};

  const parseNumber = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const weightValue = parseNumber(weight_kg);
  const heightValue = parseNumber(height_cm);
  const ageValue = parseNumber(age);
  const targetValue = parseNumber(target_weight);
  const goalValue = hasMeaningfulText(goal) ? goal.trim() : null;
  let bmiValue = null;
  if (weightValue && heightValue) {
    const meters = heightValue / 100;
    if (meters > 0) {
      bmiValue = Number((weightValue / (meters * meters)).toFixed(1));
    }
  }

  const normalizePreference = (value) => {
    if (Array.isArray(value)) {
      const first = value.map((item) => String(item || '').trim()).find(Boolean);
      return first || null;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const lowered = trimmed.toLowerCase();
      if (lowered === 'none' || lowered === 'no preference') return null;
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            const first = parsed.map((item) => String(item || '').trim()).find(Boolean);
            return first || null;
          }
        } catch (err) {
          /* ignore */
        }
      }
      return trimmed;
    }
    return null;
  };

  const normalizeAllergies = (value) => {
    const toArray = (src) =>
      src
        .map((item) => String(item || '').trim())
        .filter(Boolean);

    if (Array.isArray(value)) {
      const cleaned = toArray(value);
      return cleaned.length ? JSON.stringify(cleaned) : null;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      if (trimmed.toLowerCase() === 'none') return null;
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            const cleaned = toArray(parsed);
            return cleaned.length ? JSON.stringify(cleaned) : null;
          }
        } catch (err) {
          /* ignore */
        }
      }
      return JSON.stringify(toArray([trimmed]));
    }
    return null;
  };

  const preferenceValue = normalizePreference(preference);
  const allergiesValue = normalizeAllergies(allergies);

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        weight_kg: weightValue,
        height_cm: heightValue,
        age: ageValue,
        bmi: bmiValue,
        goal: goalValue,
        target_weight: targetValue,
        preference: preferenceValue,
        allergies: allergiesValue,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', req.session.user.id)
      .select('age, height_cm, weight_kg, bmi, goal, target_weight, preference, allergies, avatar_url');

    if (error) {
      throw error;
    }
    if (!data || !data.length) return res.status(404).json({ error: 'Profile not found' });
    const updated = normalizeProfileRow(data[0]);
    const needsHealthInfo = needsHealthProfile(updated);
    if (req.session.user) {
      req.session.user.needsHealthInfo = needsHealthInfo;
    }
    res.json({ ok: true, profile: updated, needsHealthInfo });
  } catch (err) {
    console.error('Failed to update profile', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.post('/api/profile/avatar', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { avatar } = req.body || {};
  if (!avatar || typeof avatar !== 'string') {
    return res.status(400).json({ error: 'Missing avatar data' });
  }
  if (!avatar.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Invalid image format' });
  }
  if (avatar.length > 4_000_000) {
    return res.status(413).json({ error: 'Image is too large' });
  }
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatar, updated_at: new Date().toISOString() })
      .eq('user_id', req.session.user.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to update avatar', err);
    res.status(500).json({ error: 'Failed to update avatar' });
  }
});

app.post('/api/convert-image', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { dataUrl } = req.body || {};
  if (!dataUrl || typeof dataUrl !== 'string') {
    return res.status(400).json({ error: 'Missing image data' });
  }

  const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (!match) {
    return res.status(400).json({ error: 'Invalid image data' });
  }

  const mimeType = match[1].toLowerCase();
  if (mimeType !== 'image/heic' && mimeType !== 'image/heif') {
    return res.status(400).json({ error: 'Only HEIC/HEIF images are supported' });
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length) {
    return res.status(400).json({ error: 'Empty image data' });
  }
  if (buffer.length > 4 * 1024 * 1024) {
    return res.status(413).json({ error: 'Image is too large' });
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'flexfule-'));
  const inputExt = mimeType === 'image/heif' ? 'heif' : 'heic';
  const inputPath = path.join(tempDir, `upload.${inputExt}`);
  const outputPath = path.join(tempDir, 'output.jpg');

  try {
    await fs.writeFile(inputPath, buffer);
    await execFileAsync('sips', ['-s', 'format', 'jpeg', inputPath, '--out', outputPath]);
    const converted = await fs.readFile(outputPath);
    const responseDataUrl = `data:image/jpeg;base64,${converted.toString('base64')}`;
    res.json({ ok: true, dataUrl: responseDataUrl });
  } catch (err) {
    console.error('Failed to convert HEIC image', err);
    res.status(500).json({ error: 'Failed to convert image' });
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.warn('Failed to clean temp image files', cleanupErr);
    }
  }
});

app.post('/api/change-password', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing password fields' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  try {
    const { data: account, error: loadError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.session.user.id)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!account) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(currentPassword, account.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const nextHash = await bcrypt.hash(String(newPassword), 10);
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: nextHash })
      .eq('id', req.session.user.id);
    if (updateError) throw updateError;
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to change password', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

app.post('/api/workouts/log', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { dateIso, burn, baseBurn, goalSlug, level, dayIndex, schemaVersion, workouts } = req.body || {};

  const parsedBurn = Number(burn);
  const calories = Number.isFinite(parsedBurn) ? Math.max(0, Math.round(parsedBurn)) : 0;

  let activityDate = null;
  if (typeof dateIso === 'string' && dateIso.trim()) {
    const trimmed = dateIso.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      activityDate = trimmed;
    } else {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        activityDate = parsed.toISOString().slice(0, 10);
      }
    }
  }
  if (!activityDate) {
    activityDate = new Date().toISOString().slice(0, 10);
  }

  const normalizedLevel = VALID_PLAN_LEVELS.has(level) ? level : 'Beginner';
  const normalizedGoal = normalizeGoalSlug(goalSlug);
  const numericDayIndex = Number.isInteger(Number(dayIndex)) ? Number(dayIndex) : 1;
  const sanitizedWorkouts = sanitizeWorkoutsPayload(workouts);
  const baseBurnValue = Number.isFinite(Number(baseBurn))
    ? Math.max(0, Math.round(Number(baseBurn)))
    : calories;
  const timestampIso = new Date().toISOString();
  try {
    const { plan, plans } = await ensureWorkoutPlanForUser({
      userId: req.session.user.id,
      goalSlug: normalizedGoal,
      activityDate,
      schemaVersion
    });

    const planGoalSlug = normalizeGoalSlug(plan.goal_slug) || normalizedGoal || 'general-fitness';
    const metricsPayload = {
      goal_slug: planGoalSlug,
      schema_version: plan.schema_version || schemaVersion || null,
      day_index: numericDayIndex,
      logged_burn: calories
    };

    const seedReferenceParts = [
      planGoalSlug || 'goal',
      normalizedLevel.toLowerCase(),
      `day${numericDayIndex}`,
      activityDate
    ];

    const sessionPayload = {
      plan_id: plan.id,
      scheduled_date: activityDate,
      day_index: numericDayIndex,
      level_code: normalizedLevel,
      seed_reference: seedReferenceParts.filter(Boolean).join(':'),
      workouts: sanitizedWorkouts,
      base_burn: baseBurnValue,
      adjusted_burn: calories,
      status: 'completed',
      completed_at: timestampIso,
      skipped_at: null,
      actual_metrics: metricsPayload,
      updated_at: timestampIso
    };

    const { data: sessionRow, error: sessionError } = await supabase
      .from('user_workout_sessions')
      .upsert([sessionPayload], { onConflict: 'plan_id,scheduled_date' })
      .select('plan_id, scheduled_date, adjusted_burn, base_burn, level_code, status, actual_metrics')
      .single();

    if (sessionError) throw sessionError;

    // Extract strength records from workout exercises
    if (Array.isArray(sanitizedWorkouts)) {
      const strengthExercises = {
        'bench press': 'Bench Press',
        'squat': 'Squat',
        'deadlift': 'Deadlift'
      };

      for (const workout of sanitizedWorkouts) {
        if (workout && typeof workout === 'object') {
          const exerciseName = String(workout.exercise || '').toLowerCase();
          const matchedExercise = Object.keys(strengthExercises).find(key => 
            exerciseName.includes(key)
          );

          if (matchedExercise) {
            // Try to extract weight from prescription or notes
            const prescription = String(workout.prescription || '');
            const weightMatch = prescription.match(/(\d+(?:\.\d+)?)\s*(?:kg|lb|lbs)/i);
            let weight = null;
            
            if (weightMatch) {
              weight = Number(weightMatch[1]);
              // Convert lbs to kg if needed
              if (prescription.toLowerCase().includes('lb')) {
                weight = weight * 0.453592;
              }
            } else {
              // Try to extract from notes or other fields
              const notes = String(workout.notes || '');
              const notesWeightMatch = notes.match(/(\d+(?:\.\d+)?)\s*(?:kg|lb|lbs)/i);
              if (notesWeightMatch) {
                weight = Number(notesWeightMatch[1]);
                if (notes.toLowerCase().includes('lb')) {
                  weight = weight * 0.453592;
                }
              }
            }

            if (weight && weight > 0) {
              // Check if this is a new PR
              const { data: existingRecords } = await supabase
                .from('strength_records')
                .select('weight_kg')
                .eq('user_id', req.session.user.id)
                .ilike('exercise_name', `%${strengthExercises[matchedExercise]}%`)
                .order('weight_kg', { ascending: false })
                .limit(1);

              const isNewPR = !existingRecords || existingRecords.length === 0 || 
                Number(weight) > Number(existingRecords[0]?.weight_kg || 0);

              if (isNewPR) {
                // Extract reps if available
                const repsMatch = prescription.match(/(\d+)\s*(?:x|×|reps?)/i);
                const reps = repsMatch ? Number(repsMatch[1]) : null;

                await supabase
                  .from('strength_records')
                  .insert({
                    user_id: req.session.user.id,
                    exercise_name: strengthExercises[matchedExercise],
                    weight_kg: weight,
                    reps: reps,
                    record_date: activityDate,
                    updated_at: timestampIso
                  });
              }
            }
          }
        }
      }
    }

    const planIds = plans.map((p) => p.id).filter(Boolean);
    const sessions = await loadWorkoutSessionsForPlans(planIds);
    const summary = summarizeWorkoutEntries(buildActivityEntries(plans, sessions));
    const entry = buildActivityEntries(plans, [sessionRow ?? sessionPayload])[0] || {
      activity_date: activityDate,
      calories,
      level: normalizedLevel,
      goal_slug: planGoalSlug
    };

    res.json({
      ok: true,
      entry,
      totals: {
        totalCalories: summary.totalCalories,
        todayCalories: summary.todayCalories
      }
    });
  } catch (err) {
    console.error('Failed to log workout activity', err);
    res.status(500).json({ error: 'Failed to log workout activity' });
  }
});

app.get('/api/workouts/activity', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { date } = req.query || {};
  try {
    if (typeof date === 'string' && date.trim()) {
      const trimmed = date.trim();
      const { entries } = await getWorkoutActivityByDate(req.session.user.id, trimmed);
      res.json({ entries });
      return;
    }

    const summary = await getWorkoutActivitySummary(req.session.user.id);
    res.json({
      entries: summary.entries,
      recent: summary.recent,
      totalCalories: summary.totalCalories,
      todayCalories: summary.todayCalories
    });
  } catch (err) {
    console.error('Failed to fetch workout activity', err);
    res.status(500).json({ error: 'Failed to fetch workout activity' });
  }
});

app.get('/api/workout-videos', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const version =
    typeof req.query.version === 'string' && req.query.version.trim()
      ? req.query.version.trim()
      : 'exercise_videos_v1';
  const limitParam = Number(req.query.limit);
  const normalizedLimit =
    Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.trunc(limitParam), 100) : undefined;

  const categoriesRaw = req.query.category ?? req.query.categories;
  const categoryFilters = [];
  const pushCategoryValues = (value) => {
    if (typeof value !== 'string') return;
    value
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean)
      .forEach((token) => categoryFilters.push(token));
  };
  if (Array.isArray(categoriesRaw)) {
    categoriesRaw.forEach(pushCategoryValues);
  } else if (typeof categoriesRaw === 'string') {
    pushCategoryValues(categoriesRaw);
  }

  try {
    const result = await searchExerciseVideos({
      query,
      categories: categoryFilters,
      limit: normalizedLimit,
      schemaVersion: version
    });
    res.json({
      query,
      schemaVersion: version,
      limit: normalizedLimit ?? 40,
      categories: categoryFilters,
      ...result
    });
  } catch (err) {
    console.error('Failed to search exercise videos', err);
    res.status(500).json({ error: 'Failed to search exercise videos' });
  }
});

app.get('/api/workouts/:goal/:day', async (req, res) => {
  const schemaVersion = typeof req.query.version === 'string' && req.query.version.trim() ? req.query.version.trim() : '1.0';
  const goal = req.params.goal;
  const dayValue = Number(req.params.day);

  if (!Number.isInteger(dayValue)) {
    return res.status(400).json({ error: 'Day must be an integer value' });
  }

  try {
    const workout = await getDailyWorkout({
      goalSlug: goal,
      dayNumber: dayValue,
      schemaVersion
    });
    res.json(workout);
  } catch (err) {
    const message = err instanceof Error && err.message ? err.message : 'Failed to load workout';
    const status = message.startsWith('No level') || message.includes('not available') || message.includes('must be') ? 400 : 500;
    if (status === 500) {
      console.error('Failed to load workout', err);
    }
    res.status(status).json({ error: message });
  }
});

// Water Intake API
app.get('/api/water-intake', async (req, res) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const date = typeof req.query.date === 'string' ? req.query.date.trim() : new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('water_intake')
      .select('amount, date')
      .eq('user_id', req.session.user.id)
      .eq('date', date)
      .maybeSingle();

    if (error) {
      // If table doesn't exist, return default values
      if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return res.json({
          amount: 0,
          date,
          hasLoggedToday: false
        });
      }
      throw error;
    }

    const amount = data?.amount || 0;
    const today = new Date().toISOString().split('T')[0];
    const hasLoggedToday = data && data.date === today;

    res.json({
      amount,
      date,
      hasLoggedToday
    });
  } catch (err) {
    console.error('Failed to fetch water intake', err);
    res.status(500).json({ 
      error: 'Failed to fetch water intake',
      details: err.message 
    });
  }
});

app.post('/api/water-intake', async (req, res) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { date, amount } = req.body;
    const intakeDate = date || new Date().toISOString().split('T')[0];
    const intakeAmount = Number(amount) || 0;

    if (intakeAmount < 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Check if record exists
    const { data: existing, error: checkError } = await supabase
      .from('water_intake')
      .select('id')
      .eq('user_id', req.session.user.id)
      .eq('date', intakeDate)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116' && checkError.code !== '42P01') {
      throw checkError;
    }

    // If table doesn't exist, return helpful error
    if (checkError && checkError.code === '42P01') {
      return res.status(500).json({ 
        error: 'Database table not found. Please run the database migration script.',
        details: 'The water_intake table does not exist. Run supabase-schema.sql to create it.'
      });
    }

    let result;
    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('water_intake')
        .update({
          amount: intakeAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('water_intake')
        .insert({
          user_id: req.session.user.id,
          date: intakeDate,
          amount: intakeAmount,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    res.json({
      amount: result.amount,
      date: result.date
    });
  } catch (err) {
    console.error('Failed to save water intake', err);
    res.status(500).json({ error: 'Failed to save water intake' });
  }
});

app.get('/api/water-target', async (req, res) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get user profile to calculate water target
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('height_cm, weight_kg')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Calculate water target based on weight (30-35ml per kg is standard)
    // Default to 600ml if no profile data
    let target = 600;
    if (profile?.weight_kg) {
      target = Math.round(profile.weight_kg * 33); // 33ml per kg
    }

    res.json({ target });
  } catch (err) {
    console.error('Failed to fetch water target', err);
    res.status(500).json({ error: 'Failed to fetch water target' });
  }
});

// Body Measurements API
app.get('/api/body-measurements', async (req, res) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const limit = Number(req.query.limit) || 30;
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', req.session.user.id)
      .order('measurement_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Supabase error fetching body measurements:', error);
      // If table doesn't exist, return empty array instead of error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.json({ measurements: [] });
      }
      throw error;
    }

    res.json({ measurements: data || [] });
  } catch (err) {
    console.error('Failed to fetch body measurements', err);
    res.status(500).json({ 
      error: 'Failed to fetch body measurements',
      details: err.message 
    });
  }
});

app.post('/api/body-measurements', async (req, res) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { measurement_date, chest_cm, arms_cm, waist_cm, hips_cm, thighs_cm, neck_cm } = req.body;
    const date = measurement_date || new Date().toISOString().split('T')[0];

    // Check if record exists for this date
    const { data: existing, error: checkError } = await supabase
      .from('body_measurements')
      .select('id')
      .eq('user_id', req.session.user.id)
      .eq('measurement_date', date)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116' && checkError.code !== '42P01') {
      throw checkError;
    }

    // If table doesn't exist, return helpful error
    if (checkError && checkError.code === '42P01') {
      return res.status(500).json({ 
        error: 'Database table not found. Please run the database migration script.',
        details: 'The body_measurements table does not exist. Run supabase-schema.sql to create it.'
      });
    }

    const measurementData = {
      user_id: req.session.user.id,
      measurement_date: date,
      chest_cm: chest_cm ? Number(chest_cm) : null,
      arms_cm: arms_cm ? Number(arms_cm) : null,
      waist_cm: waist_cm ? Number(waist_cm) : null,
      hips_cm: hips_cm ? Number(hips_cm) : null,
      thighs_cm: thighs_cm ? Number(thighs_cm) : null,
      neck_cm: neck_cm ? Number(neck_cm) : null,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('body_measurements')
        .update(measurementData)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('body_measurements')
        .insert(measurementData)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    res.json({ measurement: result });
  } catch (err) {
    console.error('Failed to save body measurement', err);
    res.status(500).json({ 
      error: 'Failed to save body measurement',
      details: err.message 
    });
  }
});

// Strength Records API
app.get('/api/strength-records', async (req, res) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const exercise = req.query.exercise;
    const limit = Number(req.query.limit) || 50;

    let query = supabase
      .from('strength_records')
      .select('*')
      .eq('user_id', req.session.user.id)
      .order('record_date', { ascending: false });

    if (exercise) {
      query = query.eq('exercise_name', exercise);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('Supabase error fetching strength records:', error);
      // If table doesn't exist, return empty arrays
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.json({ records: [], prs: {} });
      }
      throw error;
    }

    // Get latest PR for each exercise
    const prs = {};
    const exercises = ['Bench Press', 'Squat', 'Deadlift'];
    
    for (const ex of exercises) {
      const exerciseRecords = (data || []).filter(r => 
        r.exercise_name && r.exercise_name.toLowerCase().includes(ex.toLowerCase())
      );
      if (exerciseRecords.length > 0) {
        const latest = exerciseRecords.reduce((max, record) => 
          Number(record.weight_kg) > Number(max.weight_kg) ? record : max
        );
        prs[ex] = latest;
      }
    }

    res.json({ records: data || [], prs });
  } catch (err) {
    console.error('Failed to fetch strength records', err);
    res.status(500).json({ 
      error: 'Failed to fetch strength records',
      details: err.message 
    });
  }
});

app.post('/api/strength-records', async (req, res) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { exercise_name, weight_kg, reps, sets, record_date, notes } = req.body;
    
    if (!exercise_name || !weight_kg) {
      return res.status(400).json({ error: 'Exercise name and weight are required' });
    }

    const date = record_date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('strength_records')
      .insert({
        user_id: req.session.user.id,
        exercise_name: String(exercise_name).trim(),
        weight_kg: Number(weight_kg),
        reps: reps ? Number(reps) : null,
        sets: sets ? Number(sets) : null,
        record_date: date,
        notes: notes || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, return helpful error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.status(500).json({ 
          error: 'Database table not found. Please run the database migration script.',
          details: 'The strength_records table does not exist. Run supabase-schema.sql to create it.'
        });
      }
      throw error;
    }

    res.json({ record: data });
  } catch (err) {
    console.error('Failed to save strength record', err);
    res.status(500).json({ 
      error: 'Failed to save strength record',
      details: err.message 
    });
  }
});

// Extract strength records from workout logs
app.post('/api/workouts/log', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { dateIso, burn, baseBurn, goalSlug, level, dayIndex, schemaVersion, workouts } = req.body || {};

  const parsedBurn = Number(burn);
  const calories = Number.isFinite(parsedBurn) ? Math.max(0, Math.round(parsedBurn)) : 0;

  let activityDate = null;
  if (typeof dateIso === 'string' && dateIso.trim()) {
    const trimmed = dateIso.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      activityDate = trimmed;
    } else {
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        activityDate = parsed.toISOString().slice(0, 10);
      }
    }
  }
  if (!activityDate) {
    activityDate = new Date().toISOString().slice(0, 10);
  }

  const normalizedLevel = VALID_PLAN_LEVELS.has(level) ? level : 'Beginner';
  const normalizedGoal = normalizeGoalSlug(goalSlug);
  const numericDayIndex = Number.isInteger(Number(dayIndex)) ? Number(dayIndex) : 1;
  const sanitizedWorkouts = sanitizeWorkoutsPayload(workouts);
  const baseBurnValue = Number.isFinite(Number(baseBurn))
    ? Math.max(0, Math.round(Number(baseBurn)))
    : calories;
  const timestampIso = new Date().toISOString();
  try {
    const { plan, plans } = await ensureWorkoutPlanForUser({
      userId: req.session.user.id,
      goalSlug: normalizedGoal,
      activityDate,
      schemaVersion
    });

    const planGoalSlug = normalizeGoalSlug(plan.goal_slug) || normalizedGoal || 'general-fitness';
    const metricsPayload = {
      goal_slug: planGoalSlug,
      schema_version: plan.schema_version || schemaVersion || null,
      day_index: numericDayIndex,
      logged_burn: calories
    };

    const seedReferenceParts = [
      planGoalSlug || 'goal',
      normalizedLevel.toLowerCase(),
      `day${numericDayIndex}`,
      activityDate
    ];

    const sessionPayload = {
      plan_id: plan.id,
      scheduled_date: activityDate,
      day_index: numericDayIndex,
      level_code: normalizedLevel,
      seed_reference: seedReferenceParts.filter(Boolean).join(':'),
      workouts: sanitizedWorkouts,
      base_burn: baseBurnValue,
      adjusted_burn: calories,
      status: 'completed',
      completed_at: timestampIso,
      skipped_at: null,
      actual_metrics: metricsPayload,
      updated_at: timestampIso
    };

    const { data: sessionRow, error: sessionError } = await supabase
      .from('user_workout_sessions')
      .upsert([sessionPayload], { onConflict: 'plan_id,scheduled_date' })
      .select('plan_id, scheduled_date, adjusted_burn, base_burn, level_code, status, actual_metrics')
      .single();

    if (sessionError) throw sessionError;

    // Extract strength records from workout exercises
    if (Array.isArray(sanitizedWorkouts)) {
      const strengthExercises = {
        'bench press': 'Bench Press',
        'squat': 'Squat',
        'deadlift': 'Deadlift'
      };

      for (const workout of sanitizedWorkouts) {
        if (workout && typeof workout === 'object') {
          const exerciseName = String(workout.exercise || '').toLowerCase();
          const matchedExercise = Object.keys(strengthExercises).find(key => 
            exerciseName.includes(key)
          );

          if (matchedExercise) {
            // Try to extract weight from prescription or notes
            const prescription = String(workout.prescription || '');
            const weightMatch = prescription.match(/(\d+(?:\.\d+)?)\s*(?:kg|lb|lbs)/i);
            let weight = null;
            
            if (weightMatch) {
              weight = Number(weightMatch[1]);
              // Convert lbs to kg if needed
              if (prescription.toLowerCase().includes('lb')) {
                weight = weight * 0.453592;
              }
            } else {
              // Try to extract from notes or other fields
              const notes = String(workout.notes || '');
              const notesWeightMatch = notes.match(/(\d+(?:\.\d+)?)\s*(?:kg|lb|lbs)/i);
              if (notesWeightMatch) {
                weight = Number(notesWeightMatch[1]);
                if (notes.toLowerCase().includes('lb')) {
                  weight = weight * 0.453592;
                }
              }
            }

            if (weight && weight > 0) {
              // Check if this is a new PR
              const { data: existingRecords } = await supabase
                .from('strength_records')
                .select('weight_kg')
                .eq('user_id', req.session.user.id)
                .ilike('exercise_name', `%${strengthExercises[matchedExercise]}%`)
                .order('weight_kg', { ascending: false })
                .limit(1);

              const isNewPR = !existingRecords || existingRecords.length === 0 || 
                Number(weight) > Number(existingRecords[0]?.weight_kg || 0);

              if (isNewPR) {
                // Extract reps if available
                const repsMatch = prescription.match(/(\d+)\s*(?:x|×|reps?)/i);
                const reps = repsMatch ? Number(repsMatch[1]) : null;

                await supabase
                  .from('strength_records')
                  .insert({
                    user_id: req.session.user.id,
                    exercise_name: strengthExercises[matchedExercise],
                    weight_kg: weight,
                    reps: reps,
                    record_date: activityDate,
                    updated_at: timestampIso
                  });
              }
            }
          }
        }
      }
    }

    // Extract strength records from workout exercises
    if (Array.isArray(sanitizedWorkouts)) {
      const strengthExercises = {
        'bench press': 'Bench Press',
        'squat': 'Squat',
        'deadlift': 'Deadlift'
      };

      for (const workout of sanitizedWorkouts) {
        if (workout && typeof workout === 'object') {
          const exerciseName = String(workout.exercise || '').toLowerCase();
          const matchedExercise = Object.keys(strengthExercises).find(key => 
            exerciseName.includes(key)
          );

          if (matchedExercise) {
            // Try to extract weight from prescription or notes
            const prescription = String(workout.prescription || '');
            const weightMatch = prescription.match(/(\d+(?:\.\d+)?)\s*(?:kg|lb|lbs)/i);
            let weight = null;
            
            if (weightMatch) {
              weight = Number(weightMatch[1]);
              // Convert lbs to kg if needed
              if (prescription.toLowerCase().includes('lb')) {
                weight = weight * 0.453592;
              }
            } else {
              // Try to extract from notes or other fields
              const notes = String(workout.notes || '');
              const notesWeightMatch = notes.match(/(\d+(?:\.\d+)?)\s*(?:kg|lb|lbs)/i);
              if (notesWeightMatch) {
                weight = Number(notesWeightMatch[1]);
                if (notes.toLowerCase().includes('lb')) {
                  weight = weight * 0.453592;
                }
              }
            }

            if (weight && weight > 0) {
              // Check if this is a new PR
              const { data: existingRecords } = await supabase
                .from('strength_records')
                .select('weight_kg')
                .eq('user_id', req.session.user.id)
                .ilike('exercise_name', `%${strengthExercises[matchedExercise]}%`)
                .order('weight_kg', { ascending: false })
                .limit(1);

              const isNewPR = !existingRecords || existingRecords.length === 0 || 
                Number(weight) > Number(existingRecords[0]?.weight_kg || 0);

              if (isNewPR) {
                // Extract reps if available
                const repsMatch = prescription.match(/(\d+)\s*(?:x|×|reps?)/i);
                const reps = repsMatch ? Number(repsMatch[1]) : null;

                await supabase
                  .from('strength_records')
                  .insert({
                    user_id: req.session.user.id,
                    exercise_name: strengthExercises[matchedExercise],
                    weight_kg: weight,
                    reps: reps,
                    record_date: activityDate,
                    updated_at: timestampIso
                  });
              }
            }
          }
        }
      }
    }

    const planIds = plans.map((p) => p.id).filter(Boolean);
    const sessions = await loadWorkoutSessionsForPlans(planIds);
    const summary = summarizeWorkoutEntries(buildActivityEntries(plans, sessions));
    const entry = buildActivityEntries(plans, [sessionRow ?? sessionPayload])[0] || {
      activity_date: activityDate,
      calories,
      level: normalizedLevel,
      goal_slug: planGoalSlug
    };

    res.json({
      entry,
      totals: {
        totalCalories: summary.totalCalories,
        todayCalories: summary.todayCalories
      }
    });
  } catch (err) {
    console.error('Failed to log workout activity', err);
    res.status(500).json({ error: 'Failed to log workout activity' });
  }
});

// Serve static files
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'welcome.html'));
});

app.get('/supabase-config.js', (_req, res) => {
  const payload = {
    url: PUBLIC_SUPABASE_URL,
    anonKey: PUBLIC_SUPABASE_ANON_KEY
  };
  res.type('application/javascript').send(
    `window.__SUPABASE_CONFIG__ = ${JSON.stringify(payload)};`
  );
});

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
