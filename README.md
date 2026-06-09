# Position U

College football fantasy slot-machine game. Spin a school and era, fill 8 position rooms, find out if your roster goes 15-0.

40 schools. 6 decades. 223 unique school/era combos. 4,800+ players.

## Project Structure

```
PositionU/
├── index.html              ← Shell — loads CSS and JS
├── css/
│   └── game.css            ← All styles
├── js/
│   ├── rules.js            ← LOCKED — difficulty constants
│   ├── scoring.js          ← Scoring engine (uses RULES)
│   ├── data-loader.js      ← Loads JSON files at runtime
│   └── game.js             ← UI, screens, game flow
├── data/
│   ├── manifest.json       ← Lists all school files
│   ├── alabama.json        ← One file per school
│   ├── miami.json
│   └── ... (40 schools)
├── validate.js             ← Pre-push data integrity check
├── og-image.png            ← Social preview image
└── .github/workflows/
    └── validate.yml        ← Auto-runs validate.js on every push
```

## Editing Player Data

To fix or update a player, open the relevant school's JSON file in `/data/` and edit. The validator (run automatically on push) will catch most mistakes.

Example: To fix a Penn State 90s QB:
1. Open `data/penn-state.json`
2. Find `eras → "90s" → QB → players`
3. Make your change

## Editing Game Difficulty

All scoring rules live in `js/rules.js`. This file should rarely change. When it does, increment `version`. Score submissions to any future leaderboard should include `rules.version` so historical scores can be filtered.

## Editing Game UI

- Visual styles: `css/game.css`
- Screen logic, animations, flow: `js/game.js`

## Editing the Scoring Engine

`js/scoring.js` reads all constants from `rules.js`. It should rarely change — most balance work happens in rules.js. If the scoring formulas themselves need adjustment, this is the place.

## Validation

```bash
node validate.js
```

Runs automatically on push via GitHub Actions. Fails the build if data is broken.
