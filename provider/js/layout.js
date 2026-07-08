(async function initLayout() {
  const user = await requireProvider();
  if (!user) return;
  
  const providerProfile = await pApi.getMyProfile().catch(() => null);
  const initials = user.fullName?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'P';
  const path = window.location.pathname.split('/').pop();

  const NAV = [
    {
      section: 'Ümumi', items: [
        { href: 'dashboard.html', icon: 'fa-gauge', label: 'Dashboard' },
        { href: 'notifications.html', icon: 'fa-bell', label: 'Bildirişlər', badge: true },
      ]
    },
    {
      section: 'Biznes', items: [
        { href: 'profile.html', icon: 'fa-building', label: 'Profil' },
        { href: 'services.html', icon: 'fa-briefcase-medical', label: 'Xidmətlər' },
        { href: 'working-hours.html', icon: 'fa-clock', label: 'İş Saatları' },
        { href: 'unavailable-days.html', icon: 'fa-calendar-xmark', label: 'Bağlı Günlər' },
      ]
    },
    {
      section: 'Görüşlər', items: [
        { href: 'appointments.html', icon: 'fa-calendar-check', label: 'Rezervasiyalar' },
        { href: 'calendar.html', icon: 'fa-calendar-days', label: 'Təqvim' },
      ]
    },
    {
      section: 'Sosial', items: [
        { href: 'posts.html', icon: 'fa-images', label: 'Postlar' },
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
          ${item.badge ? `<span class="nav-badge hidden" id="notifBadge">0</span>` : ''}
        </a>`;
    });
  });

  const sb = document.getElementById('sidebar');
  if (sb) sb.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon"><i class="fa-solid fa-calendar-check"></i></div>
        <div class="brand-name">Appointment<small>PROVIDER</small></div>
      </div>
      <nav class="sidebar-nav">${navHTML}</nav>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="s-avatar" style="overflow:hidden;padding:0">
               ${providerProfile?.imageUrl ? `<img src="${providerProfile.imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : initials}
          </div>
          <div class="s-info"><b>${user.fullName}</b><small>Provider</small></div>
        </div>
        <button class="btn-logout" onclick="doLogout()">
          <i class="fa-solid fa-right-from-bracket"></i> Çıxış et
        </button>
      </div>
    </div>`;

  const sub = document.getElementById('topbarSub');
  if (sub) sub.textContent = formatDate(new Date().toISOString(), { weekday: 'long', day: 'numeric', month: 'long' });

  pApi.getNotifications().then(data => {
    const unread = (Array.isArray(data) ? data : []).filter(n => !n.isRead).length;
    const badge = document.getElementById('notifBadge');
    if (badge && unread > 0) { badge.textContent = unread > 9 ? '9+' : unread; badge.classList.remove('hidden'); }
  }).catch(() => { });
})();

async function doLogout() {
  try { await pApi.logout(); } catch { }
  Token.clear();
  window.location.href = '../auth/login.html';
}