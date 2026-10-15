// Visual check: screenshots every brand/reference/<id>.html (baseline) and
// index.html?theme=<id>, then compares them section by section (header, hero,
// about, projects, call, people, footer), so a change in one section's height
// does not show up as a difference in every section below it.
// Also checks the switcher, the mobile menu and the sticky header.
// Usage: node tools/compare.mjs [width ...]   (default 1440 390)
// Output: tools/shots/<width>/{ref,site}-<id>.png (full page),
//         diff-<id>-<section>.png (only where they differ) and tools/shots/report.md
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { serve } from './serve.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outRoot = path.join(here, 'shots');
const widths = process.argv.slice(2).map(Number).filter(Boolean);
if (!widths.length) widths.push(1440, 390);

const { identities } = JSON.parse(await readFile(path.join(root, 'brand/identities.json'), 'utf8'));
const ids = identities.map(i => i.id);
const SECTIONS = { header: 'header', hero: '#top', about: '#about', projects: '#projects', call: '#call', people: '#people', footer: 'footer' };
// Preview-only UI is left out of the site screenshots: the switcher, and the
// sticky behaviour (so section crops never include an overlapping header).
const SITE_SHOT_CSS = '.idsel{display:none!important}.site-header{position:static!important;transform:none!important}';

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();

async function shoot(url, width, file, { site = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const problems = [];
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('requestfailed', r => problems.push(`failed: ${r.url()}`));
  page.on('response', r => { if (r.status() >= 400) problems.push(`${r.status()}: ${r.url()}`); });
  const external = [];
  page.on('request', r => { if (!r.url().startsWith(base)) external.push(r.url()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  if (site) await page.addStyleTag({ content: SITE_SHOT_CSS });
  await page.evaluate(() => document.fonts.ready);
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family} ${f.style} ${f.weight}`));
  await page.screenshot({ path: file, fullPage: true });
  const sections = {};
  for (const [name, sel] of Object.entries(SECTIONS)) {
    sections[name] = PNG.sync.read(await page.locator(sel).first().screenshot());
  }
  await context.close();
  return { problems, external, sections, fonts: [...new Set(fonts)] };
}

function pad(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  out.data.fill(0); // transparent → counts as different where the other image has content
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

async function compare(ref, site, diffFile) {
  const w = Math.max(ref.width, site.width), h = Math.max(ref.height, site.height);
  const sizeNote = ref.height !== site.height ? ` (height ${ref.height}→${site.height})` : '';
  const diff = new PNG({ width: w, height: h });
  const count = pixelmatch(pad(ref, w, h).data, pad(site, w, h).data, diff.data, w, h, { threshold: 0.1, includeAA: false });
  if (count) await writeFile(diffFile, PNG.sync.write(diff));
  return { count, sizeNote };
}

const report = [`# Visual comparison`, '', `Generated ${new Date().toISOString()}`, '',
  'Differences per section, in pixels. Sections not listed match exactly.', ''];

for (const width of widths) {
  const dir = path.join(outRoot, String(width));
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  report.push(`## ${width} px`, '', '| id | differing sections | issues |', '|---|---|---|');
  for (const id of ids) {
    const ref = await shoot(`${base}brand/reference/${id}.html`, width, path.join(dir, `ref-${id}.png`));
    const site = await shoot(`${base}index.html?theme=${id}`, width, path.join(dir, `site-${id}.png`), { site: true });
    const parts = [];
    for (const name of Object.keys(SECTIONS)) {
      const r = await compare(ref.sections[name], site.sections[name], path.join(dir, `diff-${id}-${name}.png`));
      if (r.count || r.sizeNote) parts.push(`${name}: ${r.count}${r.sizeNote}`);
    }
    const sections = parts.join(', ') || 'none';
    const issues = [...site.problems, ...site.external.map(u => `external: ${u}`)].join('<br>') || 'none';
    report.push(`| ${id} | ${sections} | ${issues} |`);
    console.log(`${width}px ${id}: ${sections}${site.problems.length || site.external.length ? '  ISSUES: ' + issues : ''}`);
    if (width === widths[0] && id === ids[0]) console.log('  fonts loaded on site:', site.fonts.join(' | '));
  }
  report.push('');
}

// ── Behaviour checks: URL, persistence, switcher ─────────────────────────────
const checks = [];
const check = (name, ok, detail = '') => { checks.push(`- ${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`); };
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const theme = () => page.evaluate(() => document.documentElement.dataset.theme);
  await page.goto(`${base}index.html`, { waitUntil: 'networkidle' });
  const panelOpen = () => page.locator('#idsel-panel').isVisible();
  check('default identity is 1', await theme() === '1');
  check('URL reflects default', new URL(page.url()).searchParams.get('theme') === '1', page.url());
  check('switcher panel open on first visit (wide screen)', await panelOpen());
  await page.goto(`${base}index.html?theme=3b`, { waitUntil: 'networkidle' });
  check('?theme=3b applies 3b', await theme() === '3b');
  await page.goto(`${base}index.html`, { waitUntil: 'networkidle' });
  check('reload without ?theme remembers 3b', await theme() === '3b', page.url());
  await page.goto(`${base}index.html?theme=nope`, { waitUntil: 'networkidle' });
  check('invalid ?theme falls back to the remembered one', await theme() === '3b', page.url());
  const groupIds = await page.locator('.idsel-group .idsel-opt').evaluateAll(bs => bs.map(b => b.dataset.id));
  check('3, 3b, 3c grouped', groupIds.join(',') === '3,3b,3c', groupIds.join(','));
  const variants = await page.locator('.idsel-group .idsel-label').allTextContents();
  check('group and variant labels', true, variants.join(' | '));
  await page.click('.idsel-opt[data-id="5"]');
  check('click 5 applies 5', await theme() === '5');
  check('URL updated to ?theme=5', new URL(page.url()).searchParams.get('theme') === '5', page.url());
  check('H1 swapped', (await page.textContent('.hero-title')) === 'Every member adds a piece.');
  check('bar shows current identity', (await page.textContent('.idsel-now-name')) === 'Quilt');
  await page.click('.idsel-step[aria-label="Next identity"]');
  check('next arrow goes 5 → 6', await theme() === '6');
  await page.click('.idsel-step[aria-label="Next identity"]');
  check('next arrow wraps 6 → 1', await theme() === '1');
  await page.click('.idsel-step[aria-label="Previous identity"]');
  check('previous arrow goes 1 → 6', await theme() === '6');
  await page.keyboard.press('Escape');
  check('Escape collapses switcher', !(await panelOpen()));
  await page.reload({ waitUntil: 'networkidle' });
  check('reload keeps 6 and collapsed state', await theme() === '6' && !(await panelOpen()));
  await page.click('.idsel-toggle');
  check('toggle opens panel', await panelOpen());
  await page.mouse.click(400, 400);
  check('click on the page closes panel', !(await panelOpen()));

  // Mobile view (desktop only)
  await page.click('.idsel-viewbtn');
  const frameEl = page.locator('.idsel-frame');
  check('phone button opens mobile view', await frameEl.isVisible());
  check('URL has view=mobile', new URL(page.url()).searchParams.get('view') === 'mobile', page.url());
  const inner = page.frameLocator('.idsel-frame');
  await inner.locator('.hero-title').filter({ hasText: /\S/ }).waitFor();
  const innerFrame = page.frames().find(f => f !== page.mainFrame());
  check('frame viewport is 390px with no scrollbar', await innerFrame.evaluate(() => document.documentElement.clientWidth) === 390);
  check('frame has no switcher', await innerFrame.evaluate(() => !document.querySelector('.idsel')));
  check('frame uses the mobile layout', await innerFrame.evaluate(() => getComputedStyle(document.querySelector('.hero-art')).display === 'none'));
  await page.click('.idsel-step[aria-label="Next identity"]');
  await page.waitForTimeout(200);
  check('theme change reaches the frame', await innerFrame.evaluate(() => document.documentElement.dataset.theme) === await theme());
  await page.reload({ waitUntil: 'networkidle' });
  check('reload keeps mobile view', await page.locator('.idsel-frame').isVisible());
  await page.click('.idsel-viewbtn');
  check('phone button returns to desktop', await page.locator('.idsel-frame').count() === 0 && !new URL(page.url()).searchParams.has('view'));
  await context.close();
}
{
  // A real phone opening a shared ?view=mobile link gets the normal responsive page.
  const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${base}index.html?theme=5&view=mobile`, { waitUntil: 'networkidle' });
  check('narrow screen ignores view=mobile', await page.locator('.idsel-frame').count() === 0 && !new URL(page.url()).searchParams.has('view'), page.url());
  check('narrow screen hides the phone button', await page.locator('.idsel-viewbtn').isHidden());

  // Hamburger menu
  const nav = page.locator('#main-nav');
  check('hamburger visible, nav collapsed', await page.locator('.nav-toggle').isVisible() && await nav.isHidden());
  await page.click('.nav-toggle');
  check('hamburger opens nav', await nav.isVisible() && await page.getAttribute('.nav-toggle', 'aria-expanded') === 'true');
  const joinBox = await page.locator('#main-nav .btn').boundingBox();
  check('Join button full width in menu', Math.round(joinBox.width) === 390 - 48, `${Math.round(joinBox.width)}px`);
  await page.click('#main-nav a[href="#projects"]');
  check('choosing a link closes the menu', await nav.isHidden());
  await page.click('.nav-toggle');
  await page.keyboard.press('Escape');
  check('Escape closes the menu', await nav.isHidden());
  await context.close();
}
{
  // Sticky header: hides on scroll down, returns on scroll up and at the top edge.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}index.html?theme=3b`, { waitUntil: 'networkidle' });
  const headerTop = () => page.locator('.site-header').evaluate(h => Math.round(h.getBoundingClientRect().bottom));
  const settle = () => page.waitForTimeout(400);
  check('desktop has no hamburger', await page.locator('.nav-toggle').isHidden());
  await page.mouse.move(700, 500);
  await page.mouse.wheel(0, 1200); await settle();
  check('scrolling down hides the header', await headerTop() <= 0);
  await page.mouse.wheel(0, -300); await settle();
  check('scrolling up shows it, stuck to the top', await headerTop() > 0 && await page.evaluate(() => scrollY) > 500);
  await page.mouse.wheel(0, 800); await settle();
  await page.mouse.move(700, 5); await settle();
  check('pointer at the top edge shows it', await headerTop() > 0);
  await context.close();
}
report.push('## Behaviour', '', ...checks, '');
console.log(checks.join('\n'));

await writeFile(path.join(outRoot, 'report.md'), report.join('\n'));
await browser.close();
server.close();
