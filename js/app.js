// Fills the per-identity content (H1, logo, symbol, quilt tiles) from
// brand/identities.json and builds the floating identity switcher, including
// a desktop-only "mobile view" that shows the page in a 390px phone frame.
(async function () {
  const THEME_KEY = 'gmore-theme';
  const OPEN_KEY = 'gmore-switcher-open';
  const MOBILE_WIDTH = 390;
  const root = document.documentElement;
  // Inside the mobile-view frame the page is shown bare: no switcher.
  const framed = window.self !== window.top;

  const { identities } = await (await fetch('brand/identities.json')).json();
  const byId = new Map(identities.map(i => [i.id, i]));
  const asset = p => 'brand/' + p;

  const store = (key, value) => { try { localStorage.setItem(key, value); } catch (e) {} };
  const read = key => { try { return localStorage.getItem(key); } catch (e) { return null; } };
  const setParam = (name, value) => {
    const url = new URL(location.href);
    if (value === null) url.searchParams.delete(name);
    else url.searchParams.set(name, value);
    history.replaceState(null, '', url);
  };

  let frame = null; // the mobile-view iframe, when shown

  function applyIdentity(id) {
    const identity = byId.get(id) || identities[0];
    root.dataset.theme = identity.id;
    document.title = `G-MoRE web, identity ${identity.id}: ${identity.name}`;

    // content.h1 is trusted markup from the brand package (identity 6 uses <em>).
    document.querySelector('.hero-title').innerHTML = identity.content.h1;
    document.querySelectorAll('.logo').forEach(img => { img.src = asset(identity.assets.logo); });
    document.querySelector('.hero-symbol').src = asset(identity.assets.symbol);
    const tiles = identity.assets.avatar_tiles || [];
    document.querySelectorAll('.avatar-tile').forEach((img, i) => {
      if (tiles[i]) img.src = asset(tiles[i]);
      else img.removeAttribute('src');
    });

    store(THEME_KEY, identity.id);
    setParam('theme', identity.id);
    if (framed) return;
    updateSwitcher(identity);
    if (frame) {
      const inner = frame.contentWindow;
      if (inner && inner.gmoreApply) inner.gmoreApply(identity.id);
      else frame.src = frameUrl();
    }
  }

  if (framed) {
    window.gmoreApply = applyIdentity;
    applyIdentity(root.dataset.theme);
    return;
  }

  // ── Switcher ────────────────────────────────────────────────────────────
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    }
    node.append(...children);
    return node;
  };
  const ICONS = {
    desktop: '<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8 20.5h8M12 16.5v4"/>',
    mobile: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  };
  const icon = name => {
    const span = el('span', { class: 'idsel-icon', 'aria-hidden': 'true' });
    span.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
    return span;
  };
  const thumb = identity => el('img', { class: 'idsel-thumb', src: asset(identity.assets.symbol), alt: '' });
  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

  // Group identities (3, 3b, 3c share group "3"). A group's title is the common
  // start of its members' names; each variant keeps the rest ("colour shared out").
  const groups = [];
  for (const identity of identities) {
    let group = groups.find(g => g.id === identity.group);
    if (!group) groups.push(group = { id: identity.group, members: [] });
    group.members.push(identity);
  }
  const commonStart = names => {
    let n = 0;
    while (names.every(s => s[n] !== undefined && s[n] === names[0][n])) n++;
    return names[0].slice(0, n).replace(/[\s:(]+$/, '');
  };

  const option = (identity, label, extraClass = '') => el('button', {
    type: 'button', class: `idsel-opt ${extraClass}`.trim(), 'data-id': identity.id, title: identity.name,
    onclick: () => applyIdentity(identity.id),
  }, [
    ...(extraClass ? [] : [thumb(identity)]),
    el('span', { class: 'idsel-num', text: identity.id }),
    el('span', { class: 'idsel-label', text: label }),
  ]);

  const list = el('ul', { class: 'idsel-list' }, groups.map(g => {
    if (g.members.length === 1) return el('li', {}, [option(g.members[0], g.members[0].name)]);
    const title = commonStart(g.members.map(m => m.name));
    return el('li', { class: 'idsel-group', role: 'group', 'aria-label': `${g.id}: ${title}` }, [
      el('div', { class: 'idsel-group-head' }, [
        thumb(g.members[0]),
        el('span', { class: 'idsel-num', text: g.id }),
        el('span', { class: 'idsel-label', text: title }),
        el('span', { class: 'idsel-badge', text: `${g.members.length} variants` }),
      ]),
      el('div', { class: 'idsel-variants' }, g.members.map(m =>
        option(m, capitalize(m.name.slice(title.length).replace(/^[\s:(]+|\)$/g, '')), 'idsel-variant'))),
    ]);
  }));

  // Desktop / mobile view (hidden on small screens, where the page is already mobile).
  const viewOption = (mobile, label) => el('button', {
    type: 'button', class: 'idsel-seg', 'data-view': mobile ? 'mobile' : 'desktop',
    onclick: () => setView(mobile),
  }, [icon(mobile ? 'mobile' : 'desktop'), el('span', { text: label })]);
  const viewRow = el('div', { class: 'idsel-viewrow' }, [
    el('span', { class: 'idsel-viewlabel', text: 'View' }),
    el('div', { class: 'idsel-segs', role: 'group', 'aria-label': 'View' }, [
      viewOption(false, 'Desktop'), viewOption(true, `Mobile · ${MOBILE_WIDTH} px`),
    ]),
  ]);

  const copy = el('button', { type: 'button', class: 'idsel-copy', text: 'Copy link', onclick: copyLink });
  const panel = el('div', { class: 'idsel-panel', id: 'idsel-panel', role: 'dialog', 'aria-label': 'Visual identity' }, [
    el('p', { class: 'idsel-title', text: 'Visual identity' }),
    el('p', { class: 'idsel-sub', text: 'Pick a proposal to preview the site with it.' }),
    viewRow,
    list,
    el('div', { class: 'idsel-foot' }, [copy, el('span', { class: 'idsel-hint', text: 'Esc to close' })]),
  ]);

  const barThumb = el('img', { class: 'idsel-thumb', alt: '' });
  const barId = el('b');
  const barName = el('span', { class: 'idsel-now-name' });
  const toggle = el('button', {
    type: 'button', class: 'idsel-toggle', 'aria-controls': 'idsel-panel', title: 'Show all identities',
    onclick: () => setOpen(panel.hidden),
  }, [
    barThumb,
    el('span', { class: 'idsel-now' }, [el('span', { class: 'idsel-kicker' }, ['Identity ', barId]), barName]),
    el('span', { class: 'idsel-chev', 'aria-hidden': 'true' }),
  ]);
  const step = (dir, label, glyph) => el('button', {
    type: 'button', class: 'idsel-step', 'aria-label': label, title: label, text: glyph,
    onclick: () => {
      const i = identities.findIndex(x => x.id === root.dataset.theme);
      applyIdentity(identities[(i + dir + identities.length) % identities.length].id);
    },
  });
  const viewButton = el('button', {
    type: 'button', class: 'idsel-viewbtn', 'aria-label': 'Mobile view', onclick: () => setView(!frame),
  }, [icon('mobile')]);
  const bar = el('div', { class: 'idsel-bar' }, [
    step(-1, 'Previous identity', '‹'), toggle, step(1, 'Next identity', '›'), viewButton,
  ]);
  const switcher = el('div', { class: 'idsel' }, [panel, bar]);

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    switcher.classList.toggle('is-open', open);
    store(OPEN_KEY, open ? '1' : '0');
  }

  function updateSwitcher(identity) {
    barThumb.src = asset(identity.assets.symbol);
    barId.textContent = identity.id;
    barName.textContent = identity.name;
    list.querySelectorAll('.idsel-opt').forEach(b => {
      b.setAttribute('aria-pressed', String(b.dataset.id === identity.id));
    });
  }

  // ── Mobile view ─────────────────────────────────────────────────────────
  const narrow = matchMedia('(max-width: 700px)');
  let stage = null;
  const frameUrl = () => `index.html?theme=${encodeURIComponent(root.dataset.theme)}`;

  function setView(mobile) {
    mobile = mobile && !narrow.matches;
    if (mobile && !stage) {
      frame = el('iframe', { class: 'idsel-frame', title: `Mobile view (${MOBILE_WIDTH} px)`, src: frameUrl() });
      stage = el('div', { class: 'idsel-stage' }, [
        el('div', { class: 'idsel-phone' }, [frame]),
        el('p', { class: 'idsel-stage-label', text: `Mobile view · ${MOBILE_WIDTH} px` }),
      ]);
      document.body.insertBefore(stage, switcher);
    } else if (!mobile && stage) {
      stage.remove();
      stage = frame = null;
    }
    root.classList.toggle('is-mobile-view', mobile);
    viewRow.querySelectorAll('.idsel-seg').forEach(b => {
      b.setAttribute('aria-pressed', String((b.dataset.view === 'mobile') === mobile));
    });
    viewButton.setAttribute('aria-pressed', String(mobile));
    viewButton.title = mobile ? 'Back to desktop view' : `View on mobile (${MOBILE_WIDTH} px)`;
    setParam('view', mobile ? 'mobile' : null);
  }
  // A window made narrow is already the real responsive page.
  narrow.addEventListener('change', () => { if (narrow.matches && frame) setView(false); });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      copy.textContent = 'Link copied';
    } catch (e) {
      copy.textContent = 'Could not copy';
    }
    setTimeout(() => { copy.textContent = 'Copy link'; }, 1600);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); toggle.focus(); }
  });
  // Clicking the page (or the mobile-view backdrop) closes the panel.
  document.addEventListener('click', e => {
    if (!panel.hidden && !switcher.contains(e.target)) setOpen(false);
  });

  document.body.append(switcher);
  // First visit on a wide screen: show the panel so the switcher is discovered.
  const remembered = read(OPEN_KEY);
  setOpen(remembered === null ? matchMedia('(min-width: 700px)').matches : remembered === '1');
  applyIdentity(root.dataset.theme);
  setView(new URLSearchParams(location.search).get('view') === 'mobile');
})();
