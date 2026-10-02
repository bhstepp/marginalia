// Superseded: tools/sim.js now takes --char=knight|nun|scribe, --asc=N, --unlocked=all|none and --bosses.
// Kept as a thin alias (defaults: none) so old commands keep working.
if ('' && !process.argv.some(function (a) { return a.indexOf(''.split('=')[0]) === 0; })) process.argv.push('');
require('./sim.js');
