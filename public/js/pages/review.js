/* RedCell OS v4 — Weekly Review */
let curRating=3;const ws=getWS();
async function load(){
  await initShell();
  setHtml('#pg',`
  <div class="ph-row"><div class="ph"><h1>Weekly Review</h1><p>Reflect · analyze · plan · improve</p></div>
    <div class="flex gap-2 items-center"><span class="mono text-xs t3 card card-sm" id="wk-d" style="padding:7px 13px;"></span><button class="btn btn-primary" onclick="saveReview()">Save Review</button></div>
  </div>
  <div class="card mb-4"><div class="sep">Weekly Rating</div><div style="display:flex;gap:12px;">${[1,2,3,4,5].map(r=>`<span class="star" data-r="${r}" onclick="setR(${r})" style="font-size:28px;cursor:pointer;opacity:.2;transition:all .15s;">⭐</span>`).join('')}</div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
    <div class="card"><div class="mono text-xs fw-7 c-green tracking mb-3">✓ What Went Well</div><textarea id="r-well" style="width:100%;background:var(--c-bg3);border:1px solid var(--b1);border-radius:var(--r2);color:var(--t1);font-size:var(--fs-sm);padding:12px;font-family:var(--f-body);resize:none;min-height:130px;outline:none;line-height:var(--lh-relaxed);" placeholder="Wins, breakthroughs, proud moments..."></textarea></div>
    <div class="card"><div class="mono text-xs fw-7 c-red tracking mb-3">✗ What Blocked You</div><textarea id="r-block" style="width:100%;background:var(--c-bg3);border:1px solid var(--b1);border-radius:var(--r2);color:var(--t1);font-size:var(--fs-sm);padding:12px;font-family:var(--f-body);resize:none;min-height:130px;outline:none;line-height:var(--lh-relaxed);" placeholder="Obstacles, patterns, distractions..."></textarea></div>
    <div class="card"><div class="mono text-xs fw-7 c-amber tracking mb-3">↑ What to Improve</div><textarea id="r-imp" style="width:100%;background:var(--c-bg3);border:1px solid var(--b1);border-radius:var(--r2);color:var(--t1);font-size:var(--fs-sm);padding:12px;font-family:var(--f-body);resize:none;min-height:130px;outline:none;line-height:var(--lh-relaxed);" placeholder="Systems to fix, habits to strengthen..."></textarea></div>
    <div class="card"><div class="mono text-xs fw-7 c-blue tracking mb-3">→ Next Week's Mission</div><textarea id="r-next" style="width:100%;background:var(--c-bg3);border:1px solid var(--b1);border-radius:var(--r2);color:var(--t1);font-size:var(--fs-sm);padding:12px;font-family:var(--f-body);resize:none;min-height:130px;outline:none;line-height:var(--lh-relaxed);" placeholder="Your #1 priority for next week..."></textarea></div>
  </div>
  <div class="sep">Review History</div>
  <div id="hist"></div>`);
  setTxt('#wk-d','WEEK OF '+ws);setR(3);loadReview();
}
function setR(r){curRating=r;$$('.star').forEach(s=>s.style.opacity=+s.dataset.r<=r?'1':'.2');}
async function loadReview(){
  const r=await A.get('/api/review?week='+ws);
  $('#r-well').value=r.went_well||'';$('#r-block').value=r.blockers||'';$('#r-imp').value=r.improvements||'';$('#r-next').value=r.next_mission||'';setR(r.rating||3);
  const h=await A.get('/api/review/history');
  setHtml('#hist',h.length?h.map(r=>`<div class="card card-sm mb-2 cursor-pointer" onclick="loadWeek('${r.week_start}')">
    <div class="flex justify-between mb-1"><span class="mono text-2xs t3">WEEK OF ${r.week_start}</span><span>${'⭐'.repeat(r.rating||0)}</span></div>
    ${r.next_mission?`<div class="text-sm t2">${esc(r.next_mission.slice(0,90))}${r.next_mission.length>90?'...':''}</div>`:'<div class="text-xs t3">No mission set</div>'}
  </div>`).join(''):'<div class="text-sm t3">No previous reviews yet.</div>');
}
async function loadWeek(w){const r=await A.get('/api/review?week='+w);$('#r-well').value=r.went_well||'';$('#r-block').value=r.blockers||'';$('#r-imp').value=r.improvements||'';$('#r-next').value=r.next_mission||'';setR(r.rating||3);setTxt('#wk-d','WEEK OF '+w);T.info('Loaded week of '+w);}
async function saveReview(){await A.post('/api/review',{week_start:ws,went_well:$('#r-well').value,blockers:$('#r-block').value,improvements:$('#r-imp').value,next_mission:$('#r-next').value,rating:curRating});T.ok('Review saved ✓');loadReview();}
load();
