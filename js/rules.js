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

  // Madden rating linear scales — calibrated against full roster distribution
  maddenScales: {
    offense: { min: 315, range: 281, floor: 55, ceiling: 44 },
    defense: { min: 125, range: 190, floor: 50, ceiling: 49 }
  },

  // Record tier requirements — ALL conditions must be met for the tier
  // total = combined offense + defense raw score
  // offMin = minimum offense raw score
  // defMin = minimum defense raw score
  // roomMin = lowest single-room raw score required (depth check)
  recordTiers: [
    { min: 800, offMin: 440, defMin: 305, roomMin: 65, record: '15-0', grade: 'S+', label: 'Undefeated Legend' },
    { min: 740, offMin: 360, defMin: 265, roomMin: 0,  record: '14-1', grade: 'S',  label: 'Dynasty Level' },
    { min: 680, offMin: 330, defMin: 235, roomMin: 0,  record: '13-2', grade: 'A+', label: 'Championship Contender' },
    { min: 630, offMin: 300, defMin: 210, roomMin: 0,  record: '12-3', grade: 'A',  label: 'Elite Program' },
    { min: 580, offMin: 270, defMin: 185, roomMin: 0,  record: '11-4', grade: 'A-', label: 'Top 10 Caliber' },
    { min: 530, offMin: 240, defMin: 160, roomMin: 0,  record: '10-5', grade: 'B+', label: 'Bowl Winner' },
    { min: 480, offMin: 210, defMin: 135, roomMin: 0,  record: '9-6',  grade: 'B',  label: 'Solid Program' },
    { min: 430, offMin: 180, defMin: 110, roomMin: 0,  record: '8-7',  grade: 'B-', label: 'Bowl Eligible' },
    { min: 380, offMin: 150, defMin: 90,  roomMin: 0,  record: '7-8',  grade: 'C+', label: 'Rebuilding' },
    { min: 330, offMin: 120, defMin: 70,  roomMin: 0,  record: '6-9',  grade: 'C',  label: 'Tough Season' },
    { min: 280, offMin: 90,  defMin: 50,  roomMin: 0,  record: '5-10', grade: 'C-', label: 'Rough Year' },
    { min: 0,   offMin: 0,   defMin: 0,   roomMin: 0,  record: '4-11', grade: 'D',  label: 'Reset the Program' }
  ],

  // Position slot groupings
  offenseSlots: ['QB', 'RB', 'WR', 'TE', 'OL'],
  defenseSlots: ['DL', 'LB', 'DB']
});

if (typeof window !== 'undefined') window.RULES = RULES;
if (typeof module !== 'undefined') module.exports = RULES;
