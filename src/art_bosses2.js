/* Marginalia — v2 boss art (boss artist).
   Hand-authored inline SVG, viewBox 0 0 200 200, ground ~y185, facing LEFT.
   Colour tokens ($X) are expanded once at load into plain hex strings. */
(function () {
  var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M;
  var C = {
    I: '#2a1f1a', K: '#6b5a4a', V: '#b8321f', L: '#1f4f96', G: '#2f7d62', A: '#c99a1e', H: '#f0d27a',
    F: '#e9c9a0', U: '#7a5230', R: '#c98a8a', P: '#d9c59a', W: '#f6ecd2', O: '#c8642a', D: '#4a2a20',
    S: '#bdb8ac', T: '#9b968b', N: '#b08a5e'
  };
  function S(body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
      '<g fill-opacity=".85" stroke="#2a1f1a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
      body.replace(/\$([A-Z])/g, function (m, k) { return C[k]; }) + '</g></svg>';
  }
  function shadow(cx, rx) { return '<ellipse cx="' + cx + '" cy="186" rx="' + rx + '" ry="6" fill="$I" fill-opacity=".14" stroke="none"/>'; }
  function tube(d, w, col) {
    return '<path d="' + d + '" fill="none" stroke="$I" stroke-width="' + (w + 6) + '"/>' +
      '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-opacity=".9"/>';
  }
  function hatch(d) { return '<path d="' + d + '" fill="none" stroke-width="1.3" stroke-opacity=".7"/>'; }
  function eye(x, y, r, iris) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="$W" fill-opacity="1" stroke-width="2"/>' +
      '<circle cx="' + (x - r * 0.35) + '" cy="' + y + '" r="' + (r * 0.5) + '" fill="' + (iris || '$I') + '" fill-opacity="1" stroke="none"/>';
  }
  function bell(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="4.5" fill="$A" stroke-width="2"/>'; }
  // a seraph wing: symmetric leaf pointing along +x, covered in eyes
  function wing(x, y, r, l) {
    var q = l * 0.24;
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ')">' +
      '<path d="M0 -9Q' + l * 0.5 + ' -' + q + ' ' + l + ' 0Q' + l * 0.5 + ' ' + q + ' 0 9Z" fill="$V"/>' +
      '<path d="M6 -6Q' + l * 0.5 + ' -' + (q - 6) + ' ' + (l - 8) + ' 0Q' + l * 0.5 + ' ' + (q - 6) + ' 6 6" fill="none" stroke="$A" stroke-width="3"/>' +
      '<ellipse cx="' + l * 0.42 + '" cy="0" rx="6" ry="4" fill="$W" fill-opacity="1" stroke-width="2"/><circle cx="' + l * 0.42 + '" cy="0" r="2.2" fill="$L" stroke="none" fill-opacity="1"/>' +
      '<ellipse cx="' + l * 0.72 + '" cy="0" rx="4.5" ry="3" fill="$W" fill-opacity="1" stroke-width="1.8"/><circle cx="' + l * 0.72 + '" cy="0" r="1.6" fill="$L" stroke="none" fill-opacity="1"/></g>';
  }

  var art = {};

  /* ---- Quire I: the Jousting Hare & his War-Snail (duo) ---- */
  art.jousting_hare = S(shadow(108, 52) +
    '<circle cx="140" cy="132" r="9" fill="$W"/>' +
    '<path d="M94 50 Q92 8 108 6 Q118 24 106 52Z" fill="$N"/><path d="M99 44 Q99 18 107 14" fill="none" stroke="$R" stroke-width="4"/>' +
    '<path d="M104 52 Q120 10 136 16 Q132 40 112 58Z" fill="$N"/>' +
    tube('M122 142 L130 176', 9, '$S') + '<ellipse cx="136" cy="180" rx="14" ry="5" fill="$S"/>' +
    '<path d="M84 90 Q70 116 80 144 L136 144 Q142 112 122 88Z" fill="$S"/>' +
    '<path d="M82 108 Q78 130 82 150 L134 150 Q136 128 130 106Z" fill="$L"/>' +
    '<path d="M82 150l7-6l7 6l7-6l7 6l7-6l7 6l7-6l7 6" fill="none" stroke="$A" stroke-width="2.5"/>' +
    hatch('M120 112l6 6M118 122l8 8M116 132l8 8') +
    tube('M92 150 L86 176', 9, '$S') + '<ellipse cx="80" cy="180" rx="15" ry="5" fill="$S"/>' +
    '<path d="M60 70 Q62 54 80 50 Q104 48 110 66 Q110 84 92 90 Q72 90 62 80Z" fill="$N"/>' +
    '<path d="M76 54 Q92 36 112 48 Q120 66 112 82 L102 80 Q104 62 92 58 Q82 56 76 60Z" fill="$S"/>' +
    '<path d="M110 46 Q132 28 146 42 Q130 40 118 54Z" fill="$V"/>' +
    hatch('M100 52l4 8M106 52l3 10') + '<path d="M104 66l6 0" fill="none" stroke-width="2"/>' +
    '<circle cx="78" cy="66" r="3.4" fill="$I" stroke="none"/><circle cx="77" cy="65" r="1" fill="$W" stroke="none"/>' +
    '<path d="M70 61 Q76 57 84 60" fill="none" stroke-width="2.2"/>' +
    '<path d="M60 72 Q58 76 63 78Z" fill="$R" stroke-width="2"/><path d="M64 82 L64 87 L69 86 L68 82" fill="$W" stroke-width="1.8"/>' +
    '<path d="M60 76l-14-4M60 78l-14 2M61 80l-12 6" fill="none" stroke-width="1.2"/>' +
    tube('M24 110 L176 96', 6, '$W') +
    '<path d="M34 109 L176 96" fill="none" stroke="$V" stroke-width="6" stroke-dasharray="9 9" stroke-linecap="butt"/>' +
    '<path d="M24 105 L6 111 L25 115Z" fill="$S"/>' +
    '<path d="M86 105 L116 94 L118 116 L86 112Z" fill="$S"/>' + hatch('M100 100l1 12M108 98l1 14') +
    '<circle cx="124" cy="105" r="8" fill="$S"/>' + tube('M122 92 L124 104', 7, '$S') +
    '<path d="M50 112 L84 112 L84 134 Q82 152 67 160 Q52 152 50 134Z" fill="$V"/>' +
    '<path d="M52 116 L82 150" fill="none" stroke="$A" stroke-width="6"/>' +
    '<circle cx="60" cy="140" r="3" fill="$A"/><circle cx="76" cy="124" r="3" fill="$A"/>');

  art.war_snail = S(shadow(104, 84) +
    '<path d="M150 58 L162 8" fill="none" stroke="$I" stroke-width="7"/><path d="M150 58 L162 8" fill="none" stroke="$U" stroke-width="3"/>' +
    '<path d="M161 12 Q178 6 196 16 L184 24 L194 34 Q176 28 158 34Z" fill="$V"/>' +
    '<path d="M160 22 Q176 18 188 25" fill="none" stroke="$A" stroke-width="3"/><circle cx="162" cy="7" r="3.5" fill="$A"/>' +
    '<path d="M18 184 Q12 168 22 150 Q18 120 38 110 Q58 106 62 128 Q66 150 82 160 L176 164 Q196 172 188 184Z" fill="$F"/>' +
    hatch('M30 176l4-10M44 178l4-10M156 180l4-10M170 180l4-10') +
    '<path d="M32 112 L20 76M46 110 L50 72" fill="none" stroke-width="4"/>' + eye(20, 72, 7) + eye(50, 68, 7) +
    '<path d="M24 120 Q36 98 58 110 L58 126 Q42 118 28 128Z" fill="$S"/>' + '<path d="M44 104 Q40 86 56 84 Q50 92 52 106Z" fill="$V" stroke-width="2.5"/>' +
    '<circle cx="34" cy="118" r="1.8" fill="$I" stroke="none"/><circle cx="50" cy="116" r="1.8" fill="$I" stroke="none"/>' +
    '<path d="M22 140 Q30 146 38 140" fill="none" stroke-width="2.5"/>' +
    '<path d="M150 66 L160 52 L162 70Z M170 82 L184 74 L178 92Z M178 108 L194 108 L180 120Z" fill="$S" stroke-width="2.5"/>' +
    '<circle cx="124" cy="112" r="52" fill="$U"/>' +
    '<path d="M124 112 m0 -8 a8 8 0 1 1 -8 8 a16 16 0 1 1 16 16 a26 26 0 1 1 -26 -26 a36 36 0 1 1 36 36" fill="none" stroke-width="3"/>' +
    '<path d="M74 128 Q124 146 175 126 L176 166 L72 166Z" fill="$L"/>' +
    '<path d="M72 166l6 8l6-8l6 8l6-8l6 8l6-8l6 8l6-8l6 8l6-8l6 8l6-8l6 8l6-8l6 8l6-8l6 8" fill="$A" stroke-width="2"/>' +
    '<path d="M90 146l4-6l4 6l-4 6Z M122 150l4-6l4 6l-4 6Z M154 144l4-6l4 6l-4 6Z" fill="$A" stroke-width="1.8"/>' +
    hatch('M80 156l10-10M140 160l14-14M164 154l8-8') +
    '<path d="M82 76 Q120 92 158 74 L160 86 Q120 104 80 88Z" fill="$A"/>' +
    '<path d="M86 80l4 8M98 84l3 9M112 86l2 10M126 86l1 10M140 84l-1 9M152 80l-2 8" fill="none" stroke-width="1.5"/>' +
    '<path d="M92 76 Q86 58 98 52 L104 62 Q122 70 140 62 L146 52 Q158 60 152 76 Q122 88 92 76Z" fill="$V"/>' +
    hatch('M110 70l4-6M120 72l4-6M130 70l4-6') +
    '<path d="M114 90 L112 112" fill="none" stroke-width="2.5"/><path d="M105 112 L119 112 L117 120 L107 120Z" fill="$A" stroke-width="2.5"/>');

  /* ---- Quire I: the Bagpipe Bishop & his Fool ---- */
  art.bagpipe_bishop = S(shadow(100, 58) +
    tube('M112 110 L150 30', 5, '$U') + tube('M120 112 L172 48', 5, '$U') + tube('M124 120 L184 76', 5, '$U') +
    '<rect x="144" y="20" width="12" height="9" fill="$A" transform="rotate(25 150 25)"/>' +
    '<rect x="166" y="38" width="12" height="9" fill="$A" transform="rotate(40 172 43)"/>' +
    '<rect x="178" y="66" width="12" height="9" fill="$A" transform="rotate(55 184 71)"/>' +
    '<path d="M150 36 Q164 50 170 76M172 52 Q180 70 190 92" fill="none" stroke="$V" stroke-width="2.5"/>' +
    '<ellipse cx="80" cy="180" rx="14" ry="6" fill="$U"/><ellipse cx="122" cy="180" rx="14" ry="6" fill="$U"/>' +
    '<path d="M72 86 Q50 130 40 176 L160 176 Q150 130 128 86Z" fill="$V"/>' +
    '<path d="M86 94 L76 176 L124 176 L114 94Z" fill="$W"/>' + hatch('M92 150l0 22M100 150l0 24M108 150l0 22') +
    tube('M86 94 L76 176', 6, '$A') + tube('M114 94 L124 176', 6, '$A') +
    hatch('M56 150l10 6M52 162l12 8M146 150l-10 6M150 162l-12 8') +
    '<path d="M114 48 L124 82 L118 84 L108 52Z" fill="$V" stroke-width="2"/>' +
    '<circle cx="96" cy="64" r="25" fill="$U"/><circle cx="118" cy="68" r="7" fill="$F"/>' +
    '<path d="M72 66 Q70 48 88 48 Q104 52 106 66 Q106 86 86 88 Q72 86 72 66Z" fill="$F"/>' +
    '<ellipse cx="74" cy="75" rx="13" ry="10" fill="$F"/>' +
    '<path d="M76 56 Q86 50 100 56" fill="none" stroke-width="3"/>' +
    '<circle cx="82" cy="62" r="2.8" fill="$I" stroke="none"/><circle cx="95" cy="62" r="2.8" fill="$I" stroke="none"/>' +
    '<circle cx="66" cy="72" r="1.6" fill="$I" stroke="none"/><circle cx="96" cy="76" r="5" fill="$R" stroke="none"/>' +
    '<path d="M78 46 Q76 18 98 0 Q120 18 118 46Z" fill="$W"/>' +
    '<path d="M98 4 L98 44 M90 22 L106 22" fill="none" stroke="$A" stroke-width="4"/>' +
    '<path d="M77 38 L119 38 L119 48 L77 48Z" fill="$A"/><circle cx="98" cy="43" r="2.5" fill="$V" stroke="none"/>' +
    '<ellipse cx="98" cy="122" rx="30" ry="20" fill="$G" transform="rotate(-12 98 122)"/>' +
    hatch('M76 116l20 20M86 106l24 24M98 104l18 18M72 128l12 12M108 104l-30 30M118 110l-26 26M90 104l-18 18') +
    tube('M66 80 L80 106', 3, '$U') +
    '<circle cx="100" cy="96" r="6" fill="$A"/>' +
    tube('M76 128 L52 170', 5, '$U') + '<path d="M44 168 L60 174 L56 182 L42 178Z" fill="$A"/>' +
    '<ellipse cx="68" cy="140" rx="7" ry="5" fill="$U"/><ellipse cx="59" cy="155" rx="7" ry="5" fill="$U"/>' +
    '<path d="M120 100 Q130 120 116 136 Q106 140 100 132" fill="$V"/>');

  art.dancing_fool = S(shadow(98, 32) +
    '<path d="M124 98 L136 60" fill="none" stroke="$I" stroke-width="6"/><path d="M124 98 L136 60" fill="none" stroke="$U" stroke-width="2.5"/>' +
    '<circle cx="137" cy="56" r="7" fill="$F"/><path d="M130 52 L126 44 L136 49 L142 42 L144 54Z" fill="$L" stroke-width="2"/>' +
    '<circle cx="135" cy="57" r="1.2" fill="$I" stroke="none"/>' +
    tube('M100 148 L106 180', 6, '$L') + '<path d="M100 182 Q114 186 120 176" fill="$L"/>' + bell(121, 174) +
    tube('M84 146 L66 140 L58 158', 6, '$V') + '<path d="M60 160 Q46 166 42 154" fill="$V" stroke-width="2.5"/>' + bell(41, 152) +
    '<path d="M78 118 L92 118 L92 150 L72 150Z" fill="$V"/><path d="M92 118 L106 118 L112 150 L92 150Z" fill="$L"/>' +
    '<path d="M72 150l5 8l5-8l5 8l5-8l5 8l5-8l5 8l5-8" fill="$A" stroke-width="2"/>' +
    tube('M104 124 L124 98', 5, '$L') + tube('M80 124 L62 114', 5, '$V') +
    '<circle cx="58" cy="112" r="5" fill="$F"/><circle cx="124" cy="98" r="5" fill="$F"/>' +
    '<path d="M76 92 Q62 82 56 70 Q72 74 84 86Z" fill="$L"/>' + bell(55, 68) +
    '<path d="M88 86 Q86 68 94 58 Q102 72 100 86Z" fill="$V"/>' + bell(94, 55) +
    '<path d="M100 88 Q114 76 126 80 Q114 90 106 100Z" fill="$L"/>' + bell(128, 80) +
    '<path d="M72 106 Q70 86 90 84 Q110 86 108 108 Q102 120 90 120 Q76 118 72 106Z" fill="$V"/>' +
    '<circle cx="88" cy="104" r="11" fill="$F" fill-opacity="1"/>' +
    '<circle cx="83" cy="101" r="2" fill="$I" stroke="none"/><circle cx="92" cy="101" r="2" fill="$I" stroke="none"/>' +
    '<path d="M80 108 Q87 114 94 108" fill="none" stroke-width="2"/><circle cx="96" cy="107" r="2.5" fill="$R" stroke="none"/>' +
    '<path d="M48 100 q-4 -6 2 -10M140 132 q6 -2 6 -8M60 182 q-6 -4 -4 -10" fill="none" stroke-width="1.6" stroke-opacity=".7"/>');

  /* ---- Quire II ---- */
  art.basilisk = S(shadow(110, 72) +
    tube('M132 128 Q178 112 182 148 Q184 180 150 180 Q118 178 122 154 Q126 134 150 138 Q168 144 162 160', 13, '$G') +
    '<path d="M160 168 L154 156 L170 158Z" fill="$V" stroke-width="2.5"/>' +
    '<path d="M168 126l6-2M178 140l6 0M176 166l5 4M138 174l-2 6M126 160l-6 2" fill="none" stroke-width="1.6"/>' +
    tube('M88 144 L84 178', 4, '$A') + tube('M110 144 L114 178', 4, '$A') +
    '<path d="M84 178l-14 4M84 178l-9 8M84 178l5 6M114 178l-14 4M114 178l-9 8M114 178l5 6" fill="none" stroke-width="3"/>' +
    '<path d="M56 96 Q50 148 96 154 Q142 154 142 116 Q138 86 100 86 Q74 86 56 96Z" fill="$G"/>' +
    '<g fill="none" stroke-width="1.5" stroke-opacity=".8"><path d="M66 120q4 4 8 0M78 128q4 4 8 0M70 136q4 4 8 0M82 140q4 4 8 0M62 108q4 4 8 0M74 116q4 4 8 0"/></g>' +
    '<path d="M86 104 Q118 82 148 100 Q152 120 142 134 Q112 142 96 128 Z" fill="$T"/>' +
    '<path d="M98 112 Q118 104 140 108M102 122 Q120 118 138 122M120 96 L124 104 L118 110" fill="none" stroke-width="1.8"/>' +
    '<path d="M50 102 Q36 74 42 52 Q50 32 70 38 Q86 52 84 100Z" fill="$V"/>' +
    '<path d="M56 74l8 12M50 84l10 10M60 62l8 10M70 52l6 10" fill="none" stroke="$D" stroke-width="2"/>' +
    '<path d="M40 54 Q38 34 58 32 Q76 34 76 52 Q72 66 54 68 Q42 66 40 54Z" fill="$G"/>' +
    '<path d="M42 44 L20 51 L42 57Z" fill="$A"/><path d="M42 51 L28 51" fill="none" stroke-width="1.8"/>' +
    '<path d="M44 60 Q38 74 48 76 Q54 66 50 60Z" fill="$V"/>' +
    '<circle cx="55" cy="47" r="6.5" fill="$H" fill-opacity="1"/><ellipse cx="54" cy="47" rx="1.8" ry="5" fill="$I" stroke="none"/>' +
    '<path d="M42 40 L50 42" fill="none" stroke-width="3"/>' +
    '<path d="M38 40 L8 24M36 46 L4 42M40 36 L22 10" fill="none" stroke="$I" stroke-width="6" stroke-dasharray="6 7"/>' +
    '<path d="M38 40 L8 24M36 46 L4 42M40 36 L22 10" fill="none" stroke="$H" stroke-width="3" stroke-dasharray="6 7"/>' +
    '<path d="M46 34 L44 16 L52 25 L58 12 L64 25 L72 16 L72 34Z" fill="$A"/>' +
    '<circle cx="58" cy="28" r="2.5" fill="$V" stroke="none"/><circle cx="49" cy="29" r="1.8" fill="$L" stroke="none"/><circle cx="67" cy="29" r="1.8" fill="$L" stroke="none"/>' +
    '<path d="M12 184 Q12 176 22 176 L48 178 Q52 184 46 185Z" fill="$T"/>' +
    '<circle cx="34" cy="166" r="11" fill="$T"/><path d="M34 166 m0 -3 a3 3 0 1 1 -3 3 a6 6 0 1 1 6 6" fill="none" stroke="$K" stroke-width="2"/>' +
    '<path d="M16 177 L12 166M20 176 L22 166" fill="none" stroke-width="2"/>' +
    hatch('M40 176l4 6M26 158l-3-3'));

  art.siren = S(
    '<ellipse cx="104" cy="178" rx="96" ry="12" fill="$L" fill-opacity=".25" stroke="none"/>' +
    '<path d="M58 180 Q54 150 78 138 Q110 126 142 140 Q166 156 162 180Z" fill="$T"/>' +
    hatch('M70 168l8-8M72 178l12-12M146 160l8 8M140 170l10 10') +
    tube('M104 130 Q118 162 150 160 Q174 156 174 134', 16, '$G') +
    '<path d="M174 134 L162 108 L178 118 L192 104 L186 134Z" fill="$G"/>' + hatch('M176 128l-6-12M182 128l4-14') +
    '<g fill="none" stroke-width="1.5"><path d="M118 152q4 5 8 0M130 158q4 5 8 0M144 158q4 5 8 0M158 152q4 5 8 0M164 140q4 5 8 0"/></g>' +
    '<path d="M100 50 Q124 48 120 80 Q124 112 134 132 Q112 124 106 92Z" fill="$A"/>' +
    '<path d="M84 86 Q78 110 84 136 L118 136 Q120 110 110 86Z" fill="$R"/>' +
    '<path d="M86 88 Q97 96 108 88" fill="none" stroke="$A" stroke-width="3"/>' + hatch('M108 104l4 24M112 100l2 10') +
    '<circle cx="96" cy="68" r="15" fill="$F" fill-opacity="1"/>' +
    '<path d="M82 64 Q84 48 100 50 Q112 52 112 66 Q104 58 92 58 Q86 60 82 64Z" fill="$A"/>' +
    '<path d="M86 56 L84 48 L90 52 L94 44 L98 52 L104 46 L104 56" fill="$A" stroke-width="2"/>' +
    '<path d="M86 66 Q89 64 92 66" fill="none" stroke-width="2"/><circle cx="89" cy="68" r="1.8" fill="$I" stroke="none"/>' +
    '<path d="M86 75 Q90 78 94 75" fill="none" stroke-width="2"/><circle cx="98" cy="73" r="3" fill="$R" stroke="none"/>' +
    tube('M58 134 L54 84', 4, '$A') + tube('M54 84 Q66 72 80 86', 4, '$A') + tube('M80 86 L64 134 L58 134', 4, '$A') +
    '<path d="M58 82 L59 126M63 79 L62 116M68 78 L66 106M73 80 L70 96" fill="none" stroke-width="1.2"/>' +
    tube('M90 92 Q76 96 70 108', 5, '$F') + '<circle cx="68" cy="110" r="4.5" fill="$F"/>' +
    '<g fill="$L" stroke="$L"><circle cx="34" cy="66" r="3.5"/><circle cx="24" cy="92" r="3.5"/></g>' +
    '<path d="M37 66 L37 50 Q42 54 44 58M27 92 L27 76 Q32 80 34 84" fill="none" stroke="$L" stroke-width="2"/>' +
    '<path d="M20 178 q8 -6 16 0 t16 0M150 186 q8 -6 16 0 t16 0M60 188 q8 -6 16 0 t16 0" fill="none" stroke="$L" stroke-width="2.5"/>');

  /* ---- Quire III ---- */
  art.hellmouth = S(shadow(100, 92) +
    '<path d="M24 98 Q90 70 170 104 L172 162 Q100 178 28 170Z" fill="$D" fill-opacity="1"/>' +
    '<path d="M44 166 Q38 140 56 124 Q54 144 68 142 Q64 116 86 102 Q84 128 100 130 Q100 112 118 104 Q114 128 132 128 Q134 114 150 110 Q156 138 164 162Z" fill="$V"/>' +
    '<path d="M60 164 Q58 148 68 140 Q70 152 80 150 Q80 132 96 124 Q96 144 110 144 Q112 130 126 126 Q128 146 140 148 Q142 136 150 132 Q154 150 152 164Z" fill="$A"/>' +
    '<path d="M86 160 Q86 150 92 146 Q96 154 104 152 Q106 144 112 142 Q116 156 114 162Z" fill="$H"/>' +
    '<path d="M86 136 L80 120 L92 130M108 130 L118 118 L114 136" fill="$W" stroke-width="2.5"/>' +
    '<circle cx="98" cy="142" r="13" fill="$V" fill-opacity="1"/>' +
    '<circle cx="93" cy="139" r="3.5" fill="$H" fill-opacity="1" stroke-width="1.5"/><circle cx="104" cy="139" r="3.5" fill="$H" fill-opacity="1" stroke-width="1.5"/>' +
    '<circle cx="92" cy="139" r="1.4" fill="$I" stroke="none"/><circle cx="103" cy="139" r="1.4" fill="$I" stroke="none"/>' +
    '<path d="M90 147 Q98 152 106 147" fill="none" stroke-width="2"/>' +
    '<circle cx="84" cy="156" r="4.5" fill="$V" fill-opacity="1"/><circle cx="112" cy="156" r="4.5" fill="$V" fill-opacity="1"/>' +
    '<path d="M14 172 Q20 150 40 152 Q100 164 172 150 L194 138 L194 184 L12 184Z" fill="$U"/>' +
    '<path d="M36 154 L42 136 L50 156Z M60 158 L66 142 L72 159Z M126 159 L132 144 L138 157Z M150 154 L156 138 L162 152Z" fill="$W"/>' +
    hatch('M30 176l10-10M54 178l10-10M130 178l10-10M160 176l14-14M178 170l10-10') +
    '<path d="M8 84 Q10 58 38 54 Q80 44 116 22 Q168 2 194 26 L194 132 L174 120 Q150 104 120 100 Q70 94 30 102 Q10 102 8 84Z" fill="$U"/>' +
    '<path d="M30 102 L36 128 L44 103Z M56 100 L60 118 L66 99Z M84 98 L88 114 L94 98Z M112 100 L116 116 L122 101Z M140 106 L146 124 L152 110Z" fill="$W"/>' +
    '<path d="M16 66 Q22 62 26 68" fill="none" stroke-width="3"/><ellipse cx="20" cy="72" rx="3.5" ry="2.5" fill="$I" stroke="none"/>' +
    '<path d="M150 18 Q164 -2 186 4 Q170 10 166 30Z" fill="$S"/>' +
    '<ellipse cx="112" cy="54" rx="15" ry="12" fill="$W" fill-opacity="1"/><circle cx="106" cy="55" r="8" fill="$A" fill-opacity="1" stroke-width="2"/>' +
    '<ellipse cx="105" cy="55" rx="2.2" ry="6" fill="$I" stroke="none"/>' +
    '<path d="M92 44 Q112 30 132 44" fill="none" stroke-width="5"/>' +
    '<g fill="none" stroke-width="1.6" stroke-opacity=".8"><path d="M44 74q5 5 10 0M60 70q5 5 10 0M76 68q5 5 10 0M140 64q5 5 10 0M156 62q5 5 10 0M150 80q5 5 10 0M166 80q5 5 10 0M160 44q5 5 10 0M176 46q5 5 10 0"/></g>' +
    hatch('M182 94l8 8M180 108l10 10'));

  art.hell_imp_small = S(shadow(98, 30) +
    '<path d="M110 152 Q140 160 140 140 Q140 124 130 120" fill="none" stroke-width="3"/>' +
    '<path d="M130 112 L124 124 L136 124Z" fill="$V" stroke-width="2.5"/>' +
    '<path d="M108 116 Q120 88 142 92 Q134 100 140 108 Q128 106 126 118 Q118 112 112 124Z" fill="$D"/>' +
    tube('M92 156 L88 180', 4, '$V') + tube('M108 156 L114 180', 4, '$V') +
    '<path d="M88 180l-8 3M88 180l-4 4M114 180l-8 3M114 180l-3 4" fill="none" stroke-width="2.5"/>' +
    '<ellipse cx="100" cy="140" rx="17" ry="20" fill="$V"/>' + hatch('M108 132l4 6M110 142l3 6') +
    '<path d="M60 84 L80 182" fill="none" stroke="$I" stroke-width="7"/><path d="M60 84 L80 182" fill="none" stroke="$U" stroke-width="3"/>' +
    '<path d="M48 82 L70 78 M48 82 L44 64 M59 80 L56 60 M70 78 L68 58" fill="none" stroke-width="3.5"/>' +
    tube('M88 132 L70 128', 4, '$V') + '<circle cx="68" cy="128" r="5" fill="$V"/>' +
    '<path d="M84 100 L72 90 L86 94Z" fill="$V"/>' +
    '<path d="M88 96 L84 76 L96 90Z M104 94 L112 76 L110 96Z" fill="$W"/>' +
    '<circle cx="96" cy="108" r="15" fill="$V"/>' +
    '<circle cx="89" cy="105" r="3.5" fill="$H" fill-opacity="1" stroke-width="1.5"/><circle cx="100" cy="105" r="3.5" fill="$H" fill-opacity="1" stroke-width="1.5"/>' +
    '<circle cx="88" cy="105" r="1.4" fill="$I" stroke="none"/><circle cx="99" cy="105" r="1.4" fill="$I" stroke="none"/>' +
    '<path d="M84 99l8 3M104 99l-6 3" fill="none" stroke-width="2"/>' +
    '<path d="M86 114 Q94 120 102 114" fill="none" stroke-width="2"/><path d="M89 115l1 3l2-2M97 116l1 3l2-2" fill="$W" stroke-width="1.2"/>');

  art.seraph = S(
    '<ellipse cx="100" cy="186" rx="40" ry="5" fill="$I" fill-opacity=".1" stroke="none"/>' +
    '<path d="M86 184 Q80 166 92 156 Q92 168 100 166 Q100 154 110 150 Q118 168 112 184Z" fill="$A"/>' +
    '<path d="M94 182 Q94 172 100 170 Q104 176 106 182Z" fill="$V"/>' +
    wing(92, 128, 118, 62) + wing(108, 128, 62, 62) +
    wing(88, 104, 186, 84) + wing(112, 104, -6, 84) +
    wing(92, 82, -114, 74) + wing(108, 82, -66, 74) +
    '<circle cx="100" cy="102" r="31" fill="$A"/><circle cx="100" cy="102" r="31" fill="none" stroke="$H" stroke-width="2" stroke-dasharray="3 5"/>' +
    '<circle cx="68" cy="130" r="14" fill="$A"/><circle cx="68" cy="130" r="14" fill="none" stroke="$O" stroke-width="3" stroke-dasharray="3 3"/>' +
    '<circle cx="68" cy="131" r="8" fill="$H" stroke-width="2"/><path d="M65 135 Q68 137 71 135" fill="none" stroke-width="1.5"/><circle cx="65" cy="129" r="1.3" fill="$I" stroke="none"/><circle cx="71" cy="129" r="1.3" fill="$I" stroke="none"/>' +
    '<circle cx="132" cy="130" r="12" fill="$U"/><path d="M123 121 Q114 112 119 106M141 121 Q150 112 145 106" fill="none" stroke="$W" stroke-width="3"/>' +
    '<circle cx="128" cy="128" r="1.5" fill="$I" stroke="none"/><circle cx="136" cy="128" r="1.5" fill="$I" stroke="none"/><ellipse cx="132" cy="136" rx="5" ry="3" fill="$R" stroke-width="1.4"/>' +
    '<circle cx="100" cy="144" r="12" fill="$W"/><path d="M91 143 L80 148 L92 150Z" fill="$A" stroke-width="2"/><circle cx="97" cy="141" r="1.7" fill="$I" stroke="none"/>' +
    '<circle cx="100" cy="100" r="20" fill="$F" fill-opacity="1"/>' +
    '<path d="M80 96 Q82 78 100 78 Q118 78 120 96 Q112 86 100 88 Q88 86 80 96Z" fill="$A"/>' +
    '<path d="M88 98 Q92 95 96 98M104 98 Q108 95 112 98" fill="none" stroke-width="2"/>' +
    '<circle cx="92" cy="101" r="1.6" fill="$I" stroke="none"/><circle cx="108" cy="101" r="1.6" fill="$I" stroke="none"/>' +
    '<circle cx="87" cy="107" r="3" fill="$R" stroke="none"/><circle cx="113" cy="107" r="3" fill="$R" stroke="none"/>' +
    '<path d="M95 110 Q100 114 105 110" fill="none" stroke-width="2"/>');

  M.ART = M.ART || {};
  M.ART.enemies = Object.assign(M.ART.enemies || {}, art);
})();
