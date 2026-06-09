// ══════════════════════════════════════════════════════════════
// POSITION U — DATA LOADER
// ══════════════════════════════════════════════════════════════
// Loads school JSON files from /data/, builds GAME_DATA structure.
// Exposes: GAME_DATA, SPIN_POOL (globals)
// ══════════════════════════════════════════════════════════════

const GAME_DATA = {};
let SPIN_POOL = [];

async function loadAllData() {
  const manifestRes = await fetch('data/manifest.json');
  const manifest = await manifestRes.json();

  const fetches = manifest.schools.map(s =>
    fetch(`data/${s.file}`).then(r => r.json())
  );
  const schools = await Promise.all(fetches);

  schools.forEach(schoolData => {
    Object.entries(schoolData.eras).forEach(([era, rooms]) => {
      GAME_DATA[`${schoolData.school} ${era}`] = rooms;
    });
  });

  SPIN_POOL = Object.keys(GAME_DATA);
  return { combos: SPIN_POOL.length, schools: schools.length };
}

if (typeof window !== 'undefined') {
  window.GAME_DATA = GAME_DATA;
  window.loadAllData = loadAllData;
  Object.defineProperty(window, 'SPIN_POOL', {
    get() { return SPIN_POOL; }
  });
}
