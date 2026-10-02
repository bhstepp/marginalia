// Renders character art (players + portraits) to preview/art_chars.png
var fs = require('fs'), path = require('path');
var root = path.join(__dirname, '..');
globalThis.M = {};
require(path.join(root, 'src/art_icons.js'));
require(path.join(root, 'src/art_chars.js'));
var A = globalThis.M.ART;
var keys = ['knight', 'nun', 'scribe'];
keys.forEach(function (k) {
  [['player', A.players[k]], ['portrait', A.portraits[k]]].forEach(function (e) {
    var svg = e[1] || '';
    var bad = /<script|<text|href=(?!"#)|xlink:href|<svg[^>]*\swidth=/.test(svg.replace(/url\(#/g, ''));
    console.log(k, e[0], (svg.length / 1024).toFixed(2) + 'KB', bad ? '!!BAD' : 'ok');
  });
});
var players = keys.map(function (k) {
  return '<figure><div class="b">' + A.players[k] + '</div><div class="s">' + A.players[k] + '</div><figcaption>' + k + '</figcaption></figure>';
}).join('');
var ports = keys.map(function (k) {
  return '<figure><span class="p1">' + A.portraits[k] + '</span><span class="p2">' + A.portraits[k] + '</span><span class="p0">' + A.portraits[k] + '</span><figcaption>' + k + '</figcaption></figure>';
}).join('');
var html = '<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#efe2c4;font:12px Georgia;color:#2a1f1a;width:1300px}' +
  'figure{display:inline-block;margin:6px;text-align:center;vertical-align:bottom}.b svg{width:200px;height:200px;border:1px dashed #c9b48a}.s svg{width:110px;height:110px}' +
  '.p1 svg{width:120px;height:120px}.p2 svg{width:240px;height:240px}.p0 svg{width:64px;height:64px}</style>' +
  '<div>' + players + '</div><hr><div>' + ports + '</div>';
fs.mkdirSync(path.join(root, 'preview'), { recursive: true });
fs.writeFileSync(path.join(root, 'preview/art_chars.html'), html);
(async function () {
  var { chromium } = require('/opt/npm-tools/node_modules/playwright');
  var b = await chromium.launch();
  var p = await b.newPage({ viewport: { width: 1340, height: 600 } });
  await p.goto('file://' + path.join(root, 'preview/art_chars.html'));
  await p.screenshot({ path: path.join(root, 'preview/art_chars.png'), fullPage: true });
  await b.close();
  console.log('ok');
})();
