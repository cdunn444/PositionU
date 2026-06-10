// ══════════════════════════════════════════════════════════════
// POSITION U — GAME RULES (LOCKED)
// ══════════════════════════════════════════════════════════════
// Source of truth for all difficulty and scoring constants.
// Changes here directly affect gameplay difficulty.
// See git history for prior rules versions.
// ══════════════════════════════════════════════════════════════

const RULES = Object.freeze({
  version: "1.4",
  lastUpdated: "2026-06-09",

  // Position score caps — max raw room score per position
  positionCaps: {
    QB: 115, RB: 140, WR: 120, TE: 100,
    OL: 135, DL: 120, LB: 120, DB: 120
  },

  // Per-game scaling factor per position
  scale: {
    QB: 3.2, RB: 3.0, WR: 2.8, TE: 2.2,
    OL: 1.0, DL: 5.5, LB: 4.8, DB: 5.0
  },

  // Madden rating scales — recalibrated 2026-06-10 against the rebuilt roster data.
  // Per-axis piecewise map (floor -> knee@strong-unit -> dream-team max):
  //   weak unit (~1st pct) -> 55 ; strong well-drafted unit -> ~90 at the knee ;
  //   95+ reserved for exceptional units ; dream team (best room at every slot) -> 100.
  //   Top deliberately decompressed so one elite room can't vault a side to 99.
  //   Offense and defense tuned symmetric (verified in sim). Inlined in game.js.
  maddenScales: {
    offense: { floor: 136, knee: 245, kneeRating: 92, max: 375, floorRating: 55, ceiling: 100 },
    defense: { floor:  64, knee: 154, kneeRating: 92, max: 263, floorRating: 55, ceiling: 100 }
  },

  // Record tier requirements — ALL conditions must be met for the tier.
  // Recalibrated 2026-06-10 against the rebuilt roster pool AND the real spin
  // mechanic (8 random draws in fixed position order, 2 respins) — the old tiers
  // were tuned to optimistic totals, so 15-0 (old min 403) sat ABOVE the 99th
  // percentile of achievable totals and was effectively impossible. New tiers are
  // anchored to the same realistic distribution as the Madden scales so record and
  // rating agree but with headroom: median ~11-4, 15-0 ~6-7% (hard but a real,
  // brag-worthy goal). A 15-0 team reads only ~82 overall, leaving the 90s/100
  // Madden ratings as a separate, rarer chase (90+ overall ~1%, 100 = dream team).
  // offMin/defMin keep lopsided teams (great O, weak D) out of the top tiers.
  recordTiers: [
    { min: 347, offMin: 215, defMin: 128, roomMin: 0, record: '15-0', grade: 'S+', label: 'Undefeated Legend' },
    { min: 339, offMin: 208, defMin: 121, roomMin: 0, record: '14-1', grade: 'S',  label: 'Dynasty Level' },
    { min: 331, offMin: 201, defMin: 114, roomMin: 0, record: '13-2', grade: 'A+', label: 'Championship Contender' },
    { min: 321, offMin: 192, defMin: 106, roomMin: 0, record: '12-3', grade: 'A',  label: 'Elite Program' },
    { min: 311, offMin: 182, defMin:  97, roomMin: 0, record: '11-4', grade: 'A-', label: 'Top 10 Caliber' },
    { min: 302, offMin: 172, defMin:  88, roomMin: 0, record: '10-5', grade: 'B+', label: 'Bowl Winner' },
    { min: 293, offMin: 160, defMin:  79, roomMin: 0, record: '9-6',  grade: 'B',  label: 'Solid Program' },
    { min: 284, offMin: 148, defMin:  69, roomMin: 0, record: '8-7',  grade: 'B-', label: 'Bowl Eligible' },
    { min: 275, offMin: 136, defMin:  60, roomMin: 0, record: '7-8',  grade: 'C+', label: 'Rebuilding' },
    { min: 266, offMin: 0,   defMin: 0,   roomMin: 0, record: '6-9',  grade: 'C',  label: 'Tough Season' },
    { min: 256, offMin: 0,   defMin: 0,   roomMin: 0, record: '5-10', grade: 'C-', label: 'Rough Year' },
    { min: 0,   offMin: 0,   defMin: 0,   roomMin: 0, record: '4-11', grade: 'D',  label: 'Reset the Program' }
  ],

  // Position slot groupings
  offenseSlots: ['QB', 'RB', 'WR', 'TE', 'OL'],
  defenseSlots: ['DL', 'LB', 'DB']
});

if (typeof window !== 'undefined') window.RULES = RULES;
if (typeof module !== 'undefined') module.exports = RULES;
