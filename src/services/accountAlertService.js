import { supabase } from '../models/supabaseClient.js';
import { sendEmail } from './emailService.js';

const ALERT_AFTER_DAYS = 10;
const DELETE_AFTER_DAYS = 15;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
let sweepInProgress = false;

const formatDate = (date) =>
  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const buildAccountAlertEmail = ({ name, lastActiveDate, deletionDate, appUrl }) => {
  const safeName = name || 'Athlete';
  const lastActiveLabel = lastActiveDate ? formatDate(lastActiveDate) : 'recently';
  const deletionLabel = deletionDate ? formatDate(deletionDate) : 'soon';
  const appLink = appUrl || process.env.APP_URL || 'http://localhost:3000';
  const subject = 'Account inactivity alert from FlexFule';
  const text = `Hi ${safeName},

We noticed you haven’t logged in since ${lastActiveLabel}.

If you don’t log in, your account will be automatically deleted on ${deletionLabel}.

Log in to keep your account active: ${appLink}/login.html
`;

  const html = `
  <div style="margin:0;padding:0;background:#0b1220;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1220;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
            <tr>
              <td style="padding:28px 32px;background:linear-gradient(135deg,#1f2937,#111827);">
                <h1 style="margin:0;font-size:24px;color:#f8fafc;">Account Alert</h1>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">FlexFule</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 12px;font-size:16px;color:#e2e8f0;">Hi ${safeName},</p>
                <p style="margin:0 0 12px;color:#cbd5f5;font-size:14px;">We noticed you haven’t logged in since <strong>${lastActiveLabel}</strong>.</p>
                <p style="margin:0 0 16px;color:#cbd5f5;font-size:14px;">
                  If you don’t log in, your account will be automatically deleted on <strong>${deletionLabel}</strong>.
                </p>
                <div style="margin-top:18px;text-align:center;">
                  <a href="${appLink}/login.html" style="display:inline-block;padding:12px 20px;background:#4cd964;color:#0b1220;text-decoration:none;border-radius:12px;font-weight:700;">Log In Now</a>
                </div>
                <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;text-align:center;">This helps keep inactive accounts safe.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;

  return { subject, html, text };
};

const resolveAlertsEnabled = (row) => {
  const pref = row?.user_notification_preferences;
  if (Array.isArray(pref) && pref.length) {
    const value = pref[0]?.account_alerts_enabled;
    return typeof value === 'boolean' ? value : true;
  }
  if (pref && typeof pref.account_alerts_enabled === 'boolean') {
    return pref.account_alerts_enabled;
  }
  return true;
};

export async function runInactivitySweep() {
  if (sweepInProgress) return;
  sweepInProgress = true;
  try {
    const { data, error } = await supabase
      .from('users')
      .select(
        'id, name, email, created_at, last_login_at, inactivity_alert_sent_at, user_notification_preferences(account_alerts_enabled)'
      );

    if (error) {
      if (error.code === '42P01') {
        console.warn('Inactivity sweep skipped: missing tables. Run migrations.');
        return;
      }
      throw error;
    }
    const rows = Array.isArray(data) ? data : [];
    const now = new Date();

    for (const row of rows) {
      if (!row?.email) continue;
      if (!resolveAlertsEnabled(row)) continue;

      const lastActivityRaw = row.last_login_at || row.created_at;
      if (!lastActivityRaw) continue;
      const lastActivity = new Date(lastActivityRaw);
      if (Number.isNaN(lastActivity.getTime())) continue;

      const alertSentAt = row.inactivity_alert_sent_at ? new Date(row.inactivity_alert_sent_at) : null;
      const daysSinceLast = Math.floor((now.getTime() - lastActivity.getTime()) / MS_PER_DAY);

      if (!alertSentAt && daysSinceLast >= ALERT_AFTER_DAYS) {
        const deletionDate = new Date(now.getTime() + DELETE_AFTER_DAYS * MS_PER_DAY);
        const alertEmail = buildAccountAlertEmail({
          name: row.name,
          lastActiveDate: lastActivity,
          deletionDate,
          appUrl: process.env.APP_URL || undefined
        });

        const result = await sendEmail({
          to: row.email,
          subject: alertEmail.subject,
          html: alertEmail.html,
          text: alertEmail.text
        });

        if (result?.ok) {
          await supabase
            .from('users')
            .update({ inactivity_alert_sent_at: now.toISOString() })
            .eq('id', row.id);
        }
        continue;
      }

      if (alertSentAt) {
        const daysSinceAlert = Math.floor((now.getTime() - alertSentAt.getTime()) / MS_PER_DAY);
        const lastLoginAfterAlert =
          row.last_login_at && new Date(row.last_login_at).getTime() > alertSentAt.getTime();

        if (daysSinceAlert >= DELETE_AFTER_DAYS && !lastLoginAfterAlert) {
          await supabase.from('users').delete().eq('id', row.id);
        }
      }
    }
  } catch (err) {
    console.error('Inactivity sweep failed', err);
  } finally {
    sweepInProgress = false;
  }
}

export function startInactivityMonitor() {
  if (String(process.env.DISABLE_INACTIVITY_JOBS || '').toLowerCase() === 'true') {
    console.log('Inactivity monitor disabled via DISABLE_INACTIVITY_JOBS.');
    return;
  }
  if (!process.env.SUPABASE_URL && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Inactivity monitor skipped: Supabase env vars not set.');
    return;
  }
  const intervalHours = Number(process.env.INACTIVITY_SWEEP_HOURS || 12);
  runInactivitySweep();
  setInterval(runInactivitySweep, Math.max(1, intervalHours) * 60 * 60 * 1000);
}
