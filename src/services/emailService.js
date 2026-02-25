import nodemailer from 'nodemailer';

let cachedTransporter = null;

const buildTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const smtpUrl = process.env.SMTP_URL;
  if (smtpUrl) {
    cachedTransporter = nodemailer.createTransport(smtpUrl);
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

  if (!host || !port || !user || !pass) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: secure || port === 465,
    auth: { user, pass }
  });
  return cachedTransporter;
};

export async function sendEmail({ to, subject, html, text }) {
  const transporter = buildTransporter();
  if (!transporter) {
    console.warn('[email] SMTP not configured. Skipping send to', to);
    return { ok: false, skipped: true };
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@flexfule.local';
  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    text
  });
  return { ok: true };
}
