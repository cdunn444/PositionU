// ══════════════════════════════════════════════════════════════
// POSITION U — GAME RULES (LOCKED)
// ══════════════════════════════════════════════════════════════
// Source of truth for all difficulty and scoring constants.
// Changes here directly affect gameplay difficulty.
// See git history for prior rules versions.
// ══════════════════════════════════════════════════════════════

const RULES = Object.freeze({
  version: "1.5",
  lastUpdated: "2026-06-13",

  // Room score bands — recalibrated 2026-06-13. Every position's room score is a
  // linear remap of its raw stat+résumé score into a common, importance-weighted
  // band [f, c]. This normalizes the eight positions onto one comparable scale and
  // encodes positional importance in both the ceiling AND the spread: QB tops the
  // field (85) with the widest range; TE is a complement (62) with the narrowest.
  // The lines no longer dominate the total — OL was a flat-80 bug (its formula read
  // a field absent from the data) and DL pinned the old cap; both now read their
  // real stats and land in band. `lo`/`hi` are the observed raw room min/max on the
  // current roster pool; a room maps lo->f and hi->c (clamped). REGENERATE these
  // (and recordTiers/maddenScales/allTimeTotals below) if scoring or data changes.
  roomBands: {
    QB: { lo: 12.41, hi: 82.00, f: 40, c: 85 },
    RB: { lo: 18.30, hi: 74.84, f: 35, c: 78 },
    WR: { lo: 11.99, hi: 65.67, f: 36, c: 80 },
    TE: { lo:  2.44, hi: 35.07, f: 30, c: 62 },
    OL: { lo: 58.20, hi: 123.80, f: 40, c: 76 },
    DL: { lo: 13.06, hi: 107.75, f: 38, c: 76 },
    LB: { lo: 24.32, hi: 78.34, f: 37, c: 75 },
    DB: { lo: 20.80, hi: 64.82, f: 36, c: 72 }
  },

  // Madden rating scales — recalibrated 2026-06-13 against the rescaled room bands.
  // Per-axis piecewise map (floor -> knee@strong-unit -> dream-team max):
  //   weak unit (~2nd pct) -> 55 ; strong well-drafted side -> ~95 at the knee ;
  //   dream team (best room at every slot) -> 100. Fit so a side's p50 reads ~80
  //   and p90 ~91-93 (the pre-rescale distribution, preserved in sim). The 3-vs-5
  //   imbalance (offense has 5 rooms, defense 3) is absorbed here by the separate
  //   per-side curves, not by inflating defensive room scores. Inlined in game.js.
  maddenScales: {
    offense: { floor: 191, knee: 279, kneeRating: 95, max: 381, floorRating: 55, ceiling: 100 },
    defense: { floor: 114, knee: 163, kneeRating: 95, max: 223, floorRating: 55, ceiling: 100 }
  },

  // All-time ranking — team total (off+def roomScore sum) at each percentile 0..100,
  // sampled over the full space of possible teams (one room per position) on the
  // rebuilt roster pool. The results screen shows "Top X% all-time" by locating a
  // team's total in this curve. Regenerate if scoring or roster data changes.
  allTimeTotals: [329,356,360,362,364,366,367,368,369,370,371,372,373,374,375,375,376,377,377,378,379,379,380,380,381,382,382,383,383,384,384,385,385,386,386,387,387,388,388,389,389,390,390,391,391,392,392,393,393,394,394,395,395,396,396,397,397,398,398,399,399,400,400,401,401,402,402,403,403,404,405,405,406,406,407,408,408,409,410,411,411,412,413,414,415,416,417,418,419,420,421,422,424,426,427,430,432,435,439,446,510],

  // Regular-season record tiers — a 12-GAME season. Recalibrated 2026-06-11 for
  // Playoff mode: the team's total places it in this table to set a regular-season
  // record, then the 3 playoff games fill out the year (12-0 + win out = 15-0).
  // Thresholds are anchored to the percentile of ACTUAL random drafts (8 random
  // rooms), so the record reflects how your draft stacks up against the field:
  // ~top 25% reach 9-3 (the playoff gate, see playoffGate), the median lands ~6-6,
  // and a perfect 12-0 sits at ~top 1-2%. Total-only — offense and defense each get
  // their say in the actual playoff games, which punish an unbalanced roster.
  recordTiers: [
    { min: 433, offMin: 0, defMin: 0, roomMin: 0, record: '12-0', grade: 'S+', label: 'Perfect Season' },
    { min: 423, offMin: 0, defMin: 0, roomMin: 0, record: '11-1', grade: 'S',  label: 'Dynasty Level' },
    { min: 412, offMin: 0, defMin: 0, roomMin: 0, record: '10-2', grade: 'A+', label: 'Championship Contender' },
    { min: 399, offMin: 0, defMin: 0, roomMin: 0, record: '9-3',  grade: 'A',  label: 'Playoff Caliber' },
    { min: 390, offMin: 0, defMin: 0, roomMin: 0, record: '8-4',  grade: 'A-', label: 'Top 25 Team' },
    { min: 383, offMin: 0, defMin: 0, roomMin: 0, record: '7-5',  grade: 'B+', label: 'Bowl Team' },
    { min: 376, offMin: 0, defMin: 0, roomMin: 0, record: '6-6',  grade: 'B',  label: 'Middle of the Pack' },
    { min: 369, offMin: 0, defMin: 0, roomMin: 0, record: '5-7',  grade: 'B-', label: 'Missed a Bowl' },
    { min: 362, offMin: 0, defMin: 0, roomMin: 0, record: '4-8',  grade: 'C+', label: 'Rebuilding' },
    { min: 355, offMin: 0, defMin: 0, roomMin: 0, record: '3-9',  grade: 'C',  label: 'Tough Season' },
    { min: 350, offMin: 0, defMin: 0, roomMin: 0, record: '2-10', grade: 'C-', label: 'Rough Year' },
    { min: 0,   offMin: 0, defMin: 0, roomMin: 0, record: '1-11', grade: 'D',  label: 'Reset the Program' }
  ],

  // Playoff gate — minimum regular-season wins (of 12) to make the field. 9 wins
  // (9-3, ~top 25% of drafts) is a believable resume; weaker seasons end without a
  // playoff berth. Tune alongside recordTiers if the qualify rate needs to move.
  playoffGate: 9,

  // Position slot groupings
  offenseSlots: ['QB', 'RB', 'WR', 'TE', 'OL'],
  defenseSlots: ['DL', 'LB', 'DB']
});

if (typeof window !== 'undefined') window.RULES = RULES;
if (typeof module !== 'undefined') module.exports = RULES;
