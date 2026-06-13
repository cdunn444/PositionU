# Deploy & Maintenance

## Hosting
- **GitHub Pages deploys from `main`** (root). Every push to `main` triggers a
  "pages build and deployment" run — there is no separate build step; the static
  files are served as-is. `.nojekyll` is present so Pages serves the folders
  verbatim (no Jekyll processing).
- `main` is the canonical branch. Commit there directly; there is no long-lived
  feature branch.

## Before every push
Run the data validator — it gates on room sizes, position-fit stats, missing
rooms, duplicates, and the rules.js structure:

```
node validate.js
```

0 errors is required. Warnings are advisory (mostly intentional era-spanning
player reuse).

## Cache-busting (automatic)
`.github/workflows/cache-bust.yml` runs on pushes to `main` that touch `js/**`
or `css/**`. It stamps a content hash onto the `<script>`/`<link>` URLs in
`index.html` (e.g. `js/game.js?v=15561a58ba`) and commits the result with
`[skip ci]`. This is what prevents stale-cached-JS version-skew crashes after a
deploy. The hash only changes when the JS/CSS bytes change.

> Because the bot commits back to `main`, `git pull --rebase` before your next
> push if you see a non-fast-forward.

## Scoring calibration (regenerate when data or formulas change)
Room scores are remapped onto a common importance-weighted band, and the record
tiers / Madden curves / all-time percentile curve are anchored to the roster
pool. If you change scoring formulas in `js/scoring.js` or add/edit a meaningful
amount of `data/`, regenerate these constants in `js/rules.js`:

- `roomBands` — per-position `{ lo, hi, f, c }` (observed raw room min/max → band)
- `recordTiers[*].min` — total thresholds per record
- `maddenScales` — per-side floor/knee/max (also mirrored inline in `js/game.js`)
- `allTimeTotals` — 101-point percentile curve of team totals

A Monte Carlo harness (random-draft simulation that reports the record
distribution, qualify rate, and Madden rating percentiles) is used to confirm a
rescale keeps difficulty unchanged. Hold the prior distribution constant when
re-anchoring: ~41% qualify (≥9 wins), off rating p50 81 / p90 91, def p50 80 /
p90 93, dream team → 100/100.
