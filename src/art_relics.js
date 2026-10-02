/* MARGINALIA — relic artist: tiny inked relic objects for the gold roundel badges (M.ART.relics). */
(function () {
  var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M;
  M.ART = M.ART || {};

  var K = '#2a1f1a', V = '#b8321f', L = '#1f4f96', G = '#2f7d62', A = '#e2b33a', U = '#8a5a32', W = '#f6ecd4',
      ST = '#c4c0b6', R = '#e3a3a0', B = '#efe4c6', O = '#a8462a';
  function f(c, o) { return ' fill="' + c + '"' + (o ? ' fill-opacity="' + o + '"' : ''); }
  function w(n) { return ' stroke-width="' + n + '"'; }
  function I(b) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" stroke="' + K + '" ' +
      'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + b + '</svg>';
  }
  // scallop: fan with hinge at bottom
  function scallop(fill, ribs) {
    return '<path d="M16 25.5L5.5 13.5C5 7.5 10 4.5 16 4.5s11 3 10.5 9z"' + f(fill) + '/>' +
      '<path d="M12.5 25.5l3.5-2.5 3.5 2.5-3.5 2z"' + f(fill) + '/>' +
      '<path d="M16 25V5M16 25L10.5 6.2M16 25L21.5 6.2M16 25L7 9.5M16 25L25 9.5"' + w(ribs || 1.4) + '/>';
  }
  var BOOK = '<path d="M7.5 12.5l8.5-2.5 8.5 2.5-1.5 4-7-2-7 2z"' + f(W) + '/><path d="M16 10v4.5"' + w(1.4) + '/>';

  M.ART.relics = Object.assign(M.ART.relics || {}, {
    // ---- starter
    pilgrim_badge: I('<path d="M5 27L25 6"' + w(1.6) + '/>' + scallop(ST) + '<circle cx="16" cy="3.4" r="1.6"' + f(ST) + w(1.4) + '/>'),

    // ---- common
    oak_gall: I('<path d="M16 12V4.5M16 8c3-3 7-3 9-1"' + w(1.7) + '/>' +
      '<path d="M18 6.5c1-2.5 3.5-3 5-2 .5 1.5 2.5 1.5 2 3.5-1.5.5-1 2-3 2.2-1.5-.5-3-1.5-4-3.7z"' + f(G) + w(1.4) + '/>' +
      '<circle cx="15" cy="19.5" r="8"' + f('#b88a55') + '/><circle cx="12.5" cy="17" r="1"' + f(K) + ' stroke="none"/><circle cx="18" cy="22" r=".8"' + f(K) + ' stroke="none"/><path d="M10 22.5c1 1.5 2.5 2.2 4 2.4"' + w(1.3) + ' stroke="' + W + '"/>'),
    pumice_stone: I('<path d="M5 18c-1-5 3-9 8-9.5 3-1.5 7-1 10 1 4 2 5 6 3.5 9.5-1.5 4-6 6-11 5.5S5.5 22 5 18z"' + f(ST) + '/>' +
      '<circle cx="11" cy="14" r="1.4"' + w(1.4) + '/><circle cx="17" cy="12.5" r="1"' + w(1.3) + '/><circle cx="21.5" cy="17" r="1.6"' + w(1.4) + '/><circle cx="14" cy="19.5" r="1.1"' + w(1.3) + '/><circle cx="9" cy="20" r=".8"' + w(1.2) + '/><circle cx="19" cy="22" r=".9"' + w(1.2) + '/>'),
    burnishing_tooth: I('<path d="M5 28.5L15 17"' + w(3.6) + '/><path d="M5 28.5L15 17"' + w(1.6) + ' stroke="' + U + '"/>' +
      '<path d="M12.5 17.5l3.5 3M14 15.5l3.5 3"' + w(1.5) + '/>' +
      '<path d="M14.5 16c1-3 3.5-4.5 6-4.5C22 8 25 5 28 3.5c0 4.5-1.5 9-4.5 11.5-.5 2.5-2.5 4.5-5.5 5z"' + f(W) + '/>' +
      '<path d="M21 13.5c1.5-.8 2.5-.5 3 .8"' + w(1.2) + '/>'),
    scallop_shell: I(scallop(R, 1.5)),
    vermilion_cake: I('<path d="M5 13.5v6c0 2.8 5 5 11 5s11-2.2 11-5v-6"' + f(V) + '/>' +
      '<ellipse cx="16" cy="13.5" rx="11" ry="5"' + f('#d9533a') + '/><path d="M11 12.5c2-1.2 6-1.4 9-.5"' + w(1.3) + ' stroke="' + W + '"/>' +
      '<path d="M24.5 9.5c1 0 2.5 1.2 2.5 2.5"' + w(1.4) + '/>'),
    wax_tablet: I('<rect x="5" y="5" width="22" height="22" rx="2"' + f(U) + '/><rect x="8.5" y="8.5" width="15" height="15" rx=".8"' + f('#4f5a2e') + '/>' +
      '<path d="M11 12.5h9M11 16h7M11 19.5h8"' + w(1.4) + ' stroke="' + W + '"/>'),
    goose_quill: I('<path d="M6.5 26.5C9 17 16 8 27 4.5 25 14 18 21 9.5 24z"' + f(W) + '/><path d="M5 28L19 13"' + w(1.5) + '/>' +
      '<path d="M14 18.5l-2.5-3M17.5 15l-2-3.5M21 11.5l-1.5-3"' + w(1.2) + '/>'),
    rabbits_foot: I('<path d="M12.5 10c-3 5-4.5 9-4 13 .5 3.5 3.5 5.5 7 5 4-.5 6-3.5 5.5-7-.5-3-2.5-6-3.5-11z"' + f(W) + '/>' +
      '<path d="M10.5 24.5l-.8 3M13.5 25.5l-.3 3M16.5 25.2l.5 2.8"' + w(1.3) + '/>' +
      '<path d="M11.5 6.5h7v4h-7z"' + f(A) + '/><circle cx="15" cy="4" r="2"' + w(1.5) + '/>'),
    silverpoint: I('<path d="M22 4l6 6-14 14-6-6z"' + f(U) + '/><path d="M8 18l6 6-5 2-3-3z"' + f(ST) + '/>' +
      '<path d="M18.5 7.5l6 6"' + w(1.4) + ' stroke="' + A + '"/><path d="M6 23l-1.5 4.5"' + w(1.4) + '/><path d="M3 29c2-1 4 .5 6-.5"' + w(1.2) + '/>'),
    pilgrims_purse: I('<path d="M7 12h18v9c0 4-4 7-9 7s-9-3-9-7z"' + f(U) + '/><path d="M6 12.5c3-3 17-3 20 0l-3.5 5.5h-13z"' + f('#a8743f') + '/>' +
      '<path d="M8 12c0-6 4-9 8-9s8 3 8 9"' + w(1.6) + '/><circle cx="16" cy="19" r="2.2"' + f(A) + w(1.4) + '/>'),
    ampulla: I('<path d="M13 4h6M14 4v6h4V4"' + f(ST) + '/><path d="M14 8c-4 0-5.5 2-5.5 4M18 8c4 0 5.5 2 5.5 4"' + w(1.6) + '/>' +
      '<circle cx="16" cy="19.5" r="8.5"' + f(ST) + '/><path d="M16 14v11M11.5 19.5h9"' + w(1.5) + ' stroke="' + L + '"/>'),
    bone_folder: I('<path d="M3.5 22l12.5-5 12.5 5-12.5 6z"' + f(W) + '/><path d="M3.5 22l12.5-9 12.5 9"' + f(W) + '/><path d="M16 13v15"' + w(1.3) + '/>' +
      '<path d="M5 6.5l17 10.5c1.6 1 3.2-1.3 1.8-2.6L8 3c-1.8-1.2-4.6 1.4-3 3.5z"' + f(B) + '/>'),
    // ---- uncommon
    saints_finger: I('<path d="M9 28h12l-1.5-5h-9z"' + f(A) + '/>' +
      '<path d="M13 23V8c0-3 4.5-3 4.5 0v15"' + f(B) + '/><path d="M13 14h4.5M13 18.5h4.5"' + w(1.3) + '/>' +
      '<path d="M12 23h6.5"' + w(2.2) + ' stroke="' + A + '"/>'),
    thorn_reliquary: I('<path d="M12 29h8l-2-5h-4z"' + f(A) + '/><path d="M16 24v-2.5"' + w(1.7) + '/>' +
      '<circle cx="16" cy="13" r="9"' + f(A) + '/><circle cx="16" cy="13" r="5.8"' + f('#dfeaf2') + '/>' +
      '<path d="M12.5 16.5c2-2 3.5-4.5 6.5-7M14.5 13.5l-1.5-1.5M16.5 11.5l.5-2M17 13l1.8.8"' + w(1.4) + ' stroke="' + G + '"/>' +
      '<path d="M16 4V1.8M14.6 2.5h2.8"' + w(1.4) + '/>'),
    gesso_pot: I('<path d="M7 15h18l-2 11c-.3 1.5-1.5 2-3 2h-8c-1.5 0-2.7-.5-3-2z"' + f(U) + '/>' +
      '<path d="M6 15c0-3 3-3 4-5 1.5-3 5.5-4 8-1.5 2 2 5 1 6.5 3.5.7 1 .5 3 .5 3z"' + f('#fbf7ee') + '/>' +
      '<path d="M18 9l7-6"' + w(1.6) + '/><path d="M8.5 20.5h15"' + w(1.3) + '/>'),
    verdigris_phial: I('<path d="M13 3.5h6v3h-6z"' + f(U) + '/><path d="M13.5 6.5v6l-5 9c-1.2 2.5.3 5 3 5h9c2.7 0 4.2-2.5 3-5l-5-9v-6"' + f('#e7efe9') + '/>' +
      '<path d="M10.6 18h10.8l2.6 4.5c.8 1.8-.3 3.5-2.2 3.5h-11.6c-1.9 0-3-1.7-2.2-3.5z"' + f(G) + ' stroke="none"/>' +
      '<path d="M13.5 6.5v6l-5 9c-1.2 2.5.3 5 3 5h9c2.7 0 4.2-2.5 3-5l-5-9v-6"/><circle cx="14" cy="22" r="1"' + w(1.2) + ' stroke="' + W + '"/>'),
    red_ochre: I('<path d="M4 22l3-9 7-3 5 5-2 9-8 1z"' + f(O) + '/><path d="M16 12l7-6 6 4-1 9-6 2z"' + f('#c4623a') + '/>' +
      '<path d="M7 13l4 4 3-7M23 6l-1 7 6-3"' + w(1.3) + '/><circle cx="20" cy="27" r="1"' + f(O) + w(1.2) + '/><circle cx="25" cy="25" r=".8"' + f(O) + w(1.2) + '/>'),
    pilgrim_mirror: I('<path d="M16 21v8M12 29h8"' + w(2.2) + '/><circle cx="16" cy="12" r="9.5"' + f(A) + '/><circle cx="16" cy="12" r="6"' + f('#cfe0f2') + '/>' +
      '<path d="M13 9.5c1-1.2 2.5-1.6 3.5-1.5"' + w(1.4) + ' stroke="#fff"/><path d="M27 3l1.5-1.5M28.5 6h2M25.5 1v-.5"' + w(1.3) + '/>'),
    rubricators_pot: I('<path d="M7 13c-1.5 4-1.5 10 2 13h14c3.5-3 3.5-9 2-13"' + f(K, '0.9') + '/>' +
      '<ellipse cx="16" cy="13" rx="9.5" ry="4.5"' + f(W) + '/>' +
      '<path d="M16 13c-3-1 0-4 3-2.5M16 13c1 2.5 5 1 5.5-1M16 13c-2 2-6 1-6.5-1"' + w(2) + ' stroke="' + V + '"/>' +
      '<path d="M16 13c-3-1 0-4 3-2.5"' + w(2) + ' stroke="' + L + '"/><path d="M16 13c1 2.5 5 1 5.5-1"' + w(2) + ' stroke="' + G + '"/>'),
    lectern: I('<path d="M16 17v8M10 28.5l6-3.5 6 3.5"' + w(2.2) + '/>' +
      '<path d="M3.5 12.5l12.5-3 12.5 3-2 5.5-10.5-2.5L5.5 18z"' + f(W) + '/><path d="M16 9.5v6M8 13l5-1.2M19 11.8l5 1.2"' + w(1.3) + '/>' +
      '<path d="M5.5 18L16 15.5 26.5 18"' + w(1.5) + ' stroke="' + V + '"/>' +
      '<path d="M16 9.5c-1.5-2-1.5-5 1-6.5 2-1 4 .3 3.8 2l2.7.8-3 1.2c-.6 1.5-2.2 2.2-4.5 2.5z"' + f(U) + w(1.5) + '/><circle cx="18.6" cy="4.8" r=".7"' + f(K) + ' stroke="none"/>'),
    snail_shell: I('<path d="M5.5 17a10.5 10.5 0 1 1 21 0c0 6-4.5 10-10 10H4.5"' + f('#d7b27a') + '/>' +
      '<path d="M16 26.5c-5 0-8.5-4-8.5-8.5S11 9.5 16 9.5s7.5 3.5 7.5 7.5-3 6.5-6.5 6.5-5.5-2.5-5.5-5.5 2-4.5 4.5-4.5 4 1.7 4 3.8-1.5 3-3 3"' + w(1.6) + '/>'),

    // ---- rare
    gilded_halo: I('<circle cx="16" cy="13" r="10.5"' + f(A) + '/><circle cx="16" cy="13" r="7.5"' + w(1.2) + ' stroke-dasharray="0 2.6"/>' +
      '<path d="M7 30c0-5 4-7.5 9-7.5s9 2.5 9 7.5"' + f(L) + '/><circle cx="16" cy="15" r="5.5"' + f('#efd2b0') + '/>'),
    arm_reliquary: I('<path d="M11 29V16h10v13z"' + f(ST) + '/><path d="M10 25.5h12M10 19h12"' + w(2.2) + ' stroke="' + A + '"/><path d="M10 25.5h12M10 19h12"' + w(.9) + '/>' +
      '<path d="M11.5 16V7.5c0-1.5 2.2-1.5 2.2 0V5c0-1.5 2.4-1.5 2.4 0v6.5l1-1.5c1-1.2 3 0 2.2 1.5L20.5 16"' + f('#e3e1db') + '/>'),
    golden_burnisher: I('<path d="M5 27.5l11-11"' + w(4.4) + '/><path d="M5 27.5l11-11"' + w(2.4) + ' stroke="' + A + '"/>' +
      '<path d="M14 14.5l3.5 3.5M16 12.5l3.5 3.5"' + w(1.5) + '/>' +
      '<path d="M17 13c2-4.5 5-8 10.5-9.5-.8 5.5-4 8.5-8 11z"' + f('#b5523a') + '/><path d="M20.5 10.5c1.5-1.8 3-3 4.5-3.7"' + w(1.2) + ' stroke="#fff"/>' +
      '<path d="M28 13.5l1.5 1.5M26 17l.5 1.8"' + w(1.3) + '/>'),
    unicorn_horn: I('<path d="M5 28l2.5-7.5L27.5 3 11.5 25.5z"' + f(W) + '/>' +
      '<path d="M9 18.5l4.5 4.5M12.5 15l3.5 3.5M16 11.5l2.5 2.5M19.5 8.5l1.5 1.5"' + w(1.4) + '/>' +
      '<path d="M6 25l2 2"' + w(1.4) + ' stroke="' + A + '"/>'),
    bestiary_page: I('<path d="M6 3.5h15l5 5v20H6z"' + f(W) + '/><path d="M21 3.5v5h5"' + w(1.4) + '/>' +
      '<path d="M9.5 17c2-3.5 5.5-5 8-3 1.5-2 4-2 4.5 0-1.5 0-2.5 1-2.5 2.5-1.5 2.5-6 3-10 .5z"' + f(G) + w(1.4) + '/>' +
      '<path d="M13 15.5l2-3 1 2.5"' + f(V) + w(1.2) + '/>' +
      '<path d="M9.5 8h8M9.5 22h13M9.5 25h9"' + w(1.3) + '/>'),

    // ---- shop
    stationers_ledger: I('<path d="M7 4h16c1.5 0 2.5 1 2.5 2.5v19c0 1.5-1 2.5-2.5 2.5H7z"' + f(V) + '/><path d="M7 4v24M10 4v24"' + w(1.4) + '/>' +
      '<rect x="13.5" y="8" width="8.5" height="5" rx=".6"' + f(W) + w(1.3) + '/><path d="M25.5 18h3v4h-3"' + f(A) + w(1.5) + '/>' +
      '<path d="M15 18.5l1 3M17.5 18.5l1 3M20 18.5l1 3"' + w(1.3) + ' stroke="' + W + '"/>'),
    abbots_cushion: I('<path d="M6 8c4 1.5 16 1.5 20 0 1.5 4 1.5 12 0 16-4-1.5-16-1.5-20 0-1.5-4-1.5-12 0-16z"' + f(V) + '/>' +
      '<path d="M16 11.5l4.5 4.5-4.5 4.5-4.5-4.5z"' + f(A) + w(1.4) + '/>' +
      '<path d="M6 8l-2.5-2.5M26 8l2.5-2.5M6 24l-2.5 2.5M26 24l2.5 2.5"' + w(2) + ' stroke="' + A + '"/><path d="M6 8l-2.5-2.5M26 8l2.5-2.5M6 24l-2.5 2.5M26 24l2.5 2.5"' + w(.8) + '/>'),
    vigil_lantern: I('<path d="M13 4.5c0-2.5 6-2.5 6 0M10 8h12l-2-3.5h-8z"' + f(U) + '/>' +
      '<rect x="10" y="8" width="12" height="17" rx="1"' + f('#f6d98c') + '/><path d="M16 8v17"' + w(1.2) + '/>' +
      '<path d="M16 21c-2.5-1.5-2.5-4 0-7.5 2.5 3.5 2.5 6 0 7.5z"' + f(V) + w(1.3) + '/>' +
      '<path d="M8.5 25h15l-1 3h-13z"' + f(U) + '/>'),

    // ---- boss
    gilded_quill: I('<path d="M8 23.5C10.5 15 17 8 27.5 4 25.5 13.5 19 19.5 11 22z"' + f(A) + '/><path d="M6 25.5L19 12.5"' + w(1.5) + '/>' +
      '<path d="M14 17.5l-2.5-3M18 13.5l-2-3.5M21.5 10l-1.5-3"' + w(1.2) + '/>' +
      '<path d="M5.5 26c-1.5 0-2 2-1.5 3.5.5-.3 1-.3 1.5 0 .5-1.5 0-3.5 0-3.5z"' + f(K) + w(1.2) + '/><circle cx="8" cy="29.5" r="1"' + f(K) + ' stroke="none"/>'),
    sanctus_bell: I('<path d="M14 3h4v6h-4z"' + f(U) + '/>' +
      '<path d="M7 24c2-2 2-5.5 2.5-9.5a6.5 6.5 0 0113 0c.5 4 .5 7.5 2.5 9.5z"' + f(A) + '/>' +
      '<circle cx="16" cy="26.5" r="2"' + f(A) + w(1.5) + '/><path d="M3.5 13c-1 2.5-1 5 0 7.5M28.5 13c1 2.5 1 5 0 7.5"' + w(1.5) + '/>'),
    heavy_lectern: I('<path d="M16 17v8M10 28.5l6-3.5 6 3.5"' + w(2.2) + '/>' +
      '<path d="M3.5 12.5l12.5-3 12.5 3-2 5.5-10.5-2.5L5.5 18z"' + f(W) + '/><path d="M16 9.5v6M8 13l5-1.2M19 11.8l5 1.2"' + w(1.3) + '/>' +
      '<path d="M5.5 18L16 15.5 26.5 18"' + w(1.5) + ' stroke="' + V + '"/>' +
      '<path d="M26.5 18.5l.5 3"' + w(1.3) + '/><ellipse cx="27.2" cy="20.4" rx="1.1" ry="1.8"' + w(1.3) + '/><ellipse cx="27.4" cy="23.6" rx="1.8" ry="1.1"' + w(1.3) + '/>' +
      '<path d="M24 25.5h7v5.5h-7z"' + f(ST) + w(1.5) + '/><circle cx="27.5" cy="28" r=".7"' + f(K) + ' stroke="none"/>'),
    cracked_censer: I('<path d="M9 15.5L16 4.5 23 15.5M16 4.5V11"' + w(1.3) + '/><circle cx="16" cy="3" r="1.6"' + f(A) + w(1.3) + '/>' +
      '<path d="M7 17.5c0 5.5 4 9.5 9 9.5s9-4 9-9.5z"' + f(A) + '/><path d="M8.5 17.5c0-3.5 3.5-6 7.5-6s7.5 2.5 7.5 6z"' + f(ST) + '/>' +
      '<circle cx="13" cy="15" r=".7"' + f(K) + ' stroke="none"/><circle cx="16" cy="14" r=".7"' + f(K) + ' stroke="none"/><circle cx="19" cy="15" r=".7"' + f(K) + ' stroke="none"/>' +
      '<path d="M14.5 18.5l2.5 3-1.8 2 2.3 3"' + w(1.6) + '/>' +
      '<path d="M26 12c2-1.5 1-3.5 2.5-5.5M5.5 12c-2-1.5-1-3.5-2.5-5.5"' + w(1.5) + ' stroke="#6f6a62"/>'),
    mendicant_bowl: I('<path d="M3.5 14h25c0 8-5.5 13-12.5 13S3.5 22 3.5 14z"' + f(U) + '/><ellipse cx="16" cy="14" rx="12.5" ry="3.5"' + f('#c99a62') + '/>' +
      '<path d="M8 19.5c2 3 5 4.5 8 4.5M24 19c-.5 1-1.2 2-2.2 2.8"' + w(1.3) + ' stroke="' + W + '"/>' +
      '<path d="M14 25.5c1 1 3 1 4 0v2.5h-4z"' + f(U) + w(1.4) + '/>'),
    rose_window: I('<circle cx="16" cy="15" r="11.5"' + f(ST) + '/>' +
      '<path d="M16 15V3.5M16 15l8.1-8.1M16 15h11.5M16 15l8.1 8.1M16 15v11.5M16 15l-8.1 8.1M16 15H4.5M16 15L7.9 6.9"' + w(1.3) + '/>' +
      '<path d="M16 3.5a11.5 11.5 0 018.1 3.4L16 15z"' + f(V) + w(1.2) + '/><path d="M27.5 15a11.5 11.5 0 01-3.4 8.1L16 15z"' + f(L) + w(1.2) + '/>' +
      '<path d="M16 26.5a11.5 11.5 0 01-8.1-3.4L16 15z"' + f(G) + w(1.2) + '/><path d="M4.5 15a11.5 11.5 0 013.4-8.1L16 15z"' + f(L) + w(1.2) + '/>' +
      '<circle cx="16" cy="15" r="11.5"/><circle cx="16" cy="15" r="3"' + f(A) + w(1.4) + '/>' +
      '<path d="M22 27.5c-1 1.3-1 2.5 0 3 1-.5 1-1.7 0-3z"' + f('#7fb1e0') + w(1.2) + '/>'),
    // ---- the Nun (char_nun.js)
    nun_wooden_rosary: I('<circle cx="16" cy="12" r="8.5" stroke-dasharray="0 3.4"' + w(3.6) + '/><circle cx="16" cy="12" r="8.5" stroke="' + U + '" stroke-dasharray="0 3.4"' + w(2) + '/>' +
      '<path d="M16 20.5v2.5"' + w(1.5) + '/><path d="M16 23v7M13 26h6"' + w(3.4) + '/><path d="M16 23v7M13 26h6"' + w(1.4) + ' stroke="' + U + '"/>'),
    nun_hassock: I('<path d="M5 13v9c0 2.5 5 4.5 11 4.5s11-2 11-4.5v-9"' + f(L) + '/><ellipse cx="16" cy="13" rx="11" ry="4.5"' + f('#5f86c4') + '/>' +
      '<path d="M8 17.5l3 4 3-4 3 4 3-4 3 4"' + w(1.4) + ' stroke="' + A + '"/><path d="M12 12.5c2.5.8 5.5.8 8 0"' + w(1.2) + ' stroke="' + W + '"/>'),
    nun_myrrh: I('<path d="M9 17L16 3l7 14M16 3v8"' + w(1.3) + '/><circle cx="16" cy="3" r="1.4"' + f(A) + w(1.2) + '/>' +
      '<path d="M10 17c0-3.5 2.5-6 6-6s6 2.5 6 6z"' + f(ST) + '/><path d="M8 17h16c0 5-3.5 8.5-8 8.5S8 22 8 17z"' + f(ST) + '/>' +
      '<path d="M13 29h6l-1-3.5h-4z"' + f(ST) + w(1.4) + '/><circle cx="12.5" cy="20.5" r="1.1"' + f(O) + ' stroke="none"/><circle cx="19.5" cy="21.5" r="1.3"' + f(O) + ' stroke="none"/>' +
      '<path d="M25 14c2.5-1 1.5-3.5 3.5-4.5s1-3.5 2.5-4M7 14c-2.5-1-1.5-3.5-3.5-4.5"' + w(1.5) + ' stroke="#8f8a80"/>'),
    nun_crozier: I('<path d="M9 29.5L17.5 13"' + w(3.8) + '/><path d="M9 29.5L17.5 13"' + w(1.8) + ' stroke="' + A + '"/>' +
      '<path d="M17.5 13c-2.5-3-1.5-8.5 3.5-9.5s7.5 3 6 6.5-6 3.5-7 1 1-4 3-3"' + w(4) + '/><path d="M17.5 13c-2.5-3-1.5-8.5 3.5-9.5s7.5 3 6 6.5-6 3.5-7 1 1-4 3-3"' + w(2) + ' stroke="' + A + '"/>' +
      '<path d="M14.5 17l4 2"' + w(1.6) + '/>'),
    nun_cilice: I('<circle cx="16" cy="16" r="9"' + w(4.4) + '/><circle cx="16" cy="16" r="9" stroke="' + ST + '" stroke-dasharray="3 1.2"' + w(2.4) + '/>' +
      '<path d="M16 2.5v3.5M16 26v3.5M2.5 16H6M26 16h3.5M6.5 6.5L9 9M23 23l2.5 2.5M6.5 25.5L9 23M23 9l2.5-2.5"' + w(1.6) + '/>' +
      '<path d="M16 11v-2M16 21v2M11 16H9M21 16h2"' + w(1.5) + '/>'),

    // ---- the Scribe (char_scribe.js)
    scr_exemplar: I('<path d="M16 9C12 6.5 7 6 3 7v17c4-1 9-.5 13 2 4-2.5 9-3 13-2V7c-4-1-9-.5-13 2z"' + f(W) + '/><path d="M16 9v17"' + w(1.4) + '/>' +
      '<path d="M29 7l-4.5-.3L29 11z"' + f('#d8c49c') + w(1.3) + '/><path d="M6 11.5c2-.4 4-.4 6.5.5M6 15c2-.4 4-.4 6.5.5M19.5 12c2-.8 4-.9 6-.5"' + w(1.2) + '/>' +
      '<circle cx="22.5" cy="18" r="3.2"' + w(1.4) + ' stroke="' + U + '"/>'),
    scr_pounce_pot: I('<path d="M8.5 13h15l-1.5 13.5c-.2 1.2-1 1.5-2 1.5h-8c-1 0-1.8-.3-2-1.5z"' + f(U) + '/>' +
      '<path d="M8 13c0-4 3.5-6 8-6s8 2 8 6z"' + f(ST) + '/><circle cx="16" cy="5.5" r="1.6"' + f(ST) + w(1.4) + '/>' +
      '<circle cx="13" cy="10.5" r=".7"' + f(K) + ' stroke="none"/><circle cx="16" cy="9.5" r=".7"' + f(K) + ' stroke="none"/><circle cx="19" cy="10.5" r=".7"' + f(K) + ' stroke="none"/>' +
      '<path d="M11 19h10"' + w(1.3) + ' stroke="' + W + '"/><circle cx="26" cy="5" r=".8"' + f(K) + ' stroke="none"/><circle cx="28" cy="8.5" r=".7"' + f(K) + ' stroke="none"/><circle cx="25" cy="2.5" r=".6"' + f(K) + ' stroke="none"/>'),
    scr_reading_stone: I('<path d="M2.5 26l3-8h21l3 8z"' + f(W) + '/><path d="M6 23h3M24 23h2"' + w(1.2) + '/>' +
      '<path d="M5.5 24.5a10.5 10.5 0 0121 0z"' + f('#d6eef8', '0.92') + '/><path d="M10.5 18.5h11M9.5 22h13"' + w(2.4) + '/>' +
      '<path d="M9 16c1.5-2.5 4-4.3 6.5-4.6"' + w(1.5) + ' stroke="#fff"/>'),
    scr_jeromes_lion: I('<path d="M16 3l2.5 3 3.5-1 .5 3.5 3.5 1-1.5 3 2.5 3-3 2 1 3.5-3.5.5-1 3.5-3-1.5L16 29l-2.5-2.5-3 1.5-1-3.5-3.5-.5 1-3.5-3-2 2.5-3-1.5-3 3.5-1 .5-3.5 3.5 1z"' + f('#b5742e') + '/>' +
      '<circle cx="16" cy="16" r="7.5"' + f(A) + '/><circle cx="13.3" cy="14.5" r=".9"' + f(K) + ' stroke="none"/><circle cx="18.7" cy="14.5" r=".9"' + f(K) + ' stroke="none"/>' +
      '<path d="M14.5 17.5h3l-1.5 1.8zM16 19.3v1.2M13.5 21.5c1.5 1 3.5 1 5 0"' + w(1.3) + '/>'),
    scr_leaking_inkhorn: I('<path d="M4 5c4 1 6 3.5 8 7.5 2.5 5 6 8.5 12 9.5l1.5-6c-4.5-.5-7-3-8.5-7C15.5 5.5 13 3 9.5 2.5z"' + f(B) + '/>' +
      '<ellipse cx="24.8" cy="18.8" rx="1.5" ry="3.2" transform="rotate(14 24.8 18.8)"' + f(K) + '/>' +
      '<path d="M9 8c1.5-.7 3-1.7 4-3M12.5 14c1.8-.6 3.2-1.7 4.5-3.5"' + w(1.3) + '/>' +
      '<path d="M24.5 23c0 2-1 3.5-1 5 0 1.2 2 1.2 2 0 0-1.5-1-3-1-5z"' + f(K) + w(1.2) + '/><path d="M18 30c3-.8 7 .5 11-.3"' + w(1.8) + '/>'),
  });
})();
