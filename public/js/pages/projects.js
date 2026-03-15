/* RedCell OS v4 — Projects Lab */
let allP=[], curP=null, editPId=null, noteTimer=null;
const colMap={blue:'var(--c-blue)',red:'var(--c-red)',green:'var(--c-green)',amber:'var(--c-amber)',purple:'var(--c-purple)',cyan:'var(--c-cyan)'};
const sc={active:'b-blue',planning:'b-amber','on-hold':'b-gray',completed:'b-green'};
const ss={idea:'b-purple',design:'b-cyan',building:'b-blue',testing:'b-amber',done:'b-green'};

async function load(){
  await initShell();
  setHtml('#pg',`
  <div class="ph-row"><div class="ph"><h1>Projects Lab</h1><p>Build · track · ship · portfolio</p></div><button class="btn btn-primary" onclick="M.open('pm')">+ New Project</button></div>
  <div class="tabs mb-5" id="ptabs"><button class="tab on" onclick="setF('all',this)">ALL</button><button class="tab" onclick="setF('active',this)">ACTIVE</button><button class="tab" onclick="setF('planning',this)">PLANNING</button><button class="tab" onclick="setF('completed',this)">COMPLETED</button><button class="tab" onclick="setF('on-hold',this)">ON HOLD</button></div>
  <div style="display:grid;grid-template-columns:1fr 360px;gap:20px;">
    <div id="pgrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;align-content:start;">${'<div class="skel" style="height:200px;border-radius:13px;"></div>'.repeat(3)}</div>
    <div id="pdetail"><div class="card" style="text-align:center;padding:40px 20px;"><div style="font-size:32px;opacity:.2;margin-bottom:8px;">◈</div><div class="text-sm t3">Select a project</div></div></div>
  </div>
  <div class="overlay" id="pm" style="display:none;">
    <div class="modal modal-lg">
      <div class="mhd"><span class="mtitle" id="pm-title">New Project</span><button class="mclose" onclick="M.close('pm')">✕</button></div>
      <div class="frow"><div class="fg flex-1"><label>Name</label><input id="pm-name" placeholder="Project name"></div><div class="fg" style="width:120px;"><label>Color</label><select id="pm-col"><option value="blue">🔵 Blue</option><option value="red">🔴 Red</option><option value="green">🟢 Green</option><option value="amber">🟡 Amber</option><option value="purple">🟣 Purple</option><option value="cyan">🩵 Cyan</option></select></div></div>
      <div class="fg mt-3"><label>Description</label><textarea id="pm-desc" style="min-height:70px;"></textarea></div>
      <div class="frow3 mt-3"><div class="fg"><label>Status</label><select id="pm-st"><option value="planning">Planning</option><option value="active">Active</option><option value="on-hold">On Hold</option><option value="completed">Completed</option></select></div><div class="fg"><label>Stage</label><select id="pm-sg"><option value="idea">Idea</option><option value="design">Design</option><option value="building">Building</option><option value="testing">Testing</option><option value="done">Done</option></select></div><div class="fg"><label>Priority</label><select id="pm-pr"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div></div>
      <div class="frow mt-3"><div class="fg flex-1"><label>Tech Stack</label><input id="pm-tech" placeholder="Node.js, SQLite..."></div><div class="fg flex-1"><label>Tags</label><input id="pm-tags" placeholder="pentesting, tools..."></div></div>
      <div class="frow mt-3"><div class="fg flex-1"><label>GitHub URL</label><input id="pm-gh" placeholder="https://github.com/..."></div><div class="fg flex-1"><label>Live URL</label><input id="pm-live" placeholder="https://..."></div></div>
      <div class="frow mt-3"><div class="fg flex-1"><label>Start Date</label><input id="pm-sd" type="date"></div><div class="fg flex-1"><label>Target Date</label><input id="pm-td" type="date"></div></div>
      <div class="mfoot"><button class="btn btn-ghost" onclick="M.close('pm')">Cancel</button><button class="btn btn-primary" id="pm-btn" onclick="saveProject()">Create</button></div>
    </div>
  </div>`);
  loadProjects();
}
let curF='all';
function setF(f,btn){curF=f;$$('.tab').forEach(b=>b.classList.remove('on'));btn.classList.add('on');render();}
async function loadProjects(){allP=await A.get('/api/projects');render();}
function render(){
  const p=curF==='all'?allP:allP.filter(x=>x.status===curF);const g=$('#pgrid');
  if(!p.length){g.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="e-ico">◈</div><div class="e-ttl">No projects</div></div>';return;}
  g.innerHTML=p.map(pr=>{
    const tech=(pr.tech_stack||'').split(',').filter(Boolean);
    return `<div class="card" style="cursor:pointer;border-top:3px solid ${colMap[pr.color]||colMap.blue};padding-top:14px;${pr.id===curP?'border-color:rgba(79,142,247,.35);box-shadow:0 0 0 2px rgba(79,142,247,.12);':''}" onclick="selectP(${pr.id})" id="pc-${pr.id}">
      <div class="flex items-start justify-between mb-2"><div class="fw-8 disp" style="font-size:var(--fs-md);">${esc(pr.name)}</div>${pr.cv_ready?'<span class="badge b-green-s" style="font-size:9px;">CV✓</span>':''}</div>
      <div class="text-sm t2 mb-3" style="line-height:var(--lh-normal);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${esc(pr.description||'')}</div>
      <div class="flex justify-between mb-1"><span class="text-2xs t3 mono">Progress</span><span class="text-2xs mono t3">${pr.progress}%</span></div>
      <div class="pbar h4 mb-3"><div class="pfill ${pr.status==='completed'?'green':''}" style="width:${pr.progress}%;"></div></div>
      <div class="flex gap-2 flex-wrap mb-2"><span class="badge ${sc[pr.status]||'b-gray'}">${pr.status}</span><span class="badge ${ss[pr.stage]||'b-gray'}">${pr.stage}</span></div>
      ${tech.length?`<div class="flex gap-1 flex-wrap">${tech.slice(0,3).map(t=>`<span class="badge b-gray text-2xs">${esc(t.trim())}</span>`).join('')}</div>`:''}
    </div>`;
  }).join('');
}
async function selectP(id){
  curP=id;$$('[id^="pc-"]').forEach(el=>el.style.cssText=el.style.cssText.replace(/border-color:[^;]+;box-shadow:[^;]+;/,''));const el=$(`#pc-${id}`);if(el)el.style.cssText+=';border-color:rgba(79,142,247,.35);box-shadow:0 0 0 2px rgba(79,142,247,.12);';
  const proj=await A.get('/api/projects/'+id);renderDetail(proj);
}
function renderDetail(proj){
  const colVal=colMap[proj.color]||colMap.blue;
  setHtml('#pdetail',`<div class="card" style="border-left:3px solid ${colVal};">
    <div class="flex items-center justify-between mb-3">
      <div class="fw-7 disp" style="font-size:var(--fs-lg);">${esc(proj.name)}</div>
      <div class="flex gap-2"><button class="btn btn-ghost btn-sm" onclick="editP(${proj.id})">Edit</button><button class="btn btn-red btn-sm" onclick="delP(${proj.id})">Del</button></div>
    </div>
    <div class="flex gap-2 flex-wrap mb-4"><span class="badge ${sc[proj.status]||'b-gray'}">${proj.status}</span><span class="badge b-gray">${proj.priority} priority</span>${proj.cv_ready?'<span class="badge b-green-s">CV Ready</span>':''}</div>
    <div class="flex justify-between mb-1"><span class="text-xs t3 mono">Progress</span><span class="text-xs mono t3">${proj.progress}%</span></div>
    <div class="pbar h6 mb-2"><div class="pfill ${proj.status==='completed'?'green':''}" style="width:${proj.progress}%"></div></div>
    <input type="range" min="0" max="100" value="${proj.progress}" style="-webkit-appearance:none;width:100%;height:4px;background:var(--b1);border-radius:2px;cursor:pointer;outline:none;margin-bottom:12px;" onchange="updProg(${proj.id},this.value)">
    <div class="flex gap-2 flex-wrap mb-4">${proj.github_url?`<a href="${esc(proj.github_url)}" target="_blank" class="btn btn-ghost btn-sm">GitHub ↗</a>`:''} ${proj.live_url?`<a href="${esc(proj.live_url)}" target="_blank" class="btn btn-blue btn-sm">Live ↗</a>`:''} ${!proj.cv_ready?`<button class="btn btn-green btn-sm" onclick="toggleCV(${proj.id},0)">+ CV Ready</button>`:''}</div>
    ${proj.tech_stack?`<div class="flex gap-1 flex-wrap mb-4">${proj.tech_stack.split(',').filter(Boolean).map(t=>`<span class="badge b-gray">${esc(t.trim())}</span>`).join('')}</div>`:''}
    <div class="sep">Tasks</div>
    <div id="ptasks">${renderPTasks(proj.tasks||[])}</div>
    <div class="flex gap-2 mt-2"><input id="new-pt" placeholder="Add task..." style="flex:1;background:var(--c-bg1);border:1px solid var(--b1);border-radius:var(--r1);color:var(--t1);font-size:var(--fs-sm);padding:7px 11px;outline:none;" onkeydown="if(event.key==='Enter')addPT(${proj.id})"><button class="btn btn-blue btn-sm" onclick="addPT(${proj.id})">+</button></div>
    <div class="sep">Notes</div>
    <textarea id="pnotes" style="width:100%;background:var(--c-bg1);border:1px solid var(--b1);border-radius:var(--r2);color:var(--t1);font-size:var(--fs-sm);padding:10px 12px;font-family:var(--f-body);resize:none;min-height:110px;outline:none;line-height:var(--lh-relaxed);" oninput="schedPN(${proj.id})">${esc(proj.note||'')}</textarea>
  </div>`);
}
function renderPTasks(tasks){if(!tasks.length)return'<div class="text-sm t3 mb-2">No tasks yet</div>';return tasks.map(t=>`<div class="flex items-center gap-2 mb-1 px-2 py-2" style="background:var(--c-bg1);border-radius:var(--r2);"><div style="width:16px;height:16px;border-radius:3px;border:1.5px solid ${t.done?'var(--c-green)':'var(--b3)'};background:${t.done?'var(--c-green)':'transparent'};flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:10px;color:${t.done?'#fff':'transparent'};" onclick="togPT(${curP},${t.id})">${t.done?'✓':''}</div><span class="flex-1 text-sm ${t.done?'opacity-50':''}" style="${t.done?'text-decoration:line-through;':''}">${esc(t.text)}</span><button style="background:transparent;border:none;color:var(--t3);cursor:pointer;font-size:12px;padding:2px;" onclick="delPT(${curP},${t.id})">✕</button></div>`).join('');}
async function updProg(id,v){await A.put('/api/projects/'+id,{progress:parseInt(v)});const card=$('#pc-'+id);if(card){const f=card.querySelector('.pfill');if(f)f.style.width=v+'%';}T.ok('Progress: '+v+'%');}
async function toggleCV(id,cur){await A.put('/api/projects/'+id,{cv_ready:cur?0:1});loadProjects();selectP(id);}
async function delP(id){if(!confirm('Delete project?'))return;await A.del('/api/projects/'+id);curP=null;setHtml('#pdetail','<div class="card" style="text-align:center;padding:40px 20px;"><div style="font-size:32px;opacity:.2;margin-bottom:8px;">◈</div><div class="text-sm t3">Select a project</div></div>');loadProjects();T.info('Deleted');}
async function addPT(pid){const txt=$('#new-pt').value.trim();if(!txt)return;await A.post(`/api/projects/${pid}/tasks`,{text:txt});$('#new-pt').value='';const p=await A.get('/api/projects/'+pid);setHtml('#ptasks',renderPTasks(p.tasks||[]));}
async function togPT(pid,tid){await A.put(`/api/projects/${pid}/tasks/${tid}/toggle`,{});const p=await A.get('/api/projects/'+pid);setHtml('#ptasks',renderPTasks(p.tasks||[]));const card=$('#pc-'+pid);if(card){const f=card.querySelector('.pfill');if(f)f.style.width=p.progress+'%';}}
async function delPT(pid,tid){await A.del(`/api/projects/${pid}/tasks/${tid}`);const p=await A.get('/api/projects/'+pid);setHtml('#ptasks',renderPTasks(p.tasks||[]));}
let pnTimer=null;
function schedPN(pid){clearTimeout(pnTimer);pnTimer=setTimeout(()=>A.put('/api/projects/'+pid+'/note',{content:$('#pnotes').value}).then(()=>T.ok('Notes saved')),1500);}
function editP(id){editPId=id;const p=allP.find(x=>x.id===id);if(!p)return;setTxt('#pm-title','Edit Project');setTxt('#pm-btn','Save');$('#pm-name').value=p.name;$('#pm-desc').value=p.description||'';$('#pm-tech').value=p.tech_stack||'';$('#pm-tags').value=p.tags||'';$('#pm-gh').value=p.github_url||'';$('#pm-live').value=p.live_url||'';$('#pm-st').value=p.status;$('#pm-sg').value=p.stage;$('#pm-pr').value=p.priority||'medium';$('#pm-col').value=p.color||'blue';$('#pm-sd').value=p.start_date||'';$('#pm-td').value=p.target_date||'';M.open('pm');}
async function saveProject(){const name=$('#pm-name').value.trim();if(!name){T.err('Name required');return;}const body={name,description:$('#pm-desc').value,status:$('#pm-st').value,stage:$('#pm-sg').value,priority:$('#pm-pr').value,tags:$('#pm-tags').value,github_url:$('#pm-gh').value,live_url:$('#pm-live').value,tech_stack:$('#pm-tech').value,color:$('#pm-col').value,start_date:$('#pm-sd').value,target_date:$('#pm-td').value};if(editPId){await A.put('/api/projects/'+editPId,body);T.ok('Updated');}else{await A.post('/api/projects',body);T.ok('Created');}M.close('pm');editPId=null;setTxt('#pm-title','New Project');setTxt('#pm-btn','Create');await loadProjects();if(curP)selectP(curP);}
load();
