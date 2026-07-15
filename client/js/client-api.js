const BASE = 'http://localhost:5291/api';

// const Token = {
//     get: () => ({ access: localStorage.getItem('accessToken'), refresh: localStorage.getItem('refreshToken') }),
//     set: (a, r) => { localStorage.setItem('accessToken', a); localStorage.setItem('refreshToken', r) },
//     clear: () => { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken') },
// };

const Token = {
    get: () => ({ access: localStorage.getItem('client_accessToken'), refresh: localStorage.getItem('client_refreshToken') }),
    set: (a, r) => { localStorage.setItem('client_accessToken', a); localStorage.setItem('client_refreshToken', r) },
    clear: () => { localStorage.removeItem('client_accessToken'); localStorage.removeItem('client_refreshToken') },
};

async function apiFetch(path, opts = {}) {
    const { access } = Token.get();
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (access) headers['Authorization'] = 'Bearer ' + access;

    const res = await fetch(BASE + path, { ...opts, headers });
    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
        const { refresh, access: old } = Token.get();
        if (!refresh) { Token.clear(); return null; }
        try {
            const r = await fetch(BASE + '/account/refresh', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessToken: old, refreshToken: refresh }),
            });
            const rd = await r.json();
            Token.set(rd.data.accessToken, rd.data.refreshToken);
            return apiFetch(path, opts);
        } catch { Token.clear(); return null; }
    }

    if (!data.success) {
        const err = new Error(data.errors?.[0] || 'Xəta baş verdi');
        err.messages = data.errors; err.status = res.status;
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
const PUT = (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body ?? {}) });
const DEL = path => apiFetch(path, { method: 'DELETE' });

const cApi = {
    /* Auth */
    profile: () => GET('/account/profile'),
    logout: () => POST('/account/logout', {}),

    /* Sliders */
    getSliders: () => GET('/Sliders'),

    /* Providers */
    getProviders: p => GET('/providers', p),
    getProvider: id => GET('/providers/' + id),

    /* Services */
    getCatalog: () => GET('/services/catalog'),
    getByProvider: id => GET('/services/provider/' + id),

    /* Availability */
    getSlots: (providerId, serviceId, date) =>
        GET('/availability', { providerId, serviceId, date }),

    /* Appointments */
    book: d => POST('/appointments/book', d),
    getMy: f => GET('/appointments/me', f ? { filter: f } : {}),
    getById: id => GET('/appointments/' + id),
    cancel: (id, d) => PUT('/appointments/' + id + '/cancel', d || {}),
    reschedule: (id, d) => PUT('/appointments/' + id + '/reschedule', d),

    /* Reviews */
    createReview: d => POST('/reviews', d),
    getReviews: id => GET('/reviews/provider/' + id),

    /* Posts */
    getPostsByProvider: id => GET('/posts/provider/' + id),
    likePost: id => POST('/posts/' + id + '/like', {}),
    unlikePost: id => DEL('/posts/' + id + '/like'),
    getComments: id => GET('/posts/' + id + '/comments'),
    addComment: (id, d) => POST('/posts/' + id + '/comments', d),

    /* Follow */
    follow: id => POST('/follow/' + id, {}),
    unfollow: id => DEL('/follow/' + id),
    followStatus: id => GET('/follow/' + id + '/status'),

    /* Notifications */
    getNotifications: () => GET('/notifications/me'),
    markAllRead: () => PUT('/notifications/read-all'),
};

/* ── Helpers ── */
function formatDate(d, opts) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('az-AZ', opts || { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
}
function formatPrice(v) { return (Number(v) || 0).toFixed(0) + ' AZN'; }
function trimTime(t = '') { return t.slice(0, 5); }

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

function requireAuth() {
    const { access } = Token.get();
    if (!access) { window.location.href = '../auth/login.html'; return false; }
    return true;
}