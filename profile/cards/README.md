# Profile cards

The profile displays two matching SVG cards with light and dark variants.
GitHub selects the variant using the README's `picture` elements.

- `profile/stats/stats.svg` is the upstream stats source, refreshed weekly.
- `badges.json` caches the Shields.io SVGs and their source URLs so normal rendering needs no network requests.
- `tools-*.svg` and `stats-*.svg` are generated files. Do not edit them directly.

From the repository root, run `node scripts/render-profile.mjs` after changing the layout or updating stats.
Use `node scripts/render-profile.mjs --refresh-badges` to refresh the cached Shields.io badges as well.
Both commands require Node.js 20 or newer and no npm dependencies.
