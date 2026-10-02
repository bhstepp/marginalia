// Bundles src/ into a single self-contained dist/index.html
var fs = require('fs'), path = require('path');
var S = function (f) { return path.join(__dirname, 'src', f); };
var JS = ['engine.js', 'data/cards.js', 'data/relics.js', 'data/events.js', 'data/enemies.js', 'data/meta.js', 'data/char_nun.js', 'data/char_scribe.js', 'data/bosses2.js',
  'art_icons.js', 'art_enemies1.js', 'art_enemies2.js', 'art_relics.js', 'art_chars.js', 'art_bosses2.js', 'ui.js'];
var js = JS.filter(function (f) { return fs.existsSync(S(f)); }).map(function (f) {
  return '/* ==== ' + f + ' ==== */\n' + fs.readFileSync(S(f), 'utf8');
}).join('\n;\n');
var css = fs.existsSync(S('style.css')) ? fs.readFileSync(S('style.css'), 'utf8') : '';
var tpl = fs.readFileSync(S('index.template.html'), 'utf8');
var out = tpl.replace('/*@CSS@*/', function () { return css; }).replace('/*@JS@*/', function () { return js.replace(/<\/script/gi, '<\\/script'); });
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), out);
fs.writeFileSync(path.join(__dirname, 'index.html'), out); // GitHub Pages serves the repo root
console.log('Built dist/index.html', (out.length / 1024).toFixed(1) + ' KB');
