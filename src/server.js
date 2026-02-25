import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import mountApiRoutes from './routes/apiRoutes.js';
import { startInactivityMonitor } from './services/accountAlertService.js';
import { startWeeklyReportMonitor } from './services/weeklyReportService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const VIEWS_DIR = path.join(ROOT_DIR, 'views');

const app = express();
const PORT = Number(process.env.APP_PORT || process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax' }
  })
);

mountApiRoutes(app);
startInactivityMonitor();
startWeeklyReportMonitor();

app.get('/', (_req, res) => {
  res.sendFile(path.join(VIEWS_DIR, 'index.html'));
});

app.get('/supabase-config.js', (_req, res) => {
  const payload = {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || ''
  };
  res
    .type('application/javascript')
    .send(`window.__SUPABASE_CONFIG__ = ${JSON.stringify(payload)};`);
});

app.use(express.static(PUBLIC_DIR));
app.use(express.static(VIEWS_DIR));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
