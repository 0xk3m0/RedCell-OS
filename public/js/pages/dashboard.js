/* RedCell OS v4 — Dashboard */

const CC = { cyber:'b-red', uni:'b-cyan', recovery:'b-amber', general:'b-gray' };
const ENERGY_HINTS = ['','خد راحة تامة','مهمة واحدة بس','شغّل الخطة','طاقة كويسة','🔥 امسح الخطة كلها'];

async function load() {
  await initShell();

  const [stats, tasks, habits, energy, sessions] = await Promise.all([
    A.get('/api/dashboard/stats'),
    A.get('/api/dashboard/tasks'),
    A.get('/api/habits'),
    A.get('/api/energy'),
    A.get('/api/dashboard/focus'),
  ]);

  setHtml('#pg', buildLayout(stats, tasks, habits, energy, sessions));
  initInteractions(stats, tasks, habits, energy, sessions);
}

function buildLayout(stats, tasks, habits, energy, sessions) {
  return `
  <!-- Mission Banner -->
  <div style="background:linear-gradient(90deg,rgba(240,84,84,.07),rgba(79,142,247,.04),transparent);border:1px solid rgba(240,84,84,.2);border-radius:var(--r3);padding:14px 20px;margin-bottom:22px;display:flex;align-items:center;gap:14px;">
    <div style="width:3px;height:38px;background:linear-gradient(180deg,var(--c-red),var(--c-blue));border-radius:2px;flex-shrink:0;box-shadow:0 0 8px var(--c-red-glow)"></div>
    <div class="flex-1 min-w-0">
      <div class="mono text-2xs t3 tracking-2 mb-1">// ACTIVE MISSION</div>
      <div class="disp fw-7" style="font-size:var(--fs-md);">${esc(stats.user?.mission || 'Web Penetration Tester')}</div>
    </div>
    <div class="flex items-center gap-3"><div class="dot on"></div><span class="mono text-2xs t3">SYSTEM ONLINE</span></div>
  </div>

  <!-- Stats Row -->
  <div class="g4 mb-5">
    <div class="scard" style="--scard-c:var(--c-blue)"><div class="scard-ico">⏱</div><div class="scard-lbl">Focus Today</div><div class="scard-val c-blue" style="font-size:var(--fs-3xl);">${stats.focusHours}h</div><div class="scard-sub">target: ${stats.user?.daily_focus_target||4}h</div><div class="scard-trend ${+stats.focusHours >= (stats.user?.daily_focus_target||4) ? 'c-green' : 'c-amber'}">↑</div></div>
    <div class="scard" style="--scard-c:var(--c-amber)"><div class="scard-ico">🔥</div><div class="scard-lbl">Day Streak</div><div class="scard-val c-amber" style="font-size:var(--fs-3xl);">${stats.streak}</div><div class="scard-sub">consecutive days</div></div>
    <div class="scard" style="--scard-c:var(--c-green)"><div class="scard-ico">✓</div><div class="scard-lbl">Tasks Done</div><div class="scard-val c-green" style="font-size:var(--fs-3xl);">${stats.tasksDone}/${stats.tasksTotal}</div><div class="scard-sub">today</div></div>
    <div class="scard" style="--scard-c:var(--c-purple)"><div class="scard-ico">⬡</div><div class="scard-lbl">Roadmap</div><div class="scard-val c-purple" style="font-size:var(--fs-3xl);">${stats.rmOverall}%</div><div class="scard-sub">overall</div></div>
  </div>

  <!-- Weekly focus chart + right panel -->
  <div class="g2-1 mb-5">
    <div class="gcol">
      <!-- Weekly Focus Chart -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 style="font-size:var(--fs-md)">Weekly Focus</h3>
          <span class="mono text-2xs t3">${stats.weeklyFocus?.reduce((s,d)=>s+d.minutes,0)||0} min total</span>
        </div>
        <div id="week-chart" style="display:flex;align-items:flex-end;gap:6px;height:80px;">
          ${(stats.weeklyFocus||[]).map(d => {
            const max = Math.max(...(stats.weeklyFocus||[]).map(x=>x.minutes), 1);
            const h = Math.round((d.minutes/max)*100);
            const isToday = d.date === today();
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
              <div style="width:100%;height:${Math.max(h,4)}%;border-radius:3px 3px 0 0;background:${isToday?'var(--c-blue)':'var(--c-bg4)'};transition:height .4s;min-height:4px;" title="${d.minutes}m"></div>
              <span class="mono text-2xs ${isToday?'c-blue':'t3'}">${dayLbl(d.date)}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Today's Tasks -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 style="font-size:var(--fs-md)">Today's Priorities</h3>
          <a href="/planner" class="btn btn-ghost btn-sm">Full Planner →</a>
        </div>
        <div id="tasks-list">${renderTasksMini(tasks)}</div>
        <div class="flex gap-2 mt-4">
          <input id="qt" placeholder="Quick add task..." style="flex:1;" onkeydown="if(event.key==='Enter')quickAdd()">
          <select id="qc" style="width:82px;"><option value="cyber">CYBER</option><option value="uni">UNI</option><option value="general" selected>GEN</option></select>
          <button class="btn btn-primary btn-sm" onclick="quickAdd()">+ Add</button>
        </div>
      </div>

      <!-- Habits mini -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 style="font-size:var(--fs-md)">Habits This Week</h3>
          <a href="/habits" class="btn btn-ghost btn-sm">All →</a>
        </div>
        <div id="habits-mini">${renderHabitsMini(habits)}</div>
      </div>
    </div>

    <!-- Right sidebar -->
    <div class="gcol">
      <button class="btn btn-red w-full" style="padding:14px;font-size:var(--fs-sm);" onclick="emergency()">⚡ Emergency Mode</button>

      <!-- Energy -->
      <div class="card">
        <div class="sep">Energy Level</div>
        <div id="ebar-wrap" style="display:flex;gap:5px;margin-bottom:7px;"></div>
        <div class="text-xs t3" id="e-hint">tap to log</div>
      </div>

      <!-- Daily Note -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 style="font-size:var(--fs-md)">Daily Note</h3>
          <span class="text-xs t3 mono" id="note-save-state">●  saved</span>
        </div>
        <textarea id="daily-note" style="width:100%;background:var(--c-bg3);border:1px solid var(--b1);border-radius:var(--r2);color:var(--t1);font-size:var(--fs-sm);padding:10px 12px;font-family:var(--f-body);resize:none;min-height:100px;outline:none;line-height:var(--lh-relaxed);" placeholder="Quick thoughts for today..." oninput="schedDailyNote()"></textarea>
      </div>

      <!-- Recent sessions -->
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 style="font-size:var(--fs-md)">Recent Sessions</h3>
          <a href="/focus" class="btn btn-ghost btn-sm">Focus →</a>
        </div>
        <div id="sessions-list">${renderSessionsMini(sessions)}</div>
      </div>
    </div>
  </div>`;
}

function renderTasksMini(tasks) {
  if (!tasks.length) return '<div class="empty" style="padding:16px 0"><div class="e-ico" style="font-size:24px">☑</div><div class="e-sub">No tasks yet — add below</div></div>';
  return tasks.map(t => `
    <div class="titem ${t.status==='done'?'done':''} p${t.priority} mb-2" onclick="toggleTask(${t.id},'${t.status}')">
      <div class="tchk">${t.status==='done'?'✓':''}</div>
      <div class="tbody">
        <div class="ttext">${esc(t.text)}</div>
        <div class="tmeta"><span class="badge ${CC[t.category]||'b-gray'}">${t.category.toUpperCase()}</span>${t.due_date?`<span class="text-2xs t3 mono">${fmtDate(t.due_date)}</span>`:''}</div>
      </div>
    </div>`).join('');
}

function renderHabitsMini(habits) {
  if (!habits.length) return '<span class="text-sm t3">No habits. <a href="/habits">Add →</a></span>';
  return habits.slice(0, 4).map(h => {
    const streak = calcStreak(h.days);
    const colMap = { green:'var(--c-green)', blue:'var(--c-blue)', red:'var(--c-red)', amber:'var(--c-amber)', purple:'var(--c-purple)', cyan:'var(--c-cyan)' };
    const col = colMap[h.color] || colMap.green;
    return `<div class="mb-3">
      <div class="flex justify-between items-center mb-1">
        <span class="text-sm">${esc(h.icon)} ${esc(h.name)}</span>
        ${streak > 0 ? `<span class="mono text-xs" style="color:${col};">${streak}🔥</span>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;">
        ${h.days.map(d => `<div class="hdot ${d.status||''}" onclick="toggleHabit(${h.id},'${d.date}','${d.status||''}',this)" title="${d.date}" style="${d.status==='done'?'background:'+col+'!important;':''}"></div>`).join('')}
      </div>
    </div>`;
  }).join('');
}

function renderSessionsMini(sessions) {
  if (!sessions.length) return '<span class="text-sm t3">No sessions yet today</span>';
  return sessions.map(s => `
    <div class="flex justify-between items-center" style="padding:7px 0;border-bottom:1px solid var(--b0);">
      <span class="text-sm truncate flex-1">${esc(s.topic)}</span>
      <div class="flex gap-2 items-center ml-3 flex-shrink-0">
        <span class="badge b-blue mono">${s.minutes}m</span>
        <span class="text-2xs t3">${fmtDate(s.date)}</span>
      </div>
    </div>`).join('');
}

function initInteractions(stats, tasks, habits, energy, sessions) {
  // Energy bars
  const ebarWrap = $('#ebar-wrap');
  if (ebarWrap) {
    ebarWrap.innerHTML = [1,2,3,4,5].map(l => `
      <div onclick="setEnergy(${l})" data-l="${l}" style="flex:1;height:26px;border-radius:5px;background:rgba(255,255,255,.04);border:1px solid var(--b1);cursor:pointer;transition:all var(--tr-base);" class="ebar4"></div>`
    ).join('');
    if (energy.level) applyEnergy(energy.level);
  }
  // Daily note
  A.get('/api/dashboard/daily-note').then(r => {
    const ta = $('#daily-note'); if (ta) ta.value = r.content || '';
  });
}

let noteTimer = null;
function schedDailyNote() {
  setTxt('#note-save-state', '● unsaved');
  clearTimeout(noteTimer);
  noteTimer = setTimeout(async () => {
    await A.put('/api/dashboard/daily-note', { content: $('#daily-note').value });
    setTxt('#note-save-state', '● saved');
  }, 1500);
}

function applyEnergy(l) {
  $$('.ebar4').forEach(b => {
    const on = +b.dataset.l <= l;
    b.style.background = on ? 'var(--c-amber)' : 'rgba(255,255,255,.04)';
    b.style.borderColor = on ? 'transparent' : 'var(--b1)';
    b.style.boxShadow = on ? '0 0 6px rgba(251,191,36,.3)' : 'none';
  });
  setTxt('#e-hint', ENERGY_HINTS[l] || '');
}

async function setEnergy(l) {
  applyEnergy(l);
  await A.post('/api/energy', { level: l });
  T.ok('Energy logged');
}

async function toggleTask(id, s) {
  await A.put('/api/tasks/' + id, { status: s === 'done' ? 'pending' : 'done' });
  const tasks = await A.get('/api/dashboard/tasks');
  setHtml('#tasks-list', renderTasksMini(tasks));
}

async function quickAdd() {
  const txt = $('#qt').value.trim(); if (!txt) return;
  await A.post('/api/tasks', { text: txt, category: $('#qc').value, priority: 2 });
  $('#qt').value = '';
  const tasks = await A.get('/api/dashboard/tasks');
  setHtml('#tasks-list', renderTasksMini(tasks));
  T.ok('Task added');
}

async function toggleHabit(hid, date, cur, el) {
  const next = cur === 'done' ? null : 'done';
  el.className = 'hdot ' + (next || '');
  await A.post(`/api/habits/${hid}/log`, { status: next, date });
  if (next) T.ok('Habit logged ✓');
}

function emergency() {
  const msgs = ['⚡ اقفل كل حاجة وافتح ملف واحد بس.', '⚡ اعمل 5 دقايق على أول مهمة.', '⚡ Momentum بيبدأ بحركة — ابدأ دلوقتي.', '⚡ مش محتاج motivation — محتاج تبدأ.'];
  T.info(msgs[Math.floor(Math.random() * msgs.length)], 5500);
  $('#qt')?.focus();
}

load();
