// ══════════════════════════════════════════════════════════════
// POSITION U — SCORING ENGINE
// ══════════════════════════════════════════════════════════════
// Reads all constants from RULES (rules.js).
// Functions: toPG, calcBonuses, scoreOne, scoreRoom, mapScore
// ══════════════════════════════════════════════════════════════

function toPG(stats, games) {
  const g = games || 12, s = {};
  if (stats.passYds !== undefined)    s.passYdsPerGame    = stats.passYds   / g;
  if (stats.passTDs !== undefined)    s.passTDsPerGame    = stats.passTDs   / g;
  if (stats.intsSeason !== undefined) s.intsPerGame       = stats.intsSeason / g;
  if (stats.rushYds !== undefined)    s.rushYdsPerGame    = stats.rushYds   / g;
  if (stats.rushTDs !== undefined)    s.rushTDsPerGame    = stats.rushTDs   / g;
  if (stats.rec !== undefined)        s.recPerGame        = stats.rec       / g;
  if (stats.recYds !== undefined)     s.recYdsPerGame     = stats.recYds    / g;
  if (stats.recTDs !== undefined)     s.recTDsPerGame     = stats.recTDs    / g;
  if (stats.yac !== undefined)        s.yacPerGame        = stats.yac       / g;
  if (stats.sacks !== undefined)      s.sacksPerGame      = stats.sacks     / g;
  if (stats.tfls !== undefined)       s.tflsPerGame       = stats.tfls      / g;
  if (stats.hurries !== undefined)    s.hurriesPerGame    = stats.hurries   / g;
  if (stats.ff !== undefined)         s.ffPerGame         = stats.ff        / g;
  if (stats.tackles !== undefined)    s.tacklesPerGame    = stats.tackles   / g;
  if (stats.ints !== undefined)       s.intsDefPerGame    = stats.ints      / g;
  if (stats.pbus !== undefined)       s.pbusPerGame       = stats.pbus      / g;
  if (stats.qbr !== undefined)        s.qbr               = stats.qbr;
  if (stats.ypc !== undefined)        s.ypc               = stats.ypc;
  if (stats.dominanceGrade !== undefined) s.dominanceGrade = stats.dominanceGrade;
  if (stats.coverageGrade !== undefined)  s.coverageGrade  = stats.coverageGrade;
  return s;
}

function calcBonuses(b = {}) {
  let n = 0;
  if (b.heisman) n += 18;
  if (b.bednarik) n += 14;
  if (b.outland) n += 14;
  if (b.lombardiAward) n += 12;
  if (b.butkus) n += 12;
  if (b.doakWalker) n += 10;
  if (b.consensusAllAmerican) n += 12;
  else if (b.firstTeamAllAmerican) n += 8;
  if (b.nationalChampionship) n += 6;
  if (b.conferenceChampionship) n += 3;
  if (b.nflDraftPick !== undefined) {
    if (b.nflDraftPick <= 10)        n += 10;
    else if (b.nflDraftPick <= 32)   n += 7;
    else if (b.nflDraftPick <= 100)  n += 4;
    else if (b.nflDraftPick <= 200)  n += 2;
  }
  if (b.collegeDominance === 'allTime')      n += 14;
  else if (b.collegeDominance === 'eraDef')  n += 10;
  else if (b.collegeDominance === 'elite')   n += 6;
  else if (b.collegeDominance === 'veryGood') n += 4;
  return n;
}

function scoreOne(player, pos) {
  const pg = toPG(player.stats || {}, player.games || 12);
  let base = 0;
  switch (pos) {
    case 'QB':
      base = (pg.passYdsPerGame || 0) * 0.018 + (pg.passTDsPerGame || 0) * 4.5 -
             (pg.intsPerGame || 0) * 4 + (pg.qbr || 0) * 0.05;
      break;
    case 'RB':
      base = (pg.rushYdsPerGame || 0) * 0.03 + (pg.rushTDsPerGame || 0) * 6 +
             (pg.ypc || 0) * 1.8 + (pg.recYdsPerGame || 0) * 0.02;
      break;
    case 'WR':
      base = (pg.recYdsPerGame || 0) * 0.05 + (pg.recTDsPerGame || 0) * 6 +
             (pg.recPerGame || 0) * 0.8 + (pg.yacPerGame || 0) * 0.04;
      break;
    case 'TE':
      base = (pg.recYdsPerGame || 0) * 0.06 + (pg.recTDsPerGame || 0) * 6 +
             (pg.recPerGame || 0) * 0.6 + (pg.yacPerGame || 0) * 0.04;
      break;
    case 'OL': {
      // Team-unit entry — read its real protection/run-blocking stats.
      const s = player.stats || {};
      base = (s.pancakeBlocksSeason || 0) * 0.10 + (s.passBlockEff || 0) * 0.5 +
             (s.runBlockEff || 0) * 0.35 - (s.sacksAllowedSeason || 0) * 1.0;
      break;
    }
    case 'DL':
      base = (pg.sacksPerGame || 0) * 11 + (pg.tflsPerGame || 0) * 5 +
             (pg.hurriesPerGame || 0) * 2 + (pg.ffPerGame || 0) * 6;
      break;
    case 'LB':
      base = (pg.tacklesPerGame || 0) * 1.5 + (pg.sacksPerGame || 0) * 10 +
             (pg.intsDefPerGame || 0) * 12 + (pg.tflsPerGame || 0) * 6;
      break;
    case 'DB':
      base = (pg.intsDefPerGame || 0) * 18 + (pg.pbusPerGame || 0) * 4 +
             (pg.tacklesPerGame || 0) * 1.2 + (pg.ffPerGame || 0) * 8;
      break;
  }
  // Raw, uncapped per-player contribution (stat formula + résumé bonuses). The
  // common-scale clamp happens once per room, in remapBand below.
  return base + calcBonuses(player.bonuses);
}

// Map a room's raw score into its position's importance-weighted display band.
// See RULES.roomBands: lo->f, hi->c, linear, clamped (with a little headroom
// below the floor so the very weakest rooms still read distinctly low).
function remapBand(pos, raw) {
  const b = RULES.roomBands[pos];
  if (!b) return Math.round(raw);
  const slope = (b.c - b.f) / (b.hi - b.lo);
  const v = b.f + (raw - b.lo) * slope;
  return Math.max(b.f - 4, Math.min(b.c, Math.round(v)));
}

function scoreRoom(room) {
  const scores = room.players.map(p => ({ name: p.name, score: scoreOne(p, room.pos) }));
  const top3 = scores.sort((a, b) => b.score - a.score).slice(0, 3);
  const rawRoom = top3.reduce((s, p) => s + p.score, 0) / top3.length;
  const roomScore = remapBand(room.pos, rawRoom);
  return { roomScore, playerScores: scores, top3 };
}

function mapScore(total, offTotal, defTotal, roomScores) {
  const offFloor = offTotal || 0;
  const defFloor = defTotal || 0;
  const minRoom = roomScores ? Math.min(...Object.values(roomScores)) : 999;

  return RULES.recordTiers.find(x =>
    total >= x.min &&
    offFloor >= x.offMin &&
    defFloor >= x.defMin &&
    minRoom >= x.roomMin
  ) || RULES.recordTiers[RULES.recordTiers.length - 1];
}

if (typeof window !== 'undefined') {
  window.scoreOne = scoreOne;
  window.scoreRoom = scoreRoom;
  window.mapScore = mapScore;
}
