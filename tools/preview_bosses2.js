// Preview for v2 boss art: node tools/preview_bosses2.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
globalThis.M = {};
require(path.join(root, 'src/art_bosses2.js'));
const art = globalThis.M.ART.enemies;
const keys = Object.keys(art);
const report = [];
for (const k of keys) {
  const s = art[k];
  const bad = [];
  if (/<script/.test(s) || /^<svg[^>]*\s(width|height)=/.test(s)) bad.push('root attrs/script');
  if (/\$[A-Z]/.test(s)) bad.push('unexpanded token');
  if (/NaN|undefined/.test(s)) bad.push('NaN/undefined');
  if (/<text|href=/.test(s)) bad.push('text/href');
  if (s.length > 6656) bad.push('TOO BIG');
  report.push(k + ' ' + (s.length / 1024).toFixed(2) + 'KB ' + bad.join(','));
}
console.log(report.join('\n'));
const cell = k => `<div class="c"><div class="row"><div class="a" style="width:120px;height:120px">${art[k]}</div><div class="a" style="width:200px;height:200px">${art[k]}</div></div><div class="n">${k}</div></div>`;
const duo = `<div class="c"><div class="row"><div class="a" style="width:110px;height:110px">${art.jousting_hare}</div><div class="a" style="width:110px;height:110px">${art.war_snail}</div></div><div class="n">duo @110</div></div>`;
const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#efe2c4;font:13px serif;color:#2a1f1a;display:flex;flex-wrap:wrap;gap:6px;padding:8px;width:1040px}
.c{border:1px dashed #c9b48a;padding:4px}.row{display:flex;align-items:flex-end;gap:6px}.a svg{width:100%;height:100%;display:block}.n{text-align:center}</style>${keys.map(cell).join('')}${duo}`;
const out = path.join(root, 'preview/art_bosses2.html');
fs.writeFileSync(out, html);
(async () => {
  const { chromium } = require('/opt/npm-tools/node_modules/playwright');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1056, height: 800 } });
  await p.goto('file://' + out);
  await p.screenshot({ path: path.join(root, 'preview/art_bosses2.png'), fullPage: true });
  await b.close();
  console.log('ok');
})();
