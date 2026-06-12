// ══════════════════════════════════════════════════════════════
// POSITION U — GAME LOGIC
// ══════════════════════════════════════════════════════════════
// All UI rendering, screen management, spin/respin, results.
// Requires: rules.js, scoring.js, data-loader.js (must load first)
// ══════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────────
// STAT DISPLAY HELPERS
// ──────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
const DISPLAY_STATS = {
  QB: [
    { key:'passYds',   label:'PASS YDS', fmt: v => v.toLocaleString() },
    { key:'passTDs',   label:'TDs',      fmt: v => v },
    { key:'intsSeason',label:'INTs',     fmt: v => v },
    { key:'qbr',       label:'QBR',      fmt: v => v },
  ],
  RB: [
    { key:'rushYds',  label:'RUSH YDS', fmt: v => v.toLocaleString() },
    { key:'rushTDs',  label:'TDs',      fmt: v => v },
    { key:'ypc',      label:'YPC',      fmt: v => v.toFixed(1) },
    { key:'recYds',   label:'REC YDS',  fmt: v => v.toLocaleString() },
  ],
  WR: [
    { key:'recYds',  label:'REC YDS', fmt: v => v.toLocaleString() },
    { key:'recTDs',  label:'TDs',     fmt: v => v },
    { key:'rec',     label:'REC',     fmt: v => v },
    { key:'yac',     label:'YAC',     fmt: v => v.toLocaleString() },
  ],
  TE: [
    { key:'recYds',  label:'REC YDS', fmt: v => v.toLocaleString() },
    { key:'recTDs',  label:'TDs',     fmt: v => v },
    { key:'rec',     label:'REC',     fmt: v => v },
    { key:'yac',     label:'YAC',     fmt: v => v.toLocaleString() },
  ],
  OL: [
    { key:'sacksAllowedSeason',  label:'SACKS ALW', fmt: v => v },
    { key:'pancakeBlocksSeason', label:'PANCAKES',  fmt: v => v },
    { key:'passBlockEff',        label:'PBE%',      fmt: v => v+'%' },
    { key:'runBlockEff',         label:'RBE%',      fmt: v => v+'%' },
  ],
  DL: [
    { key:'sacks',   label:'SACKS',   fmt: v => v },
    { key:'tfls',    label:'TFLs',    fmt: v => v },
    { key:'hurries', label:'HURRIES', fmt: v => v },
    { key:'ff',      label:'FF',      fmt: v => v },
  ],
  LB: [
    { key:'tackles', label:'TACKLES', fmt: v => v },
    { key:'sacks',   label:'SACKS',   fmt: v => v },
    { key:'ints',    label:'INTs',    fmt: v => v },
    { key:'tfls',    label:'TFLs',    fmt: v => v },
  ],
  DB: [
    { key:'ints',    label:'INTs',    fmt: v => v },
    { key:'pbus',    label:'PBUs',    fmt: v => v },
    { key:'tackles', label:'TACKLES', fmt: v => v },
    { key:'ff',      label:'FF',      fmt: v => v },
  ],
};

// ──────────────────────────────────────────────────────────────
// GAME STATE
// ──────────────────────────────────────────────────────────────
const OFFENSE_SLOTS = RULES.offenseSlots;
const DEFENSE_SLOTS = RULES.defenseSlots;
const ALL_SLOTS = [...OFFENSE_SLOTS, ...DEFENSE_SLOTS];

let state = {
  round: 0,
  respinsUsed: 0,
  currentSchoolEra: null,
  selectedPos: null,
  picks: {},
  phase: 'spin'
};

function currentPos() {
  return ALL_SLOTS[state.round] || null;
}

function getRemainingSlots() {
  return ALL_SLOTS.filter(s => !state.picks[s]);
}

// ──────────────────────────────────────────────────────────────
// INIT & RENDER
// ──────────────────────────────────────────────────────────────
function init() {
  state = {
    round: 0, respinsUsed: 0,
    currentSchoolEra: null, selectedPos: null, picks: {}, phase: 'spin',
  };
  renderDock();
  showSpinScreen();
  updateHeader();
}

function updateHeader() {
  const pos = currentPos();
  // Round is purely selection-based: filled picks + 1, capped at 8. Respins
  // never touch state.picks, so they can't advance this counter.
  const filled = Object.keys(state.picks).length;
  document.getElementById('roundLabel').textContent = `Round ${Math.min(filled + 1, 8)} of 8`;
// phase badge removed
}

function renderDock() {
  const off = document.getElementById('offenseDock');
  const def = document.getElementById('defenseDock');
  off.innerHTML = '';
  def.innerHTML = '';

  // On the room screen, the slot matching the selected room lights up and becomes
  // the tap-target that locks the room in (replacing the old confirm button).
  const inRoom = state.phase === 'room';
  const build = (pos, filledClass) => {
    const pick = state.picks[pos];
    const slot = document.createElement('div');
    slot.className = 'dock-slot' + (filledClass === 'defense-filled' ? ' def-slot' : '');
    slot.dataset.pos = pos;
    const circle = document.createElement('div');
    circle.className = 'dock-circle' + (pick ? ' ' + filledClass : '') + (pick && pos === state.lastPicked ? ' just-filled' : '');
    circle.textContent = pick ? abbrev(pick.room.school) : pos;
    const label = document.createElement('div');
    label.className = 'dock-label' + (pick ? ' filled-label' : '');
    label.textContent = pos;
    slot.appendChild(circle);
    slot.appendChild(label);
    if (inRoom && !pick && pos === state.selectedPos) {
      slot.classList.add('armed');
      slot.onclick = () => confirmPick();
    }
    return slot;
  };

  OFFENSE_SLOTS.forEach(pos => off.appendChild(build(pos, 'offense-filled')));
  DEFENSE_SLOTS.forEach(pos => def.appendChild(build(pos, 'defense-filled')));
}

// ──────────────────────────────────────────────────────────────
// SPIN LOGIC
// ──────────────────────────────────────────────────────────────
let spinInterval = null;
const SCHOOL_ABBREVS = {
  'Alabama':        'ALA',
  'Arkansas':       'ARK',
  'Auburn':         'AUB',
  'Baylor':         'BAY',
  'Clemson':        'CLEM',
  'Colorado':       'COLO',
  'Florida':        'UF',
  'Florida State':  'FSU',
  'Georgia':        'UGA',
  'Georgia Tech':   'GT',
  'Iowa':           'IOWA',
  'Kansas State':   'KSU',
  'LSU':            'LSU',
  'Miami':          'UM',
  'Michigan':       'MICH',
  'Michigan State': 'MSU',
  'Nebraska':       'NEB',
  'Notre Dame':     'ND',
  'Ohio State':     'OSU',
  'Oklahoma':       'OU',
  'Oklahoma State': 'OKST',
  'Ole Miss':       'MISS',
  'Oregon':         'ORE',
  'Penn State':     'PSU',
  'Pittsburgh':     'PITT',
  'South Carolina': 'SC',
  'Stanford':       'STAN',
  'Syracuse':       'SYR',
  'TCU':            'TCU',
  'Tennessee':      'TENN',
  'Texas':          'TEX',
  'Texas A&M':      'TAMU',
  'Texas Tech':     'TTU',
  'UCLA':           'UCLA',
  'USC':            'USC',
  'Utah':           'UTAH',
  'Virginia Tech':  'VT',
  'Washington':     'WASH',
  'West Virginia':  'WVU',
  'Wisconsin':      'WISC',
}

function abbrev(school) {
  return SCHOOL_ABBREVS[school] || school.substring(0,3).toUpperCase();
}

function randomKey() {
  return SPIN_POOL[Math.floor(Math.random() * SPIN_POOL.length)];
}

function parseKey(key) {
  const parts = key.split(' ');
  const era = parts[parts.length - 1];
  const school = parts.slice(0, -1).join(' ');
  return { school, era };
}

// Force the page back to the very top across every scroll root — window,
// scrollingElement, documentElement and body — so no browser quirk leaves the
// view scrolled mid-page when screens swap.
function resetScroll() {
  window.scrollTo(0, 0);
  if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
}

function showSpinScreen() {
  document.getElementById('spinScreen').classList.remove('hidden');
  document.getElementById('roomScreen').classList.add('hidden');
  document.getElementById('resultsScreen').classList.add('hidden');

  // Reset scroll to the top. Done after the screen toggle, and re-fired on the
  // next frame and the next tick, because mobile browsers (iOS Safari) can
  // restore the prior scroll position after the reflow from swapping the tall
  // room screen for the short spin screen. Hit every scroll root to be safe.
  resetScroll();
  requestAnimationFrame(resetScroll);
  setTimeout(resetScroll, 0);

  // Reset cards
  document.getElementById('teamCard').className = 'spin-card team-card';
  document.getElementById('eraCard').className = 'spin-card era-card';
  document.getElementById('teamValue').textContent = '–';
  document.getElementById('eraValue').textContent = '–';
  document.getElementById('spinStatus').textContent = '';

  // Always reset spin button to its default action
  const btn = document.getElementById('spinBtn');
  btn.disabled = false;
  btn.textContent = 'SPIN';
  btn.onclick = doSpin;

  state.currentSchoolEra = null;
  state.phase = 'spin';
}

function updateRespinBtns() {
  const btn = document.getElementById('respinBtn');
  if (!btn) return;
  const remaining = 2 - state.respinsUsed;
  const label = btn.querySelector('.respin-label');
  if (state.respinsUsed >= 2) {
    btn.className = 'respin-btn used';
    btn.disabled = true;
  } else {
    btn.className = 'respin-btn available';
    btn.disabled = false;
  }
  // Update label to show count. Wrap the text in .respin-label so it picks up
  // the brand gold styling (a bare text node would fall back to the default).
  btn.innerHTML = `<span class="respin-icon">↺</span><span class="respin-label">Respin (${remaining})</span>`;
}

function doSpin() {
  // Guard against firing during animation or after result lands
  if (state.phase !== 'spin') return;
  if (state.currentSchoolEra) return;

  document.getElementById('spinBtn').disabled = true;
  document.getElementById('spinStatus').textContent = 'SPINNING...';

  const teamCard = document.getElementById('teamCard');
  const eraCard  = document.getElementById('eraCard');
  teamCard.classList.add('spinning');
  eraCard.classList.add('spinning');

  let ticks = 0;
  const maxTicks = 18;
  let finalKey = randomKey();

  spinInterval = setInterval(() => {
    const k = randomKey();
    const { school, era } = parseKey(k);
    document.getElementById('teamValue').textContent = abbrev(school);
    document.getElementById('eraValue').textContent  = era;
    ticks++;

    if (ticks >= maxTicks) {
      clearInterval(spinInterval);
      teamCard.classList.remove('spinning');
      eraCard.classList.remove('spinning');

      // Make sure final key has data
      while (!GAME_DATA[finalKey]) finalKey = randomKey();
      const f = parseKey(finalKey);
      document.getElementById('teamValue').textContent = abbrev(f.school);
      document.getElementById('eraValue').textContent  = f.era;

      state.currentSchoolEra = finalKey;
      document.getElementById('spinStatus').textContent = '';
      document.getElementById('spinBtn').disabled = true;
      document.getElementById('spinBtn').textContent = 'SPIN';
      // Auto-navigate after 2 seconds
      setTimeout(() => {
        if (state.phase === 'spin' && state.currentSchoolEra) goToRoom();
      }, 2000);
    }
  }, 80);
}

function doRespin() {
  if (!state.currentSchoolEra) return;
  if (state.respinsUsed >= 2) return;
  const curKey = state.currentSchoolEra;

  state.respinsUsed++;
  showSpinScreen();

  document.getElementById('teamCard').className = 'spin-card team-card spinning';
  document.getElementById('eraCard').className  = 'spin-card era-card spinning';
  document.getElementById('spinStatus').textContent = 'RESPINNING...';
  document.getElementById('spinBtn').disabled = true;
  updateRespinBtns();

  let ticks = 0;
  spinInterval = setInterval(() => {
    const rk = randomKey();
    const f = parseKey(rk);
    document.getElementById('teamValue').textContent = abbrev(f.school);
    document.getElementById('eraValue').textContent  = f.era;
    ticks++;
    if (ticks >= 22) {
      clearInterval(spinInterval);
      // Pick any valid combo other than the current one
      const pool = SPIN_POOL.filter(k => k !== curKey && GAME_DATA[k]);
      const newKey = pool[Math.floor(Math.random() * pool.length)];
      const f2 = parseKey(newKey);
      document.getElementById('teamCard').className = 'spin-card team-card';
      document.getElementById('eraCard').className  = 'spin-card era-card';
      document.getElementById('teamValue').textContent = abbrev(f2.school);
      document.getElementById('eraValue').textContent  = f2.era;
      state.currentSchoolEra = newKey;
      state.phase = 'spin';
      document.getElementById('spinStatus').textContent = '';
      setTimeout(() => { if (state.currentSchoolEra) goToRoom(); }, 1800);
    }
  }, 70);
}

// ──────────────────────────────────────────────────────────────
// ROOM SCREEN
// ──────────────────────────────────────────────────────────────
function goToRoom() {
  if (!state.currentSchoolEra) return;
  const key = state.currentSchoolEra;
  const { school, era } = parseKey(key);
  const data = GAME_DATA[key];

  document.getElementById('spinScreen').classList.add('hidden');
  document.getElementById('roomScreen').classList.remove('hidden');
  state.phase = 'room';

  document.getElementById('roomSchoolPill').textContent = school;
  document.getElementById('roomEraPill').textContent = era;
  updateRespinBtns();

  const available = ALL_SLOTS.filter(p => !state.picks[p] && data[p]);
  const alreadyFilled = ALL_SLOTS.filter(p => state.picks[p]);

  // Auto-arm the first available room; its slot lights up in the dock below.
  state.selectedPos = available[0] || null;
  renderAllCards(data, available, alreadyFilled);
  renderDock();
}

function renderAllCards(data, available, alreadyFilled) {
  const allPositions = [...available, ...alreadyFilled];
  let html = '';

  allPositions.forEach(pos => {
    const room = data[pos];
    if (!room) return;
    const isFilled = !!state.picks[pos];
    const isSelected = state.selectedPos === pos;
    const stats = DISPLAY_STATS[pos] || [];

    html += `<div class="pos-card${isSelected ? ' selected' : ''}${isFilled ? ' filled-card' : ''}"
      id="poscard-${pos}"
      onclick="${isFilled ? '' : `selectCard('${pos}')`}">`;

    // Card header
    html += `<div class="pos-card-header">
      <div class="pos-card-title">${pos}</div>
      <div class="pos-card-check">${isSelected ? '✓' : ''}</div>
    </div>`;

    // Stat column headers
    if (stats.length) {
      html += `<div class="stat-header-row">
        <div class="stat-header-name">Player</div>`;
      stats.forEach(s => {
        html += `<div class="stat-header-col">${s.label}</div>`;
      });
      html += `</div>`;
    }

    // Player rows
    room.players.forEach(player => {
      html += `<div class="player-row">
        <div class="player-info">
          <div class="player-name">${player.name}</div>
        </div>
        <div class="stat-cols">`;
      stats.forEach(s => {
        const raw = player.stats[s.key];
        const val = raw !== undefined ? s.fmt(raw) : '—';
        html += `<div class="stat-col">
          <div class="stat-val">${val}</div>
        </div>`;
      });
      html += `</div></div>`;
    });

    html += `</div>`; // end pos-card
  });

  document.getElementById('roomList').innerHTML = html;
}

function selectCard(pos) {
  if (state.locking) return;
  state.selectedPos = pos;

  // Update card selection state
  document.querySelectorAll('.pos-card').forEach(card => {
    const cardPos = card.id.replace('poscard-', '');
    card.classList.toggle('selected', cardPos === pos);
    const check = card.querySelector('.pos-card-check');
    if (check) check.textContent = cardPos === pos ? '✓' : '';
  });

  // Move the lit-up "lock in" slot in the dock to this position.
  renderDock();
}

// ──────────────────────────────────────────────────────────────
// CONFIRM PICK
// ──────────────────────────────────────────────────────────────
function confirmPick() {
  document.getElementById('spinIntro').style.display = 'none';
  const pos = state.selectedPos;
  if (!pos || !state.currentSchoolEra || state.locking) return;

  const key = state.currentSchoolEra;
  const data = GAME_DATA[key];
  const room = data[pos];
  if (!room) return;

  const scored = scoreRoom(room);
  state.picks[pos] = { room, roomScore: scored.roomScore, playerScores: scored.playerScores };
  state.selectedPos = null;
  state.locking = true;

  // Land the pick: the dock slot fills in (selected state) with a pop, then we
  // move on so the outline -> filled transition is actually visible.
  state.lastPicked = pos;
  renderDock();
  state.lastPicked = null;
  updateHeader();

  setTimeout(() => {
    state.locking = false;
    state.round++;
    state.currentSchoolEra = null;
    renderDock(); // settle the solid flash to the normal pick tint before moving on
    if (Object.keys(state.picks).length === 8) showResults();
    else showSpinScreen();
  }, 520);
}

// ──────────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────────
function showResults() {
  document.getElementById('spinScreen').classList.add('hidden');
  document.getElementById('roomScreen').classList.add('hidden');
  document.getElementById('resultsScreen').classList.remove('hidden');
  document.getElementById('persistentDock').style.display = 'none';

  let total = 0, offTotal = 0, defTotal = 0;
  OFFENSE_SLOTS.forEach(pos => {
    const s = state.picks[pos]?.roomScore || 0;
    offTotal += s; total += s;
  });
  DEFENSE_SLOTS.forEach(pos => {
    const s = state.picks[pos]?.roomScore || 0;
    defTotal += s; total += s;
  });

  // Madden-style ratings — the knee sits at the (former 15-0) thresholds
  // (offense raw 244, defense 146) and reads 95, so an elite team presents as
  // ~95/95. The dream team reads 100; a typical team ~78-82.
  const maddenRating = (raw, lo, knee, kneeR, max) => {
    const v = raw <= knee
      ? 55 + (raw - lo) / (knee - lo) * (kneeR - 55)
      : kneeR + (raw - knee) / (max - knee) * (100 - kneeR);
    return Math.min(100, Math.max(40, Math.round(v)));
  };
  const offRating = maddenRating(offTotal, 136, 244, 95, 375);
  const defRating = maddenRating(defTotal,  64, 146, 95, 263);
  document.getElementById('offScore').textContent = offRating;
  document.getElementById('defScore').textContent = defRating;

  // Regular-season record (12 games). The team's strength sets where you sit in
  // the tier table; the 3 playoff games fill out the rest of the season. Tier 0
  // (elite) = 12-0 down to the bottom tier = 1-11. Going on to win all three
  // playoff games turns a 12-0 regular season into a 15-0 national title.
  let tierIdx = RULES.recordTiers.findIndex(t => total >= t.min && offTotal >= t.offMin && defTotal >= t.defMin);
  if (tierIdx < 0) tierIdx = RULES.recordTiers.length - 1;
  const regWins = 12 - tierIdx;
  const regLosses = tierIdx;

  // All-time rank (saved for the end screen): locate the total in the percentile
  // curve and turn it into an ordinal out of a 10,000-team field (e.g. "167th").
  const bp = RULES.allTimeTotals;
  let allTime = '';
  if (bp) {
    let p = 0;
    while (p < 100 && bp[p + 1] !== undefined && bp[p + 1] <= total) p++;
    let pctf = p;
    if (p < 100 && bp[p + 1] > bp[p]) pctf = p + (total - bp[p]) / (bp[p + 1] - bp[p]);
    pctf = Math.min(100, Math.max(0, pctf));
    const rank = Math.max(1, Math.round((1 - pctf / 100) * 10000));
    const tens = rank % 100;
    const ord = (tens >= 11 && tens <= 13) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[rank % 10] || 'th');
    allTime = `${rank.toLocaleString()}${ord}`;
  }

  // Did the team earn a playoff berth? (regular-season wins vs the gate)
  const qualified = regWins >= (RULES.playoffGate || 9);

  // Stash the finished team so Playoff mode can field it and tally the record.
  state.team = { offRating, defRating, offTotal, defTotal, total, regWins, regLosses, allTime, qualified };

  // Two-column header: regular-season record (left) + OFF/DEF (right), with the
  // playoff-qualification badge directly under the record. Qualifiers get the
  // Enter-the-Playoffs button; everyone else's season is over here.
  document.getElementById('finalRecord').textContent = `${regWins}-${regLosses}`;
  const statusEl = document.getElementById('playoffStatus');
  const ctaEl = document.getElementById('playoffCta');
  const tryAgain = document.getElementById('tryAgainBtn');
  if (qualified) {
    // Made it: Enter-the-Playoffs is the gold primary, Try Again stays secondary.
    statusEl.innerHTML = `<div class="ps-badge in">Playoff Bound</div>`;
    if (ctaEl) ctaEl.style.display = '';
    if (tryAgain) tryAgain.className = 'cta-btn cta-share';
  } else {
    // Missed: season's over, so Try Again becomes the gold primary action.
    statusEl.innerHTML = `<div class="ps-badge out">Missed the Playoff</div>`;
    if (ctaEl) ctaEl.style.display = 'none';
    if (tryAgain) tryAgain.className = 'cta-btn cta-playoffs';
  }

  document.getElementById('resultRows').innerHTML = buildRosterRows();
}

// A calling-card subhead for the player's team, mirroring the opponents' notes —
// derived from the team's offense/defense profile.
function teamSubhead(off, def) {
  if (off >= 93 && def >= 93) return 'Elite on both sides of the ball';
  if (off - def >= 6) return 'An explosive, high-octane offense';
  if (def - off >= 6) return 'Anchored by a smothering defense';
  if (off >= 88 && def >= 88) return 'A balanced, complete contender';
  if (off >= 88) return 'Powered by a potent offense';
  if (def >= 88) return 'Built on a stingy defense';
  return 'A gritty bunch of all-stars';
}

// Build the 8-room roster card (shared by the results page and the playoff end
// card). Surnames only; team-unit OL entries keep their leading year.
function buildRosterRows() {
  const lastName = (name) => {
    const parts = name.trim().split(/\s+/);
    if (/OL$/.test(name)) return parts[0];
    const suffixes = new Set(['Jr.', 'Sr.', 'Jr', 'Sr', 'II', 'III', 'IV', 'V']);
    let i = parts.length - 1;
    while (i > 0 && suffixes.has(parts[i])) i--;
    return parts[i];
  };
  let rowsHtml = '';
  ALL_SLOTS.forEach(pos => {
    const pick = state.picks[pos];
    if (!pick) return;
    const isOff = OFFENSE_SLOTS.includes(pos);
    const topNames = pick.playerScores.slice(0, 3).map(p => lastName(p.name)).join(' · ');
    rowsHtml += `
      <div class="result-row ${isOff ? 'offense-row' : 'defense-row'}">
        <div class="pos-avatar ${isOff ? 'offense-pos' : 'defense-pos'}">${pos}</div>
        <div class="result-info">
          <div class="result-school">${pick.room.school}</div>
          <div class="result-meta">${pick.room.era} &nbsp;·&nbsp; ${topNames}</div>
        </div>
      </div>`;
  });
  return rowsHtml;
}

function resetGame() {
  document.getElementById('persistentDock').style.display = '';
  document.getElementById('resultsScreen').classList.add('hidden');
  document.getElementById('playoffScreen').classList.add('hidden');
  init();
}

// ──────────────────────────────────────────────────────────────
// PLAYOFF MODE
// ──────────────────────────────────────────────────────────────
const PLAYOFF_ROUNDS = ['Quarterfinal', 'Semifinal', 'National Championship'];

function startPlayoffs() {
  if (!state.team) return;
  // Set the bracket up front — one opponent per round, escalating in tier.
  const opps = [];
  opps.push(pickOpponent(1, opps));
  opps.push(pickOpponent(2, opps));
  opps.push(pickOpponent(3, opps));
  state.playoff = { round: 0, opponents: opps, results: [], phase: 'matchup', done: null };

  document.getElementById('resultsScreen').classList.add('hidden');
  document.getElementById('playoffScreen').classList.remove('hidden');
  document.getElementById('roundLabel').textContent = 'PLAYOFFS';
  resetScroll();
  renderPlayoff();
}

function renderPlayoff() {
  const pf = state.playoff;
  const el = document.getElementById('playoffScreen');
  const you = state.team;

  // Terminal states: one shareable results card — final record + a single result
  // one-liner under it, OFF/DEF, all-time rank, and the full roster.
  function endCard(record, tag, cls, recCls) {
    return `
      <div class="results-header-row end-card">
        <div class="results-record-col">
          <div class="record-num ${recCls}">${record}</div>
          <div class="playoff-status"><div class="ps-badge ${cls}">${tag}</div></div>
        </div>
        <div class="ratings-stack">
          <div class="rating-line offense"><span class="rating-label">OFF</span><span class="rating-val">${you.offRating}</span></div>
          <div class="rating-line defense"><span class="rating-label">DEF</span><span class="rating-val">${you.defRating}</span></div>
        </div>
      </div>
      <div class="pf-end-alltime">This team ranks <span class="pct">${you.allTime}</span> all-time</div>
      <div id="resultRows" style="padding:10px 16px;display:flex;flex-direction:column;gap:5px;">${buildRosterRows()}</div>
      <div class="cta-row">
        <button class="cta-btn cta-share" onclick="alert('Share coming soon!')">Share</button>
        <button class="cta-btn cta-share" onclick="resetGame()">Play Again</button>
      </div>`;
  }
  if (pf.done === 'champion') {
    const finalRec = `${you.regWins + 3}-${you.regLosses}`;
    el.innerHTML = endCard(finalRec, '🏆 National Champions', 'in', 'champ');
    resetScroll();
    return;
  }
  if (pf.done === 'eliminated') {
    const lostAt = PLAYOFF_ROUNDS[pf.results.length - 1];
    const playoffWins = pf.results.filter(g => g.win).length;
    const finalRec = `${you.regWins + playoffWins}-${you.regLosses + 1}`;
    const oneLiner = lostAt === 'National Championship' ? 'Lost in the Championship' : `Lost in the ${lostAt}`;
    el.innerHTML = endCard(finalRec, oneLiner, 'out', 'elim');
    resetScroll();
    return;
  }

  // Active round — a progressively-built stack: Your Team on top (ratings top-right),
  // then each opponent faced so far. Past opponents dim to 50% with a compact result;
  // the current opponent animates in and the game plays out below it.
  const r = pf.round;
  const opp = pf.opponents[r];
  const res = pf.results[r];
  const SHORT = ['Quarterfinal', 'Semifinal', 'Championship'];

  let currentGame;
  if ((pf.phase === 'playing' || pf.phase === 'result') && res) {
    currentGame = scoreboard() + (pf.phase === 'result'
      ? `<button class="cta-btn cta-playoffs pf-advance" onclick="advancePlayoff()">${nextLabel()}</button>`
      : '');
  } else {
    currentGame = `<button class="cta-btn cta-playoffs pf-advance" onclick="simulateRound()">Simulate Game</button>`;
  }

  let stack = `
    <div class="pf-yourteam">
      <div class="pf-yt-name">Your Team</div>
      <div class="pf-yt-ratings"><span class="pf-rt off">OFF ${you.offRating}</span><span class="pf-rt def">DEF ${you.defRating}</span></div>
    </div>`;
  for (let i = 0; i <= r; i++) {
    const o = pf.opponents[i];
    const cur = i === r;
    const g = pf.results[i];
    const enter = cur && r > 0 && pf.phase === 'matchup' ? ' enter' : '';
    stack += `
      <div class="pf-opp${cur ? '' : ' dim'}${enter}">
        <div class="pf-opp-head">
          <div class="pf-opp-info">
            <div class="pf-opp-round">${SHORT[i]}</div>
            <div class="pf-opp-name">${o.year} ${o.school}</div>
            ${cur ? `<div class="pf-opp-note">${o.note}</div>` : ''}
          </div>
          ${cur
            ? `<div class="pf-opp-ratings"><span class="pf-rt off">OFF ${o.off}</span><span class="pf-rt def">DEF ${o.def}</span></div>`
            : `<div class="pf-opp-final ${g.win ? 'w' : 'l'}">${g.win ? 'WON' : 'LOST'} ${g.yourPts}–${g.oppPts}</div>`}
        </div>
      </div>`;
    if (cur) stack += `<div class="pf-current">${currentGame}</div>`;
  }
  el.innerHTML = `<div class="pf-stack">${stack}</div>`;

  if (pf.phase === 'matchup') {
    if (r === 0) resetScroll();
    else { const c = el.querySelector('.pf-opp.enter'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }

  function scoreboard() {
    const rev = pf.revealQ || 0;                 // quarters revealed so far (0..4)
    const cum = arr => arr.slice(0, rev).reduce((a, b) => a + b, 0);
    const yF = rev >= 4 ? res.yourPts : cum(res.yourQ);
    const oF = rev >= 4 ? res.oppPts  : cum(res.oppQ);
    const status = rev === 0 ? 'KICKOFF' : rev >= 4 ? 'FINAL' : rev === 2 ? 'HALFTIME' : `END OF Q${rev}`;
    const cells = arr => [0, 1, 2, 3].map(q =>
      `<div class="pf-sb-q${q < rev ? ' shown' : ''}">${q < rev ? arr[q] : '·'}</div>`).join('');
    // `leads` = this row is ahead (or the winner at FINAL). The leader's total is
    // gold (both cream otherwise); at FINAL the winner's row gets the WIN badge.
    const win = pf.phase === 'result';
    const row = (cls, name, arr, f, leads) =>
      `<div class="pf-sb-row ${cls}">` +
        `<div class="pf-sb-team">${name}${win && leads ? '<span class="pf-sb-win">WIN</span>' : ''}</div>` +
        `${cells(arr)}<div class="pf-sb-f${leads ? ' lead' : ''}">${f}</div>` +
      `</div>`;
    return `
      <div class="pf-sb-status">${status}</div>
      <div class="pf-scoreboard">
        <div class="pf-sb-row pf-sb-head"><div class="pf-sb-team"></div><div>1</div><div>2</div><div>3</div><div>4</div><div class="pf-sb-f">T</div></div>
        ${row('you', 'Your Team', res.yourQ, yF, rev >= 1 && yF >= oF)}
        ${row('opp', opp.school, res.oppQ, oF, rev >= 1 && oF > yF)}
      </div>`;
  }
  function nextLabel() { return res.win ? (r < 2 ? 'Advance →' : 'See Result') : 'See Result'; }
}

function simulateRound() {
  const pf = state.playoff;
  if (pf.phase !== 'matchup') return;
  const you = state.team;
  const opp = pf.opponents[pf.round];
  pf.results[pf.round] = simGame(you.offRating, you.defRating, opp.off, opp.def);
  // Reveal the game a quarter at a time — KICKOFF, then Q1…Q4 — for the drama.
  pf.phase = 'playing';
  pf.revealQ = 0;
  renderPlayoff();
  if (pf._timer) clearInterval(pf._timer);
  pf._timer = setInterval(() => {
    pf.revealQ++;
    if (pf.revealQ >= 4) { clearInterval(pf._timer); pf._timer = null; pf.revealQ = 4; pf.phase = 'result'; }
    renderPlayoff();
  }, 700);
}

function advancePlayoff() {
  const pf = state.playoff;
  const res = pf.results[pf.round];
  if (!res) return;
  if (!res.win) { pf.done = 'eliminated'; renderPlayoff(); return; }
  if (pf.round >= 2) { pf.done = 'champion'; renderPlayoff(); return; }
  pf.round++;
  pf.phase = 'matchup';
  renderPlayoff();
}



// ──────────────────────────────────────────────────────────────
// BOOTSTRAP
// ──────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const result = await loadAllData();
    console.log(`Loaded ${result.combos} combos from ${result.schools} schools`);
    init();
  } catch (err) {
    console.error('Failed to load game data:', err);
    document.body.innerHTML = '<div style="padding:40px;text-align:center;color:#F0E4C0;background:#0C0C0E;font-family:sans-serif;min-height:100vh"><h2>Failed to load game data</h2><p style="opacity:0.7">' + err.message + '</p></div>';
  }
});
