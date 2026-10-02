/* Marginalia — enemy art, Quires II & III (art agent B).
   Hand-authored inline SVG, viewBox 0 0 200 200, ground ~y185, facing LEFT.
   Colour tokens ($X) are expanded once at load into plain hex strings. */
(function () {
  var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M;
  var C = {
    I: '#2a1f1a', K: '#6b5a4a', V: '#b8321f', L: '#1f4f96', G: '#2f7d62', A: '#c99a1e', H: '#f0d27a',
    F: '#e9c9a0', U: '#7a5230', R: '#c98a8a', P: '#d9c59a', W: '#f6ecd2', O: '#c8642a', D: '#4a2a20', B: '#ebe4cf'
  };
  function S(body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
      '<g fill-opacity=".85" stroke="#2a1f1a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
      body.replace(/\$([A-Z])/g, function (m, k) { return C[k]; }) + '</g></svg>';
  }
  function shadow(cx, rx) { return '<ellipse cx="' + cx + '" cy="186" rx="' + rx + '" ry="6" fill="$I" fill-opacity=".14" stroke="none"/>'; }
  // a thick inked "tube": ink stroke underneath, pigment stroke on top
  function tube(d, w, col) {
    return '<path d="' + d + '" fill="none" stroke="$I" stroke-width="' + (w + 6) + '"/>' +
      '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-opacity=".9"/>';
  }
  function hatch(d) { return '<path d="' + d + '" fill="none" stroke-width="1.3" stroke-opacity=".7"/>'; }
  function paw(x, y, r) {
    return '<g fill="$I" fill-opacity=".8" stroke="none" transform="translate(' + x + ' ' + y + ') rotate(' + r + ')">' +
      '<ellipse cx="0" cy="2" rx="3.4" ry="2.8"/><circle cx="-3.6" cy="-2.6" r="1.3"/><circle cx="0" cy="-3.8" r="1.3"/><circle cx="3.6" cy="-2.6" r="1.3"/></g>';
  }
  function hydraHead(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M2 -9 L5 -17 L8 -7" fill="$A"/>' +
      '<path d="M-17 1 Q-15 -10 0 -10 Q12 -9 12 2 Q10 10 0 9 L-10 7 Q-17 6 -17 1Z" fill="$G"/>' +
      '<path d="M-16 3 L-6 4" fill="none" stroke-width="2"/><path d="M-13 4 L-12 7 L-10 4" fill="$W" stroke-width="1.2"/>' +
      '<circle cx="-3" cy="-3" r="3" fill="$H" stroke-width="1.5"/><circle cx="-4" cy="-3" r="1.3" fill="$I" stroke="none"/>' +
      '<circle cx="-14" cy="-3" r=".9" fill="$I" stroke="none"/></g>';
  }

  var art = {};

  /* ---------------- Quire II: The Bestiary ---------------- */

  art.monkfish = S(shadow(105, 66) +
    '<path d="M24 176q9-7 18 0t18 0t18 0t18 0t18 0t18 0t18 0t18 0t18 0" fill="none" stroke="$L" stroke-width="2.5"/>' +
    '<path d="M154 110 L190 80 Q181 110 190 142 Z" fill="$G"/>' + hatch('M162 108l20-17M164 111h20M162 115l20 17') +
    '<path d="M84 84 Q98 52 142 76 L134 92 Z" fill="$V"/>' + hatch('M96 80l2-16M108 80l5-15M120 82l8-11') +
    '<path d="M56 110 Q66 74 116 76 Q162 82 164 110 Q160 140 118 146 Q70 150 56 110Z" fill="$G"/>' +
    '<path d="M72 130 Q104 150 152 128 Q138 146 104 148 Q82 146 72 130Z" fill="$P" stroke-width="2"/>' +
    '<g fill="none" stroke-width="1.6">' +
    '<path d="M100 92q5 6 10 0M112 91q5 6 10 0M124 92q5 6 10 0M136 95q5 6 10 0M106 104q5 6 10 0M118 104q5 6 10 0M130 105q5 6 10 0M142 107q5 6 10 0M112 117q5 6 10 0M124 117q5 6 10 0M136 118q5 6 10 0"/></g>' +
    '<path d="M94 122 Q82 146 104 154 Q103 138 110 126Z" fill="$V"/>' + hatch('M98 130l-6 14M103 130l-3 16') +
    '<path d="M26 110 Q20 60 56 54 Q92 54 94 100 Q92 132 64 138 Q32 138 26 110Z" fill="$K" fill-opacity=".97"/>' +
    hatch('M32 116l6 10M30 104l6 12M84 112l-6 12M88 100l-6 14') +
    '<circle cx="54" cy="100" r="22" fill="$F" fill-opacity="1"/>' +
    '<path d="M32 96 Q54 78 76 96 L75 90 Q54 72 33 90Z" fill="$U"/>' +
    '<path d="M42 82 Q54 76 66 82" fill="none" stroke="$W" stroke-width="2" stroke-opacity=".8"/>' +
    '<path d="M36 99l9-2M54 97l9 2" fill="none" stroke-width="2.5"/>' +
    '<circle cx="41" cy="103" r="2.6" fill="$I" stroke="none"/><circle cx="58" cy="103" r="2.6" fill="$I" stroke="none"/>' +
    '<path d="M48 102 q-7 8 0 11" fill="none" stroke-width="2.5"/>' +
    '<path d="M40 119 q8-4 16 0" fill="none" stroke-width="2.5"/>' +
    '<circle cx="66" cy="112" r="3" fill="$R" stroke="none"/>');

  art.blemmye = S(shadow(96, 60) +
    '<path d="M142 76 Q162 100 152 130" fill="none" stroke="$I" stroke-width="16"/><path d="M142 76 Q162 100 152 130" fill="none" stroke="$F" stroke-width="10"/>' +
    '<circle cx="152" cy="132" r="8" fill="$F"/>' +
    '<path d="M80 140 L78 176 L60 180 L58 186 L90 186 L92 140Z" fill="$F"/>' +
    '<path d="M108 140 L110 176 L96 180 L94 186 L122 186 L122 140Z" fill="$F"/>' +
    hatch('M86 152l2 20M118 152l-1 20') +
    '<path d="M56 72 Q100 54 144 72 Q154 110 138 140 Q100 154 62 140 Q46 110 56 72Z" fill="$F"/>' +
    hatch('M132 90l6 6M134 102l6 6M134 114l6 6M62 120l-4 8') +
    '<path d="M60 128 Q100 144 140 128 L136 154 Q120 148 114 160 Q100 150 88 160 Q80 148 64 154Z" fill="$L"/>' +
    '<path d="M62 132 Q100 148 138 132" fill="none" stroke="$A" stroke-width="3"/>' +
    '<ellipse cx="80" cy="90" rx="9" ry="7" fill="$W"/><ellipse cx="108" cy="90" rx="9" ry="7" fill="$W"/>' +
    '<circle cx="76" cy="91" r="3.6" fill="$I" stroke="none"/><circle cx="104" cy="91" r="3.6" fill="$I" stroke="none"/>' +
    '<path d="M68 76 L90 82M120 76 L98 82" fill="none" stroke-width="3.5"/>' +
    '<path d="M94 94 Q82 108 92 112" fill="none"/>' +
    '<path d="M70 118 Q92 134 118 118 Q94 124 70 118Z" fill="$V"/>' +
    '<path d="M78 120 l3 5 l3-4 l3 5 l3-4 l3 5 l3-4 l3 5 l3-5" fill="none" stroke-width="1.6"/>' +
    '<path d="M38 56 L48 50 L30 20 Q24 8 13 13 Q4 20 16 30Z" fill="$U"/>' +
    hatch('M16 18l6 3M20 27l4-6M28 34l4 4') +
    '<path d="M58 76 Q42 70 40 56" fill="none" stroke="$I" stroke-width="16"/><path d="M58 76 Q42 70 40 56" fill="none" stroke="$F" stroke-width="10"/>' +
    '<circle cx="42" cy="54" r="8" fill="$F"/>');

  art.cockatrice = S(shadow(110, 62) +
    tube('M124 120 Q172 146 178 104 Q182 64 150 62 Q126 64 138 84', 12, '$G') +
    '<path d="M128 90 L134 74 L146 88Z" fill="$V"/>' +
    '<g fill="none" stroke-width="1.5"><path d="M150 132l3 6M166 124l5 4M175 106l6 0M170 78l5-4M154 66l1-6"/></g>' +
    '<path d="M84 140 L80 176M104 140 L108 176" fill="none" stroke="$I" stroke-width="9"/><path d="M84 140 L80 176M104 140 L108 176" fill="none" stroke="$A" stroke-width="4"/>' +
    '<path d="M80 176l-14 4M80 176l-9 8M80 176l5 6M108 176l-14 4M108 176l-9 8M108 176l5 6" fill="none" stroke-width="3"/>' +
    '<path d="M60 92 Q56 142 98 148 Q134 148 134 112 Q130 84 96 84 Q74 84 60 92Z" fill="$A"/>' +
    hatch('M70 120l8 8M68 130l10 8M80 138l8 4') +
    '<path d="M84 100 Q112 86 132 104 Q130 126 104 134 Q94 120 84 100Z" fill="$G"/>' +
    '<path d="M94 106 Q112 104 126 112M98 116 Q112 116 122 122" fill="none" stroke-width="1.8"/>' +
    '<path d="M54 100 Q42 76 46 58 Q52 40 70 44 Q82 54 80 98Z" fill="$A"/>' +
    '<path d="M60 74l8 10M56 84l10 8M66 66l8 8" fill="none" stroke="$U" stroke-width="2"/>' +
    '<path d="M44 44 Q40 32 50 32 Q50 22 60 26 Q66 16 74 26 Q82 28 76 40 Q62 40 44 44Z" fill="$V"/>' +
    '<path d="M44 52 L24 60 L44 66Z" fill="$H"/>' +
    '<path d="M46 66 Q40 82 50 82 Q58 78 54 66Z" fill="$V"/>' +
    '<circle cx="56" cy="54" r="5" fill="$W"/><circle cx="54" cy="54" r="2.4" fill="$I" stroke="none"/>' +
    '<path d="M48 46 L62 50" fill="none" stroke-width="3"/>');

  art.fox_preacher = S(shadow(100, 80) +
    '<path d="M138 162 Q184 168 188 122 Q190 102 176 96 Q170 132 136 142Z" fill="$O"/>' +
    '<path d="M176 96 Q190 100 188 122 Q182 112 172 108Z" fill="$W"/>' +
    hatch('M150 156l10-6M160 150l10-8M170 140l8-10') +
    '<path d="M70 94 Q108 78 140 96 L152 184 L66 184Z" fill="$U"/>' +
    hatch('M104 112 L100 182M126 112 L132 182M144 120l4 30') +
    '<path d="M84 140 Q114 148 146 140" fill="none" stroke="$P" stroke-width="4"/>' +
    '<path d="M138 143 l3 22M144 142 l5 18" fill="none" stroke="$P" stroke-width="3"/>' +
    '<path d="M118 100 L138 56 L152 62 L134 106Z" fill="$U"/>' +
    '<circle cx="146" cy="54" r="8" fill="$O"/><path d="M147 47 l1-12" fill="none" stroke="$I" stroke-width="7"/><path d="M147 47 l1-12" fill="none" stroke="$O" stroke-width="3"/>' +
    '<path d="M16 112 L88 112 L84 186 L20 186Z" fill="$U"/>' +
    hatch('M26 120l0 60M78 120l-1 60') +
    '<rect x="10" y="104" width="84" height="10" rx="2" fill="$U"/>' +
    '<path d="M30 114 L74 114 L70 152 L52 162 L34 152Z" fill="$V"/>' +
    '<path d="M52 126 l6 8 l-6 8 l-6-8Z" fill="$A"/><path d="M34 118h36" fill="none" stroke="$A" stroke-width="2.5"/>' +
    '<path d="M22 104 L48 90 L52 98 L26 106Z M52 98 L78 92 L82 102 L56 106Z" fill="$W" stroke-width="2.5"/>' +
    '<path d="M30 100l14-6M58 99l16-4" fill="none" stroke="$K" stroke-width="1.3"/>' +
    '<path d="M86 102 Q72 98 66 100" fill="none" stroke="$I" stroke-width="15"/><path d="M86 102 Q72 98 66 100" fill="none" stroke="$U" stroke-width="10"/>' +
    '<circle cx="62" cy="100" r="6.5" fill="$O"/>' +
    '<path d="M76 86 Q96 98 118 86 Q120 100 98 104 Q78 102 76 86Z" fill="$U"/>' +
    '<path d="M78 50 L72 22 L94 40Z M96 40 L108 18 L112 48Z" fill="$O"/>' +
    '<path d="M79 44 L76 30 L87 40Z M100 40 L106 28 L107 44Z" fill="$I" fill-opacity=".55" stroke="none"/>' +
    '<path d="M42 72 Q58 58 74 54 Q76 38 94 38 Q114 40 114 62 Q112 84 90 86 Q72 86 60 80 Q48 77 42 72Z" fill="$O"/>' +
    '<path d="M46 75 Q66 82 90 86 Q76 92 60 86 Q50 82 46 75Z" fill="$W"/>' +
    '<circle cx="42" cy="71" r="4" fill="$I" stroke="none"/>' +
    '<path d="M74 58 Q80 53 86 58 Q80 61 74 58Z" fill="$H" stroke-width="2"/><circle cx="78" cy="58" r="1.6" fill="$I" stroke="none"/>' +
    '<path d="M72 52 L88 54" fill="none" stroke-width="2.5"/>' +
    '<path d="M50 77 Q58 80 64 77" fill="none" stroke-width="2"/>');

  art.manticore = S(shadow(110, 72) +
    '<path d="M150 132 L158 180 L146 182 L146 186 L170 186 L166 130Z" fill="$U"/>' +
    '<path d="M90 132 L92 180 L80 182 L80 186 L104 186 L104 132Z" fill="$U"/>' +
    '<g fill="$V">' +
    '<circle cx="164" cy="100" r="11"/><circle cx="176" cy="84" r="10.5"/><circle cx="182" cy="66" r="10"/><circle cx="178" cy="48" r="9.5"/>' +
    '<circle cx="166" cy="34" r="9"/><circle cx="150" cy="27" r="8.5"/><circle cx="135" cy="28" r="8"/><circle cx="124" cy="36" r="7"/></g>' +
    '<path d="M126 40 Q112 42 110 58 Q118 50 124 48Z" fill="$I" fill-opacity=".9"/>' +
    '<path d="M68 96 Q90 84 130 88 Q168 92 166 118 Q162 140 132 140 L84 140 Q66 132 68 96Z" fill="$A"/>' +
    hatch('M120 126l6 8M132 124l6 8M144 120l6 8M100 128l6 8') +
    '<path d="M140 130 L136 180 L120 182 L120 186 L146 186 L154 132Z" fill="$A"/>' +
    '<path d="M76 128 L70 180 L54 182 L54 186 L82 186 L92 132Z" fill="$A"/>' +
    '<path d="M54 182l2 4M60 182l2 4M120 182l2 4M126 182l2 4" fill="none" stroke-width="2"/>' +
    '<path d="M52 42 Q62 36 68 46 Q80 44 80 56 Q92 60 86 72 Q96 80 86 90 Q92 102 78 106 Q76 118 62 116 Q54 126 44 118 Q32 122 30 110 Q18 106 22 94 Q12 86 20 76 Q14 64 26 60 Q26 46 40 48 Q44 40 52 42Z" fill="$V"/>' +
    hatch('M70 54l6 4M80 74l6 2M78 96l6 4M30 64l-6-2M24 90l-6 2') +
    '<circle cx="50" cy="82" r="21" fill="$F"/>' +
    '<path d="M32 74 L44 77M52 77 L62 74" fill="none" stroke-width="3"/>' +
    '<circle cx="38" cy="80" r="2.6" fill="$I" stroke="none"/><circle cx="55" cy="80" r="2.6" fill="$I" stroke="none"/>' +
    '<path d="M46 80 q-7 8 0 10" fill="none" stroke-width="2.4"/>' +
    '<path d="M34 94 Q48 90 60 94 Q56 104 46 104 Q36 104 34 94Z" fill="$D"/>' +
    '<path d="M35 95 l3 4 l3-4 l3 4 l3-4 l3 4 l3-4 l3 4 l3-3 M37 102 l3-3 l3 3 l3-3 l3 3 l3-3 l3 3 l3-3" fill="$W" stroke-width="1.3"/>');

  art.wyvern = S(shadow(104, 72) +
    tube('M132 158 Q170 178 184 150 Q190 136 180 132', 9, '$G') +
    '<path d="M172 136 L184 116 L192 138Z" fill="$V"/>' +
    '<path d="M108 102 L148 22 L194 52 Q174 66 180 86 Q160 80 158 100 Q142 92 132 112Z" fill="$V"/>' +
    '<path d="M108 102 L148 22 M148 22 L180 86 M148 22 L158 100" fill="none" stroke-width="2.5"/>' +
    hatch('M140 50l10 6M150 70l8 2M164 56l10 2') +
    '<path d="M96 152 L88 180 L74 184 L100 186 L106 156Z" fill="$G"/>' +
    '<path d="M78 98 Q110 82 136 110 Q148 140 128 160 Q100 172 84 152 Q70 128 78 98Z" fill="$G"/>' +
    '<path d="M84 108 Q86 140 106 160 Q94 162 86 152 Q76 132 84 108Z" fill="$A"/>' +
    hatch('M80 118h8M80 130h10M84 142h10') +
    '<path d="M120 136 Q140 140 136 160 L128 178 L114 182 L112 186 L140 186 L140 178 L146 156 Q146 132 124 126Z" fill="$G"/>' +
    '<path d="M114 182l-4 4M122 182l-2 4" fill="none" stroke-width="2"/>' +
    '<path d="M80 108 Q60 86 50 66 L66 56 Q76 80 98 96Z" fill="$G"/>' +
    '<path d="M70 62 l8 2 l-2 6 M78 76 l8 0 l-3 6 M90 88 l8-2 l-1 7 M100 92 l7-4 l1 7" fill="$V" stroke-width="2"/>' +
    '<path d="M60 46 L72 28 L68 50Z" fill="$A"/>' +
    '<path d="M32 62 Q36 44 56 42 Q74 44 74 58 Q70 70 54 70 L46 70 L24 76 Q18 70 32 62Z" fill="$G"/>' +
    '<path d="M24 76 L46 72 Q42 82 30 82Z" fill="$G"/><path d="M30 74 l2 4 l3-4 l3 4 l3-4" fill="$W" stroke-width="1.3"/>' +
    '<circle cx="50" cy="54" r="5" fill="$H"/><path d="M50 50v8" fill="none" stroke-width="2.2"/>' +
    '<path d="M42 48 L58 50" fill="none" stroke-width="3"/><circle cx="30" cy="62" r="1.3" fill="$I" stroke="none"/>');

  art.scribes_cat = S(shadow(100, 90) +
    '<path d="M6 178 L100 186 L194 178 L194 184 L100 192 L6 184Z" fill="$V"/>' +
    '<path d="M8 176 L28 144 Q66 138 100 152 L100 184 Q56 172 8 176Z" fill="$W"/>' +
    '<path d="M192 176 L172 144 Q134 138 100 152 L100 184 Q144 172 192 176Z" fill="$W"/>' +
    '<g fill="none" stroke="$K" stroke-width="1.4"><path d="M30 152 q8-2 16 0 t16 2M24 160 q10-3 20-1 t18 3M18 168 q10-3 22-1 t20 3M140 150 q8-2 16-1 t14 0M142 158 q10-2 20 0 t16 2M146 166 q10-2 20 0 t18 2"/></g>' +
    '<path d="M28 146 Q18 160 22 170" fill="none" stroke="$V" stroke-width="3"/>' +
    '<rect x="32" y="150" width="9" height="9" fill="$A" stroke-width="1.5"/>' +
    '<path d="M150 148 Q170 140 180 152 Q166 152 150 148Z" fill="$L" stroke-width="1.5"/>' +
    '<path d="M60 164 Q46 156 50 150 Q58 144 66 150 Q70 158 60 164Z" fill="$I" fill-opacity=".75" stroke="none"/>' +
    '<path d="M52 146 L44 132 Q40 126 46 124 L56 122 Q62 124 60 130 L60 142Z" fill="$U"/><ellipse cx="51" cy="123" rx="6" ry="3" fill="$I"/>' +
    paw(36, 176, -20) + paw(22, 186, -30) + paw(46, 164, 10) + paw(8, 192, -20) + paw(160, 168, 20) +
    '<path d="M146 168 L188 134" fill="none" stroke-width="2.5"/>' +
    '<path d="M168 150 Q178 128 196 126 Q192 144 176 150Z" fill="$W" stroke-width="2"/><path d="M172 148 L192 128" fill="none" stroke-width="1.3"/>' +
    tube('M144 156 Q184 156 180 122 Q176 104 162 108', 10, '$O') +
    '<path d="M174 146l8 2M182 132l7-2M174 112l6-6" fill="none" stroke="$U" stroke-width="3"/>' +
    '<path d="M76 160 Q62 122 78 96 Q100 80 126 92 Q152 112 148 160 Q112 172 76 160Z" fill="$O"/>' +
    '<path d="M82 100 Q96 112 94 150 Q80 134 82 100Z" fill="$W"/>' +
    '<g fill="none" stroke="$U" stroke-width="3.5"><path d="M126 98 q10 6 8 16M134 116 q10 6 8 16M140 134 q8 6 6 16M114 92 q6 4 6 12"/></g>' +
    '<path d="M86 128 L84 160M104 130 L104 160" fill="none" stroke="$I" stroke-width="14"/>' +
    '<path d="M86 128 L84 160M104 130 L104 160" fill="none" stroke="$O" stroke-width="8"/>' +
    '<ellipse cx="82" cy="162" rx="9" ry="5" fill="$I" fill-opacity=".9"/><ellipse cx="104" cy="162" rx="9" ry="5" fill="$W"/>' +
    '<path d="M100 162h2M106 162h2" fill="none" stroke-width="1.5"/>' +
    '<path d="M62 50 L56 16 L84 34Z M98 32 L118 12 L120 50Z" fill="$O"/>' +
    '<path d="M63 42 L61 26 L76 36Z M104 34 L114 24 L114 44Z" fill="$R" stroke="none"/>' +
    '<path d="M54 62 Q54 32 88 30 Q122 32 122 62 Q120 90 88 92 Q56 90 54 62Z" fill="$O"/>' +
    '<g fill="none" stroke="$U" stroke-width="3"><path d="M80 34 l2 12M90 32 v14M100 34 l-2 12M56 66 h8M118 66 h-8M58 76 l8-2M116 76 l-8-2"/></g>' +
    '<ellipse cx="82" cy="74" rx="15" ry="11" fill="$W"/>' +
    '<path d="M64 58 Q72 50 80 58 Q72 64 64 58Z M90 58 Q98 50 106 58 Q98 64 90 58Z" fill="$G" fill-opacity=".95" stroke-width="2"/>' +
    '<path d="M70 53 v10M96 53 v10" fill="none" stroke-width="2.5"/>' +
    '<path d="M77 67 L85 67 L81 72Z" fill="$R" stroke-width="2"/>' +
    '<path d="M81 72 q-3 6 -8 3M81 72 q3 6 8 3" fill="none" stroke-width="2"/>' +
    '<g fill="none" stroke-width="1.3"><path d="M68 74 L40 70M68 78 L42 82M96 74 L124 70M96 78 L122 84"/></g>' +
    '<path d="M86 82 q1 6 -1 9" fill="none" stroke="$I" stroke-width="2"/>');

  art.kitten_scrawl = S(shadow(100, 34) +
    tube('M124 168 Q150 168 148 140', 7, '$O') +
    '<path d="M76 184 Q68 146 90 132 Q118 126 128 150 Q132 176 124 184Z" fill="$O"/>' +
    '<g fill="none" stroke="$U" stroke-width="3"><path d="M116 140 q6 4 6 12M122 156 q6 4 4 12"/></g>' +
    '<ellipse cx="86" cy="182" rx="7" ry="4" fill="$I" fill-opacity=".9"/><ellipse cx="104" cy="182" rx="7" ry="4" fill="$I" fill-opacity=".9"/>' +
    '<path d="M70 106 L66 82 L86 96Z M98 94 L112 78 L112 106Z" fill="$O"/>' +
    '<path d="M64 116 Q64 92 90 92 Q116 94 114 118 Q112 138 88 138 Q64 136 64 116Z" fill="$O"/>' +
    '<ellipse cx="84" cy="124" rx="11" ry="8" fill="$W"/>' +
    '<circle cx="76" cy="112" r="5" fill="$G"/><circle cx="96" cy="112" r="5" fill="$G"/>' +
    '<circle cx="75" cy="112" r="2.2" fill="$I" stroke="none"/><circle cx="95" cy="112" r="2.2" fill="$I" stroke="none"/>' +
    '<path d="M81 120 L87 120 L84 124Z" fill="$R" stroke-width="1.5"/>' +
    '<g fill="none" stroke-width="1.2"><path d="M72 124 L52 120M72 128 L54 132M98 124 L118 120"/></g>');

  /* ---------------- Quire III: The Apocalypse ---------------- */

  art.locust_rider = S(shadow(110, 70) +
    '<path d="M92 92 Q118 26 176 34 Q154 70 122 98Z" fill="$P" fill-opacity=".7"/>' +
    '<path d="M100 92 Q132 40 186 52 Q158 82 126 100Z" fill="$W" fill-opacity=".7"/>' +
    '<path d="M104 92 Q140 54 180 52M112 96 Q144 74 172 64M100 90 Q124 50 160 40" fill="none" stroke-width="1.3"/>' +
    tube('M162 112 Q194 104 190 76 Q186 56 170 60', 8, '$V') +
    '<path d="M172 56 Q156 56 158 72 Q164 64 172 64Z" fill="$I" fill-opacity=".9"/>' +
    '<g fill="none" stroke-width="4"><path d="M80 122 L64 150 L56 184M96 128 L102 156 L90 184M124 130 L138 156 L132 184M144 126 L164 154 L168 184"/></g>' +
    '<path d="M56 184h-8M90 184h-8M132 184h-8M168 184h-8" fill="none" stroke-width="3"/>' +
    '<path d="M98 96 Q150 84 170 106 Q172 128 142 134 Q112 136 96 126Z" fill="$A"/>' +
    '<path d="M118 92 Q112 112 120 134M134 90 Q130 112 136 134M150 92 Q148 112 154 130" fill="none" stroke-width="2"/>' +
    '<path d="M56 92 Q70 78 100 86 Q112 106 102 128 Q76 138 60 124 Q50 108 56 92Z" fill="$L"/>' +
    '<path d="M62 102 Q82 96 104 100M60 114 Q82 110 104 114" fill="none" stroke-width="2"/>' +
    '<g fill="$H" stroke="none"><circle cx="70" cy="96" r="1.8"/><circle cx="86" cy="94" r="1.8"/><circle cx="72" cy="122" r="1.8"/><circle cx="90" cy="124" r="1.8"/></g>' +
    '<path d="M50 50 Q78 46 86 70 Q94 96 110 100 Q86 106 70 90 Q58 80 50 50Z" fill="$U"/>' +
    hatch('M66 58 q10 14 16 30M74 56 q8 14 14 26') +
    '<path d="M28 72 Q30 50 50 50 Q68 52 68 72 Q66 92 48 94 Q30 92 28 72Z" fill="$F"/>' +
    '<path d="M32 54 L30 34 L40 44 L48 28 L56 44 L66 34 L66 56 Q50 48 32 54Z" fill="$A"/>' +
    '<circle cx="48" cy="38" r="2.4" fill="$V" stroke="none"/><circle cx="38" cy="48" r="1.8" fill="$L" stroke="none"/><circle cx="60" cy="48" r="1.8" fill="$L" stroke="none"/>' +
    '<path d="M34 62 L46 64" fill="none" stroke-width="3"/>' +
    '<circle cx="39" cy="68" r="2.6" fill="$I" stroke="none"/>' +
    '<path d="M32 70 q-6 6 0 8" fill="none" stroke-width="2.4"/>' +
    '<path d="M30 82 Q42 76 54 82 Q46 92 30 82Z" fill="$D"/>' +
    '<path d="M34 81 l2 6 l2-6 M46 80 l2 6 l2-6" fill="$W" stroke-width="1.4"/>');

  art.ouroboros = S(shadow(105, 60) +
    '<path d="M52.4 79.5 A58 58 0 1 1 52.4 128.5" fill="none" stroke="$I" stroke-width="32"/>' +
    '<path d="M52.4 79.5 A58 58 0 1 1 52.4 128.5" fill="none" stroke="$G" stroke-width="26" stroke-opacity=".9"/>' +
    '<circle cx="105" cy="104" r="48" fill="none" stroke="$A" stroke-width="5" stroke-dasharray="1 12" stroke-opacity=".9"/>' +
    '<circle cx="105" cy="104" r="64" fill="none" stroke="$I" stroke-width="1.4" stroke-dasharray="6 6" stroke-opacity=".6"/>' +
    '<circle cx="105" cy="104" r="54" fill="none" stroke="$H" stroke-width="2" stroke-dasharray="3 9" stroke-opacity=".8"/>' +
    '<path d="M38 136 Q42 120 50 112 Q58 122 68 130Z" fill="$G"/>' +
    '<path d="M34 64 Q52 52 70 66 Q74 90 64 110 L52 120 Q44 116 40 108 Q26 88 34 64Z" fill="$G"/>' +
    '<path d="M64 110 Q60 96 66 84" fill="none" stroke-width="2"/>' +
    '<path d="M42 108 l4-6 l3 7 l4-6 l3 7 l4-6 l3 6" fill="$W" stroke-width="1.5"/>' +
    '<path d="M36 58 L30 44 L44 56Z" fill="$V"/><path d="M60 58 L68 44 L70 62Z" fill="$V"/>' +
    '<circle cx="48" cy="80" r="7" fill="$H"/><path d="M48 74 v12" fill="none" stroke-width="2.6"/>' +
    '<path d="M40 70 L56 74" fill="none" stroke-width="3"/>' +
    '<circle cx="62" cy="100" r="1.4" fill="$I" stroke="none"/>');

  art.hellmouth_imp = S(shadow(110, 84) +
    '<path d="M96 98 Q140 40 194 60 L194 172 Q140 172 96 130Z" fill="$D"/>' +
    '<path d="M118 132 Q116 110 128 100 Q130 114 138 104 Q138 88 152 82 Q148 100 160 96 Q166 82 178 84 Q170 104 186 110 L188 160 Q150 156 118 132Z" fill="$V"/>' +
    '<path d="M140 136 Q140 118 150 112 Q152 124 160 116 Q164 106 172 110 Q168 124 178 130 L178 150 Q156 150 140 136Z" fill="$A"/>' +
    '<path d="M88 96 Q98 40 150 22 Q182 12 192 22 Q198 44 194 66 Q160 50 132 64 Q110 76 96 100Z" fill="$G"/>' +
    '<path d="M104 86 l4 12 l5-14 l6 12 l5-15 l7 12 l6-13 l7 10 l6-10 l6 8" fill="$W" stroke-width="2"/>' +
    '<ellipse cx="150" cy="36" rx="10" ry="7" fill="$H"/><path d="M150 30 v12" fill="none" stroke-width="3"/>' +
    '<path d="M136 26 Q150 18 166 28" fill="none" stroke-width="3.5"/>' +
    '<circle cx="104" cy="70" r="2.5" fill="$I" stroke="none"/>' +
    hatch('M168 18l8 10M180 16l8 10M118 50l6 8') +
    '<path d="M92 128 Q128 172 194 166 Q198 176 192 186 L98 186 Q84 160 92 128Z" fill="$G"/>' +
    '<path d="M102 142 l4-12 l4 14 l6-12 l4 14 l7-11 l4 14 l8-10 l3 13 l9-8 l2 12" fill="$W" stroke-width="2"/>' +
    hatch('M120 176l6 6M140 176l6 6M160 176l6 6') +
    tube('M64 160 Q86 168 88 150', 3, '$V') + '<path d="M84 150 L92 142 L92 154Z" fill="$I"/>' +
    '<path d="M24 186 L36 30" fill="none" stroke="$U" stroke-width="4"/>' +
    '<path d="M28 40 Q26 28 30 20M36 30 L38 16M44 42 Q48 30 46 20M28 40 Q36 46 44 42" fill="none" stroke-width="3"/>' +
    '<path d="M54 160 L50 182 L40 184M68 160 L72 182 L62 184" fill="none" stroke-width="5"/>' +
    '<path d="M44 128 Q46 110 58 108 Q72 110 74 128 Q74 160 60 164 Q46 162 44 128Z" fill="$V"/>' +
    '<path d="M50 120 Q40 112 32 100" fill="none" stroke="$I" stroke-width="7"/><path d="M50 120 Q40 112 32 100" fill="none" stroke="$V" stroke-width="3"/>' +
    '<path d="M46 98 L42 80 L54 92Z M64 92 L72 76 L72 96Z" fill="$A"/>' +
    '<circle cx="58" cy="102" r="15" fill="$V"/>' +
    '<circle cx="49" cy="99" r="3.6" fill="$H" stroke-width="1.5"/><circle cx="61" cy="99" r="3.6" fill="$H" stroke-width="1.5"/>' +
    '<circle cx="48" cy="99" r="1.5" fill="$I" stroke="none"/><circle cx="60" cy="99" r="1.5" fill="$I" stroke="none"/>' +
    '<path d="M46 108 Q53 114 62 108" fill="none" stroke-width="2.4"/><path d="M50 110 l1 3 l2-2" fill="$W" stroke-width="1"/>');

  art.tome_mimic = S(shadow(96, 66) +
    '<g fill="none" stroke-width="5"><path d="M78 148 L70 168 L76 182M108 146 L106 166 L112 182M136 144 L142 164 L140 182"/></g>' +
    '<path d="M76 182h-12M112 182h-12M140 182h-12" fill="none" stroke-width="5"/>' +
    '<path d="M36 66 L146 94 L150 120 L36 134 Q22 100 36 66Z" fill="$D"/>' +
    '<path d="M138 108 Q94 110 64 126 Q44 140 52 164 L62 160 Q58 144 70 134 Q96 122 138 116Z" fill="$R"/>' +
    '<path d="M52 164 L46 176 L58 170 L62 160Z" fill="$R"/>' +
    '<path d="M30 136 L150 126 L158 146 L36 154Z" fill="$V"/>' +
    '<path d="M36 134 L150 116 L150 126 L30 136Z" fill="$W"/>' +
    '<path d="M38 134 l6-13 l6 12 l7-14 l6 12 l7-14 l6 12 l7-13 l6 11 l7-12 l6 10 l7-11 l6 9" fill="$W" stroke-width="2"/>' +
    '<path d="M24 50 L148 82 L160 64 L40 26Z" fill="$V"/>' +
    '<path d="M30 54 L148 86 L148 94 L34 64Z" fill="$W"/>' +
    '<path d="M38 66 l7 12 l5-10 l8 13 l5-10 l8 12 l5-9 l8 11 l5-8 l8 10 l5-7 l8 8" fill="$W" stroke-width="2"/>' +
    '<path d="M148 82 Q174 104 150 128 L158 146 Q190 106 160 64Z" fill="$V"/>' +
    '<path d="M162 76 Q172 90 170 108M162 128 Q170 118 172 104" fill="none" stroke="$A" stroke-width="3"/>' +
    '<path d="M40 26 L52 30 L44 40Z M30 140 L44 138 L40 150Z" fill="$A"/>' +
    '<path d="M86 44 l8 6 l-8 6 l-8-6Z" fill="$A" stroke-width="2"/>' +
    '<ellipse cx="64" cy="42" rx="9" ry="7" fill="$H"/><ellipse cx="114" cy="56" rx="9" ry="7" fill="$H"/>' +
    '<circle cx="61" cy="43" r="3.4" fill="$I" stroke="none"/><circle cx="111" cy="57" r="3.4" fill="$I" stroke="none"/>' +
    '<path d="M54 32 L72 38M104 46 L122 50" fill="none" stroke-width="3"/>');

  art.hydra = S(shadow(130, 60) +
    tube('M172 156 Q198 150 192 120', 8, '$G') + '<path d="M186 124 L192 108 L198 124Z" fill="$V"/>' +
    tube('M112 128 Q70 100 66 55', 7, '$G') + tube('M118 126 Q110 70 100 41', 7, '$G') + tube('M124 126 Q130 80 137 43', 7, '$G') +
    tube('M108 132 Q56 110 41 82', 7, '$G') + tube('M110 138 Q60 132 30 118', 7, '$G') +
    tube('M110 134 Q80 126 68 108', 7, '$G') + tube('M116 130 Q100 100 96 79', 7, '$G') +
    hydraHead(66, 55, 1) + hydraHead(100, 41, 1) + hydraHead(137, 43, 1) + hydraHead(41, 82, 1) + hydraHead(30, 118, 1) +
    hydraHead(68, 108, 1.05) + hydraHead(96, 79, 1.05) +
    '<path d="M106 172 Q96 128 128 116 Q172 112 178 150 Q180 170 160 172Z" fill="$G"/>' +
    '<path d="M134 116 l6-10 l4 10 M150 118 l8-8 l2 11 M164 126 l9-6 l0 11" fill="$V" stroke-width="2"/>' +
    '<path d="M108 168 Q110 146 124 140 Q120 160 128 172Z" fill="$A"/>' +
    hatch('M140 132l6 8M152 134l6 8M164 140l4 8') +
    '<path d="M116 168 L110 184 L100 186 L122 186 L126 170Z M164 166 L168 184 L158 186 L178 186 L176 166Z" fill="$G"/>' +
    '<path d="M100 186l-2-3M106 186l-1-3M158 186l-2-3M164 186l-1-3" fill="none" stroke-width="2"/>');

  art.pale_rider = S(shadow(104, 74) +
    '<path d="M152 18 L140 118" fill="none" stroke="$U" stroke-width="4"/>' +
    '<path d="M152 18 Q122 4 96 22 Q122 16 150 28Z" fill="$P"/>' + hatch('M108 18 l6 2M120 14l6 3') +
    '<g fill="none" stroke="$I" stroke-width="9"><path d="M84 132 L78 160 L74 182M98 134 L104 160 L100 182M140 132 L134 160 L136 182M156 126 L162 158 L160 182"/></g>' +
    '<g fill="none" stroke="$B" stroke-width="4.5"><path d="M84 132 L78 160 L74 182M98 134 L104 160 L100 182M140 132 L134 160 L136 182M156 126 L162 158 L160 182"/></g>' +
    '<path d="M70 184h8M96 184h8M132 184h8M156 184h8" fill="none" stroke-width="5"/>' +
    '<path d="M164 100 Q186 112 182 146M166 104 Q178 120 172 150M168 102 Q194 116 192 140" fill="none" stroke="$K" stroke-width="2.5"/>' +
    '<path d="M64 98 Q100 86 150 92 Q174 98 168 124 Q162 138 136 136 L84 136 Q62 130 64 98Z" fill="$B" fill-opacity=".97"/>' +
    hatch('M120 108 q2 10 0 20M130 108 q2 10 0 20M140 108 q2 10 0 18M80 122l6 6') +
    '<path d="M68 104 Q56 78 46 60 L38 52 Q28 50 22 62 L16 74 Q18 82 28 80 L42 76 Q56 96 82 114Z" fill="$B" fill-opacity=".97"/>' +
    '<path d="M42 54 L44 40 L50 56Z" fill="$B"/>' +
    '<path d="M48 54 Q60 60 62 74 Q66 86 74 94M52 52 Q66 56 68 70" fill="none" stroke="$K" stroke-width="2.5"/>' +
    '<circle cx="34" cy="62" r="4" fill="$I" fill-opacity=".85"/><circle cx="20" cy="72" r="1.3" fill="$I" stroke="none"/>' +
    '<path d="M98 92 L142 92 L146 122 L96 122Z" fill="$V"/><path d="M98 116 L146 116" fill="none" stroke="$A" stroke-width="3"/>' +
    '<path d="M120 98 L114 124 L104 136 L96 136" fill="none" stroke="$I" stroke-width="7"/><path d="M120 98 L114 124 L104 136 L96 136" fill="none" stroke="$W" stroke-width="3"/>' +
    '<path d="M104 98 Q100 60 120 44 Q140 58 138 98Z" fill="$K"/>' +
    hatch('M110 70 l-2 22M128 70 l2 22') +
    '<path d="M112 62 Q100 62 88 70" fill="none" stroke="$I" stroke-width="7"/><path d="M112 62 Q100 62 88 70" fill="none" stroke="$W" stroke-width="3"/>' +
    '<path d="M76 60 L92 60 L84 70 L92 80 L76 80 L84 70Z" fill="$H" stroke-width="2.5"/><path d="M80 78h8M84 70v6" fill="none" stroke="$A" stroke-width="2"/>' +
    '<path d="M74 58h20M74 82h20" fill="none" stroke="$U" stroke-width="3.5"/>' +
    '<path d="M104 52 Q104 26 122 24 Q140 28 138 54 L136 64 L104 64Z" fill="$K"/>' +
    '<circle cx="118" cy="46" r="12" fill="$W"/>' +
    '<circle cx="112" cy="44" r="3.4" fill="$I" stroke="none"/><circle cx="122" cy="44" r="3.4" fill="$I" stroke="none"/>' +
    '<path d="M116 49 l-1.5 3 h3Z" fill="$I" stroke-width="1"/>' +
    '<path d="M110 54 Q117 58 124 54 M113 53 v4M117 54 v4M121 53 v4" fill="none" stroke-width="1.5"/>');

  art.bookworm = S(shadow(100, 90) +
    '<g fill="$W" stroke-width="2"><path d="M14 22 L34 16 L40 38 L20 44Z"/><path d="M164 28 L184 34 L178 56 L158 50Z"/><path d="M166 112 L186 108 L190 128 L170 132Z"/></g>' +
    '<g fill="none" stroke="$K" stroke-width="1.2"><path d="M20 26l14-4M22 32l14-4M24 38l10-3M166 36l14 4M164 42l14 4M170 116l12-2M172 122l12-2"/></g>' +
    '<circle cx="28" cy="30" r="3" fill="$P" stroke-width="1.5"/><circle cx="176" cy="46" r="3" fill="$P" stroke-width="1.5"/>' +
    '<path d="M14 166 L186 166 L190 186 L10 186Z" fill="$L"/><path d="M18 170 L182 170 L182 180 L18 180Z" fill="$W" stroke-width="1.5"/>' +
    '<path d="M24 175h150" fill="none" stroke="$K" stroke-width="1"/>' +
    '<path d="M26 148 L176 148 L180 166 L22 166Z" fill="$G"/><path d="M30 152 L172 152 L172 162 L30 162Z" fill="$W" stroke-width="1.5"/>' +
    '<path d="M36 157h130" fill="none" stroke="$K" stroke-width="1"/>' +
    '<rect x="150" y="147" width="10" height="20" fill="$A" stroke-width="1.5"/>' +
    '<path d="M36 132 L172 132 L174 148 L32 148Z" fill="$V"/>' +
    '<g fill="$D" stroke="none"><circle cx="56" cy="157" r="3"/><circle cx="130" cy="175" r="3"/><circle cx="44" cy="176" r="2.5"/></g>' +
    '<path d="M86 136 L92 124 L98 132 L106 118 L114 130 L124 120 L130 134 L140 126 L140 138Z" fill="$W" stroke-width="2"/>' +
    '<g fill="$R">' +
    '<circle cx="114" cy="128" r="25"/><circle cx="134" cy="102" r="25"/><circle cx="140" cy="74" r="24"/>' +
    '<circle cx="128" cy="50" r="24"/><circle cx="104" cy="36" r="24"/><circle cx="80" cy="40" r="25"/></g>' +
    '<g fill="none" stroke-width="2"><path d="M96 116 Q114 104 132 116M114 94 Q134 84 152 96M120 72 Q140 62 158 76M108 54 Q122 40 142 40M88 50 Q98 30 118 22M64 58 Q72 36 96 26"/></g>' +
    '<g fill="none" stroke="$W" stroke-width="3" stroke-opacity=".7"><path d="M150 96 q4 6 2 12M156 70 q4 6 2 12M146 44 q4 4 4 10"/></g>' +
    '<path d="M100 146 L94 136 L102 134Z M128 140 L132 128 L138 136Z" fill="$W" stroke-width="2"/>' +
    '<circle cx="58" cy="64" r="30" fill="$R"/>' +
    hatch('M74 86 q6-4 8-12M70 90 q8-4 10-10') +
    '<path d="M26 72 Q24 92 40 100 Q48 90 44 78Z" fill="$D"/>' +
    '<path d="M28 76 l4 5 l3-5 l4 6 l3-5 M34 96 l3-5 l3 5" fill="$W" stroke-width="1.4"/>' +
    '<path d="M16 96 L34 88 L40 106 L22 112Z" fill="$W" stroke-width="2"/><path d="M22 100l12-6M24 106l12-5" fill="none" stroke="$K" stroke-width="1"/>' +
    '<circle cx="36" cy="58" r="8" fill="$W" fill-opacity=".6" stroke="$A" stroke-width="3"/>' +
    '<circle cx="58" cy="56" r="8" fill="$W" fill-opacity=".6" stroke="$A" stroke-width="3"/>' +
    '<path d="M44 57 Q47 54 50 57M66 54 L82 50" fill="none" stroke="$A" stroke-width="2.5"/>' +
    '<circle cx="35" cy="59" r="2.6" fill="$I" stroke="none"/><circle cx="56" cy="57" r="2.6" fill="$I" stroke="none"/>' +
    '<path d="M28 44 L42 48M52 44 L64 44" fill="none" stroke-width="3"/>' +
    '<path d="M54 34 Q60 22 72 28 Q62 30 60 38" fill="$U" stroke-width="2"/>');

  art.bookmite = S(shadow(100, 40) +
    '<g fill="none" stroke-width="3.5"><path d="M80 166 L72 184M96 168 L94 184M112 168 L116 184M126 164 L134 184"/></g>' +
    '<circle cx="132" cy="154" r="17" fill="$R"/><circle cx="112" cy="156" r="18" fill="$R"/><circle cx="92" cy="154" r="19" fill="$R"/>' +
    '<g fill="none" stroke-width="2"><path d="M124 140 Q118 156 124 170M104 140 Q98 156 104 172"/></g>' +
    '<circle cx="70" cy="146" r="20" fill="$R"/>' +
    '<circle cx="62" cy="140" r="6" fill="$W" fill-opacity=".6" stroke="$A" stroke-width="2.5"/>' +
    '<circle cx="61" cy="141" r="2.2" fill="$I" stroke="none"/>' +
    '<path d="M52 152 Q58 158 66 154" fill="none" stroke-width="2.5"/>' +
    '<path d="M36 150 L50 144 L54 160 L40 164Z" fill="$W" stroke-width="2"/>');

  M.ART = M.ART || {};
  M.ART.enemies = Object.assign(M.ART.enemies || {}, art);
})();
