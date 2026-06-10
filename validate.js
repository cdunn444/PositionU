#!/usr/bin/env node
/**
 * PositionU — Data Validator (v2, multi-file structure)
 * Run before every push: node validate.js
 *
 * Checks:
 *  1. Room sizes: OL rooms hold exactly 1 (a team-unit entry); every other
 *     room holds exactly 3 players.
 *  2. No player appears in a room whose position its stats don't fit
 *  3. Every era has all 8 position rooms (with OL exception)
 *  4. No duplicate player names within a room
 *  5. rules.js exists and has expected structure
 *  6. All school files referenced by manifest exist and parse
 *  7. Suspicious duplicates: the same player listed in two rooms of one
 *     school with an identical stat block (a tell-tale filler copy)
 */

const fs = require('fs');
const path = require('path');

const ALL_SLOTS = ['QB','RB','WR','TE','OL','DL','LB','DB'];
let errors = 0;
let warnings = 0;

function err(msg)  { console.log(`  ❌ ${msg}`); errors++; }
function warn(msg) { console.log(`  ⚠️  ${msg}`); warnings++; }
function ok(msg)   { console.log(`  ✅ ${msg}`); }

console.log('\n═══ PositionU Validator ═══\n');

// ── Check rules.js ────────────────────────────────────────────
console.log('Checking rules.js...');
const rulesPath = path.join(__dirname, 'js', 'rules.js');
if (!fs.existsSync(rulesPath)) {
  err('js/rules.js NOT FOUND');
} else {
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  ['positionCaps', 'recordTiers', 'maddenScales', 'version'].forEach(key => {
    if (!rulesContent.includes(key)) err(`rules.js missing key: ${key}`);
  });
  const versionMatch = rulesContent.match(/version:\s*["']([^"']+)["']/);
  if (versionMatch) ok(`rules.js v${versionMatch[1]}`);
}

// ── Check manifest ────────────────────────────────────────────
console.log('\nChecking data/manifest.json...');
const manifestPath = path.join(__dirname, 'data', 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  err('data/manifest.json NOT FOUND');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
ok(`Manifest lists ${manifest.schools.length} schools`);

// ── Validate all school files ────────────────────────────────
console.log('\nValidating school data files...');
const ALL_DATA = {};
const schoolSet = new Set();

manifest.schools.forEach(s => {
  const fp = path.join(__dirname, 'data', s.file);
  if (!fs.existsSync(fp)) { err(`Missing file: ${s.file}`); return; }
  try {
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    schoolSet.add(data.school);
    Object.entries(data.eras).forEach(([era, rooms]) => {
      ALL_DATA[`${data.school} ${era}`] = rooms;
    });
  } catch (e) {
    err(`${s.file}: parse error - ${e.message}`);
  }
});

console.log(`\n═══ Validating ${Object.keys(ALL_DATA).length} combos ═══`);

// Stat keys that mark a player as belonging at a position. A player whose
// stat block has none of these is sitting in the wrong room.
const POS_STATS = {
  QB: ['passYds', 'passTDs', 'intsSeason', 'qbr'],
  RB: ['rushYds', 'rushTDs', 'ypc'],
  WR: ['rec', 'recYds', 'recTDs', 'yac'],
  TE: ['rec', 'recYds', 'recTDs', 'yac'],
  OL: ['sacksAllowedSeason', 'pancakeBlocksSeason', 'passBlockEff', 'runBlockEff'],
  DL: ['sacks', 'tfls', 'hurries', 'dominanceGrade'],
  LB: ['tackles', 'sacks', 'tfls', 'ints'],
  DB: ['ints', 'pbus', 'coverageGrade', 'tackles', 'ff'],
};

// school -> playerName -> [{ where, statKey }]  (for cross-room dup detection)
const byPlayer = {};

let playerCount = 0;
Object.entries(ALL_DATA).forEach(([combo, rooms]) => {
  const era = combo.slice(combo.lastIndexOf(' ') + 1);
  const school = combo.slice(0, combo.lastIndexOf(' '));
  ALL_SLOTS.forEach(pos => {
    if (!rooms[pos]) {
      err(`${combo} ${pos}: MISSING room`);
      return;
    }
    const players = rooms[pos].players || [];

    // 1. Room sizes — OL is a single team-unit entry; every other room holds
    //    exactly 3 players (scoring only uses the top 3, so 3 is the hard cap).
    if (pos === 'OL') {
      if (players.length !== 1) err(`${combo} OL: ${players.length} entries (must be exactly 1 team unit)`);
    } else if (players.length !== 3) {
      err(`${combo} ${pos}: ${players.length} players (must be exactly 3)`);
    }

    // 4. No duplicate player names within a room
    const names = players.map(p => p.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupes.length) err(`${combo} ${pos}: duplicate(s) — ${[...new Set(dupes)].join(', ')}`);

    // 4b. Filler-copy tell: a player name ending in a bare " 2"/" 3" suffix.
    //     (OL team units like "1996 Syracuse OL" carry their year up front, so
    //     they're unaffected.) This is the exact signature of a copied entry.
    players.forEach(p => {
      if (pos !== 'OL' && /\s\d+$/.test(p.name || '')) {
        err(`${combo} ${pos}: "${p.name}" has a numeric name suffix — leftover filler copy?`);
      }
    });

    // 2. Stats must fit the position room they sit in
    const want = POS_STATS[pos] || [];
    players.forEach(p => {
      if (!p || !p.stats) return;
      const s = p.stats;
      if (want.length && !want.some(k => s[k] !== undefined && s[k] !== 0 && s[k] !== '')) {
        err(`${combo} ${pos}: "${p.name}" has no ${pos} stats (${want.join('/')}) — wrong position?`);
      }
      // 7. Track for cross-room identical-stat detection
      (byPlayer[school] ||= {});
      (byPlayer[school][p.name] ||= []).push({ where: `${era}/${pos}`, stats: JSON.stringify(s) });
    });

    playerCount += players.length;
  });
});

// 7. Suspicious duplicate (advisory): same player in two rooms of one school
//    with an identical stat block. NOTE: this is intentionally a *warning*, not
//    an error — the dataset deliberately reuses era-spanning legends (Deion
//    Sanders, Herschel Walker, Tua…) across adjacent decades with their career
//    line, which is structurally indistinguishable from an accidental filler
//    copy. The hard gate against filler is the numeric-suffix check above; this
//    list is here to eyeball periodically for genuine misplacements.
Object.entries(byPlayer).forEach(([school, players]) => {
  Object.entries(players).forEach(([name, entries]) => {
    if (entries.length < 2) return;
    const seen = new Map();
    entries.forEach(e => {
      if (seen.has(e.stats)) {
        warn(`${school}: "${name}" appears with identical stats in ${seen.get(e.stats)} and ${e.where} (era-spanning reuse — verify intentional)`);
      } else {
        seen.set(e.stats, e.where);
      }
    });
  });
});

console.log('\n═══ Summary ═══');
console.log(`  Combos:  ${Object.keys(ALL_DATA).length}`);
console.log(`  Schools: ${schoolSet.size}`);
console.log(`  Players: ${playerCount}`);

console.log('\n═══ Result ═══');
if (errors === 0 && warnings === 0) {
  console.log('  ✅ All clean — safe to push\n');
  process.exit(0);
} else if (errors === 0) {
  console.log(`  ⚠️  ${warnings} warning(s), 0 errors — review before pushing\n`);
  process.exit(0);
} else {
  console.log(`  ❌ ${errors} error(s), ${warnings} warning(s) — fix before pushing\n`);
  process.exit(1);
}
