/* MARGINALIA — art agent A: Quire I bestiary + minions (hand-inked inline SVG strings, facing LEFT). */
(function () {
  var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M;
  M.ART = M.ART || {};

  var K = '#2a1f1a', V = '#b8321f', L = '#1f4f96', G = '#2f7d62', A = '#c99a1e', F = '#e9c9a0', U = '#7a5230',
      P = '#d9c59a', R = '#c98a8a', W = '#f6ecd6', ST = '#bdb8ac';
  function f(c, o) { return ' fill="' + c + '" fill-opacity="' + (o || 0.85) + '"'; }
  function s(c, w) { return ' stroke="' + c + '"' + (w ? ' stroke-width="' + w + '"' : ''); }
  function S(b) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="' + K +
      '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + b + '</svg>';
  }
  function shadow(cx, rx) { return '<ellipse cx="' + cx + '" cy="186" rx="' + rx + '" ry="4.5"' + f(U, 0.22) + ' stroke="none"/>'; }
  // half-circle spiral around (cx,cy) out to n turns (step d)
  function spiral(cx, cy, d, n) {
    var p = 'M' + cx + ' ' + cy, x = cx, r, i;
    for (i = 1; i <= n; i++) { r = d * i; x = (i % 2) ? x + 2 * r : x - 2 * r; p += 'A' + r + ' ' + r + ' 0 0 1 ' + x + ' ' + cy; }
    return p;
  }
  function eye(x, y, r, px) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + W + '"/><circle cx="' + (x - (px || r * 0.4)) + '" cy="' + y + '" r="' + (r * 0.45) + '" fill="' + K + '" stroke="none"/>'; }
  function tube(d, w, c) { return '<path d="' + d + '" stroke-width="' + (w + 6) + '"/><path d="' + d + '"' + s(c, w) + '/>'; }

  M.ART.enemies = Object.assign(M.ART.enemies || {}, {

    snail_knight: S(shadow(100, 80) +
      '<path d="M22 184c-6-3-4-9 0-15 5-8 2-24 4-36 2-14 12-22 24-22 14 0 22 10 22 24 0 14 0 24 8 30 30 3 80 5 104 9 7 2 7 6 0 8z"' + f(F) + '/>' +
      '<path d="M30 160c4 2 6 6 6 10M44 166c2 3 2 7 1 10M84 176v6M110 177v6M136 178v5" stroke-width="1.6"/>' +
      '<path d="M44 106c-6-10-12-18-20-24M56 106c2-12 2-22-2-32" stroke-width="3.5"/>' + eye(24, 80, 7) + eye(54, 72, 7) +
      '<path d="M26 119c3-12 10-18 20-18s17 6 20 17"' + f(ST, 1) + '/><path d="M18 122c14-6 40-7 56-1"' + f(ST, 1) + '/>' +
      '<path d="M44 102c-3-6-1-12 4-14"' + s(V, 4) + '/>' +
      '<path d="M26 141c3 3 7 3 10 1" stroke-width="2.5"/>' +
      '<circle cx="128" cy="113" r="49"' + f(U, 0.6) + '/>' +
      '<path d="' + spiral(128, 113, 4.5, 9) + '" stroke-width="3"/>' +
      '<path d="M146 152l8 4M158 140l9 3M166 124l8 1" stroke-width="1.6"/>' +
      '<path d="M132 64l6-46" stroke-width="3"/><path d="M138 18l32 5-14 6 14 6-34 2z"' + f(V) + '/>' +
      '<path d="M150 158L4 146"' + s(P, 7) + '/><path d="M150 158L4 146" stroke-width="1.2"/>' +
      '<path d="M150 154.5L4 142.5M150 161.5L6 149.5" stroke-width="2.4"/>' +
      '<path d="M64 140l-10 12 10 10z"' + f(ST, 1) + '/>' +
      '<path d="M112 150c4 6 4 12 0 18M142 152c-3 6-3 12 0 18"' + s(U, 4) + '/>'),

    killer_rabbit: S(shadow(110, 58) +
      '<path d="M96 60c4-18 14-34 28-40 0 14-8 32-20 44z"' + f(W, 1) + '/>' +
      '<path d="M78 182c-10-10-14-30-10-52 6-26 24-36 44-34 24 2 40 22 40 48 0 18-6 30-14 38z"' + f(W, 1) + '/>' +
      '<circle cx="160" cy="158" r="10"' + f(W, 1) + '/><path d="M156 154l4 4M162 152l2 5" stroke-width="1.5"/>' +
      '<path d="M96 184c-14 0-30-1-32-6s6-7 16-7h18z"' + f(W, 1) + '/>' +
      '<path d="M128 150c4 8 4 16 0 22M136 140c4 4 6 10 6 16" stroke-width="1.6"/>' +
      '<path d="M80 60c-4-20 0-40 12-50 6 12 6 34-2 52z"' + f(W, 1) + '/><path d="M84 54c-1-14 1-28 7-38 3 10 2 24-3 38z"' + f(R) + ' stroke="none"/>' +
      '<path d="M58 104c-14-2-24-12-22-26 2-14 16-24 34-22 16 2 26 12 26 26 0 16-16 24-38 22z"' + f(W, 1) + '/>' +
      '<circle cx="56" cy="76" r="5.5"' + f(V, 1) + '/><circle cx="53.5" cy="77" r="2.3" fill="' + K + '" stroke="none"/>' +
      '<path d="M45 66l18 6" stroke-width="3.5"/>' +
      '<path d="M36 82l5-1-3 5z"' + f(R, 1) + ' stroke-width="2"/>' +
      '<path d="M38 93c4 3 10 3 15 0" stroke-width="2.5"/><path d="M42 94h8v6h-8zM46 94v6"' + f(W, 1) + ' stroke-width="2"/>' +
      '<path d="M48 86l-20-4M48 89l-20 2" stroke-width="1.3"/>' +
      '<path d="M47.7 118.4L6 103 44.3 125.6z"' + f(ST, 1) + '/><path d="M44 121.5L14 106.5" stroke-width="1.2"/>' +
      '<path d="M52.7 113.1l-9.4 19.8" stroke-width="5"/><path d="M48 123l8 4"' + s(U, 5) + '/>' +
      '<circle cx="60" cy="129" r="3.5"' + f(A, 1) + ' stroke-width="2"/>' +
      '<path d="M92 112c-12 0-28 4-36 8-5 4-1 11 4 10 10-2 24-6 34-8z"' + f(W, 1) + '/>' +
      '<circle cx="55" cy="124" r="7"' + f(W, 1) + '/>' +
      '<path d="M12 108l3 2M20 112l2 1"' + s(V, 3) + '/>'),

    ink_mite: S(shadow(100, 48) +
      '<path d="M76 150l-16 10-6 22M86 160l-10 10-3 12M116 160l8 10 3 12M126 150l14 10 5 22" stroke-width="3.5"/>' +
      '<path d="M54 182h-6M73 182h-5M127 182h5M145 182h5" stroke-width="3"/>' +
      '<path d="M84 104c-4-12-12-18-22-18M102 102c0-12 4-20 12-24" stroke-width="3"/>' +
      '<circle cx="61" cy="86" r="4" fill="' + K + '"/><circle cx="115" cy="77" r="4" fill="' + K + '"/>' +
      '<path d="M60 140c-4-22 14-40 40-40 26 0 44 14 42 36-2 18-18 28-42 28-22 0-38-8-40-24z" fill="' + K + '"/>' +
      '<path d="M110 162c0 7 2 12 4 12s3-5 2-12" fill="' + K + '"/>' +
      '<path d="M108 110c8 0 18 4 22 10"' + s(W, 3) + ' stroke-opacity=".55"/>' +
      eye(76, 126, 9.5, 3.5) + eye(99, 124, 10.5, 4) +
      '<path d="M70 146c5 4 12 4 17 0"' + s(W, 2.5) + '/><path d="M74 147.5l2 4 2-3"' + f(W, 1) + s(W, 1.5) + '/>' +
      '<circle cx="40" cy="128" r="3" fill="' + K + '" stroke="none"/><circle cx="160" cy="118" r="4" fill="' + K + '" stroke="none"/><circle cx="152" cy="100" r="2" fill="' + K + '" stroke="none"/><circle cx="46" cy="110" r="1.8" fill="' + K + '" stroke="none"/>'),

    ape_piper: S(shadow(108, 62) +
      '<path d="M146 140c14 4 26-4 28-16 2-10 10-14 16-10" stroke-width="7"/><path d="M146 140c14 4 26-4 28-16 2-10 10-14 16-10"' + s(U, 3) + '/>' +
      '<path d="M100 148c-4 14-10 24-18 32h20c4-8 8-16 10-26z"' + f(U) + '/>' +
      '<path d="M126 148c4 12 4 22 2 32h20c-2-10-4-22-8-32z"' + f(U) + '/>' +
      '<path d="M84 185c-6 0-14 0-14-3s6-4 12-4h18v7zM128 185h22c2 0 2-5-2-6h-20z"' + f(F, 1) + '/>' +
      '<path d="M92 92c-10 12-12 40-6 58 8 12 46 12 56 0 6-18 2-46-10-58-10-8-30-8-40 0z"' + f(U) + '/>' +
      '<path d="M126 98l26-70M134 100l40-54M142 104l46-30" stroke-width="7"/>' +
      '<path d="M126 98l26-70M134 100l40-54M142 104l46-30"' + s(P, 4) + '/>' +
      '<path d="M150 34l5 2M170 52l4 3M182 79l3 4"' + s(A, 5) + '/>' +
      '<ellipse cx="118" cy="114" rx="28" ry="19"' + f(V) + '/><path d="M94 108c14 6 34 8 50 4" ' + s(A, 3) + '/>' +
      '<path d="M100 120L60 160" stroke-width="8"/><path d="M100 120L60 160"' + s(P, 4.5) + '/><path d="M60 160l-8 10 12-4z"' + f(A, 1) + '/>' +
      '<path d="M88 102c-6-8-12-14-18-18"' + s(P, 3.5) + '/>' +
      tube('M112 104c-10 6-22 16-34 34', 7, U) + '<circle cx="77" cy="140" r="6"' + f(F, 1) + '/>' +
      tube('M130 128c-12 6-26 10-40 20', 7, U) + '<circle cx="90" cy="148" r="6"' + f(F, 1) + '/>' +
      '<path d="M84 92c-12 0-20-10-20-24 0-16 12-28 28-28 16 0 26 12 26 26 0 16-14 26-34 26z"' + f(U) + '/>' +
      '<circle cx="110" cy="64" r="7"' + f(F, 1) + '/>' +
      '<path d="M66 74c0-10 8-16 18-14 10 2 14 10 12 18-2 10-10 14-18 14-8 0-12-8-12-18z"' + f(F, 1) + '/>' +
      '<path d="M70 64c4-3 10-3 14 0" stroke-width="3"/>' +
      '<circle cx="72" cy="69" r="2.4" fill="' + K + '" stroke="none"/><circle cx="83" cy="68" r="2.4" fill="' + K + '" stroke="none"/>' +
      '<path d="M75 76l2 2" stroke-width="2"/><circle cx="72" cy="85" r="5"' + f(R) + ' stroke-width="2"/>' +
      '<path d="M104 128c6 4 12 6 20 6" stroke-width="1.5"/>' +
      '<path d="M156 18h6v6h-6zM162 21V8M178 10h6v6h-6zM184 13V1" fill="' + K + '" stroke-width="1.5"/>'),

    grotesque_snout: S(shadow(118, 50) +
      '<path d="M112 146l-10 36M138 146l8 36" stroke-width="5"/>' +
      '<path d="M102 182l-12 2M102 182l-8 4M102 182l4 3M146 182l-12 2M146 182l-6 4M146 182l6 2" stroke-width="3"/>' +
      '<path d="M128 48c14-10 32-6 42 6 6 8 14 10 22 8-8 8-22 8-28 2-8-8-20-10-30-6z"' + f(V) + '/><circle cx="191" cy="64" r="5"' + f(A, 1) + '/>' +
      '<path d="M70 100c0-30 24-54 54-54s50 22 50 50-22 56-54 56c-26 0-50-22-50-52z"' + f(F) + '/>' +
      '<path d="M148 58l14-34 8 38z"' + f(R) + '/>' +
      '<path d="M76 86c-20 0-42 4-54 14-6 6-4 14 2 18 4 2 7-1 5-6 10-6 26-8 47-6z"' + f(F, 1) + '/>' +
      '<path d="M54 90l2 7M42 93l3 7M64 89l1 7" stroke-width="1.8"/><circle cx="25" cy="112" r="2" fill="' + K + '" stroke="none"/>' +
      '<circle cx="96" cy="80" r="13" fill="' + W + '"/><circle cx="90" cy="81" r="5.5" fill="' + K + '" stroke="none"/>' +
      '<path d="M82 68c6-6 18-6 26 0" stroke-width="3.5"/>' +
      '<path d="M78 120c8 10 24 12 38 4"/><path d="M84 124l3 5 3-4 3 5 3-4 3 4 3-5" stroke-width="2"/>' +
      '<path d="M140 92c4 6 4 14 0 20M150 100c2 6 2 12 0 16M128 136l4 4M138 132l4 4" stroke-width="1.6"/>' +
      '<path d="M100 140c-6 6-12 10-18 12" stroke-width="5"/><circle cx="80" cy="153" r="5"' + f(F, 1) + '/>' +
      '<path d="M78 150l-6-26" stroke-width="3"/><ellipse cx="71" cy="120" rx="5" ry="7"' + f(U) + '/>'),

    cynocephalus: S(shadow(102, 56) +
      '<path d="M64 182L56 14"' + s(U, 5) + '/>' +
      '<path d="M56 18c-6-6-6-14-1-24 6 8 7 16 1 24z"' + f(ST, 1) + '/><path d="M50 26l12-2" stroke-width="3"/>' +
      '<path d="M92 150l-8 30M120 150l6 30" stroke-width="15"/><path d="M92 150l-8 30M120 150l6 30"' + s(V, 9) + '/>' +
      '<path d="M72 185c0-5 4-7 12-7 6 0 8 4 8 7zM118 185c0-5 4-7 10-7 6 0 10 4 10 7z" fill="' + K + '"/>' +
      '<path d="M86 92c-6 20-10 44-12 62 20 6 46 6 62 0-2-18-6-42-12-62-10-6-28-6-38 0z"' + f(G) + '/>' +
      '<path d="M78 134c18 4 38 4 56 0"' + s(A, 5) + '/>' +
      '<path d="M84 96c-6 6-12 10-18 14" stroke-width="13"/><path d="M84 96c-6 6-12 10-18 14"' + s(G, 7) + '/>' +
      '<circle cx="63" cy="110" r="7"' + f(U, 0.7) + '/>' +
      '<circle cx="126" cy="116" r="25"' + f(V) + '/><circle cx="126" cy="116" r="19" stroke-width="2"/>' +
      '<circle cx="126" cy="116" r="6"' + f(A, 1) + '/>' +
      '<g fill="' + A + '" stroke="none"><circle cx="126" cy="101" r="2"/><circle cx="141" cy="116" r="2"/><circle cx="126" cy="131" r="2"/><circle cx="111" cy="116" r="2"/></g>' +
      '<path d="M112 40l8-26 9 30z"' + f(U, 0.7) + '/><path d="M116 38l4-14 4 16z"' + f(R) + ' stroke="none"/>' +
      '<path d="M90 62c0-16 12-26 26-24 12 2 18 12 16 24-2 12-10 22-22 22-10 0-20-10-20-22z"' + f(U, 0.7) + '/>' +
      '<path d="M94 56c-10 0-24 2-32 8-4 4-2 10 4 10 8 0 18-2 28-4z"' + f(U, 0.7) + '/>' +
      '<path d="M98 78c-8 2-16 2-24-2" stroke-width="2.5"/>' +
      '<circle cx="60" cy="66" r="4" fill="' + K + '"/>' +
      '<path d="M66 74c8 2 18 1 28-3" stroke-width="2.5"/><path d="M72 74l2 5 2-4M82 74l2 5 2-5"' + f(W, 1) + ' stroke-width="1.6"/>' +
      '<circle cx="102" cy="54" r="3" fill="' + K + '" stroke="none"/><path d="M95 47l12 4" stroke-width="3"/>' +
      '<path d="M98 84c8 4 20 4 30-2"' + s(A, 4) + '/>'),

    hare_cavalier: S(shadow(100, 80) +
      '<path d="M24 184c-6-3-3-10 4-20 6-10 6-28 14-34 10-6 18 4 18 18 0 12 4 20 14 22l92 6c7 2 7 6 0 8z"' + f(F) + '/>' +
      '<path d="M40 134c-6-6-10-14-12-22M52 132c0-8 2-16 6-22" stroke-width="3.2"/>' + eye(28, 110, 6) + eye(58, 108, 6) +
      '<path d="M32 156c3 3 7 3 10 0" stroke-width="2.4"/>' +
      '<circle cx="126" cy="138" r="36"' + f(U, 0.6) + '/>' +
      '<path d="' + spiral(128, 140, 4, 8) + '" stroke-width="2.6"/>' +
      '<path d="M98 122c10-12 46-14 58 0l-4 14c-14-4-36-4-50 0z"' + f(L) + '/>' +
      '<g fill="' + A + '" stroke="none"><circle cx="110" cy="126" r="2.2"/><circle cx="127" cy="123" r="2.2"/><circle cx="144" cy="126" r="2.2"/></g>' +
      '<path d="M108 34c4-14 12-26 26-30-2 12-8 24-20 32z"' + f(U, 0.55) + '/>' +
      '<path d="M112 120c-10-12-10-34 2-46 12-10 30-6 36 6 6 12 4 28-4 40z"' + f(U, 0.55) + '/>' +
      '<path d="M116 84c8-5 22-5 30 1l-2 30c-8 4-20 4-28 0z"' + f(V) + '/><path d="M130 86v28M119 98h24"' + s(A, 3.5) + '/>' +
      '<path d="M140 118c10 1 16 6 13 10-4 3-18 3-26 0"' + f(U, 0.55) + '/>' +
      '<path d="M96 36c2-14 8-26 18-32 2 12-2 24-10 34z"' + f(U, 0.55) + '/><path d="M100 34c1-8 5-16 10-22 1 8-1 16-5 22z"' + f(R) + ' stroke="none"/>' +
      '<path d="M104 72c-10 0-18-6-18-15s8-17 20-17 18 7 18 15-8 17-20 17z"' + f(U, 0.55) + '/>' +
      '<circle cx="98" cy="52" r="3" fill="' + K + '" stroke="none"/><path d="M86 58l4 1" stroke-width="3"/><path d="M88 62l-12-2M88 64l-12 4" stroke-width="1.2"/>' +
      '<path d="M164 90L6 112"' + s(P, 7) + '/><path d="M164 86.6L6 108.6M165 93.4L7 115.4" stroke-width="2.4"/>' +
      '<path d="M50 105l1 7M150 88l1 7"' + s(V, 4) + '/>' +
      '<path d="M22 110L38 107.8 50 120 38 117 32 127z"' + f(V) + '/>' +
      '<path d="M90.5 93.8L70 104.5 93 112z"' + f(ST, 1) + '/>' +
      '<circle cx="102" cy="101" r="7"' + f(U, 0.55) + '/>'),

    great_snail: S(shadow(100, 90) +
      '<path d="M12 184c-6-6-2-14 6-24 6-10 2-30 4-44 2-20 14-32 30-32 16 0 26 12 26 30 0 18-4 30-2 42 2 10 6 14 14 16l100 6c8 2 8 6 0 6z"' + f(F) + '/>' +
      '<path d="M22 150c4 3 6 8 6 14M40 160c2 4 2 8 1 12M58 166v10M100 176v7M130 177v6M160 178v5" stroke-width="1.6"/>' +
      '<path d="M40 80c-4-12-10-22-18-28M56 80c2-12 6-22 14-28" stroke-width="4"/>' + eye(20, 50, 8, 3.5) + eye(70, 50, 8, 3.5) +
      '<path d="M10 40l16 6M62 44l16-6" stroke-width="3.5"/>' +
      '<path d="M28 96l-3-20 10 8 8-14 8 14 10-8-3 20z"' + f(A, 1) + '/>' +
      '<circle cx="43" cy="84" r="2.6" fill="' + V + '" stroke="none"/><circle cx="32" cy="88" r="2" fill="' + L + '" stroke="none"/><circle cx="54" cy="88" r="2" fill="' + L + '" stroke="none"/>' +
      '<path d="M20 120c6-5 16-5 22 0" stroke-width="3"/><path d="M24 118l2 5 2-4M35 117l2 4 2-5"' + f(W, 1) + ' stroke-width="1.5"/>' +
      '<circle cx="124" cy="120" r="55"' + f(A) + '/>' +
      '<path d="' + spiral(128, 122, 5, 9) + '"' + s(U, 9) + ' stroke-opacity=".55"/>' +
      '<path d="' + spiral(128, 122, 5, 9) + '" stroke-width="3"/>' +
      '<path d="M150 166l8 2M164 156l8 4M174 140l8 2M176 124h7" stroke-width="1.6"/>' +
      '<path d="M96 76V52h14v22M140 72V50h14v24"' + f(W, 1) + '/>' +
      '<path d="M110 74V36h30v36"' + f(W, 1) + '/>' +
      '<path d="M108 36v-7h6v4h5v-4h6v4h5v-4h6v4h5v-4h3v7z"' + f(W, 1) + ' stroke-width="2.5"/>' +
      '<path d="M94 52l9-18 9 18zM138 50l9-18 9 18z"' + f(L) + '/>' +
      '<path d="M103 34V22M147 32V20M125 29V8" stroke-width="2"/>' +
      '<path d="M103 22l12 3-12 4zM147 20l12 3-12 4zM125 8l16 4-16 5z"' + f(V) + ' stroke-width="2"/>' +
      '<path d="M120 74v-9a5 5 0 0110 0v9z" fill="' + K + '"/>' +
      '<path d="M125 44v8M103 58v6M147 56v6" stroke-width="3"/>' +
      '<path d="M90 76c20-6 50-6 72 0" stroke-width="2.5"/>' +
      '<g fill="' + W + '" stroke="' + K + '" stroke-width="1.5"><circle cx="78" cy="132" r="3"/><circle cx="90" cy="158" r="3"/><circle cx="112" cy="174" r="3"/><circle cx="170" cy="100" r="3"/><circle cx="166" cy="84" r="3"/></g>'),

    kitten_scrawl: S(shadow(108, 40) +
      '<path d="M120 176c20 4 32-6 30-22-2-12 6-20 16-18" stroke-width="4"/>' +
      '<path d="M122 180c22 2 30-8 31-22 0-10 4-18 14-20" stroke-width="1.6" stroke-opacity=".7"/>' +
      '<path d="M86 182c-14-6-18-30-8-46 8-12 26-14 38-4 14 12 16 36 4 50z"' + f(U, 0.35) + '/>' +
      '<path d="M89 179c-12-8-14-28-6-42 9-12 24-13 35-3 12 12 14 34 3 46" stroke-width="1.6" stroke-opacity=".7"/>' +
      '<path d="M100 150c6 2 10 8 10 14M96 156c4 2 6 6 6 10" stroke-width="1.6"/>' +
      '<path d="M68 96l-4-22 16 12M96 88l10-18 2 22"' + f(U, 0.35) + '/>' +
      '<path d="M64 112c-4-14 6-26 20-26s26 10 24 24c-2 12-12 18-24 18s-18-6-20-16z"' + f(U, 0.35) + '/>' +
      '<path d="M66 110c-3-12 7-22 19-22s22 9 21 21" stroke-width="1.6" stroke-opacity=".7"/>' +
      '<ellipse cx="76" cy="104" rx="4" ry="5" fill="' + W + '"/><ellipse cx="94" cy="103" rx="4" ry="5" fill="' + W + '"/>' +
      '<path d="M75 101v6M93 100v6" stroke-width="2.5"/>' +
      '<path d="M82 112l3 2 3-2M85 114v2M80 118c2 2 4 2 5 0 1 2 3 2 5 0" stroke-width="2"/>' +
      '<path d="M72 114l-20-4M72 117l-18 3M98 113l14-4" stroke-width="1.4"/>' +
      '<path d="M84 182h-14c-4 0-4-5 0-5h12M104 182h-12c-4 0-4-5 0-5h10" stroke-width="2.5"/>' +
      '<path d="M140 120c6-8 14-6 12 2s-12 6-6-2c4-4 10-4 12 0M50 140c4-4 10-2 8 3s-8 2-4-3" stroke-width="1.8" stroke-opacity=".8"/>' +
      '<circle cx="132" cy="104" r="2.5" fill="' + K + '" stroke="none"/><circle cx="46" cy="160" r="2" fill="' + K + '" stroke="none"/>'),

    bookmite: S(shadow(104, 66) +
      '<path d="M66 156l-12 14-4 14M84 160l-6 12v12M106 162l2 10-2 12M128 162l8 10 4 12M150 160l12 8 8 12" stroke-width="3"/>' +
      '<path d="M162 148l22-8M163 152l24 1M160 157l20 9" stroke-width="2.2"/>' +
      '<ellipse cx="150" cy="150" rx="15" ry="12"' + f(P) + '/>' +
      '<ellipse cx="128" cy="147" rx="18" ry="16"' + f(W, 1) + '/>' +
      '<ellipse cx="104" cy="145" rx="20" ry="18"' + f(P) + '/>' +
      '<ellipse cx="80" cy="148" rx="16" ry="15"' + f(W, 1) + '/>' +
      '<path d="M144 146h12M144 151h10M120 141h16M120 146h16M120 151h12M96 138h18M96 143h18M96 148h16M74 144h12M74 149h10" stroke-width="1.2" stroke-opacity=".7"/>' +
      '<rect x="88" y="136" width="6" height="7"' + f(V, 1) + ' stroke-width="1.2"/>' +
      '<path d="M48 142c-10-10-22-14-34-12M50 146c-12-4-24-2-32 4" stroke-width="2.2"/>' +
      '<circle cx="58" cy="150" r="13"' + f(U, 0.6) + '/>' +
      '<circle cx="53" cy="145" r="3.2" fill="' + K + '" stroke="none"/><circle cx="52" cy="144" r="1" fill="' + W + '" stroke="none"/>' +
      '<path d="M46 156l-7 3M48 160l-5 6" stroke-width="2.5"/>')
  });
})();
