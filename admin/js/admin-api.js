const BASE = 'http://localhost:5291/api';

const Token = {
  get:   () => ({ access: localStorage.getItem('adminAccess'), refresh: localStorage.getItem('adminRefresh') }),
  set:   (a,r) => { localStorage.setItem('adminAccess',a); localStorage.setItem('adminRefresh',r) },
  clear: () => { localStorage.removeItem('adminAccess'); localStorage.removeItem('adminRefresh') },
};

async function apiFetch(path, opts = {}) {
  const { access } = Token.get();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers||{}) };
  if (access) headers['Authorization'] = 'Bearer ' + access;

  const res  = await fetch(BASE + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const { refresh, access: old } = Token.get();
    if (!refresh) { Token.clear(); goLogin(); return; }
    try {
      const r  = await fetch(BASE + '/account/refresh', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ accessToken: old, refreshToken: refresh }),
      });
      const rd = await r.json();
      Token.set(rd.data.accessToken, rd.data.refreshToken);
      return apiFetch(path, opts);
    } catch { Token.clear(); goLogin(); }
  }

  if (!data.success) {
    const err = new Error(data.errors?.[0] || 'Xəta baş verdi');
    err.messages = data.errors;
    throw err;
  }
  return data.data;
}

const GET  = (path, params) => {
  const qs = params ? '?' + new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([,v]) => v != null && v !== ''))
  ) : '';
  return apiFetch(path + qs);
};
const POST = (path, body) => apiFetch(path, { method:'POST', body: JSON.stringify(body) });
const PUT  = (path, body) => apiFetch(path, { method:'PUT',  body: JSON.stringify(body ?? {}) });
const DEL  = path => apiFetch(path, { method:'DELETE' });

function goLogin() { window.location.href = '../auth/login.html'; }

const aApi = {
  /* Auth */
  profile: () => GET('/account/profile'),
  logout:  () => POST('/account/logout', {}),

  /* Sliders */
  getSliders:    ()    => GET('/Sliders/all'),
  createSlider:   d    => POST('/Sliders', d),
  updateSlider: (id,d) => PUT('/Sliders/'+id, d),
  deleteSlider:  id    => DEL('/Sliders/'+id),

  /* Providers */
  getProviders:    p  => GET('/providers/admin/all', p),
  approveProvider: id => PUT('/providers/'+id+'/approve'),
  rejectProvider:  id => PUT('/providers/'+id+'/reject'),

  /* Services */
  getServices:       p  => GET('/services/admin/all', p),
  deactivateService: id => PUT('/services/'+id+'/admin-deactivate'),
  reactivateService: id => PUT('/services/'+id+'/admin-reactivate'),

  /* Appointments */
  getAppointments: p => GET('/appointments/admin/all', p),

  /* Settings */
  getSettings: () => GET('/SystemSettings'),
  updateSettings: d => PUT('/SystemSettings', d),
  resetSettings: () => DEL('/SystemSettings'),
};

async function requireAdmin() {
  const { access } = Token.get();
  if (!access) { goLogin(); return null; }
  try {
    const p = await aApi.profile();
    if (!p.roles?.includes('Admin')) { goLogin(); return null; }
    return p;
  } catch { goLogin(); return null; }
}

/* Helpers */
function formatDate(d, opts) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('az-AZ', opts || { day:'numeric', month:'short', year:'numeric' });
}
function formatTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('az-AZ', { hour:'2-digit', minute:'2-digit' });
}
function formatPrice(v) { return (Number(v)||0).toFixed(0) + ' AZN'; }

const STATUS_BADGE = {
  Confirmed: { cls:'badge-success', label:'Təsdiqləndi', icon:'fa-circle-check' },
  Completed: { cls:'badge-accent',  label:'Tamamlandı',  icon:'fa-star' },
  Cancelled: { cls:'badge-danger',  label:'Ləğv edildi', icon:'fa-circle-xmark' },
  Pending:   { cls:'badge-warning', label:'Gözləyir',    icon:'fa-clock' },
  Approved:  { cls:'badge-success', label:'Təsdiqləndi', icon:'fa-circle-check' },
  Rejected:  { cls:'badge-danger',  label:'Rədd edildi', icon:'fa-circle-xmark' },
};
function badge(status) {
  const b = STATUS_BADGE[status] || { cls:'badge-gray', label:status, icon:'fa-circle' };
  return `<span class="badge ${b.cls}"><i class="fa-solid ${b.icon}"></i> ${b.label}</span>`;
}

function showAlert(sel, msg, type = 'error') {
  const el = document.querySelector(sel);
  if (!el) return;
  const icons = { error:'fa-circle-exclamation', success:'fa-circle-check', warning:'fa-triangle-exclamation' };
  el.className = `alert alert-${type==='success'?'success':type==='warning'?'warning':'error'}`;
  el.innerHTML = `<i class="fa-solid ${icons[type]||icons.error}"></i><span>${msg}</span>`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 6000);
}
function openModal(id)  { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }