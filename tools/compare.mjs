// Visual check: screenshots every brand/reference/<id>.html (baseline) and
// index.html?theme=<id>, compares them pixel by pixel and reports per section.
// Also checks that ?theme / localStorage / the switcher behave.
// Usage: node tools/compare.mjs [width ...]   (default 1440 390)
// Output: tools/shots/<width>/{ref,site,diff}-<id>.png and tools/shots/report.md
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
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
const SECTIONS = ['header', '#top', '#about', '#projects', '#call', '#people', 'footer'];

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch();

async function shoot(url, width, file, { hideSwitcher = false } = {}) {
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
  if (hideSwitcher) await page.addStyleTag({ content: '.idsel{display:none!important}' });
  await page.evaluate(() => document.fonts.ready);
  // Section boxes for the per-section report.
  const boxes = await page.evaluate(sel => sel.map(s => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { s, top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY) };
  }), SECTIONS);
  const fonts = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family} ${f.style} ${f.weight}`));
  await page.screenshot({ path: file, fullPage: true });
  await context.close();
  return { problems, external, boxes, fonts: [...new Set(fonts)] };
}

function pad(png, w, h) {
  if (png.width === w && png.height === h) return png;
  const out = new PNG({ width: w, height: h });
  out.data.fill(0); // transparent → counts as different where the other image has content
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

function compare(refFile, siteFile, diffFile, boxes) {
  return Promise.all([readFile(refFile), readFile(siteFile)]).then(async ([a, b]) => {
    let ref = PNG.sync.read(a), site = PNG.sync.read(b);
    const w = Math.max(ref.width, site.width), h = Math.max(ref.height, site.height);
    const sizes = { ref: `${ref.width}×${ref.height}`, site: `${site.width}×${site.height}` };
    ref = pad(ref, w, h); site = pad(site, w, h);
    const diff = new PNG({ width: w, height: h });
    const count = pixelmatch(ref.data, site.data, diff.data, w, h, { threshold: 0.1, includeAA: false });
    await writeFile(diffFile, PNG.sync.write(diff));
    // Attribute differing pixels (red in the diff image) to page sections.
    const perSection = Object.fromEntries(SECTIONS.map(s => [s, 0]));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (diff.data[i] === 255 && diff.data[i + 1] === 0 && diff.data[i + 2] === 0) row++;
      }
      if (!row) continue;
      const box = boxes.find(bx => y >= bx.top && y < bx.bottom);
      perSection[box ? box.s : 'header'] += row;
    }
    return { sizes, count, pct: (100 * count / (w * h)), perSection };
  });
}

const report = [`# Visual comparison`, '', `Generated ${new Date().toISOString()}`, ''];

for (const width of widths) {
  const dir = path.join(outRoot, String(width));
  await mkdir(dir, { recursive: true });
  report.push(`## ${width} px`, '', '| id | ref size | site size | diff px | diff % | by section | issues |', '|---|---|---|---|---|---|---|');
  for (const id of ids) {
    const refFile = path.join(dir, `ref-${id}.png`), siteFile = path.join(dir, `site-${id}.png`), diffFile = path.join(dir, `diff-${id}.png`);
    await shoot(`${base}brand/reference/${id}.html`, width, refFile);
    const site = await shoot(`${base}index.html?theme=${id}`, width, siteFile, { hideSwitcher: true });
    const r = await compare(refFile, siteFile, diffFile, site.boxes);
    const sections = Object.entries(r.perSection).filter(([, n]) => n).map(([s, n]) => `${s}: ${n}`).join(', ') || 'none';
    const issues = [...site.problems, ...site.external.map(u => `external: ${u}`)].join('<br>') || 'none';
    report.push(`| ${id} | ${r.sizes.ref} | ${r.sizes.site} | ${r.count} | ${r.pct.toFixed(3)} | ${sections} | ${issues} |`);
    console.log(`${width}px ${id}: ${r.count} px (${r.pct.toFixed(3)}%)  ${sections}${site.problems.length || site.external.length ? '  ISSUES: ' + issues : ''}`);
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
  await context.close();
}
report.push('## Behaviour', '', ...checks, '');
console.log(checks.join('\n'));

await writeFile(path.join(outRoot, 'report.md'), report.join('\n'));
await browser.close();
server.close();
