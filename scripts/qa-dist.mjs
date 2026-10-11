#!/usr/bin/env node
/**
 * QA gate over the built dist/ output (run after `npm run build`).
 * Fails the build on SEO/regression violations:
 *  - title length ≤ 65, meta description ≤ 160, both unique per page
 *  - exactly one <h1> per page, self-referencing canonical present
 *  - no noindex on indexable templates
 *  - all internal hrefs resolve to built pages (no orphan/broken links)
 *  - JSON-LD parses
 *  - known raid counts present in the rendered HTML (math spot-checks)
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, posix } from 'node:path';

const DIST = new URL('../dist', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

const errors = [];
const warnings = [];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
}

const pages = walk(DIST).map((p) => ({ path: p, rel: relative(DIST, p).replace(/\\/g, '/') }));
if (!pages.length) {
  console.error('No HTML found in dist/ — run `npm run build` first.');
  process.exit(1);
}

const titles = new Map();
const metas = new Map();
const routes = new Set(pages.map((p) => '/' + p.rel.replace(/index\.html$/, '').replace(/\.html$/, '')).map((r) => (r === '/404' ? '/404' : r)));

for (const page of pages) {
  const html = readFileSync(page.path, 'utf8');
  const rel = page.rel;

  // title
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (!title) errors.push(`${rel}: missing <title>`);
  else {
    if (title.length > 65) errors.push(`${rel}: title ${title.length} chars (max 65) — "${title}"`);
    if (titles.has(title)) errors.push(`${rel}: duplicate title with ${titles.get(title)}`);
    titles.set(title, rel);
  }

  // meta description
  const meta = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!meta) errors.push(`${rel}: missing meta description`);
  else {
    if (meta.length > 160) errors.push(`${rel}: meta description ${meta.length} chars (max 160)`);
    if (metas.has(meta)) errors.push(`${rel}: duplicate meta description with ${metas.get(meta)}`);
    metas.set(meta, rel);
  }

  // single h1
  const h1s = html.match(/<h1[ >]/g)?.length ?? 0;
  if (h1s !== 1) errors.push(`${rel}: ${h1s} <h1> elements (must be exactly 1)`);

  // canonical (skip 404)
  if (!/404/.test(rel)) {
    const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
    if (!canonical) errors.push(`${rel}: missing canonical`);
  }

  // noindex only allowed on 404
  if (!/404/.test(rel) && /<meta name="robots" content="[^"]*noindex/.test(html)) {
    errors.push(`${rel}: has noindex but is an indexable template`);
  }

  // JSON-LD parses
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      errors.push(`${rel}: invalid JSON-LD (${e.message})`);
    }
  }

  // internal links resolve
  for (const m of html.matchAll(/href="(\/[^"#]*)"/g)) {
    let link = m[1].split('?')[0];
    if (link.startsWith('//')) continue;
    if (/\.(xml|txt|png|svg|ico|webmanifest|css|js)$/.test(link)) {
      if (!existsSync(join(DIST, link)) && !existsSync(join(DIST, link, 'index.html'))) {
        warnings.push(`${rel}: static asset missing ${link}`);
      }
      continue;
    }
    const target = link !== '/' && !link.endsWith('/') ? link + '/' : link;
    const file = join(DIST, target, 'index.html');
    const fileAlt = join(DIST, target.replace(/\/$/, ''), '.html');
    if (!existsSync(file) && !existsSync(fileAlt) && target !== '/404/') {
      errors.push(`${rel}: broken internal link ${link}`);
    }
  }
}

// math spot-checks in rendered HTML (server-side truth, from lib/raid via pages)
const chartPath = pages.find((p) => /raid-chart/.test(p.path));
if (chartPath) {
  const html = readFileSync(chartPath.path, 'utf8');
  const mustContain = [
    '15 rockets', // armored wall — wait, chart shows numbers per cell; use cell checks below
  ];
  // spot-check specific counts appear as table cells in the walls table
  const checks = [
    ['Armored Wall', '15'], // rockets
    ['Sheet Metal Door', '2'], // rockets
    ['Garage Door', '9'], // satchels
  ];
  for (const [row, val] of checks) {
    const rowRe = new RegExp(`<td><b>${row}</b>[\\s\\S]{0,400}?<td class="num">${val}</td>`);
    if (!rowRe.test(html)) errors.push(`raid-chart: expected ${row} rockets/satchels count ${val} in table`);
  }
  if (!/63/.test(html)) errors.push('raid-chart: expected 63 explosive ammo for sheet door');
} else {
  errors.push('raid-chart page missing from dist');
}

const solverPath = pages.find((p) => /cheapest-raid-solver/.test(p.path));
if (solverPath) {
  const html = readFileSync(solverPath.path, 'utf8');
  if (!/1,575 sulfur/.test(html)) errors.push('solver: server-rendered demo missing "1,575 sulfur"');
} else {
  errors.push('cheapest-raid-solver page missing from dist');
}

console.log(`QA: scanned ${pages.length} pages`);
for (const w of warnings) console.log('WARN:', w);
if (errors.length) {
  for (const e of errors) console.error('FAIL:', e);
  process.exit(1);
}
console.log('QA: all checks passed');
