// ══════════════════════════════════════════════════════════════
// POSITION U — PLAYOFF MODE
// ══════════════════════════════════════════════════════════════
// After drafting a team you take it to a 3-round College Football
// Playoff against curated real championship-caliber teams. Opponents
// are rated on the SAME 0-100 OFF/DEF scale the player's team uses, so
// games are a fair collision of the two squads.
//
//   tier 1 -> Quarterfinal pool (good playoff teams; some lopsided)
//   tier 2 -> Semifinal pool (strong contenders)
//   tier 3 -> Champions pool (the title game is ALWAYS a champion)
//
// Ratings are reputation-based estimates on our scale (elite ~90-97,
// solid ~80-88). Notes are a short calling card shown on the matchup.
// ══════════════════════════════════════════════════════════════

const PLAYOFF_TEAMS = [
  // ── Tier 1 — Quarterfinal (good-elite, ~86-90) ─────────────
  { year: 2016, school: 'Washington',     off: 88, def: 89, tier: 1, note: 'Balanced Pac-12 champions' },
  { year: 2021, school: 'Cincinnati',     off: 87, def: 88, tier: 1, note: 'First Group of Five CFP team' },
  { year: 2015, school: 'Michigan State', off: 86, def: 89, tier: 1, note: 'Grind-it-out Big Ten champs' },
  { year: 2017, school: 'Oklahoma',       off: 95, def: 82, tier: 1, note: "Baker Mayfield's record offense" },
  { year: 2014, school: 'Oregon',         off: 94, def: 83, tier: 1, note: 'Marcus Mariota air raid' },
  { year: 2018, school: 'Notre Dame',     off: 88, def: 87, tier: 1, note: 'Undefeated, no real weakness' },
  { year: 2023, school: 'Washington',     off: 93, def: 83, tier: 1, note: 'Michael Penix Jr. aerial show' },

  // ── Tier 2 — Semifinal (strong, ~89-93) ────────────────────
  { year: 2010, school: 'Auburn',         off: 92, def: 85, tier: 2, note: "Cam Newton's title run" },
  { year: 2008, school: 'Florida',        off: 91, def: 91, tier: 2, note: "Tim Tebow's complete juggernaut" },
  { year: 2002, school: 'Ohio State',     off: 86, def: 94, tier: 2, note: 'Defense-first national champs' },
  { year: 2009, school: 'Alabama',        off: 89, def: 93, tier: 2, note: 'Mark Ingram & a smothering D' },
  { year: 1988, school: 'Notre Dame',     off: 90, def: 90, tier: 2, note: "Lou Holtz's undefeated Irish" },
  { year: 2013, school: 'Florida State',  off: 93, def: 89, tier: 2, note: 'Jameis Winston, wire-to-wire' },
  { year: 2014, school: 'Ohio State',     off: 90, def: 88, tier: 2, note: 'Won the first-ever CFP' },

  // ── Tier 3 — Champions (title game) ────────────────────────
  // The greatest national champions, 1971-2022. The title game always draws one of
  // these legends at random, so a championship run spans 50 years of all-time teams.
  { year: 1971, school: 'Nebraska',       off: 95, def: 93, tier: 3, note: "'Game of the Century' national champs" },
  { year: 1972, school: 'USC',            off: 96, def: 91, tier: 3, note: 'Maybe the most complete team ever' },
  { year: 1979, school: 'Alabama',        off: 92, def: 95, tier: 3, note: "Bear Bryant's wire-to-wire champs" },
  { year: 1980, school: 'Georgia',        off: 93, def: 92, tier: 3, note: "Herschel Walker's title run" },
  { year: 1983, school: 'Miami',          off: 93, def: 92, tier: 3, note: 'Birth of the Hurricanes dynasty' },
  { year: 1985, school: 'Oklahoma',       off: 93, def: 95, tier: 3, note: 'Bosworth-led defensive juggernaut' },
  { year: 1986, school: 'Penn State',     off: 90, def: 95, tier: 3, note: 'Upset Miami with a smothering D' },
  { year: 1987, school: 'Miami',          off: 94, def: 93, tier: 3, note: 'Loaded, swaggering Canes' },
  { year: 1991, school: 'Washington',     off: 94, def: 95, tier: 3, note: 'Unbeaten, dominant on both lines' },
  { year: 1992, school: 'Alabama',        off: 91, def: 96, tier: 3, note: 'A historic, ball-hawking defense' },
  { year: 1995, school: 'Nebraska',       off: 96, def: 92, tier: 3, note: 'Unstoppable option machine' },
  { year: 1997, school: 'Michigan',       off: 91, def: 95, tier: 3, note: 'Charles Woodson & a shutdown D' },
  { year: 1999, school: 'Florida State',  off: 95, def: 91, tier: 3, note: 'Wire-to-wire #1, Weinke & co.' },
  { year: 2001, school: 'Miami',          off: 95, def: 96, tier: 3, note: 'Maybe the most talented roster ever' },
  { year: 2004, school: 'USC',            off: 95, def: 91, tier: 3, note: 'Reggie Bush & Matt Leinart' },
  { year: 2005, school: 'Texas',          off: 96, def: 89, tier: 3, note: "Vince Young's Rose Bowl masterpiece" },
  { year: 2018, school: 'Clemson',        off: 93, def: 95, tier: 3, note: 'Trevor Lawrence & a historic D-line' },
  { year: 2019, school: 'LSU',            off: 97, def: 88, tier: 3, note: "Joe Burrow's record-shattering offense" },
  { year: 2020, school: 'Alabama',        off: 97, def: 89, tier: 3, note: 'DeVonta Smith, all the points' },
  { year: 2022, school: 'Georgia',        off: 91, def: 95, tier: 3, note: 'Back-to-back, suffocating defense' }
];

// Pick a random opponent of the given tier, excluding any already drawn.
function pickOpponent(tier, exclude) {
  exclude = exclude || [];
  const pool = PLAYOFF_TEAMS.filter(t => t.tier === tier && !exclude.includes(t));
  return pool[Math.floor(Math.random() * pool.length)];
}

// Standard-normal noise via Box-Muller — a modest, ~field-goal-sized swing.
// Kept small (SD 4) on purpose: the better team should usually win, with only the
// occasional upset, rather than coin-flip chaos where a top team loses round one.
function gaussNoise(sd) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
}

// Snap a raw score to a real football total. The only values >=3 that can't be
// reached with touchdowns (7) and field goals (3) are 4, 5, 8 and 11, so nudge
// those to the nearest believable score. (Done before deciding the winner so the
// displayed score and the result always agree.)
function realisticScore(n) {
  const snap = { 4: 3, 5: 6, 8: 7, 11: 10 };
  return snap[n] != null ? snap[n] : n;
}

// Break a (real) final score into touchdowns and field goals — the fewest field
// goals that work, so it reads like a normal box score (mostly TDs, a FG or two).
// Every reachable total decomposes cleanly into 7s and 3s, so quarter sums are
// always believable (never a 4-, 5-, 8- or 11-point quarter). Sums exactly to n.
function decomposeScore(n) {
  n = Math.max(0, Math.round(n));
  for (let b = 0; b <= 6; b++) {
    if (n - 3 * b >= 0 && (n - 3 * b) % 7 === 0) {
      const a = (n - 3 * b) / 7;
      return Array(a).fill(7).concat(Array(b).fill(3));
    }
  }
  // Fallback (only hit by un-snapped totals): field goals plus a remainder.
  const out = []; let r = n;
  while (r >= 3) { out.push(3); r -= 3; }
  if (r > 0) out.push(r);
  return out;
}

// Spread a team's scoring plays across four quarters, always dropping the next
// play into one of the least-busy quarters so scores don't pile into a single
// freak quarter. Keeps scoreless quarters when there are only a play or two.
function toQuarters(total) {
  const q = [0, 0, 0, 0], counts = [0, 0, 0, 0];
  decomposeScore(total).forEach(pts => {
    const min = Math.min(...counts);
    const cands = [0, 1, 2, 3].filter(i => counts[i] === min);
    const i = cands[Math.floor(Math.random() * cands.length)];
    q[i] += pts; counts[i]++;
  });
  return q;
}

// Simulate one game from the two squads' OFF/DEF ratings.
// Each side's points = base + (their offense − your defense) * k + noise.
// Returns integer scores, per-quarter splits, and the winner; ties broken by a
// quality-weighted coin flip plus a field goal (a believable OT finish).
function simGame(yourOff, yourDef, oppOff, oppDef) {
  const BASE = 24, K = 1.0, SD = 4;
  const pts = (off, def) => realisticScore(Math.round(Math.max(3, Math.min(70, BASE + (off - def) * K + gaussNoise(SD)))));
  let yourPts = pts(yourOff, oppDef);
  let oppPts  = pts(oppOff, yourDef);
  if (yourPts === oppPts) {
    const pYou = (yourOff + yourDef) / ((yourOff + yourDef) + (oppOff + oppDef));
    if (Math.random() < pYou) yourPts += 3; else oppPts += 3;
  }
  return { yourPts, oppPts, win: yourPts > oppPts, yourQ: toQuarters(yourPts), oppQ: toQuarters(oppPts) };
}

if (typeof window !== 'undefined') {
  window.PLAYOFF_TEAMS = PLAYOFF_TEAMS;
  window.pickOpponent  = pickOpponent;
  window.simGame       = simGame;
}
if (typeof module !== 'undefined') module.exports = { PLAYOFF_TEAMS, pickOpponent, simGame };
