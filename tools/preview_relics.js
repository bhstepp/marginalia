// Renders every relic icon inside badge discs (gold + its rarity colour) at 1x and 3x -> preview/art_relics.png
var fs = require('fs'), path = require('path');
var root = path.join(__dirname, '..');
globalThis.M = {};
['engine.js', 'data/cards.js', 'data/relics.js', 'data/char_nun.js', 'data/char_scribe.js', 'art_relics.js'].forEach(function (f) {
  var p = path.join(root, 'src', f);
  if (!fs.existsSync(p)) return;
  try { require(p); } catch (e) { console.log('load fail', f, e.message); }
});
var M = globalThis.M, A = (M.ART && M.ART.relics) || {};
var ids = Object.keys(M.RELICS || {});
var missing = ids.filter(function (k) { return !A[k]; });
var report = ids.map(function (k) {
  var s = A[k] || '';
  var bad = /<script|<text|href=/.test(s) || /\s(width|height)="/.test(s.slice(0, s.indexOf(">")));
  return k + ' ' + (s.length / 1024).toFixed(2) + 'KB' + (bad ? ' !!BAD' : '') + (s.length > 1250 ? ' !!BIG' : '');
});
console.log(report.join('\n'));
console.log('relics:', ids.length, 'missing art:', missing);
var bg = {
  gold: 'radial-gradient(circle at 35% 30%, #fff8dd, #f0d27a 40%, #c99a1e 80%, #8a6510)',
  boss: 'radial-gradient(circle at 35% 30%, #ffe4d8, #e0705a 45%, #b8321f 85%)',
  rare: 'radial-gradient(circle at 35% 30%, #e8f0ff, #7a9ad6 45%, #1f4f96 85%)',
  uncommon: 'radial-gradient(circle at 35% 30%, #e7fff2, #78b49b 45%, #2f7d62 85%)'
};
function badge(svg, kind, sz) {
  return '<span class="b" style="width:' + sz + 'px;height:' + sz + 'px;background:' + (bg[kind] || bg.gold) + '"><span style="width:' + Math.round(sz * 20 / 28) + 'px;height:' + Math.round(sz * 20 / 28) + 'px">' + (svg || '?') + '</span></span>';
}
var cells = ids.map(function (k) {
  var r = M.RELICS[k], s = A[k];
  return '<figure><div>' + badge(s, 'gold', 28) + badge(s, r.rarity, 28) + '</div><div>' + badge(s, r.rarity, 84) + '</div><figcaption>' + r.name + '<br><small>' + k + ' · ' + r.rarity + '</small></figcaption></figure>';
}).join('');
var html = '<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:12px;background:#ecdcb8;font:11px Georgia;color:#2a1f1a;width:1176px}' +
  'figure{display:inline-block;margin:4px;width:134px;text-align:center;vertical-align:top}' +
  '.b{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;border:1.4px solid #2a1f1a;margin:2px;box-shadow:0 1px 2px rgba(42,31,26,.4)}' +
  '.b>span{display:block}.b svg{width:100%;height:100%;display:block}</style>' + cells;
fs.writeFileSync(path.join(root, 'preview/art_relics.html'), html);
(async function () {
  var { chromium } = require('/opt/npm-tools/node_modules/playwright');
  var b = await chromium.launch();
  var p = await b.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
  p.on('console', function (m) { console.log('console:', m.text()); });
  await p.goto('file://' + path.join(root, 'preview/art_relics.html'));
  await p.screenshot({ path: path.join(root, 'preview/art_relics.png'), fullPage: true });
  await b.close();
  console.log('ok');
})();
