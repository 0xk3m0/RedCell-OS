/* RedCell OS v4 — Settings (Comprehensive) */

let userData = {};
const ACCENT_COLORS = ['blue','red','green','amber','purple','cyan'];
const COLOR_HEX = { blue:'#4f8ef7', red:'#f05454', green:'#34d399', amber:'#fbbf24', purple:'#c084fc', cyan:'#22d3ee' };
const TIMEZONES = ['Africa/Cairo','UTC','America/New_York','America/Los_Angeles','Europe/London','Europe/Berlin','Asia/Dubai','Asia/Tokyo'];

async function load() {
  await initShell();
  const [user, stats] = await Promise.all([A.get('/api/settings'), A.get('/api/settings/stats')]);
  userData = user;
  setHtml('#pg', buildPage(user, stats));
  initInteractions(user);
}

function buildPage(user, stats) {
  return `
  <div class="ph-row">
    <div class="ph"><h1>Settings</h1><p>Personalize · configure · manage your RedCell OS</p></div>
  </div>

  <div style="display:grid;grid-template-columns:220px 1fr;gap:24px;align-items:start;">

    <!-- Settings Nav -->
    <div class="card card-flat" style="position:sticky;top:0;">
      <div style="display:flex;flex-direction:column;gap:2px;">
        ${[
          ['profile','👤','Profile & Mission'],
          ['appearance','🎨','Appearance'],
          ['focus','⏱','Focus Settings'],
          ['account','🔐','Account & Security'],
          ['stats','📊','Your Stats'],
          ['danger','⚠️','Danger Zone'],
        ].map(([id,ico,lbl],i)=>`
          <button onclick="showSection('${id}')" id="snav-${id}" class="btn btn-ghost w-full" style="justify-content:flex-start;gap:10px;border:none;padding:10px 12px;border-radius:var(--r2);${i===0?'background:var(--c-blue-dim);color:var(--c-blue-b);':''}" >
            <span>${ico}</span><span>${lbl}</span>
          </button>`).join('')}
      </div>
    </div>

    <!-- Settings Content -->
    <div id="settings-content">
      ${buildProfile(user)}
    </div>
  </div>`;
}

function showSection(id) {
  $$('[id^="snav-"]').forEach(b => { b.style.background=''; b.style.color=''; });
  const btn = $(`#snav-${id}`); if (btn) { btn.style.background='var(--c-blue-dim)'; btn.style.color='var(--c-blue-b)'; }
  const sections = { profile: buildProfile, appearance: buildAppearance, focus: buildFocus, account: buildAccount, stats: ()=>buildStats() };
  if (sections[id]) { setHtml('#settings-content', sections[id](userData)); initSectionInteractions(id); }
  else if (id === 'danger') { setHtml('#settings-content', buildDanger()); }
}

function buildProfile(user) {
  return `
  <div class="card mb-4">
    <div class="flex items-center gap-5 mb-6 pb-5" style="border-bottom:1px solid var(--b1);">
      <div id="avatar-preview" style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--c-blue-d),var(--c-purple-d));display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;font-family:var(--f-disp);flex-shrink:0;">${esc(user.avatar_letter||'K')}</div>
      <div>
        <h4 class="mb-1">${esc(user.username)}</h4>
        <div class="text-sm t3 mb-3">${esc(user.email)}</div>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" onclick="changeAvatar()">Change Letter</button>
        </div>
      </div>
    </div>
    <div class="fg"><label>Mission Statement</label><input id="p-mission" value="${esc(user.mission||'')}" placeholder="Web Penetration Tester" oninput="previewMission(this.value)"></div>
    <div class="fg mt-3"><label>Bio <span class="t3">(optional)</span></label><textarea id="p-bio" placeholder="A short description about yourself..." style="min-height:70px;">${esc(user.bio||'')}</textarea></div>
    <div class="fg mt-3"><label>Timezone</label>
      <select id="p-tz">${TIMEZONES.map(tz=>`<option value="${tz}" ${tz===user.timezone?'selected':''}>${tz}</option>`).join('')}</select>
    </div>
    <button class="btn btn-primary mt-4" onclick="saveProfile()">Save Profile</button>
  </div>`;
}

function buildAppearance(user) {
  return `
  <div class="card mb-4">
    <h4 class="mb-5">Accent Color</h4>
    <p class="text-sm t2 mb-4">Choose your primary accent color — affects nav highlights and interactive elements.</p>
    <div class="swatches mb-4">
      ${ACCENT_COLORS.map(c=>`
        <div class="swatch swatch-${c} ${c===(user.accent_color||'blue')?'on':''}" data-color="${c}" onclick="pickAccent('${c}',this)" title="${c.charAt(0).toUpperCase()+c.slice(1)}"></div>`).join('')}
    </div>
    <div id="accent-preview" class="card card-flat flex items-center gap-3">
      <div class="dot on"></div>
      <span class="text-sm">This is how accent color looks in the UI</span>
      <div class="badge b-blue ml-auto">Sample Badge</div>
    </div>
    <button class="btn btn-primary mt-4" onclick="saveAppearance()">Apply Theme</button>
  </div>`;
}

function buildFocus(user) {
  return `
  <div class="card mb-4">
    <h4 class="mb-5">Focus Configuration</h4>
    <div class="frow mb-4">
      <div class="fg">
        <label>Default Timer Duration</label>
        <select id="f-dur">
          <option value="25" ${user.focus_duration===25?'selected':''}>25 minutes (Pomodoro)</option>
          <option value="50" ${user.focus_duration===50?'selected':''}>50 minutes (Deep work)</option>
          <option value="90" ${user.focus_duration===90?'selected':''}>90 minutes (Flow state)</option>
          <option value="120" ${user.focus_duration===120?'selected':''}>2 hours</option>
        </select>
      </div>
      <div class="fg">
        <label>Daily Focus Target (hours)</label>
        <input id="f-target" type="number" min="1" max="12" value="${user.daily_focus_target||4}" placeholder="4">
      </div>
    </div>
    <div class="card card-flat mb-4">
      <div class="flex items-center justify-between">
        <div><div class="fw-6 mb-1">Sound Notifications</div><div class="text-sm t3">Play a sound when focus session ends</div></div>
        <label class="switch"><input type="checkbox" id="f-sound" ${user.sound_enabled?'checked':''}><span class="switch-track"></span></label>
      </div>
    </div>
    <div class="card card-flat">
      <div class="flex items-center justify-between">
        <div><div class="fw-6 mb-1">Notifications</div><div class="text-sm t3">Enable browser notifications</div></div>
        <label class="switch"><input type="checkbox" id="f-notif" ${user.notifications_enabled?'checked':''}><span class="switch-track"></span></label>
      </div>
    </div>
    <button class="btn btn-primary mt-4" onclick="saveFocus()">Save Focus Settings</button>
  </div>`;
}

function buildAccount(user) {
  return `
  <div class="card mb-4">
    <h4 class="mb-5">Account Information</h4>
    <div class="flex flex-col gap-3 mb-5 pb-5" style="border-bottom:1px solid var(--b1);">
      <div class="flex justify-between items-center"><span class="text-sm t3">Username</span><span class="mono text-sm">${esc(user.username)}</span></div>
      <div class="flex justify-between items-center"><span class="text-sm t3">Email</span><span class="mono text-sm">${esc(user.email)}</span></div>
      <div class="flex justify-between items-center"><span class="text-sm t3">Member since</span><span class="mono text-sm">${(user.created_at||'').slice(0,10)}</span></div>
    </div>
    <h4 class="mb-4">Change Password</h4>
    <div class="fg"><label>Current Password</label><input id="pw-cur" type="password" placeholder="••••••••"></div>
    <div class="fg mt-3"><label>New Password <span class="t3">(min 6 characters)</span></label><input id="pw-new" type="password" placeholder="••••••••"></div>
    <div class="fg mt-3"><label>Confirm New Password</label><input id="pw-confirm" type="password" placeholder="••••••••"></div>
    <button class="btn btn-primary mt-4" onclick="changePassword()">Update Password</button>
  </div>`;
}

async function buildStats() {
  const stats = await A.get('/api/settings/stats');
  return `
  <div class="g2 mb-4">
    <div class="scard" style="--scard-c:var(--c-blue)"><div class="scard-lbl">Focus Hours</div><div class="scard-val c-blue">${stats.focusHours}h</div><div class="scard-sub">total logged</div></div>
    <div class="scard" style="--scard-c:var(--c-green)"><div class="scard-lbl">Tasks Completed</div><div class="scard-val c-green">${stats.tasks}</div><div class="scard-sub">all time</div></div>
    <div class="scard" style="--scard-c:var(--c-amber)"><div class="scard-lbl">Focus Sessions</div><div class="scard-val c-amber">${stats.sessions}</div><div class="scard-sub">total</div></div>
    <div class="scard" style="--scard-c:var(--c-purple)"><div class="scard-lbl">Notes Written</div><div class="scard-val c-purple">${stats.notes}</div><div class="scard-sub">in vault</div></div>
  </div>
  <div class="card">
    <div class="flex items-center gap-4">
      <div style="font-size:36px;">📅</div>
      <div>
        <div class="fw-7 disp" style="font-size:var(--fs-xl);">${stats.memberDays} days</div>
        <div class="text-sm t3">as a RedCell OS operator</div>
      </div>
      <div class="ml-auto text-right">
        <div class="text-sm t2">${stats.habits} habit check-ins</div>
        <div class="text-sm t2">${stats.projects} projects tracked</div>
      </div>
    </div>
  </div>`;
}

function buildDanger() {
  return `
  <div class="card" style="border-color:rgba(240,84,84,.3);background:rgba(240,84,84,.04);">
    <h4 class="c-red mb-3">⚠️ Danger Zone</h4>
    <p class="text-sm mb-5">These actions are permanent and cannot be undone.</p>
    <div class="card card-flat mb-3">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div><div class="fw-6 mb-1">Export Data</div><div class="text-sm t3">Download all your data as JSON</div></div>
        <button class="btn btn-ghost btn-sm" onclick="T.info('Export feature coming soon')">Export</button>
      </div>
    </div>
    <div class="card card-flat mb-3">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div><div class="fw-6 mb-1">Reset All Data</div><div class="text-sm t3">Delete all tasks, habits, notes — keep account</div></div>
        <button class="btn btn-red btn-sm" onclick="T.warn('Reset feature coming soon')">Reset Data</button>
      </div>
    </div>
    <div class="card" style="border-color:rgba(240,84,84,.4);">
      <div class="fw-7 c-red mb-3">Delete Account Permanently</div>
      <p class="text-sm t2 mb-4">This will permanently delete your account and ALL data. This cannot be undone.</p>
      <div class="fg"><label>Enter your password to confirm</label><input id="del-pw" type="password" placeholder="••••••••"></div>
      <button class="btn btn-danger mt-3 w-full" onclick="deleteAccount()">Permanently Delete My Account</button>
    </div>
  </div>`;
}

function initInteractions(user) {
  // Nothing extra needed — sections load on demand
}
function initSectionInteractions(id) {
  if (id === 'stats') { buildStats().then(html => setHtml('#settings-content', html)); }
}

// ── Actions ──────────────────────────────────────────────
function previewMission(val) {
  setTxt('#tb-mission', val || 'Web Penetration Tester');
}

function changeAvatar() {
  const letter = prompt('Enter a letter for your avatar:', userData.avatar_letter || 'K');
  if (!letter || !letter.trim()) return;
  const l = letter.trim()[0].toUpperCase();
  setTxt('#avatar-preview', l);
  setTxt('#sb-user-av', l);
}

let accentColor = '';
function pickAccent(color, el) {
  $$('.swatch').forEach(s => s.classList.remove('on'));
  el.classList.add('on');
  accentColor = color;
  applyAccent(color);
}

async function saveProfile() {
  const avatarPreview = $('#avatar-preview');
  const avatar_letter = avatarPreview?.textContent?.trim()[0]?.toUpperCase() || userData.avatar_letter || 'K';
  await A.put('/api/settings', {
    mission: $('#p-mission').value,
    bio: $('#p-bio').value,
    timezone: $('#p-tz').value,
    avatar_letter,
    focus_duration: userData.focus_duration,
    daily_focus_target: userData.daily_focus_target,
    accent_color: userData.accent_color || 'blue',
  });
  setTxt('#tb-mission', $('#p-mission').value || 'Web Penetration Tester');
  setTxt('#sb-user-av', avatar_letter);
  T.ok('Profile saved ✓');
}

async function saveAppearance() {
  if (!accentColor) { T.warn('Select a color first'); return; }
  await A.put('/api/settings', { ...userData, accent_color: accentColor });
  userData.accent_color = accentColor;
  T.ok('Appearance updated ✓');
}

async function saveFocus() {
  await A.put('/api/settings', {
    ...userData,
    focus_duration: +$('#f-dur').value,
    daily_focus_target: +$('#f-target').value,
    sound_enabled: $('#f-sound').checked ? 1 : 0,
    notifications_enabled: $('#f-notif').checked ? 1 : 0,
  });
  T.ok('Focus settings saved ✓');
}

async function changePassword() {
  const cur = $('#pw-cur').value;
  const nw  = $('#pw-new').value;
  const conf = $('#pw-confirm').value;
  if (!cur || !nw) { T.err('Fill all fields'); return; }
  if (nw.length < 6) { T.err('Password min 6 characters'); return; }
  if (nw !== conf) { T.err('Passwords do not match'); return; }
  try {
    await A.put('/api/settings/password', { current: cur, newPassword: nw });
    T.ok('Password updated ✓');
    $('#pw-cur').value = ''; $('#pw-new').value = ''; $('#pw-confirm').value = '';
  } catch (e) { T.err(e.message); }
}

async function deleteAccount() {
  const pw = $('#del-pw').value;
  if (!pw) { T.err('Enter your password'); return; }
  if (!confirm('Are you absolutely sure? This CANNOT be undone.')) return;
  try {
    await A.del('/api/settings/account', { password: pw });
    location.href = '/login';
  } catch (e) { T.err(e.message); }
}

load();
