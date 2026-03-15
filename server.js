require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

require('./src/config/db');
const routes = require('./src/routes/index');
const { requireAuth } = require('./src/middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3000;
const pub  = f => path.join(__dirname, 'public', f);
const page = f => path.join(__dirname, 'public', 'pages', f);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'redcell-v4-dev',
  resave: false, saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use('/api', routes);

// Public routes
app.get('/',      (req, res) => res.sendFile(pub('index.html')));
app.get('/login', (req, res) => res.sendFile(pub('login.html')));

// Protected page routes
const protectedPages = [
  'dashboard','planner','habits','roadmap',
  'projects','review','vault','focus','settings'
];
protectedPages.forEach(p =>
  app.get(`/${p}`, requireAuth, (req, res) => res.sendFile(page(`${p}.html`)))
);

app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ error: 'Server error' }); });
app.listen(PORT, () => console.log(`\n🔴 RedCell OS v4 → http://localhost:${PORT}\n`));
