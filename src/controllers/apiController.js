import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { supabase } from '../models/supabaseClient.js';
import { clearExerciseVideoLibraryCache, getDailyWorkout, searchExerciseVideos } from '../services/workoutService.js';
import { sendEmail } from '../services/emailService.js';
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
      .limit(1);
    if (error && error.code !== 'PGRST116') {
      console.warn('Username lookup failed', error);
      return candidate;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!error && !row) {
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

const PASSWORD_RESET_OTP_EXPIRY_MINUTES = Math.max(
  1,
  Number(process.env.PASSWORD_RESET_OTP_EXPIRY_MINUTES || 10)
);
const PASSWORD_RESET_OTP_COOLDOWN_SECONDS = Math.max(
  15,
  Number(process.env.PASSWORD_RESET_OTP_COOLDOWN_SECONDS || 45)
);
const PASSWORD_RESET_OTP_MAX_ATTEMPTS = Math.max(
  3,
  Number(process.env.PASSWORD_RESET_OTP_MAX_ATTEMPTS || 5)
);
const PASSWORD_RESET_OTP_EXPIRY_MS = PASSWORD_RESET_OTP_EXPIRY_MINUTES * 60 * 1000;
const PASSWORD_RESET_OTP_COOLDOWN_MS = PASSWORD_RESET_OTP_COOLDOWN_SECONDS * 1000;
const passwordResetStore = new Map();
const MEAL_PLAN_CACHE_TTL_MS = Math.max(
  30 * 1000,
  Number(process.env.MEAL_PLAN_CACHE_TTL_MS || 120 * 1000)
);
const mealPlanResponseCache = new Map();

function pruneMealPlanCache(now = Date.now()) {
  for (const [key, entry] of mealPlanResponseCache.entries()) {
    if (!entry || Number(entry.expiresAt || 0) <= now) {
      mealPlanResponseCache.delete(key);
    }
  }
}

function buildMealPlanCacheKey({ userId, startIso, days, burnMultiplierOverride }) {
  const uid = String(userId || '').trim();
  const start = String(startIso || '').trim();
  const safeDays = Number.isFinite(Number(days)) ? Number(days) : 90;
  const burn =
    burnMultiplierOverride === null || burnMultiplierOverride === undefined
      ? 'default'
      : Number.isFinite(Number(burnMultiplierOverride))
      ? Number(burnMultiplierOverride)
      : 'default';
  return `${uid}|${start}|${safeDays}|${burn}`;
}

function readMealPlanCache(cacheKey) {
  if (!cacheKey) return null;
  const now = Date.now();
  pruneMealPlanCache(now);
  const entry = mealPlanResponseCache.get(cacheKey);
  if (!entry || Number(entry.expiresAt || 0) <= now) {
    mealPlanResponseCache.delete(cacheKey);
    return null;
  }
  return entry.payload || null;
}

function writeMealPlanCache(cacheKey, payload) {
  if (!cacheKey || !payload || typeof payload !== 'object') return;
  const now = Date.now();
  pruneMealPlanCache(now);
  mealPlanResponseCache.set(cacheKey, {
    payload,
    expiresAt: now + MEAL_PLAN_CACHE_TTL_MS
  });
}

function invalidateMealPlanCacheForUser(userId) {
  if (!userId) return;
  const prefix = `${String(userId)}|`;
  for (const key of mealPlanResponseCache.keys()) {
    if (String(key).startsWith(prefix)) {
      mealPlanResponseCache.delete(key);
    }
  }
}

function normalizeEmailValue(value) {
  if (!value || typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return email.length ? email : null;
}

function generateOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function hashOtpCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

function clearExpiredPasswordResetEntries() {
  const now = Date.now();
  for (const [email, entry] of passwordResetStore.entries()) {
    if (!entry || !entry.expiresAt || entry.expiresAt <= now) {
      passwordResetStore.delete(email);
    }
  }
}

function buildPasswordResetOtpEmail({ userName, otpCode }) {
  const safeName = userName || 'Athlete';
  const subject = `FlexFule password reset OTP: ${otpCode}`;
  const text = `Hi ${safeName},

Use this OTP to reset your FlexFule password: ${otpCode}

This code expires in ${PASSWORD_RESET_OTP_EXPIRY_MINUTES} minutes.
If you did not request this, you can ignore this email.
`;

  const html = `
  <div style="margin:0;padding:0;background:#0b1220;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
            <tr>
              <td style="padding:24px 28px;background:linear-gradient(135deg,#1f2937,#111827);">
                <h2 style="margin:0;font-size:22px;color:#f8fafc;">Password Reset OTP</h2>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px;">
                <p style="margin:0 0 14px;color:#e2e8f0;font-size:15px;">Hi ${escapeHtml(safeName)},</p>
                <p style="margin:0 0 12px;color:#cbd5e1;font-size:14px;">Use this one-time code to reset your password:</p>
                <p style="margin:0 0 18px;font-size:30px;letter-spacing:0.18em;font-weight:700;color:#48f2c7;">${escapeHtml(otpCode)}</p>
                <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">This code expires in ${PASSWORD_RESET_OTP_EXPIRY_MINUTES} minutes.</p>
                <p style="margin:0;color:#94a3b8;font-size:13px;">If you did not request this, you can ignore this email.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;

  return { subject, text, html };
}

async function findLocalUserForPasswordReset(email) {
  const normalizedEmail = normalizeEmailValue(email);
  if (!normalizedEmail) return null;
  let providerTarget = null;
  try {
    providerTarget = await findUserByProvider('local', normalizedEmail);
  } catch (lookupErr) {
    if (isMissingRelation(lookupErr, 'user_providers')) {
      const { data: legacyRows, error: legacyError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('email', normalizedEmail)
        .limit(1);
      if (legacyError) throw legacyError;
      const legacyUser = Array.isArray(legacyRows) ? legacyRows[0] : legacyRows;
      return legacyUser || null;
    }
    throw lookupErr;
  }

  if (!providerTarget?.id) return null;
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', providerTarget.id)
    .maybeSingle();
  if (error) throw error;
  return user || null;
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

function isMissingRelation(error, relationName) {
  if (!error) return false;
  const code = error.code || error?.details?.code;
  if (code === '42P01') {
    if (!relationName) return true;
    const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
    return message.includes(relationName.toLowerCase());
  }
  return false;
}

function isMissingColumn(error, columnName) {
  if (!error) return false;
  const code = error.code || error?.details?.code;
  const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  if (code === '42703' || code === 'PGRST204') {
    return columnName ? message.includes(columnName.toLowerCase()) : true;
  }
  return columnName ? message.includes(`column "${columnName.toLowerCase()}"`) : false;
}

function isUniqueViolation(error) {
  if (!error) return false;
  if (error.code === '23505') return true;
  const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  return message.includes('duplicate key') || message.includes('unique constraint');
}

function isDuplicateKeyOn(error, column) {
  if (!error || !column) return false;
  const needle = column.toLowerCase();
  const message = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  return message.includes(`(${needle})`) || message.includes(`${needle}_key`);
}

function formatSupabaseError(error, fallback) {
  if (!error) return fallback;
  const message = error.message || error.details || fallback;
  return String(message || fallback);
}

function formatReportDate(iso) {
  if (!iso || typeof iso !== 'string') return '--';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeDateInput(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return trimmed;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  return null;
}

async function touchUserLoginActivity(userId, lastLoginAt) {
  if (!userId) return;
  const now = new Date();
  if (lastLoginAt) {
    const last = new Date(lastLoginAt);
    if (!Number.isNaN(last.getTime())) {
      const diffMs = now.getTime() - last.getTime();
      if (diffMs < 12 * 60 * 60 * 1000) {
        return;
      }
    }
  }
  try {
    await supabase
      .from('users')
      .update({ last_login_at: now.toISOString(), inactivity_alert_sent_at: null })
      .eq('id', userId);
  } catch (err) {
    console.warn('Failed to update last_login_at', err);
  }
}

export function buildWeeklyReportEmail({ userName, weekStart, weekEnd, performance = {}, habits = {}, appUrl }) {
  const safeName = userName || 'Athlete';
  const startLabel = formatReportDate(weekStart);
  const endLabel = formatReportDate(weekEnd);
  const dateRange = startLabel !== '--' && endLabel !== '--' ? `${startLabel} – ${endLabel}` : 'This week';
  const sessions = Number(performance.sessionsCompleted || 0);
  const watchedMin = Number.isFinite(Number(performance.totalWatchedMinutes))
    ? Math.round(Number(performance.totalWatchedMinutes))
    : 0;
  const percentWatched = Number.isFinite(Number(performance.percentWatched))
    ? Math.round(Number(performance.percentWatched))
    : null;
  const performanceLabel = performance.performanceLabel || 'Getting started';
  const habitTotal = Number(habits.totalDays || 7);
  const proteinDays = Number(habits.proteinDays || 0);
  const sleepDays = Number(habits.sleepDays || 0);
  const noSugarDays = Number(habits.noSugarDays || 0);
  const waterDays = Number(habits.waterDays || 0);
  const habitScore = proteinDays + sleepDays + noSugarDays + waterDays;
  const habitMax = habitTotal * 4;
  const habitPercent = habitMax ? Math.round((habitScore / habitMax) * 100) : 0;
  const appLink = appUrl || process.env.APP_URL || 'http://localhost:3000';

  const subject = `Your FlexFule Weekly Progress Summary (${dateRange})`;
  const text = `Hi ${safeName},

Here’s your weekly progress summary for ${dateRange}.

Performance Milestones:
- Sessions completed: ${sessions}
- Minutes watched: ${watchedMin}
- Performance: ${performanceLabel}${percentWatched !== null ? ` (${percentWatched}%)` : ''}

Weekly Habits (${habitTotal} days):
- Protein goal: ${proteinDays}/${habitTotal}
- 8 hours sleep: ${sleepDays}/${habitTotal}
- No sugar: ${noSugarDays}/${habitTotal}
- Hydration goal: ${waterDays}/${habitTotal}
- Habit score: ${habitPercent}%

Keep showing up. Open FlexFule: ${appLink}/goals.html
`;

  const html = `
  <div style="margin:0;padding:0;background:#0b1220;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
            <tr>
              <td style="padding:28px 32px;background:linear-gradient(135deg,#1f2937,#111827);">
                <h1 style="margin:0;font-size:24px;color:#f8fafc;">Weekly Progress Summary</h1>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">${dateRange} • FlexFule</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 16px;font-size:16px;color:#e2e8f0;">Hi ${safeName}, here’s your weekly momentum at a glance:</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:14px;padding:18px;">
                  <tr>
                    <td style="padding:6px 0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Performance Milestones</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#f8fafc;font-size:15px;">Sessions completed: <strong>${sessions}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#f8fafc;font-size:15px;">Minutes watched: <strong>${watchedMin}</strong></td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#f8fafc;font-size:15px;">Performance: <strong>${performanceLabel}${percentWatched !== null ? ` (${percentWatched}%)` : ''}</strong></td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:14px;padding:18px;margin-top:16px;">
                  <tr>
                    <td style="padding:6px 0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Weekly Habit Builder</td>
                  </tr>
                  <tr><td style="padding:4px 0;color:#f8fafc;font-size:15px;">Protein goal: <strong>${proteinDays}/${habitTotal}</strong></td></tr>
                  <tr><td style="padding:4px 0;color:#f8fafc;font-size:15px;">8 hours sleep: <strong>${sleepDays}/${habitTotal}</strong></td></tr>
                  <tr><td style="padding:4px 0;color:#f8fafc;font-size:15px;">No sugar: <strong>${noSugarDays}/${habitTotal}</strong></td></tr>
                  <tr><td style="padding:4px 0;color:#f8fafc;font-size:15px;">Hydration goal: <strong>${waterDays}/${habitTotal}</strong></td></tr>
                  <tr><td style="padding:4px 0;color:#f8fafc;font-size:15px;">Habit score: <strong>${habitPercent}%</strong></td></tr>
                </table>

                <div style="margin-top:22px;text-align:center;">
                  <a href="${appLink}/goals.html" style="display:inline-block;padding:12px 20px;background:#4cd964;color:#0b1220;text-decoration:none;border-radius:12px;font-weight:700;">Review Your Goals</a>
                </div>
                <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;text-align:center;">Keep showing up. Small wins compound.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;

  return { subject, html, text };
}

function buildWelcomeEmail({ userName, appUrl }) {
  const safeName = userName || 'Athlete';
  const appLink = appUrl || process.env.APP_URL || 'http://localhost:3000';
  const subject = 'Welcome to FlexFule';

  const text = `Hi ${safeName},

Welcome to FlexFule! You’re all set to start building your routine.

Next steps:
- Complete your profile
- Set your goals
- Start your first workout

Open FlexFule: ${appLink}/dashboard.html
`;

  const html = `
  <div style="margin:0;padding:0;background:#0b1220;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
            <tr>
              <td style="padding:28px 32px;background:linear-gradient(135deg,#1f2937,#111827);">
                <h1 style="margin:0;font-size:24px;color:#f8fafc;">Welcome to FlexFule</h1>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Your training starts now</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 16px;font-size:16px;color:#e2e8f0;">Hi ${escapeHtml(safeName)}, glad you’re here.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:14px;padding:18px;">
                  <tr><td style="padding:4px 0;color:#f8fafc;font-size:15px;">Complete your profile</td></tr>
                  <tr><td style="padding:4px 0;color:#f8fafc;font-size:15px;">Set your goals</td></tr>
                  <tr><td style="padding:4px 0;color:#f8fafc;font-size:15px;">Start your first workout</td></tr>
                </table>
                <div style="margin-top:22px;text-align:center;">
                  <a href="${appLink}/dashboard.html" style="display:inline-block;padding:12px 20px;background:#4cd964;color:#0b1220;text-decoration:none;border-radius:12px;font-weight:700;">Open FlexFule</a>
                </div>
                <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;text-align:center;">Small wins, every week.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;

  return { subject, html, text };
}

function buildGoalAchievementsEmail({ userName, achievements = [], appUrl }) {
  const safeName = userName || 'Athlete';
  const list = Array.isArray(achievements)
    ? achievements
        .filter((item) => item && (item.title || item.message))
        .slice(0, 6)
        .map((item) => ({
          title: escapeHtml(item.title || 'Achievement'),
          message: escapeHtml(item.message || '')
        }))
    : [];
  const appLink = appUrl || process.env.APP_URL || 'http://localhost:3000';
  const subject = 'Goal achievements unlocked on FlexFule';

  const textLines = list.map((item) => `- ${item.title}${item.message ? `: ${item.message}` : ''}`).join('\n');
  const text = `Hi ${safeName},

You just unlocked new goal achievements:
${textLines || '- Achievement unlocked'}

Celebrate it in FlexFule: ${appLink}/goals.html
`;

  const htmlItems =
    list.length > 0
      ? list
          .map(
            (item) => `
            <tr>
              <td style="padding:10px 0;">
                <div style="font-weight:700;color:#f8fafc;font-size:15px;">${item.title}</div>
                ${item.message ? `<div style="color:#94a3b8;font-size:13px;margin-top:4px;">${item.message}</div>` : ''}
              </td>
            </tr>
          `
          )
          .join('')
      : `
        <tr>
          <td style="padding:10px 0;color:#e2e8f0;">Achievement unlocked. Keep showing up.</td>
        </tr>
      `;

  const html = `
  <div style="margin:0;padding:0;background:#0b1220;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
            <tr>
              <td style="padding:28px 32px;background:linear-gradient(135deg,#1f2937,#111827);">
                <h1 style="margin:0;font-size:24px;color:#f8fafc;">Goal Achievements</h1>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">FlexFule</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 16px;font-size:16px;color:#e2e8f0;">Hi ${escapeHtml(safeName)}, you just unlocked:</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:14px;padding:18px;">
                  ${htmlItems}
                </table>
                <div style="margin-top:22px;text-align:center;">
                  <a href="${appLink}/goals.html" style="display:inline-block;padding:12px 20px;background:#4cd964;color:#0b1220;text-decoration:none;border-radius:12px;font-weight:700;">View Goals</a>
                </div>
                <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;text-align:center;">Small wins compound. Keep going.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;

  return { subject, html, text };
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
  const extractUrl = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    }
    if (typeof value === 'object') {
      const fromObject =
        value?.data?.url ||
        value?.url ||
        value?.picture?.data?.url ||
        value?.picture?.url ||
        value?.profile_picture ||
        value?.avatar_url ||
        null;
      if (typeof fromObject === 'string' && fromObject.trim().length) {
        return fromObject.trim();
      }
    }
    return null;
  };

  const candidates = [
    meta.avatar_url,
    meta.avatarUrl,
    meta.avatar,
    meta.picture,
    meta.photo_url,
    meta.picture_url,
    authUser.picture
  ];
  for (const candidate of candidates) {
    const resolved = extractUrl(candidate);
    if (resolved) return resolved;
  }

  const identities = Array.isArray(authUser.identities) ? authUser.identities : [];
  for (const identity of identities) {
    const data = identity?.identity_data || {};
    const identityCandidates = [
      data.avatar_url,
      data.avatarUrl,
      data.avatar,
      data.picture,
      data.photo_url,
      data.picture_url,
      data.profile_picture
    ];
    for (const candidate of identityCandidates) {
      const resolved = extractUrl(candidate);
      if (resolved) return resolved;
    }
  }

  return null;
}

function shouldSyncProviderAvatar(currentAvatar, providerAvatar) {
  if (!providerAvatar) return false;
  const current = typeof currentAvatar === 'string' ? currentAvatar.trim() : '';
  if (!current) return true;
  const lower = current.toLowerCase();
  if (lower.startsWith('data:image/')) return false;
  if (lower.includes('images/user.png')) return true;
  if (lower.includes('images/default-avatar')) return true;
  return false;
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
    .limit(1);

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  const providerRow = Array.isArray(data) ? data[0] : data;

  if (!providerRow?.user_id) {
    if (providerKey === 'local') {
      const { data: legacyRows, error: legacyError } = await supabase
        .from('users')
        .select('id, username, name')
        .eq('email', identityKey)
        .limit(1);
      if (legacyError) {
        throw legacyError;
      }
      const legacyUser = Array.isArray(legacyRows) ? legacyRows[0] : legacyRows;
      if (legacyUser?.id) {
        await recordProviderIdentity(legacyUser.id, providerKey, identityKey);
        return legacyUser;
      }
    }
    return null;
  }

  const { data: userRows, error: userError } = await supabase
    .from('users')
    .select('id, username, name')
    .eq('id', providerRow.user_id)
    .limit(1);

  if (userError) {
    throw userError;
  }

  const userRow = Array.isArray(userRows) ? userRows[0] : userRows;
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
      const metrics = item.metrics && typeof item.metrics === 'object' ? item.metrics : {};
      const toNumber = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
      };
      const name = typeof item.exercise === 'string' && item.exercise.trim() ? item.exercise.trim() : item.name?.trim();
      const prescription =
        typeof item.prescription === 'string' && item.prescription.trim() ? item.prescription.trim() : item.description?.trim();
      const video = typeof item.video === 'string' && item.video.trim() ? item.video.trim() : null;
      const videoEmbed = typeof item.videoEmbed === 'string' && item.videoEmbed.trim() ? item.videoEmbed.trim() : null;
      const targetBurn = Number.isFinite(Number(item.targetBurn)) ? Number(item.targetBurn) : null;
      const targetSets = toNumber(item.targetSets ?? metrics.targetSets);
      const targetReps = toNumber(item.targetReps ?? metrics.targetReps);
      const targetDurationSec = toNumber(item.targetDurationSec ?? metrics.targetDurationSec);
      const performedSets = toNumber(item.performedSets ?? metrics.performedSets);
      const performedReps = toNumber(item.performedReps ?? metrics.performedReps);
      const performedWeight = toNumber(item.performedWeight ?? metrics.performedWeight);
      const watchedSeconds = toNumber(item.watchedSeconds ?? metrics.watchedSeconds);
      const videoDurationSec = toNumber(item.videoDurationSec ?? metrics.videoDurationSec);
      const percentWatched = toNumber(item.percentWatched ?? metrics.percentWatched);
      const videoCompleted =
        typeof item.videoCompleted === 'boolean'
          ? item.videoCompleted
          : typeof metrics.completed === 'boolean'
          ? metrics.completed
          : Number.isFinite(percentWatched)
          ? percentWatched >= 90
          : null;
      const completed = typeof item.completed === 'boolean' ? item.completed : null;
      return {
        name: name || 'Workout',
        prescription: prescription || '',
        video,
        videoEmbed,
        targetBurn,
        targetSets,
        targetReps,
        targetDurationSec,
        performedSets,
        performedReps,
        performedWeight,
        watchedSeconds,
        percentWatched,
        videoDurationSec,
        videoCompleted,
        completed
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

function parsePrescriptionDuration(prescription) {
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

export function registerApiRoutes(app) {
  // APIs
  app.post('/api/register', async (req, res) => {
  const { name, email, age, gender, password, height_cm, weight_kg, goal, target_weight } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
  let username = req.body.username ? String(req.body.username).trim().toLowerCase() : usernameFromName(name);
  const password_hash = await bcrypt.hash(password, 10);
  const normalizedEmail = String(email).trim().toLowerCase();

  let userId = null;
  try {
    let existingLocal = null;
    try {
      existingLocal = await findUserByProvider('local', normalizedEmail);
    } catch (lookupErr) {
      if (isMissingRelation(lookupErr, 'user_providers')) {
        const { data: legacyRows, error: legacyErr } = await supabase
          .from('users')
          .select('id')
          .eq('email', normalizedEmail)
          .limit(1);
        if (legacyErr) throw legacyErr;
        existingLocal = Array.isArray(legacyRows) ? legacyRows[0] : legacyRows;
      } else {
        throw lookupErr;
      }
    }
    if (existingLocal) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const insertUser = async (payload) =>
      supabase
        .from('users')
        .insert([payload], { returning: 'representation' })
        .select('id, username');

    let userRow = null;
    let userError = null;
    let attempts = 0;
    while (attempts < 3) {
      const attemptPayload = {
        email: normalizedEmail,
        username,
        password_hash,
        name,
        gender: gender || null,
        last_login_at: new Date().toISOString()
      };
      const result = await insertUser(attemptPayload);
      const rows = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
      userRow = rows[0] || null;
      userError = result.error || null;
      if (!userError) break;

      if (isUniqueViolation(userError)) {
        if (isDuplicateKeyOn(userError, 'email')) {
          return res.status(409).json({ error: 'Email already exists' });
        }
        if (isDuplicateKeyOn(userError, 'username')) {
          username = await generateUniqueUsername(name, normalizedEmail);
          attempts += 1;
          continue;
        }
        return res.status(409).json({ error: 'Email or username already exists' });
      }
      throw userError;
    }

    userId = userRow?.id;
    if (!userId) {
      const { data: fallbackRows, error: fallbackError } = await supabase
        .from('users')
        .select('id, username')
        .eq('email', normalizedEmail)
        .limit(1);
      if (fallbackError) {
        throw fallbackError;
      }
      const fallbackUser = Array.isArray(fallbackRows) ? fallbackRows[0] : fallbackRows;
      userId = fallbackUser?.id || null;
      if (!userId) {
        throw new Error('Failed to create user record');
      }
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
      starting_weight_kg: weightValue,
      bmi: bmi ? Number(bmi.toFixed(1)) : null,
      goal: goal || null,
      target_weight: targetValue
    };

    const insertProfile = async (payload) =>
      supabase.from('profiles').insert([payload], { returning: 'representation' });
    const upsertProfile = async (payload) =>
      supabase.from('profiles').upsert([payload], { onConflict: 'user_id', returning: 'representation' });

    let profileError = null;
    let insertResult = await insertProfile(profilePayload);
    profileError = insertResult.error || null;

    if (profileError && profileError.code === '23505') {
      const upsertResult = await upsertProfile(profilePayload);
      profileError = upsertResult.error || null;
    }

    if (profileError && isMissingColumn(profileError, 'starting_weight_kg')) {
      const { starting_weight_kg, ...fallbackPayload } = profilePayload;
      insertResult = await insertProfile(fallbackPayload);
      profileError = insertResult.error || null;
      if (profileError && profileError.code === '23505') {
        const upsertResult = await upsertProfile(fallbackPayload);
        profileError = upsertResult.error || null;
      }
    }

    if (profileError) {
      await supabase.from('users').delete().eq('id', userId);
      throw profileError;
    }

    req.session.user = { id: userId, username, name, needsHealthInfo: false };
    res.json({ ok: true, username, needsHealthInfo: false });

    const welcome = buildWelcomeEmail({ userName: name, appUrl: process.env.APP_URL || undefined });
    sendEmail({
      to: normalizedEmail,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text
    }).catch((emailErr) => {
      console.warn('Failed to send welcome email', emailErr);
    });
  } catch (err) {
    console.error(err);
    if (isMissingRelation(err, 'profiles') || isMissingRelation(err, 'users')) {
      return res.status(500).json({ error: 'Database schema is missing. Please run the SQL migrations.' });
    }
    if (isMissingColumn(err, 'starting_weight_kg')) {
      return res.status(500).json({
        error: 'Database schema is missing starting_weight_kg on profiles. Please run the latest SQL migration.'
      });
    }
    const errorMessage = formatSupabaseError(err, 'Server error');
    res.status(500).json({ error: errorMessage });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  const ekey = String(email).trim().toLowerCase();
  let userProviderTarget = null;
  try {
    try {
      userProviderTarget = await findUserByProvider('local', ekey);
    } catch (lookupErr) {
      if (isMissingRelation(lookupErr, 'user_providers')) {
        const { data: legacyRows, error: legacyErr } = await supabase
          .from('users')
          .select('id, username, name')
          .eq('email', ekey)
          .limit(1);
        if (legacyErr) throw legacyErr;
        userProviderTarget = Array.isArray(legacyRows) ? legacyRows[0] : legacyRows;
      } else {
        throw lookupErr;
      }
    }
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
  try {
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString(), inactivity_alert_sent_at: null })
      .eq('id', user.id);
  } catch (err) {
    console.warn('Failed to update last_login_at', err);
  }
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('age, height_cm, weight_kg, starting_weight_kg, goal, target_weight, bmi, preference, allergies, avatar_url')
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

app.post('/api/forgot-password/request', async (req, res) => {
  const email = normalizeEmailValue(req.body?.email);
  const newPassword = String(req.body?.newPassword || '');
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  clearExpiredPasswordResetEntries();
  const now = Date.now();
  const existing = passwordResetStore.get(email);
  if (existing?.nextAllowedAt && existing.nextAllowedAt > now) {
    const secondsLeft = Math.ceil((existing.nextAllowedAt - now) / 1000);
    return res.status(429).json({ error: `Please wait ${secondsLeft}s before requesting another OTP` });
  }

  try {
    const user = await findLocalUserForPasswordReset(email);
    if (!user?.id) {
      return res.status(404).json({ error: 'No local account found with this email' });
    }

    const otpCode = generateOtpCode();
    const nextPasswordHash = await bcrypt.hash(newPassword, 10);
    passwordResetStore.set(email, {
      userId: user.id,
      otpHash: hashOtpCode(otpCode),
      nextPasswordHash,
      attempts: 0,
      createdAt: now,
      expiresAt: now + PASSWORD_RESET_OTP_EXPIRY_MS,
      nextAllowedAt: now + PASSWORD_RESET_OTP_COOLDOWN_MS
    });

    const otpEmail = buildPasswordResetOtpEmail({ userName: user.name, otpCode });
    const emailResult = await sendEmail({
      to: email,
      subject: otpEmail.subject,
      html: otpEmail.html,
      text: otpEmail.text
    });

    if (emailResult?.skipped) {
      if (process.env.NODE_ENV === 'production') {
        passwordResetStore.delete(email);
        return res.status(500).json({ error: 'Unable to send OTP email right now' });
      }
      return res.json({
        ok: true,
        message: 'SMTP is not configured. Using local debug OTP for development.',
        debugOtp: otpCode
      });
    }

    return res.json({
      ok: true,
      message: `OTP sent to ${email}. It expires in ${PASSWORD_RESET_OTP_EXPIRY_MINUTES} minutes.`
    });
  } catch (err) {
    console.error('Failed to request forgot-password OTP', err);
    return res.status(500).json({ error: 'Failed to send password reset OTP' });
  }
});

app.post('/api/forgot-password/verify', async (req, res) => {
  const email = normalizeEmailValue(req.body?.email);
  const otp = String(req.body?.otp || '').trim();

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ error: 'OTP must be a 6-digit code' });
  }

  clearExpiredPasswordResetEntries();
  const entry = passwordResetStore.get(email);
  if (!entry) {
    return res.status(400).json({ error: 'OTP is invalid or expired. Please request a new one.' });
  }

  const now = Date.now();
  if (entry.expiresAt <= now) {
    passwordResetStore.delete(email);
    return res.status(400).json({ error: 'OTP is invalid or expired. Please request a new one.' });
  }

  if ((entry.attempts || 0) >= PASSWORD_RESET_OTP_MAX_ATTEMPTS) {
    passwordResetStore.delete(email);
    return res.status(429).json({ error: 'Too many invalid attempts. Request a new OTP.' });
  }

  const isValidOtp = hashOtpCode(otp) === entry.otpHash;
  if (!isValidOtp) {
    entry.attempts = Number(entry.attempts || 0) + 1;
    passwordResetStore.set(email, entry);
    return res.status(400).json({ error: 'Incorrect OTP code' });
  }

  try {
    const { error } = await supabase
      .from('users')
      .update({ password_hash: entry.nextPasswordHash, inactivity_alert_sent_at: null })
      .eq('id', entry.userId);
    if (error) throw error;
    passwordResetStore.delete(email);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Failed to verify forgot-password OTP', err);
    return res.status(500).json({ error: 'Failed to update password' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.post('/api/delete-account', async (req, res) => {
  if (!req.session?.user?.id) return res.status(401).json({ error: 'Not logged in' });
  const userId = req.session.user.id;
  try {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) {
      throw error;
    }
    req.session.destroy(() => res.json({ ok: true }));
  } catch (err) {
    console.error('Failed to delete account', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
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
    if (providerAvatar && shouldSyncProviderAvatar(normalizedProfile?.avatar_url, providerAvatar)) {
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
    try {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString(), inactivity_alert_sent_at: null })
        .eq('id', resolvedAccount.id);
    } catch (err) {
      console.warn('Failed to update last_login_at', err);
    }

    res.json({ ok: true, needsHealthInfo });
  } catch (err) {
    console.error('Failed to bootstrap OAuth session', err);
    res.status(401).json({ error: 'Failed to validate OAuth session' });
  }
});

app.get('/api/me', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const accountColumns = ['name', 'username', 'email', 'created_at', 'last_login_at'];
    let account = null;
    let accountError = null;
    {
      const response = await supabase
        .from('users')
        .select(accountColumns.join(', '))
        .eq('id', req.session.user.id)
        .maybeSingle();
      account = response.data;
      accountError = response.error;
    }
    if (accountError && accountColumns.some((col) => isMissingColumn(accountError, col))) {
      const fallbackColumns = accountColumns.filter((col) => !isMissingColumn(accountError, col));
      const fallbackList = fallbackColumns.length ? fallbackColumns : ['name', 'email'];
      const fallbackResponse = await supabase
        .from('users')
        .select(fallbackList.join(', '))
        .eq('id', req.session.user.id)
        .maybeSingle();
      account = fallbackResponse.data;
      accountError = fallbackResponse.error;
    }
    if (accountError) throw accountError;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('age, height_cm, weight_kg, starting_weight_kg, bmi, goal, target_weight, preference, allergies, avatar_url')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    const normalizedProfile = normalizeProfileRow(profile);
    const needsHealthInfo = needsHealthProfile(normalizedProfile);
    const { data: providerRows, error: providerError } = await supabase
      .from('user_providers')
      .select('provider')
      .eq('user_id', req.session.user.id);

    if (providerError && providerError.code !== 'PGRST116') {
      throw providerError;
    }

    const providers = Array.isArray(providerRows)
      ? Array.from(new Set(providerRows.map((row) => String(row?.provider || '').toLowerCase()).filter(Boolean)))
      : [];
    await touchUserLoginActivity(req.session.user.id, account?.last_login_at);

    res.json({
      user: {
        id: req.session.user.id,
        name: account?.name || req.session.user.name,
        username: account?.username || req.session.user.username,
        email: account?.email || null,
        created_at: account?.created_at || null,
        profile: normalizedProfile,
        needsHealthInfo,
        providers
      }
    });
  } catch (err) {
    console.error('Failed to load profile', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

app.get('/api/notification-preferences', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const defaults = {
    workout_reminders: true,
    goal_milestones: true,
    missed_workouts: true,
    meal_plan_reminders: true,
    weekly_progress_summary: true,
    goal_achievements: true,
    account_alerts_enabled: true
  };
  try {
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select(
        'workout_reminders, goal_milestones, missed_workouts, meal_plan_reminders, weekly_progress_summary, goal_achievements, account_alerts_enabled'
      )
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    const prefs = { ...defaults };
    if (data && typeof data === 'object') {
      Object.keys(defaults).forEach((key) => {
        if (typeof data[key] === 'boolean') {
          prefs[key] = data[key];
        }
      });
    }
    res.json({ preferences: prefs });
  } catch (err) {
    if (isMissingRelation(err, 'user_notification_preferences')) {
      return res.status(500).json({ error: 'Missing notification preference table. Run migrations.' });
    }
    console.error('Failed to load notification preferences', err);
    res.status(500).json({ error: 'Failed to load notification preferences' });
  }
});

app.post('/api/notification-preferences', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const defaults = {
    workout_reminders: true,
    goal_milestones: true,
    missed_workouts: true,
    meal_plan_reminders: true,
    weekly_progress_summary: true,
    goal_achievements: true,
    account_alerts_enabled: true
  };
  const incoming = req.body?.preferences && typeof req.body.preferences === 'object' ? req.body.preferences : req.body;
  try {
    const payload = { user_id: req.session.user.id, updated_at: new Date().toISOString() };
    Object.keys(defaults).forEach((key) => {
      if (typeof incoming?.[key] === 'boolean') {
        payload[key] = incoming[key];
      }
    });
    Object.keys(defaults).forEach((key) => {
      if (typeof payload[key] !== 'boolean') payload[key] = defaults[key];
    });
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert([payload], { onConflict: 'user_id' });

    if (error) throw error;
    if (payload.account_alerts_enabled === false) {
      await supabase.from('users').update({ inactivity_alert_sent_at: null }).eq('id', req.session.user.id);
    }
    res.json({ ok: true, preferences: payload });
  } catch (err) {
    if (isMissingRelation(err, 'user_notification_preferences')) {
      return res.status(500).json({ error: 'Missing notification preference table. Run migrations.' });
    }
    console.error('Failed to save notification preferences', err);
    res.status(500).json({ error: 'Failed to save notification preferences' });
  }
});

app.get('/api/notifications', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const limit = Math.min(50, Math.max(5, Number(req.query?.limit || 25)));
  try {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('notification_key, title, message, type, read_at, created_at')
      .eq('user_id', req.session.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error && error.code !== 'PGRST116') throw error;
    res.json({ notifications: Array.isArray(data) ? data : [] });
  } catch (err) {
    if (isMissingRelation(err, 'user_notifications')) {
      return res.status(500).json({ error: 'Missing notification table. Run migrations.' });
    }
    console.error('Failed to load notifications', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

app.post('/api/notifications', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const incoming = Array.isArray(req.body?.notifications)
    ? req.body.notifications
    : req.body?.notification
    ? [req.body.notification]
    : [];

  const normalized = incoming
    .map((item) => {
      const key = String(item?.notification_key || item?.id || item?.key || '').trim();
      if (!key) return null;
      const createdAt = item?.created_at || item?.createdAt;
      const readAt = item?.read_at || item?.readAt;
      const readFlag = typeof item?.read === 'boolean' ? item.read : null;
      return {
        user_id: req.session.user.id,
        notification_key: key,
        title: String(item?.title || 'Notification'),
        message: String(item?.message || ''),
        type: item?.type || null,
        created_at: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
        read_at: readAt
          ? new Date(readAt).toISOString()
          : readFlag === true
          ? new Date().toISOString()
          : null
      };
    })
    .filter(Boolean);

  if (!normalized.length) {
    return res.status(400).json({ error: 'No notifications to save' });
  }

  try {
    const { error } = await supabase
      .from('user_notifications')
      .upsert(normalized, { onConflict: 'user_id,notification_key' });
    if (error) throw error;
    res.json({ ok: true, count: normalized.length });
  } catch (err) {
    if (isMissingRelation(err, 'user_notifications')) {
      return res.status(500).json({ error: 'Missing notification table. Run migrations.' });
    }
    console.error('Failed to save notifications', err);
    res.status(500).json({ error: 'Failed to save notifications' });
  }
});

app.get('/api/active-day', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { data, error } = await supabase
      .from('user_active_day')
      .select('active_date')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    res.json({ active_date: data?.active_date || null });
  } catch (err) {
    if (isMissingRelation(err, 'user_active_day')) {
      return res.status(500).json({ error: 'Missing active day table. Run migrations.' });
    }
    console.error('Failed to load active day', err);
    res.status(500).json({ error: 'Failed to load active day' });
  }
});

app.post('/api/active-day', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const activeDate = normalizeDateInput(req.body?.active_date || req.body?.activeDate);
  if (!activeDate) return res.status(400).json({ error: 'Invalid active date' });

  try {
    const payload = {
      user_id: req.session.user.id,
      active_date: activeDate,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('user_active_day').upsert([payload], { onConflict: 'user_id' });
    if (error) throw error;
    res.json({ ok: true, active_date: activeDate });
  } catch (err) {
    if (isMissingRelation(err, 'user_active_day')) {
      return res.status(500).json({ error: 'Missing active day table. Run migrations.' });
    }
    console.error('Failed to save active day', err);
    res.status(500).json({ error: 'Failed to save active day' });
  }
});

app.get('/api/meal-completions', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const startIso = normalizeDateInput(req.query?.start);
  const endIso = normalizeDateInput(req.query?.end);
  try {
    let query = supabase
      .from('user_meal_completions')
      .select('meal_date, meal_id')
      .eq('user_id', req.session.user.id);
    if (startIso) query = query.gte('meal_date', startIso);
    if (endIso) query = query.lte('meal_date', endIso);
    const { data, error } = await query.order('meal_date', { ascending: true });
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ entries: Array.isArray(data) ? data : [] });
  } catch (err) {
    if (isMissingRelation(err, 'user_meal_completions')) {
      return res.status(500).json({ error: 'Missing meal completion table. Run migrations.' });
    }
    console.error('Failed to load meal completions', err);
    res.status(500).json({ error: 'Failed to load meal completions' });
  }
});

app.post('/api/meal-completions', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const incoming = Array.isArray(req.body?.entries) ? req.body.entries : [];
  const normalized = incoming
    .map((item) => {
      const date = normalizeDateInput(item?.meal_date || item?.date);
      const mealId = String(item?.meal_id || item?.mealId || '').trim();
      if (!date || !mealId) return null;
      if (item?.remove === true || item?.delete === true) {
        return { delete: true, meal_date: date, meal_id: mealId };
      }
      return {
        user_id: req.session.user.id,
        meal_date: date,
        meal_id: mealId
      };
    })
    .filter(Boolean);

  if (!normalized.length) return res.status(400).json({ error: 'No meal completions to save' });

  try {
    const deletes = normalized.filter((item) => item.delete);
    if (deletes.length) {
      const dates = deletes.map((item) => item.meal_date);
      const mealIds = deletes.map((item) => item.meal_id);
      await supabase
        .from('user_meal_completions')
        .delete()
        .eq('user_id', req.session.user.id)
        .in('meal_date', dates)
        .in('meal_id', mealIds);
    }
    const upserts = normalized.filter((item) => !item.delete);
    if (upserts.length) {
      const { error } = await supabase
        .from('user_meal_completions')
        .upsert(upserts, { onConflict: 'user_id,meal_date,meal_id' });
      if (error) throw error;
    }
    res.json({ ok: true, count: normalized.length });
  } catch (err) {
    if (isMissingRelation(err, 'user_meal_completions')) {
      return res.status(500).json({ error: 'Missing meal completion table. Run migrations.' });
    }
    console.error('Failed to save meal completions', err);
    res.status(500).json({ error: 'Failed to save meal completions' });
  }
});

app.get('/api/workout-completions', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const startIso = normalizeDateInput(req.query?.start);
  const endIso = normalizeDateInput(req.query?.end);
  try {
    let query = supabase
      .from('user_workout_completions')
      .select('workout_date, logged')
      .eq('user_id', req.session.user.id);
    if (startIso) query = query.gte('workout_date', startIso);
    if (endIso) query = query.lte('workout_date', endIso);
    const { data, error } = await query.order('workout_date', { ascending: true });
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ entries: Array.isArray(data) ? data : [] });
  } catch (err) {
    if (isMissingRelation(err, 'user_workout_completions')) {
      return res.status(500).json({ error: 'Missing workout completion table. Run migrations.' });
    }
    console.error('Failed to load workout completions', err);
    res.status(500).json({ error: 'Failed to load workout completions' });
  }
});

app.post('/api/workout-completions', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const incoming = Array.isArray(req.body?.entries) ? req.body.entries : [];
  const normalized = incoming
    .map((item) => {
      const date = normalizeDateInput(item?.workout_date || item?.date);
      if (!date) return null;
      const logged = item?.logged;
      if (logged === false) {
        return { delete: true, workout_date: date };
      }
      return {
        user_id: req.session.user.id,
        workout_date: date,
        logged: true
      };
    })
    .filter(Boolean);

  if (!normalized.length) return res.status(400).json({ error: 'No workout completions to save' });

  try {
    const deletes = normalized.filter((item) => item.delete);
    if (deletes.length) {
      const dates = deletes.map((item) => item.workout_date);
      await supabase
        .from('user_workout_completions')
        .delete()
        .eq('user_id', req.session.user.id)
        .in('workout_date', dates);
    }
    const upserts = normalized.filter((item) => !item.delete);
    if (upserts.length) {
      const { error } = await supabase
        .from('user_workout_completions')
        .upsert(upserts, { onConflict: 'user_id,workout_date' });
      if (error) throw error;
    }
    res.json({ ok: true, count: normalized.length });
  } catch (err) {
    if (isMissingRelation(err, 'user_workout_completions')) {
      return res.status(500).json({ error: 'Missing workout completion table. Run migrations.' });
    }
    console.error('Failed to save workout completions', err);
    res.status(500).json({ error: 'Failed to save workout completions' });
  }
});

app.get('/api/habit-logs', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const startIso = normalizeDateInput(req.query?.start);
  const endIso = normalizeDateInput(req.query?.end);
  try {
    let query = supabase
      .from('user_habit_logs')
      .select('habit_date, habit_key, value, status')
      .eq('user_id', req.session.user.id);
    if (startIso) query = query.gte('habit_date', startIso);
    if (endIso) query = query.lte('habit_date', endIso);
    const { data, error } = await query.order('habit_date', { ascending: true });
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ entries: Array.isArray(data) ? data : [] });
  } catch (err) {
    if (isMissingRelation(err, 'user_habit_logs')) {
      return res.status(500).json({ error: 'Missing habit log table. Run migrations.' });
    }
    console.error('Failed to load habit logs', err);
    res.status(500).json({ error: 'Failed to load habit logs' });
  }
});

app.post('/api/habit-logs', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const incoming = Array.isArray(req.body?.entries) ? req.body.entries : [];
  const normalized = incoming
    .map((item) => {
      const date = normalizeDateInput(item?.habit_date || item?.date);
      const habitKey = String(item?.habit_key || item?.key || '').trim();
      if (!date || !habitKey) return null;
      const value = item?.value ?? null;
      const status = typeof item?.status === 'boolean' ? item.status : null;
      return {
        user_id: req.session.user.id,
        habit_date: date,
        habit_key: habitKey,
        value: value !== null ? Number(value) : null,
        status
      };
    })
    .filter(Boolean);

  if (!normalized.length) return res.status(400).json({ error: 'No habit logs to save' });

  try {
    const { error } = await supabase
      .from('user_habit_logs')
      .upsert(normalized, { onConflict: 'user_id,habit_date,habit_key' });
    if (error) throw error;
    res.json({ ok: true, count: normalized.length });
  } catch (err) {
    if (isMissingRelation(err, 'user_habit_logs')) {
      return res.status(500).json({ error: 'Missing habit log table. Run migrations.' });
    }
    console.error('Failed to save habit logs', err);
    res.status(500).json({ error: 'Failed to save habit logs' });
  }
});

app.get('/api/daily-checkin', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { data, error } = await supabase
      .from('user_daily_checkins')
      .select('last_checkin_date')
      .eq('user_id', req.session.user.id)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ last_checkin_date: data?.last_checkin_date || null });
  } catch (err) {
    if (isMissingRelation(err, 'user_daily_checkins')) {
      return res.status(500).json({ error: 'Missing daily check-in table. Run migrations.' });
    }
    console.error('Failed to load daily check-in state', err);
    res.status(500).json({ error: 'Failed to load daily check-in state' });
  }
});

app.post('/api/daily-checkin', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const date = normalizeDateInput(req.body?.last_checkin_date || req.body?.date);
  if (!date) return res.status(400).json({ error: 'Invalid check-in date' });
  try {
    const payload = {
      user_id: req.session.user.id,
      last_checkin_date: date,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase
      .from('user_daily_checkins')
      .upsert([payload], { onConflict: 'user_id' });
    if (error) throw error;
    res.json({ ok: true, last_checkin_date: date });
  } catch (err) {
    if (isMissingRelation(err, 'user_daily_checkins')) {
      return res.status(500).json({ error: 'Missing daily check-in table. Run migrations.' });
    }
    console.error('Failed to save daily check-in state', err);
    res.status(500).json({ error: 'Failed to save daily check-in state' });
  }
});

app.get('/api/weekly-report-state', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { data, error } = await supabase
      .from('user_weekly_report_state')
      .select('last_week_start')
      .eq('user_id', req.session.user.id)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ last_week_start: data?.last_week_start || null });
  } catch (err) {
    if (isMissingRelation(err, 'user_weekly_report_state')) {
      return res.status(500).json({ error: 'Missing weekly report state table. Run migrations.' });
    }
    console.error('Failed to load weekly report state', err);
    res.status(500).json({ error: 'Failed to load weekly report state' });
  }
});

app.post('/api/weekly-report-state', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const date = normalizeDateInput(req.body?.last_week_start || req.body?.weekStart);
  if (!date) return res.status(400).json({ error: 'Invalid week start date' });
  try {
    const payload = {
      user_id: req.session.user.id,
      last_week_start: date,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase
      .from('user_weekly_report_state')
      .upsert([payload], { onConflict: 'user_id' });
    if (error) throw error;
    res.json({ ok: true, last_week_start: date });
  } catch (err) {
    if (isMissingRelation(err, 'user_weekly_report_state')) {
      return res.status(500).json({ error: 'Missing weekly report state table. Run migrations.' });
    }
    console.error('Failed to save weekly report state', err);
    res.status(500).json({ error: 'Failed to save weekly report state' });
  }
});

app.get('/api/week-anchor', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { data, error } = await supabase
      .from('user_week_anchors')
      .select('anchor_date')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    res.json({ anchor_date: data?.anchor_date || null });
  } catch (err) {
    console.error('Failed to load week anchor', err);
    res.status(500).json({ error: 'Failed to load week anchor' });
  }
});

app.post('/api/week-anchor', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const incoming = normalizeDateInput(req.body?.anchor_date || req.body?.anchorDate);
  if (!incoming) return res.status(400).json({ error: 'Invalid anchor date' });

  try {
    const { data: existing, error: existingError } = await supabase
      .from('user_week_anchors')
      .select('anchor_date')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') throw existingError;

    let finalAnchor = incoming;
    if (existing?.anchor_date) {
      finalAnchor = existing.anchor_date <= incoming ? existing.anchor_date : incoming;
    }

    if (!existing?.anchor_date) {
      const { error: insertError } = await supabase.from('user_week_anchors').insert([
        { user_id: req.session.user.id, anchor_date: finalAnchor }
      ]);
      if (insertError) throw insertError;
    } else if (finalAnchor !== existing.anchor_date) {
      const { error: updateError } = await supabase
        .from('user_week_anchors')
        .update({ anchor_date: finalAnchor, updated_at: new Date().toISOString() })
        .eq('user_id', req.session.user.id);
      if (updateError) throw updateError;
    }

    res.json({ anchor_date: finalAnchor });
  } catch (err) {
    console.error('Failed to save week anchor', err);
    res.status(500).json({ error: 'Failed to save week anchor' });
  }
});

app.get('/api/achievements', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_key, title, message, created_at')
      .eq('user_id', req.session.user.id)
      .order('created_at', { ascending: false });

    if (error && error.code !== 'PGRST116') throw error;
    const achievements = Array.isArray(data) ? data : [];
    res.json({ achievements });
  } catch (err) {
    console.error('Failed to load achievements', err);
    res.status(500).json({ error: 'Failed to load achievements' });
  }
});

app.post('/api/achievements', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const payload = Array.isArray(req.body?.achievements) ? req.body.achievements : [];
  const normalized = payload
    .map((item) => {
      const key = String(item?.id || item?.achievement_key || item?.key || '').trim();
      if (!key) return null;
      return {
        user_id: req.session.user.id,
        achievement_key: key,
        title: item?.title || null,
        message: item?.message || null
      };
    })
    .filter(Boolean);

  if (!normalized.length) return res.status(400).json({ error: 'No achievements to save' });

  try {
    const { error } = await supabase
      .from('user_achievements')
      .upsert(normalized, { onConflict: 'user_id,achievement_key', ignoreDuplicates: true });

    if (error) throw error;
    res.json({ ok: true, count: normalized.length });
  } catch (err) {
    console.error('Failed to save achievements', err);
    res.status(500).json({ error: 'Failed to save achievements' });
  }
});

app.get('/api/user-counts', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { data: providerRows, error: providerError } = await supabase
      .from('user_providers')
      .select('provider, user_id');

    if (providerError) {
      throw providerError;
    }

    const providerSets = new Map();
    const allUsers = new Set();
    (providerRows || []).forEach((row) => {
      const provider = String(row?.provider || '').toLowerCase().trim();
      const userId = row?.user_id;
      if (!provider || !userId) return;
      if (!providerSets.has(provider)) providerSets.set(provider, new Set());
      providerSets.get(provider).add(userId);
      allUsers.add(userId);
    });

    const countFor = (key) => (providerSets.get(key)?.size || 0);

    res.json({
      ok: true,
      totalUsers: allUsers.size,
      manualUsers: countFor('local'),
      facebookUsers: countFor('facebook'),
      googleUsers: countFor('google'),
      byProvider: Array.from(providerSets.entries()).reduce((acc, [key, set]) => {
        acc[key] = set.size;
        return acc;
      }, {})
    });
  } catch (err) {
    console.error('Failed to load user counts', err);
    res.status(500).json({ error: 'Failed to load user counts' });
  }
});

app.get('/api/today-target', async (req, res) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { data, error } = await supabase
      .from('v_today_target')
      .select('*')
      .eq('user_id', req.session.user.id)
      .maybeSingle();

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.json({ target: null });
      }
      throw error;
    }

    res.json({ target: data || null });
  } catch (err) {
    console.error('Failed to fetch today target', err);
    res.status(500).json({ error: 'Failed to fetch today target' });
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
  const burnMultiplierRaw = req.query.burnMultiplier;
  const burnMultiplierOverride = Number.isFinite(Number(burnMultiplierRaw)) ? Number(burnMultiplierRaw) : null;
  const requestStartIso = toISODate(startDate);
  const mealPlanCacheKey = buildMealPlanCacheKey({
    userId: req.session.user.id,
    startIso: requestStartIso,
    days,
    burnMultiplierOverride
  });
  const cachedMealPlan = readMealPlanCache(mealPlanCacheKey);
  if (cachedMealPlan) {
    return res.json(cachedMealPlan);
  }

  try {
    const emptyPayload = { mealsByDate: {}, source: 'supabase' };
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
      writeMealPlanCache(mealPlanCacheKey, emptyPayload);
      return res.json(emptyPayload);
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
          .select('id, code, portion_multiplier, training_multiplier, notes')
          .eq('id', activePlan.current_level_id)
          .maybeSingle()
      : { data: null, error: null };

    if (levelError && levelError.code !== 'PGRST116') {
      throw levelError;
    }

    if (!levelRow) {
      const { data: defaultLevel, error: defaultError } = await supabase
        .from('plan_levels')
        .select('id, code, portion_multiplier, training_multiplier, notes')
        .eq('code', 'Beginner')
        .maybeSingle();
      if (defaultError && defaultError.code !== 'PGRST116') {
        throw defaultError;
      }
      levelRow = defaultLevel || null;
    }

    if (!levelRow) {
      writeMealPlanCache(mealPlanCacheKey, emptyPayload);
      return res.json(emptyPayload);
    }

    const { data: workoutPlan, error: workoutPlanError } = await supabase
      .from('user_workout_plans')
      .select('id, goal_slug, level_code, start_date, current_day, schema_version')
      .eq('user_id', req.session.user.id)
      .eq('archived', false)
      .eq('completed', false)
      .order('start_date', { ascending: false })
      .maybeSingle();

    if (workoutPlanError && workoutPlanError.code !== 'PGRST116') {
      throw workoutPlanError;
    }

    const activeWorkoutPlan = workoutPlan || null;
    let workoutPlanConfig = null;
    if (activeWorkoutPlan?.schema_version) {
      const { data: configRow, error: configError } = await supabase
        .from('workout_plan_configs')
        .select('config')
        .eq('schema_version', activeWorkoutPlan.schema_version)
        .maybeSingle();
      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }
      workoutPlanConfig = configRow?.config || null;
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
      writeMealPlanCache(mealPlanCacheKey, emptyPayload);
      return res.json(emptyPayload);
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

    const scaleMealValues = (meal, ratio) => ({
      ...meal,
      calories: Math.round((Number(meal.calories || 0)) * ratio),
      protein: Math.round((Number(meal.protein || 0)) * ratio),
      carbs: Math.round((Number(meal.carbs || 0)) * ratio),
      fat: Math.round((Number(meal.fat || 0)) * ratio)
    });

    const applyNutritionTarget = (meals, targetCalories) => {
      if (!Array.isArray(meals) || !meals.length) return { meals, totals: sumMacros(meals) };
      const baseTotals = sumMacros(meals);
      if (!Number.isFinite(targetCalories) || targetCalories <= 0 || baseTotals.calories <= 0) {
        return { meals, totals: baseTotals };
      }
      const ratio = targetCalories / baseTotals.calories;
      let scaledMeals = meals.map((meal) => scaleMealValues(meal, ratio));
      let totals = sumMacros(scaledMeals);
      const diff = Math.round(targetCalories - totals.calories);
      if (diff && scaledMeals.length) {
        const maxIndex = scaledMeals.reduce(
          (idx, meal, current) => (Number(meal.calories || 0) > Number(scaledMeals[idx].calories || 0) ? current : idx),
          0
        );
        scaledMeals[maxIndex] = {
          ...scaledMeals[maxIndex],
          calories: Math.max(0, Number(scaledMeals[maxIndex].calories || 0) + diff)
        };
        totals = sumMacros(scaledMeals);
      }
      return { meals: scaledMeals, totals };
    };

    const normalizePlanKey = (value) =>
      String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');

    const goalRules = {
      'lose-weight': { burnMultiplier: 0.25, baseAdjust: -250 },
      'build-muscle': { burnMultiplier: 0.75, baseAdjust: 250 },
      'improve-endurance': { burnMultiplier: 0.6, baseAdjust: 150 }
    };

    const resolvedGoalSlug =
      normalizeGoalSlug(activeWorkoutPlan?.goal_slug) ||
      normalizeGoalSlug(goalRow?.slug) ||
      goalSlug ||
      'general-fitness';
    const resolvedGoalTitle =
      goalRow?.title ||
      (resolvedGoalSlug ? resolvedGoalSlug.replace(/-/g, ' ') : 'General Fitness');
    const goalRule = goalRules[resolvedGoalSlug] || { burnMultiplier: 0.5, baseAdjust: 0 };
    const burnMultiplier = burnMultiplierOverride ?? goalRule.burnMultiplier;
    const baseKcalAdjust = goalRule.baseAdjust || 0;

    const planDayKeys = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const calendarDayKeys = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const workoutPlanData = workoutPlanConfig?.plan || null;
    const workoutRules = workoutPlanConfig?.rules || {};
    const burnMultipliers = workoutRules?.burnMultipliers || {};
    const progressionRules = workoutRules?.progression || {};
    const resolvedWorkoutLevel =
      activeWorkoutPlan?.level_code || levelRow?.code || 'Beginner';
    const normalizedGoalKey = normalizePlanKey(resolvedGoalTitle);
    const normalizedSlugKey = normalizePlanKey(
      resolvedGoalSlug ? resolvedGoalSlug.replace(/-/g, ' ') : ''
    );
    const workoutPlanGoal = (() => {
      if (!workoutPlanData || typeof workoutPlanData !== 'object') return null;
      const entries = Object.entries(workoutPlanData);
      if (!entries.length) return null;
      const exactTitle = entries.find(
        ([key]) => normalizePlanKey(key) === normalizedGoalKey
      );
      if (exactTitle) return exactTitle[1];
      const exactSlug = entries.find(
        ([key]) => normalizePlanKey(key) === normalizedSlugKey
      );
      if (exactSlug) return exactSlug[1];
      const general = entries.find(
        ([key]) => normalizePlanKey(key) === 'generalfitness'
      );
      if (general) return general[1];
      return entries[0]?.[1] || null;
    })();
    const planStartDate = activeWorkoutPlan?.start_date
      ? new Date(`${activeWorkoutPlan.start_date}T00:00:00`)
      : null;
    const planCurrentDay = Number.isFinite(Number(activeWorkoutPlan?.current_day))
      ? Number(activeWorkoutPlan.current_day)
      : 1;
    const getPlannedWorkoutBurn = (date, offset) => {
      if (!workoutPlanGoal) return 0;
      const dayIndex = planStartDate instanceof Date && !Number.isNaN(planStartDate.getTime())
        ? Math.max(1, Math.floor((date - planStartDate) / 86400000) + 1)
        : Math.max(1, planCurrentDay + offset);
      const dayKey = planDayKeys[(dayIndex - 1) % 7];
      const weekdayKey = calendarDayKeys[date.getDay()];
      const seedWeek = workoutPlanGoal?.seedWeek || {};
      const levelSeed = seedWeek?.[resolvedWorkoutLevel] || seedWeek?.Beginner || null;
      const daySeed = levelSeed?.[dayKey] || levelSeed?.[weekdayKey] || null;
      const baseBurn = Number(daySeed?.baseBurn || 0);
      if (!Number.isFinite(baseBurn) || baseBurn <= 0) return 0;
      const levelMultiplier = Number(burnMultipliers?.[resolvedWorkoutLevel] || levelRow?.training_multiplier || 1);
      const progression = progressionRules?.[resolvedWorkoutLevel] || {};
      const weeklyIncrementPct = Number(progression.weeklyIncrementPct || 0);
      const maxPct = Number(progression.maxPct || 0);
      const weekIndex = Math.max(0, Math.floor((dayIndex - 1) / 7));
      const pct = Math.min(weeklyIncrementPct * weekIndex, maxPct);
      return Math.round(baseBurn * levelMultiplier * (1 + pct / 100));
    };

    const templateByWeekday = new Map(templateDays.map((day) => [day.weekday, day]));
    const mealsByDate = {};
    const baseDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDate = new Date(baseDate);
    endDate.setDate(baseDate.getDate() + days - 1);
    const rangeStartIso = toISODate(baseDate);
    const rangeEndIso = toISODate(endDate);
    const workoutBurnByDate = new Map();

    if (rangeStartIso && rangeEndIso) {
      let sessionRows = [];
      if (activeWorkoutPlan?.id) {
        const { data, error } = await supabase
          .from('user_workout_sessions')
          .select('scheduled_date, adjusted_burn, base_burn')
          .eq('plan_id', activeWorkoutPlan.id)
          .gte('scheduled_date', rangeStartIso)
          .lte('scheduled_date', rangeEndIso);
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        sessionRows = Array.isArray(data) ? data : [];
      } else {
        const { data, error } = await supabase
          .from('user_workout_sessions')
          .select('scheduled_date, adjusted_burn, base_burn, user_workout_plans!inner(user_id)')
          .eq('user_workout_plans.user_id', req.session.user.id)
          .gte('scheduled_date', rangeStartIso)
          .lte('scheduled_date', rangeEndIso);
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        sessionRows = Array.isArray(data) ? data : [];
      }

      sessionRows.forEach((row) => {
        const iso = row?.scheduled_date;
        if (!iso) return;
        const burn = Number(row?.adjusted_burn ?? row?.base_burn ?? 0);
        const existing = workoutBurnByDate.get(iso) || 0;
        workoutBurnByDate.set(iso, existing + (Number.isFinite(burn) ? burn : 0));
      });
    }

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

      const baseTotals = sumMacros(meals);
      const hasActualBurn = workoutBurnByDate.has(iso);
      const actualBurn = hasActualBurn ? workoutBurnByDate.get(iso) || 0 : 0;
      const plannedBurn = hasActualBurn ? 0 : getPlannedWorkoutBurn(date, offset);
      const workoutBurn = hasActualBurn ? actualBurn : plannedBurn;
      const baseDaily = templateDay.base_daily_kcal || baseTotals.calories || 0;
      const targetCalories = Math.max(
        0,
        Math.round(baseDaily + baseKcalAdjust + workoutBurn * burnMultiplier)
      );
      const { meals: adjustedMeals, totals } = applyNutritionTarget(meals, targetCalories);
      const ratio = baseTotals.calories > 0 ? targetCalories / baseTotals.calories : 1;
      const macroTargets = {
        protein: templateDay.base_daily_protein != null ? Math.round(templateDay.base_daily_protein * ratio) : totals.protein,
        carbs: templateDay.base_daily_carbs != null ? Math.round(templateDay.base_daily_carbs * ratio) : totals.carbs,
        fat: templateDay.base_daily_fat != null ? Math.round(templateDay.base_daily_fat * ratio) : totals.fat
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
        meals: adjustedMeals,
        workoutBurn,
        burnMultiplier,
        subtitle: levelRow.notes ? `${levelRow.code} plan • ${levelRow.notes}` : 'Goal-based meals'
      };
    }

    const responsePayload = { mealsByDate, source: 'supabase' };
    writeMealPlanCache(mealPlanCacheKey, responsePayload);
    return res.json(responsePayload);
  } catch (err) {
    console.error('Failed to load meal plans', err);
    return res.status(500).json({ error: 'Failed to load meal plans' });
  }
});

app.put('/api/profile', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { weight_kg, height_cm, age, goal, target_weight, preference, allergies, username } = req.body || {};

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
  const rawUsername = typeof username === 'string' ? username.trim() : '';
  const trimmedUsername = rawUsername.startsWith('@') ? rawUsername.slice(1) : rawUsername;
  const normalizedUsername = sanitizeUsername(trimmedUsername);

  try {
    if (rawUsername) {
      if (!normalizedUsername) {
        return res.status(400).json({ error: 'Invalid username. Use letters and numbers only.' });
      }
      const currentUsername = req.session.user.username || null;
      if (normalizedUsername !== currentUsername) {
        const { data: existingRows, error: existingError } = await supabase
          .from('users')
          .select('id')
          .eq('username', normalizedUsername)
          .limit(1);

        if (existingError) {
          throw existingError;
        }

        const existing = Array.isArray(existingRows) ? existingRows[0] : existingRows;
        if (existing && existing.id && existing.id !== req.session.user.id) {
          return res.status(409).json({ error: 'Username already exists' });
        }

        const { data: updatedUserRows, error: updateUserError } = await supabase
          .from('users')
          .update({ username: normalizedUsername })
          .eq('id', req.session.user.id)
          .select('id, username, name, email');

        if (updateUserError) {
          if (isUniqueViolation(updateUserError) && isDuplicateKeyOn(updateUserError, 'username')) {
            return res.status(409).json({ error: 'Username already exists' });
          }
          throw updateUserError;
        }

        const updatedUser = Array.isArray(updatedUserRows) ? updatedUserRows[0] : updatedUserRows;
        if (updatedUser?.username) {
          req.session.user.username = updatedUser.username;
        }
      }
    }

    let startingWeightValue = null;
    if (weightValue !== null) {
      const { data: existingProfile, error: existingError } = await supabase
        .from('profiles')
        .select('starting_weight_kg')
        .eq('user_id', req.session.user.id)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') {
        throw existingError;
      }
      if (!existingProfile?.starting_weight_kg) {
        startingWeightValue = weightValue;
      }
    }

    const updatePayload = {
      weight_kg: weightValue,
      height_cm: heightValue,
      age: ageValue,
      bmi: bmiValue,
      goal: goalValue,
      target_weight: targetValue,
      preference: preferenceValue,
      allergies: allergiesValue,
      updated_at: new Date().toISOString()
    };

    if (startingWeightValue !== null) {
      updatePayload.starting_weight_kg = startingWeightValue;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', req.session.user.id)
      .select('age, height_cm, weight_kg, starting_weight_kg, bmi, goal, target_weight, preference, allergies, avatar_url');

    if (error) {
      throw error;
    }
    if (!data || !data.length) return res.status(404).json({ error: 'Profile not found' });
    const updated = normalizeProfileRow(data[0]);
    const needsHealthInfo = needsHealthProfile(updated);
    if (req.session.user) {
      req.session.user.needsHealthInfo = needsHealthInfo;
    }
    invalidateMealPlanCacheForUser(req.session.user?.id);
    res.json({
      ok: true,
      profile: updated,
      needsHealthInfo,
      user: { username: req.session.user.username }
    });
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

app.post('/api/profile/avatar-url', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { avatarUrl } = req.body || {};
  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return res.status(400).json({ error: 'Missing avatar URL' });
  }
  const trimmed = avatarUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return res.status(400).json({ error: 'Avatar URL must be http(s)' });
  }
  if (trimmed.length > 2000) {
    return res.status(400).json({ error: 'Avatar URL is too long' });
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: trimmed, updated_at: new Date().toISOString() })
      .eq('user_id', req.session.user.id);
    if (error) throw error;
    res.json({ ok: true, avatar_url: trimmed });
  } catch (err) {
    console.error('Failed to update avatar URL', err);
    res.status(500).json({ error: 'Failed to update avatar URL' });
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

    try {
      await supabase
        .from('user_workout_completions')
        .upsert(
          [
            {
              user_id: req.session.user.id,
              workout_date: activityDate,
              logged: true
            }
          ],
          { onConflict: 'user_id,workout_date' }
        );
    } catch (err) {
      if (!isMissingRelation(err, 'user_workout_completions')) {
        console.warn('Failed to save workout completion state', err);
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

    invalidateMealPlanCacheForUser(req.session.user.id);
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

app.get('/api/workouts/latest', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { data, error } = await supabase
      .from('user_workout_sessions')
      .select(
        'id, scheduled_date, completed_at, status, workouts, level_code, day_index, actual_metrics, base_burn, adjusted_burn, user_workout_plans!inner(goal_slug, user_id)'
      )
      .eq('user_workout_plans.user_id', req.session.user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .order('scheduled_date', { ascending: false })
      .limit(1);

    if (error) throw error;
    const session = Array.isArray(data) ? data[0] : null;
    if (!session) {
      res.json({ session: null });
      return;
    }

    res.json({
      session: {
        id: session.id,
        scheduled_date: session.scheduled_date,
        completed_at: session.completed_at,
        status: session.status,
        workouts: session.workouts || [],
        level_code: session.level_code,
        day_index: session.day_index,
        goal_slug: session.user_workout_plans?.goal_slug || session.actual_metrics?.goal_slug || null,
        base_burn: session.base_burn,
        adjusted_burn: session.adjusted_burn
      }
    });
  } catch (err) {
    console.error('Failed to fetch latest workout session', err);
    res.status(500).json({ error: 'Failed to fetch latest workout session' });
  }
});

app.get('/api/workouts/performance-summary', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { data, error } = await supabase
      .from('user_workout_sessions')
      .select(
        'scheduled_date, workouts, user_workout_plans!inner(user_id)'
      )
      .eq('user_workout_plans.user_id', req.session.user.id)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    const sessions = Array.isArray(data) ? data : [];
    let totalWatchedSeconds = 0;
    let totalTargetSeconds = 0;
    let firstDate = null;

    sessions.forEach((session) => {
      if (!firstDate && session?.scheduled_date) {
        firstDate = session.scheduled_date;
      }
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

    res.json({
      startDate: firstDate,
      totalWatchedSeconds,
      totalTargetSeconds,
      percentWatched,
      performanceLabel
    });
  } catch (err) {
    console.error('Failed to load performance summary', err);
    res.status(500).json({ error: 'Failed to load performance summary' });
  }
});

app.get('/api/workouts/performance-weekly', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { start, end } = req.query || {};
  const startIso = typeof start === 'string' ? start : null;
  const endIso = typeof end === 'string' ? end : null;
  try {
    const filters = supabase
      .from('user_workout_sessions')
      .select('scheduled_date, status, completed_at, workouts, user_workout_plans!inner(user_id)')
      .eq('user_workout_plans.user_id', req.session.user.id);

    if (startIso) {
      filters.gte('scheduled_date', startIso);
    }
    if (endIso) {
      filters.lte('scheduled_date', endIso);
    }

    const { data, error } = await filters.order('scheduled_date', { ascending: true });
    if (error) throw error;

    const sessions = Array.isArray(data) ? data : [];
    let totalWatchedSeconds = 0;
    let totalTargetSeconds = 0;
    let firstDate = null;
    let lastDate = null;
    let sessionsCompleted = 0;

    sessions.forEach((session) => {
      if (session?.scheduled_date) {
        if (!firstDate) firstDate = session.scheduled_date;
        lastDate = session.scheduled_date;
      }
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

    res.json({
      startDate: startIso || firstDate,
      endDate: endIso || lastDate,
      sessionsCompleted,
      totalWatchedSeconds,
      totalTargetSeconds,
      percentWatched,
      performanceLabel
    });
  } catch (err) {
    console.error('Failed to load weekly performance summary', err);
    res.status(500).json({ error: 'Failed to load weekly performance summary' });
  }
});

app.post('/api/reports/weekly-email', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { weekStart, weekEnd, performance, habits } = req.body || {};

  try {
    const { data: account, error: accountError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', req.session.user.id)
      .maybeSingle();

    if (accountError) throw accountError;
    if (!account?.email) return res.status(400).json({ error: 'Missing email address' });

    const report = buildWeeklyReportEmail({
      userName: account.name || req.session.user.name,
      weekStart,
      weekEnd,
      performance,
      habits,
      appUrl: process.env.APP_URL || undefined
    });

    const result = await sendEmail({
      to: account.email,
      subject: report.subject,
      html: report.html,
      text: report.text
    });

    res.json({ ok: true, sent: Boolean(result?.ok), skipped: Boolean(result?.skipped), preview: report.html });
  } catch (err) {
    console.error('Failed to send weekly report email', err);
    res.status(500).json({ error: 'Failed to send weekly report email' });
  }
});

app.post('/api/reports/goal-achievements-email', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { achievements } = req.body || {};
  if (!Array.isArray(achievements) || achievements.length === 0) {
    return res.status(400).json({ error: 'Missing achievements' });
  }

  try {
    const { data: account, error: accountError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', req.session.user.id)
      .maybeSingle();

    if (accountError) throw accountError;
    if (!account?.email) return res.status(400).json({ error: 'Missing email address' });

    const report = buildGoalAchievementsEmail({
      userName: account.name || req.session.user.name,
      achievements,
      appUrl: process.env.APP_URL || undefined
    });

    const result = await sendEmail({
      to: account.email,
      subject: report.subject,
      html: report.html,
      text: report.text
    });

    res.json({ ok: true, sent: Boolean(result?.ok), skipped: Boolean(result?.skipped) });
  } catch (err) {
    console.error('Failed to send goal achievement email', err);
    res.status(500).json({ error: 'Failed to send goal achievement email' });
  }
});

app.patch('/api/workouts/session', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { sessionId, workouts } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });
  const sanitizedWorkouts = sanitizeWorkoutsPayload(workouts);

  try {
    const { data: session, error: sessionError } = await supabase
      .from('user_workout_sessions')
      .select(
        'id, scheduled_date, completed_at, level_code, day_index, actual_metrics, base_burn, adjusted_burn, user_workout_plans!inner(user_id, goal_slug)'
      )
      .eq('id', sessionId)
      .eq('user_workout_plans.user_id', req.session.user.id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Workout session not found' });
    }

    const timestampIso = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from('user_workout_sessions')
      .update({ workouts: sanitizedWorkouts, updated_at: timestampIso })
      .eq('id', sessionId)
      .select('id, scheduled_date, completed_at, status, workouts, level_code, day_index, actual_metrics, base_burn, adjusted_burn')
      .single();

    if (updateError) throw updateError;

    invalidateMealPlanCacheForUser(req.session.user.id);
    res.json({
      session: {
        id: updated.id,
        scheduled_date: updated.scheduled_date,
        completed_at: updated.completed_at,
        status: updated.status,
        workouts: updated.workouts || [],
        level_code: updated.level_code,
        day_index: updated.day_index,
        goal_slug: session.user_workout_plans?.goal_slug || updated.actual_metrics?.goal_slug || null,
        base_burn: updated.base_burn,
        adjusted_burn: updated.adjusted_burn
      }
    });
  } catch (err) {
    console.error('Failed to update workout session', err);
    res.status(500).json({ error: 'Failed to update workout session' });
  }
});

app.get('/api/workout-videos', async (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const version =
    typeof req.query.version === 'string' && req.query.version.trim()
      ? req.query.version.trim()
      : 'exercise_videos_v1';
  const refresh =
    typeof req.query.refresh === 'string' ? req.query.refresh.trim().toLowerCase() === '1' : false;
  const limitParam = Number(req.query.limit);
  const normalizedLimit =
    Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.trunc(limitParam), 500) : undefined;

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
    if (refresh) {
      clearExerciseVideoLibraryCache(version);
    }
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
    const details = err instanceof Error && err.message ? err.message : 'Unknown error';
    console.error('Failed to search exercise videos', err);
    res.status(500).json({ error: 'Failed to search exercise videos', details });
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

    try {
      await supabase
        .from('user_workout_completions')
        .upsert(
          [
            {
              user_id: req.session.user.id,
              workout_date: activityDate,
              logged: true
            }
          ],
          { onConflict: 'user_id,workout_date' }
        );
    } catch (err) {
      if (!isMissingRelation(err, 'user_workout_completions')) {
        console.warn('Failed to save workout completion state', err);
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

    invalidateMealPlanCacheForUser(req.session.user.id);
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
}
