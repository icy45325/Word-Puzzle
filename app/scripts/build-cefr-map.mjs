#!/usr/bin/env node
// Build a CEFR tag map for every word in the current dictionary.
//
// Output: app/scripts/seed/cefr-map.json (mapping WORD → "A1"|...|"C1")
//
// Strategy: explicit overrides for words where the level is obvious;
// length-based fallback for the rest. The current 500-word dict is
// anagram-biased (lots of 3-4 letter short words, very few 7+ letter
// words), so we lean A1/A2-heavy. Dict expansion (plan Phase 2) will
// rebalance higher tiers over time.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'seed', 'cefr-map.json');
const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary.json');

// ─── Overrides ────────────────────────────────────────────────────────
// Words tagged here override the length-based default. Use sparingly —
// only when the default would clearly miss (e.g. CASTLE = B1 not A2,
// PICTURE = A2 not B2, VICTORY = B1 not B2).

const OVERRIDES = {
  // Force-A1: very-very basic words even if long-ish
  A1: [
    'CAT', 'DOG', 'EAT', 'CAR', 'CUP', 'EAR', 'RUN', 'SUN', 'BIG',
    'HOT', 'BAR', 'BAT', 'RAT', 'NUT', 'HIT', 'LET', 'GET', 'PUT',
    'SIT', 'TAP', 'TIP', 'HEN', 'HER', 'HIS', 'NOT', 'ONE', 'SON',
    'TON', 'TOE', 'TOY', 'TIE', 'TIN', 'TON', 'TAB', 'ARM', 'ART',
    'AIR', 'EAT', 'ACT', 'PIE', 'TEA', 'ALE', 'ICE', 'DAY', 'MAP',
    'CAKE', 'PLAY', 'NICE', 'GOOD', 'BAKE', 'TIME', 'LATE', 'TIDE',
    'LOVE', 'LIKE', 'FACE', 'HAND', 'WORK', 'PLAY', 'COME', 'TAKE',
    'MAKE', 'GIVE', 'YEAR', 'RAIN', 'COLD', 'WARM', 'EAST', 'WEST',
    'NORTH', 'WALL', 'DOOR', 'TREE', 'BIRD', 'FISH', 'BOOK', 'PARK',
    'STAR', 'HEAR', 'READ', 'SLEEP', 'NIGHT', 'LIGHT', 'HOUSE',
    'HORSE', 'WATER', 'BREAD', 'CLEAN', 'HEART', 'EARTH', 'HEAVY',
    'SMILE', 'GREEN', 'WHITE', 'BLACK', 'HAPPY', 'MUSIC', 'PHONE',
    'CAR', 'DOG', 'CAT', 'BAR', 'RAT', 'NUT', 'BEE',
    'BREAK', 'PARTY', 'HAPPY', 'YEAR',
  ],
  // A2: everyday-but-not-trivial
  A2: [
    'GARDEN', 'KITCHEN', 'FRIEND', 'STREAM', 'HEART', 'HEAVY',
    'ANSWER', 'ANGER', 'LISTEN', 'SILENT', 'BREAD', 'BAKER', 'BREAST',
    'CASTLE', 'PICTURE', 'WONDERS', 'WONDER', 'FATHER', 'FATHERS',
    'BRACKET', 'PETAL', 'POETRY', 'POET', 'CITY', 'COUNTRY', 'NICE',
    'CIRCLE', 'SQUARE', 'COTTON', 'STREET', 'WINTER', 'SUMMER',
    'SPRING', 'AUTUMN', 'SCHOOL', 'PEOPLE', 'FAMILY', 'MOTHER',
    'FATHER', 'BROTHER', 'SISTER', 'CHILDREN', 'PROBLEM', 'STUDENT',
    'TEACHER', 'OFFICE', 'NUMBER', 'WINDOW', 'TICKET', 'COMPUTER',
    'BUTTER', 'COFFEE', 'DINNER', 'DOCTOR', 'KITCHEN', 'GARDEN',
    'SECOND', 'MINUTE',
  ],
  // B1: intermediate words
  B1: [
    'MASTER', 'MASTERY', 'PLANTER', 'BLASTER', 'PICTURE', 'HISTORY',
    'VICTORY', 'PLANETS', 'POINTS', 'POETRY', 'ROUTINE', 'READING',
    'DETAIL', 'DANGER', 'INLETS', 'LISTEN', 'SILENT', 'ANSWER',
    'ANGER', 'SHARES', 'STABLE', 'TABLES', 'TINSEL', 'FOSTER',
    'SOFTER', 'FOREST', 'WONDERS', 'EAGER', 'INERT', 'DREAM',
    'CRATE', 'CATER', 'TRACE', 'REACT', 'CARET', 'STEAL', 'TEAMS',
    'TEARS', 'SLATE', 'STORE', 'STORM', 'STORY', 'PEARL', 'SPEAR',
    'RELAY', 'REPLY', 'REPLAY', 'PARLEY', 'PLAYER', 'LAYER',
    'WANES', 'TARES', 'STARE', 'SMART', 'SHIRT', 'TYPING', 'EAGER',
    'ALERT', 'ALTER', 'LATER', 'PARSE', 'CRUET', 'EATER', 'BREED',
    'BRAKE', 'BAREST',
  ],
  // B2: upper intermediate
  B2: [
    'TINSEL', 'BLASTER', 'PLANTER', 'BRACKET', 'COUNTRY', 'POETRY',
    'ROUTINE', 'READING', 'HISTORY', 'KITCHEN', 'VICTORY', 'PICTURE',
    'PLANETS', 'WONDERS', 'INERT', 'ECLAT', 'ERUPT', 'STEIN',
    'SHARES', 'STEAL', 'CRUET', 'PARLEY', 'PARSE', 'DEBAR', 'ELAN',
    'REND', 'INTRO', 'ENLIST', 'SHARP', 'IVORY', 'NICHE', 'EONS',
    'ERAS', 'EROS', 'CITE', 'EDIT', 'EPIC',
  ],
  // C1: advanced / archaic / specialized
  C1: [
    'ECLAT', 'ELAN', 'STEIN', 'DEBAR', 'BRAE', 'MITS', 'MOTS',
    'MILS', 'MILTS', 'TIS', 'UNS', 'STEN', 'MEAR', 'HADER', 'DRAB',
    'DREAR', 'PYRE', 'ASTER', 'MITE', 'NEAP', 'ROES', 'SERA',
    'INTRO', 'INERT',
  ],
};

// ─── Length-based fallback ────────────────────────────────────────────
// Used when a word isn't explicitly overridden. Conservative defaults
// that roughly track real CEFR distribution for the existing dict.

function defaultByLength(word) {
  const L = word.length;
  if (L <= 3) return 'A1';
  if (L === 4) return 'A1';
  if (L === 5) return 'A2';
  if (L === 6) return 'B1';
  return 'B2'; // 7+
}

// ─── Build the map ────────────────────────────────────────────────────

const dict = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'));
const allWords = Object.keys(dict).sort();

// Index overrides for quick lookup. Later tiers win when the same word
// appears in multiple (so PICTURE in both A2 and B1 list resolves to B1).
const wordToCefr = {};
for (const tier of ['A1', 'A2', 'B1', 'B2', 'C1']) {
  for (const w of OVERRIDES[tier]) wordToCefr[w.toUpperCase()] = tier;
}

const map = {};
const stats = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, fromOverride: 0, fromLength: 0 };

for (const w of allWords) {
  let cefr = wordToCefr[w];
  if (cefr) {
    stats.fromOverride++;
  } else {
    cefr = defaultByLength(w);
    stats.fromLength++;
  }
  map[w] = cefr;
  stats[cefr]++;
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(map, null, 2) + '\n');
console.log(`Wrote ${Object.keys(map).length} CEFR tags to ${OUT}`);
console.log('Distribution:', stats);
