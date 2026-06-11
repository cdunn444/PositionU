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
  // ── Tier 1 — Quarterfinal ──────────────────────────────────
  { year: 2016, school: 'Washington',     off: 85, def: 86, tier: 1, note: 'Balanced Pac-12 champions' },
  { year: 2021, school: 'Cincinnati',     off: 82, def: 85, tier: 1, note: 'First Group of Five CFP team' },
  { year: 2015, school: 'Michigan State', off: 80, def: 84, tier: 1, note: 'Grind-it-out Big Ten champs' },
  { year: 2017, school: 'Oklahoma',       off: 96, def: 73, tier: 1, note: "Baker Mayfield's record offense" },
  { year: 2014, school: 'Oregon',         off: 93, def: 79, tier: 1, note: 'Marcus Mariota air raid' },
  { year: 2018, school: 'Notre Dame',     off: 84, def: 86, tier: 1, note: 'Undefeated, no real weakness' },
  { year: 2023, school: 'Washington',     off: 91, def: 79, tier: 1, note: 'Michael Penix Jr. aerial show' },

  // ── Tier 2 — Semifinal ─────────────────────────────────────
  { year: 2010, school: 'Auburn',         off: 93, def: 82, tier: 2, note: "Cam Newton's title run" },
  { year: 2008, school: 'Florida',        off: 92, def: 90, tier: 2, note: "Tim Tebow's complete juggernaut" },
  { year: 2002, school: 'Ohio State',     off: 81, def: 94, tier: 2, note: 'Defense-first national champs' },
  { year: 2009, school: 'Alabama',        off: 88, def: 93, tier: 2, note: 'Mark Ingram & a smothering D' },
  { year: 1988, school: 'Notre Dame',     off: 89, def: 89, tier: 2, note: "Lou Holtz's undefeated Irish" },
  { year: 2013, school: 'Florida State',  off: 93, def: 89, tier: 2, note: 'Jameis Winston, wire-to-wire' },
  { year: 2014, school: 'Ohio State',     off: 90, def: 87, tier: 2, note: 'Won the first-ever CFP' },

  // ── Tier 3 — Champions (title game) ────────────────────────
  { year: 2001, school: 'Miami',          off: 95, def: 96, tier: 3, note: 'Maybe the most talented roster ever' },
  { year: 2019, school: 'LSU',            off: 97, def: 86, tier: 3, note: "Joe Burrow's record-shattering offense" },
  { year: 1995, school: 'Nebraska',       off: 96, def: 92, tier: 3, note: 'Unstoppable option machine' },
  { year: 2018, school: 'Clemson',        off: 93, def: 95, tier: 3, note: 'Trevor Lawrence & a historic D-line' },
  { year: 2020, school: 'Alabama',        off: 97, def: 87, tier: 3, note: 'DeVonta Smith, all the points' },
  { year: 2022, school: 'Georgia',        off: 91, def: 95, tier: 3, note: 'Back-to-back, suffocating defense' },
  { year: 2005, school: 'Texas',          off: 96, def: 88, tier: 3, note: "Vince Young's Rose Bowl masterpiece" },
  { year: 2004, school: 'USC',            off: 95, def: 90, tier: 3, note: 'Reggie Bush & Matt Leinart' }
];

// Pick a random opponent of the given tier, excluding any already drawn.
function pickOpponent(tier, exclude) {
  exclude = exclude || [];
  const pool = PLAYOFF_TEAMS.filter(t => t.tier === tier && !exclude.includes(t));
  return pool[Math.floor(Math.random() * pool.length)];
}

// Standard-normal noise via Box-Muller — the touchdown-sized swing that lets a
// favorite get upset and an underdog steal one.
function gaussNoise(sd) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
}

// Simulate one game from the two squads' OFF/DEF ratings.
// Each side's points = base + (their offense − your defense) * k + noise.
// Returns integer scores and the winner; ties broken by a quality-weighted
// coin flip plus a field goal (a believable OT finish).
function simGame(yourOff, yourDef, oppOff, oppDef) {
  const BASE = 24, K = 0.8, SD = 7;
  const pts = (off, def) => Math.round(Math.max(3, Math.min(70, BASE + (off - def) * K + gaussNoise(SD))));
  let yourPts = pts(yourOff, oppDef);
  let oppPts  = pts(oppOff, yourDef);
  if (yourPts === oppPts) {
    const pYou = (yourOff + yourDef) / ((yourOff + yourDef) + (oppOff + oppDef));
    if (Math.random() < pYou) yourPts += 3; else oppPts += 3;
  }
  return { yourPts, oppPts, win: yourPts > oppPts };
}

if (typeof window !== 'undefined') {
  window.PLAYOFF_TEAMS = PLAYOFF_TEAMS;
  window.pickOpponent  = pickOpponent;
  window.simGame       = simGame;
}
if (typeof module !== 'undefined') module.exports = { PLAYOFF_TEAMS, pickOpponent, simGame };
