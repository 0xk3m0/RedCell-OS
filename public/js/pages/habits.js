/* RedCell OS v4 — Habits & Recovery */

async function load() {
  await initShell();
  setHtml('#pg', buildLayout());
  loadHabits();
}

function buildLayout() {
  return `
  <div class="ph-row">
    <div class="ph"><h1>Habits & Recovery</h1><p>Build discipline one day at a time</p></div>
    <button class="btn btn-primary" onclick="M.open('add-h')">+ Add Habit</button>
  </div>
  <div style="display:grid;grid-template-columns:1fr 280px;gap:20px;">
    <div id="hgrid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;">${'<div class="skel" style="height:200px;border-radius:13px;"></div>'.repeat(4)}</div>
    <div class="gcol">
      <!-- Emergency Protocol -->
      <div class="card card-red">
        <div class="c-red fw-7 mb-2" style="font-size:var(--fs-md);">⚡ Emergency Protocol</div>
        <p class="text-sm mb-4">لما تحس إنك وقعت أو مشتت:</p>
        ${[
          ['01','اقفل الموبايل تماماً'],
          ['02','افتح ملف دراسة واحد بس'],
          ['03','اعمل 5 دقايق فقط'],
          ['04','الانتكاسة مش نهاية — ارجع'],
        ].map(([n,s])=>`<div class="flex items-center gap-3 mb-2" style="padding:9px 12px;background:var(--c-bg3);border-radius:var(--r2);font-size:var(--fs-sm);"><span class="mono c-red text-xs fw-7">${n}</span>${s}</div>`).join('')}
        <button class="btn btn-red w-full mt-3" onclick="T.info('⚡ خد نفس. ارجع للخطة. ابدأ دلوقتي.',5500)">Activate ⚡</button>
      </div>
      <!-- Legend -->
      <div class="card card-sm">
        <div class="sep">Legend</div>
        <div class="flex flex-col gap-2">
          <div class="flex gap-3 items-center"><div style="width:14px;height:14px;border-radius:3px;background:var(--c-green);flex-shrink:0;"></div><span class="text-sm">Done ✓</span></div>
          <div class="flex gap-3 items-center"><div style="width:14px;height:14px;border-radius:3px;background:var(--c-amber);flex-shrink:0;"></div><span class="text-sm">Partial ∼</span></div>
          <div class="flex gap-3 items-center"><div style="width:14px;height:14px;border-radius:3px;background:var(--c-red-d);opacity:.7;flex-shrink:0;"></div><span class="text-sm">Missed ✗</span></div>
          <div class="flex gap-3 items-center"><div style="width:14px;height:14px;border-radius:3px;background:rgba(255,255,255,.04);border:1px solid var(--b1);flex-shrink:0;"></div><span class="text-sm">Not logged</span></div>
        </div>
        <p class="text-xs t3 mt-2">Click to cycle: empty → done → missed → partial</p>
      </div>
    </div>
  </div>

  <!-- Add Habit Modal -->
  <div class="overlay" id="add-h" style="display:none;">
    <div class="modal">
      <div class="mhd"><span class="mtitle" id="h-modal-title">Add Habit</span><button class="mclose" onclick="M.close('add-h')">✕</button></div>
      <div class="fg"><label>Habit Name</label><input id="h-name" placeholder="e.g. Morning walk"></div>
      <div class="frow mt-3">
        <div class="fg"><label>Icon (emoji)</label><input id="h-icon" placeholder="🎯" style="text-align:center;font-size:18px;"></div>
        <div class="fg"><label>Category</label><select id="h-cat"><option value="core">Core</option><option value="health">Health</option><option value="learning">Learning</option><option value="recovery">Recovery</option></select></div>
      </div>
      <div class="fg mt-3"><label>Color</label>
        <div class="swatches mt-2" id="h-swatches">
          ${['green','blue','red','amber','purple','cyan'].map((c,i)=>`<div class="swatch swatch-${c} ${i===0?'on':''}" data-c="${c}" onclick="pickHColor('${c}',this)"></div>`).join('')}
        </div>
      </div>
      <div class="mfoot"><button class="btn btn-ghost" onclick="M.close('add-h')">Cancel</button><button class="btn btn-primary" onclick="saveHabit()">Add Habit</button></div>
    </div>
  </div>`;
}

let hColor = 'green', editingHabitId = null;
function pickHColor(c, el) { $$('#h-swatches .swatch').forEach(s=>s.classList.remove('on')); el.classList.add('on'); hColor=c; }

async function loadHabits() {
  const habits = await A.get('/api/habits');
  renderHabits(habits);
}

function renderHabits(habits) {
  const g = $('#hgrid');
  if (!habits.length) { g.innerHTML = '<div class="empty" style="grid-column:1/-1"><div class="e-ico">◉</div><div class="e-ttl">No habits yet</div><div class="e-sub">Add your first habit</div></div>'; return; }

  const colVars = { green:'var(--c-green)', blue:'var(--c-blue)', red:'var(--c-red)', amber:'var(--c-amber)', purple:'var(--c-purple)', cyan:'var(--c-cyan)' };
  const catBadge = { core:'b-blue', health:'b-green', learning:'b-purple', recovery:'b-red' };
  const dl = habits[0]?.days.map(d => dayLbl(d.date)) || [];

  g.innerHTML = habits.map(h => {
    const col = colVars[h.color] || colVars.green;
    const streak = calcStreak(h.days);
    const done = h.days.filter(d => d.status === 'done').length;
    const rate = Math.round(done / 7 * 100);
    return `
    <div class="card" style="border-top:2px solid ${col};padding-top:14px;">
      <div class="flex items-center gap-2 mb-4">
        <span style="font-size:20px;">${esc(h.icon)}</span>
        <span class="fw-7 disp flex-1" style="font-size:var(--fs-md);">${esc(h.name)}</span>
        <span class="badge ${catBadge[h.category]||'b-gray'}">${h.category}</span>
        <button class="btn btn-ghost btn-icon sm" onclick="editHabit(${h.id},'${esc(h.name)}','${h.icon}','${h.category}','${h.color}')" title="Edit">✎</button>
        <button class="btn btn-ghost btn-icon sm" onclick="delH(${h.id})" title="Delete" style="color:var(--c-red);">✕</button>
      </div>
      <div style="display:flex;justify-content:space-around;margin-bottom:5px;">
        ${dl.map(d => `<span class="mono text-2xs t3">${d}</span>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:14px;">
        ${h.days.map(d => `<div class="hdot ${d.status||''}" data-hid="${h.id}" data-date="${d.date}" data-status="${d.status||''}" onclick="cycleH(${h.id},'${d.date}','${d.status||''}',this)" title="${d.date}" style="min-height:28px;${d.status==='done'?'background:'+col+'!important;':''}" ></div>`).join('')}
      </div>
      <div class="flex" style="border-top:1px solid var(--b0);padding-top:10px;">
        <div class="flex-1 text-center"><div class="fw-7 mono" style="font-size:var(--fs-xl);color:${streak>0?col:'var(--t3)'};">${streak}</div><div class="text-2xs t3">streak</div></div>
        <div class="flex-1 text-center"><div class="fw-7 mono c-green" style="font-size:var(--fs-xl);">${done}</div><div class="text-2xs t3">done</div></div>
        <div class="flex-1 text-center"><div class="fw-7 mono" style="font-size:var(--fs-xl);">${rate}%</div><div class="text-2xs t3">rate</div></div>
      </div>
    </div>`;
  }).join('');
}

const cyc = { '': 'done', 'done': 'missed', 'missed': 'partial', 'partial': '' };
async function cycleH(hid, date, cur, el) {
  const next = cyc[cur] !== undefined ? cyc[cur] : 'done';
  el.dataset.status = next; el.className = 'hdot ' + (next || '');
  await A.post(`/api/habits/${hid}/log`, { status: next || null, date });
  const msgs = { done: '✓ Done', missed: '✗ Missed', partial: '∼ Partial', '': 'Cleared' };
  T.ok(msgs[next] || '');
}
async function delH(id) { if (!confirm('Remove habit?')) return; await A.del('/api/habits/' + id); loadHabits(); T.info('Removed'); }

function editHabit(id, name, icon, cat, color) {
  editingHabitId = id;
  setTxt('#h-modal-title', 'Edit Habit');
  $('#h-name').value = name; $('#h-icon').value = icon; $('#h-cat').value = cat;
  hColor = color; $$('#h-swatches .swatch').forEach(s => s.classList.toggle('on', s.dataset.c === color));
  M.open('add-h');
}
async function saveHabit() {
  const name = $('#h-name').value.trim(); if (!name) { T.err('Name required'); return; }
  const body = { name, icon: $('#h-icon').value.trim() || '◉', category: $('#h-cat').value, color: hColor };
  if (editingHabitId) { await A.put('/api/habits/' + editingHabitId, body); T.ok('Updated'); }
  else { await A.post('/api/habits', body); T.ok('Habit added'); }
  M.close('add-h'); editingHabitId = null;
  $('#h-name').value = ''; $('#h-icon').value = '';
  setTxt('#h-modal-title', 'Add Habit');
  loadHabits();
}

load();
