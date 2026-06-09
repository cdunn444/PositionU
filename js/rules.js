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

  // Madden rating scales — recalibrated 2026-06-09 (rules v1.4 distribution).
  // Per-axis piecewise map (floor -> knee@typical-15-0 -> theoretical max):
  //   weak unit (~1st pct) -> 55 ; typical undefeated unit -> ~98 (undefeated avg ~95) ;
  //   dream team (best room at every slot) -> 100, and essentially nothing short of it
  //   reaches it. Offense and defense scored independently so the O/D split stays
  //   honest. Inlined in game.js showResults().
  maddenScales: {
    offense: { floor: 174, knee: 256, kneeRating: 98.4, max: 380, floorRating: 55, ceiling: 100 },
    defense: { floor:  93, knee: 165, kneeRating: 98.9, max: 250, floorRating: 55, ceiling: 100 }
  },

  // Record tier requirements — ALL conditions must be met for the tier
  // Recalibrated 2026-06-09 against scoring engine v1.3 + current player data (full 233-combo pool)
  // Target distribution: median 12-3, 15-0 ~5-6%, designed for 2 respins per session
  recordTiers: [
    { min: 403, offMin: 226, defMin: 139, roomMin: 0, record: '15-0', grade: 'S+', label: 'Undefeated Legend' },
    { min: 389, offMin: 222, defMin: 135, roomMin: 0, record: '14-1', grade: 'S',  label: 'Dynasty Level' },
    { min: 371, offMin: 213, defMin: 128, roomMin: 0, record: '13-2', grade: 'A+', label: 'Championship Contender' },
    { min: 342, offMin: 189, defMin: 105, roomMin: 0, record: '12-3', grade: 'A',  label: 'Elite Program' },
    { min: 330, offMin: 151, defMin:  77, roomMin: 0, record: '11-4', grade: 'A-', label: 'Top 10 Caliber' },
    { min: 320, offMin: 151, defMin:  77, roomMin: 0, record: '10-5', grade: 'B+', label: 'Bowl Winner' },
    { min: 310, offMin: 151, defMin:  77, roomMin: 0, record: '9-6',  grade: 'B',  label: 'Solid Program' },
    { min: 301, offMin: 151, defMin:  77, roomMin: 0, record: '8-7',  grade: 'B-', label: 'Bowl Eligible' },
    { min: 293, offMin: 151, defMin:  77, roomMin: 0, record: '7-8',  grade: 'C+', label: 'Rebuilding' },
    { min: 285, offMin: 151, defMin:  77, roomMin: 0, record: '6-9',  grade: 'C',  label: 'Tough Season' },
    { min: 276, offMin: 151, defMin:  77, roomMin: 0, record: '5-10', grade: 'C-', label: 'Rough Year' },
    { min: 0,   offMin: 0,   defMin: 0,   roomMin: 0, record: '4-11', grade: 'D',  label: 'Reset the Program' }
  ],

  // Position slot groupings
  offenseSlots: ['QB', 'RB', 'WR', 'TE', 'OL'],
  defenseSlots: ['DL', 'LB', 'DB']
});

if (typeof window !== 'undefined') window.RULES = RULES;
if (typeof module !== 'undefined') module.exports = RULES;
