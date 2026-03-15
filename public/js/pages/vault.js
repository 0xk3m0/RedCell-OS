/* RedCell OS v4 — Notes Vault (Obsidian-style) */

let allCats=[], allNotes=[], curCatFilter=null, curNoteId=null;
let saveNoteTimer=null, catColor='blue', editCatId=null;
const colVars={blue:'var(--c-blue)',red:'var(--c-red)',green:'var(--c-green)',amber:'var(--c-amber)',purple:'var(--c-purple)',cyan:'var(--c-cyan)'};

async function load() {
  await initShell();
  setHtml('#pg', buildLayout());
  await loadCats();
  await loadNotes();
  const q = new URLSearchParams(location.search).get('q');
  if (q) { $('#note-search').value = q; searchNotes(); }
}

function buildLayout() {
  return `
  <div style="display:grid;grid-template-columns:234px 254px 1fr;height:calc(100vh - 54px);overflow:hidden;margin:-24px -26px;">

    <!-- Panel 1: Categories -->
    <div style="background:var(--c-bg1);border-right:1px solid var(--b1);overflow-y:auto;display:flex;flex-direction:column;">
      <div style="padding:12px 12px 10px;border-bottom:1px solid var(--b0);flex-shrink:0;display:flex;align-items:center;justify-content:space-between;">
        <span class="mono text-2xs t3 tracking-wide">CATEGORIES</span>
        <button class="btn btn-blue btn-xs" onclick="openNewCat()">+ New</button>
      </div>
      <div style="padding:8px;" id="cat-tree"></div>
    </div>

    <!-- Panel 2: Note List -->
    <div style="background:var(--c-bg1);border-right:1px solid var(--b1);overflow-y:auto;display:flex;flex-direction:column;">
      <div style="padding:12px 12px 10px;border-bottom:1px solid var(--b0);flex-shrink:0;">
        <div class="search-wrap mb-2"><span class="search-ico">🔍</span><input id="note-search" placeholder="Search notes..." oninput="debounce(searchNotes,300)()" style="background:var(--c-bg2);"></div>
        <div class="flex items-center justify-between">
          <span class="mono text-2xs t3" id="note-count">— notes</span>
          <button class="btn btn-primary btn-xs" onclick="newNote()">+ New</button>
        </div>
      </div>
      <div id="note-list" style="flex:1;overflow-y:auto;"></div>
    </div>

    <!-- Panel 3: Editor -->
    <div style="display:flex;flex-direction:column;overflow:hidden;background:var(--c-bg);" id="editor-panel">
      <div id="editor-empty" style="flex:1;display:flex;align-items:center;justify-content:center;">
        <div class="empty"><div class="e-ico">📓</div><div class="e-ttl">Select a note to edit</div><div class="e-sub">Or create a new one</div></div>
      </div>
      <div id="editor-active" style="display:none;flex:1;flex-direction:column;overflow:hidden;">
        <div style="display:flex;align-items:center;gap:8px;padding:10px 18px;border-bottom:1px solid var(--b1);flex-shrink:0;background:var(--c-bg1);">
          <div id="breadcrumb" class="flex items-center gap-1 flex-1 text-xs t3 flex-wrap"></div>
          <button class="btn btn-ghost btn-xs" onclick="createChildNote()" title="Create sub-page">+ Sub-page</button>
          <button class="btn btn-ghost btn-xs" id="pin-btn" onclick="togglePin()">📌</button>
          <button class="btn btn-ghost btn-xs" onclick="M.open('move-cat')">📂 Move</button>
          <button class="btn btn-red btn-xs" onclick="deleteNote()">Delete</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:22px 28px;" id="editor-body">
          <input id="note-title-in" class="disp fw-8" style="width:100%;font-size:var(--fs-3xl);letter-spacing:-0.025em;background:transparent;border:none;outline:none;color:var(--t1);padding:0;line-height:var(--lh-tight);margin-bottom:12px;" placeholder="Note title..." oninput="schedSave()">
          <div id="note-meta" class="flex gap-2 flex-wrap mb-4 pb-4" style="border-bottom:1px solid var(--b0);"></div>
          <textarea id="note-content-in" style="width:100%;background:transparent;border:none;outline:none;color:var(--t1);font-size:var(--fs-base);font-family:var(--f-body);resize:none;min-height:400px;line-height:var(--lh-loose);" placeholder="Start writing..." oninput="schedSave()"></textarea>
          <div id="children-sec" style="display:none;margin-top:28px;padding-top:20px;border-top:1px solid var(--b0);">
            <div class="sep">Sub-pages</div>
            <div id="children-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-top:10px;"></div>
          </div>
        </div>
        <div style="padding:8px 18px;border-top:1px solid var(--b0);display:flex;gap:12px;align-items:center;font-size:var(--fs-xs);color:var(--t3);font-family:var(--f-mono);flex-shrink:0;background:var(--c-bg1);">
          <span id="ef-saved" class="c-green">●  Saved</span>
          <span id="ef-words">0 words</span>
          <span id="ef-date"></span>
        </div>
      </div>
    </div>
  </div>

  <!-- New Category Modal -->
  <div class="overlay" id="new-cat" style="display:none;">
    <div class="modal">
      <div class="mhd"><span class="mtitle" id="cat-modal-title">New Category</span><button class="mclose" onclick="M.close('new-cat')">✕</button></div>
      <div class="fg"><label>Name</label><input id="cat-name" placeholder="e.g. Web Security"></div>
      <div class="frow mt-3">
        <div class="fg"><label>Icon</label><input id="cat-icon" placeholder="📁" style="text-align:center;font-size:18px;"></div>
        <div class="fg"><label>Color</label><div class="swatches mt-2" id="cat-swatches">${['blue','red','green','amber','purple','cyan'].map((c,i)=>`<div class="swatch swatch-${c} ${i===0?'on':''}" data-c="${c}" onclick="catPickCol(this,'${c}')"></div>`).join('')}</div></div>
      </div>
      <div class="fg mt-3"><label>Parent <span class="t3">(optional)</span></label><select id="cat-parent"><option value="">None (root)</option></select></div>
      <div class="mfoot"><button class="btn btn-ghost" onclick="M.close('new-cat')">Cancel</button><button class="btn btn-primary" onclick="saveCat()">Save</button></div>
    </div>
  </div>

  <!-- Move Category Modal -->
  <div class="overlay" id="move-cat" style="display:none;">
    <div class="modal">
      <div class="mhd"><span class="mtitle">Move Note</span><button class="mclose" onclick="M.close('move-cat')">✕</button></div>
      <div class="fg"><label>Category</label><select id="move-cat-sel"><option value="">Uncategorized</option></select></div>
      <div class="mfoot"><button class="btn btn-ghost" onclick="M.close('move-cat')">Cancel</button><button class="btn btn-primary" onclick="moveNote()">Move</button></div>
    </div>
  </div>`;
}

// ── Categories ───────────────────────────────────────────
function flatCats(cats, depth=0) {
  const r=[];cats.forEach(c=>{r.push({...c,depth});if(c.children?.length)r.push(...flatCats(c.children,depth+1));});return r;
}
async function loadCats() {
  allCats = await A.get('/api/notes/categories');
  renderCatTree(allCats);
  const flat = flatCats(allCats);
  const optHtml = '<option value="">None (root)</option>' + flat.map(c=>`<option value="${c.id}">${'  '.repeat(c.depth||0)}${c.icon} ${esc(c.name)}</option>`).join('');
  setHtml('#cat-parent', optHtml);
  setHtml('#move-cat-sel', '<option value="">Uncategorized</option>' + flat.map(c=>`<option value="${c.id}">${'  '.repeat(c.depth||0)}${c.icon} ${esc(c.name)}</option>`).join(''));
}
function renderCatTree(cats) {
  setHtml('#cat-tree', `
    <div class="flex items-center gap-2 px-2 py-2 mb-1 cursor-pointer rounded" style="border-radius:var(--r1);${curCatFilter===null?'background:rgba(79,142,247,.1);color:var(--c-blue-b);':''}" onclick="selCat(null)">
      <span>📚</span><span class="text-sm fw-6 disp flex-1">All Notes</span>
      <span class="mono text-2xs t3">${allNotes.length}</span>
    </div>
    <div class="flex items-center gap-2 px-2 py-2 mb-2 cursor-pointer rounded" style="border-radius:var(--r1);${curCatFilter==='null'?'background:rgba(79,142,247,.1);color:var(--c-blue-b);':''}" onclick="selCat('null')">
      <span>📄</span><span class="text-sm fw-6 disp flex-1">Uncategorized</span>
    </div>
    ${renderCatItems(cats)}`);
}
function renderCatItems(cats, depth=0) {
  return cats.map(c=>{
    const hasKids = c.children?.length>0;
    const isActive = String(curCatFilter) === String(c.id);
    return `<div style="margin-left:${depth*14}px;">
      <div class="flex items-center gap-1 px-2 py-2 mb-1 cursor-pointer group" style="border-radius:var(--r1);${isActive?'background:rgba(79,142,247,.1);':''}" id="cat-${c.id}">
        ${hasKids?`<span style="color:var(--t3);font-size:10px;width:14px;cursor:pointer;flex-shrink:0;" onclick="toggleCatKids(${c.id},this)">▶</span>`:'<span style="width:14px;flex-shrink:0;"></span>'}
        <span onclick="selCat(${c.id})" style="display:flex;align-items:center;gap:6px;flex:1;min-width:0;">
          <span>${c.icon}</span>
          <span class="text-sm fw-6 disp truncate" style="color:${colVars[c.color]||'inherit'};flex:1;">${esc(c.name)}</span>
          <span class="mono text-2xs t3">${allNotes.filter(n=>n.category_id===c.id).length}</span>
        </span>
        <button class="btn btn-ghost btn-icon xs" style="opacity:0;flex-shrink:0;" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=0" onclick="event.stopPropagation();editCat(${c.id},'${esc(c.name)}','${c.icon}','${c.color}')">✎</button>
        <button class="btn btn-ghost btn-icon xs" style="opacity:0;color:var(--c-red);flex-shrink:0;" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=0" onclick="event.stopPropagation();deleteCat(${c.id})">✕</button>
      </div>
      ${hasKids?`<div id="catk-${c.id}" style="display:none;">${renderCatItems(c.children,depth+1)}</div>`:''}</div>`;
  }).join('');
}
function toggleCatKids(id,btn) { const el=$('#catk-'+id); if(!el)return; const vis=el.style.display!=='none'; el.style.display=vis?'none':'block'; btn.textContent=vis?'▶':'▼'; }
function selCat(id) { curCatFilter=id===null?null:String(id); loadCats().then(()=>loadNotes()); }

function catPickCol(el, c) { $$('#cat-swatches .swatch').forEach(s=>s.classList.remove('on')); el.classList.add('on'); catColor=c; }
function openNewCat() { editCatId=null; setTxt('#cat-modal-title','New Category'); $('#cat-name').value=''; $('#cat-icon').value=''; M.open('new-cat'); }
function editCat(id,name,icon,color) { editCatId=id; setTxt('#cat-modal-title','Edit Category'); $('#cat-name').value=name; $('#cat-icon').value=icon; catColor=color; $$('#cat-swatches .swatch').forEach(s=>s.classList.toggle('on',s.dataset.c===color)); M.open('new-cat'); }
async function saveCat() {
  const name=$('#cat-name').value.trim(); if(!name){T.err('Name required');return;}
  const body={name,icon:$('#cat-icon').value.trim()||'📁',color:catColor,parent_id:$('#cat-parent').value||null};
  if(editCatId){await A.put('/api/notes/categories/'+editCatId,body);T.ok('Category updated');}
  else{await A.post('/api/notes/categories',body);T.ok('Category created');}
  M.close('new-cat'); editCatId=null; $('#cat-name').value=''; await loadCats(); renderCatTree(allCats);
}
async function deleteCat(id) {
  if(!confirm('Delete category? Notes become uncategorized.'))return;
  await A.del('/api/notes/categories/'+id);
  if(String(curCatFilter)===String(id))curCatFilter=null;
  await loadCats(); loadNotes(); T.info('Category deleted');
}

// ── Notes ─────────────────────────────────────────────────
async function loadNotes(extra={}) {
  const params={parent_id:'null'};
  if(curCatFilter!==null)params.category_id=curCatFilter;
  const q=$('#note-search').value.trim(); if(q)params.q=q;
  Object.assign(params,extra);
  allNotes=await A.get('/api/notes?'+new URLSearchParams(params));
  renderNoteList(allNotes);
  renderCatTree(allCats);
}
function renderNoteList(notes) {
  setTxt('#note-count',notes.length+' notes');
  if(!notes.length){setHtml('#note-list','<div class="empty" style="padding:30px 0"><div class="e-ico">📓</div><div class="e-sub">No notes here</div></div>');return;}
  setHtml('#note-list',notes.map(n=>{
    const cat=flatCats(allCats).find(c=>c.id===n.category_id);
    return `<div class="cursor-pointer" style="padding:12px 14px;border-bottom:1px solid var(--b0);transition:background var(--tr-base);${n.id===curNoteId?'background:rgba(79,142,247,.08);border-left:2px solid var(--c-blue);':n.pinned?'border-left:2px solid var(--c-amber);':''}" onclick="openNote(${n.id})" id="nli-${n.id}" onmouseenter="if(this.id!=='nli-${curNoteId}')this.style.background='var(--c-bg2)'" onmouseleave="if(this.id!=='nli-${curNoteId}')this.style.background=''">
      <div class="fw-7 disp text-sm mb-1 truncate">${esc(n.title)}</div>
      <div class="text-xs t3 mb-1 truncate">${esc((n.content||'').slice(0,55))}</div>
      <div class="flex gap-2 items-center">
        ${cat?`<span class="badge b-gray text-2xs" style="font-size:9px;">${cat.icon} ${esc(cat.name)}</span>`:''}
        <span class="mono text-2xs t3">${(n.updated_at||'').slice(0,10)}</span>
        <span class="mono text-2xs t3">${n.word_count||0}w</span>
        ${n.pinned?'<span class="text-2xs c-amber">📌</span>':''}
      </div>
    </div>`;
  }).join(''));
}

async function openNote(id) {
  curNoteId=id;
  $$('[id^="nli-"]').forEach(el=>{el.style.background='';el.style.borderLeft='';});
  const nli=$('#nli-'+id); if(nli){nli.style.background='rgba(79,142,247,.08)';nli.style.borderLeft='2px solid var(--c-blue)';}
  const note=await A.get('/api/notes/'+id);
  $('#editor-empty').style.display='none';
  const ea=$('#editor-active'); ea.style.display='flex'; ea.style.flexDirection='column';
  $('#note-title-in').value=note.title;
  $('#note-content-in').value=note.content||'';
  const cat=flatCats(allCats).find(c=>c.id===note.category_id);
  setHtml('#note-meta',`
    ${cat?`<span class="badge b-gray" style="background:${colVars[cat.color]||'var(--c-bg3)'}22;border-color:${colVars[cat.color]||'var(--b1)'}44;color:${colVars[cat.color]||'var(--t2)'};">${cat.icon} ${esc(cat.name)}</span>`:''}
    ${note.tags?note.tags.split(',').filter(Boolean).map(t=>`<span class="badge b-gray text-xs">${esc(t.trim())}</span>`).join(''):''}
    ${note.pinned?'<span class="badge b-amber">📌</span>':''}`);
  setTxt('#pin-btn', note.pinned ? '📌 Unpin' : '📌 Pin');
  setTxt('#ef-words',(note.word_count||0)+' words');
  setTxt('#ef-date','Updated '+(note.updated_at||'').slice(0,10));
  setTxt('#ef-saved','● Saved');
  await buildBreadcrumb(note);
  if(note.children?.length>0){
    $('#children-sec').style.display='block';
    setHtml('#children-grid',note.children.map(c=>`<div class="card card-sm cursor-pointer" onclick="openNote(${c.id})" style="transition:all var(--tr-base);" onmouseenter="this.style.borderColor='var(--b2)'" onmouseleave="this.style.borderColor='var(--b1)'"><div class="fw-7 disp text-sm mb-1">${esc(c.title)}</div><div class="text-2xs t3">${(c.updated_at||'').slice(0,10)} · ${c.word_count||0}w</div></div>`).join(''));
  } else { $('#children-sec').style.display='none'; }
}

async function buildBreadcrumb(note) {
  const crumbs=[]; let cur=note;
  while(cur.parent_id){try{const p=await A.get('/api/notes/'+cur.parent_id);crumbs.unshift(p);cur=p;}catch{break;}}
  crumbs.push(note);
  setHtml('#breadcrumb',crumbs.map((c,i)=>i===crumbs.length-1?`<span class="t2 fw-6">${esc(c.title)}</span>`:`<span class="c-blue cursor-pointer" onclick="openNote(${c.id})">${esc(c.title)}</span><span class="t4 mx-1">/</span>`).join(''));
}

function schedSave(){
  setTxt('#ef-saved','● Unsaved');
  const words=($('#note-content-in').value||'').trim().split(/\s+/).filter(Boolean).length;
  setTxt('#ef-words',words+' words');
  clearTimeout(saveNoteTimer);
  saveNoteTimer=setTimeout(saveCurrentNote,1200);
}
async function saveCurrentNote(){
  if(!curNoteId)return;
  const title=$('#note-title-in').value.trim()||'Untitled';
  const content=$('#note-content-in').value;
  await A.put('/api/notes/'+curNoteId,{title,content});
  setTxt('#ef-saved','● Saved');
  const nli=$('#nli-'+curNoteId); if(nli){const t=nli.querySelector('.fw-7');if(t)t.textContent=title;}
}
async function newNote(){
  const n=await A.post('/api/notes',{title:'New Note',content:'',category_id:curCatFilter&&curCatFilter!=='null'?curCatFilter:null,parent_id:null});
  await loadNotes(); openNote(n.id); setTimeout(()=>$('#note-title-in')?.select(),100);
}
async function createChildNote(){if(!curNoteId)return;const n=await A.post('/api/notes',{title:'Sub-page',content:'',parent_id:curNoteId});T.ok('Sub-page created');openNote(curNoteId);}
async function togglePin(){if(!curNoteId)return;const note=await A.get('/api/notes/'+curNoteId);await A.put('/api/notes/'+curNoteId,{pinned:note.pinned?0:1});T.ok(note.pinned?'Unpinned':'Pinned ✓');loadNotes();openNote(curNoteId);}
async function moveNote(){if(!curNoteId)return;const catId=$('#move-cat-sel').value;await A.put('/api/notes/'+curNoteId,{category_id:catId||null});M.close('move-cat');T.ok('Moved');loadNotes();openNote(curNoteId);}
async function deleteNote(){if(!curNoteId||!confirm('Delete this note?'))return;await A.del('/api/notes/'+curNoteId);curNoteId=null;$('#editor-empty').style.display='flex';$('#editor-active').style.display='none';loadNotes();T.info('Deleted');}
function searchNotes(){loadNotes();}

load();
