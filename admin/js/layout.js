(async function initLayout() {
  const user = await requireAdmin();
  if (!user) return;

  const initials = user.fullName?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'A';
  const path = window.location.pathname.split('/').pop();

  const NAV = [
    {
      section: 'Ümumi', items: [
        { href: 'dashboard.html', icon: 'fa-gauge', label: 'Dashboard' },
      ]
    },
    {
      section: 'İdarəetmə', items: [
        { href: 'sliders.html', icon: 'fa-images', label: 'Sliderlər' },
        { href: 'providers.html', icon: 'fa-building', label: 'Providerlər' },
        { href: 'services.html', icon: 'fa-briefcase-medical', label: 'Xidmətlər' },
        { href: 'appointments.html', icon: 'fa-calendar-check', label: 'Rezervasiyalar' },
      ]
    },
    {
      section: 'Sistem', items: [
        { href: 'settings.html', icon: 'fa-gear', label: 'Sistem Qaydaları' },
      ]
    },
  ];

  let navHTML = '';
  NAV.forEach(s => {
    navHTML += `<div class="nav-label">${s.section}</div>`;
    s.items.forEach(item => {
      navHTML += `
        <a href="${item.href}" class="nav-item ${path === item.href ? 'active' : ''}">
          <i class="fa-solid ${item.icon}"></i>
          <span>${item.label}</span>
        </a>`;
    });
  });

  const sb = document.getElementById('sidebar');
  if (sb) sb.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon"><i class="fa-solid fa-shield-halved"></i></div>
        <div class="brand-name">Appointment<small>ADMIN</small></div>
      </div>
      <nav class="sidebar-nav">${navHTML}</nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="s-avatar">${initials}</div>
          <div class="s-info"><b>${user.fullName}</b><small>Administrator</small></div>
        </div>
        <button class="btn-logout" onclick="doLogout()">
          <i class="fa-solid fa-right-from-bracket"></i> Çıxış et
        </button>
      </div>
    </div>`;

  const sub = document.getElementById('topbarSub');
  if (sub) sub.textContent = formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' });
})();

async function doLogout() {
  try { await aApi.logout(); } catch { }
  Token.clear();
  window.location.href = '../auth/login.html';
}