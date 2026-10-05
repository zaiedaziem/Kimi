# Kimi Antonelli — GRIDO1 Racing Systems

A one-page driver site. Plain HTML, CSS and ES modules — no build step.
three.js and Lenis load from jsDelivr through the import map in `index.html`;
every image, texture and model lives in `assets/` (the path is `ASSET_BASE_URL` in `js/assets.js`).

## Requirements

- Python 3 (only to serve the files — nothing to install, no build step)
- A modern browser with WebGL (Chrome, Edge, Firefox, Safari)
- An internet connection for the libraries and fonts (three.js, Lenis, the Draco decoder, Google Fonts) — all images and models are local, in `assets/`

## Run it

The page uses ES modules, which browsers refuse to load from `file://` — so
double-clicking `index.html` shows a blank page. Serve the folder instead.

1. Open a terminal in the project folder.
2. Start a static server:

   ```bash
   python -m http.server 5178
   ```

   On Windows, if `python` isn't found, use the launcher:

   ```bash
   py -m http.server 5178
   ```

3. Open http://localhost:5178 in your browser.
4. Stop the server with `Ctrl+C`.

Any other static server works too (`npx serve`, VS Code Live Server, GitHub Pages).

## Layout

```
index.html                  markup + import map
css/styles.css              tokens, root font bands, every block's styles
css/extras.css              the Next race, Store and Garage blocks
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
  extras.js                 Next race, Store and Garage reveals
  footer.js                 footer copy, nav, figure parallax
js/nav.js                   in-page nav: every nav link scrolls to its block through Lenis
js/data/                    circuit path, map vectors, halftone dots, timeline entries
assets/                     every image, texture and model (hero scene, UI, timeline, paddock, footer)
```

## Sections and nav

The nav (masthead, phone menu, footer) scrolls within the page:

| Link | Goes to |
|---|---|
| Driver | From karts to F1 (`#timeline`) |
| Season | The season so far (`#season`) |
| Journal | From the paddock (`#paddock`) |
| Next race | Next race — Belgian GP (`#next-race`) |
| Store | Team store (`#store`) |
| Garage | The garage (`#garage`) |
