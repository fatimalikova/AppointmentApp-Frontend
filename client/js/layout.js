(async function initLayout() {
  const { access } = Token.get();
  let profile = null;
  if (access) {
    try {
      profile = await cApi.profile();
    } catch { Token.clear(); }
  }

  const path = window.location.pathname.split('/').pop();
  const isLoggedIn = !!profile;
  const initials = profile?.fullName?.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() || '';

  /* ── NAVBAR ── */
  const nb = document.getElementById('navbar');
  if (!nb) return;

  nb.innerHTML = `
<nav class="navbar" id="mainNav">
  <div class="container nav-inner">
    <a href="../pages/home.html" class="nav-brand">
      <div class="nav-brand-icon"><i class="fa-solid fa-calendar-check"></i></div>
      <div class="nav-brand-name">Appointment<small>SYSTEM</small></div>
    </a>

    <div class="nav-links">
      <a href="../pages/home.html"          class="nav-link ${path === 'home.html' ? 'active' : ''}">Ana səhifə</a>
      <a href="../pages/providers.html"     class="nav-link ${path === 'providers.html' ? 'active' : ''}">Mütəxəssislər</a>
      ${isLoggedIn ? `
      <a href="../pages/booking.html"       class="nav-link ${path === 'booking.html' ? 'active' : ''}">Rezervasiya</a>
      <a href="../pages/appointments.html"  class="nav-link ${path === 'appointments.html' ? 'active' : ''}">Görüşlərim</a>
      ` : ''}
    </div>

    <div class="nav-actions">
      ${isLoggedIn ? `
        <div class="notif-wrap" style="position:relative">
          <button class="notif-btn" id="notifBtn">
            <i class="fa-regular fa-bell"></i>
            <span class="notif-dot hidden" id="notifDot"></span>
          </button>
          <div id="notifDropdown" class="hidden" style="
            position:absolute;right:0;top:calc(100% + 8px);
            width:320px;background:var(--surface);
            border:1px solid var(--border);border-radius:var(--r-md);
            box-shadow:var(--shadow-lg);z-index:200;overflow:hidden;
          ">
            <div style="padding:12px 16px;font-weight:700;font-size:var(--fs-sm);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
              Bildirişlər
              <button onclick="markAllRead()" style="font-size:var(--fs-xs);color:var(--accent-dark);background:none;border:none;cursor:pointer;font-weight:600">Hamısı oxundu</button>
            </div>
            <div id="notifList" style="max-height:300px;overflow-y:auto">
              <div style="padding:16px;text-align:center;font-size:var(--fs-sm);color:var(--ink-soft)">Yüklənir...</div>
            </div>
          </div>
        </div>

        <div class="user-menu">
          <button class="user-btn" id="userBtn">
            <div class="user-avatar" style="overflow:hidden;padding:0">
  ${profile.imageUrl
        ? `<img src="${profile.imageUrl}" alt="${profile.fullName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
        : initials}
</div>
            <span>${profile.fullName.split(' ')[0]}</span>
            <i class="fa-solid fa-chevron-down" style="font-size:.65rem;color:var(--ink-soft)"></i>
          </button>
          <div class="user-dropdown hidden" id="userDropdown">
            <div style="padding:8px 12px;font-size:var(--fs-xs);color:var(--ink-soft);border-bottom:1px solid var(--border);margin-bottom:4px">${profile.email || ''}</div>
            <a href="../pages/dashboard.html"><i class="fa-solid fa-gauge"></i> Profile</a>
            <a href="../pages/appointments.html"><i class="fa-solid fa-calendar-check"></i> Görüşlərim</a>
            <a href="../pages/notifications.html"><i class="fa-solid fa-bell"></i> Bildirişlər</a>
            <hr class="dropdown-sep">
            <button onclick="doLogout()"><i class="fa-solid fa-right-from-bracket"></i> Çıxış et</button>
          </div>
        </div>
      ` : `
        <a href="../auth/login.html" class="btn btn-ghost btn-sm">Giriş</a>
        <a href="../auth/register.html" class="btn btn-primary btn-sm">
          <i class="fa-solid fa-user-plus"></i> Qeydiyyat
        </a>
      `}
    </div>
  </div>
</nav>`;

  /* Scroll effect */
  window.addEventListener('scroll', () => {
    document.getElementById('mainNav')?.classList.toggle('scrolled', window.scrollY > 20);
  });

  /* Dropdowns */
  if (isLoggedIn) {
    document.getElementById('userBtn')?.addEventListener('click', e => {
      e.stopPropagation();
      document.getElementById('userDropdown')?.classList.toggle('hidden');
    });
    document.getElementById('notifBtn')?.addEventListener('click', e => {
      e.stopPropagation();
      const dd = document.getElementById('notifDropdown');
      dd?.classList.toggle('hidden');
      if (!dd?.classList.contains('hidden')) loadNotifications();
    });
    document.addEventListener('click', () => {
      document.getElementById('userDropdown')?.classList.add('hidden');
      document.getElementById('notifDropdown')?.classList.add('hidden');
    });
  }

  /* ── FOOTER ── */
  const ft = document.getElementById('footer');
  if (ft) {
    ft.innerHTML = `
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">Appointment System</div>
        <p class="footer-brand-tagline">Xidmət göstərən hər bizneslə müştərilərini real-time əlaqələndirən platforma.</p>
        <div class="footer-social">
          <a href="https://www.facebook.com/login/" class="social-btn"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="https://www.instagram.com/accounts/login/" class="social-btn"><i class="fa-brands fa-instagram"></i></a>
          <a href="https://www.linkedin.com/feed/" class="social-btn"><i class="fa-brands fa-linkedin-in"></i></a>
          <a href="https://x.com/" class="social-btn"><i class="fa-brands fa-twitter"></i></a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Keçidlər</h4>
        <a href="../pages/home.html">Ana səhifə</a>
        <a href="../pages/providers.html">Mütəxəssislər</a>
        <a href="../pages/booking.html">Rezervasiya</a>
        <a href="../pages/appointments.html">Görüşlərim</a>
      </div>
      <div class="footer-col">
        <h4>Biznes</h4>
        <a href="../../provider/auth/login.html">Provider girişi</a>
        <a href="../../provider/auth/register.html">Provider qeydiyyatı</a>
      </div>
      <div class="footer-col">
        <h4>Əlaqə</h4>
        <p><i class="fa-solid fa-phone" style="margin-right:6px;color:var(--accent-light)"></i>+994 55 215 63 29</p>
        <p><i class="fa-solid fa-envelope" style="margin-right:6px;color:var(--accent-light)"></i>fmelikova49@gmail.com</p>
        <p><i class="fa-solid fa-location-dot" style="margin-right:6px;color:var(--accent-light)"></i>Bakı, Azərbaycan</p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Appointment System. Bütün hüquqlar qorunur.</span>
    </div>
  </div>
</footer>`;
  }
})();

async function loadNotifications() {
  const list = document.getElementById('notifList');
  if (!list) return;
  try {
    const notifs = await cApi.getNotifications();
    const arr = Array.isArray(notifs) ? notifs : [];
    const unread = arr.filter(n => !n.isRead).length;
    if (unread > 0) document.getElementById('notifDot')?.classList.remove('hidden');

    if (!arr.length) {
      list.innerHTML = '<div style="padding:16px;text-align:center;font-size:var(--fs-sm);color:var(--ink-soft)">Bildiriş yoxdur</div>';
      return;
    }
    list.innerHTML = arr.slice(0, 8).map(n => `
      <div style="display:flex;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border);${!n.isRead ? 'background:var(--accent-xsoft)' : ''}">
        <div style="flex:1;min-width:0">
          <strong style="display:block;font-size:var(--fs-sm)">${n.title}</strong>
          <span style="font-size:var(--fs-xs);color:var(--ink-soft)">${n.message}</span>
        </div>
        ${!n.isRead ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--accent);margin-top:4px;flex-shrink:0"></div>' : ''}
      </div>`).join('');
  } catch {
    list.innerHTML = '<div style="padding:16px;text-align:center;font-size:var(--fs-sm);color:var(--danger)">Yükləmə xətası</div>';
  }
}

async function markAllRead() {
  try {
    await cApi.markAllRead();
    document.getElementById('notifDot')?.classList.add('hidden');
    loadNotifications();
  } catch { }
}

async function doLogout() {
  try { await cApi.logout(); } catch { }
  Token.clear();
  window.location.href = '../pages/home.html';
}