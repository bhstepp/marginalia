// Superseded: tools/sim.js now takes --char=knight|nun|scribe, --asc=N, --unlocked=all|none and --bosses.
// Kept as a thin alias (defaults: --bosses) so old commands keep working.
if ('--bosses' && !process.argv.some(function (a) { return a.indexOf('--bosses'.split('=')[0]) === 0; })) process.argv.push('--bosses');
require('./sim.js');
