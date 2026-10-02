/* MARGINALIA — character art agent: Sister Anselma (nun), Brother Odo (scribe), select-screen portraits. */
(function () {
  var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M;
  M.ART = M.ART || {};

  var K = '#2a1f1a', FD = '#6b5a4a', V = '#b8321f', L = '#1f4f96', G = '#2f7d62', A = '#c99a1e', AH = '#f0d27a',
      F = '#e9c9a0', U = '#7a5230', R = '#c98a8a', W = '#f3e8cf', P = '#d9c59a', HB = '#2f2a31', BR = '#8a5d36';
  function f(c, o) { return ' fill="' + c + '" fill-opacity="' + (o || 0.85) + '"'; }
  function s(c, w) { return ' stroke="' + c + '"' + (w ? ' stroke-width="' + w + '"' : ''); }
  var OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="' + K +
    '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">';
  var GROUND = '<ellipse cx="102" cy="186" rx="56" ry="4.5"' + f(U, 0.25) + ' stroke="none"/>';

  // ---------- Sister Anselma: small, stout, determined; psalter clutched, candle brandished ----------
  var nunBody =
    '<path d="M30 185c1-5 2-7 3-8M37 185c0-4 2-7 4-8M162 185c1-5 3-7 5-8M170 185c0-3 1-5 3-6"' + s(G, 2.5) + '/>' +
    // veil drape behind
    '<path d="M84 50C70 70 64 104 60 136c8 4 16 2 22-4l10-70z"' + f(HB) + '/>' +
    // shoes
    '<path d="M76 185c0-5 4-7 10-7s10 3 14 7zM110 185c0-5 4-7 10-7s11 3 15 7z"' + f(K, 1) + '/>' +
    // habit
    '<path d="M80 98C72 122 66 150 62 180c26 6 54 6 80 0-4-30-10-58-18-82z"' + f(HB) + '/>' +
    '<path d="M86 132c-4 16-6 30-7 44M104 136c0 14 1 28 2 42M120 130c4 16 6 32 8 46"' + s(FD, 2) + '/>' +
    // cincture + rosary
    '<path d="M74 128c18 4 38 4 54-1"' + s(P, 3.5) + '/>' +
    '<path d="M96 131c-4 8-6 16-4 24M96 131c5 8 4 17-4 24"' + s(K, 1.4) + '/>' +
    '<g' + f(A, 1) + ' stroke-width="1.4"><circle cx="94" cy="138" r="2"/><circle cx="93" cy="146" r="2"/><circle cx="99" cy="139" r="2"/><circle cx="100" cy="147" r="2"/></g>' +
    '<path d="M92 155v12M88 159h8"' + s(A, 3.5) + '/>' +
    // guimpe (white bib)
    '<path d="M86 88c-4 8-4 16 2 22 12 6 26 6 36-2 4-8 2-16-4-22z"' + f(W, 1) + '/>' +
    // psalter clutched at chest (far arm)
    '<path d="M76 108c-4 8-2 20 4 26"' + f(HB) + ' stroke-width="13"/>' +
    '<path d="M76 108c-4 8-2 20 4 26"' + s(HB, 7) + '/>' +
    '<path d="M80 112l26-6 6 30-26 6z"' + f(V) + '/>' +
    '<path d="M106 106l3 1 6 30-3-1"' + f(W, 1) + ' stroke-width="2"/>' +
    '<path d="M93 113l4 18M88 123l14-3"' + s(A, 3) + '/>' +
    '<circle cx="84" cy="130" r="5"' + f(F, 1) + '/>' +
    // wimple + face
    '<path d="M86 66c0-18 10-28 24-28s22 10 22 26c0 16-8 28-22 30-14 1-24-10-24-28z"' + f(W, 1) + '/>' +
    '<path d="M98 62c0-10 6-16 14-16s14 6 14 16-5 22-14 22-14-10-14-22z"' + f(F, 1) + '/>' +
    // veil top + white bandeau
    '<path d="M80 74C76 46 92 32 110 32c14 0 24 8 26 22-10-6-24-8-38-4-8 3-12 10-14 24z"' + f(HB) + '/>' +
    '<path d="M95 52c10-5 26-5 37 0" stroke="' + W + '" stroke-width="4"/>' +
    // face: determined brow, eye, nose, firm mouth, cheek
    '<path d="M110 57l9 3" stroke-width="2.6"/><path d="M101 57l5 1" stroke-width="2"/>' +
    '<circle cx="116" cy="64" r="2.1" fill="' + K + '" stroke="none"/><circle cx="104" cy="64" r="1.7" fill="' + K + '" stroke="none"/>' +
    '<path d="M122 62c3 3 5 6 3 9h-3" stroke-width="2"/>' +
    '<path d="M110 76c3 0 6-1 8-2" stroke-width="2.2"/>' +
    '<circle cx="118" cy="70" r="3"' + f(R, 0.7) + ' stroke="none"/>' +
    // near arm brandishing a candle like a blade
    '<path d="M112 104c10 2 20 4 30 2"' + s(K, 16) + '/>' +
    '<path d="M112 104c10 2 20 4 30 2"' + s(HB, 10) + '/>' +
    '<path d="M144 106l18-40 8 3-17 41z"' + f(W, 1) + '/>' +
    '<path d="M150 92l3 5M156 80l2 6" stroke-width="1.6"/>' +
    '<path d="M166 68l2-5" stroke-width="1.8"/>' +
    '<path d="M168 63c-7-4-6-12 2-22 3 8 9 12 4 20-2 2-4 3-6 2z"' + f(A, 1) + '/>' +
    '<path d="M169 60c-2-3-1-7 1-10 1 4 3 6 1 10z"' + f(V, 1) + ' stroke="none"/>' +
    '<path d="M178 40l4-4M182 52h5M158 40l-3-4"' + s(A, 2) + '/>' +
    '<circle cx="148" cy="104" r="6"' + f(F, 1) + '/>' +
    '<path d="M146 100l5 2" stroke-width="1.6"/>';

  // ---------- Brother Odo: tonsured, weary, couching an enormous quill like a lance ----------
  var odoBody =
    '<path d="M26 185c1-5 2-7 3-8M33 185c0-4 2-7 4-8M164 185c1-5 3-7 5-8M172 185c0-3 1-5 3-6"' + s(G, 2.5) + '/>' +
    // feet in sandals
    '<path d="M74 185c0-6 4-8 10-8 6 0 11 3 15 8zM112 185c0-6 4-8 10-8 6 0 12 3 16 8z"' + f(F, 1) + '/>' +
    '<path d="M80 180l8 5M118 180l8 5" stroke="' + U + '" stroke-width="3"/>' +
    // habit
    '<path d="M78 96C70 122 66 150 64 180c24 5 52 5 76 0-2-30-8-58-16-84z"' + f(BR) + '/>' +
    '<path d="M88 130c-4 16-6 30-6 46M106 134v42M120 128c4 16 6 32 7 48"' + s(U, 2.2) + '/>' +
    // hood bunched on shoulders
    '<path d="M76 96c8 8 40 10 52 0-2 10-14 16-26 16S80 108 76 96z"' + f(U) + '/>' +
    // rope belt, knotted tail
    '<path d="M72 130c20 4 40 4 56-2"' + s(P, 4) + '/>' +
    '<path d="M86 132c-2 10 0 18-3 28M84 146l4 2M83 154l4 1"' + s(P, 3) + '/>' +
    // inkhorn hanging at hip
    '<path d="M116 132l-2 8"' + s(K, 2) + '/>' +
    '<path d="M108 140c4-2 12-2 15 1-1 10-4 18-12 22 2-8 0-15-3-23z"' + f(A) + '/>' +
    '<path d="M108 140c5-1 10-1 15 1"' + s(K, 3.5) + '/>' +
    '<path d="M114 144l-1 4M117 153l-2 3" stroke-width="1.5"/>' +
    // far arm (behind quill) — hand on shaft
    '<path d="M84 104c-4 10 0 18 14 22"' + s(K, 15) + '/>' +
    '<path d="M84 104c-4 10 0 18 14 22"' + s(BR, 9) + '/>' +
    // giant quill: feather behind (left), nib forward (right)
    '<path d="M22 150c4-14 18-22 34-28 14-6 28-10 40-18-4 12-14 22-28 30l6 2c-10 4-18 6-26 6l4 4c-10 2-20 6-30 20z"' + f(W, 1) + '/>' +
    '<path d="M30 168c4 6 14 6 26 0 10-6 18-12 26-20"' + f(W, 1) + '/>' +
    '<path d="M36 148l6 6M46 140l6 8M58 132l6 9M70 124l5 9M82 116l4 8M42 168l4-6M56 164l2-6" stroke="' + FD + '" stroke-width="1.5"/>' +
    '<path d="M24 166L178 96"' + s(K, 7) + '/>' +
    '<path d="M24 166L178 96"' + s(P, 3) + '/>' +
    '<path d="M168 96l20-10-14 16z"' + f(K, 1) + '/>' +
    '<path d="M186 90c2 4 2 8 0 10-2-2-2-6 0-10z"' + f(K, 1) + ' stroke-width="1.5"/>' +
    '<circle cx="182" cy="106" r="1.8" fill="' + K + '" stroke="none"/>' +
    '<circle cx="98" cy="128" r="6.5"' + f(F, 1) + '/>' +
    '<path d="M101 122l2 4M104 124l1 4"' + s(K, 2.4) + '/>' +
    // head: tonsure fringe, weary eyes, big nose, stubble
    '<path d="M80 66c0-18 10-30 26-30s26 12 26 30c0 18-10 30-26 30S80 84 80 66z"' + f(F, 1) + '/>' +
    '<path d="M84 80c-4-8-5-18-2-26 14-6 30-8 44-6"' + s(U, 9) + '/>' +
    '<path d="M84 64l-4 1M83 72l-4 2M90 52l-1-4M100 49l-1-4M110 48v-4M120 48l1-4" stroke="' + U + '" stroke-width="2.4"/>' +
    '<path d="M96 41c6-3 12-3 18-1" stroke="' + W + '" stroke-width="3" stroke-opacity="0.8"/>' +
    '<path d="M90 64c-5 0-7 4-6 8s4 6 8 5"' + f(F, 1) + ' stroke-width="2.4"/>' +
    '<path d="M108 57l11 2" stroke="' + U + '" stroke-width="3"/>' +
    '<path d="M110 64h9M110 68c3 2 6 2 9 0" stroke-width="2.4"/>' +
    '<path d="M111 72c2 1 5 1 7 0" stroke="' + FD + '" stroke-width="1.5"/>' +
    '<path d="M122 66c6 2 10 6 10 10s-4 5-8 3"' + f(F, 1) + ' stroke-width="2.4"/>' +
    '<circle cx="128" cy="78" r="2.4"' + f(R, 0.7) + ' stroke="none"/>' +
    '<path d="M110 86c4 1 8 0 11-2" stroke-width="2.2"/>' +
    '<path d="M100 84l1 2M104 90l1 2M112 92l1 2M118 90l1 2" stroke="' + FD + '" stroke-width="1.4"/>' +
    '<path d="M100 44c1 4 0 7-1 9" stroke="' + K + '" stroke-width="1.6"/>' +
    // near arm (in front of quill), ink-stained hand gripping it
    '<path d="M118 104c8 4 14 10 20 14"' + s(K, 15) + '/>' +
    '<path d="M118 104c8 4 14 10 20 14"' + s(BR, 9) + '/>' +
    '<circle cx="142" cy="112" r="6.5"' + f(F, 1) + '/>' +
    '<path d="M145 107l3 3M147 112l2 3"' + s(K, 2.4) + '/>' +
    '<path d="M150 124c1 3 1 6-1 7-2-1-2-4 1-7z"' + f(K, 1) + ' stroke-width="1"/>';

  function wrap(body) { return OPEN + GROUND + body + '</svg>'; }

  M.ART.players = Object.assign(M.ART.players || {}, { nun: wrap(nunBody), scribe: wrap(odoBody) });
  M.ART.players.knight = M.ART.players.knight || M.ART.player;

  // ---------- portrait roundels (120×120): head-and-shoulders crop inside a gold-leaf frame ----------
  function inner(svg) { return svg ? svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') : ''; }
  function roundel(key, body, cx, cy, sc, bg, dot) {
    var cp = key + '_pc';
    var dots = '';
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6, x = (60 + 53 * Math.cos(a)).toFixed(1), y = (60 + 53 * Math.sin(a)).toFixed(1);
      dots += '<circle cx="' + x + '" cy="' + y + '" r="1.7"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none" stroke="' + K + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
      '<defs><clipPath id="' + cp + '"><circle cx="60" cy="60" r="46"/></clipPath></defs>' +
      '<circle cx="60" cy="60" r="57"' + f(A, 1) + ' stroke-width="2.5"/>' +
      '<circle cx="60" cy="60" r="57" stroke="' + AH + '" stroke-width="3" stroke-dasharray="40 140" transform="rotate(200 60 60)"/>' +
      '<g fill="' + AH + '" stroke="none">' + dots + '</g>' +
      '<circle cx="60" cy="60" r="46"' + f(bg) + '/>' +
      '<g clip-path="url(#' + cp + ')"><path d="M14 30l92 0M14 50h92M14 70h92M14 90h92M30 14v92M50 14v92M70 14v92M90 14v92" stroke="' + dot + '" stroke-width="1.2" stroke-opacity="0.45"/>' +
      '<g transform="translate(60 64) scale(' + sc + ') translate(' + (-cx) + ' ' + (-cy) + ')">' + body + '</g></g>' +
      '<circle cx="60" cy="60" r="46" stroke-width="3"/><circle cx="60" cy="60" r="57" stroke-width="2.5"/>' +
      '</svg>';
  }
  var knightBody = inner(M.ART.players.knight);
  M.ART.portraits = Object.assign(M.ART.portraits || {}, {
    knight: roundel('knight', knightBody, 100, 84, 0.82, L, AH),
    nun: roundel('nun', nunBody, 106, 82, 0.82, G, AH),
    scribe: roundel('scribe', odoBody, 106, 82, 0.82, V, AH)
  });
})();
