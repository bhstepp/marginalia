/* MARGINALIA — art agent A: player knight + UI icons (hand-inked inline SVG strings). */
(function () {
  var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M;
  M.ART = M.ART || {};

  var V = '#b8321f', L = '#1f4f96', G = '#2f7d62', A = '#c99a1e', F = '#e9c9a0', U = '#7a5230',
      P = '#d9c59a', R = '#c98a8a', W = '#f3e8cf', ST = '#bdb8ac';
  function f(c, o) { return ' fill="' + c + '" fill-opacity="' + (o || 0.85) + '"'; }
  function s(c, w) { return ' stroke="' + c + '"' + (w ? ' stroke-width="' + w + '"' : ''); }
  function I(b) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + b + '</svg>';
  }
  var SHIELD = 'M4.5 4h15v6c0 6-3.8 9-7.5 11-3.7-2-7.5-5-7.5-11z';
  var BLOT = 'M12 4c2 0 2.5 2 4 2.2 2 .3 3.8 1.6 3.4 3.8-.3 1.5 1 2.6.4 4.2-.7 2-2.6 2.1-3.6 3.4-1.2 1.6-3 2.6-4.8 1.6-1.4-.8-2.8-.2-4-1.4-1.3-1.3-.4-3-1.5-4.4C4.5 12.6 4 10.4 5.6 9c1.3-1.1 1-3 2.6-4 1.3-.8 2.4 0 3.8-1z';
  var BELL = 'M5 16.5c1.2-1.2 1.2-3.5 1.2-6.5a4 4 0 018 0c0 3 0 5.3 1.2 6.5z';
  var CARD = function (x, y, rot, fill) {
    return '<rect x="' + x + '" y="' + y + '" width="10" height="14" rx="1.4"' + fill +
      (rot ? ' transform="rotate(' + rot + ' ' + (x + 5) + ' ' + (y + 7) + ')"' : '') + '/>';
  };
  var GROT = 'M6.5 12.5c0-2.6 2.4-4 5.5-4s5.5 1.4 5.5 4c0 4.5-2.3 8.5-5.5 8.5s-5.5-4-5.5-8.5z';

  M.ART.icons = {
    intent_attack: I('<path d="M6.9 14.9L18.5 4.2l2-.7-.7 2L9.1 17.1z"' + f(W, 1) + '/><path d="M5 14l5 5M7.5 16.5l-3.5 3.5"/><circle cx="3.4" cy="20.6" r="1.4"' + f(A, 1) + '/>'),
    intent_defend: I('<path d="' + SHIELD + '"' + f(P) + '/><path d="M6.8 14l5.2-4.2 5.2 4.2"' + s(V, 2.4) + '/><path d="' + SHIELD + '"/>'),
    intent_buff: I('<path d="M12 2.5l7 7h-4v4.5H9V9.5H5z"' + f(V) + '/><path d="M9 17.5h6M10 20.5h4"/>'),
    intent_debuff: I('<path d="M12 21.5l-7-7h4V10h6v4.5h4z"' + f(G) + '/><path d="M9 6.5h6M10 3.5h4"/>'),
    intent_curse: I('<path d="' + BLOT + '" fill="currentColor"/><circle cx="20.6" cy="4.2" r="1.1" fill="currentColor" stroke="none"/><circle cx="3.2" cy="18.6" r="1" fill="currentColor" stroke="none"/><circle cx="21" cy="18.4" r=".8" fill="currentColor" stroke="none"/><circle cx="10" cy="11" r="1.3" fill="' + W + '" stroke="none"/><circle cx="14.2" cy="11" r="1.3" fill="' + W + '" stroke="none"/>'),
    intent_erase: I('<path d="M11.2 12.8L19 3.3c1.8 2.4 1.4 6.2-1.6 8.8l-3.8 3.1z"' + f(W, 1) + '/><path d="M11.2 12.8l-6.6 6.6a1.7 1.7 0 002.4 2.4l6.6-6.6z"' + f(U) + '/><path d="M3.5 4.5c1.6-1.2 3.4-.8 3.4.6s-1.6 1.6-.8 3M8.5 2.5c1-.6 2-.2 2 .8" stroke-width="1.3"/>'),
    intent_devour: I('<path d="M3 19.5c1.5-3 4-3 5.2 0s3.6 3 5-.5c1-2.6.5-5 2.3-7.5 1.4-2 4-2 4.8.2" stroke-width="4.6"/><path d="M3 19.5c1.5-3 4-3 5.2 0s3.6 3 5-.5c1-2.6.5-5 2.3-7.5 1.4-2 4-2 4.8.2"' + s(R, 2.4) + '/><circle cx="18.6" cy="11" r=".9" fill="currentColor" stroke="none"/>'),
    intent_summon: I('<path d="M3 17.5C8 16 13 12 16 5.5c2 0 4.5 1.6 5 3.5C17 14.5 10 19 3.6 19.5z"' + f(A) + '/><path d="M7.5 15.8l1 2.3M11.5 13.5l1.3 2.2"/><path d="M19 15l2.5 1.2M16.5 18l1.5 2.2" stroke-width="1.3"/>'),
    intent_unknown: I('<path d="M7.8 8.6c0-3 2-4.6 4.4-4.6 2.3 0 4.2 1.5 4.2 3.8 0 3.2-4.2 3.6-4.2 7.2" stroke-width="2.6"/><circle cx="12.2" cy="19.6" r="1.6" fill="currentColor" stroke="none"/>'),

    ink: I('<path d="M5.5 8.5c0 6 3.5 10.5 11 13-3.5-4-4.5-8-4.5-13z"' + f(U, 0.7) + '/><ellipse cx="8.75" cy="8.5" rx="3.25" ry="1.3" fill="currentColor"/><path d="M6 11.5c1.8.6 4 .6 6.1 0" stroke-width="1.2"/><path d="M9.6 7.6C12.5 4.5 16 2.6 21 1.8c-1 3.6-4.5 5.8-9.3 6.4z"' + f(W, 1) + '/><path d="M9 8.6L19 2.6" stroke-width="1.1"/>'),
    silver: I('<circle cx="12" cy="12" r="8.6" fill="#d8d3c6"/><circle cx="12" cy="12" r="5.8" stroke-width="1.1"/><path d="M12 6.2v11.6M6.2 12h11.6" stroke-width="1.3"/><g fill="currentColor" stroke="none"><circle cx="14.3" cy="9.7" r=".8"/><circle cx="9.7" cy="9.7" r=".8"/><circle cx="9.7" cy="14.3" r=".8"/><circle cx="14.3" cy="14.3" r=".8"/></g>'),
    hp: I('<path d="M12 20.5C6 16.5 3 13 3 9.3 3 6.6 5 4.5 7.6 4.5c2 0 3.4 1.2 4.4 2.8 1-1.6 2.4-2.8 4.4-2.8 2.6 0 4.6 2.1 4.6 4.8 0 3.7-3 7.2-9 11.2z"' + f(V, 0.9) + '/><path d="M6.4 8.6c.3-1.3 1.1-2 2.1-2.1"' + s(W, 1.3) + '/>'),
    ward: I('<path d="' + SHIELD + '"' + f(L) + '/><path d="M12 6.2v12.5M6.8 10.2h10.4"' + s(A, 2.2) + '/><path d="' + SHIELD + '"/>'),
    deck: I(CARD(8, 3, 10, f(P)) + CARD(5.5, 5.5, -4, f(W, 1)) + '<rect x="8" y="9" width="4" height="4"' + f(A) + ' stroke-width="1.1"/><path d="M8.5 15.5h4.5M8.5 17.5h3.5" stroke-width="1.1"/>'),
    draw_pile: I(CARD(9, 2.5, 0, f(P)) + CARD(7, 4.5, 0, f(P)) + CARD(5, 6.5, 0, f(L, 0.8)) + '<path d="M10 10.5l1.2 1.5-1.2 1.5-1.2-1.5zM10 14.5l1.2 1.5-1.2 1.5-1.2-1.5z"' + f(A, 1) + ' stroke-width="1"/>'),
    discard_pile: I(CARD(4, 6, -18, f(P)) + CARD(10, 6, 16, f(W, 1)) + '<path d="M3.5 4.5c3-3 8-3 10.5-.5"' + s(V, 1.6) + '/><path d="M12 1.8l2 2.3-2.7.9"' + s(V, 1.6) + '/>'),
    scraped: I(CARD(7, 5, 0, '') .replace('/>', ' stroke-dasharray="2 1.8"/>') + '<path d="M8.5 8l7 11M15.5 8l-7 11"' + s(V, 2) + '/><path d="M5 4l1.5 1.5M19 4l-1.5 1.5M18.5 21l-1-1" stroke-width="1.2"/>'),
    margin: I('<rect x="4" y="3" width="16" height="18" rx="1"' + f(W, 1) + '/><path d="M6.5 7h6M6.5 10h6M6.5 13h6M6.5 16h4.5" stroke-width="1.1"/><path d="M14.7 4v16" stroke-width=".9" stroke-dasharray="1.2 1.2"/><path d="M17.3 5.5c1.6 1 1.6 3 0 4s-1.6 3 0 4 1.6 3 0 4.5"' + s(G, 1.5) + '/><circle cx="18.8" cy="9.3" r="1" fill="' + V + '" stroke="none"/><circle cx="16" cy="15.6" r="1" fill="' + V + '" stroke="none"/>'),
    map: I('<path d="M2.5 6l6.5-2 6 2 6.5-2v14l-6.5 2-6-2-6.5 2z"' + f(P) + '/><path d="M9 4v14M15 6v14" stroke-width="1.1"/><path d="M5 15.5c2-1 2.5-4 4.5-3.5s3 2.3 5.5-.5 2-3.5 3-4" stroke-dasharray="1.3 1.6"' + s(V, 1.5) + '/><path d="M17 6l2.4 2.4M19.4 6L17 8.4" stroke-width="1.6"/>'),
    menu: I('<path d="M4 7c2-1.2 4 1 6 0s4-1.2 6 0 3 .6 4 0M4 12c2-1.2 4 1 6 0s4-1.2 6 0 3 .6 4 0M4 17c2-1.2 4 1 6 0s4-1.2 6 0 3 .6 4 0" stroke-width="2"/>'),
    sound_on: I('<path d="M10.2 6V4.2"/><path d="' + BELL + '"' + f(A) + '/><circle cx="10.2" cy="18.6" r="1.4" fill="currentColor"/><path d="M18 8.2c1 1.5 1 4 0 5.6M20.6 6.2c2 2.6 2 7.2 0 9.8" stroke-width="1.5"/>'),
    sound_off: I('<path d="M10.2 6V4.2"/><path d="' + BELL + '"' + f(A, 0.4) + '/><circle cx="10.2" cy="18.6" r="1.4" fill="currentColor"/><path d="M3.5 3.5l16.5 17"' + s(V, 2.2) + '/>'),

    node_battle: I('<path d="M8 16L19.5 4.5M16 16L4.5 4.5" stroke-width="2.4"/><path d="M5.3 13.6l5 5M18.7 13.6l-5 5M7.6 16.4l-3.6 3.6M16.4 16.4l3.6 3.6"/><circle cx="3.6" cy="20.4" r="1.3"' + f(A, 1) + '/><circle cx="20.4" cy="20.4" r="1.3"' + f(A, 1) + '/>'),
    node_elite: I('<path d="M7.4 9.5C5 7.5 3.6 5 4.3 2.3c1.5 1.8 3.4 3 5.4 3.9M16.6 9.5C19 7.5 20.4 5 19.7 2.3c-1.5 1.8-3.4 3-5.4 3.9"' + f(V) + '/><path d="M6 11.5c0-4 2.7-6.2 6-6.2s6 2.2 6 6.2c0 3-1 5.2-2 6.6-1 1.8-2.5 3-4 3s-3-1.2-4-3C7 16.7 6 14.5 6 11.5z"' + f(F) + '/><path d="M8.2 10.2l2.4 1.2M15.8 10.2l-2.4 1.2M9.3 16.3c1.7 1 3.7 1 5.4 0" stroke-width="1.4"/><circle cx="10" cy="13" r=".9" fill="currentColor" stroke="none"/><circle cx="14" cy="13" r=".9" fill="currentColor" stroke="none"/><path d="M10.6 16.6l.6 1.3.5-1.2M12.4 16.7l.6 1.2.5-1.3" stroke-width="1"/>'),
    node_boss: I('<path d="M5.8 9L5 2.6l3.3 2.8L12 1.6l3.7 3.8L19 2.6 18.2 9z"' + f(A) + '/><circle cx="12" cy="6.2" r=".9" fill="' + V + '" stroke="none"/><path d="' + GROT + '"' + f(F) + '/><path d="M8.6 12.2l2.3 1M15.4 12.2l-2.3 1M9.2 18.2c1.8-1.3 3.8-1.3 5.6 0" stroke-width="1.4"/><circle cx="10" cy="14.6" r=".9" fill="currentColor" stroke="none"/><circle cx="14" cy="14.6" r=".9" fill="currentColor" stroke="none"/>'),
    node_event: I('<path d="M6.5 5h11v14h-11z"' + f(W, 1) + '/><path d="M5 3.3h14a1.6 1.6 0 010 3.2H5a1.6 1.6 0 010-3.2zM5 17.5h14a1.6 1.6 0 010 3.2H5a1.6 1.6 0 010-3.2z"' + f(P) + '/><path d="M10 10c0-1.4 1-2.1 2-2.1s2 .7 2 1.8c0 1.5-2 1.6-2 3.1"' + s(V, 1.7) + '/><circle cx="12" cy="15" r=".9" fill="' + V + '" stroke="none"/>'),
    node_shop: I('<path d="M7.2 9.5c-2 3-3.2 6-2.2 9 .6 2 2.5 3 7 3s6.4-1 7-3c1-3-.2-6-2.2-9z"' + f(U, 0.75) + '/><path d="M8 9.5L6.6 5l3 1.4L12 3.8l2.4 2.6 3-1.4L16 9.5"' + f(U, 0.5) + '/><path d="M7.2 9.5c2.5-.8 7.1-.8 9.6 0" stroke-width="1.4"/><circle cx="12" cy="15" r="2.4"' + f(A, 1) + ' stroke-width="1.2"/>'),
    node_rest: I('<path d="M12 2.8c1.5 2 2.5 3.3 2.5 4.6a2.5 2.5 0 01-5 0c0-1.3 1-2.6 2.5-4.6z"' + f(A, 1) + '/><path d="M12 6.5c.6.8 1 1.3 1 1.8a1 1 0 01-2 0c0-.5.4-1 1-1.8z" fill="' + V + '" stroke="none"/><path d="M12 10V9"/><path d="M9.5 10.5h5v9h-5z"' + f(W, 1) + '/><path d="M9.5 12c1 0 1 2 1.6 2s.4-2 1.2-2" stroke-width="1.1"/><path d="M5.5 19.5h13c0 1.6-13 1.6-13 0z"' + f(A) + '/>'),
    node_treasure: I('<path d="M4 12h16v8.5H4z"' + f(L) + '/><path d="M3 12l3-6h12l3 6z"' + f(L) + '/><path d="M4 12h16M12 6v14.5M8 6l-1 6M16 6l1 6"' + s(A, 1.8) + '/><path d="M4 12h16v8.5H4zM3 12l3-6h12l3 6z"/><path d="M8 6V3.8M12 6V3M16 6V3.8M11 4h2" stroke-width="1.3"/><circle cx="12" cy="16" r="1.3" fill="' + V + '" stroke="none"/>'),

    st_might: I('<path d="M4.5 20.5L12.2 12.8"' + s(U, 3.2) + '/><path d="M4.5 20.5L12.2 12.8" stroke-width=".9"/><circle cx="15.5" cy="9" r="4.2" fill="' + ST + '"/><path d="M15.5 2.7v1.4M21.8 9h-1.4M19.9 4.6l-1 1M11.1 4.6l1 1M19.9 13.4l-1-1" stroke-width="1.8"/><circle cx="15.5" cy="9" r="1.2"' + f(V, 1) + ' stroke="none"/>'),
    st_resolve: I('<path d="M7 21V9h10v12z"' + f(P) + '/><path d="M6 9V4.8h2.5v2H11V4.8h2v2h2.5V4.8H18V9z"' + f(P) + '/><path d="M10.4 21v-3a1.6 1.6 0 013.2 0v3z" fill="currentColor"/><path d="M12 11.5v2.5" stroke-width="1.4"/>'),
    st_corrode: I('<path d="M11 2.8c2.5 3.5 4.5 6 4.5 8.5a4.5 4.5 0 01-9 0c0-2.5 2-5 4.5-8.5z"' + f(G) + '/><path d="M18 11c1 1.5 1.8 2.5 1.8 3.4a1.8 1.8 0 01-3.6 0c0-.9.8-1.9 1.8-3.4z"' + f(G) + ' stroke-width="1.3"/><path d="M3.5 20.5c1.5-1 2.5 1 4 0s2.5 1 4 0 2.5 1 4 0 2.5 1 4 0"/><circle cx="9.3" cy="10.6" r=".9"' + s(W, 1) + '/>'),
    st_smudged: I('<path d="M4.5 16c3-6.5 9-9.5 14.5-8.5 1 3-2 6.3-5 8.2s-6.5 3.2-9.5.3z" fill="currentColor" fill-opacity=".55" stroke="none"/><path d="M5.5 17.5c4-1 8.5-3.5 12.5-8.5M8 19.3c3.2-.8 6.5-2.6 9.5-5.6M4 13.5c2-3 5-5.5 8-6.5"/><circle cx="19.5" cy="18" r="1" fill="currentColor" stroke="none"/>'),
    st_torn: I('<path d="M4 3.5h7.5l-1.5 3 2 2.5-2 3 1.5 3-1.6 5.5H4z"' + f(W, 1) + '/><path d="M14 4h6v16.5h-6.6l1.6-5.3-1.5-3 2-3-2-2.6z"' + f(W, 1) + '/><path d="M5.8 7.5h2.7M5.8 10.5h2M5.8 13.5h2.5M16.5 8h2M16.5 11h2M16.5 14h2" stroke-width="1"/>'),
    st_faded: I('<path d="' + SHIELD + '"' + f(L, 0.3) + ' stroke-dasharray="2 1.8"/><path d="M12 7v4M9.5 9h5" stroke-opacity=".5"/>'),
    st_brambles: I('<path d="M3 20c3-2 4-6.5 7-7.5s5 2 8-1 2-6 3.5-7.5"' + s(G, 2.2) + '/><path d="M6.6 16l-2.2-.9M10 12.6l-.8-2.5M13.6 13.8l.8 2.2M17.6 11l2.1.4M19.8 6.8l-2-.9" stroke-width="1.5"/><circle cx="21" cy="3.4" r="1.6" fill="' + V + '"/>'),
    st_mending: I('<path d="M4.5 19.5L17 7"/><ellipse cx="18.4" cy="5.6" rx="1.3" ry="2.1" transform="rotate(45 18.4 5.6)"/><path d="M18.4 5.6c2.6 1 1.5 4.3-1.3 4.8S12 12.5 13 15.4s-3.3 4.6-6.3 3.4"' + s(V, 1.6) + '/>'),
    st_steadfast: I('<circle cx="12" cy="4.4" r="1.7"/><path d="M12 6.1v14.4M8 9.3h8M4.8 14c0 4 3.4 6.5 7.2 6.5s7.2-2.5 7.2-6.5" stroke-width="1.9"/><path d="M3.6 15.8l1.2-2.4 2.3 1.4M20.4 15.8l-1.2-2.4-2.3 1.4" stroke-width="1.6"/>'),
    st_zeal: I('<path d="M12 2.3c1 3 4.8 5 4.8 10.4a4.8 4.8 0 01-9.6 0c0-2.2 1-3.7 2.1-4.7 0 1.6.5 2.6 1.6 3.1 0-3.1 0-6.3 1.1-8.8z"' + f(V) + '/><path d="M12 20.6c-1.5 0-2.6-1-2.6-2.6 0-1.6 1.6-2.6 2.6-4.2 1 1.6 2.6 2.6 2.6 4.2 0 1.6-1.1 2.6-2.6 2.6z" fill="' + A + '" stroke="none"/>'),
    st_shell: I('<path d="M3.5 19.5c0-6 3.5-12 9-12s8 3.7 8 7.5c0 2.6-1.4 4.5-4 4.5z"' + f(U, 0.55) + '/><path d="M12.3 15.2a1.4 1.4 0 11-1.4-1.6 3 3 0 013 3 4.4 4.4 0 01-4.4 2.9"/><path d="M12.3 15.2c0-2.5 1.6-4.4 4-4.4 2.2 0 3.8 1.6 4.2 4" stroke-width="1.2"/><path d="M2.5 19.5h19"/>'),
    st_parched: I('<path d="M12 3c3 4 5.5 7 5.5 10.5a5.5 5.5 0 01-11 0C6.5 10 9 7 12 3z"' + f(P, 0.7) + ' stroke-dasharray="2.2 1.4"/><path d="M12.4 8.5l-1.5 3 2.2 1.6-1.6 3.2 1.1 2.2" stroke-width="1.4"/>'),

    type_attack: I('<path d="M12 2l2 3v10h-4V5z"' + f(W, 1) + '/><path d="M12 5.5v8" stroke-width="1"/><path d="M6.8 15.2h10.4M12 15.2v4.6" stroke-width="2"/><circle cx="12" cy="21.2" r="1.4"' + f(A, 1) + '/>'),
    type_skill: I('<path d="M12 6.5c-2.2-1.6-5.4-2-8.5-1.5v13c3.1-.5 6.3-.1 8.5 1.5 2.2-1.6 5.4-2 8.5-1.5V5c-3.1-.5-6.3-.1-8.5 1.5z"' + f(W, 1) + '/><path d="M12 6.5V19.5M5.6 8.6c1.5-.2 3 0 4.3.6M5.6 11.6c1.5-.2 3 0 4.3.6M5.6 14.6c1.5-.2 3 0 4.3.6" stroke-width="1"/><path d="M15 5.6v6.2l1.2-1 1.2 1V5.3"' + f(V, 1) + ' stroke-width="1"/>'),
    type_gloss: I('<path d="M5.5 18.5C8 11 13 5 21 3c-1 6-5.8 11.8-12.4 13.5z"' + f(W, 1) + '/><path d="M3.5 20.5L15.5 8.5" stroke-width="1.3"/><path d="M11.5 10.2l1.5 2.6M14 8.5l1.6 2.2M16.6 6.6l1.4 1.9" stroke-width="1"/><path d="M3 21.3c-.8 1.3 1 .8 1.8 0" stroke-width="1.2"/><circle cx="18.6" cy="17.6" r="1.6"' + f(A, 1) + '/>'),
    type_blot: I('<path d="M5 6.5c2-2 5-1.6 7-2.6s5-.4 6.5 1.6.2 4 .6 5.6.9 3.8-.6 5c-1 .8-1.3-1.2-2 0s.2 3.8-1 4.1-1-2.6-2-2.4-.5 4.8-2 4.8-1.1-4.2-2.1-4.2-1 2-2.3 1.4.5-3-1-4.4S3 8.5 5 6.5z" fill="currentColor"/><circle cx="20.5" cy="4" r=".9" fill="currentColor" stroke="none"/><circle cx="3" cy="19.5" r=".8" fill="currentColor" stroke="none"/>'),
    relic: I('<path d="M7.5 8.6C5.4 8 5 6 6.6 5.4M16.5 8.6c2.1-.6 2.5-2.6.9-3.2" stroke-width="1.4"/><path d="M12 6.4c3.6 0 6.1 2.7 6.1 6.6s-2.5 7.5-6.1 7.5S5.9 17 5.9 13s2.5-6.6 6.1-6.6z"' + f(A) + '/><path d="M10.4 3.2h3.2v3.3h-3.2z"' + f(A) + '/><circle cx="12" cy="13.3" r="3.2"' + f(L) + ' stroke-width="1.2"/><path d="M12 11.6v3.4M10.3 13.3h3.4"' + s(W, 1.2) + '/>')
  };

  // ---------- the player: a small, slightly comic margin knight on foot, facing right ----------
  var K = '#2a1f1a';
  M.ART.player =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="' + K + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
    '<ellipse cx="102" cy="186" rx="60" ry="4.5"' + f(U, 0.25) + ' stroke="none"/>' +
    '<path d="M24 185c1-5 2-7 3-8M31 185c0-4 2-7 4-8M160 185c1-5 3-7 5-8M168 185c0-3 1-5 3-6"' + s(G, 2.5) + '/>' +
    // lance (behind)
    '<path d="M20.8 136.7L175.5 82.6 193 77 176.5 85.4 23.2 143.3z"' + f(P) + '/>' +
    '<path d="M41 128.5l3 6.5M150 90l3 6.5M163 85.5l3 6.2"' + s(V, 4) + '/>' +
    '<path d="M158 90.4L172 85.3C162 95 152 101 140 110l4-9.5-16 3.5c12-5.5 21-9.5 30-13.6z"' + f(V) + '/>' +
    // far leg + foot
    '<path d="M110 146l8 32" stroke-width="16"/><path d="M110 146l8 32" stroke="' + ST + '" stroke-width="10"/>' +
    '<path d="M110 185c0-6 5-9 11-8.5 6 .5 11 4 18 8.5z"' + f(ST, 1) + '/>' +
    // surcoat body
    '<path d="M74 98c12-7 38-7 48 0l7 52c-16 7-48 7-64 0z"' + f(L) + '/>' +
    '<path d="M96 100v50M80 116h32"' + s(A, 3) + '/>' +
    '<path d="M68 136c18 5 40 5 58 0"' + s(U, 5) + '/>' +
    '<path d="M65 150c5 3 9 3 13 0 5 3 9 3 13 0 5 3 9 3 13 0 5 3 9 3 13 0 5 3 8 3 12 0" stroke-width="2.5"/>' +
    // near leg + foot (striding back)
    '<path d="M86 150l-14 29" stroke-width="16"/><path d="M86 150l-14 29" stroke="' + ST + '" stroke-width="10"/>' +
    '<path d="M64 185c0-6 5-9 11-8.5 6 .5 11 4 18 8.5z"' + f(ST, 1) + '/>' +
    '<path d="M110 160l6-2M112 168l6-2M80 160l6 2M77 168l6 2" stroke-width="1.6"/>' +
    // plume + great helm
    '<path d="M98 33C88 17 66 16 52 28c10-3 19-1 25 5-9-2-18 2-23 10 11-6 26-6 44-10z"' + f(V) + '/>' +
    '<path d="M76 92V56c0-15 10-24 24-24 13 0 22 7 24 18l2 42c-14 6-36 6-50 0z"' + f(ST, 1) + '/>' +
    '<path d="M84 34c8-3 20-3 28 1"' + s(A, 4) + '/>' +
    '<path d="M99 62h26" stroke-width="5"/>' +
    '<path d="M100 50v38" stroke-width="2"/>' +
    '<path d="M81 62l5-4M81 72l5-4M81 82l5-4" stroke-width="1.6"/>' +
    '<g fill="' + K + '" stroke="none"><circle cx="113" cy="75" r="1.7"/><circle cx="119" cy="75" r="1.7"/><circle cx="113" cy="81" r="1.7"/><circle cx="119" cy="81" r="1.7"/></g>' +
    // heater shield with vermilion cross
    '<path d="M103 100h46v26c0 22-14 32-23 38-9-6-23-16-23-38z"' + f(W, 1) + '/>' +
    '<path d="M126 102v57M105.5 120h41"' + s(V, 10) + ' stroke-linecap="butt"/>' +
    '<path d="M103 100h46v26c0 22-14 32-23 38-9-6-23-16-23-38z"/>' +
    '<path d="M141 132c-1 8-4 14-8 19M144 122v5" stroke-width="1.6"/>' +
    '</svg>';
})();
