# Kimi Antonelli — GRIDO1 Racing Systems

A one-page driver site. Plain HTML, CSS and ES modules — no build step.
three.js and Lenis load from jsDelivr through the import map in `index.html`;
images and models load from `ASSET_BASE_URL` in `js/assets.js`.

## Run it

ES modules don't load from `file://`, so serve the folder:

```bash
python -m http.server 5178
```

Then open http://localhost:5178.

## Layout

```
index.html                  markup + import map
css/styles.css              tokens, root font bands, every block's styles
js/main.js                  entry — imports run in page order
js/engine.js                DOM helpers, shared ticker, Lenis, spring, text reveals, scroll triggers
js/assets.js                asset URL, failed-asset banner, <img>/mask loading
js/stack.js                 sticky stack (recede + shade)
js/effects/
  chequered-dissolve.js     the chequered-flag seam between blocks
  contours.js               marching-squares contour backdrop (paddock, footer)
js/scene/
  tier.js                   device tier (DPR, frame budget, pointer, reveal)
  hero-scene.js             the hero WebGL scene
js/sections/
  hero.js                   hero copy, entrance, menu sheet, loading veil, scene wrapper
  season.js                 map SVG, lap trace, halftone + reticle, standings plate
  timeline.js               rows, parallax, rail
  paddock.js                report, panels, calendar strip
  footer.js                 footer copy, nav, figure parallax
js/data/                    circuit path, map vectors, halftone dots, timeline entries
```
