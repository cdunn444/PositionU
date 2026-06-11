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
    offense: { floor: 136, knee: 244, kneeRating: 95, max: 375, floorRating: 55, ceiling: 100 },
    defense: { floor:  64, knee: 146, kneeRating: 95, max: 263, floorRating: 55, ceiling: 100 }
  },

  // All-time ranking — team total (off+def roomScore sum) at each percentile 0..100,
  // sampled over the full space of possible teams (one room per position) on the
  // rebuilt roster pool. The results screen shows "Top X% all-time" by locating a
  // team's total in this curve. Regenerate if scoring or roster data changes.
  allTimeTotals: [227,260,265,268,271,273,274,276,277,279,280,281,282,283,284,285,286,287,288,289,290,290,291,292,293,294,294,295,296,296,297,298,299,299,300,301,301,302,303,303,304,304,305,306,306,307,308,308,309,310,310,311,312,312,313,314,314,315,316,317,317,318,319,319,320,321,322,322,323,324,325,326,327,327,328,329,330,331,332,333,334,335,336,338,339,340,342,343,345,346,348,350,352,354,357,360,364,369,375,386,503],

  // Regular-season record tiers — a 12-GAME season. Recalibrated 2026-06-11 for
  // Playoff mode: the team's total places it in this table to set a regular-season
  // record, then the 3 playoff games fill out the year (12-0 + win out = 15-0).
  // Thresholds are anchored to the percentile of ACTUAL random drafts (8 random
  // rooms), so the record reflects how your draft stacks up against the field:
  // ~top 25% reach 9-3 (the playoff gate, see playoffGate), the median lands ~6-6,
  // and a perfect 12-0 sits at ~top 1-2%. Total-only — offense and defense each get
  // their say in the actual playoff games, which punish an unbalanced roster.
  recordTiers: [
    { min: 380, offMin: 0, defMin: 0, roomMin: 0, record: '12-0', grade: 'S+', label: 'Perfect Season' },
    { min: 365, offMin: 0, defMin: 0, roomMin: 0, record: '11-1', grade: 'S',  label: 'Dynasty Level' },
    { min: 349, offMin: 0, defMin: 0, roomMin: 0, record: '10-2', grade: 'A+', label: 'Championship Contender' },
    { min: 331, offMin: 0, defMin: 0, roomMin: 0, record: '9-3',  grade: 'A',  label: 'Playoff Caliber' },
    { min: 319, offMin: 0, defMin: 0, roomMin: 0, record: '8-4',  grade: 'A-', label: 'Top 25 Team' },
    { min: 309, offMin: 0, defMin: 0, roomMin: 0, record: '7-5',  grade: 'B+', label: 'Bowl Team' },
    { min: 299, offMin: 0, defMin: 0, roomMin: 0, record: '6-6',  grade: 'B',  label: 'Middle of the Pack' },
    { min: 289, offMin: 0, defMin: 0, roomMin: 0, record: '5-7',  grade: 'B-', label: 'Missed a Bowl' },
    { min: 280, offMin: 0, defMin: 0, roomMin: 0, record: '4-8',  grade: 'C+', label: 'Rebuilding' },
    { min: 269, offMin: 0, defMin: 0, roomMin: 0, record: '3-9',  grade: 'C',  label: 'Tough Season' },
    { min: 262, offMin: 0, defMin: 0, roomMin: 0, record: '2-10', grade: 'C-', label: 'Rough Year' },
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
