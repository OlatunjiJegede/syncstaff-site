/* SyncStaff Workspace: all Product modules on one Supabase database */
(function () {
'use strict';
var SB_URL = 'https://vxwusigwwdjbiinjumkp.supabase.co';
var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4d3VzaWd3d2RqYmlpbmp1bWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3MjQwMTcsImV4cCI6MjA5OTMwMDAxN30.HWzLBYPBJm1pmM43PSsbi-X9UFMCxAkvbTZGVC2GiV4';
var FULL_APP = 'https://hrmanagementsystem1.vercel.app';
var sb = window.supabase.createClient(SB_URL, SB_KEY);
var $ = function (s, el) { return (el || document).querySelector(s); };
var user = null, profile = null, role = 'employee', people = [];

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function fmtD(d) { return d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
function pill(s) {
  var map = { draft: 'p-gray', submitted: 'p-amber', manager_approved: 'p-blue', manager_rejected: 'p-rose', approved: 'p-green', rejected: 'p-rose', active: 'p-purple', completed: 'p-green', cancelled: 'p-gray', open: 'p-green', on_hold: 'p-amber', closed: 'p-gray', scheduled: 'p-blue', swap_requested: 'p-amber', applied: 'p-gray', screening: 'p-amber', interview: 'p-blue', offer: 'p-purple', hired: 'p-green', assigned: 'p-amber', in_progress: 'p-blue', done: 'p-green', pending: 'p-amber', signed: 'p-green', declined: 'p-rose', success: 'p-green', failed: 'p-rose', skipped: 'p-gray' };
  return '<span class="pill ' + (map[s] || 'p-gray') + '">' + esc(String(s).replace(/_/g, ' ')) + '</span>';
}
function toast(text, err) {
  var m = $('#toast'); m.textContent = text;
  m.className = 'msg show ' + (err ? 'err' : 'ok');
  m.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:400;box-shadow:0 10px 30px rgba(0,0,0,.15)';
  clearTimeout(m._t); m._t = setTimeout(function () { m.className = 'msg'; }, 3800);
}
function fail(e) { console.error(e); toast((e && e.message) || 'Something went wrong', true); }
function isMgr() { return ['manager', 'hr', 'finance', 'admin'].indexOf(role) >= 0; }
function isHR() { return ['hr', 'admin'].indexOf(role) >= 0; }
function isFin() { return ['finance', 'admin'].indexOf(role) >= 0; }
function personName(id) { var p = people.find(function (x) { return x.id === id; }); return p ? (p.display_name || p.email) : '?'; }
function peopleOptions(sel) {
  return people.map(function (p) { return '<option value="' + p.id + '"' + (p.id === sel ? ' selected' : '') + '>' + esc(p.display_name || p.email) + '</option>'; }).join('');
}
function modal(html) {
  $('#modal').innerHTML = html;
  $('#modal-bg').classList.add('show');
}
function closeModal() { $('#modal-bg').classList.remove('show'); }
window.closeModal = closeModal;

/* ---------- auth ---------- */
function renderLogin(msg) {
  document.body.innerHTML =
  '<div class="auth-wrap"><div class="auth-card">' +
  '<div class="logo" style="display:flex">' + LOGO + '<span><span style="color:#4C1D95">SYNC</span><span style="color:#9333EA">STAFF</span></span></div>' +
  '<h1>Welcome back</h1><p class="sub">Sign in to your workspace. Same account as your SyncStaff HR login.</p>' +
  '<div id="auth-msg" class="msg' + (msg ? ' show err' : '') + '">' + esc(msg || '') + '</div>' +
  '<form id="login-f">' +
  '<div class="field"><label>Email</label><input type="email" id="l-email" required autocomplete="email" placeholder="you@company.com"></div>' +
  '<div class="field"><label>Password</label><input type="password" id="l-pass" required autocomplete="current-password" placeholder="••••••••"></div>' +
  '<button class="btn btn-ink" style="width:100%;justify-content:center" type="submit">Sign in</button>' +
  '</form>' +
  '<p style="text-align:center;font-size:.78rem;color:var(--ink-3);margin-top:16px">No account yet? <a href="' + FULL_APP + '/login" style="color:var(--purple);font-weight:600">Create one here</a> · <a href="index.html" style="color:var(--purple);font-weight:600">Back to site</a></p>' +
  '</div></div>';
  $('#login-f').addEventListener('submit', function (e) {
    e.preventDefault();
    sb.auth.signInWithPassword({ email: $('#l-email').value, password: $('#l-pass').value })
      .then(function (r) { if (r.error) renderLogin(r.error.message); else boot(); });
  });
}

var LOGO = '<svg viewBox="0 0 186 128" width="34" height="24" aria-hidden="true"><defs><linearGradient id="agx" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#A78BFA"/><stop offset="1" stop-color="#7C3AED"/></linearGradient></defs><circle cx="40" cy="24" r="13" fill="#4C1D95"/><path d="M 58 44 A 26 26 0 1 0 59 72" fill="none" stroke="#4C1D95" stroke-width="17" stroke-linecap="round"/><circle cx="106" cy="16" r="13" fill="#9333EA"/><path d="M 88 84 A 23 23 0 1 0 132 92" fill="none" stroke="#4C1D95" stroke-width="16" stroke-linecap="round"/><path d="M 6 110 C 44 86 62 76 86 58 C 108 42 126 32 144 23" fill="none" stroke="url(#agx)" stroke-width="17" stroke-linecap="round"/><path d="M 170 6 L 152 40 L 133 15 Z" fill="#7C3AED"/></svg>';

function ic(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
var I = {
  home: ic('<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
  cal: ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>'),
  clock: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>'),
  users: ic('<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/><circle cx="9" cy="7" r="4"/>'),
  chart: ic('<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>'),
  doc: ic('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>'),
  card: ic('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
  target: ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/>'),
  rocket: ic('<path d="M4.5 16.5L3 21l4.5-1.5M15 3l6 6-9.5 9.5a4 4 0 01-2 1L5 21l1.5-4.5a4 4 0 011-2L17 5z"/>'),
  pen: ic('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>'),
  zap: ic('<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>'),
  grid: ic('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  brief: ic('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>'),
  book: ic('<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>'),
  tree: ic('<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5V12M12 12H5v4.5M12 12h7v4.5"/>'),
  out: ic('<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>'),
};

var ROUTES = [
  { hash: 'dashboard', label: 'Dashboard', icon: 'home', group: 'Workspace' },
  { hash: 'timeoff', label: 'Time Off', icon: 'cal', group: 'Time' },
  { hash: 'timesheets', label: 'Time Tracking', icon: 'clock', group: 'Time' },
  { hash: 'shifts', label: 'Shift Management', icon: 'users', group: 'Time' },
  { hash: 'projects', label: 'Project Tracking', icon: 'target', group: 'Time' },
  { hash: 'onboarding', label: 'Onboarding', icon: 'rocket', group: 'Talent' },
  { hash: 'recruiting', label: 'Talent Acquisition', icon: 'brief', group: 'Talent' },
  { hash: 'performance', label: 'Performance', icon: 'chart', group: 'Talent' },
  { hash: 'training', label: 'Training', icon: 'book', group: 'Talent' },
  { hash: 'goals', label: 'Goals & OKRs', icon: 'target', group: 'Talent' },
  { hash: 'payroll', label: 'Payroll Prep', icon: 'card', group: 'Finance' },
  { hash: 'expenses', label: 'Expenses', icon: 'card', group: 'Finance' },
  { hash: 'esign', label: 'E-Signature', icon: 'pen', group: 'Finance' },
  { hash: 'documents', label: 'Documents', icon: 'doc', group: 'Core HR' },
  { hash: 'org', label: 'Org Chart', icon: 'tree', group: 'Core HR' },
  { hash: 'reports', label: 'Reports & KPIs', icon: 'chart', group: 'Core HR' },
  { hash: 'automations', label: 'Automations', icon: 'zap', group: 'Core HR' },
  { hash: 'integrations', label: 'Integrations', icon: 'grid', group: 'Core HR' },
];

function shell() {
  var groups = {};
  ROUTES.forEach(function (r) { (groups[r.group] = groups[r.group] || []).push(r); });
  var nav = Object.keys(groups).map(function (g) {
    return '<h6>' + g + '</h6>' + groups[g].map(function (r) {
      return '<a href="#/' + r.hash + '" data-r="' + r.hash + '">' + I[r.icon] + r.label + '</a>';
    }).join('');
  }).join('');
  var initials = ((profile && profile.display_name) || user.email).split(/[\s@.]/).slice(0, 2).map(function (x) { return (x[0] || '').toUpperCase(); }).join('');
  document.body.innerHTML =
  '<div class="app"><aside class="side" id="side">' +
  '<a class="logo" href="index.html">' + LOGO + '<span><span style="color:#4C1D95">SYNC</span><span style="color:#9333EA">STAFF</span></span></a>' + nav +
  '<h6>Account</h6><a href="' + FULL_APP + '" target="_blank" rel="noopener">' + I.out + 'Classic HR app</a>' +
  '<a href="#" id="signout">' + I.out + 'Sign out</a>' +
  '</aside><div class="main">' +
  '<div class="topbar"><div style="display:flex;align-items:center;gap:10px">' +
  '<button class="btn btn-line btn-sm mob-toggle" id="mob">Menu</button><h1 id="page-title">Dashboard</h1></div>' +
  '<div class="who"><div style="text-align:right"><b>' + esc((profile && profile.display_name) || user.email) + '</b><div class="role">' + esc(role) + '</div></div><div class="av">' + esc(initials) + '</div></div></div>' +
  '<div id="view"></div></div></div>' +
  '<div class="modal-bg" id="modal-bg"><div class="modal" id="modal"></div></div>' +
  '<div id="toast" class="msg"></div>';
  $('#signout').addEventListener('click', function (e) { e.preventDefault(); sb.auth.signOut().then(function () { location.hash = ''; renderLogin(); }); });
  $('#mob').addEventListener('click', function () { $('#side').classList.toggle('show'); });
  $('#modal-bg').addEventListener('click', function (e) { if (e.target === this) closeModal(); });
  window.addEventListener('hashchange', route);
  route();
}

function setView(title, html) {
  $('#page-title').textContent = title;
  $('#view').innerHTML = html;
  $('#side').classList.remove('show');
  document.querySelectorAll('.side a[data-r]').forEach(function (a) {
    a.classList.toggle('on', '#/' + a.dataset.r === (location.hash || '#/dashboard'));
  });
}
function route() {
  var h = (location.hash || '#/dashboard').replace('#/', '');
  var fn = VIEWS[h] || VIEWS.dashboard;
  fn();
}

/* =============== VIEWS =============== */
var VIEWS = {};

/* ---- dashboard (Employee Portal) ---- */
VIEWS.dashboard = function () {
  setView('Dashboard', '<div class="grid g4" id="kpis"><div class="card kpi"><b>…</b><span>loading</span></div></div>' +
    '<div class="section-head"><h2>My open items</h2></div><div class="card" id="mine"><div class="empty">Loading…</div></div>');
  Promise.all([
    sb.from('leave_requests').select('id,status', { count: 'exact' }).eq('employee_id', user.id),
    sb.from('timesheets').select('id,status,year,month,week_number').eq('employee_id', user.id).order('created_at', { ascending: false }).limit(5),
    sb.from('training_assignments').select('id,status,due_date,training_courses(title)').eq('employee_id', user.id).neq('status', 'done'),
    sb.from('esign_requests').select('id,title,status').eq('signer_id', user.id).eq('status', 'pending'),
    sb.from('goals').select('id,title,progress,status').eq('owner_id', user.id).eq('status', 'active'),
  ]).then(function (r) {
    var leaves = r[0].data || [], ts = r[1].data || [], tr = r[2].data || [], es = r[3].data || [], gl = r[4].data || [];
    $('#kpis').innerHTML =
      '<div class="card kpi"><b>' + leaves.filter(function (x) { return x.status === 'submitted'; }).length + '</b><span>leave requests pending</span></div>' +
      '<div class="card kpi"><b>' + tr.length + '</b><span>training items open</span></div>' +
      '<div class="card kpi"><b>' + es.length + '</b><span>documents to sign</span></div>' +
      '<div class="card kpi"><b>' + gl.length + '</b><span>active goals</span></div>';
    var rows = '';
    es.forEach(function (x) { rows += '<tr><td>' + I.pen + '</td><td>Sign: <b>' + esc(x.title) + '</b></td><td>' + pill('pending') + '</td><td><a class="btn btn-line btn-sm" href="#/esign">Open</a></td></tr>'; });
    tr.forEach(function (x) { rows += '<tr><td>' + I.book + '</td><td>Training: <b>' + esc(x.training_courses ? x.training_courses.title : '') + '</b> ' + (x.due_date ? 'due ' + fmtD(x.due_date) : '') + '</td><td>' + pill(x.status) + '</td><td><a class="btn btn-line btn-sm" href="#/training">Open</a></td></tr>'; });
    ts.filter(function (x) { return x.status === 'draft'; }).forEach(function (x) { rows += '<tr><td>' + I.clock + '</td><td>Timesheet <b>' + x.year + '-' + String(x.month).padStart(2, '0') + (x.week_number ? ' W' + x.week_number : '') + '</b> still draft</td><td>' + pill('draft') + '</td><td><a class="btn btn-line btn-sm" href="#/timesheets">Open</a></td></tr>'; });
    $('#mine').innerHTML = rows ? '<table><tbody>' + rows + '</tbody></table>' : '<div class="empty">Nothing waiting on you. Nice.</div>';
  }).catch(fail);
};

/* ---- Time Off ---- */
VIEWS.timeoff = function () {
  setView('Time Off', '<div class="section-head"><h2>My requests</h2><button class="btn btn-ink btn-sm" id="new-req">+ New request</button></div>' +
    '<div class="card" id="list"><div class="empty">Loading…</div></div>' +
    '<div class="section-head"><h2>My balances</h2></div><div class="grid g3" id="bal"></div>' +
    (isMgr() ? '<div class="section-head"><h2>Approvals inbox</h2></div><div class="card" id="inbox"></div>' : ''));
  function load() {
    sb.from('leave_requests').select('*').eq('employee_id', user.id).order('created_at', { ascending: false }).then(function (r) {
      var rows = (r.data || []).map(function (x) {
        var act = '';
        if (x.status === 'draft') act = '<button class="btn btn-line btn-sm" data-submit="' + x.id + '">Submit</button>';
        return '<tr><td><b>' + esc(x.leave_type) + '</b></td><td>' + fmtD(x.start_date) + ' → ' + fmtD(x.end_date) + '</td><td>' + x.total_hours + 'h</td><td>' + pill(x.status) + '</td><td>' + act + '</td></tr>';
      }).join('');
      $('#list').innerHTML = rows ? '<table><thead><tr><th>Type</th><th>Dates</th><th>Hours</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">No requests yet.</div>';
      document.querySelectorAll('[data-submit]').forEach(function (b) {
        b.addEventListener('click', function () {
          sb.from('leave_requests').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', b.dataset.submit)
            .then(function (r2) { if (r2.error) fail(r2.error); else { toast('Request submitted'); load(); } });
        });
      });
    });
    sb.from('leave_balances').select('*').eq('employee_id', user.id).then(function (r) {
      $('#bal').innerHTML = (r.data || []).length ? r.data.map(function (b) {
        var left = Math.max(0, (b.entitlement_hours || 0) - (b.used_hours || 0));
        return '<div class="card kpi"><b>' + left + 'h</b><span>' + esc(b.leave_type) + ' remaining · ' + b.year + '</span></div>';
      }).join('') : '<div class="card"><div class="empty">No balances configured yet. HR can add entitlements.</div></div>';
    });
    if (isMgr()) sb.from('leave_requests').select('*').in('status', ['submitted', 'manager_approved']).neq('employee_id', user.id).order('submitted_at').then(function (r) {
      var rows = (r.data || []).map(function (x) {
        var acts = '';
        if (x.status === 'submitted') acts = '<button class="btn btn-line btn-sm" data-app="' + x.id + '" data-to="manager_approved">Approve</button> <button class="btn btn-danger btn-sm" data-app="' + x.id + '" data-to="manager_rejected">Reject</button>';
        else if (isHR()) acts = '<button class="btn btn-line btn-sm" data-app="' + x.id + '" data-to="approved">Final approve</button> <button class="btn btn-danger btn-sm" data-app="' + x.id + '" data-to="rejected">Reject</button>';
        return '<tr><td><b>' + esc(personName(x.employee_id)) + '</b></td><td>' + esc(x.leave_type) + '</td><td>' + fmtD(x.start_date) + ' → ' + fmtD(x.end_date) + '</td><td>' + pill(x.status) + '</td><td>' + acts + '</td></tr>';
      }).join('');
      $('#inbox').innerHTML = rows ? '<table><thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">Inbox zero.</div>';
      document.querySelectorAll('[data-app]').forEach(function (b) {
        b.addEventListener('click', function () {
          var upd = { status: b.dataset.to };
          if (b.dataset.to.indexOf('approved') >= 0) upd.approved_at = new Date().toISOString();
          if (b.dataset.to.indexOf('rejected') >= 0) upd.rejected_at = new Date().toISOString();
          sb.from('leave_requests').update(upd).eq('id', b.dataset.app).then(function (r2) { if (r2.error) fail(r2.error); else { toast('Updated'); load(); } });
        });
      });
    });
  }
  $('#new-req').addEventListener('click', function () {
    modal('<h3>New leave request</h3><form id="f">' +
      '<div class="field"><label>Type</label><select id="q-type"><option>Vacation</option><option>Sick</option><option>Compassionate</option><option>Earned Day Off</option><option>Leave Without Pay</option><option>Jury Duty</option></select></div>' +
      '<div class="frow"><div class="field"><label>Start</label><input type="date" id="q-start" required></div><div class="field"><label>End</label><input type="date" id="q-end" required></div></div>' +
      '<div class="frow"><div class="field"><label>Hours per day</label><input type="number" id="q-hpd" value="8" min="1" max="24" step="0.5"></div></div>' +
      '<div class="field"><label>Notes</label><textarea id="q-notes" rows="2"></textarea></div>' +
      '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink" type="submit">Create draft</button></div></form>');
    $('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      var s = new Date($('#q-start').value), en = new Date($('#q-end').value);
      var days = Math.max(1, Math.round((en - s) / 86400000) + 1), hpd = parseFloat($('#q-hpd').value || 8);
      sb.from('leave_requests').insert({ employee_id: user.id, leave_type: $('#q-type').value, start_date: $('#q-start').value, end_date: $('#q-end').value, hours_per_day: hpd, total_hours: days * hpd, employee_notes: $('#q-notes').value || null })
        .then(function (r) { if (r.error) fail(r.error); else { closeModal(); toast('Draft created. Submit it when ready.'); load(); } });
    });
  });
  load();
};

/* ---- Time Tracking ---- */
VIEWS.timesheets = function () {
  setView('Time Tracking', '<div class="msg show" style="display:block;background:var(--blue-soft);color:#1E429F;border:1px solid #A4CAFE">Timesheet entry (weekly grid, billing types, projects) lives in the classic app. This view tracks status and submissions.</div>' +
    '<div class="section-head"><h2>My timesheets</h2><a class="btn btn-ink btn-sm" href="' + FULL_APP + '/timesheets" target="_blank" rel="noopener">Open timesheet editor ↗</a></div>' +
    '<div class="card" id="list"><div class="empty">Loading…</div></div>' +
    (isMgr() ? '<div class="section-head"><h2>Team submissions</h2></div><div class="card" id="team"></div>' : ''));
  sb.from('timesheets').select('*').eq('employee_id', user.id).order('year', { ascending: false }).order('month', { ascending: false }).limit(24).then(function (r) {
    var rows = (r.data || []).map(function (x) {
      return '<tr><td><b>' + x.year + '-' + String(x.month).padStart(2, '0') + '</b>' + (x.week_number ? ' · W' + x.week_number : ' · month') + '</td><td>' + pill(x.status) + '</td><td>' + (x.submitted_at ? fmtD(x.submitted_at.slice(0, 10)) : '') + '</td></tr>';
    }).join('');
    $('#list').innerHTML = rows ? '<table><thead><tr><th>Period</th><th>Status</th><th>Submitted</th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">No timesheets yet. Create one in the editor.</div>';
  });
  if (isMgr()) sb.from('timesheets').select('*').in('status', ['submitted', 'manager_approved']).neq('employee_id', user.id).limit(30).then(function (r) {
    var rows = (r.data || []).map(function (x) {
      return '<tr><td><b>' + esc(personName(x.employee_id)) + '</b></td><td>' + x.year + '-' + String(x.month).padStart(2, '0') + (x.week_number ? ' W' + x.week_number : '') + '</td><td>' + pill(x.status) + '</td><td><a class="btn btn-line btn-sm" href="' + FULL_APP + '/approvals" target="_blank" rel="noopener">Review ↗</a></td></tr>';
    }).join('');
    $('#team').innerHTML = rows ? '<table><tbody>' + rows + '</tbody></table>' : '<div class="empty">No pending team timesheets.</div>';
  });
};

/* ---- Shifts ---- */
VIEWS.shifts = function () {
  setView('Shift Management', '<div class="section-head"><h2>Upcoming shifts</h2>' + (isMgr() ? '<button class="btn btn-ink btn-sm" id="new-shift">+ Schedule shift</button>' : '') + '</div><div class="card" id="list"><div class="empty">Loading…</div></div>');
  function load() {
    var q = sb.from('shifts').select('*').gte('shift_date', new Date(Date.now() - 86400000).toISOString().slice(0, 10)).order('shift_date').order('start_time').limit(60);
    q.then(function (r) {
      var rows = (r.data || []).map(function (x) {
        var acts = '';
        if (x.employee_id === user.id && x.status === 'scheduled') acts = '<button class="btn btn-line btn-sm" data-swap="' + x.id + '">Request swap</button>';
        if (isMgr()) acts += ' <button class="btn btn-danger btn-sm" data-cancel="' + x.id + '">Cancel</button>';
        return '<tr><td><b>' + esc(personName(x.employee_id)) + '</b></td><td>' + fmtD(x.shift_date) + '</td><td>' + x.start_time.slice(0, 5) + '–' + x.end_time.slice(0, 5) + '</td><td>' + esc(x.location || '') + '</td><td>' + pill(x.status) + '</td><td>' + acts + '</td></tr>';
      }).join('');
      $('#list').innerHTML = rows ? '<table><thead><tr><th>Who</th><th>Date</th><th>Time</th><th>Location</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">No shifts scheduled.' + (isMgr() ? ' Create the first one.' : '') + '</div>';
      document.querySelectorAll('[data-swap]').forEach(function (b) { b.addEventListener('click', function () { sb.from('shifts').update({ status: 'swap_requested' }).eq('id', b.dataset.swap).then(function (r2) { if (r2.error) fail(r2.error); else { toast('Swap requested'); load(); } }); }); });
      document.querySelectorAll('[data-cancel]').forEach(function (b) { b.addEventListener('click', function () { sb.from('shifts').update({ status: 'cancelled' }).eq('id', b.dataset.cancel).then(function (r2) { if (r2.error) fail(r2.error); else { toast('Shift cancelled'); load(); } }); }); });
    });
  }
  var ns = $('#new-shift');
  if (ns) ns.addEventListener('click', function () {
    modal('<h3>Schedule shift</h3><form id="f">' +
      '<div class="field"><label>Employee</label><select id="s-emp">' + peopleOptions() + '</select></div>' +
      '<div class="frow"><div class="field"><label>Date</label><input type="date" id="s-date" required></div><div class="field"><label>Location</label><input id="s-loc" placeholder="Main office"></div></div>' +
      '<div class="frow"><div class="field"><label>Start</label><input type="time" id="s-start" value="09:00" required></div><div class="field"><label>End</label><input type="time" id="s-end" value="17:00" required></div></div>' +
      '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Schedule</button></div></form>');
    $('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      sb.from('shifts').insert({ employee_id: $('#s-emp').value, shift_date: $('#s-date').value, start_time: $('#s-start').value, end_time: $('#s-end').value, location: $('#s-loc').value || null, created_by: user.id })
        .then(function (r) { if (r.error) fail(r.error); else { closeModal(); toast('Shift scheduled'); load(); } });
    });
  });
  load();
};

/* ---- Projects ---- */
VIEWS.projects = function () {
  setView('Project Tracking', '<div class="section-head"><h2>Projects</h2>' + (isHR() ? '<button class="btn btn-ink btn-sm" id="new-p">+ New project</button>' : '') + '</div><div class="card" id="plist"><div class="empty">Loading…</div></div>' +
    '<div class="section-head"><h2>My hours by project</h2></div><div class="card" id="mine"><div class="empty">Loading…</div></div>');
  function load() {
    sb.from('projects').select('*').order('code').then(function (r) {
      var rows = (r.data || []).map(function (p) {
        return '<tr><td><b>' + esc(p.code) + '</b></td><td>' + esc(p.title) + '</td><td>' + (p.active ? pill('active') : pill('closed')) + '</td></tr>';
      }).join('');
      $('#plist').innerHTML = rows ? '<table><thead><tr><th>Code</th><th>Title</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">No projects yet.</div>';
    });
    sb.from('timesheet_rows').select('weekly_total,project_id,timesheets!inner(employee_id)').eq('timesheets.employee_id', user.id).then(function (r) {
      var agg = {};
      (r.data || []).forEach(function (row) { if (row.project_id) agg[row.project_id] = (agg[row.project_id] || 0) + parseFloat(row.weekly_total || 0); });
      sb.from('projects').select('id,code,title').then(function (pr) {
        var rows = Object.keys(agg).map(function (pid) {
          var p = (pr.data || []).find(function (x) { return x.id === pid; }) || {};
          return '<tr><td><b>' + esc(p.code || '?') + '</b> ' + esc(p.title || '') + '</td><td>' + agg[pid].toFixed(1) + ' h</td></tr>';
        }).join('');
        $('#mine').innerHTML = rows ? '<table><thead><tr><th>Project</th><th>My hours</th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">No project hours logged yet. Hours come from your timesheets.</div>';
      });
    });
  }
  var np = $('#new-p');
  if (np) np.addEventListener('click', function () {
    modal('<h3>New project</h3><form id="f"><div class="frow"><div class="field"><label>Code</label><input id="p-code" required placeholder="PRJ-001"></div><div class="field"><label>Title</label><input id="p-title" required></div></div>' +
      '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Create</button></div></form>');
    $('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      sb.from('projects').insert({ code: $('#p-code').value, title: $('#p-title').value }).then(function (r) { if (r.error) fail(r.error); else { closeModal(); toast('Project created'); load(); } });
    });
  });
  load();
};

/* ---- Onboarding ---- */
VIEWS.onboarding = function () {
  setView('Onboarding & Offboarding', '<div class="section-head"><h2>Cases</h2>' + (isHR() ? '<button class="btn btn-ink btn-sm" id="new-c">+ Start case</button>' : '') + '</div><div id="cases" class="grid g2"><div class="card"><div class="empty">Loading…</div></div></div>');
  function load() {
    Promise.all([
      sb.from('onboarding_cases').select('*').order('created_at', { ascending: false }),
      sb.from('onboarding_case_tasks').select('*').order('sort_order'),
    ]).then(function (r) {
      var cases = r[0].data || [], tasks = r[1].data || [];
      if (r[0].error) return fail(r[0].error);
      $('#cases').innerHTML = cases.length ? cases.map(function (c) {
        var ct = tasks.filter(function (t) { return t.case_id === c.id; });
        var done = ct.filter(function (t) { return t.done; }).length;
        var pct = ct.length ? Math.round(done / ct.length * 100) : 0;
        var list = ct.map(function (t) {
          return '<tr><td style="width:26px"><input type="checkbox" data-task="' + t.id + '"' + (t.done ? ' checked' : '') + (isHR() || t.assignee_id === user.id ? '' : ' disabled') + '></td>' +
            '<td' + (t.done ? ' style="text-decoration:line-through;color:var(--ink-3)"' : '') + '>' + esc(t.title) + ' <span class="tag-role">' + esc(t.owner_role) + '</span></td><td style="font-size:.74rem;color:var(--ink-3)">' + (t.due_date ? fmtD(t.due_date) : '') + '</td></tr>';
        }).join('');
        return '<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px"><h3 style="margin:0">' + esc(c.person_name) + '</h3>' + pill(c.kind) + '</div>' +
          '<div style="font-size:.78rem;color:var(--ink-3);margin-bottom:10px">' + esc(c.role_title || '') + ' · starts ' + fmtD(c.start_date) + ' · ' + done + '/' + ct.length + ' tasks</div>' +
          '<div class="progress" style="margin-bottom:12px"><i style="width:' + pct + '%"></i></div>' +
          '<table><tbody>' + list + '</tbody></table>' +
          (isHR() && c.status === 'active' && pct === 100 ? '<div style="margin-top:12px"><button class="btn btn-line btn-sm" data-complete="' + c.id + '">Mark case completed</button></div>' : '') + '</div>';
      }).join('') : '<div class="card"><div class="empty">No onboarding or offboarding cases yet.</div></div>';
      document.querySelectorAll('[data-task]').forEach(function (cb) {
        cb.addEventListener('change', function () {
          sb.from('onboarding_case_tasks').update({ done: cb.checked, done_at: cb.checked ? new Date().toISOString() : null }).eq('id', cb.dataset.task)
            .then(function (r2) { if (r2.error) { fail(r2.error); cb.checked = !cb.checked; } else load(); });
        });
      });
      document.querySelectorAll('[data-complete]').forEach(function (b) {
        b.addEventListener('click', function () { sb.from('onboarding_cases').update({ status: 'completed' }).eq('id', b.dataset.complete).then(function () { toast('Case completed 🎉'); load(); }); });
      });
    });
  }
  var nc = $('#new-c');
  if (nc) nc.addEventListener('click', function () {
    sb.from('onboarding_templates').select('*').then(function (r) {
      var opts = (r.data || []).map(function (t) { return '<option value="' + t.id + '" data-kind="' + t.kind + '">' + esc(t.name) + '</option>'; }).join('');
      modal('<h3>Start a case</h3><form id="f">' +
        '<div class="field"><label>Person name</label><input id="c-name" required placeholder="e.g. Riya Patel"></div>' +
        '<div class="frow"><div class="field"><label>Role title</label><input id="c-role" placeholder="Developer"></div><div class="field"><label>Start / exit date</label><input type="date" id="c-date" required></div></div>' +
        '<div class="field"><label>Template</label><select id="c-tpl">' + opts + '</select></div>' +
        '<div class="field"><label>Link to existing employee (optional)</label><select id="c-emp"><option value="">Not an employee yet</option>' + peopleOptions() + '</select></div>' +
        '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Create case</button></div></form>');
      $('#f').addEventListener('submit', function (e) {
        e.preventDefault();
        var tplId = $('#c-tpl').value, kind = $('#c-tpl').selectedOptions[0].dataset.kind, start = $('#c-date').value;
        sb.from('onboarding_cases').insert({ person_name: $('#c-name').value, role_title: $('#c-role').value || null, kind: kind, start_date: start, template_id: tplId, employee_id: $('#c-emp').value || null, created_by: user.id }).select().single()
          .then(function (r1) {
            if (r1.error) return fail(r1.error);
            sb.from('onboarding_template_tasks').select('*').eq('template_id', tplId).order('sort_order').then(function (r2) {
              var rows = (r2.data || []).map(function (t) {
                var due = new Date(start); due.setDate(due.getDate() + t.due_offset_days);
                return { case_id: r1.data.id, title: t.title, owner_role: t.owner_role, due_date: due.toISOString().slice(0, 10), sort_order: t.sort_order };
              });
              (rows.length ? sb.from('onboarding_case_tasks').insert(rows) : Promise.resolve({})).then(function () { closeModal(); toast('Case created with checklist'); load(); });
            });
          });
      });
    });
  });
  load();
};

/* ---- Recruiting ---- */
var STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
VIEWS.recruiting = function () {
  if (!isMgr()) return setView('Talent Acquisition', '<div class="card"><div class="empty">Recruiting is visible to managers, HR, and admins.</div></div>');
  setView('Talent Acquisition', '<div class="section-head"><h2>Open roles</h2><span><button class="btn btn-line btn-sm" id="new-cand">+ Candidate</button> <button class="btn btn-ink btn-sm" id="new-job">+ New role</button></span></div>' +
    '<div class="card" id="jobs"><div class="empty">Loading…</div></div><div class="section-head"><h2>Pipeline</h2></div><div class="kanban" id="kb"></div>');
  function load() {
    Promise.all([sb.from('jobs').select('*').order('created_at', { ascending: false }), sb.from('candidates').select('*').order('created_at')]).then(function (r) {
      var jobs = r[0].data || [], cands = r[1].data || [];
      $('#jobs').innerHTML = jobs.length ? '<table><thead><tr><th>Role</th><th>Department</th><th>Location</th><th>Status</th><th>Candidates</th></tr></thead><tbody>' + jobs.map(function (j) {
        return '<tr><td><b>' + esc(j.title) + '</b></td><td>' + esc(j.department || '') + '</td><td>' + esc(j.location || '') + '</td><td>' + pill(j.status) + '</td><td>' + cands.filter(function (c) { return c.job_id === j.id; }).length + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="empty">No roles yet.</div>';
      $('#kb').innerHTML = STAGES.map(function (st) {
        var cs = cands.filter(function (c) { return c.stage === st; });
        return '<div class="kcol"><h6>' + st.replace('_', ' ') + ' (' + cs.length + ')</h6>' + cs.map(function (c) {
          var j = jobs.find(function (x) { return x.id === c.job_id; }) || {};
          var i = STAGES.indexOf(st);
          var moves = (i > 0 && st !== 'rejected' ? '<button data-move="' + c.id + '" data-to="' + STAGES[i - 1] + '">←</button>' : '') +
            (i < 4 ? '<button data-move="' + c.id + '" data-to="' + STAGES[i + 1] + '">→</button>' : '') +
            (st !== 'rejected' && st !== 'hired' ? '<button data-move="' + c.id + '" data-to="rejected">✕</button>' : '');
          return '<div class="kcard"><b>' + esc(c.name) + '</b><small>' + esc(j.title || '') + (c.rating ? ' · ' + '★'.repeat(c.rating) : '') + '</small><div class="kmove">' + moves + '</div></div>';
        }).join('') + '</div>';
      }).join('');
      document.querySelectorAll('[data-move]').forEach(function (b) {
        b.addEventListener('click', function () {
          sb.from('candidates').update({ stage: b.dataset.to }).eq('id', b.dataset.move).then(function (r2) { if (r2.error) fail(r2.error); else load(); });
        });
      });
    });
  }
  $('#new-job').addEventListener('click', function () {
    modal('<h3>New role</h3><form id="f"><div class="field"><label>Title</label><input id="j-title" required></div>' +
      '<div class="frow"><div class="field"><label>Department</label><input id="j-dept"></div><div class="field"><label>Location</label><input id="j-loc"></div></div>' +
      '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Open role</button></div></form>');
    $('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      sb.from('jobs').insert({ title: $('#j-title').value, department: $('#j-dept').value || null, location: $('#j-loc').value || null, created_by: user.id }).then(function (r) { if (r.error) fail(r.error); else { closeModal(); toast('Role opened'); load(); } });
    });
  });
  $('#new-cand').addEventListener('click', function () {
    sb.from('jobs').select('id,title').eq('status', 'open').then(function (r) {
      if (!(r.data || []).length) return toast('Open a role first', true);
      modal('<h3>Add candidate</h3><form id="f"><div class="field"><label>Name</label><input id="cd-name" required></div>' +
        '<div class="field"><label>Email</label><input type="email" id="cd-email"></div>' +
        '<div class="field"><label>Role</label><select id="cd-job">' + r.data.map(function (j) { return '<option value="' + j.id + '">' + esc(j.title) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>Rating</label><select id="cd-rate"><option value="">–</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></div>' +
        '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Add</button></div></form>');
      $('#f').addEventListener('submit', function (e) {
        e.preventDefault();
        sb.from('candidates').insert({ name: $('#cd-name').value, email: $('#cd-email').value || null, job_id: $('#cd-job').value, rating: $('#cd-rate').value ? parseInt($('#cd-rate').value, 10) : null }).then(function (r2) { if (r2.error) fail(r2.error); else { closeModal(); toast('Candidate added'); load(); } });
      });
    });
  });
  load();
};

/* ---- Performance ---- */
VIEWS.performance = function () {
  setView('Performance', '<div class="section-head"><h2>Review cycles</h2>' + (isHR() ? '<button class="btn btn-ink btn-sm" id="new-cycle">+ New cycle</button>' : '') + '</div><div class="card" id="cycles"><div class="empty">Loading…</div></div>' +
    '<div class="section-head"><h2>My reviews</h2><button class="btn btn-line btn-sm" id="new-entry">+ Write a review</button></div><div class="card" id="entries"></div>');
  function load() {
    Promise.all([sb.from('review_cycles').select('*').order('start_date', { ascending: false }), sb.from('review_entries').select('*').order('created_at', { ascending: false })]).then(function (r) {
      var cy = r[0].data || [], en = r[1].data || [];
      $('#cycles').innerHTML = cy.length ? '<table><thead><tr><th>Cycle</th><th>Window</th><th>Status</th><th>Entries</th></tr></thead><tbody>' + cy.map(function (c) {
        return '<tr><td><b>' + esc(c.name) + '</b></td><td>' + fmtD(c.start_date) + ' → ' + fmtD(c.end_date) + '</td><td>' + pill(c.status) + '</td><td>' + en.filter(function (x) { return x.cycle_id === c.id; }).length + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="empty">No review cycles yet.</div>';
      var mine = en.filter(function (x) { return x.reviewer_id === user.id || x.employee_id === user.id; });
      $('#entries').innerHTML = mine.length ? '<table><thead><tr><th>About</th><th>By</th><th>Type</th><th>Rating</th><th>Review</th></tr></thead><tbody>' + mine.map(function (x) {
        return '<tr><td><b>' + esc(personName(x.employee_id)) + '</b></td><td>' + esc(personName(x.reviewer_id)) + '</td><td>' + pill(x.kind) + '</td><td>' + (x.rating ? '★'.repeat(x.rating) : '') + '</td><td style="max-width:340px">' + esc(x.content || '') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="empty">No reviews involving you yet.</div>';
    });
  }
  var ncy = $('#new-cycle');
  if (ncy) ncy.addEventListener('click', function () {
    modal('<h3>New review cycle</h3><form id="f"><div class="field"><label>Name</label><input id="rc-name" required placeholder="H1 2026 Reviews"></div>' +
      '<div class="frow"><div class="field"><label>Start</label><input type="date" id="rc-start" required></div><div class="field"><label>End</label><input type="date" id="rc-end" required></div></div>' +
      '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Open cycle</button></div></form>');
    $('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      sb.from('review_cycles').insert({ name: $('#rc-name').value, start_date: $('#rc-start').value, end_date: $('#rc-end').value }).then(function (r) { if (r.error) fail(r.error); else { closeModal(); toast('Cycle opened'); load(); } });
    });
  });
  $('#new-entry').addEventListener('click', function () {
    sb.from('review_cycles').select('*').eq('status', 'open').then(function (r) {
      if (!(r.data || []).length) return toast('No open review cycle. HR can start one.', true);
      modal('<h3>Write a review</h3><form id="f">' +
        '<div class="field"><label>Cycle</label><select id="re-cycle">' + r.data.map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>About</label><select id="re-emp">' + peopleOptions(user.id) + '</select></div>' +
        '<div class="field"><label>Type</label><select id="re-kind"><option value="self">Self review</option><option value="manager">Manager review</option><option value="peer">Peer feedback</option></select></div>' +
        '<div class="field"><label>Rating</label><select id="re-rate"><option value="">–</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></div>' +
        '<div class="field"><label>Review</label><textarea id="re-content" rows="4" required></textarea></div>' +
        '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Submit</button></div></form>');
      $('#f').addEventListener('submit', function (e) {
        e.preventDefault();
        sb.from('review_entries').insert({ cycle_id: $('#re-cycle').value, employee_id: $('#re-emp').value, reviewer_id: user.id, kind: $('#re-kind').value, rating: $('#re-rate').value ? parseInt($('#re-rate').value, 10) : null, content: $('#re-content').value, submitted_at: new Date().toISOString() })
          .then(function (r2) { if (r2.error) fail(r2.error); else { closeModal(); toast('Review submitted'); load(); } });
      });
    });
  });
  load();
};

/* ---- Training ---- */
VIEWS.training = function () {
  setView('Training', '<div class="section-head"><h2>My training</h2></div><div class="card" id="mine"><div class="empty">Loading…</div></div>' +
    '<div class="section-head"><h2>Course catalog</h2>' + (isHR() ? '<span><button class="btn btn-line btn-sm" id="assign">Assign course</button> <button class="btn btn-ink btn-sm" id="new-course">+ Course</button></span>' : '') + '</div><div class="card" id="cat"></div>');
  function load() {
    Promise.all([
      sb.from('training_assignments').select('*,training_courses(title,provider)').order('created_at', { ascending: false }),
      sb.from('training_courses').select('*').order('title'),
    ]).then(function (r) {
      var asg = (r[0].data || []), courses = r[1].data || [];
      var mine = asg.filter(function (a) { return a.employee_id === user.id; });
      var visible = isHR() || isMgr() ? asg : mine;
      $('#mine').innerHTML = visible.length ? '<table><thead><tr><th>Course</th><th>Who</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>' + visible.map(function (a) {
        var acts = '';
        if (a.employee_id === user.id && a.status !== 'done') acts = '<button class="btn btn-line btn-sm" data-done="' + a.id + '">Mark done</button>';
        return '<tr><td><b>' + esc(a.training_courses ? a.training_courses.title : '') + '</b></td><td>' + esc(personName(a.employee_id)) + '</td><td>' + (a.due_date ? fmtD(a.due_date) : '') + '</td><td>' + pill(a.status) + '</td><td>' + acts + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="empty">No training assigned yet.</div>';
      $('#cat').innerHTML = courses.length ? '<table><thead><tr><th>Course</th><th>Provider</th><th>Renews every</th></tr></thead><tbody>' + courses.map(function (c) {
        return '<tr><td><b>' + esc(c.title) + '</b></td><td>' + esc(c.provider || '') + '</td><td>' + (c.expires_months ? c.expires_months + ' months' : 'One-time') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="empty">No courses.</div>';
      document.querySelectorAll('[data-done]').forEach(function (b) {
        b.addEventListener('click', function () {
          sb.from('training_assignments').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', b.dataset.done).then(function (r2) { if (r2.error) fail(r2.error); else { toast('Nice work! Marked done.'); load(); } });
        });
      });
    });
  }
  var nc = $('#new-course');
  if (nc) nc.addEventListener('click', function () {
    modal('<h3>New course</h3><form id="f"><div class="field"><label>Title</label><input id="tc-title" required></div>' +
      '<div class="frow"><div class="field"><label>Provider</label><input id="tc-prov"></div><div class="field"><label>Renews (months, blank = one-time)</label><input type="number" id="tc-exp" min="1"></div></div>' +
      '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Add</button></div></form>');
    $('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      sb.from('training_courses').insert({ title: $('#tc-title').value, provider: $('#tc-prov').value || null, expires_months: $('#tc-exp').value ? parseInt($('#tc-exp').value, 10) : null }).then(function (r) { if (r.error) fail(r.error); else { closeModal(); toast('Course added'); load(); } });
    });
  });
  var asg = $('#assign');
  if (asg) asg.addEventListener('click', function () {
    sb.from('training_courses').select('id,title').then(function (r) {
      modal('<h3>Assign course</h3><form id="f">' +
        '<div class="field"><label>Course</label><select id="as-course">' + (r.data || []).map(function (c) { return '<option value="' + c.id + '">' + esc(c.title) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label>Employee</label><select id="as-emp">' + peopleOptions() + '</select></div>' +
        '<div class="field"><label>Due date</label><input type="date" id="as-due"></div>' +
        '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Assign</button></div></form>');
      $('#f').addEventListener('submit', function (e) {
        e.preventDefault();
        sb.from('training_assignments').insert({ course_id: $('#as-course').value, employee_id: $('#as-emp').value, due_date: $('#as-due').value || null }).then(function (r2) { if (r2.error) fail(r2.error); else { closeModal(); toast('Assigned'); load(); } });
      });
    });
  });
  load();
};

/* ---- Goals ---- */
VIEWS.goals = function () {
  setView('Goals & OKRs', '<div class="section-head"><h2>My goals</h2><button class="btn btn-ink btn-sm" id="new-g">+ New goal</button></div><div class="grid g2" id="mine"></div>' +
    '<div class="section-head"><h2>Company & team goals</h2></div><div class="grid g2" id="pub"></div>');
  function gcard(g, own) {
    var ctl = own ? '<div style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="range" min="0" max="100" value="' + g.progress + '" data-prog="' + g.id + '" style="flex:1">' +
      (g.status === 'active' ? '<button class="btn btn-line btn-sm" data-doneg="' + g.id + '">Done</button>' : '') + '</div>' : '';
    return '<div class="card"><div style="display:flex;justify-content:space-between;gap:8px"><h3 style="margin:0">' + esc(g.title) + '</h3>' + pill(g.status) + '</div>' +
      '<div style="font-size:.76rem;color:var(--ink-3);margin:6px 0 10px">' + esc(personName(g.owner_id)) + (g.target_date ? ' · target ' + fmtD(g.target_date) : '') + '</div>' +
      (g.description ? '<p style="font-size:.85rem;color:var(--ink-2);margin-bottom:10px">' + esc(g.description) + '</p>' : '') +
      '<div style="display:flex;gap:10px;align-items:center"><div class="progress" style="flex:1"><i style="width:' + g.progress + '%"></i></div><b style="font-size:.8rem">' + g.progress + '%</b></div>' + ctl + '</div>';
  }
  function load() {
    sb.from('goals').select('*').order('created_at', { ascending: false }).then(function (r) {
      var gs = r.data || [];
      var mine = gs.filter(function (g) { return g.owner_id === user.id; });
      var pub = gs.filter(function (g) { return g.owner_id !== user.id; });
      $('#mine').innerHTML = mine.length ? mine.map(function (g) { return gcard(g, true); }).join('') : '<div class="card"><div class="empty">No goals yet. Set your first one.</div></div>';
      $('#pub').innerHTML = pub.length ? pub.map(function (g) { return gcard(g, false); }).join('') : '<div class="card"><div class="empty">No shared goals visible.</div></div>';
      document.querySelectorAll('[data-prog]').forEach(function (s) {
        s.addEventListener('change', function () {
          sb.from('goals').update({ progress: parseInt(s.value, 10) }).eq('id', s.dataset.prog).then(function (r2) { if (r2.error) fail(r2.error); else load(); });
        });
      });
      document.querySelectorAll('[data-doneg]').forEach(function (b) {
        b.addEventListener('click', function () {
          sb.from('goals').update({ status: 'done', progress: 100 }).eq('id', b.dataset.doneg).then(function () { toast('Goal completed 🎉'); load(); });
        });
      });
    });
  }
  $('#new-g').addEventListener('click', function () {
    modal('<h3>New goal</h3><form id="f"><div class="field"><label>Title</label><input id="g-title" required placeholder="Ship the Q3 release"></div>' +
      '<div class="field"><label>Description / key results</label><textarea id="g-desc" rows="3"></textarea></div>' +
      '<div class="frow"><div class="field"><label>Target date</label><input type="date" id="g-date"></div>' +
      '<div class="field"><label>Visibility</label><select id="g-vis"><option value="public">Visible to team</option><option value="private">Private</option></select></div></div>' +
      '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Create</button></div></form>');
    $('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      sb.from('goals').insert({ owner_id: user.id, title: $('#g-title').value, description: $('#g-desc').value || null, target_date: $('#g-date').value || null, visibility: $('#g-vis').value }).then(function (r) { if (r.error) fail(r.error); else { closeModal(); toast('Goal created'); load(); } });
    });
  });
  load();
};

/* ---- Payroll ---- */
VIEWS.payroll = function () {
  if (!isFin() && !isHR()) return setView('Payroll Prep', '<div class="card"><div class="empty">Payroll preparation is visible to finance, HR, and admins.</div></div>');
  var now = new Date();
  setView('Payroll Prep', '<div class="card" style="margin-bottom:16px"><div class="frow">' +
    '<div class="field" style="margin:0"><label>Year</label><input type="number" id="py" value="' + now.getFullYear() + '"></div>' +
    '<div class="field" style="margin:0"><label>Month</label><input type="number" id="pm" min="1" max="12" value="' + (now.getMonth() + 1) + '"></div>' +
    '<div class="field" style="margin:0;display:flex;align-items:flex-end"><button class="btn btn-ink" id="run" style="width:100%">Build payroll view</button></div></div></div>' +
    '<div class="card" id="out"><div class="empty">Choose a period and build the view. Only fully approved records are included.</div></div>');
  $('#run').addEventListener('click', function () {
    var y = parseInt($('#py').value, 10), m = parseInt($('#pm').value, 10);
    $('#out').innerHTML = '<div class="empty">Crunching…</div>';
    Promise.all([
      sb.from('timesheets').select('id,employee_id,timesheet_rows(weekly_total)').eq('year', y).eq('month', m).eq('status', 'approved'),
      sb.from('leave_requests').select('employee_id,total_hours,leave_type,start_date').eq('status', 'approved'),
      sb.from('expense_reports').select('id,employee_id,expense_entries(mileage_cost,lodging_amount,breakfast_amount,lunch_amount,dinner_amount,other_amount)').eq('year', y).eq('month', m).eq('status', 'approved'),
    ]).then(function (r) {
      if (r[0].error) return fail(r[0].error);
      var agg = {};
      function row(id) { return agg[id] = agg[id] || { hours: 0, leave: 0, expenses: 0 }; }
      (r[0].data || []).forEach(function (t) { (t.timesheet_rows || []).forEach(function (x) { row(t.employee_id).hours += parseFloat(x.weekly_total || 0); }); });
      (r[1].data || []).forEach(function (l) { var d = new Date(l.start_date); if (d.getFullYear() === y && d.getMonth() + 1 === m) row(l.employee_id).leave += parseFloat(l.total_hours || 0); });
      (r[2].data || []).forEach(function (er) { (er.expense_entries || []).forEach(function (x) { row(er.employee_id).expenses += ['mileage_cost', 'lodging_amount', 'breakfast_amount', 'lunch_amount', 'dinner_amount', 'other_amount'].reduce(function (s, k) { return s + parseFloat(x[k] || 0); }, 0); }); });
      var ids = Object.keys(agg);
      if (!ids.length) { $('#out').innerHTML = '<div class="empty">No approved records for ' + y + '-' + String(m).padStart(2, '0') + ' yet.</div>'; return; }
      var rows = ids.map(function (id) {
        var a = agg[id];
        return '<tr><td><b>' + esc(personName(id)) + '</b></td><td>' + a.hours.toFixed(1) + '</td><td>' + a.leave.toFixed(1) + '</td><td>$' + a.expenses.toFixed(2) + '</td></tr>';
      }).join('');
      $('#out').innerHTML = '<div class="section-head" style="margin-top:0"><h2>' + y + '-' + String(m).padStart(2, '0') + ' payroll-ready summary</h2><button class="btn btn-line btn-sm" id="csv">Download CSV</button></div>' +
        '<table><thead><tr><th>Employee</th><th>Approved hours</th><th>Approved leave (h)</th><th>Approved expenses</th></tr></thead><tbody>' + rows + '</tbody></table>';
      $('#csv').addEventListener('click', function () {
        var csv = 'Employee,ApprovedHours,ApprovedLeaveHours,ApprovedExpenses\n' + ids.map(function (id) {
          var a = agg[id]; return '"' + personName(id).replace(/"/g, '""') + '",' + a.hours.toFixed(1) + ',' + a.leave.toFixed(1) + ',' + a.expenses.toFixed(2);
        }).join('\n');
        var b = new Blob([csv], { type: 'text/csv' }), u = URL.createObjectURL(b), a2 = document.createElement('a');
        a2.href = u; a2.download = 'syncstaff-payroll-' + y + '-' + String(m).padStart(2, '0') + '.csv'; a2.click(); URL.revokeObjectURL(u);
      });
    }).catch(fail);
  });
};

/* ---- Expenses ---- */
VIEWS.expenses = function () {
  setView('Expenses', '<div class="msg show" style="display:block;background:var(--blue-soft);color:#1E429F;border:1px solid #A4CAFE">Detailed expense entry (per-day costs, receipts) lives in the classic app. This view tracks reports and approvals.</div>' +
    '<div class="section-head"><h2>My expense reports</h2><a class="btn btn-ink btn-sm" href="' + FULL_APP + '/expenses" target="_blank" rel="noopener">Open expense editor ↗</a></div>' +
    '<div class="card" id="list"><div class="empty">Loading…</div></div>' +
    (isMgr() ? '<div class="section-head"><h2>Approvals inbox</h2></div><div class="card" id="inbox"></div>' : ''));
  function load() {
    sb.from('expense_reports').select('*').eq('employee_id', user.id).order('created_at', { ascending: false }).limit(24).then(function (r) {
      var rows = (r.data || []).map(function (x) {
        var act = x.status === 'draft' ? '<button class="btn btn-line btn-sm" data-sub="' + x.id + '">Submit</button>' : '';
        return '<tr><td><b>' + x.year + '-' + String(x.month).padStart(2, '0') + ' · W' + x.week_number + '</b></td><td>' + esc(x.destination || '') + '</td><td>' + pill(x.status) + '</td><td>' + act + '</td></tr>';
      }).join('');
      $('#list').innerHTML = rows ? '<table><thead><tr><th>Period</th><th>Destination</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">No expense reports yet.</div>';
      document.querySelectorAll('[data-sub]').forEach(function (b) {
        b.addEventListener('click', function () {
          sb.from('expense_reports').update({ status: 'submitted', submitted_at: new Date().toISOString() }).eq('id', b.dataset.sub).then(function (r2) { if (r2.error) fail(r2.error); else { toast('Submitted'); load(); } });
        });
      });
    });
    if (isMgr()) sb.from('expense_reports').select('*').in('status', ['submitted', 'manager_approved']).neq('employee_id', user.id).then(function (r) {
      var rows = (r.data || []).map(function (x) {
        var acts = '';
        if (x.status === 'submitted') acts = '<button class="btn btn-line btn-sm" data-app="' + x.id + '" data-to="manager_approved">Approve</button> <button class="btn btn-danger btn-sm" data-app="' + x.id + '" data-to="manager_rejected">Reject</button>';
        else if (isHR() || isFin()) acts = '<button class="btn btn-line btn-sm" data-app="' + x.id + '" data-to="approved">Final approve</button> <button class="btn btn-danger btn-sm" data-app="' + x.id + '" data-to="rejected">Reject</button>';
        return '<tr><td><b>' + esc(personName(x.employee_id)) + '</b></td><td>' + x.year + '-' + String(x.month).padStart(2, '0') + ' W' + x.week_number + '</td><td>' + pill(x.status) + '</td><td>' + acts + '</td></tr>';
      }).join('');
      $('#inbox').innerHTML = rows ? '<table><tbody>' + rows + '</tbody></table>' : '<div class="empty">Inbox zero.</div>';
      document.querySelectorAll('#inbox [data-app]').forEach(function (b) {
        b.addEventListener('click', function () {
          var upd = { status: b.dataset.to };
          if (b.dataset.to.indexOf('approved') >= 0) upd.approved_at = new Date().toISOString();
          if (b.dataset.to.indexOf('rejected') >= 0) upd.rejected_at = new Date().toISOString();
          sb.from('expense_reports').update(upd).eq('id', b.dataset.app).then(function (r2) { if (r2.error) fail(r2.error); else { toast('Updated'); load(); } });
        });
      });
    });
  }
  load();
};

/* ---- E-sign ---- */
VIEWS.esign = function () {
  setView('E-Signature', '<div class="section-head"><h2>Waiting for my signature</h2>' + (isHR() ? '<button class="btn btn-ink btn-sm" id="new-e">+ Request signature</button>' : '') + '</div><div class="grid g2" id="mine"></div>' +
    '<div class="section-head"><h2>All requests</h2></div><div class="card" id="all"></div>');
  function load() {
    sb.from('esign_requests').select('*').order('created_at', { ascending: false }).then(function (r) {
      var all = r.data || [];
      var mine = all.filter(function (x) { return x.signer_id === user.id && x.status === 'pending'; });
      $('#mine').innerHTML = mine.length ? mine.map(function (x) {
        return '<div class="card"><h3>' + esc(x.title) + '</h3><p style="font-size:.86rem;color:var(--ink-2);margin:8px 0 14px;white-space:pre-wrap">' + esc(x.body || '') + '</p>' +
          '<form data-sign="' + x.id + '" style="display:flex;gap:8px;flex-wrap:wrap"><input required placeholder="Type your full name to sign" style="flex:1;min-width:180px;background:var(--cream);border:1.5px solid var(--line);border-radius:10px;padding:8px 12px">' +
          '<button class="btn btn-ink btn-sm">Sign</button><button type="button" class="btn btn-danger btn-sm" data-decline="' + x.id + '">Decline</button></form></div>';
      }).join('') : '<div class="card"><div class="empty">Nothing waiting for your signature.</div></div>';
      $('#all').innerHTML = all.length ? '<table><thead><tr><th>Document</th><th>Signer</th><th>Status</th><th>Signed</th></tr></thead><tbody>' + all.map(function (x) {
        return '<tr><td><b>' + esc(x.title) + '</b></td><td>' + esc(personName(x.signer_id)) + '</td><td>' + pill(x.status) + '</td><td>' + (x.signed_at ? fmtD(x.signed_at.slice(0, 10)) + ' as "' + esc(x.signature_name || '') + '"' : '') + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="empty">No signature requests yet.</div>';
      document.querySelectorAll('[data-sign]').forEach(function (f) {
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          sb.from('esign_requests').update({ status: 'signed', signature_name: f.querySelector('input').value, signed_at: new Date().toISOString() }).eq('id', f.dataset.sign)
            .then(function (r2) { if (r2.error) fail(r2.error); else { toast('Signed ✍️'); load(); } });
        });
      });
      document.querySelectorAll('[data-decline]').forEach(function (b) {
        b.addEventListener('click', function () {
          sb.from('esign_requests').update({ status: 'declined' }).eq('id', b.dataset.decline).then(function () { toast('Declined'); load(); });
        });
      });
    });
  }
  var ne = $('#new-e');
  if (ne) ne.addEventListener('click', function () {
    modal('<h3>Request a signature</h3><form id="f">' +
      '<div class="field"><label>Title</label><input id="e-title" required placeholder="Remote Work Policy 2026"></div>' +
      '<div class="field"><label>Text / summary</label><textarea id="e-body" rows="4" placeholder="Paste the policy text or a summary the signer acknowledges."></textarea></div>' +
      '<div class="field"><label>Signer</label><select id="e-signer">' + peopleOptions() + '</select></div>' +
      '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Send</button></div></form>');
    $('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      sb.from('esign_requests').insert({ title: $('#e-title').value, body: $('#e-body').value || null, signer_id: $('#e-signer').value, requested_by: user.id }).then(function (r) { if (r.error) fail(r.error); else { closeModal(); toast('Signature requested'); load(); } });
    });
  });
  load();
};

/* ---- Documents ---- */
VIEWS.documents = function () {
  setView('Documents', '<div class="section-head"><h2>Document manager</h2>' + (isHR() ? '<button class="btn btn-ink btn-sm" id="new-d">+ Add document</button>' : '') + '</div><div class="card" id="list"><div class="empty">Loading…</div></div>');
  function load() {
    sb.from('hr_documents').select('*').order('created_at', { ascending: false }).then(function (r) {
      var rows = (r.data || []).map(function (d) {
        return '<tr><td><b>' + esc(d.name) + '</b>' + (d.external_url ? ' <a href="' + esc(d.external_url) + '" target="_blank" rel="noopener" style="color:var(--purple)">↗</a>' : '') + '</td><td>' + pill(d.category) + '</td><td>' + (d.employee_id ? esc(personName(d.employee_id)) : 'Company-wide') + '</td><td>' + (d.expires_on ? fmtD(d.expires_on) : '') + '</td></tr>';
      }).join('');
      $('#list').innerHTML = rows ? '<table><thead><tr><th>Document</th><th>Category</th><th>Belongs to</th><th>Expires</th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">No documents yet.</div>';
    });
  }
  var nd = $('#new-d');
  if (nd) nd.addEventListener('click', function () {
    modal('<h3>Add document</h3><form id="f">' +
      '<div class="field"><label>Name</label><input id="d-name" required placeholder="Employment Contract"></div>' +
      '<div class="frow"><div class="field"><label>Category</label><select id="d-cat"><option>general</option><option>contract</option><option>policy</option><option>certificate</option><option>payslip</option><option>id</option></select></div>' +
      '<div class="field"><label>Expires</label><input type="date" id="d-exp"></div></div>' +
      '<div class="field"><label>Link (SharePoint / Drive URL)</label><input type="url" id="d-url" placeholder="https://…"></div>' +
      '<div class="field"><label>Belongs to</label><select id="d-emp"><option value="">Company-wide</option>' + peopleOptions() + '</select></div>' +
      '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Add</button></div></form>');
    $('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      sb.from('hr_documents').insert({ name: $('#d-name').value, category: $('#d-cat').value, expires_on: $('#d-exp').value || null, external_url: $('#d-url').value || null, employee_id: $('#d-emp').value || null, uploaded_by: user.id }).then(function (r) { if (r.error) fail(r.error); else { closeModal(); toast('Document added'); load(); } });
    });
  });
  load();
};

/* ---- Org chart ---- */
VIEWS.org = function () {
  setView('Org Chart', '<div class="card" id="tree"><div class="empty">Loading…</div></div><div class="section-head"><h2>Directory</h2></div><div class="card" id="dir"></div>');
  sb.from('v_org_directory').select('*').then(function (r) {
    if (r.error) return fail(r.error);
    var ppl = r.data || [];
    function node(p) {
      var kids = ppl.filter(function (x) { return x.manager_id === p.id; });
      return '<div><div class="org-node"><b>' + esc(p.display_name || p.email) + '</b><small>' + esc(p.job_title || '') + (p.department ? ' · ' + esc(p.department) : '') + '</small></div>' +
        (kids.length ? '<div class="org-children">' + kids.map(node).join('') : '') + (kids.length ? '</div>' : '') + '</div>';
    }
    var roots = ppl.filter(function (p) { return !p.manager_id; });
    $('#tree').innerHTML = roots.length ? roots.map(node).join('<div style="height:14px"></div>') : '<div class="empty">No reporting lines yet. Set managers in the classic app or via directory sync.</div>';
    $('#dir').innerHTML = '<table><thead><tr><th>Name</th><th>Title</th><th>Department</th><th>Manager</th></tr></thead><tbody>' + ppl.map(function (p) {
      var m = ppl.find(function (x) { return x.id === p.manager_id; });
      return '<tr><td><b>' + esc(p.display_name || p.email) + '</b></td><td>' + esc(p.job_title || '') + '</td><td>' + esc(p.department || '') + '</td><td>' + esc(m ? (m.display_name || m.email) : '') + '</td></tr>';
    }).join('') + '</tbody></table>';
  });
};

/* ---- Reports ---- */
VIEWS.reports = function () {
  setView('Reports & KPIs', '<div class="grid g4" id="kpis"></div><div class="section-head"><h2>Approval pipeline</h2></div><div class="card" id="pipe"><div class="empty">Loading…</div></div>');
  Promise.all([
    sb.from('v_org_directory').select('id', { count: 'exact', head: true }),
    sb.from('leave_requests').select('status'),
    sb.from('timesheets').select('status'),
    sb.from('onboarding_cases').select('status'),
    sb.from('jobs').select('status'),
    sb.from('training_assignments').select('status'),
  ]).then(function (r) {
    var lv = r[1].data || [], ts = r[2].data || [], ob = r[3].data || [], jb = r[4].data || [], tr = r[5].data || [];
    function cnt(arr, s) { return arr.filter(function (x) { return x.status === s; }).length; }
    $('#kpis').innerHTML =
      '<div class="card kpi"><b>' + (r[0].count || 0) + '</b><span>people in directory</span></div>' +
      '<div class="card kpi"><b>' + cnt(ob, 'active') + '</b><span>active onboarding cases</span></div>' +
      '<div class="card kpi"><b>' + cnt(jb, 'open') + '</b><span>open roles</span></div>' +
      '<div class="card kpi"><b>' + (tr.length ? Math.round(cnt(tr, 'done') / tr.length * 100) : 0) + '%</b><span>training completion</span></div>';
    function bar(label, arr) {
      var states = ['draft', 'submitted', 'manager_approved', 'approved', 'rejected', 'manager_rejected'];
      var total = arr.length || 1;
      var seg = states.map(function (s) {
        var n = cnt(arr, s); if (!n) return '';
        var colors = { draft: '#D5D2E0', submitted: '#F5C377', manager_approved: '#93B4F8', approved: '#6EE7B7', rejected: '#F8A4BE', manager_rejected: '#F8A4BE' };
        return '<i title="' + s + ': ' + n + '" style="width:' + (n / total * 100) + '%;background:' + colors[s] + ';border-radius:0"></i>';
      }).join('');
      return '<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:6px"><b>' + label + '</b><span style="color:var(--ink-3)">' + arr.length + ' records</span></div><div class="progress" style="display:flex;height:12px">' + seg + '</div></div>';
    }
    $('#pipe').innerHTML = bar('Leave requests', lv) + bar('Timesheets', ts) +
      '<p style="font-size:.74rem;color:var(--ink-3)">Gray draft · amber submitted · blue manager-approved · green approved · pink rejected</p>';
  }).catch(fail);
};

/* ---- Automations ---- */
VIEWS.automations = function () {
  if (!isHR()) return setView('Automations', '<div class="card"><div class="empty">Automations are managed by HR and admins.</div></div>');
  setView('Automations', '<div class="section-head"><h2>Rules</h2><button class="btn btn-ink btn-sm" id="new-a">+ New automation</button></div><div class="card" id="list"><div class="empty">Loading…</div></div>' +
    '<div class="section-head"><h2>Recent runs</h2></div><div class="card" id="runs"></div>');
  var TRIGGERS = { 'leave.approved': 'Leave approved', 'employee.created': 'New employee joins', 'onboarding.completed': 'Onboarding completed', 'training.overdue': 'Training overdue', 'document.expiring': 'Document expiring soon' };
  var ACTIONS = { notify_manager: 'Notify the manager', create_task: 'Create a follow-up task', send_email: 'Send an email (via integration)', webhook: 'Call a webhook' };
  function load() {
    Promise.all([sb.from('automations').select('*').order('created_at', { ascending: false }), sb.from('automation_runs').select('*,automations(name)').order('ran_at', { ascending: false }).limit(15)]).then(function (r) {
      var rows = (r[0].data || []).map(function (a) {
        return '<tr><td><b>' + esc(a.name) + '</b></td><td>' + esc(TRIGGERS[a.trigger_event] || a.trigger_event) + '</td><td>' + esc(ACTIONS[a.action] || a.action) + '</td><td>' + (a.active ? pill('active') : pill('cancelled')) + '</td>' +
          '<td><button class="btn btn-line btn-sm" data-tgl="' + a.id + '" data-v="' + (!a.active) + '">' + (a.active ? 'Pause' : 'Resume') + '</button> <button class="btn btn-line btn-sm" data-test="' + a.id + '">Test run</button></td></tr>';
      }).join('');
      $('#list').innerHTML = rows ? '<table><thead><tr><th>Name</th><th>When</th><th>Do</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' : '<div class="empty">No automations yet. Create your first rule.</div>';
      var runs = (r[1].data || []).map(function (x) {
        return '<tr><td>' + esc(x.automations ? x.automations.name : '') + '</td><td>' + new Date(x.ran_at).toLocaleString() + '</td><td>' + pill(x.status) + '</td><td style="font-size:.78rem;color:var(--ink-3)">' + esc(x.detail || '') + '</td></tr>';
      }).join('');
      $('#runs').innerHTML = runs ? '<table><tbody>' + runs + '</tbody></table>' : '<div class="empty">No runs yet. Use "Test run" to try a rule.</div>';
      document.querySelectorAll('[data-tgl]').forEach(function (b) {
        b.addEventListener('click', function () { sb.from('automations').update({ active: b.dataset.v === 'true' }).eq('id', b.dataset.tgl).then(function () { load(); }); });
      });
      document.querySelectorAll('[data-test]').forEach(function (b) {
        b.addEventListener('click', function () {
          sb.from('automation_runs').insert({ automation_id: b.dataset.test, status: 'success', detail: 'Manual test run from workspace' }).then(function (r2) { if (r2.error) fail(r2.error); else { toast('Test run logged'); load(); } });
        });
      });
    });
  }
  $('#new-a').addEventListener('click', function () {
    modal('<h3>New automation</h3><form id="f"><div class="field"><label>Name</label><input id="a-name" required placeholder="Notify manager on approved leave"></div>' +
      '<div class="field"><label>When</label><select id="a-trig">' + Object.keys(TRIGGERS).map(function (k) { return '<option value="' + k + '">' + TRIGGERS[k] + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Do</label><select id="a-act">' + Object.keys(ACTIONS).map(function (k) { return '<option value="' + k + '">' + ACTIONS[k] + '</option>'; }).join('') + '</select></div>' +
      '<div class="actions"><button type="button" class="btn btn-line" onclick="closeModal()">Cancel</button><button class="btn btn-ink">Create</button></div></form>');
    $('#f').addEventListener('submit', function (e) {
      e.preventDefault();
      sb.from('automations').insert({ name: $('#a-name').value, trigger_event: $('#a-trig').value, action: $('#a-act').value, created_by: user.id }).then(function (r) { if (r.error) fail(r.error); else { closeModal(); toast('Automation created'); load(); } });
    });
  });
  load();
};

/* ---- Integrations ---- */
VIEWS.integrations = function () {
  var items = [
    { n: 'Microsoft 365 SSO', d: 'Single sign-on with Entra ID', s: 'configurable', k: 'azure_client_id' },
    { n: 'Entra Directory Sync', d: 'Profiles, managers and roles synced daily', s: 'configurable', k: 'azure_tenant_id' },
    { n: 'SharePoint Export', d: 'Payroll files to your document library', s: 'configurable', k: 'sharepoint_site_id' },
    { n: 'Slack', d: 'Approval alerts in channels', s: 'coming soon' },
    { n: 'Gusto / ADP / QuickBooks', d: 'Direct payroll sync via unified APIs', s: 'coming soon' },
    { n: 'DocuSign / Dropbox Sign', d: 'External e-signature providers', s: 'coming soon' },
    { n: 'Google & Outlook Calendar', d: 'Leave and interviews on calendars', s: 'coming soon' },
    { n: 'Public API & Webhooks', d: 'Build on SyncStaff data', s: 'coming soon' },
  ];
  setView('Integrations', '<div class="grid g2" id="ints"></div>');
  function render(cfg) {
    $('#ints').innerHTML = items.map(function (it) {
      var st = it.s;
      if (it.k && cfg) { var row = cfg.find(function (c) { return c.key === it.k; }); st = row && row.value ? 'connected' : 'not configured'; }
      var p = st === 'connected' ? pill('approved').replace('approved', 'connected') : (st === 'coming soon' ? '<span class="pill p-gray">coming soon</span>' : '<span class="pill p-amber">' + st + '</span>');
      return '<div class="card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><h3 style="margin:0">' + it.n + '</h3>' + p + '</div><p style="font-size:.86rem;color:var(--ink-2);margin-top:8px">' + it.d + '</p>' +
        (it.k && isHR() ? '<p style="font-size:.76rem;color:var(--ink-3);margin-top:8px">Configure in the classic app: Settings → App Config.</p>' : '') + '</div>';
    }).join('');
  }
  if (isHR()) sb.from('app_config').select('key,value').then(function (r) { render(r.data || null); });
  else render(null);
};

/* ---------- boot ---------- */
function boot() {
  sb.auth.getUser().then(function (r) {
    if (!r.data || !r.data.user) return renderLogin();
    user = r.data.user;
    Promise.all([
      sb.from('profiles').select('*').eq('id', user.id).single(),
      sb.rpc('my_highest_role'),
      sb.from('v_org_directory').select('id,display_name,email,job_title,department,manager_id').order('display_name'),
    ]).then(function (rr) {
      profile = rr[0].data;
      role = rr[1].data || 'employee';
      people = rr[2].data || [];
      shell();
    }).catch(function (e) { fail(e); shell(); });
  });
}
boot();
})();
