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

  // All-time ranking — team total (off+def roomScore sum) at each percentile 0..100,
  // sampled over the full space of possible teams (one room per position) on the
  // rebuilt roster pool. The results screen shows "Top X% all-time" by locating a
  // team's total in this curve. Regenerate if scoring or roster data changes.
  allTimeTotals: [227,260,265,268,271,273,274,276,277,279,280,281,282,283,284,285,286,287,288,289,290,290,291,292,293,294,294,295,296,296,297,298,299,299,300,301,301,302,303,303,304,304,305,306,306,307,308,308,309,310,310,311,312,312,313,314,314,315,316,317,317,318,319,319,320,321,322,322,323,324,325,326,327,327,328,329,330,331,332,333,334,335,336,338,339,340,342,343,345,346,348,350,352,354,357,360,364,369,375,386,503],

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
    { min: 353, offMin: 219, defMin: 131, roomMin: 0, record: '15-0', grade: 'S+', label: 'Undefeated Legend' },
    { min: 345, offMin: 212, defMin: 124, roomMin: 0, record: '14-1', grade: 'S',  label: 'Dynasty Level' },
    { min: 337, offMin: 205, defMin: 117, roomMin: 0, record: '13-2', grade: 'A+', label: 'Championship Contender' },
    { min: 327, offMin: 196, defMin: 109, roomMin: 0, record: '12-3', grade: 'A',  label: 'Elite Program' },
    { min: 317, offMin: 186, defMin: 100, roomMin: 0, record: '11-4', grade: 'A-', label: 'Top 10 Caliber' },
    { min: 307, offMin: 176, defMin:  90, roomMin: 0, record: '10-5', grade: 'B+', label: 'Bowl Winner' },
    { min: 297, offMin: 164, defMin:  80, roomMin: 0, record: '9-6',  grade: 'B',  label: 'Solid Program' },
    { min: 288, offMin: 152, defMin:  70, roomMin: 0, record: '8-7',  grade: 'B-', label: 'Bowl Eligible' },
    { min: 279, offMin: 140, defMin:  61, roomMin: 0, record: '7-8',  grade: 'C+', label: 'Rebuilding' },
    { min: 269, offMin: 0,   defMin: 0,   roomMin: 0, record: '6-9',  grade: 'C',  label: 'Tough Season' },
    { min: 258, offMin: 0,   defMin: 0,   roomMin: 0, record: '5-10', grade: 'C-', label: 'Rough Year' },
    { min: 0,   offMin: 0,   defMin: 0,   roomMin: 0, record: '4-11', grade: 'D',  label: 'Reset the Program' }
  ],

  // Position slot groupings
  offenseSlots: ['QB', 'RB', 'WR', 'TE', 'OL'],
  defenseSlots: ['DL', 'LB', 'DB']
});

if (typeof window !== 'undefined') window.RULES = RULES;
if (typeof module !== 'undefined') module.exports = RULES;
