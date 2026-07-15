const BASE = 'http://localhost:5291/api';

// const Token = {
//   get: () => ({ access: localStorage.getItem('accessToken'), refresh: localStorage.getItem('refreshToken') }),
//   set: (a, r) => { localStorage.setItem('accessToken', a); localStorage.setItem('refreshToken', r) },
//   clear: () => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken') },
// };

const Token = {
  get: () => ({ access: localStorage.getItem('provider_accessToken'), refresh: localStorage.getItem('provider_refreshToken') }),
  set: (a, r) => { localStorage.setItem('provider_accessToken', a); localStorage.setItem('provider_refreshToken', r) },
  clear: () => { localStorage.removeItem('provider_accessToken'); localStorage.removeItem('provider_refreshToken') },
};

async function apiFetch(path, opts = {}) {
  const { access } = Token.get();
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (access) headers['Authorization'] = 'Bearer ' + access;

  const res = await fetch(BASE + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const { refresh, access: old } = Token.get();
    if (!refresh) { Token.clear(); goLogin(); return; }
    try {
      const r = await fetch(BASE + '/account/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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

const GET = (path, params) => {
  const qs = params ? '?' + new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
  ) : '';
  return apiFetch(path + qs);
};
const POST = (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
const PUT = (path, body) => apiFetch(path, {
  method: 'PUT',
  body: body !== undefined ? JSON.stringify(body) : undefined
});
const DEL = path => apiFetch(path, { method: 'DELETE' });

function goLogin() { window.location.href = '../auth/login.html'; }

const pApi = {
  profile: () => GET('/account/profile'),
  logout: () => POST('/account/logout', {}),
  getMyProfile: () => GET('/providers/me'),
  createProfile: d => POST('/providers', d),
  updateProfile: d => PUT('/providers/me', d),
  like: id => POST('/posts/' + id + '/like', {}),
  unlike: id => DEL('/posts/' + id + '/like'),
  getComments: id => GET('/posts/' + id + '/comments'),
  addComment: (id, d) => POST('/posts/' + id + '/comments', d),
  deleteComment: id => DEL('/posts/comments/' + id),
  updateComment: (id, d) => PUT('/posts/comments/'+id, d),
  getMyServices: () => GET('/services/me'),
  createService: d => POST('/services', d),
  updateService: (id, d) => PUT('/services/' + id, d),
  deleteService: id => DEL('/services/' + id),
  setWorkingHours: d => apiFetch('/WorkingHours', {
    method: 'PUT',
    body: JSON.stringify({ dtos: d })
  }),
  getWorkingHours: () => GET('/providers/me').then(p => GET('/WorkingHours/provider/' + p.id)),
  getUnavailableDays: () => GET('/providers/me').then(p => GET('/UnavailableDays/provider/'+p.id)),
  addUnavailableDay:  d  => POST('/UnavailableDays', d),
  removeUnavailableDay: id => DEL('/UnavailableDays/'+id),
  getCalendar: (from, to) => GET('/appointments/calendar', { from, to }),
  completeAppt: id => PUT('/appointments/' + id + '/complete'),
  cancelAppt: (id, d) => PUT('/appointments/' + id + '/cancel', d || {}),
  rescheduleAppt: (id, d) => PUT('/appointments/' + id + '/reschedule', d),
  getMyPosts: () => GET('/providers/me').then(p => GET('/posts/provider/' + p.id)),
  createPost: d => POST('/posts', d),
  deletePost: id => DEL('/posts/' + id),
  getNotifications: () => GET('/notifications/me'),
  markAllRead: () => PUT('/notifications/read-all'),
};

async function requireProvider() {
  const { access } = Token.get();
  if (!access) { goLogin(); return null; }
  try {
    const p = await pApi.profile();
    if (!p.roles?.includes('Provider')) { goLogin(); return null; }
    return p;
  } catch { goLogin(); return null; }
}

function formatDate(d, opts) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('az-AZ', opts || { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
}
function trimTime(t = '') { return t.slice(0, 5); }
function formatPrice(v) { return (Number(v) || 0).toFixed(0) + ' AZN'; }

const MONTHS_AZ = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun', 'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
const DAYS_SHORT = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'];

const STATUS_MAP = {
  Confirmed: { cls: 'badge-success', label: 'Təsdiqləndi', icon: 'fa-circle-check' },
  Completed: { cls: 'badge-accent', label: 'Tamamlandı', icon: 'fa-star' },
  Cancelled: { cls: 'badge-danger', label: 'Ləğv edildi', icon: 'fa-circle-xmark' },
  Pending: { cls: 'badge-warning', label: 'Gözləyir', icon: 'fa-clock' },
  Rescheduled: { cls: 'badge-info', label: 'Yeniləndi', icon: 'fa-rotate' },
};
function statusBadge(s) {
  const m = STATUS_MAP[s] || { cls: 'badge-gray', label: s, icon: 'fa-circle' };
  return `<span class="badge ${m.cls}"><i class="fa-solid ${m.icon}"></i> ${m.label}</span>`;
}

function showAlert(sel, msg, type = 'error') {
  const el = document.querySelector(sel);
  if (!el) return;
  const icons = { error: 'fa-circle-exclamation', success: 'fa-circle-check', warning: 'fa-triangle-exclamation' };
  el.className = `alert alert-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'error'}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.error}"></i><span>${msg}</span>`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 6000);
}
function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }