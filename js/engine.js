// Engine — DOM helpers, the shared ticker, Lenis, the spring, text reveals, scroll triggers.

import Lenis from "lenis";

/* ==========================================================================
   ENGINE — ticker, spring, text reveals, scroll triggers
   ========================================================================== */

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const mq = (q) => window.matchMedia(q);
export const REDUCED = mq("(prefers-reduced-motion: reduce)").matches;
export const px = (value) => `${((value / 1440) * 100).toFixed(4)}cqw`;
export const typ = (value) => `max(${px(value)}, var(--type-min, 0px))`;
export const SVG_NS = "http://www.w3.org/2000/svg";
export const parseRgb = (s) => (s.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
export const mix = (a, b, t) => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];
export const css = ([r, g, b]) => `rgb(${r} ${g} ${b})`;
export const rgba = ([r, g, b], alpha) => `rgb(${r} ${g} ${b} / ${alpha})`;
export const easeOutQuad = (u) => 1 - (1 - u) * (1 - u);
export const easeInOutSine = (u) => -(Math.cos(Math.PI * u) - 1) / 2;
export const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);

export const readToken = (token) => {
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;color:var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
};

/* ---------- root font above 1920 ---------- */
export const rootScale = () => {
  document.documentElement.style.fontSize = window.innerWidth > 1920 ? `${(16 * window.innerWidth) / 1920}px` : "";
};
rootScale();

/* ---------- resize bus (one rAF) ---------- */
export const resizers = new Set();
export let resizeQueued = false;
window.addEventListener("resize", () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
    resizeQueued = false;
    rootScale();
    for (const fn of resizers) fn();
  });
});
export const onResize = (fn) => { resizers.add(fn); return fn; };

/* ---------- the shared ticker ---------- */
export const subs = new Set();
export let rafId = 0;
export const loop = (time) => {
  rafId = 0;
  for (const s of [...subs]) {
    if (!subs.has(s)) continue;
    if (time - s.last > s.fr()) {
      s.last = time;
      s.cb(time);
    }
  }
  if (subs.size && !rafId) rafId = requestAnimationFrame(loop);
};
export const subscribe = (cb, framerate = 0) => {
  const s = { cb, fr: typeof framerate === "function" ? framerate : () => framerate, last: -Infinity };
  subs.add(s);
  if (!rafId) rafId = requestAnimationFrame(loop);
  return () => {
    subs.delete(s);
    if (!subs.size && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
  };
};

/* Lenis rides the loop, registered first. */
export let lenis = null;
if (!REDUCED) {
  lenis = new Lenis({ smoothWheel: true });
  subscribe((time) => lenis.raf(time), () => 0);
}

/* ---------- the spring (react-spring's solver) ---------- */
export const REVEAL = { tension: 90, friction: 26 };
export const ITEM = { tension: 170, friction: 24 };
export const ROW = ITEM;
export const SHEET = { tension: 190, friction: 26 };
export const FIGURE = { tension: 200, friction: 24 };
export const TYPE = { tension: 210, friction: 24 };
export const YEAR = { tension: 190, friction: 24 };
export const COPY = { tension: 110, friction: 26 };
export const COPY_FAST = { tension: 150, friction: 24 };
export const NAME = { tension: 190, friction: 24 };
export const VEIL = { tension: 70, friction: 24 };
export const CLEAR = { tension: 140, friction: 26 };
export const LABEL = { tension: 110, friction: 26 };
export const PROGRESS_WAIT = { tension: 10, friction: 30 };
export const PROGRESS_READY = { tension: 170, friction: 26 };
export const YEAR_SETTLE = { tension: 32, friction: 26 };
export const TRIGGER = { tension: 140, friction: 30 };

export class Spring {
  constructor(from, { config = REVEAL, onChange = null, onRest = null } = {}) {
    this.value = { ...from };
    this.target = { ...from };
    this.origin = { ...from };
    this.vel = {};
    for (const k in from) this.vel[k] = 0;
    this.config = config;
    this.onChange = onChange;
    this.onRest = onRest;
    this.unsub = null;
    this.timer = 0;
    this.tween = null;
    onChange?.(this.value);
  }
  start(to, { delay = 0, config = null } = {}) {
    clearTimeout(this.timer);
    const go = () => {
      if (config) this.config = config;
      Object.assign(this.target, to);
      this.origin = { ...this.value };
      this.tween = this.config.duration != null ? { from: { ...this.value }, t0: performance.now() } : null;
      this.run();
    };
    if (delay > 0) this.timer = setTimeout(go, delay);
    else go();
    return this;
  }
  set(v) {
    clearTimeout(this.timer);
    Object.assign(this.value, v);
    Object.assign(this.target, v);
    for (const k in this.vel) this.vel[k] = 0;
    if (this.unsub) { this.unsub(); this.unsub = null; }
    this.onChange?.(this.value);
  }
  run() {
    this.last = performance.now();
    if (!this.unsub) this.unsub = subscribe((t) => this.step(t), 0);
  }
  step(time) {
    const now = Math.max(time, this.last);
    const dt = Math.min(64, now - this.last);
    this.last = now;
    let done = true;
    const c = this.config;
    if (this.tween) {
      const u = clamp01((performance.now() - this.tween.t0) / Math.max(1, c.duration));
      const e = c.easing ? c.easing(u) : u;
      for (const k in this.target) this.value[k] = this.tween.from[k] + (this.target[k] - this.tween.from[k]) * e;
      done = u >= 1;
    } else {
      const steps = Math.round(dt);
      for (const k in this.target) {
        const to = this.target[k];
        let pos = this.value[k];
        let vel = this.vel[k];
        const range = Math.abs(to - this.origin[k]);
        const precision = range <= 1 ? 0.001 : 0.01;
        for (let n = 0; n < steps; n++) {
          const springForce = -c.tension * 0.000001 * (pos - to);
          const dampingForce = -c.friction * 0.001 * vel;
          vel += springForce + dampingForce; // mass 1, 1ms step
          pos += vel;
        }
        if (Math.abs(vel) < precision * 0.1 && Math.abs(to - pos) < precision) {
          pos = to;
          vel = 0;
        } else done = false;
        this.value[k] = pos;
        this.vel[k] = vel;
      }
    }
    this.onChange?.(this.value);
    if (done) {
      if (this.unsub) { this.unsub(); this.unsub = null; }
      this.onRest?.(this.value);
    }
  }
}

/* A one-shot tween on the ticker. */
export const tween = (duration, ease, onUpdate, onDone) => {
  const t0 = performance.now();
  const stop = subscribe(() => {
    const u = clamp01((performance.now() - t0) / duration);
    onUpdate(ease(u));
    if (u >= 1) { stop(); onDone?.(); }
  });
  return stop;
};

/* ---------- reveal primitives ---------- */
/** `{opacity 0, translateY(y)} → {1, 0}` — uses the `translate` property so it composes with any layout transform. */
export const rise = (el, { y = 0.75, unit = "rem", config = REVEAL } = {}) => {
  const s = new Spring({ o: 0, y }, {
    config,
    onChange: (v) => { el.style.opacity = v.o; el.style.translate = `0 ${v.y}${unit}`; },
  });
  return { in: (delay = 0) => s.start({ o: 1, y: 0 }, { delay }), out: () => s.start({ o: 0, y }), spring: s };
};
export const fade = (el, { config = REVEAL } = {}) => {
  const s = new Spring({ o: 0 }, { config, onChange: (v) => { el.style.opacity = v.o; } });
  return { in: (delay = 0) => s.start({ o: 1 }, { delay }), out: () => s.start({ o: 0 }), spring: s };
};
export const drawIn = (el, { config = REVEAL } = {}) => {
  const s = new Spring({ o: 0, s: 0 }, { config, onChange: (v) => { el.style.opacity = v.o; el.style.transform = `scaleX(${v.s})`; } });
  return { in: (delay = 0) => s.start({ o: 1, s: 1 }, { delay }), out: () => s.start({ o: 0, s: 0 }), spring: s };
};

/**
 * The text engine. Words or letters, each its own spring, unit i at
 * delayIn + i * stagger. Letter mode keeps words as nowrap groups so the
 * container's column-gap only falls between words.
 */
export const splitText = (text, { by = "words", stagger, config = REVEAL, gap = null, className = "", tag = "span" } = {}) => {
  const root = document.createElement(tag);
  root.className = `te ${className}`.trim();
  root.setAttribute("aria-hidden", "true");
  if (gap != null) root.style.columnGap = gap;
  const fromY = by === "words" ? 0.35 : 0.3;
  const step = stagger ?? (by === "words" ? 110 : 26);
  const springs = [];
  const make = (el) => {
    el.classList.add("te-u");
    springs.push(new Spring({ o: 0, y: fromY }, {
      config,
      onChange: (v) => { el.style.opacity = v.o; el.style.translate = `0 ${v.y}em`; },
    }));
  };
  for (const word of text.split(" ")) {
    if (!word) continue;
    const w = document.createElement("span");
    if (by === "words") {
      w.textContent = word;
      make(w);
    } else {
      w.style.display = "inline-flex";
      w.style.whiteSpace = "nowrap";
      for (const ch of Array.from(word)) {
        const l = document.createElement("span");
        l.textContent = ch;
        w.appendChild(l);
        make(l);
      }
    }
    root.appendChild(w);
  }
  return {
    el: root,
    in(delayIn = 0) { springs.forEach((s, i) => s.start({ o: 1, y: 0 }, { delay: delayIn + i * step })); },
    out() { springs.forEach((s) => s.start({ o: 0, y: fromY })); },
  };
};
export const srOnly = (text) => {
  const s = document.createElement("span");
  s.className = "sr-only";
  s.textContent = text;
  return s;
};
/** Fill an element with an animated text run plus its accessible copy. */
export const textInto = (el, text, opts) => {
  el.textContent = "";
  const run = splitText(text, opts);
  el.append(srOnly(text), run.el);
  return run;
};

/** A block masthead: authored lines, a word reveal per line, the full stop as its own span. */
export const buildHead = (el, { stopColor = "var(--foreground-on-dark)" } = {}) => {
  const lines = el.dataset.head.split("|");
  el.textContent = "";
  el.appendChild(srOnly(lines.join(" ") + "."));
  const runs = [];
  lines.forEach((line, i) => {
    const row = document.createElement("span");
    row.className = "line";
    row.setAttribute("aria-hidden", "true");
    const run = splitText(line, { by: "words", stagger: 110, config: REVEAL });
    row.appendChild(run.el);
    if (i === lines.length - 1) {
      const stop = document.createElement("span");
      stop.className = "stop";
      stop.textContent = ".";
      stop.style.color = stopColor;
      row.appendChild(stop);
      runs.push({ stop: fade(stop) });
    }
    el.appendChild(row);
    runs.push({ run, i });
  });
  return {
    in() {
      for (const r of runs) {
        if (r.run) r.run.in(r.i * 130);
        if (r.stop) r.stop.in(130 + 110);
      }
    },
    out() { for (const r of runs) { r.run?.out(); r.stop?.out(); } },
  };
};

/** mode "forward": in when on screen; holds when left above, reverses when left below. */
export const forward = (el, onIn, onOut, { rootMargin = "0px", once = false } = {}) => {
  let shown = false;
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      if (!shown) { shown = true; onIn(); }
      if (once) io.disconnect();
    } else if (shown && !once && e.boundingClientRect.top > 0) {
      shown = false;
      onOut?.();
    }
  }, { rootMargin });
  io.observe(el);
};

/** Ticker subscription while in view, plus ten more frames after leaving. */
export const inViewLoop = (el, fn, framerate = 0, rootMargin = "0px") => {
  let unsub = null;
  let visible = false;
  let frames = 0;
  const tick = (t) => {
    fn(t);
    if (!visible && --frames <= 0 && unsub) { unsub(); unsub = null; }
  };
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    frames = 10;
    if (visible && !unsub) unsub = subscribe(tick, framerate);
  }, { rootMargin }).observe(el);
};

/** Scroll trigger positions, relative to the viewport. */
export const poses = (bb, vh) => ({
  top_top: bb.top, center_top: bb.top + bb.height / 2, bottom_top: bb.bottom,
  top_bottom: bb.top - vh, center_bottom: bb.top + bb.height / 2 - vh, bottom_bottom: bb.bottom - vh,
  top_center: bb.top - vh / 2, center_center: bb.top + bb.height / 2 - vh / 2, bottom_center: bb.bottom - vh / 2,
});
/** A scrub trigger: progress 0–1 handed on (immediately, or through a smoothing spring). */
export const scrub = (el, start, end, onProgress, { smooth = null } = {}) => {
  const spring = smooth ? new Spring({ p: 0 }, { config: smooth, onChange: (v) => onProgress(v.p) }) : null;
  let last = -1;
  const compute = () => {
    const bb = el.getBoundingClientRect();
    const p0 = poses(bb, window.innerHeight);
    const scrollStart = p0[start];
    const scrollEnd = p0[end];
    const length = Math.abs(scrollStart - scrollEnd) || 1;
    const progress = Math.min(Math.max(0, 1 - (scrollStart + length) / length), 1);
    if (progress === last) return;
    last = progress;
    if (spring) spring.start({ p: progress });
    else onProgress(progress);
  };
  inViewLoop(el, compute, 10);
  onResize(() => { last = -1; compute(); });
  compute();
  return { compute };
};
