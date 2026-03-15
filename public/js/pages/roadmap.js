/* RedCell OS v4 — Cyber Roadmap */

let curMapId = null, curItemId = null, editGrpId = null, editMapId = null, newItemGrpId = null;
let saveTimer = null, noteTimer = null;
const COL = { blue:'var(--c-blue)', red:'var(--c-red)', amber:'var(--c-amber)', purple:'var(--c-purple)', green:'var(--c-green)', cyan:'var(--c-cyan)' };
const TYPE_ICO = { course:'📚', docs:'📄', reference:'📌', tool:'🔧', video:'🎬', book:'📖' };

async function load() {
  await initShell();
  setHtml('#pg', buildLayout());
  const maps = await A.get('/api/roadmap/maps');
  renderMapList(maps);
  if (maps.length) loadMap(maps.find(m => m.is_default) || maps[0]);
  const stats = await A.get('/api/roadmap/stats');
  updateBanner(stats);
}

function buildLayout() {
  return `
  <div style="display:grid;grid-template-columns:244px 1fr;height:calc(100vh - 54px);overflow:hidden;margin:-24px -26px;">

    <!-- Sidebar: Maps -->
    <div style="background:var(--c-bg1);border-right:1px solid var(--b1);overflow-y:auto;display:flex;flex-direction:column;">
      <div style="padding:14px 12px 10px;border-bottom:1px solid var(--b0);flex-shrink:0;">
        <div class="flex items-center justify-between mb-3 px-1">
          <span class="mono text-2xs t3 tracking-wide">ROADMAPS</span>
          <button class="btn btn-blue btn-xs" onclick="openNewMap()">+ New</button>
        </div>
        <div id="map-list">${'<div class="skel" style="height:50px;margin-bottom:6px;"></div>'.repeat(2)}</div>
      </div>
      <!-- Roadmap stats -->
      <div style="padding:14px 12px;flex:1;">
        <div class="sep">Progress</div>
        <div class="flex flex-col gap-2">
          <div class="flex justify-between text-sm"><span class="t3">Completed</span><span class="mono c-green fw-7" id="st-done">—</span></div>
          <div class="flex justify-between text-sm"><span class="t3">In Progress</span><span class="mono c-amber fw-7" id="st-prog">—</span></div>
          <div class="flex justify-between text-sm"><span class="t3">Not Started</span><span class="mono t2 fw-7" id="st-ns">—</span></div>
          <div class="pbar h4 mt-2"><div class="pfill blue" id="st-bar" style="width:0%"></div></div>
          <div class="text-2xs t3 mono text-center" id="st-sub">0 / 0 subtopics done</div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div style="overflow-y:auto;padding:22px 24px;" id="rm-main">
      <!-- Overall Banner -->
      <div id="ov-banner" style="background:linear-gradient(135deg,rgba(79,142,247,.08),rgba(192,132,252,.04));border:1px solid rgba(79,142,247,.2);border-radius:var(--r4);padding:18px 22px;margin-bottom:20px;display:flex;align-items:center;gap:22px;">
        <div class="disp fw-8 c-blue" style="font-size:50px;letter-spacing:-0.03em;line-height:1;flex-shrink:0;" id="ov-pct">0%</div>
        <div style="flex:1;min-width:0;">
          <div class="mono text-2xs t3 tracking-wide mb-2">OVERALL PROGRESS</div>
          <div class="pbar h6"><div class="pfill" id="ov-bar" style="width:0%"></div></div>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <button class="btn btn-blue btn-sm" onclick="addGroup()">+ Group</button>
          <button class="btn btn-ghost btn-sm" onclick="editCurrentMap()">Edit Map</button>
        </div>
      </div>
      <div id="rm-groups"><div class="skel" style="height:180px;"></div></div>
    </div>
  </div>

  <!-- Detail Drawer -->
  <div id="dp-overlay" onclick="closeDetail()" style="position:fixed;inset:0;background:rgba(5,8,15,.7);z-index:500;opacity:0;transition:opacity .2s;pointer-events:none;"></div>
  <div id="dp" style="position:fixed;top:0;right:0;bottom:0;width:500px;background:var(--c-bg2);border-left:1px solid var(--b2);overflow-y:auto;z-index:501;transform:translateX(100%);transition:transform .26s cubic-bezier(.4,0,.2,1);box-shadow:var(--sh4);">
    <div style="padding:18px 22px 14px;border-bottom:1px solid var(--b1);position:sticky;top:0;background:var(--c-bg2);z-index:10;">
      <div class="flex items-center justify-between mb-3">
        <div id="dp-name" class="fw-7 flex-1" style="font-size:var(--fs-md);font-family:var(--f-disp);padding-right:12px;"></div>
        <button onclick="closeDetail()" style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;background:transparent;border:1px solid var(--b1);border-radius:var(--r1);color:var(--t3);cursor:pointer;font-size:16px;transition:all var(--tr-base);">✕</button>
      </div>
      <div id="dp-badges" class="flex gap-2 flex-wrap mb-3"></div>
      <div class="flex justify-between mb-1"><span class="text-xs t3 mono">PROGRESS</span><span class="text-xs mono" id="dp-pct">0%</span></div>
      <input type="range" id="dp-slider" min="0" max="100" value="0" oninput="sliderLive(this)" onchange="saveProgress()" style="-webkit-appearance:none;appearance:none;width:100%;height:5px;border-radius:3px;outline:none;cursor:pointer;background:var(--b1);margin:4px 0;">
    </div>
    <div style="padding:18px 22px;" id="dp-body">
      <div id="dp-desc" class="t2 mb-4" style="font-size:var(--fs-sm);line-height:var(--lh-relaxed);"></div>
      <div id="dp-meta" class="flex gap-2 flex-wrap mb-5"></div>
      <!-- Subtopics -->
      <div class="mb-5">
        <div class="sep">Subtopics Checklist</div>
        <div id="dp-subs"></div>
        <div class="flex gap-2 mt-2">
          <input id="new-sub" placeholder="Add subtopic..." style="flex:1;background:var(--c-bg1);border:1px solid var(--b1);border-radius:var(--r1);color:var(--t1);font-size:var(--fs-sm);padding:7px 11px;outline:none;" onkeydown="if(event.key==='Enter')addSub()">
          <button class="btn btn-blue btn-sm" onclick="addSub()">+ Add</button>
        </div>
      </div>
      <!-- Resources -->
      <div class="mb-5">
        <div class="sep">Resources</div>
        <div id="dp-resources"></div>
        <details class="mt-2" style="cursor:pointer;">
          <summary class="text-sm t3 py-1">+ Add resource</summary>
          <div style="background:var(--c-bg3);border:1px solid var(--b1);border-radius:var(--r2);padding:13px;margin-top:8px;">
            <div class="frow mb-3">
              <div class="fg flex-1"><label>Title</label><input id="res-t" placeholder="Resource name"></div>
              <div class="fg" style="width:110px;"><label>Type</label><select id="res-tp"><option value="course">Course</option><option value="docs">Docs</option><option value="reference">Reference</option><option value="tool">Tool</option><option value="video">Video</option><option value="book">Book</option></select></div>
            </div>
            <div class="fg mb-3"><label>URL</label><input id="res-u" placeholder="https://..."></div>
            <button class="btn btn-blue btn-sm w-full" onclick="addResource()">Add Resource</button>
          </div>
        </details>
      </div>
      <!-- Labs -->
      <div class="mb-5">
        <div class="sep">Labs & Practice</div>
        <div id="dp-labs"></div>
        <details class="mt-2" style="cursor:pointer;">
          <summary class="text-sm t3 py-1">+ Add lab</summary>
          <div style="background:var(--c-bg3);border:1px solid var(--b1);border-radius:var(--r2);padding:13px;margin-top:8px;">
            <div class="frow mb-3">
              <div class="fg flex-1"><label>Lab Title</label><input id="lab-t" placeholder="Lab name"></div>
              <div class="fg" style="width:130px;"><label>Platform</label><input id="lab-p" placeholder="PortSwigger"></div>
            </div>
            <div class="fg mb-3"><label>URL</label><input id="lab-u" placeholder="https://..."></div>
            <button class="btn btn-blue btn-sm w-full" onclick="addLab()">Add Lab</button>
          </div>
        </details>
      </div>
      <!-- Notes -->
      <div class="mb-5">
        <div class="sep">Personal Notes</div>
        <textarea id="dp-notes" style="width:100%;background:var(--c-bg1);border:1px solid var(--b1);border-radius:var(--r2);color:var(--t1);font-size:var(--fs-sm);padding:11px 13px;font-family:var(--f-body);resize:none;min-height:100px;outline:none;line-height:var(--lh-relaxed);" placeholder="Key takeaways, aha moments..." oninput="schedNotes()"></textarea>
        <button class="btn btn-ghost btn-sm mt-2" onclick="saveNotes()">Save Notes</button>
      </div>
      <div class="sep">Actions</div>
      <div class="flex gap-2">
        <button class="btn btn-red btn-sm" onclick="deleteItem()">Delete Topic</button>
      </div>
    </div>
  </div>

  <!-- Map Modal -->
  <div class="overlay" id="map-modal" style="display:none;">
    <div class="modal"><div class="mhd"><span class="mtitle" id="mm-title">New Roadmap</span><button class="mclose" onclick="M.close('map-modal')">✕</button></div>
      <div class="fg"><label>Name</label><input id="mm-name" placeholder="e.g. Web Pentesting Path"></div>
      <div class="fg mt-3"><label>Description</label><input id="mm-desc" placeholder="Short description"></div>
      <div class="frow mt-3">
        <div class="fg"><label>Icon</label><input id="mm-icon" placeholder="⬡" style="text-align:center;font-size:20px;"></div>
        <div class="fg"><label>Color</label><div class="swatches mt-2" id="mm-col">${['blue','red','green','amber','purple','cyan'].map((c,i)=>`<div class="swatch swatch-${c} ${i===0?'on':''}" data-c="${c}" onclick="pickCol('mm',this)"></div>`).join('')}</div></div>
      </div>
      <div class="mfoot"><button class="btn btn-ghost" onclick="M.close('map-modal')">Cancel</button><button class="btn btn-primary" onclick="saveMap()">Save</button></div>
    </div>
  </div>

  <!-- Group Modal -->
  <div class="overlay" id="grp-modal" style="display:none;">
    <div class="modal"><div class="mhd"><span class="mtitle" id="gm-title">New Group</span><button class="mclose" onclick="M.close('grp-modal')">✕</button></div>
      <div class="fg"><label>Group Name</label><input id="gm-name" placeholder="e.g. Web Fundamentals"></div>
      <div class="fg mt-3"><label>Description</label><input id="gm-desc" placeholder="Brief description"></div>
      <div class="frow mt-3">
        <div class="fg"><label>Icon</label><input id="gm-icon" placeholder="🌐" style="text-align:center;font-size:20px;"></div>
        <div class="fg"><label>Color</label><div class="swatches mt-2" id="gm-col">${['blue','red','green','amber','purple','cyan'].map((c,i)=>`<div class="swatch swatch-${c} ${i===0?'on':''}" data-c="${c}" onclick="pickCol('gm',this)"></div>`).join('')}</div></div>
      </div>
      <div class="mfoot"><button class="btn btn-ghost" onclick="M.close('grp-modal');editGrpId=null;">Cancel</button><button class="btn btn-primary" onclick="saveGroup()">Save</button></div>
    </div>
  </div>

  <!-- Item Modal -->
  <div class="overlay" id="item-modal" style="display:none;">
    <div class="modal"><div class="mhd"><span class="mtitle">New Topic</span><button class="mclose" onclick="M.close('item-modal')">✕</button></div>
      <div class="fg"><label>Topic Name</label><input id="im-name" placeholder="e.g. SQL Injection"></div>
      <div class="fg mt-3"><label>Description</label><input id="im-desc" placeholder="Brief description"></div>
      <div class="frow mt-3">
        <div class="fg"><label>Difficulty</label><select id="im-diff"><option value="beginner">Beginner</option><option value="intermediate" selected>Intermediate</option><option value="advanced">Advanced</option></select></div>
        <div class="fg"><label>Estimated Hours</label><input id="im-hrs" type="number" min="1" max="200" placeholder="4"></div>
      </div>
      <div class="fg mt-3"><label>Tags <span class="t3">(comma separated)</span></label><input id="im-tags" placeholder="sql, injection, database"></div>
      <div class="mfoot"><button class="btn btn-ghost" onclick="M.close('item-modal');newItemGrpId=null;">Cancel</button><button class="btn btn-primary" onclick="saveItem()">Add Topic</button></div>
    </div>
  </div>`;
}

let mmCol = 'blue', gmCol = 'blue';
function pickCol(ns, el) {
  $$(`#${ns}-col .swatch`).forEach(s => s.classList.remove('on')); el.classList.add('on');
  if (ns === 'mm') mmCol = el.dataset.c; else gmCol = el.dataset.c;
}

function renderMapList(maps) {
  setHtml('#map-list', maps.map(m => `
    <div class="flex items-center gap-2 px-2 py-2 rounded cursor-pointer mb-1 transition" id="mi-${m.id}" onclick="loadMap(${JSON.stringify(m).replace(/"/g,'&quot;')})" style="border-radius:var(--r2);padding:9px 10px;transition:all var(--tr-base);${m.id===curMapId?'background:rgba(79,142,247,.1);':''}">
      <span style="font-size:17px;">${esc(m.icon)}</span>
      <span class="flex-1 truncate fw-6 text-sm disp">${esc(m.name)}</span>
      <span class="mono text-2xs t3">${m.id===curMapId?'active':''}</span>
    </div>`).join('') + `
    <div class="flex items-center gap-2 px-2 py-2 mb-1 cursor-pointer t3" style="border:1px dashed var(--b2);border-radius:var(--r2);padding:9px 10px;font-size:var(--fs-sm);" onclick="openNewMap()">
      <span>+</span><span>New Roadmap</span>
    </div>`);
}

async function loadMap(map) {
  curMapId = map.id || map;
  $$('[id^="mi-"]').forEach(el => el.style.background = '');
  const mi = $(`#mi-${curMapId}`); if (mi) mi.style.background = 'rgba(79,142,247,.1)';
  const data = await A.get(`/api/roadmap/maps/${curMapId}/data`);
  setTxt('#ov-pct', data.overall + '%'); $('#ov-bar').style.width = data.overall + '%';
  renderGroups(data.groups);
}

function renderGroups(groups) {
  if (!groups.length) { setHtml('#rm-groups', '<div class="empty"><div class="e-ico">⬡</div><div class="e-ttl">No groups yet</div><div class="e-sub">Add the first group to your roadmap</div></div>'); return; }
  setHtml('#rm-groups', groups.map(g => `
    <div class="mb-6" id="grp-${g.id}">
      <div class="flex items-center gap-3 px-4 py-3 rounded mb-3 cursor-pointer" style="border-radius:var(--r3);border:1px solid rgba(${g.color==='blue'?'79,142,247':g.color==='red'?'240,84,84':g.color==='amber'?'251,191,36':g.color==='purple'?'192,132,252':g.color==='green'?'52,211,153':'34,211,238'},.22);background:rgba(${g.color==='blue'?'79,142,247':g.color==='red'?'240,84,84':g.color==='amber'?'251,191,36':g.color==='purple'?'192,132,252':g.color==='green'?'52,211,153':'34,211,238'},.06);" onclick="toggleGrp(${g.id})">
        <span style="font-size:18px;">${esc(g.icon)}</span>
        <span class="mono text-xs fw-7 flex-1 upper tracking">${esc(g.name)}</span>
        <div class="pbar flex-1" style="max-width:160px;"><div class="pfill ${g.color}" style="width:${g.progress}%"></div></div>
        <span class="mono text-sm fw-7" style="color:${COL[g.color]||COL.blue};min-width:36px;text-align:right;">${g.progress}%</span>
        <button class="btn btn-ghost btn-xs ml-2" onclick="event.stopPropagation();editGrpFn(${g.id},'${esc(g.name)}','${g.icon}','${g.color}','${esc(g.description||'')}')">Edit</button>
        <button class="btn btn-blue btn-xs" onclick="event.stopPropagation();openNewItem(${g.id})">+ Topic</button>
        <button class="btn btn-red btn-xs" onclick="event.stopPropagation();deleteGroup(${g.id})">Del</button>
        <span id="chv-${g.id}" style="color:var(--t3);font-size:11px;margin-left:4px;">▼</span>
      </div>
      <div id="gb-${g.id}" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">
        ${g.items.map(item => renderItemCard(item, g.color)).join('')}
      </div>
    </div>`).join('') + `<button class="btn btn-ghost w-full mt-3" style="border-style:dashed;" onclick="addGroup()">+ Add Group</button>`);
}

function toggleGrp(id) {
  const body = $(`#gb-${id}`), chv = $(`#chv-${id}`);
  if (!body) return;
  const closed = body.style.display === 'none';
  body.style.display = closed ? 'grid' : 'none';
  if (chv) chv.textContent = closed ? '▼' : '▶';
}

function renderItemCard(item, color) {
  const statusClass = item.status === 'completed' ? 'opacity-70' : '';
  const statusBadge = item.status === 'completed' ? '<span class="badge b-green-s" style="font-size:9px;">Done</span>' : item.status === 'in-progress' ? '<span class="badge b-amber">Active</span>' : '';
  const doneSubs = item.subtopics.filter(s => s.done).length;
  return `
  <div class="${statusClass}" style="background:var(--c-bg2);border:1px solid var(--b1);border-radius:var(--r3);padding:14px 16px;cursor:pointer;transition:all var(--tr-base);position:relative;overflow:hidden;border-left:3px solid ${COL[color]||COL.blue};" onclick="openDetail(${item.id})" onmouseenter="this.style.borderColor='var(--b2)';this.style.transform='translateY(-1px)'" onmouseleave="this.style.borderColor='var(--b1)';this.style.transform=''" id="ic-${item.id}">
    <div class="fw-7 disp mb-2" style="font-size:var(--fs-sm);line-height:var(--lh-snug);">${esc(item.name)}</div>
    <div class="flex gap-2 flex-wrap mb-2">
      <span class="badge ${item.difficulty==='beginner'?'b-green':item.difficulty==='advanced'?'b-red':'b-amber'}">${item.difficulty}</span>
      <span class="badge b-gray mono">${item.estimated_hours}h</span>
      ${statusBadge}
    </div>
    <div class="flex items-center gap-2 mb-1">
      <div class="pbar flex-1"><div class="pfill ${item.status==='completed'?'green':item.progress>50?'amber':''}" style="width:${item.progress}%"></div></div>
      <span class="mono text-2xs t3 flex-shrink-0">${item.progress}%</span>
    </div>
    <div class="flex gap-3" style="font-size:10px;color:var(--t3);">
      ${item.subtopics.length > 0 ? `<span>☑ ${doneSubs}/${item.subtopics.length}</span>` : ''}
      ${item.resources.length > 0 ? `<span>📚 ${item.resources.length}</span>` : ''}
      ${item.labs.length > 0 ? `<span>🧪 ${item.labs.length}</span>` : ''}
    </div>
  </div>`;
}

async function openDetail(id) {
  curItemId = id;
  const item = await A.get('/api/roadmap/items/' + id);
  setTxt('#dp-name', item.name);
  setHtml('#dp-badges', `<span class="badge ${item.difficulty==='beginner'?'b-green':item.difficulty==='advanced'?'b-red':'b-amber'}">${item.difficulty}</span><span class="badge b-gray mono">${item.estimated_hours}h</span>${item.status==='completed'?'<span class="badge b-green-s">✓ Done</span>':item.status==='in-progress'?'<span class="badge b-amber">In Progress</span>':'<span class="badge b-gray">Not Started</span>'}`);
  const sl = $('#dp-slider'); sl.value = item.progress; setTxt('#dp-pct', item.progress + '%'); sliderBg(sl);
  setTxt('#dp-desc', item.description || '');
  setHtml('#dp-meta', item.tags ? item.tags.split(',').filter(Boolean).map(t => `<span class="badge b-gray">${esc(t.trim())}</span>`).join('') : '');
  renderSubs(item.subtopics); renderRes(item.resources); renderLabs(item.labs);
  $('#dp-notes').value = item.notes || '';
  $('#dp-overlay').style.cssText = 'opacity:1;pointer-events:all;';
  $('#dp').style.transform = 'translateX(0)';
}
function closeDetail() { $('#dp-overlay').style.cssText = 'opacity:0;pointer-events:none;'; $('#dp').style.transform = 'translateX(100%)'; curItemId = null; }

function sliderLive(el) { setTxt('#dp-pct', el.value + '%'); sliderBg(el); }
function sliderBg(el) { el.style.background = `linear-gradient(to right,var(--c-blue) ${el.value}%,var(--b1) ${el.value}%)`; }
function saveProgress() {
  clearTimeout(saveTimer); saveTimer = setTimeout(async () => {
    const prog = parseInt($('#dp-slider').value);
    const res = await A.put('/api/roadmap/items/' + curItemId, { progress: prog });
    T.ok('Progress: ' + prog + '%');
    const card = $(`#ic-${curItemId}`);
    if (card) { const fill = card.querySelector('.pfill'); if (fill) fill.style.width = prog + '%'; }
    const stats = await A.get('/api/roadmap/stats'); updateBanner(stats);
    const data = await A.get(`/api/roadmap/maps/${curMapId}/data`);
    setTxt('#ov-pct', data.overall + '%'); $('#ov-bar').style.width = data.overall + '%';
  }, 500);
}

function renderSubs(subs) {
  if (!subs.length) { setHtml('#dp-subs', '<div class="text-sm t3">No subtopics yet.</div>'); return; }
  const done = subs.filter(s => s.done).length;
  setHtml('#dp-subs', `<div class="flex justify-between mb-2"><span class="text-xs t3 mono">${done}/${subs.length} done</span><div class="pbar" style="width:100px;height:4px;"><div class="pfill green" style="width:${Math.round(done/subs.length*100)}%"></div></div></div>` +
    subs.map(s => `<div class="flex items-center gap-2 mb-1" style="padding:8px 10px;background:var(--c-bg1);border:1px solid var(--b0);border-radius:var(--r2);${s.done?'opacity:.6;':''}" id="si-${s.id}">
      <div style="width:16px;height:16px;border-radius:3px;border:1.5px solid ${s.done?'var(--c-green)':'var(--b3)'};background:${s.done?'var(--c-green)':'transparent'};flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;color:${s.done?'#fff':'transparent'};" onclick="toggleSub(${s.id})">${s.done?'✓':''}</div>
      <span class="flex-1 text-sm" style="${s.done?'text-decoration:line-through;':''}">${esc(s.name)}</span>
      <button style="opacity:0;background:transparent;border:none;color:var(--t3);cursor:pointer;font-size:12px;padding:2px 4px;" class="sub-del" onclick="delSub(${s.id})">✕</button>
    </div>`).join(''));
  $$('.sub-del').forEach(b => { b.parentElement.addEventListener('mouseenter', () => b.style.opacity = '1'); b.parentElement.addEventListener('mouseleave', () => b.style.opacity = '0'); });
}
async function toggleSub(id) {
  const res = await A.put('/api/roadmap/subtopics/' + id + '/toggle', {});
  $('#dp-slider').value = res.itemProgress; setTxt('#dp-pct', res.itemProgress + '%'); sliderBg($('#dp-slider'));
  const item = await A.get('/api/roadmap/items/' + curItemId); renderSubs(item.subtopics);
  const card = $(`#ic-${curItemId}`); if (card) { const fill = card.querySelector('.pfill'); if (fill) fill.style.width = res.itemProgress + '%'; }
}
async function addSub() { const n = $('#new-sub').value.trim(); if (!n) return; await A.post('/api/roadmap/items/' + curItemId + '/subtopics', { name: n }); $('#new-sub').value = ''; const item = await A.get('/api/roadmap/items/' + curItemId); renderSubs(item.subtopics); }
async function delSub(id) { await A.del('/api/roadmap/subtopics/' + id); const item = await A.get('/api/roadmap/items/' + curItemId); renderSubs(item.subtopics); }

function renderRes(resources) {
  if (!resources.length) { setHtml('#dp-resources', '<div class="text-sm t3">No resources yet.</div>'); return; }
  setHtml('#dp-resources', resources.map((r, i) => `
    <div class="flex items-center gap-2 mb-1" style="padding:8px 10px;background:var(--c-bg1);border:1px solid var(--b0);border-radius:var(--r2);">
      <span style="font-size:14px;flex-shrink:0;">${TYPE_ICO[r.type]||'🔗'}</span>
      <div class="flex-1 min-w-0"><div class="text-sm fw-6 truncate">${esc(r.title)}</div><div class="text-2xs t3 upper tracking">${r.type}</div></div>
      <a href="${esc(r.url)}" target="_blank" class="btn btn-blue btn-xs" onclick="event.stopPropagation()">Open ↗</a>
      <button style="background:transparent;border:none;color:var(--t3);cursor:pointer;font-size:12px;padding:2px 5px;" onclick="delRes(${i})">✕</button>
    </div>`).join(''));
}
async function addResource() {
  const t = $('#res-t').value.trim(), u = $('#res-u').value.trim(); if (!t || !u) { T.err('Title and URL required'); return; }
  const res = await A.post('/api/roadmap/items/' + curItemId + '/resources', { title: t, url: u, type: $('#res-tp').value });
  $('#res-t').value = ''; $('#res-u').value = ''; renderRes(res.resources); T.ok('Resource added');
}
async function delRes(idx) { const res = await A.del(`/api/roadmap/items/${curItemId}/resources/${idx}`); renderRes(res.resources); }

function renderLabs(labs) {
  if (!labs.length) { setHtml('#dp-labs', '<div class="text-sm t3">No labs yet.</div>'); return; }
  setHtml('#dp-labs', labs.map(l => `
    <div class="flex items-center gap-2 mb-1" style="padding:8px 10px;background:var(--c-bg1);border:1px solid var(--b0);border-radius:var(--r2);">
      <span style="font-size:14px;flex-shrink:0;">🧪</span>
      <div class="flex-1"><div class="text-sm fw-6">${esc(l.title)}</div><div class="text-2xs t3">${esc(l.platform||'External')}</div></div>
      <a href="${esc(l.url)}" target="_blank" class="btn btn-amber btn-xs" onclick="event.stopPropagation()">Open ↗</a>
    </div>`).join(''));
}
async function addLab() {
  const t = $('#lab-t').value.trim(), u = $('#lab-u').value.trim(); if (!t || !u) { T.err('Title and URL required'); return; }
  const res = await A.post('/api/roadmap/items/' + curItemId + '/labs', { title: t, url: u, platform: $('#lab-p').value.trim() || 'External' });
  $('#lab-t').value = ''; $('#lab-u').value = ''; $('#lab-p').value = ''; renderLabs(res.labs); T.ok('Lab added');
}

function schedNotes() { clearTimeout(noteTimer); noteTimer = setTimeout(saveNotes, 1800); }
async function saveNotes() { if (!curItemId) return; await A.put('/api/roadmap/items/' + curItemId, { notes: $('#dp-notes').value }); T.ok('Notes saved'); }
async function deleteItem() { if (!confirm('Delete this topic?')) return; await A.del('/api/roadmap/items/' + curItemId); closeDetail(); loadMap({ id: curMapId }); }

// Map/Group/Item CRUD
function openNewMap() { editMapId = null; setTxt('#mm-title', 'New Roadmap'); $('#mm-name').value = ''; $('#mm-desc').value = ''; $('#mm-icon').value = ''; M.open('map-modal'); }
function editCurrentMap() { editMapId = curMapId; setTxt('#mm-title', 'Edit Roadmap'); M.open('map-modal'); }
async function saveMap() {
  const name = $('#mm-name').value.trim(); if (!name) { T.err('Name required'); return; }
  const body = { name, description: $('#mm-desc').value.trim(), icon: $('#mm-icon').value.trim() || '⬡', color: mmCol };
  if (editMapId) { await A.put('/api/roadmap/maps/' + editMapId, body); T.ok('Map updated'); }
  else { const r = await A.post('/api/roadmap/maps', body); curMapId = r.id; T.ok('Roadmap created'); }
  M.close('map-modal'); editMapId = null;
  const maps = await A.get('/api/roadmap/maps'); renderMapList(maps); loadMap({ id: curMapId });
}

function addGroup() { editGrpId = null; setTxt('#gm-title', 'New Group'); $('#gm-name').value = ''; $('#gm-desc').value = ''; $('#gm-icon').value = ''; M.open('grp-modal'); }
function editGrpFn(id, name, icon, color, desc) { editGrpId = id; setTxt('#gm-title', 'Edit Group'); $('#gm-name').value = name; $('#gm-desc').value = desc; $('#gm-icon').value = icon; gmCol = color; $$('#gm-col .swatch').forEach(s => s.classList.toggle('on', s.dataset.c === color)); M.open('grp-modal'); }
async function saveGroup() {
  const name = $('#gm-name').value.trim(); if (!name) { T.err('Name required'); return; }
  const body = { name, description: $('#gm-desc').value.trim(), icon: $('#gm-icon').value.trim() || '●', color: gmCol };
  if (editGrpId) { await A.put('/api/roadmap/groups/' + editGrpId, body); T.ok('Group updated'); }
  else { await A.post('/api/roadmap/groups', { ...body, map_id: curMapId }); T.ok('Group added'); }
  M.close('grp-modal'); editGrpId = null; loadMap({ id: curMapId });
}
async function deleteGroup(id) { if (!confirm('Delete group and all its topics?')) return; await A.del('/api/roadmap/groups/' + id); loadMap({ id: curMapId }); T.info('Group deleted'); }

function openNewItem(grpId) { newItemGrpId = grpId; $('#im-name').value = ''; $('#im-desc').value = ''; $('#im-tags').value = ''; M.open('item-modal'); }
async function saveItem() {
  const name = $('#im-name').value.trim(); if (!name) { T.err('Name required'); return; }
  await A.post('/api/roadmap/items', { group_id: newItemGrpId, name, description: $('#im-desc').value.trim(), difficulty: $('#im-diff').value, estimated_hours: parseInt($('#im-hrs').value) || 2, tags: $('#im-tags').value.trim() });
  M.close('item-modal'); newItemGrpId = null; loadMap({ id: curMapId }); T.ok('Topic added');
}

function updateBanner(stats) {
  setTxt('#st-done', stats.completed); setTxt('#st-prog', stats.inProgress);
  setTxt('#st-ns', stats.total - stats.completed - stats.inProgress);
  $('#st-bar').style.width = stats.overall + '%';
  setTxt('#st-sub', `${stats.subsDone}/${stats.subsTotal} subtopics done`);
}

load();
