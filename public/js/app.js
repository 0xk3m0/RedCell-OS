/* ════════════════════════════════════════════════════
   RedCell OS v4 — Core JS
   API · Toast · Modal · Shell · Helpers
   ════════════════════════════════════════════════════ */

// ── API ──────────────────────────────────────────────
const A = {
  async _(m, u, b) {
    const o = { method: m, headers: {} };
    if (b !== undefined) { o.headers['Content-Type'] = 'application/json'; o.body = JSON.stringify(b); }
    const r = await fetch(u, o);
    if (r.status === 401) { location.href = '/login'; throw new Error('Unauthorized'); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
    return d;
  },
  get:  (u)     => A._('GET',    u),
  post: (u, b)  => A._('POST',   u, b),
  put:  (u, b)  => A._('PUT',    u, b),
  patch:(u, b)  => A._('PATCH',  u, b),
  del:  (u)     => A._('DELETE', u),
};

// ── TOAST ────────────────────────────────────────────
const T = {
  _el: null,
  _get() {
    if (!this._el) {
      this._el = Object.assign(document.createElement('div'), { id: 'toasts' });
      document.body.appendChild(this._el);
    }
    return this._el;
  },
  show(msg, type = 'ok', ms = 3200) {
    const ico = { ok: '✓', err: '✕', info: 'ℹ', warn: '⚠' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span class="t-ico">${ico[type] || '●'}</span><span class="t-msg">${msg}</span><button class="t-close" onclick="this.closest('.toast').remove()">✕</button>`;
    this._get().appendChild(el);
    const timer = setTimeout(() => {
      el.style.cssText = 'opacity:0;transform:translateX(10px);transition:all .18s';
      setTimeout(() => el.remove(), 180);
    }, ms);
    el.querySelector('.t-close').addEventListener('click', () => clearTimeout(timer));
    return el;
  },
  ok:   (m, ms) => T.show(m, 'ok', ms),
  err:  (m, ms) => T.show(m, 'err', ms),
  info: (m, ms) => T.show(m, 'info', ms),
  warn: (m, ms) => T.show(m, 'warn', ms),
};

// ── MODAL ────────────────────────────────────────────
const M = {
  _stack: [],
  open(id) {
    const el = document.getElementById(id); if (!el) return;
    el.style.display = 'flex';
    requestAnimationFrame(() => el.classList.add('show'));
    this._stack.push(id);
    const onBg = e => { if (e.target === el) { M.close(id); el.removeEventListener('click', onBg); } };
    el.addEventListener('click', onBg);
    // Focus first input
    setTimeout(() => el.querySelector('input:not([type=hidden]),textarea,select')?.focus(), 100);
  },
  close(id) {
    const elId = id || this._stack[this._stack.length - 1]; if (!elId) return;
    const el = document.getElementById(elId); if (!el) return;
    el.classList.remove('show');
    setTimeout(() => { if (!el.classList.contains('show')) el.style.display = 'none'; }, 220);
    this._stack = this._stack.filter(i => i !== elId);
  },
  closeAll() { [...this._stack].forEach(id => M.close(id)); }
};
document.addEventListener('keydown', e => { if (e.key === 'Escape') M.close(); });

// ── DOM UTILS ────────────────────────────────────────
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const setTxt  = (s, v, c) => { const el = $(s, c); if (el) el.textContent = v; };
const setHtml = (s, v, c) => { const el = $(s, c); if (el) el.innerHTML = v; };
const esc = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ── TIME/DATE HELPERS ─────────────────────────────────
const today  = () => new Date().toISOString().slice(0, 10);
const getWS  = () => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().slice(0, 10); };
const fmtDate = ds => {
  const d = new Date(ds + 'T00:00:00'), n = new Date(); n.setHours(0, 0, 0, 0);
  const diff = Math.round((d - n) / 86400000);
  if (diff === 0)  return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1)  return 'Tomorrow';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
const fmtMins = m => m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 > 0 ? ' ' + (m % 60) + 'm' : ''}`;
const dayLbl  = ds => ['S','M','T','W','T','F','S'][new Date(ds + 'T00:00:00').getDay()];
const calcStreak = days => { let s = 0; for (let i = days.length - 1; i >= 0; i--) { if (days[i].status === 'done') s++; else break; } return s; };
const skel    = (h = 40) => `<div class="skel mb-2" style="height:${h}px"></div>`;
const debounce= (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const clamp   = (v, min, max) => Math.max(min, Math.min(max, v));

// ── SHELL INIT ───────────────────────────────────────
async function initShell() {
  // Clock
  const tick = () => {
    const el = $('#tb-clock'); if (!el) return;
    const n = new Date();
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const mos  = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    el.textContent = `${days[n.getDay()]} ${n.getDate()} ${mos[n.getMonth()]} · ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  };
  tick(); setInterval(tick, 15000);

  // User
  try {
    const u = await A.get('/api/auth/me');
    setTxt('#tb-mission', u.mission || 'Web Penetration Tester');
    setTxt('#sb-user-av', (u.username || 'K')[0].toUpperCase());
    setTxt('#sb-user-name', u.username);
    setTxt('#sb-user-role', u.bio || 'Operator');
    window._user = u;
    // Apply accent color if set
    if (u.accent_color && u.accent_color !== 'blue') applyAccent(u.accent_color);
  } catch {}

  // Year progress
  const yf = $('#yr-fill');
  if (yf) {
    const d = new Date(), start = new Date(d.getFullYear(), 0, 0);
    const day = Math.floor((d - start) / 86400000);
    const pct = Math.round(day / 365 * 100);
    yf.style.width = pct + '%';
    setTxt('#yr-day', `Day ${day} / 365`);
    setTxt('#yr-pct', pct + '%');
  }

  // Active nav
  const path = location.pathname;
  $$('.nav-a').forEach(el => {
    const h = el.getAttribute('href') || '';
    el.classList.toggle('active', h && h !== '/' && path.startsWith(h));
  });

  // Logout
  $$('.btn-logout').forEach(b =>
    b.addEventListener('click', async () => { await A.post('/api/auth/logout', {}); location.href = '/login'; })
  );

  // Topbar search
  const si = $('#tb-search');
  if (si) si.addEventListener('keydown', e => {
    if (e.key === 'Enter' && si.value.trim()) location.href = `/vault?q=${encodeURIComponent(si.value.trim())}`;
  });
}

function applyAccent(color) {
  const map = {
    blue:   ['#4f8ef7','#7aacff','#2563eb'],
    red:    ['#f05454','#ff7f7f','#dc2626'],
    green:  ['#34d399','#6ee7b7','#059669'],
    purple: ['#c084fc','#d8b4fe','#9333ea'],
    amber:  ['#fbbf24','#fcd34d','#d97706'],
    cyan:   ['#22d3ee','#67e8f9','#0891b2'],
  };
  const [c, b, d] = map[color] || map.blue;
  document.documentElement.style.setProperty('--c-blue', c);
  document.documentElement.style.setProperty('--c-blue-b', b);
  document.documentElement.style.setProperty('--c-blue-d', d);
}

// ── SIDEBAR HTML ─────────────────────────────────────
function buildSidebar() {
  return `
  <div class="sb-brand">
    <div class="brand-hex"></div>
    <div><div class="brand-name"><span class="r">RED</span>CELL OS</div><div class="brand-ver">v4.0 — PERSONAL OS</div></div>
  </div>
  <nav class="sb-nav">
    <div class="nav-grp"><div class="nav-grp-lbl">Overview</div>
      <a href="/dashboard" class="nav-a"><span class="ni">⌂</span><span class="lbl">Dashboard</span></a>
    </div>
    <div class="nav-grp"><div class="nav-grp-lbl">Execution</div>
      <a href="/planner"  class="nav-a"><span class="ni">☑</span><span class="lbl">Daily Planner</span></a>
      <a href="/focus"    class="nav-a"><span class="ni">⏱</span><span class="lbl">Focus Mode</span></a>
    </div>
    <div class="nav-grp"><div class="nav-grp-lbl">Growth</div>
      <a href="/habits"   class="nav-a"><span class="ni">◉</span><span class="lbl">Habits</span></a>
      <a href="/roadmap"  class="nav-a"><span class="ni">⬡</span><span class="lbl">Cyber Roadmap</span></a>
      <a href="/projects" class="nav-a"><span class="ni">◈</span><span class="lbl">Projects Lab</span></a>
    </div>
    <div class="nav-grp"><div class="nav-grp-lbl">Knowledge</div>
      <a href="/vault"    class="nav-a"><span class="ni">📓</span><span class="lbl">Notes Vault</span></a>
      <a href="/review"   class="nav-a"><span class="ni">↺</span><span class="lbl">Weekly Review</span></a>
    </div>
    <div class="nav-grp"><div class="nav-grp-lbl">System</div>
      <a href="/settings" class="nav-a"><span class="ni">⚙</span><span class="lbl">Settings</span></a>
    </div>
  </nav>
  <div class="sb-foot">
    <div class="yr-row"><span id="yr-day">Year 2026</span><span id="yr-pct">0%</span></div>
    <div class="yr-bar"><div class="yr-fill" id="yr-fill" style="width:0%"></div></div>
    <div class="sb-user">
      <div class="user-av" id="sb-user-av">K</div>
      <div><div class="user-name" id="sb-user-name">...</div><div class="user-role" id="sb-user-role">Operator</div></div>
    </div>
  </div>`;
}

function buildTopbar(title) {
  return `
  <div class="tb-title">${title}</div>
  <div class="tb-search search-wrap">
    <span class="search-ico">🔍</span>
    <input type="text" id="tb-search" placeholder="Search vault...">
  </div>
  <div class="tb-actions flex items-center gap-3">
    <div class="dot on"></div>
    <span class="tb-clock" id="tb-clock"></span>
    <div class="tb-mission" id="tb-mission">...</div>
    <button class="btn-logout">LOGOUT</button>
  </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const sb = $('#sidebar'); if (sb && !sb.innerHTML.trim()) sb.innerHTML = buildSidebar();
  const tb = $('#topbar');  if (tb && !tb.innerHTML.trim()) { tb.innerHTML = buildTopbar(tb.dataset.title || document.title.split('—')[1]?.trim() || 'Dashboard'); }
});
