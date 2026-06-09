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
  respinUsed: false,
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
    round: 0, respinUsed: false,
    currentSchoolEra: null, selectedPos: null, picks: {}, phase: 'spin',
  };
  renderDock();
  showSpinScreen();
  updateHeader();
}

function updateHeader() {
  const pos = currentPos();
  const filled = Object.keys(state.picks).length;
  document.getElementById('roundLabel').textContent = `Round ${filled + 1} of 8`;
// phase badge removed
}

function renderDock() {
  const off = document.getElementById('offenseDock');
  const def = document.getElementById('defenseDock');
  off.innerHTML = '';
  def.innerHTML = '';

  OFFENSE_SLOTS.forEach(pos => {
    const pick = state.picks[pos];
    const slot = document.createElement('div');
    slot.className = 'dock-slot';
    const circle = document.createElement('div');
    circle.className = 'dock-circle' + (pick ? ' offense-filled' : '');
    circle.textContent = pick ? abbrev(pick.room.school) : pos;
    const label = document.createElement('div');
    label.className = 'dock-label' + (pick ? ' filled-label' : '');
    label.textContent = pos;
    slot.appendChild(circle); slot.appendChild(label);
    off.appendChild(slot);
  });

  DEFENSE_SLOTS.forEach(pos => {
    const pick = state.picks[pos];
    const slot = document.createElement('div');
    slot.className = 'dock-slot';
    const circle = document.createElement('div');
    circle.className = 'dock-circle' + (pick ? ' defense-filled' : '');
    circle.textContent = pick ? abbrev(pick.room.school) : pos;
    const label = document.createElement('div');
    label.className = 'dock-label' + (pick ? ' filled-label' : '');
    label.textContent = pos;
    slot.appendChild(circle); slot.appendChild(label);
    def.appendChild(slot);
  });
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

function showSpinScreen() {
  window.scrollTo(0, 0);
  document.getElementById('spinScreen').classList.remove('hidden');
  document.getElementById('roomScreen').classList.add('hidden');
  document.getElementById('resultsScreen').classList.add('hidden');
  document.getElementById('confirmBar').classList.add('hidden');

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
  if (state.respinUsed) {
    btn.className = 'respin-btn used';
    btn.disabled = true;
  } else {
    btn.className = 'respin-btn available';
    btn.disabled = false;
  }
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
  if (state.respinUsed) return;
  const curKey = state.currentSchoolEra;

  state.respinUsed = true;
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
  document.getElementById('confirmBar').classList.remove('hidden');
  state.phase = 'room';

  document.getElementById('roomSchoolPill').textContent = school;
  document.getElementById('roomEraPill').textContent = era;
  updateRespinBtns();

  const remaining = getRemainingSlots();
  const available = ALL_SLOTS.filter(p => !state.picks[p] && data[p]);
  const alreadyFilled = ALL_SLOTS.filter(p => state.picks[p]);

  // Auto-select first available
  state.selectedPos = available[0] || null;
  updateConfirmBtn();

  // Render all cards
  renderAllCards(data, available, alreadyFilled);
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
  state.selectedPos = pos;
  updateConfirmBtn();

  // Update card selection state
  document.querySelectorAll('.pos-card').forEach(card => {
    const cardPos = card.id.replace('poscard-', '');
    card.classList.toggle('selected', cardPos === pos);
    const check = card.querySelector('.pos-card-check');
    const title = card.querySelector('.pos-card-title');
    if (check) check.textContent = cardPos === pos ? '✓' : '';
  });
}

function updateConfirmBtn() {
  const btn = document.querySelector('.confirm-btn');
  if (btn && state.selectedPos) {
    btn.innerHTML = `LOCK IN ${state.selectedPos} ROOM`;
  }
}

// ──────────────────────────────────────────────────────────────
// CONFIRM PICK
// ──────────────────────────────────────────────────────────────
function confirmPick() {
  document.getElementById('spinIntro').style.display = 'none';
  const pos = state.selectedPos;
  if (!pos || !state.currentSchoolEra) return;

  const key = state.currentSchoolEra;
  const data = GAME_DATA[key];
  const room = data[pos];
  if (!room) return;

  const scored = scoreRoom(room);
  state.picks[pos] = { room, roomScore: scored.roomScore, playerScores: scored.playerScores };
  state.round++;
  state.currentSchoolEra = null;
  state.selectedPos = null;

  renderDock();
  updateHeader();

  if (Object.keys(state.picks).length === 8) {
    showResults();
  } else {
    showSpinScreen();
  }
}

// ──────────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────────
function showResults() {
  document.getElementById('spinScreen').classList.add('hidden');
  document.getElementById('roomScreen').classList.add('hidden');
  document.getElementById('confirmBar').classList.add('hidden');
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

  const roomScores = {};
  ALL_SLOTS.forEach(pos => { roomScores[pos] = state.picks[pos]?.roomScore || 0; });
  const result = mapScore(total, offTotal, defTotal, roomScores);
  document.getElementById('finalRecord').textContent = result.record;
  document.getElementById('gradeDisplay').textContent = result.grade;
  const offRating = Math.min(99, Math.max(55, Math.round((offTotal - 315) / 281 * 44 + 55)));
  const defRating = Math.min(99, Math.max(50, Math.round((defTotal - 125) / 190 * 49 + 50)));
  document.getElementById('offScore').textContent = offRating;
  document.getElementById('defScore').textContent = defRating;

  let rowsHtml = '';
  ALL_SLOTS.forEach(pos => {
    const pick = state.picks[pos];
    if (!pick) return;
    const isOff = OFFENSE_SLOTS.includes(pos);
    const topNames = pick.playerScores.slice(0,3).map(p => p.name.split(' ')[0]).join(' · ');
    rowsHtml += `
      <div class="result-row ${isOff ? 'offense-row' : 'defense-row'}">
        <div class="pos-avatar ${isOff ? 'offense-pos' : 'defense-pos'}">${pos}</div>
        <div class="result-info">
          <div class="result-school">${pick.room.school}</div>
          <div class="result-meta">${pick.room.era} &nbsp;·&nbsp; ${topNames}</div>
        </div>

      </div>`;
  });

  document.getElementById('resultRows').innerHTML = rowsHtml;
}

function resetGame() {
  document.getElementById('persistentDock').style.display = '';
  document.getElementById('resultsScreen').classList.add('hidden');
  init();
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
