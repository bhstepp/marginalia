// Preview for art agent B: node tools/preview_art_b.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
globalThis.M = {};
require(path.join(root, 'src/art_enemies2.js'));
const art = globalThis.M.ART.enemies;
const keys = Object.keys(art);
let report = [];
for (const k of keys) {
  const s = art[k];
  const bad = [];
  if (/<script/.test(s) || /^<svg[^>]*\s(width|height)=/.test(s)) bad.push('root attrs/script');
  if (/\$[A-Z]/.test(s)) bad.push('unexpanded token');
  if (/NaN|undefined/.test(s)) bad.push('NaN/undefined');
  report.push(k + ' ' + (s.length / 1024).toFixed(1) + 'KB ' + bad.join(','));
}
console.log(report.join('\n'));
const cells = keys.map(k => `<div class="c"><div class="row"><div class="a" style="width:120px;height:120px">${art[k]}</div><div class="a" style="width:200px;height:200px">${art[k]}</div></div><div class="n">${k}</div></div>`).join('');
const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#efe2c4;font:13px serif;color:#2a1f1a;display:flex;flex-wrap:wrap;gap:6px;padding:8px;width:1340px}
.c{border:1px dashed #c9b48a;padding:4px}.row{display:flex;align-items:flex-end;gap:6px}.a svg{width:100%;height:100%;display:block}.n{text-align:center}</style>${cells}`;
fs.mkdirSync(path.join(root, 'preview'), { recursive: true });
const out = path.join(root, 'preview/art_b.html');
fs.writeFileSync(out, html);
(async () => {
  const { chromium } = require('/opt/npm-tools/node_modules/playwright');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1356, height: 800 } });
  await p.goto('file://' + out);
  await p.screenshot({ path: path.join(root, 'preview/art_b.png'), fullPage: true });
  await b.close();
  console.log('ok');
})();
