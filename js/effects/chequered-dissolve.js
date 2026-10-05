// The chequered-flag seam between blocks.
import { $, $$, clamp01, readToken, onResize, TRIGGER, scrub } from "../engine.js";

/* ==========================================================================
   CHEQUERED DISSOLVE
   ========================================================================== */
export const CELL = 24;
export const SOLID_UNTIL = 0.16;
export const LIFT = 2;
export const ACCENT_SHARE = 0.06;
export const flagNoise = (x, y) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
$$("[data-flag]").forEach((band) => {
  const canvas = $("canvas", band);
  const context = canvas.getContext("2d");
  const carry = band.dataset.flag;
  const surface = readToken(carry === "light" ? "--background" : "--surface-black");
  const accent = readToken("--accent");
  let progress = 0;
  let width = 0;
  let height = 0;
  const size = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = band.clientWidth;
    height = band.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  const render = () => {
    const custom = parseFloat(getComputedStyle(band).getPropertyValue("--flag-cell"));
    const cell = custom > 0 ? custom : CELL;
    context.clearRect(0, 0, width, height);
    const columns = Math.ceil(width / cell);
    const rows = Math.ceil(height / cell);
    const lift = progress * LIFT;
    for (let y = 0; y < rows; y += 1) {
      const depth = y / Math.max(1, rows - 1) + lift;
      if (depth > 1) break;
      const solid = depth <= SOLID_UNTIL;
      const fadeV = clamp01(1 - (depth - SOLID_UNTIL) / (1 - SOLID_UNTIL));
      if (!solid && fadeV <= 0) break;
      for (let x = 0; x < columns; x += 1) {
        if (!solid) {
          if ((x + y) % 2 !== 0) continue;
          if (flagNoise(x, y) > fadeV) continue;
        }
        context.fillStyle = !solid && flagNoise(x + 101, y + 57) < ACCENT_SHARE ? accent : surface;
        context.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  };
  size();
  render();
  onResize(() => { size(); render(); });
  scrub(band, "top_bottom", "top_top", (p) => { progress = p; render(); }, { smooth: TRIGGER });
});
