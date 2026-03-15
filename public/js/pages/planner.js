/* RedCell OS v4 — Daily Planner */

let curDate = new Date(), curFilter = 'all', allTasks = [];
const ds = d => d.toISOString().slice(0, 10);
let tSecs = 25*60, tTotal = 25*60, tRunning = false, tInt = null;

async function load() {
  await initShell();
  setHtml('#pg', buildLayout());
  upDateLbl();
  await Promise.all([loadTasks(), loadEnergy()]);
  initTimer();
}

function buildLayout() {
  return `
  <div class="ph-row">
    <div class="ph"><h1>Daily Planner</h1><p>Tasks · Focus · Energy — all in one</p></div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 272px;gap:20px;">
    <!-- Left: Tasks -->
    <div>
      <!-- Date Nav -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <button class="btn btn-ghost btn-sm" onclick="shiftDay(-1)">◀</button>
        <div id="dlbl" class="disp fw-7 flex-1 text-center" style="font-size:var(--fs-lg);"></div>
        <button class="btn btn-ghost btn-sm" onclick="shiftDay(1)">▶</button>
        <button class="btn btn-ghost btn-xs mono" onclick="goToday()">TODAY</button>
      </div>

      <!-- Filters -->
      <div class="tabs mb-4" id="task-tabs">
        <button class="tab on" onclick="setFilter('all',this)">ALL</button>
        <button class="tab" onclick="setFilter('cyber',this)">CYBER</button>
        <button class="tab" onclick="setFilter('uni',this)">UNI</button>
        <button class="tab" onclick="setFilter('general',this)">GENERAL</button>
        <button class="tab" onclick="setFilter('pending',this)">PENDING</button>
        <button class="tab" onclick="setFilter('done',this)">DONE</button>
      </div>

      <!-- Task List -->
      <div id="task-list"></div>

      <!-- Add Task -->
      <div class="card mt-4">
        <div class="sep">Add Task</div>
        <input id="new-txt" placeholder="Task description..." class="mb-3" onkeydown="if(event.key==='Enter')addTask()">
        <div style="display:flex;gap:8px;">
          <select id="new-cat" style="flex:1"><option value="cyber">CYBER</option><option value="uni">UNI</option><option value="recovery">RECOVERY</option><option value="general" selected>GENERAL</option></select>
          <select id="new-pri" style="width:100px"><option value="1">🔴 HIGH</option><option value="2" selected>🟡 MED</option><option value="3">⬜ LOW</option></select>
          <input id="new-due" type="date" style="width:140px;" title="Due date (optional)">
          <button class="btn btn-primary" onclick="addTask()">+ Add</button>
        </div>
      </div>
    </div>

    <!-- Right: Timer + Stats + Energy -->
    <div class="gcol">
      <!-- Focus Timer -->
      <div class="card">
        <div class="sep">Focus Timer</div>
        <input id="ttopic" placeholder="Working on..." class="mb-3" onkeydown="if(event.key==='Enter'&&!tRunning)tStart()">
        <div id="tdisp" class="mono fw-8 text-center" style="font-size:52px;letter-spacing:.04em;line-height:1;margin:6px 0;transition:color .3s;">25:00</div>
        <div class="pbar h4 mb-3"><div class="pfill blue" id="tbar" style="width:0%"></div></div>
        <div class="flex gap-2 justify-center mb-3">
          <button class="btn btn-ghost btn-sm" onclick="tReset()" title="Reset">↺</button>
          <button id="tbtn" onclick="tToggle()" style="width:52px;height:52px;border-radius:50%;background:var(--c-blue-d);border:none;color:#fff;font-size:22px;cursor:pointer;transition:all .15s;box-shadow:0 0 18px var(--c-blue-glow);">▶</button>
          <button class="btn btn-ghost btn-sm" onclick="tSkip()" title="Log now">⏭</button>
        </div>
        <select id="tdur" style="width:100%;" onchange="tReset()">
          <option value="25">25 min — Pomodoro</option>
          <option value="50">50 min — Deep work</option>
          <option value="90">90 min — Flow state</option>
        </select>
      </div>

      <!-- Today Stats -->
      <div class="card">
        <div class="sep">Today</div>
        <div class="flex flex-col gap-2">
          <div class="flex justify-between items-center text-sm"><span class="t2">Focus time</span><span class="mono c-blue" id="sp-focus">—</span></div>
          <div class="flex justify-between items-center text-sm"><span class="t2">Done</span><span class="mono c-green" id="sp-done">—</span></div>
          <div class="flex justify-between items-center text-sm"><span class="t2">Pending</span><span class="mono c-amber" id="sp-pend">—</span></div>
          <div class="flex justify-between items-center text-sm"><span class="t2">Streak</span><span class="mono c-purple" id="sp-streak">—</span></div>
        </div>
      </div>

      <!-- Energy -->
      <div class="card">
        <div class="sep">Energy Level</div>
        <div style="display:flex;gap:5px;margin-bottom:7px;">
          ${[1,2,3,4,5].map(l=>`<div class="ebar-e flex-1" data-l="${l}" onclick="setEnergy(${l})" style="height:28px;border-radius:5px;background:rgba(255,255,255,.04);border:1px solid var(--b1);cursor:pointer;transition:all var(--tr-base);"></div>`).join('')}
        </div>
        <div class="text-xs t3" id="e-hint2">tap to log</div>
      </div>

      <button class="btn btn-ghost btn-sm w-full" style="color:var(--c-red);border-color:rgba(240,84,84,.2);" onclick="clearDone()">Clear Completed</button>
    </div>
  </div>`;
}

function upDateLbl() {
  const lbl = $('#dlbl'); if (!lbl) return;
  const n = new Date(); n.setHours(0,0,0,0);
  const c = new Date(curDate); c.setHours(0,0,0,0);
  const diff = Math.round((c - n) / 86400000);
  lbl.textContent = diff === 0 ? 'Today' : diff === -1 ? 'Yesterday' : diff === 1 ? 'Tomorrow' :
    curDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function shiftDay(n) { curDate.setDate(curDate.getDate() + n); upDateLbl(); loadTasks(); }
function goToday() { curDate = new Date(); upDateLbl(); loadTasks(); }

function setFilter(f, btn) {
  curFilter = f;
  $$('.tab').forEach(b => b.classList.remove('on')); btn.classList.add('on');
  renderTasks();
}

async function loadTasks() {
  allTasks = await A.get('/api/tasks?date=' + ds(curDate));
  renderTasks(); upStats();
}

function renderTasks() {
  let t = allTasks;
  if (curFilter === 'pending') t = t.filter(x => x.status !== 'done');
  else if (curFilter === 'done') t = t.filter(x => x.status === 'done');
  else if (curFilter !== 'all') t = t.filter(x => x.category === curFilter);

  const sorted = [...t].sort((a, b) => (a.status === 'done') - (b.status === 'done') || a.priority - b.priority);
  const cc = { cyber:'b-red', uni:'b-cyan', recovery:'b-amber', general:'b-gray' };

  if (!sorted.length) { setHtml('#task-list', '<div class="empty" style="padding:20px 0"><div class="e-ico" style="font-size:24px">☑</div><div class="e-sub">No tasks — add one below</div></div>'); return; }

  setHtml('#task-list', sorted.map(t => `
    <div class="titem ${t.status==='done'?'done':''} p${t.priority} mb-2">
      <div class="tchk" onclick="toggle(${t.id},'${t.status}')">${t.status==='done'?'✓':''}</div>
      <div class="tbody">
        <div class="ttext">${esc(t.text)}</div>
        <div class="tmeta">
          <span class="badge ${cc[t.category]||'b-gray'}">${t.category.toUpperCase()}</span>
          ${t.tags ? t.tags.split(',').filter(Boolean).map(tag=>`<span class="badge b-gray">${esc(tag.trim())}</span>`).join('') : ''}
          ${t.due_date ? `<span class="text-2xs t3 mono">${fmtDate(t.due_date)}</span>` : ''}
          ${t.estimated_mins > 0 ? `<span class="text-2xs t3 mono">~${t.estimated_mins}m</span>` : ''}
        </div>
      </div>
      <button class="tdel" onclick="del(${t.id})">✕</button>
    </div>`).join(''));
}

function upStats() {
  const done = allTasks.filter(t => t.status === 'done').length;
  setTxt('#sp-done', done);
  setTxt('#sp-pend', allTasks.length - done);
  A.get('/api/dashboard/stats').then(s => {
    setTxt('#sp-focus', s.focusHours + 'h');
    setTxt('#sp-streak', s.streak + ' days');
  });
}

async function toggle(id, s) { await A.put('/api/tasks/' + id, { status: s === 'done' ? 'pending' : 'done' }); loadTasks(); }
async function del(id) { await A.del('/api/tasks/' + id); loadTasks(); T.info('Deleted'); }
async function addTask() {
  const txt = $('#new-txt').value.trim(); if (!txt) { T.err('Enter task text'); return; }
  await A.post('/api/tasks', { text: txt, category: $('#new-cat').value, priority: +$('#new-pri').value, due_date: $('#new-due').value || null });
  $('#new-txt').value = '';
  loadTasks(); T.ok('Task added');
}
async function clearDone() {
  const d = allTasks.filter(t => t.status === 'done');
  if (!d.length) { T.info('No completed tasks'); return; }
  if (!confirm(`Delete ${d.length} completed task(s)?`)) return;
  await Promise.all(d.map(t => A.del('/api/tasks/' + t.id)));
  loadTasks(); T.ok('Cleared');
}

// ── Energy ──────────────────────────────────────────────
const E_HINTS = ['','خد راحة','مهمة واحدة','شغّل الخطة','طاقة كويسة','🔥 امسح الخطة'];
async function loadEnergy() { const r = await A.get('/api/energy'); if (r.level) applyEnergy(r.level); }
function applyEnergy(l) {
  $$('.ebar-e').forEach(b => {
    const on = +b.dataset.l <= l;
    b.style.background = on ? 'var(--c-amber)' : 'rgba(255,255,255,.04)';
    b.style.borderColor = on ? 'transparent' : 'var(--b1)';
    b.style.boxShadow = on ? '0 0 6px rgba(251,191,36,.25)' : 'none';
  });
  setTxt('#e-hint2', E_HINTS[l] || '');
}
async function setEnergy(l) { applyEnergy(l); await A.post('/api/energy', { level: l }); T.ok('Energy logged'); }

// ── Timer ───────────────────────────────────────────────
function initTimer() { tRender(); }
function tRender() {
  const m = String(Math.floor(tSecs/60)).padStart(2,'0'), s = String(tSecs%60).padStart(2,'0');
  setTxt('#tdisp', m + ':' + s);
  const bar = $('#tbar'); if (bar) bar.style.width = ((tTotal - tSecs) / tTotal * 100) + '%';
}
function tToggle() { tRunning ? tPause() : tStart(); }
function tStart() {
  const topic = $('#ttopic')?.value.trim(); if (!topic) { T.err('Set a topic first'); $('#ttopic')?.focus(); return; }
  tRunning = true;
  const btn = $('#tbtn'); if (btn) { btn.textContent = '⏸'; btn.style.background = 'var(--c-red-d)'; }
  const disp = $('#tdisp'); if (disp) disp.style.color = 'var(--c-blue-b)';
  tInt = setInterval(() => { if (tSecs <= 0) { tDone(); return; } tSecs--; tRender(); }, 1000);
}
function tPause() {
  tRunning = false; clearInterval(tInt);
  const btn = $('#tbtn'); if (btn) { btn.textContent = '▶'; btn.style.background = 'var(--c-blue-d)'; }
  const disp = $('#tdisp'); if (disp) disp.style.color = '';
}
function tReset() {
  tPause();
  tTotal = (+($('#tdur')?.value || 25)) * 60;
  tSecs = tTotal; tRender();
  const bar = $('#tbar'); if (bar) bar.style.width = '0%';
}
async function tDone() {
  tPause();
  const topic = $('#ttopic')?.value.trim() || 'Focus session';
  const mins = Math.round(tTotal / 60);
  await A.post('/api/focus', { topic, minutes: mins });
  T.ok(`✓ ${mins}m session logged!`);
  tReset(); if ($('#ttopic')) $('#ttopic').value = '';
  upStats();
}
async function tSkip() {
  if (!tRunning && tSecs === tTotal) return;
  const done = Math.round((tTotal - tSecs) / 60);
  if (done < 1) { tReset(); return; }
  await A.post('/api/focus', { topic: $('#ttopic')?.value || 'Session', minutes: done });
  T.ok(`${done}m logged`); tReset(); upStats();
}

load();
