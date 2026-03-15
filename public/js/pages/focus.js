/* RedCell OS v4 — Focus Mode */
let tS=25*60,tT=25*60,running=false,ti=null;
async function load(){
  await initShell();
  setHtml('#pg',`
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:calc(100vh - 54px);gap:22px;text-align:center;padding:20px;">
    <div class="mono text-xs t3 tracking-wide mb-2">FOCUS MODE</div>
    <input id="ftopic" placeholder="What are you working on right now?" style="width:100%;max-width:520px;font-size:var(--fs-md);text-align:center;background:var(--c-bg2);border:1px solid var(--b1);border-radius:var(--r2);color:var(--t1);padding:13px 18px;outline:none;transition:border-color var(--tr-base);" onfocus="this.style.borderColor='rgba(79,142,247,.5)'" onblur="this.style.borderColor='var(--b1)'">
    <div id="ftimer" class="mono fw-8" style="font-size:96px;letter-spacing:.04em;line-height:1;color:var(--t1);transition:all .3s;">25:00</div>
    <div class="pbar" style="width:380px;max-width:90vw;height:5px;"><div class="pfill blue" id="fbar" style="width:0%"></div></div>
    <div style="display:flex;align-items:center;gap:16px;">
      <select id="fdur" style="background:var(--c-bg2);border:1px solid var(--b1);border-radius:var(--r2);color:var(--t2);font-size:var(--fs-sm);padding:9px 12px;cursor:pointer;outline:none;appearance:none;" onchange="fReset()">
        <option value="25">25 min</option><option value="50">50 min</option><option value="90">90 min</option><option value="120">2 hours</option>
      </select>
      <button onclick="fReset()" class="btn btn-ghost" style="width:46px;height:46px;border-radius:50%;padding:0;font-size:18px;" title="Reset">↺</button>
      <button id="fmain" onclick="fToggle()" style="width:72px;height:72px;border-radius:50%;background:var(--c-blue-d);border:none;color:#fff;font-size:24px;cursor:pointer;transition:all .15s;box-shadow:0 0 24px var(--c-blue-glow);">▶</button>
      <button onclick="fSkip()" class="btn btn-ghost" style="width:46px;height:46px;border-radius:50%;padding:0;font-size:18px;" title="Log partial">⏭</button>
      <div style="display:flex;flex-direction:column;gap:5px;align-items:flex-start;">
        <span class="text-2xs t3 mono">Mood</span>
        <select id="fmood" style="background:var(--c-bg2);border:1px solid var(--b1);border-radius:var(--r1);color:var(--t2);font-size:var(--fs-xs);padding:6px 10px;cursor:pointer;outline:none;appearance:none;">
          <option value="3">😐 Neutral</option><option value="5">😄 Great</option><option value="4">🙂 Good</option><option value="2">😕 Low</option><option value="1">😣 Rough</option>
        </select>
      </div>
    </div>
    <div id="fsub" class="t2 fw-5" style="font-size:var(--fs-md);min-height:24px;">Set a topic and press ▶</div>
    <div style="width:100%;max-width:520px;">
      <div class="sep">Today's Sessions</div>
      <div id="slog"></div>
    </div>
  </div>`);
  fRender();loadSessions();
}
function fRender(){const m=String(Math.floor(tS/60)).padStart(2,'0'),s=String(tS%60).padStart(2,'0');setTxt('#ftimer',m+':'+s);const bar=$('#fbar');if(bar)bar.style.width=((tT-tS)/tT*100)+'%';}
function fToggle(){running?fPause():fStart();}
function fStart(){const top=$('#ftopic')?.value.trim();if(!top){T.err('Set a topic');$('#ftopic')?.focus();return;}running=true;const btn=$('#fmain');if(btn){btn.textContent='⏸';btn.style.background='var(--c-red-d)';btn.style.boxShadow='0 0 24px var(--c-red-glow)';}const d=$('#ftimer');if(d){d.style.color='var(--c-blue-b)';d.style.textShadow='0 0 40px rgba(79,142,247,.25)';}setTxt('#fsub',top);ti=setInterval(()=>{if(tS<=0){fDone();return;}tS--;fRender();},1000);}
function fPause(){running=false;clearInterval(ti);const btn=$('#fmain');if(btn){btn.textContent='▶';btn.style.background='var(--c-blue-d)';btn.style.boxShadow='0 0 24px var(--c-blue-glow)';}const d=$('#ftimer');if(d){d.style.color='';d.style.textShadow='';}}
function fReset(){fPause();tT=+(($('#fdur')?.value)||25)*60;tS=tT;fRender();const bar=$('#fbar');if(bar)bar.style.width='0%';setTxt('#fsub','Set a topic and press ▶');}
async function fDone(){fPause();const top=$('#ftopic')?.value.trim()||'Focus session';const mins=Math.round(tT/60);const mood=+($('#fmood')?.value||3);await A.post('/api/focus',{topic:top,minutes:mins,mood});T.ok(`✓ ${mins}m session logged!`);fReset();if($('#ftopic'))$('#ftopic').value='';loadSessions();}
async function fSkip(){if(!running&&tS===tT)return;const done=Math.round((tT-tS)/60);if(done<1){fReset();return;}const mood=+($('#fmood')?.value||3);await A.post('/api/focus',{topic:$('#ftopic')?.value||'Session',minutes:done,mood});T.ok(`${done}m logged`);fReset();loadSessions();}
async function loadSessions(){const s=await A.get('/api/dashboard/focus');const el=$('#slog');if(!el)return;if(!s.length){el.innerHTML='<div class="text-sm t3 text-center">No sessions yet today</div>';return;}el.innerHTML=s.map(x=>`<div class="flex justify-between items-center" style="padding:9px 0;border-bottom:1px solid var(--b0);"><span class="text-sm truncate flex-1">${esc(x.topic)}</span><div class="flex gap-2 items-center" style="margin-left:12px;flex-shrink:0;"><span class="badge b-blue mono">${x.minutes}m</span><span class="text-2xs t3">${fmtDate(x.date)}</span></div></div>`).join('');}
load();
