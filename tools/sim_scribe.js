// Superseded: tools/sim.js now takes --char=knight|nun|scribe, --asc=N, --unlocked=all|none and --bosses.
// Kept as a thin alias (defaults: --char=scribe) so old commands keep working.
if ('--char=scribe' && !process.argv.some(function (a) { return a.indexOf('--char=scribe'.split('=')[0]) === 0; })) process.argv.push('--char=scribe');
require('./sim.js');
