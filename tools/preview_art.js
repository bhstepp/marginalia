// Renders art agent A's SVGs to preview/art_a.html and preview/art_a.png
var fs = require('fs'), path = require('path');
var root = path.join(__dirname, '..');
globalThis.M = {};
require(path.join(root, 'src/art_icons.js'));
require(path.join(root, 'src/art_enemies1.js'));
var M = globalThis.M, A = M.ART;
var mine = ['snail_knight', 'killer_rabbit', 'ink_mite', 'ape_piper', 'grotesque_snout', 'cynocephalus', 'hare_cavalier', 'great_snail', 'kitten_scrawl', 'bookmite'];
var report = [];
function check(k, svg) {
  var kb = (svg.length / 1024).toFixed(1);
  var bad = /<script|<text|href=|width="\d+"\s+height=/.test(svg.slice(0, 200)) || /<script|<text|xlink:href/.test(svg);
  report.push(k + ' ' + kb + 'KB' + (bad ? ' !!BAD' : ''));
}
var big = [['knight', A.player]].concat(mine.map(function (k) { return [k, A.enemies[k]]; }));
big.forEach(function (e) { check(e[0], e[1] || ''); });
var cells = big.map(function (e) {
  return '<figure><div class="b">' + (e[1] || 'MISSING') + '</div><div class="s">' + (e[1] || '') + '</div><figcaption>' + e[0] + '</figcaption></figure>';
}).join('');
var icons = Object.keys(A.icons).map(function (k) {
  return '<figure class="i"><span class="i24">' + A.icons[k] + '</span><span class="i48">' + A.icons[k] + '</span><span class="i24 red">' + A.icons[k] + '</span><figcaption>' + k + '</figcaption></figure>';
}).join('');
var html = '<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:linear-gradient(#efe2c4,#e4d2a8);font:12px Georgia;color:#2a1f1a;width:1400px}' +
  'figure{display:inline-block;margin:6px;text-align:center;vertical-align:top}.b svg{width:200px;height:200px;border:1px dashed #c9b48a}.s svg{width:100px;height:100px}' +
  '.i{width:120px}.i24 svg{width:24px;height:24px;margin:4px}.i48 svg{width:48px;height:48px;margin:4px}.red{color:#6b5a4a}</style>' +
  '<div>' + cells + '</div><hr><div>' + icons + '</div>';
fs.mkdirSync(path.join(root, 'preview'), { recursive: true });
fs.writeFileSync(path.join(root, 'preview/art_a.html'), html);
console.log(report.join('\n'));
var expected = 'intent_attack intent_defend intent_buff intent_debuff intent_curse intent_erase intent_devour intent_summon intent_unknown ink silver hp ward deck draw_pile discard_pile scraped margin map menu sound_on sound_off node_battle node_elite node_boss node_event node_shop node_rest node_treasure st_might st_resolve st_corrode st_smudged st_torn st_faded st_brambles st_mending st_steadfast st_zeal st_shell st_parched type_attack type_skill type_gloss type_blot relic'.split(' ');
console.log('missing icons:', expected.filter(function (k) { return !A.icons[k]; }));
(async function () {
  var { chromium } = require('/opt/npm-tools/node_modules/playwright');
  var b = await chromium.launch();
  var p = await b.newPage({ viewport: { width: 1430, height: 800 } });
  p.on('console', function (m) { console.log('console:', m.text()); });
  await p.goto('file://' + path.join(root, 'preview/art_a.html'));
  await p.screenshot({ path: path.join(root, 'preview/art_a.png'), fullPage: true });
  await b.close();
  console.log('ok');
})();
