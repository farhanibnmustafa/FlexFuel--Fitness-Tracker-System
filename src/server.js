import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import mountApiRoutes from './routes/apiRoutes.js';
import { startInactivityMonitor } from './services/accountAlertService.js';
import { startWeeklyReportMonitor } from './services/weeklyReportService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const VIEWS_DIR = path.join(ROOT_DIR, 'views');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
const SESSION_SECRET = process.env.SESSION_SECRET || 'Build-Up-By-Farhan-Ibn-Mustafa';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cfiblaukeslitumlbpuh.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmaWJsYXVrZXNsaXR1bWxicHVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1ODczMjIsImV4cCI6MjA3NjE2MzMyMn0.01YiEamMRhIHjn1hbU_xDaDvgF_ScCZuOydvHawf6MY';

app.use(
  session({
    secret: SESSION_SECRET,
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
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  };
  res
    .type('application/javascript')
    .send(`window.__SUPABASE_CONFIG__ = ${JSON.stringify(payload)};`);
});

app.use(express.static(PUBLIC_DIR));
app.use(express.static(VIEWS_DIR));

// Retry on a higher port if preferred port is already occupied.
function listen(port) {
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    startInactivityMonitor();
    startWeeklyReportMonitor();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      server.close();
      listen(port + 1);
    } else {
      throw err;
    }
  });
}

// Default to 3001 — port 3000 is occupied by the sandbox platform process.
const PORT = Number(process.env.APP_PORT || process.env.PORT || 3001);
listen(PORT);
