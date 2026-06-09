// ══════════════════════════════════════════════════════════════
// POSITION U — GAME RULES (LOCKED)
// ══════════════════════════════════════════════════════════════
// Source of truth for all difficulty and scoring constants.
// Changes here directly affect gameplay difficulty.
// See git history for prior rules versions.
// ══════════════════════════════════════════════════════════════

const RULES = Object.freeze({
  version: "1.3",
  lastUpdated: "2026-06-08",

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

  // Madden rating linear scales — recalibrated 2026-06-09 against scoring engine v1.3
  // Formula: rating = floor + (raw - min) / range * 40   (clamp 45-99)
  // Note: formula is currently inlined in game.js renderResults() — these values document it
  maddenScales: {
    offense: { min: 172, range: 107, floor: 55, ceiling: 99 },
    defense: { min: 98,  range: 102, floor: 55, ceiling: 99 }
  },

  // Record tier requirements — ALL conditions must be met for the tier
  // Calibrated 2026-06-09 against scoring engine v1.3 + current player data
  // Target distribution: 15-0 ~5%, median ~11-4, designed for 2 respins per session
  recordTiers: [
    { min: 414, offMin: 209, defMin: 131, roomMin: 0, record: '15-0', grade: 'S+', label: 'Undefeated Legend' },
    { min: 397, offMin: 203, defMin: 125, roomMin: 0, record: '14-1', grade: 'S',  label: 'Dynasty Level' },
    { min: 383, offMin: 198, defMin: 121, roomMin: 0, record: '13-2', grade: 'A+', label: 'Championship Contender' },
    { min: 370, offMin: 194, defMin: 118, roomMin: 0, record: '12-3', grade: 'A',  label: 'Elite Program' },
    { min: 357, offMin: 191, defMin: 115, roomMin: 0, record: '11-4', grade: 'A-', label: 'Top 10 Caliber' },
    { min: 346, offMin: 187, defMin: 112, roomMin: 0, record: '10-5', grade: 'B+', label: 'Bowl Winner' },
    { min: 336, offMin: 185, defMin: 109, roomMin: 0, record: '9-6',  grade: 'B',  label: 'Solid Program' },
    { min: 325, offMin: 182, defMin: 107, roomMin: 0, record: '8-7',  grade: 'B-', label: 'Bowl Eligible' },
    { min: 313, offMin: 180, defMin: 104, roomMin: 0, record: '7-8',  grade: 'C+', label: 'Rebuilding' },
    { min: 301, offMin: 178, defMin: 103, roomMin: 0, record: '6-9',  grade: 'C',  label: 'Tough Season' },
    { min: 288, offMin: 177, defMin: 102, roomMin: 0, record: '5-10', grade: 'C-', label: 'Rough Year' },
    { min: 0,   offMin: 0,   defMin: 0,   roomMin: 0, record: '4-11', grade: 'D',  label: 'Reset the Program' }
  ],

  // Position slot groupings
  offenseSlots: ['QB', 'RB', 'WR', 'TE', 'OL'],
  defenseSlots: ['DL', 'LB', 'DB']
});

if (typeof window !== 'undefined') window.RULES = RULES;
if (typeof module !== 'undefined') module.exports = RULES;
