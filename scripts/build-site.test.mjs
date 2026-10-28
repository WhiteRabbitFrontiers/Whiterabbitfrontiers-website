import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build, revision, markdown } from './build-site.mjs';
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wrf-test-'));
  for (const name of fs.readdirSync(process.cwd())) {
    if (name.endsWith('.html') || name.endsWith('.webp')) fs.copyFileSync(name, path.join(root, name));
  }
  fs.cpSync('editorial', path.join(root, 'editorial'), { recursive: true });
  fs.mkdirSync(path.join(root, 'editorial/articles'), { recursive: true });
  fs.writeFileSync(path.join(root, 'editorial/articles/sample.md'), '## The signal\n\nSynthetic test article.\n\n- [Source](https://example.org/source)\n');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'editorial/publication.json')));
  manifest.articles = [{slug:'sample-signal',title:'Sample signal',summary:'Synthetic publishing fixture.',source:'editorial/articles/sample.md',category:'life',date:'2026-10-28',evidence:'TEST EVIDENCE',image:'radar-bio.webp',imageAlt:'Test illustration',status:'review',approvedRevision:null}];
  fs.writeFileSync(path.join(root, 'editorial/publication.json'), JSON.stringify(manifest));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function edit(root, fn) {
  const file = path.join(root, 'editorial/publication.json');
  const config = JSON.parse(fs.readFileSync(file));
  fn(config);
  fs.writeFileSync(file, JSON.stringify(config));
}
function approve(root) {
  edit(root, config => {
    const article = config.articles[0];
    article.status = 'published';
    article.approvedRevision = revision(article, fs.readFileSync(path.join(root, article.source), 'utf8'));
  });
}
test('production excludes review articles and all editorial/research sources, removing stale output', t => {
  const root = fixture(t);
  fs.mkdirSync(path.join(root, 'dist'));
  fs.writeFileSync(path.join(root, 'dist/leaked-draft.md'), 'stale');
  const result = build({ root });
  assert.equal(result.pages.length, 6);
  assert.equal(result.assets.length, 8);
  assert.ok(!fs.existsSync(path.join(root, 'dist/sample-signal.html')));
  assert.ok(!fs.existsSync(path.join(root, 'dist/leaked-draft.md')));
  assert.ok(!fs.existsSync(path.join(root, 'dist/editorial')));
  assert.ok(!fs.readFileSync(path.join(root, 'dist/radar.html'), 'utf8').includes('Sample signal'));
});
test('approved article creates both its page and its category card', t => {
  const root = fixture(t); approve(root); build({ root });
  assert.match(fs.readFileSync(path.join(root, 'dist/radar.html'), 'utf8'), /href="sample-signal.html"/);
  const article = fs.readFileSync(path.join(root, 'dist/sample-signal.html'), 'utf8');
  assert.match(article, /TEST EVIDENCE/);
  assert.match(article, /href="https:\/\/example.org\/source"/);
  assert.ok(!article.includes('PRIVATE EDITORIAL PREVIEW'));
});
test('published article without exact approval blocks build', t => {
  const root = fixture(t);
  edit(root, config => config.articles[0].status = 'published');
  assert.throws(() => build({ root }), /Approval missing or stale/);
});
test('editing approved body or card invalidates approval', t => {
  const root = fixture(t); approve(root);
  fs.appendFileSync(path.join(root, 'editorial/articles/sample.md'), '\nChanged body.\n');
  assert.throws(() => build({ root }), /Approval missing or stale/);
  approve(root);
  edit(root, config => config.articles[0].title = 'Changed headline');
  assert.throws(() => build({ root }), /Approval missing or stale/);
});
test('private preview has review banner and never writes into production', t => {
  const root = fixture(t);
  const out = path.join(root, 'wrf-private-preview');
  build({ root, preview: true, out });
  assert.match(fs.readFileSync(path.join(out, 'sample-signal.html'), 'utf8'), /PRIVATE EDITORIAL PREVIEW/);
  assert.ok(!fs.existsSync(path.join(root, 'dist')));
  assert.throws(() => build({ root, preview: true }), /explicit output/);
  assert.throws(() => build({ root, preview: true, out: path.join(root, 'dist/wrf-private-preview') }), /inside dist/);
});
test('missing image, missing page and broken fragment each block deployment', t => {
  const root = fixture(t);
  const home = path.join(root, 'index.html');
  const original = fs.readFileSync(home, 'utf8');
  for (const [href, error] of [['absent.webp', /Missing asset/], ['absent.html', /Broken page link/], ['radar.html#absent', /Broken anchor/]]) {
    fs.writeFileSync(home, original.replace('</body>', `<a href="${href}">test</a></body>`));
    assert.throws(() => build({ root }), error);
  }
});
test('unsafe paths and duplicate destinations are rejected', t => {
  const root = fixture(t);
  edit(root, config => config.pages.push('../secret.html'));
  assert.throws(() => build({ root }), /Unsafe path/);
  edit(root, config => { config.pages.pop(); config.pages.push('radar.html'); });
  assert.throws(() => build({ root }), /Duplicate page/);
});
test('renderer escapes HTML and only creates HTTPS source links', () => {
  const html = markdown('## Evidence\n\n<script>alert(1)</script>\n\n[unsafe](javascript:alert)\n\n[Source](https://example.org/?a=1&b=2)');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.match(html, /href="https:\/\/example.org\/\?a=1&amp;b=2"/);
});
