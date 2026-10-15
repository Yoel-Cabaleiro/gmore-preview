// Header behaviour: hamburger menu under 900px, and a sticky header that hides
// while scrolling down and comes back when scrolling up (or, with a mouse,
// when the pointer reaches the top edge).
(function () {
  const header = document.querySelector('.site-header');
  const toggle = header.querySelector('.nav-toggle');
  const nav = document.getElementById('main-nav');
  const mobile = matchMedia('(max-width: 900px)');

  // ── Mobile menu ─────────────────────────────────────────────────────────
  const isOpen = () => header.classList.contains('nav-open');
  function setMenu(open) {
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) header.classList.remove('is-hidden');
  }
  toggle.addEventListener('click', () => setMenu(!isOpen()));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', e => { if (isOpen() && !header.contains(e.target)) setMenu(false); });
  mobile.addEventListener('change', () => setMenu(false));

  // ── Hide on scroll down, reveal on scroll up ────────────────────────────
  const DELTA = 6; // ignore tiny scroll jitter
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    if (isOpen() || y <= header.offsetHeight) {
      header.classList.remove('is-hidden');
      lastY = y;
      return;
    }
    if (Math.abs(y - lastY) < DELTA) return;
    header.classList.toggle('is-hidden', y > lastY);
    lastY = y;
  }, { passive: true });

  // Pointer near the top edge, or keyboard focus inside the header, reveals it.
  addEventListener('mousemove', e => {
    if (e.clientY < 24) header.classList.remove('is-hidden');
  }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
})();
