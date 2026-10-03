// Node loader: require('./load') returns the global M with engine + data.
var path = require('path');
['engine.js', 'data/cards.js', 'data/relics.js', 'data/events.js', 'data/enemies.js', 'data/meta.js', 'data/char_nun.js', 'data/char_scribe.js', 'data/bosses2.js', 'diag.js'].forEach(function (f) {
  var fp = path.join(__dirname, 'src', f); if (require('fs').existsSync(fp)) require(fp);
});
module.exports = globalThis.M;
