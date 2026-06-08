#!/usr/bin/env node
/**
 * PositionU — Data Validator
 * Run before every push: node validate.js
 *
 * Checks:
 *  1. Every room has exactly 1–3 players (no phantom entries, no empty rooms)
 *  2. No player appears in the wrong position room (QB with 0 passYds, etc.)
 *  3. Every era has all 8 position rooms
 *  4. No duplicate player names within a room
 *  5. Summary stats: combo count, school count, player count
 */

const fs = require('fs');
const path = require('path');
const { runInNewContext } = require('vm');

const ALL_SLOTS    = ['QB','RB','WR','TE','OL','DL','LB','DB'];
const OFFENSE      = ['QB','RB','WR','TE','OL'];
const DEFENSE      = ['DL','LB','DB'];
let errors = 0;
let warnings = 0;

function err(msg)  { console.log(`  ❌ ${msg}`); errors++; }
function warn(msg) { console.log(`  ⚠️  ${msg}`); warnings++; }
function ok(msg)   { console.log(`  ✅ ${msg}`); }

// ── 1. Load prototype GAME_DATA ──────────────────────────────
console.log('\n═══ Loading prototype data ═══');
const indexPath = path.join(__dirname, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.log('❌ index.html not found — run from repo root');
  process.exit(1);
}
const html = fs.readFileSync(indexPath, 'utf8');

// Find the right script block (second one — first is GA tag)
let p = 0, count = 0, jsStart, jsEnd;
while (count < 2) {
  jsStart = html.indexOf('<script>', p) + 8;
  jsEnd   = html.indexOf('</script>', jsStart);
  p = jsEnd + 1;
  count++;
}
const js = html.substring(jsStart, jsEnd);

const ctx = {};
try {
  const gd0 = js.indexOf('const GAME_DATA = {');
  const gd1 = js.indexOf('const SPIN_POOL');
  runInNewContext(js.substring(gd0, gd1).replace('const GAME_DATA', 'GAME_DATA'), ctx);
  ok(`Prototype parsed — ${Object.keys(ctx.GAME_DATA).length} combos`);
} catch(e) {
  err(`Prototype GAME_DATA parse error: ${e.message.split('\n')[0]}`);
  process.exit(1);
}

// ── 2. Load era files ────────────────────────────────────────
console.log('\n═══ Loading era files ═══');
const eraData = {};
const eraDir = __dirname;
const eraFiles = fs.readdirSync(eraDir).filter(f => f.startsWith('era_') && f.endsWith('.js'));

if (eraFiles.length === 0) {
  warn('No era_*.js files found in repo root — only validating prototype');
} else {
  eraFiles.forEach(f => {
    try {
      delete require.cache[require.resolve(path.join(eraDir, f))];
      const src = require(path.join(eraDir, f));
      const key = Object.keys(src)[0];
      Object.assign(eraData, src[key]);
    } catch(e) {
      err(`${f}: parse error — ${e.message.split('\n')[0]}`);
    }
  });
  ok(`${eraFiles.length} era files loaded — ${Object.keys(eraData).length} combos`);
}

// Merge all data
const ALL_DATA = { ...ctx.GAME_DATA, ...eraData };
const allCombos = Object.keys(ALL_DATA);
console.log(`\n═══ Validating ${allCombos.length} total combos ═══`);

// ── 3. Per-room checks ───────────────────────────────────────
const playerCounts = {};
const schoolSet = new Set();

allCombos.forEach(combo => {
  const rooms = ALL_DATA[combo];
  const school = combo.replace(/ \d0s$/, '');
  schoolSet.add(school);

  // Check all 8 rooms exist
  ALL_SLOTS.forEach(pos => {
    if (!rooms[pos]) {
      err(`${combo} ${pos}: MISSING room`);
      return;
    }

    const players = rooms[pos].players || [];

    // Player count
    if (players.length === 0) err(`${combo} ${pos}: 0 players`);
    else if (players.length > 3) err(`${combo} ${pos}: ${players.length} players (max 3)`);

    // Duplicate names within room
    const names = players.map(p => p.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupes.length) err(`${combo} ${pos}: duplicate player(s) — ${[...new Set(dupes)].join(', ')}`);

    // Cross-position sanity checks
    players.forEach(p => {
      if (!p || !p.stats) return;
      const s = p.stats;

      // QB with zero passing yards
      if (pos === 'QB' && (s.passYds === 0 || s.passYds === undefined)) {
        err(`${combo} QB: "${p.name}" has no passing stats — wrong position?`);
      }
      // RB with no rushing yards
      if (pos === 'RB' && !s.rushYds) {
        warn(`${combo} RB: "${p.name}" has no rushYds`);
      }
      // WR with no receiving yards
      if (pos === 'WR' && !s.recYds) {
        warn(`${combo} WR: "${p.name}" has no recYds`);
      }
      // DL with no sacks stat
      if (pos === 'DL' && s.sacks === undefined) {
        warn(`${combo} DL: "${p.name}" missing sacks stat`);
      }
      // DB with no ints stat
      if (pos === 'DB' && s.ints === undefined) {
        warn(`${combo} DB: "${p.name}" missing ints stat`);
      }
    });

    playerCounts[pos] = (playerCounts[pos] || 0) + players.length;
  });
});

// ── 4. Summary ───────────────────────────────────────────────
console.log('\n═══ Summary ═══');
console.log(`  Combos:  ${allCombos.length}`);
console.log(`  Schools: ${schoolSet.size}`);
const totalPlayers = Object.values(playerCounts).reduce((a,b)=>a+b,0);
console.log(`  Players: ${totalPlayers}`);
console.log(`  Per room avg: ${(totalPlayers / (allCombos.length * 8)).toFixed(1)}`);

console.log('\n═══ Result ═══');
if (errors === 0 && warnings === 0) {
  console.log('  ✅ All clean — safe to push\n');
  process.exit(0);
} else if (errors === 0) {
  console.log(`  ⚠️  ${warnings} warning(s), 0 errors — review warnings before pushing\n`);
  process.exit(0);
} else {
  console.log(`  ❌ ${errors} error(s), ${warnings} warning(s) — fix errors before pushing\n`);
  process.exit(1);
}
