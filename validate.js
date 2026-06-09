#!/usr/bin/env node
/**
 * PositionU — Data Validator (v2, multi-file structure)
 * Run before every push: node validate.js
 *
 * Checks:
 *  1. Every room has exactly 1–3 players
 *  2. No player appears in the wrong position room
 *  3. Every era has all 8 position rooms (with OL exception)
 *  4. No duplicate player names within a room
 *  5. rules.js exists and has expected structure
 *  6. All school files referenced by manifest exist and parse
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

let playerCount = 0;
Object.entries(ALL_DATA).forEach(([combo, rooms]) => {
  ALL_SLOTS.forEach(pos => {
    if (!rooms[pos]) {
      err(`${combo} ${pos}: MISSING room`);
      return;
    }
    const players = rooms[pos].players || [];

    if (players.length === 0) err(`${combo} ${pos}: 0 players`);
    else if (players.length > 3) err(`${combo} ${pos}: ${players.length} players (max 3)`);

    const names = players.map(p => p.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupes.length) err(`${combo} ${pos}: duplicate(s) — ${[...new Set(dupes)].join(', ')}`);

    players.forEach(p => {
      if (!p || !p.stats) return;
      const s = p.stats;
      if (pos === 'QB' && (s.passYds === 0 || s.passYds === undefined)) {
        err(`${combo} QB: "${p.name}" has no passing stats — wrong position?`);
      }
      if (pos === 'RB' && !s.rushYds) warn(`${combo} RB: "${p.name}" has no rushYds`);
      if (pos === 'WR' && !s.recYds) warn(`${combo} WR: "${p.name}" has no recYds`);
    });

    playerCount += players.length;
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
