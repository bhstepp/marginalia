# MARGINALIA — design contract (shared by all sub-agents)

A roguelike deckbuilder for iPhone Safari, shipped as ONE self-contained `dist/index.html` on GitHub Pages.
No server, no build deps beyond Node. `node build.js` bundles `src/` → `dist/index.html`.

## Fiction & tone
You are **the Margin Knight**, a small knight sketched hastily in the lower margin of a 14th-century Book of Hours.
The ink has woken: the drolleries (snail-knights, killer rabbits, dog-headed men, monkfish, the scribe's cat…)
have crawled off their pages. Ride through three **Quires** (acts) to the binding and close the book.
- Quire I — *The Book of Hours* (pastoral margins: snails, hares, apes with bagpipes)
- Quire II — *The Bestiary* (monsters of the bestiary: monkfish, blemmyae, cockatrice, manticore)
- Quire III — *The Apocalypse* (Revelation scenes: locusts, hydra, hellmouth, the Bookworm)
Tone: dry, whimsical, slightly absurd — like real medieval marginalia. Short flavor lines, archaic-lite
("thee" sparingly). Never grimdark. Never reproduce known modern characters/brands.

## Vocabulary (use consistently)
- **Ink** = energy (3/turn). **Ward** = block. **HP**. **Silver** = gold currency.
- **Pigments** (card colours): `V` Vermilion (red, mostly attacks), `L` Lapis (blue, mostly defence),
  `G` Verdigris (green, Corrode/attrition/growth), `A` Gold (rare, wildcard, flexible), `N` Ink (colourless utility),
  `X` Blot (junk/status cards).
- **Illuminate**: once per turn, when you have played a V, an L and a G card this turn (each Gold card counts as any
  one missing pigment) you Illuminate: +1 Ink, draw 1. Cards may have `Illuminated:` bonuses (cond `illuminated`).
  The card that completes the triad already counts as Illuminated for its own effects.
- **Gloss** (card type `gloss`) = power. When played it is written into the **Margin** (3 slots). A 4th Gloss erases
  the oldest. Some enemies **Erase** glosses (op `eraseMargin`).
- **Scrape** = exhaust. **Fleeting** = ethereal. **Opening** = innate. **Gild** = upgrade (cards have `up`).
- **Blots** = junk cards enemies add (type `blot`, temporary for the fight). **Curses** = permanent junk (type `curse`).
- Rest site = **Scriptorium** (Mend: heal 30% / Gild a card). Shop = **Stationer**. Event = **Apocrypha**.
  Treasure = **Reliquary**. Relics = relics.

## Visual style guide
Parchment page (#efe2c4 → #e4d2a8, subtle fibres/foxing), iron-gall ink #2a1f1a, faded ink #6b5a4a.
Pigments: vermilion #b8321f, lapis #1f4f96, verdigris #2f7d62, gold leaf #c99a1e (highlight #f0d27a),
flesh #e9c9a0, umber #7a5230, rose #c98a8a.
Fonts (Google Fonts, with serif fallbacks): titles `UnifrakturMaguntia` (blackletter), body `IM Fell English`,
small caps `IM Fell English SC`. Card names start with an **illuminated drop cap** (gold-leaf square, pigment letter).
Ink-line drawings: round caps, slightly wobbly, 2.5–4px outlines at 200px scale, sparse hatching, flat watercolour
washes (fill-opacity ~0.85). Naive medieval proportions, absurd and charming.

## Code layout & ownership (do NOT edit files you don't own; report needed changes instead)
| file | owner |
|---|---|
| `src/engine.js` | lead (core rules, DSL, map, run state) |
| `src/data/cards.js`, `src/data/relics.js`, `src/data/events.js` | content agent |
| `src/data/enemies.js` (also defines `M.ENCOUNTERS`) | bestiary agent |
| `src/art_icons.js`, `src/art_enemies1.js` | art agent A |
| `src/art_enemies2.js` | art agent B |
| `src/ui.js`, `src/style.css`, `src/index.template.html` | UI agent |

Every file is a plain script that attaches to the global `M`:
```js
(function () { var M = ((typeof globalThis !== 'undefined') ? globalThis : window).M; /* ... */ })();
```
Load order: engine, cards, relics, events, enemies, art_icons, art_enemies1, art_enemies2, ui.
`node load.js` (via `require('./load')`) loads engine + data for Node tests. `node smoke.js 300` runs random runs.

## Effect DSL (ops) — used by cards, relic hooks, gloss hooks, enemy moves, events
An op list is an array of objects executed in order. `ctx.side` is `p` (player), `e` (an enemy), or `run` (out of combat).
Targets: for player-side ops default target of `dmg`/`apply` is the chosen enemy (card `target:'enemy'`) or a random foe
in hooks; `target:'all'` all foes, `'random'`, `'self'` = the source. For enemy-side ops default target is the player;
`'self'` = that enemy; `'allies'` = all living enemies.

Combat ops:
- `{op:'dmg', n, times?, target?}` attack damage (adds Might; Smudged ×0.75; target Torn ×1.5; Brambles retaliates)
- `{op:'dmgPer', base?, mult?, per, times?, target?}` damage = base + mult × value(per).
  `per` ∈ `targetCorrode, ward, played (cards played earlier this turn), margin, pigments, handSize, discard, might, blots, missingHp`
- `{op:'ward', n, target?}` gain Ward (+Resolve for cards; Faded ×0.75). enemy: `target:'allies'` wards all foes.
- `{op:'wardPer', base?, mult?, per}`
- `{op:'apply', s, n, target?}` add status stacks (negative n allowed).
- `{op:'doubleStatus', s, mult?=2, target?}`, `{op:'removeStatus', s, target?='self'}`
- `{op:'draw', n}`, `{op:'drawPigment', pig, n}` (pull cards of that pigment from draw pile)
- `{op:'ink', n}`, `{op:'heal', n}` (heals source; enemy may use `target:'allies'`), `{op:'loseHp', n}` (source loses HP)
- `{op:'addCard', id, n?, to?:'discard'|'hand'|'draw', up?}` temporary card into the PLAYER's piles (enemies use it for Blots)
- `{op:'scrapeBlots', draw?:true}` scrape all blot/curse cards in hand (draw 1 each)
- `{op:'gildHand', n|'all'}` upgrade random card(s) in hand for this fight
- `{op:'costHand', n, count?}` set cost of random card(s) in hand to n for this fight
- `{op:'if', cond, then:[...], else?:[...]}`; cond ∈ `illuminated, played:V|L|G|A (earlier this turn), targetCorroded,
  targetTorn, targetAttacking, wardAtLeast:N, hpBelowHalf, marginFull, firstCard, handEmpty, goldAtLeast:N`
- `{op:'repeat', n, ops}`, `{op:'nextTurn', ops}` (runs at the start of your next turn), `{op:'gold', n}`
- enemy-only: `{op:'eraseMargin', n?}` remove newest Gloss; `{op:'devour', n}` scrape random cards from player's draw pile;
  `{op:'summon', id, max?=4}`
Run ops (events/relic onPickup, `ctx.side='run'`): `gold, heal, loseHp (never below 1), maxHp {n}, addCard {id} (permanent),
gainCard {id}|{rarity}, relic {id}|{rarity}, gildRandom {n}, removeRandom {n}, choose {purpose:'remove'|'gild'|'transform'|'duplicate'},
fight {enc:[enemyIds], kind:'battle'|'elite'}` (fight starts combat after the choice; rewards follow normally).

### Statuses (`M.STATUS`)
might (+dmg/hit, permanent) · resolve (+Ward per card Ward gain) · corrode (lose N HP at own turn start, then −1) ·
smudged (−25% attack dmg, −1/turn) · torn (+50% dmg taken, −1/turn) · faded (−25% Ward gained, −1/turn) ·
brambles (attackers take N) · mending (heal N at own turn end, −1/turn) · steadfast (Ward kept, −1/turn) ·
zeal (gain N Might at own turn end) · shell (gain N Ward at own turn end) · parched (start next turn with N less Ink).

## Card schema (`M.CARDS[id]`)
```js
lance: { name:'Lance Thrust', pigment:'V', type:'attack'|'skill'|'gloss'|'blot'|'curse',
  rarity:'starter'|'common'|'uncommon'|'rare'|'special', cost:1 /* null = unplayable */, target:'enemy' /* only if it needs a chosen foe */,
  ops:[{op:'dmg', n:6}],
  gloss: {on, pig?, type?, every?, turn?, ops} | [..]   // gloss cards only — see hooks
  onDraw:[ops], endTurn:[ops] /* while in hand at end of turn (blots) */,
  scrape:bool, fleeting:bool, opening:bool, unplayable:bool,
  up: { /* any fields overridden when gilded, e.g. */ ops:[{op:'dmg', n:9}], cost:0 },
  text: 'optional HTML override (only when auto text cannot express it)', flavor:'optional short italic line' }
```
Rules text is auto-generated from ops by `M.cardText(inst, st)`; prefer data that auto-describes well.
Fixed starter ids: `lance` (V attack), `shield` (L skill), `moss_dart` (G attack). Starter deck: 4 lance, 4 shield, 2 moss_dart.
Fixed blot ids that enemies reference: `ink_blot`, `smear`, `paw_print`, `wormhole`. Fixed curse ids: `water_stain`, `dog_ear`, `censure`.

## Hooks (relics `hooks:[...]` and gloss `gloss:{...}`)
`{on, pig?, type?, every?, turn?, ops}` with `on` ∈ `combatStart (relics), turnStart, turnEnd, illuminate, play, enemyDies,
hurt (player lost HP in a fight), combatEnd (relics, runs as side 'run')`. `pig`/`type` filter `play`. `every:N` = every Nth trigger.
`turn:1` filters turnStart to the first turn.

## Relic schema (`M.RELICS[id]`)
`{ name, rarity:'starter'|'common'|'uncommon'|'rare'|'boss'|'shop', hooks:[...], passive:{...}, onPickup:[run ops], text?, flavor }`
passive keys: `ink` (+Ink/turn), `hand` (+cards drawn/turn), `illumEase` (Illuminate needs N fewer pigments), `maxHp`,
`restHeal` (+HP when Mending), `shopDiscount` (%), `cardChoices` (+reward choices), `goldPct` (+% silver), `gildRewards` (cards you gain are gilded).
Starter relic id: `pilgrim_badge`. Boss relics are offered (pick 1 of 3) after acts I and II — make them strong with a drawback.

## Event schema (`M.EVENTS[id]`)
`{ title, acts:[1,2,3], text, choices:[{ label, desc, req?:{gold?, hp?, relic?}, ops:[run ops], result:'text' }] }`

## Enemy schema (`M.ENEMIES[id]`)
```js
snail_knight: { name:'Snail Knight', act:1, tier:'normal'|'elite'|'boss'|'minion', hp:[30,34], size:'s'|'m'|'l',
  desc:'one-line flavour', start:[ops at fight start, side e],
  moves:{ joust:{ name:'Slow Joust', intent?:'attack', ops:[{op:'dmg', n:9}] }, ... },
  ai:{ type:'cycle', seq:['joust','curl'], first?:['curl'], randomStart?:true }
     | { type:'random', w:{joust:2, curl:1}, maxRepeat?:2, noRepeat?:['curl'], first?:[...] },
  phase2?:{ at:0.5 /* hp fraction */, enter?:'moveKey', ai:{...} }, onDeath?:[ops] }
```
`M.ENCOUNTERS = { 1:{ easy:[[ids]], normal:[[ids]], elite:[[ids]], boss:[[id]] }, 2:{...}, 3:{...} }`

### Enemy roster (ids are FIXED — art keys use these exact ids)
Quire I: normal `snail_knight`, `killer_rabbit`, `ink_mite` (small, comes in groups), `ape_piper`, `grotesque_snout`;
elite `cynocephalus`, `hare_cavalier`; boss `great_snail`.
Quire II: normal `monkfish`, `blemmye`, `cockatrice`, `fox_preacher`; elite `manticore`, `wyvern`; boss `scribes_cat`.
Quire III: normal `locust_rider`, `ouroboros`, `hellmouth_imp`, `tome_mimic`; elite `hydra`, `pale_rider`; boss `bookworm`.
Minions (summonable, may reuse other art): `ink_mite`, `kitten_scrawl` (Scribe's Cat summons), `bookmite` (Bookworm summons).
Player art key: `knight`.

## Art contract
`M.ART = M.ART || {}; M.ART.enemies = Object.assign(M.ART.enemies || {}, { snail_knight:'<svg ...>' , ... })`
`M.ART.player = '<svg>'` (art agent A), `M.ART.icons = { name:'<svg viewBox="0 0 24 24">…' }` (art agent A).
Enemy/player SVGs: `viewBox="0 0 200 200"`, no width/height attrs, no text, no external refs, no scripts.
Any `id`/gradient/filter ids must be prefixed with the art key (many SVGs share a page). Enemies face LEFT/down-left
toward the player; the knight faces RIGHT. Ground line at y≈185. Must read clearly at 100–130px.
Icon names (24×24, single ink colour via `currentColor` with pigment accents allowed):
intent_attack, intent_defend, intent_buff, intent_debuff, intent_curse, intent_erase, intent_devour, intent_summon, intent_unknown,
ink, silver, hp, ward, deck, draw_pile, discard_pile, scraped, margin, map, menu, sound_on, sound_off,
node_battle, node_elite, node_boss, node_event, node_shop, node_rest, node_treasure,
st_might, st_resolve, st_corrode, st_smudged, st_torn, st_faded, st_brambles, st_mending, st_steadfast, st_zeal, st_shell, st_parched,
type_attack, type_skill, type_gloss, type_blot, relic (generic reliquary fallback).

## UI contract (engine API)
- `st = M.newRun({seed})`, `M.dailySeed()`, `M.randomSeed()`; persist with `M.serialize(st)` / `M.deserialize(str)` in localStorage (try/catch).
- All player input goes through `M.act(st, action)` → `{ok, err}`; after each call read `st.fx` (array of animation events) and re-render.
- `st.screen` ∈ `actIntro, map, combat, reward, rest, pick, treasure, shop, event, end`.
- Actions: proceed · chooseNode{id} · play{hand, target} · endTurn · takeGold · takeCard{idx} · skipCards · takeRelic ·
  takeBossRelic{idx} · leaveReward · mend · gild · openChest · leaveTreasure · buyCard{idx} · buyRelic{idx} · buyRemove · buyGild ·
  leaveShop · eventChoice{idx} · leaveEvent · pickCard{uid} · cancelPick.
- Helpers: `M.reachable(st)`, `M.findNode`, `M.canPlay(st, i)`, `M.cardDef(inst)`, `M.cardCost(st, inst)`, `M.cardText(inst, st)`,
  `M.relicText(id)`, `M.intentInfo(st, enemy)` → `{kinds:[...], dmg, times, name}`, `M.illumProgress(st)`, `M.illumNeed(st)`,
  `M.living(st)`, `M.pickable(st)`, `M.choiceAvailable(st, choice)`, `M.removePrice(st)`, `M.score(st)`, `M.STATUS`, `M.PIGMENTS`, `M.KEYWORDS`.
- fx kinds: combatStart, playerTurn, enemyTurn, enemyAct{tgt,name}, play{uid,id,tgt}, hit{src,tgt,n,blocked}, loseHp, heal, ward,
  status{tgt,s,n}, tick, death{tgt}, draw, reshuffle, illuminate, gloss, erase, scrape, devour, summon, phase, addCard, gild,
  ink, gold, relic, relicFire, glossFire, gainCard, removeCard, transform, gildDeck, maxHp, victory, defeat.
  `tgt` is `'p'` or an enemy `uid` (stable per fight; enemies array index ≠ uid).
- Combat state: `st.combat = {turn, ink, draw, hand, discard, scraped, margin, player:{ward, st}, enemies:[{uid,id,name,hp,maxHp,ward,st,intent,dead}], pig, illum, kind, over}`.
  After a won fight `st.combat.over === true` until `leaveReward`.

---------------------------------------------------------------------------------------------------
# v2 — Replayability update (characters, Rubrication, collection & unlocks, daily modifiers, new bosses)

## New files & ownership
| file | owner |
|---|---|
| `src/engine.js`, `src/data/meta.js` (Knight def, achievements, unlock tags, daily modifiers) | lead |
| `src/data/char_nun.js` | Nun content agent |
| `src/data/char_scribe.js` | Scribe content agent |
| `src/data/bosses2.js` | boss agent (adds to `M.ENEMIES`, pushes into `M.ENCOUNTERS[act].boss`) |
| `src/art_chars.js` | character art agent (`M.ART.players = {nun, scribe}`; knight stays `M.ART.player`) |
| `src/art_bosses2.js` | boss art agent (adds to `M.ART.enemies`) |
| `src/ui.js`, `src/style.css`, `src/index.template.html` | UI agent |
Load order: engine, cards, relics, events, enemies, **meta, char_nun, char_scribe, bosses2**, art_icons, art_enemies1, art_enemies2, **art_chars, art_bosses2**, ui.
Tests: `node tools/meta_test.js` (characters × Rubrication, every modifier, unlock filtering), plus the v1 tools.

## Characters (`M.CHARACTERS[id]`)
```js
M.CHARACTERS.nun = { name:'Sister Anselma', short:'Nun', hp:66, art:'nun', order:2, deck:[ids…10], relic:'starter_relic_id',
  unlock:'win_knight' /* achievement id, null = always available */, colors:['L','G','V'], blurb:'one or two sentences' };
```
- Cards/relics with `char:'nun'` are only offered to that character. Cards with no `char` (the colourless Ink `N` cards) are shared.
  All existing V/L/G/A cards are tagged `char:'knight'` by meta.js.
- The Illuminate rule (V + L + G in one turn) is universal, so EVERY character needs cards in all three colours (a lean
  third colour is fine) plus a few Gold. A character's identity comes from its mechanics and colour weighting.
- `M.newRun({seed, char, asc, unlocked:[achievementIds], mods?})`. `st.char`, `st.asc`, `st.mods`, `st.unlocked`, `st.seen`.

## Unlocks & achievements
- `M.ACHIEVEMENTS[id] = {name, desc, check(st)}` (meta.js; character files may ADD 2–3 character-specific ones).
  Cards/relics/characters with `unlock:'<achId>'` are excluded from pools until the achievement is earned.
  Existing achievement ids: illum_streak, glossator, great_blow, triple_kill, unscathed, bulwark, flurry, deep_rot,
  quire_one, quire_two, hoarder, daily_win, win_knight, win_nun, win_scribe, rubric_five.
- `M.checkAchievements(st, haveIds)` → newly earned ids. `M.unlocksFor(achId)` → {cards, relics, chars}.
- New run stats available to checks: `st.stats.glosses, maxHit, killsTurnMax, illumStreakMax, flawless, maxCardsTurn, maxWard, maxCorrode, bossIds[]`.
- `st.seen = {cards:{id:1}, relics:{id:1}, foes:{id:1}}` records everything offered/met this run (for the collection book).
- Nun unlocks via `win_knight`; Scribe via `win_nun`.

## Rubrication (difficulty ladder) — `M.RUBRICS[i] = {name, desc}`; level N applies rules 1..N
1 more elites · 2 normal foes +10% HP · 3 elites +15% HP & 1 Might · 4 Mend 25% · 5 bosses +12% HP · 6 start with Dog Ear ·
7 normal foes 1 Might · 8 −20% silver · 9 heal 25% between Quires · 10 bosses 2 Might. Score × (1 + 0.1·level + 0.05·mods).
Per character, winning at level N unlocks N+1 (UI-tracked).

## Daily modifiers — `M.MODIFIERS[id] = {name, desc, passive?, hooks?, onRunStart?, enemyStart?, costSet?}`
Daily runs get 2 modifiers from `M.dailyMods(seed)` (deterministic). New passive keys: `marginSlots`, `enemyHpPct`.

## New ops / statuses
- `{op:'createCard', n?, rarity?, pig?, type?, to?:'hand'|'draw'|'discard', cost?, up?}` conjure random card(s) from the
  CURRENT character's available pool (temporary, this fight). `cost` sets their cost this fight.
- `{op:'echoMargin'}` every Gloss in the Margin fires its hook ops once more.
- enemy: `{op:'devourPigment', pig, n}` scrape random cards of that pigment from the player's draw pile.
- status `petrified` (on player): next turn the N most expensive cards drawn are stone (unplayable that turn). Apply with
  `{op:'apply', s:'petrified', n:1}` from an enemy.
- `M.marginSlots(st)`, `M.mendAmount(st)`, `M.score(st)` (with multiplier), `M.baseScore(st)`, `M.scoreMult(st)`, `M.cardPool(rarity, st, {pig,type})`.

## New boss roster (ids FIXED — art keys use these)
Quire I: `jousting_hare` + `war_snail` (a DUO boss fought together: encounter `['jousting_hare','war_snail']`), `bagpipe_bishop`
(summons minion `dancing_fool`). Quire II: `basilisk` (petrifies), `siren` (devours Lapis cards with her song).
Quire III: `hellmouth` (swallows cards and spits back Blots), `seraph` (four-faced; changes element/pattern by phase).
Each act's boss list becomes 3 options; the map shows which boss guards the top.
