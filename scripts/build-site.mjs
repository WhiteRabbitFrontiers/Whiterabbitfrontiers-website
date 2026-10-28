import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const categories = { intelligence: 'AI & autonomy', mind: 'Neurofrontiers', life: 'Longevity & biotech', matter: 'Quantum horizons', earth: 'Planetary perception', society: 'Future systems' };
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function localPath(value) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_./-]*$/.test(value) || value.split('/').includes('..')) throw new Error(`Unsafe path: ${value}`);
  return value;
}
function inline(text) {
  return escape(text).replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2">$1 ↗</a>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
// Deliberately small Markdown subset. Raw HTML is always escaped.
export function markdown(source) {
  const blocks = source.trim().split(/\n\s*\n/);
  return blocks.map(block => {
    if (/^#{1,3} /.test(block)) {
      const [, marks, title] = block.match(/^(#{1,3}) ([\s\S]*)$/);
      return `<h${marks.length}>${inline(title)}</h${marks.length}>`;
    }
    if (block.split('\n').every(line => /^- /.test(line))) return `<ul>${block.split('\n').map(line => `<li>${inline(line.slice(2))}</li>`).join('')}</ul>`;
    if (/^```|^\|/m.test(block)) throw new Error('Unsupported Markdown: use headings, paragraphs, bullet lists and HTTPS links.');
    return `<p>${inline(block.replace(/\n/g, ' '))}</p>`;
  }).join('\n');
}
export function revision(article, source) {
  const { status, approvedRevision, ...metadata } = article;
  return crypto.createHash('sha256').update(JSON.stringify(metadata) + '\n' + source).digest('hex');
}
function articlePage(article, source, style, preview) {
  const category = escape(categories[article.category]);
  const banner = preview ? '<div class="evidence"><strong>PRIVATE EDITORIAL PREVIEW · NOT PUBLISHED</strong><p>Prepared for review. Publication requires approval of this exact revision.</p></div>' : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${preview ? '<meta name="robots" content="noindex,nofollow">' : ''}<title>${escape(article.title)} | White Rabbit Radar</title><meta name="description" content="${escape(article.summary)}"><style>${style}\n.article-body{max-width:780px;margin:auto;padding:40px 24px}.article-body img{width:100%;border-radius:12px}.article-body li{color:#c4cce0;overflow-wrap:anywhere}.article-body h2{margin-top:42px}.article-body a{overflow-wrap:anywhere}.article-body h1{display:none}</style></head><body><header><img src="wrf-main-rabbit.webp" alt=""><a href="index.html">WHITE RABBIT FRONTIERS</a><a style="margin-left:auto" href="radar.html#${article.category}">RADAR ↗</a></header><main><div class="hero"><div class="wrap"><div class="eyebrow">WHITE RABBIT RADAR / ${category}</div><h1>${escape(article.title)}</h1><p class="deck">${escape(article.summary)}</p><div class="meta">${escape(article.date)} · ${escape(article.evidence)}</div></div></div><article class="article-body">${banner}<img src="${escape(article.image)}" alt="${escape(article.imageAlt)}"><div class="evidence"><strong>Evidence status:</strong> ${escape(article.evidence)}</div>${markdown(source)}<a class="back" href="radar.html#${article.category}">← Back to ${category}</a></article></main><footer>WHITE RABBIT FRONTIERS · <a href="index.html#dispatch">Get the dispatch</a></footer></body></html>`;
}
export function build({ root = process.cwd(), preview = false, out } = {}) {
  const output = out || path.join(root, 'dist');
  if (preview && !out) throw new Error('Private previews require an explicit output directory outside dist.');
  const resolved = path.resolve(output);
  if (resolved === path.resolve(root) || !path.basename(resolved).startsWith(preview ? 'wrf-private-preview' : 'dist')) throw new Error('Output directory must be named dist* or wrf-private-preview*.');
  if (preview && resolved.startsWith(path.resolve(root, 'dist'))) throw new Error('Private previews cannot be placed inside dist.');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'editorial/publication.json'), 'utf8'));
  const files = new Map();
  for (const page of config.pages) {
    localPath(page);
    if (!/^[a-z0-9-]+\.html$/.test(page)) throw new Error(`Public pages must be root HTML files: ${page}`);
    if (files.has(page)) throw new Error(`Duplicate page: ${page}`);
    files.set(page, fs.readFileSync(path.join(root, page), 'utf8'));
  }
  let radar = files.get('radar.html');
  const style = files.get('ocean-readable.html').match(/<style>([\s\S]*?)<\/style>/)[1];
  const cards = Object.fromEntries(Object.keys(categories).map(key => [key, []]));
  const report = [];
  for (const article of config.articles) {
    if (!['draft', 'review', 'published'].includes(article.status)) throw new Error(`Unknown status: ${article.status}`);
    for (const field of ['slug','title','summary','source','category','date','evidence','image','imageAlt']) if (typeof article[field] !== 'string' || !article[field].trim()) throw new Error(`Missing article ${field}`);
    if (!/^[a-z0-9-]+$/.test(article.slug) || !categories[article.category] || !/^\d{4}-\d{2}-\d{2}$/.test(article.date)) throw new Error('Invalid article slug, category or date');
    const source = fs.readFileSync(path.join(root, localPath(article.source)), 'utf8');
    const hash = revision(article, source);
    report.push({ slug: article.slug, status: article.status, revision: hash });
    const approved = article.status === 'published' && article.approvedRevision === hash;
    if (article.status === 'published' && !approved) throw new Error(`Approval missing or stale for ${article.slug}; current revision: ${hash}`);
    if (!approved && !preview) continue;
    const filename = `${article.slug}.html`;
    if (files.has(filename)) throw new Error(`Duplicate page: ${filename}`);
    const image = localPath(article.image);
    if (!image.endsWith('.webp') || !fs.existsSync(path.join(root, image))) throw new Error(`Missing WebP artwork: ${image}`);
    files.set(filename, articlePage(article, source, style, !approved));
    cards[article.category].push(`<article class="story" style="margin-top:24px"><a class="story-link" href="${filename}"><div class="story-art"><img class="story-illustration" src="${image}" alt="${escape(article.imageAlt)}" loading="lazy"></div><div class="story-content"><div class="status">${approved ? 'PUBLISHED' : 'PRIVATE PREVIEW'} · ${escape(article.date)}</div><h3>${escape(article.title)} ↗</h3><p>${escape(article.summary)}</p><p style="margin-top:16px">${escape(article.evidence)}</p><span class="story-cta">READ STORY ↗</span></div></a></article>`);
  }
  for (const [category, items] of Object.entries(cards)) {
    const marker = `<!-- pipeline:${category} -->`;
    if (radar.split(marker).length !== 2) throw new Error(`Missing or duplicated Radar marker: ${category}`);
    radar = radar.replace(marker, items.join('\n'));
  }
  files.set('radar.html', radar);
  if (preview) for (const [name, html] of files) files.set(name, html.replace('<head>', '<head><meta name="robots" content="noindex,nofollow">'));
  // Follow only referenced public assets, never recursively copy research folders.
  const assets = new Set();
  for (const [filename, html] of files) {
    for (const match of html.matchAll(/\b(?:href|src|action)=["']([^"']+)["']/g)) {
      const value = match[1].replace(/&amp;/g, '&');
      if (/^(?:https?:|mailto:|data:)/.test(value)) continue;
      const [target, anchor] = value.split('#');
      const destination = target || filename;
      localPath(destination);
      if (destination.endsWith('.html')) {
        if (!files.has(destination)) throw new Error(`Broken page link in ${filename}: ${value}`);
        if (anchor && !new RegExp(`\\bid=["']${anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(files.get(destination))) throw new Error(`Broken anchor in ${filename}: ${value}`);
      } else {
        if (!/^[a-z0-9-]+\.webp$/.test(destination)) throw new Error(`Unapproved public asset: ${destination}`);
        if (!fs.existsSync(path.join(root, destination))) throw new Error(`Missing asset: ${destination}`);
        assets.add(destination);
      }
    }
  }
  fs.rmSync(output, { recursive: true, force: true });
  fs.mkdirSync(output, { recursive: true });
  for (const [name, html] of files) fs.writeFileSync(path.join(output, name), html);
  for (const asset of assets) fs.copyFileSync(path.join(root, asset), path.join(output, asset));
  return { mode: preview ? 'PRIVATE PREVIEW — DO NOT DEPLOY' : 'production', pages: [...files.keys()], assets: [...assets], articles: report };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const preview = args.includes('--preview');
  const outIndex = args.indexOf('--out');
  console.log(JSON.stringify(build({ preview, out: outIndex < 0 ? undefined : args[outIndex + 1] }), null, 2));
}
