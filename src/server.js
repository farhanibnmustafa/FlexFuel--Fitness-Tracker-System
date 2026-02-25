import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
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
const PORT = Number(process.env.PORT || process.env.APP_PORT) || 3001;

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

function getFreePort(preferred) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => {
      // preferred port is busy — ask OS for any free port
      const fallback = net.createServer();
      fallback.listen(0, () => {
        const { port } = fallback.address();
        fallback.close(() => resolve(port));
      });
    });
    tester.once('listening', () => {
      tester.close(() => resolve(preferred));
    });
    tester.listen(preferred);
  });
}

const freePort = await getFreePort(PORT);
app.listen(freePort, () => {
  console.log(`Server running on http://localhost:${freePort}`);
  startInactivityMonitor();
  startWeeklyReportMonitor();
});
