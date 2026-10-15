// Fills the per-identity content (H1, logo, symbol, quilt tiles) from
// brand/identities.json and builds the floating identity switcher.
(async function () {
  const THEME_KEY = 'gmore-theme';
  const OPEN_KEY = 'gmore-switcher-open';
  const root = document.documentElement;

  const { identities } = await (await fetch('brand/identities.json')).json();
  const byId = new Map(identities.map(i => [i.id, i]));
  const asset = p => 'brand/' + p;

  const store = (key, value) => { try { localStorage.setItem(key, value); } catch (e) {} };
  const read = key => { try { return localStorage.getItem(key); } catch (e) { return null; } };

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
    const url = new URL(location.href);
    url.searchParams.set('theme', identity.id);
    history.replaceState(null, '', url);
    updateSwitcher(identity);
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
        el('span', { class: 'idsel-badge', text: `${g.members.length} variantes` }),
      ]),
      el('div', { class: 'idsel-variants' }, g.members.map(m =>
        option(m, capitalize(m.name.slice(title.length).replace(/^[\s:(]+|\)$/g, '')), 'idsel-variant'))),
    ]);
  }));

  const copy = el('button', { type: 'button', class: 'idsel-copy', text: 'Copiar enlace', onclick: copyLink });
  const panel = el('div', { class: 'idsel-panel', id: 'idsel-panel', role: 'dialog', 'aria-label': 'Identidad visual' }, [
    el('p', { class: 'idsel-title', text: 'Identidad visual' }),
    el('p', { class: 'idsel-sub', text: 'Elige una propuesta para ver la web con ella.' }),
    list,
    el('div', { class: 'idsel-foot' }, [copy, el('span', { class: 'idsel-hint', text: 'Esc para cerrar' })]),
  ]);

  const barThumb = el('img', { class: 'idsel-thumb', alt: '' });
  const barId = el('b');
  const barName = el('span', { class: 'idsel-now-name' });
  const toggle = el('button', {
    type: 'button', class: 'idsel-toggle', 'aria-controls': 'idsel-panel', title: 'Ver todas las identidades',
    onclick: () => setOpen(panel.hidden),
  }, [
    barThumb,
    el('span', { class: 'idsel-now' }, [el('span', { class: 'idsel-kicker' }, ['Identidad ', barId]), barName]),
    el('span', { class: 'idsel-chev', 'aria-hidden': 'true' }),
  ]);
  const step = (dir, label, glyph) => el('button', {
    type: 'button', class: 'idsel-step', 'aria-label': label, title: label, text: glyph,
    onclick: () => {
      const i = identities.findIndex(x => x.id === root.dataset.theme);
      applyIdentity(identities[(i + dir + identities.length) % identities.length].id);
    },
  });
  const bar = el('div', { class: 'idsel-bar' }, [
    step(-1, 'Identidad anterior', '‹'), toggle, step(1, 'Identidad siguiente', '›'),
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

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      copy.textContent = 'Enlace copiado';
    } catch (e) {
      copy.textContent = 'No se pudo copiar';
    }
    setTimeout(() => { copy.textContent = 'Copiar enlace'; }, 1600);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); toggle.focus(); }
  });
  // Clicking the page closes the panel.
  document.addEventListener('click', e => {
    if (!panel.hidden && !switcher.contains(e.target)) setOpen(false);
  });

  document.body.append(switcher);
  // First visit on a wide screen: show the panel so the switcher is discovered.
  const remembered = read(OPEN_KEY);
  setOpen(remembered === null ? matchMedia('(min-width: 700px)').matches : remembered === '1');
  applyIdentity(root.dataset.theme);
})();
