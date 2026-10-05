// 2 — The season so far: copy, plate, map SVG, the lap, the halftone and reticle.
import { $, $$, mq, REDUCED, px, parseRgb, mix, css, rgba, easeOutQuad, easeInOutSine, easeOutCubic, readToken, onResize, TYPE, COPY_FAST, tween, rise, fade, drawIn, textInto, buildHead, forward, inViewLoop } from "../engine.js";
import { covered } from "../stack.js";
import { coarseQ } from "./hero.js";
import { CIRCUIT_PATH, CIRCUIT_MARKERS, CIRCUIT_STEP } from "../data/circuit.js";
import { MAP_VIEW, TRACK_RIBBON, LAP_CENTRELINE, LAP_MASK_WIDTH, LAP_LENGTH, mapToArtboard, GRID_AXES_X, GRID_AXIS_Y, GRID_DASH, GRID_STROKE, HUB, RINGS, CORNER_MARKS, CORNER_MARK_SIZE, TURN_POINTS, TURNS, FLAG_CUT, FLAG_DIAMONDS } from "../data/map-vector.js";
import { DOT_LATTICE, DOT_RADIUS, DOTS } from "../data/map-dots.js";

/* ==========================================================================
   3 — THE SEASON SO FAR
   ========================================================================== */
export const seasonSection = $("#season");
{
  const head = buildHead($("#season-title"));
  const rule = drawIn($("#season-rule"));
  const intro = textInto($("#season-intro"), "Every race is a step forward. Here's how the season is shaping up.", { by: "words", stagger: 34, config: COPY_FAST, gap: "0.22em" });
  forward($("#season-title"), () => { head.in(); rule.in(2 * 130); intro.in(2 * 130 + 90); }, () => { head.out(); rule.out(); intro.out(); });

  // The standings plate.
  const PLATE_DELAY = 260, TYPE_DELAY = 430, ROW_STAGGER = 110, LETTER_STAGGER = 22;
  const plate = rise($("#splate"), { y: 0.75 });
  const f1 = textInto($("#plate-f1"), "F1", { by: "letters", stagger: LETTER_STAGGER, config: TYPE });
  const yr = textInto($("#plate-year"), "/ 2026", { by: "letters", stagger: LETTER_STAGGER, config: TYPE, gap: "0.3em" });
  const rows = $$("#plate-stats > div").map((row) => ({
    dt: textInto($("dt", row), $("dt", row).dataset.l, { by: "letters", stagger: LETTER_STAGGER, config: TYPE }),
    dd: textInto($("dd", row), $("dd", row).dataset.l, { by: "letters", stagger: LETTER_STAGGER, config: TYPE, gap: "0.35em" }),
  }));
  $$("#plate-stats .te").forEach((t) => t.classList.add("te-nowrap"));
  forward($("#splate"), () => {
    plate.in(PLATE_DELAY);
    f1.in(TYPE_DELAY);
    yr.in(TYPE_DELAY + 60);
    rows.forEach((r, i) => { r.dt.in(TYPE_DELAY + i * ROW_STAGGER); r.dd.in(TYPE_DELAY + i * ROW_STAGGER + 70); });
  }, () => { plate.out(); f1.out(); yr.out(); rows.forEach((r) => { r.dt.out(); r.dd.out(); }); });
}

/* ---------- the map SVG ---------- */
export const DRIFT_MS = 7000, PING_MS = 4200, PING_REACH = 86, GRID_OVERRUN = 4000, SPIN_MS = 10000;
export const seasonSvg = $("#season-svg");
{
  const cutHalfAlong = FLAG_CUT.along / 2, cutHalfAcross = FLAG_CUT.across / 2;
  const axes = GRID_AXES_X.map((x) =>
    `<line x1="${x}" y1="${-GRID_OVERRUN}" x2="${x}" y2="${MAP_VIEW.height + GRID_OVERRUN}"/>`).join("") +
    `<line x1="${-GRID_OVERRUN}" y1="${GRID_AXIS_Y}" x2="${MAP_VIEW.width + GRID_OVERRUN}" y2="${GRID_AXIS_Y}"/>`;
  const rings = RINGS.map((r) =>
    `<circle cx="${HUB.x}" cy="${HUB.y}" r="${r.r}" fill="none" stroke-width="${r.width}" style="stroke:var(${r.ghost ? "--map-grid-ghost" : "--map-grid"})"/>`).join("");
  const marks = CORNER_MARKS.map(([x, y]) =>
    `<rect x="${x}" y="${y}" width="${CORNER_MARK_SIZE}" height="${CORNER_MARK_SIZE}" style="fill:var(--map-mark)"/>`).join("");
  const turns = TURNS.map((t) =>
    `<polygon points="${TURN_POINTS}" transform="translate(${t.x} ${t.y}) rotate(${t.angle})" style="fill:var(--accent)"/>`).join("");
  seasonSvg.innerHTML = `
    <defs>
      <mask id="flag-cut" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="12560" height="11440">
        <rect x="-5000" y="-5000" width="12560" height="11440" fill="white"/>
        <rect x="${-cutHalfAlong}" y="${-cutHalfAcross}" width="${FLAG_CUT.along}" height="${FLAG_CUT.across}" fill="black" transform="translate(${FLAG_CUT.x} ${FLAG_CUT.y}) rotate(${FLAG_CUT.angle})"/>
      </mask>
      <mask id="lap-mask" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="12560" height="11440">
        <path id="lap-path" d="${LAP_CENTRELINE}" fill="none" stroke="white" stroke-width="${LAP_MASK_WIDTH}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${LAP_LENGTH + 60}" stroke-dashoffset="${60 + LAP_LENGTH}"/>
      </mask>
    </defs>
    <g id="grid">
      <g id="grid-axes" fill="none" stroke-width="${GRID_STROKE}" stroke-dasharray="${GRID_DASH}" style="stroke:var(--map-grid)">${axes}</g>
      ${rings}
      <circle id="map-ping" cx="${HUB.x}" cy="${HUB.y}" r="${HUB.r}" fill="none" stroke-width="2.13" style="stroke:var(--accent)" opacity="0"/>
      ${marks}
      <circle cx="${HUB.x}" cy="${HUB.y}" r="${HUB.r}" style="fill:var(--map-mark)"/>
    </g>
    <g mask="url(#flag-cut)">
      <path d="${TRACK_RIBBON}" style="fill:var(--foreground-on-dark)"/>
      <path d="${TRACK_RIBBON}" style="fill:var(--accent)" mask="url(#lap-mask)"/>
    </g>
    <g id="markers">${turns}</g>
    <path d="${FLAG_DIAMONDS}" style="fill:var(--map-mark)"/>`;
}
export const gridAxes = $("#grid-axes");
export const mapPing = $("#map-ping");
export const lapPath = $("#lap-path");
export const meridian = $("#globe-meridian");

/* ---------- stage fit ---------- */
export const seasonFrame = $("#season-frame");
export const seasonStage = $("#season-stage");
export const TRACK_BOX = (() => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of CIRCUIT_PATH) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const pad = 46;
  return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
})();
export const fitStage = () => {
  const w = seasonFrame.clientWidth;
  const h = seasonFrame.clientHeight;
  let s, tx, ty;
  if (window.innerWidth >= 1024) {
    s = Math.max(w / 1440, h / 800);
    tx = (w - 1440 * s) / 2;
    ty = (h - 800 * s) / 2;
  } else {
    s = w / TRACK_BOX.width;
    const cx = TRACK_BOX.x + TRACK_BOX.width / 2;
    const cy = TRACK_BOX.y + TRACK_BOX.height / 2;
    tx = w / 2 - cx * s;
    ty = h / 2 - cy * s;
  }
  seasonStage.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
};
fitStage();
onResize(fitStage);

/* ---------- the lap ---------- */
export const LAP_MS = 6000;
export const LINE_WIDTH = 5.9;
export const GLOW_WIDTH = 15;
export const HEAD_UNITS = 210;
export const COOL_MS = 800;
export const MARKER_POP_UNITS = 90;
export const CORNER_BRAKE = 9;
export const CUT_CENTRE = mapToArtboard(FLAG_CUT.x, FLAG_CUT.y);
export const CUT_SCALE = 1438.43 / 2560;
export const CUT_ALONG = FLAG_CUT.along * CUT_SCALE;
export const CUT_ACROSS = FLAG_CUT.across * CUT_SCALE;

export const CUMULATIVE = CIRCUIT_PATH.reduce((acc, point, index) => {
  if (index === 0) return [0];
  const previous = CIRCUIT_PATH[index - 1];
  acc.push(acc[index - 1] + Math.hypot(point[0] - previous[0], point[1] - previous[1]));
  return acc;
}, []);
export const TOTAL = CUMULATIVE[CUMULATIVE.length - 1];

export const TIME_AT = (() => {
  const count = CIRCUIT_PATH.length;
  const turn = new Array(count).fill(0);
  for (let i = 1; i < count - 1; i += 1) {
    const [ax, ay] = CIRCUIT_PATH[i - 1]; const [bx, by] = CIRCUIT_PATH[i]; const [cx, cy] = CIRCUIT_PATH[i + 1];
    const ux = bx - ax, uy = by - ay, vx = cx - bx, vy = cy - by;
    const lengths = (Math.hypot(ux, uy) || 1) * (Math.hypot(vx, vy) || 1);
    turn[i] = Math.acos(Math.min(1, Math.max(-1, (ux * vx + uy * vy) / lengths)));
  }
  const win = 6;
  const smoothed = turn.map((_, i) => {
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - win); j <= Math.min(count - 1, i + win); j += 1) { sum += turn[j]; n += 1; }
    return sum / n;
  });
  const accumulated = [0];
  for (let i = 1; i < count; i += 1) {
    const span = CUMULATIVE[i] - CUMULATIVE[i - 1];
    const speed = 1 / (1 + CORNER_BRAKE * smoothed[i]);
    accumulated.push(accumulated[i - 1] + span / speed);
  }
  const total = accumulated[count - 1] || 1;
  return accumulated.map((value) => value / total);
})();

export const distanceAtTime = (time) => {
  if (time <= 0) return 0;
  if (time >= 1) return TOTAL;
  let low = 0, high = TIME_AT.length - 1;
  while (low < high - 1) { const mid = (low + high) >> 1; if (TIME_AT[mid] <= time) low = mid; else high = mid; }
  const span = TIME_AT[high] - TIME_AT[low] || 1;
  const ratio = (time - TIME_AT[low]) / span;
  return CUMULATIVE[low] + (CUMULATIVE[high] - CUMULATIVE[low]) * ratio;
};

export const COARSE = coarseQ.matches;
export const MAX_RATIO = COARSE ? 1 : 2;
export const palette = (() => {
  const accent = parseRgb(readToken("--accent"));
  const white = parseRgb(readToken("--foreground-on-dark"));
  return { accent, white, bright: mix(accent, white, 0.55), dot: parseRgb(readToken("--map-dot")) };
})();

export const traceCanvas = $("#season-trace");
export const traceContext = traceCanvas.getContext("2d");
{
  const ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
  traceCanvas.width = Math.round(1440 * ratio);
  traceCanvas.height = Math.round(800 * ratio);
  traceContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}
export let lapProgress = 0;
export let heat = 1;

export const trailUpTo = (distance) => {
  const out = [];
  for (let i = 0; i < CIRCUIT_PATH.length; i += 1) {
    if (CUMULATIVE[i] <= distance) { out.push(CIRCUIT_PATH[i]); continue; }
    const a = CIRCUIT_PATH[i - 1], b = CIRCUIT_PATH[i];
    const ratio = (distance - CUMULATIVE[i - 1]) / (CUMULATIVE[i] - CUMULATIVE[i - 1]);
    out.push([a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio]);
    break;
  }
  return out;
};
export const strokePts = (context, points, scale, from = 0) => {
  context.beginPath();
  context.moveTo(points[from][0] * scale, points[from][1] * scale);
  for (let i = from + 1; i < points.length; i += 1) context.lineTo(points[i][0] * scale, points[i][1] * scale);
  context.stroke();
};
export const drawTrail = (context, points, scale, minWidth, glow, heatV) => {
  if (points.length < 2) return;
  const width = Math.max(minWidth, LINE_WIDTH * scale);
  context.lineCap = "round"; context.lineJoin = "round";
  if (glow) {
    context.save();
    context.globalCompositeOperation = "lighter";
    context.strokeStyle = rgba(palette.accent, 0.05); context.lineWidth = GLOW_WIDTH * scale; strokePts(context, points, scale);
    context.strokeStyle = rgba(palette.accent, 0.1); context.lineWidth = GLOW_WIDTH * 0.45 * scale; strokePts(context, points, scale);
    context.restore();
  }
  const head = Math.max(2, Math.round(HEAD_UNITS / CIRCUIT_STEP));
  const from = Math.max(0, points.length - head);
  const tip = points[points.length - 1];
  const hot = context.createLinearGradient(points[from][0] * scale, points[from][1] * scale, tip[0] * scale, tip[1] * scale);
  hot.addColorStop(0, rgba(palette.accent, 0));
  hot.addColorStop(0.45, rgba(palette.accent, 0.9));
  hot.addColorStop(1, rgba(mix(palette.accent, palette.bright, heatV), 1));
  context.strokeStyle = hot; context.lineWidth = width; strokePts(context, points, scale, from);
  const coreFrom = Math.max(0, points.length - Math.round(head * 0.42));
  if (points.length - coreFrom > 1) {
    const core = context.createLinearGradient(points[coreFrom][0] * scale, points[coreFrom][1] * scale, tip[0] * scale, tip[1] * scale);
    core.addColorStop(0, rgba(palette.bright, 0));
    core.addColorStop(1, rgba(palette.white, 0.95 * heatV));
    context.strokeStyle = core; context.lineWidth = Math.max(minWidth * 0.6, width * 0.38); strokePts(context, points, scale, coreFrom);
  }
};
export const renderLap = (progress) => {
  const context = traceContext;
  const distance = distanceAtTime(progress);
  const points = trailUpTo(distance);
  const heatV = heat;
  context.clearRect(0, 0, 1440, 800);
  if (points.length > 1) {
    drawTrail(context, points, 1, 0.6, true, heatV);
    const [tx, ty] = points[points.length - 1];
    context.save(); context.globalCompositeOperation = "lighter";
    const spark = context.createRadialGradient(tx, ty, 0, tx, ty, LINE_WIDTH * 2.6);
    spark.addColorStop(0, rgba(palette.white, 0.85 * heatV));
    spark.addColorStop(0.35, rgba(palette.bright, 0.4 * heatV));
    spark.addColorStop(1, rgba(palette.accent, 0));
    context.fillStyle = spark; context.beginPath(); context.arc(tx, ty, LINE_WIDTH * 2.6, 0, Math.PI * 2); context.fill();
    context.restore();
  }
  context.save(); context.translate(CUT_CENTRE[0], CUT_CENTRE[1]); context.rotate((FLAG_CUT.angle * Math.PI) / 180);
  context.clearRect(-CUT_ALONG / 2, -CUT_ACROSS / 2, CUT_ALONG, CUT_ACROSS); context.restore();
  for (const marker of CIRCUIT_MARKERS) {
    if (distance < marker.d) continue;
    const age = Math.min(1, (distance - marker.d) / MARKER_POP_UNITS);
    const radius = 12 + (1 - age) * 14;
    const glow = context.createRadialGradient(marker.x, marker.y, 0, marker.x, marker.y, radius);
    glow.addColorStop(0, rgba(palette.bright, 0.5 + 0.45 * (1 - age)));
    glow.addColorStop(0.45, rgba(palette.accent, 0.32));
    glow.addColorStop(1, rgba(palette.accent, 0));
    context.save(); context.globalCompositeOperation = "lighter"; context.fillStyle = glow;
    context.beginPath(); context.arc(marker.x, marker.y, radius, 0, Math.PI * 2); context.fill(); context.restore();
    if (age < 1) {
      context.strokeStyle = rgba(palette.bright, (1 - age) * 0.6); context.lineWidth = 1;
      context.beginPath(); context.arc(marker.x, marker.y, 9 + age * 20, 0, Math.PI * 2); context.stroke();
    }
  }
  // The SVG lap mask uncovers the designer's ribbon on the same distance curve.
  const reveal = 1 - distance / TOTAL;
  lapPath.setAttribute("stroke-dashoffset", `${60 + reveal * LAP_LENGTH}`);
};
renderLap(0);

export let reticleArmed = false;
{
  let started = false;
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting || started) return;
    started = true;
    io.disconnect();
    tween(LAP_MS, easeInOutSine, (v) => { lapProgress = v; renderLap(v); }, () => {
      tween(COOL_MS, easeOutCubic, (v) => { heat = 1 - v; renderLap(1); }, () => { reticleArmed = true; });
    });
  }, { threshold: 0.35 });
  io.observe(seasonFrame);
}

/* ---------- the halftone ---------- */
export const HALFTONE = { threshold: 0.34, radius: 170, waveSpeed: 0.16, fade: 0.9, source: "none" };
export const MIN_LEVEL = 0.02;
export const WAVE_ANGLE = (-20 * Math.PI) / 180;
export const POINTER_HEAT = 0.95;
export const RETICLE_OPEN = 420;
export const RETICLE_SETTLE = 900;
export const SPREAD_OPEN = 0.38;
export const SPREAD_SHUT = 0.09;
export const RETICLE_ARM = 0.82;
export const RETICLE_CORE = 54;
export const POINTER_TRAIL = 0.07;
export const POINTER_RISE = 0.14;
export const POINTER_FALL = 0.3;
export const CHEQUER_FILL = 1;
export const CHEQUER_SEED = 0.7;
export const approach = (from, to, dt, tau) => from + (to - from) * (1 - Math.exp(-dt / Math.max(1e-4, tau)));
export const falloff = (t) => {
  if (t >= 1) return 0;
  const u = 1 - t;
  return u * u;
};

export const halftone = (() => {
  const canvas = $("#season-dots");
  const level = new Float32Array(DOTS.count);
  const active = new Int32Array(DOTS.count);
  const inList = new Uint8Array(DOTS.count);
  let activeCount = 0;
  let dirty = true;
  let last = 0;
  let phase = 0;
  let spread = 0;
  let baked = null;
  const pointer = { x: 0, y: 0, heat: 0 };
  const target = { x: 0, y: 0, on: false };

  const index = (() => {
    const { columns, rows, points, count } = DOTS;
    let minI = Infinity, maxI = -Infinity, minJ = Infinity, maxJ = -Infinity;
    for (let i = 0; i < count; i += 1) {
      if (columns[i] < minI) minI = columns[i];
      if (columns[i] > maxI) maxI = columns[i];
      if (rows[i] < minJ) minJ = rows[i];
      if (rows[i] > maxJ) maxJ = rows[i];
    }
    const w = maxI - minI + 1;
    const h = maxJ - minJ + 1;
    const cell = new Int32Array(w * h).fill(-1);
    for (let i = 0; i < count; i += 1) cell[(rows[i] - minJ) * w + (columns[i] - minI)] = i;
    const dx = Math.cos(WAVE_ANGLE);
    const dy = Math.sin(WAVE_ANGLE);
    const projection = new Float32Array(count);
    for (let i = 0; i < count; i += 1) projection[i] = points[i * 2] * dx + points[i * 2 + 1] * dy;
    const order = Array.from({ length: count }, (_, i) => i).sort((a, b) => projection[a] - projection[b]);
    const sorted = new Int32Array(order);
    const sortedProjection = Float32Array.from(order, (i) => projection[i]);
    return { cell, w, h, minI, minJ, dx, dy, sorted, sortedProjection, projectionMin: sortedProjection[0], projectionMax: sortedProjection[count - 1] };
  })();

  const draw = () => {
    if (!baked || !canvas.width) return;
    const context = canvas.getContext("2d");
    const p = HALFTONE;
    const scale = canvas.width / MAP_VIEW.width;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, MAP_VIEW.width, MAP_VIEW.height);
    context.drawImage(baked, 0, 0, MAP_VIEW.width, MAP_VIEW.height);
    const { points, columns, rows } = DOTS;
    const { accent, bright, white } = palette;
    const box = DOT_RADIUS * 2 + 1;
    const span = 1 - p.threshold || 1;
    let drew = 0;
    for (let k = 0; k < activeCount; k += 1) {
      const idx = active[k];
      if (level[idx] < p.threshold) continue;
      context.clearRect(points[idx * 2] - DOT_RADIUS - 0.5, points[idx * 2 + 1] - DOT_RADIUS - 0.5, box, box);
      drew += 1;
    }
    if (!drew) return;
    for (let k = 0; k < activeCount; k += 1) {
      const idx = active[k];
      const value = level[idx];
      if (value < p.threshold) continue;
      if ((columns[idx] + rows[idx]) & 1) continue;
      const t = Math.min(1, (value - p.threshold) / span);
      const side = DOT_LATTICE.pitchX * (CHEQUER_SEED + (CHEQUER_FILL - CHEQUER_SEED) * t);
      context.fillStyle = css(value > 0.8 ? white : value > 0.5 ? bright : mix(accent, bright, value));
      context.fillRect(points[idx * 2] - side / 2, points[idx * 2 + 1] - side / 2, side, side);
    }
  };

  const bake = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    baked = baked ?? document.createElement("canvas");
    baked.width = w;
    baked.height = h;
    const context = baked.getContext("2d");
    const scale = w / MAP_VIEW.width;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, MAP_VIEW.width, MAP_VIEW.height);
    const { points, count } = DOTS;
    context.fillStyle = css(palette.dot);
    context.beginPath();
    for (let i = 0; i < count; i += 1) {
      const x = points[i * 2];
      const y = points[i * 2 + 1];
      context.moveTo(x + DOT_RADIUS, y);
      context.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
    }
    context.fill();
    dirty = true;
    draw();
  };

  const light = (p, dt) => {
    const { points } = DOTS;
    const radius = Math.max(1, p.radius);
    const add = (i, value) => {
      if (value <= MIN_LEVEL) return;
      if (value > level[i]) level[i] = value;
      if (!inList[i]) { inList[i] = 1; active[activeCount] = i; activeCount += 1; }
    };
    const addPoint = (source, reach) => {
      if (source.heat <= 0.01) return;
      const { cell, w, h, minI, minJ } = index;
      const i0 = Math.floor((source.x - reach - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
      const i1 = Math.ceil((source.x + reach - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
      const j0 = Math.floor((source.y - reach - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
      const j1 = Math.ceil((source.y + reach - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
      for (let j = Math.max(minJ, j0); j <= Math.min(minJ + h - 1, j1); j += 1) {
        const row = (j - minJ) * w;
        for (let i = Math.max(minI, i0); i <= Math.min(minI + w - 1, i1); i += 1) {
          const idx = cell[row + (i - minI)];
          if (idx < 0) continue;
          const d = Math.hypot(points[idx * 2] - source.x, points[idx * 2 + 1] - source.y);
          add(idx, falloff(d / reach) * source.heat);
        }
      }
    };
    const addReticle = (source) => {
      if (source.heat <= 0.01) return;
      const { cell, w, h, minI, minJ } = index;
      const ci = Math.round((source.x - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
      const cj = Math.round((source.y - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
      const arm = RETICLE_ARM * source.heat;
      const reach = RETICLE_OPEN * spread;
      if (reach > 1 && cj >= minJ && cj < minJ + h) {
        const row = (cj - minJ) * w;
        const sp = Math.ceil(reach / DOT_LATTICE.pitchX);
        const from = Math.max(minI, ci - sp);
        const to = Math.min(minI + w - 1, ci + sp);
        for (let i = from; i <= to; i += 1) {
          const idx = cell[row + (i - minI)];
          if (idx < 0) continue;
          const d = Math.abs(points[idx * 2] - source.x);
          add(idx, (1 - d / reach) * arm);
        }
      }
      if (reach > 1 && ci >= minI && ci < minI + w) {
        const sp = Math.ceil(reach / DOT_LATTICE.pitchY);
        const from = Math.max(minJ, cj - sp);
        const to = Math.min(minJ + h - 1, cj + sp);
        for (let j = from; j <= to; j += 1) {
          const idx = cell[(j - minJ) * w + (ci - minI)];
          if (idx < 0) continue;
          const d = Math.abs(points[idx * 2 + 1] - source.y);
          add(idx, (1 - d / reach) * arm);
        }
      }
      addPoint(source, RETICLE_CORE);
    };
    addReticle(pointer);
    if (p.source === "none") return;
    // (The wave source is not shipped; kept for parity with the engine.)
    phase = (phase + dt * p.waveSpeed) % 1;
    const { sorted, sortedProjection, projectionMin, projectionMax } = index;
    const span = projectionMax - projectionMin + radius * 2;
    const centre = projectionMin - radius + phase * span;
    const lo = centre - radius;
    const hi = centre + radius;
    let a = 0, b = sortedProjection.length;
    while (a < b) { const m = (a + b) >> 1; if (sortedProjection[m] < lo) a = m + 1; else b = m; }
    for (let k = a; k < sortedProjection.length; k += 1) {
      const projection = sortedProjection[k];
      if (projection > hi) break;
      add(sorted[k], falloff(Math.abs(projection - centre) / radius));
    }
  };

  const frame = () => {
    const now = performance.now();
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    const p = HALFTONE;
    const wanted = target.on ? POINTER_HEAT : 0;
    if (pointer.heat <= 0.001 && wanted > 0) {
      pointer.x = target.x;
      pointer.y = target.y;
    } else if (dt > 0) {
      const px0 = pointer.x;
      const py0 = pointer.y;
      pointer.x = approach(px0, target.x, dt, POINTER_TRAIL);
      pointer.y = approach(py0, target.y, dt, POINTER_TRAIL);
      const speed = Math.hypot(pointer.x - px0, pointer.y - py0) / dt;
      const wantedSpread = Math.max(0, 1 - speed / RETICLE_SETTLE);
      spread = approach(spread, wantedSpread, dt, wantedSpread > spread ? SPREAD_OPEN : SPREAD_SHUT);
    }
    pointer.heat = approach(pointer.heat, wanted, dt, wanted > pointer.heat ? POINTER_RISE : POINTER_FALL);
    if (pointer.heat < 0.005) { pointer.heat = 0; spread = 0; }

    const decay = Math.exp(-dt / Math.max(0.05, p.fade / 3));
    let write = 0;
    for (let k = 0; k < activeCount; k += 1) {
      const idx = active[k];
      const value = level[idx] * decay;
      if (value > MIN_LEVEL) { level[idx] = value; active[write] = idx; write += 1; }
      else { level[idx] = 0; inList[idx] = 0; }
    }
    const before = activeCount;
    activeCount = write;
    light(p, dt);
    if (activeCount === 0 && before === 0 && !dirty) return;
    dirty = false;
    draw();
  };

  return { bake, frame, target };
})();
halftone.bake();
onResize(halftone.bake);

/* The reticle: mouse only, never under (hover: none) or reduced motion. */
if (!mq("(hover: none)").matches && !REDUCED) {
  const dotsCanvas = $("#season-dots");
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    const t = halftone.target;
    if (!reticleArmed) { t.on = false; return; }
    const s = seasonSection.getBoundingClientRect();
    const inside = e.clientX >= s.left && e.clientX <= s.right && e.clientY >= s.top && e.clientY <= s.bottom && !covered(seasonSection);
    const r = dotsCanvas.getBoundingClientRect();
    t.x = ((e.clientX - r.left) / r.width) * MAP_VIEW.width;
    t.y = ((e.clientY - r.top) / r.height) * MAP_VIEW.height;
    t.on = inside;
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { halftone.target.on = false; });
  window.addEventListener("blur", () => { halftone.target.on = false; });
}

/* Everything that loops on the season map, paused off screen. */
{
  const start = performance.now();
  inViewLoop(seasonSection, () => {
    if (covered(seasonSection)) return;
    const now = performance.now() - start;
    gridAxes.setAttribute("stroke-dashoffset", `${-((now % DRIFT_MS) / DRIFT_MS) * 20.5}`);
    const v = easeOutQuad((now % PING_MS) / PING_MS);
    mapPing.setAttribute("r", `${HUB.r + v * PING_REACH}`);
    mapPing.setAttribute("opacity", `${0.4 * (1 - v) * (1 - v)}`);
    const turn = ((now % SPIN_MS) / SPIN_MS) * Math.PI * 2;
    meridian.setAttribute("rx", `${Math.max(0.5, Math.abs(Math.cos(turn)) * 18)}`);
    halftone.frame();
  });
}
