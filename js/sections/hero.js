// 1 — Hero: copy, entrance, menu sheet, loading veil, and the WebGL scene wrapper.
import { $, $$, mq, px, onResize, subscribe, lenis, REVEAL, ITEM, SHEET, FIGURE, VEIL, CLEAR, LABEL, PROGRESS_WAIT, PROGRESS_READY, Spring, rise, fade, textInto } from "../engine.js";
import { reportAssetError, loadImg } from "../assets.js";
import { fitSubjectToBox, DEFAULT_PARAMS, HeroScene } from "../scene/hero-scene.js";

/* ==========================================================================
   1 — HERO: copy, entrance, menu
   ========================================================================== */
export const corner = (cls) =>
  `<svg class="bc ${cls}" viewBox="0 0 10.5 10.5" aria-hidden="true"><path d="M0 0.5H10V10.5" fill="none" stroke="currentColor"/></svg>`;
$$("[data-brackets]").forEach((p) => p.insertAdjacentHTML("afterbegin", corner("tr") + corner("tl") + corner("bl") + corner("br")));

export const heroName = textInto($("#hero-name"), "kimi antonelli", { by: "words", stagger: 110, config: REVEAL });
export const heroEntrance = {
  masthead: rise($("#masthead"), { y: 1.25 }),
  id: fade($("#driver-id")),
  meta: $$("#meta li").map((li) => rise(li, { y: 0.75 })),
  panels: rise($("#hero-panels"), { y: 1.25 }),
  actions: rise($("#actions"), { y: 1.25 }),
  figures: $$("[data-figure]").map((dd) => textInto(dd, dd.dataset.figure, { by: "letters", stagger: 26, config: FIGURE })),
};
export const startEntrance = () => {
  heroEntrance.masthead.in(0);
  heroEntrance.id.in(180);
  heroName.in(180);
  heroEntrance.meta.forEach((m, i) => m.in(180 + 260 + i * 130));
  heroEntrance.panels.in(900);
  heroEntrance.figures.forEach((f, i) => f.in(900 + i * 90));
  heroEntrance.actions.in(1500);
};

/* The menu sheet — on <body>, never inside the transformed masthead. */
export const sheet = $("#sheet");
export const burger = $("#burger");
export const sheetItems = $$("#sheet-list li").map((li) => {
  const s = new Spring({ o: 0, y: 0.75 }, { config: ITEM, onChange: (v) => { li.style.opacity = v.o; li.style.transform = `translateY(${v.y}rem)`; } });
  return s;
});
export let sheetOpen = false;
export const sheetFade = new Spring({ o: 0 }, {
  config: SHEET,
  onChange: (v) => { sheet.style.opacity = v.o; },
  onRest: (v) => { if (v.o <= 0.001 && !sheetOpen) sheet.hidden = true; },
});
export const openSheet = () => {
  if (sheetOpen) return;
  sheetOpen = true;
  sheet.hidden = false;
  sheetFade.start({ o: 1 });
  sheetItems.forEach((s, i) => { s.set({ o: 0, y: 0.75 }); s.start({ o: 1, y: 0 }, { delay: 120 + i * 55 }); });
  lenis?.stop();
  document.documentElement.classList.add("menu-open");
  burger.setAttribute("aria-expanded", "true");
  $("#sheet-close").focus();
};
export const closeSheet = () => {
  if (!sheetOpen) return;
  sheetOpen = false;
  sheetFade.start({ o: 0 });
  lenis?.start();
  document.documentElement.classList.remove("menu-open");
  burger.setAttribute("aria-expanded", "false");
  burger.focus();
};
burger.addEventListener("click", openSheet);
$("#sheet-close").addEventListener("click", closeSheet);
$("#sheet-logo").addEventListener("click", closeSheet);
$$("#sheet-list a").forEach((a) => a.addEventListener("click", closeSheet));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
mq("(min-width: 1280px)").addEventListener("change", (e) => { if (e.matches) closeSheet(); });

/* ==========================================================================
   LOADING VEIL
   ========================================================================== */
export const CLEAR_MS = 430;
export const PAUSE_MS = 240;
export const LIFT_TIMEOUT_MS = 3000;
export const veil = $("#veil");
export const veilFill = $("#veil-fill");
export const veilMeterFill = $("#veil-meter-fill");
export const veilProgress = new Spring({ p: 0 }, {
  config: PROGRESS_WAIT,
  onChange: (v) => {
    veilFill.style.transform = `scaleY(${v.p})`;
    veilMeterFill.style.transform = `scaleX(${v.p})`;
  },
});
veilProgress.start({ p: 0.7 });
rise($("#veil-name"), { y: 0.6, config: LABEL }).in(260);
export let veilReady = false;
export const loaderReady = () => {
  if (veilReady) return;
  veilReady = true;
  veil.style.pointerEvents = "none";
  veilProgress.start({ p: 1 }, { config: PROGRESS_READY });
  const content = $("#veil-content");
  const meter = $("#veil-meter");
  new Spring({ o: 1, y: 0 }, {
    config: CLEAR,
    onChange: (v) => { content.style.opacity = v.o; content.style.transform = `translateY(${v.y}rem)`; meter.style.opacity = v.o; },
  }).start({ o: 0, y: -0.75 });
  setTimeout(() => {
    veil.setAttribute("aria-label", "Loaded");
    new Spring({ o: 1 }, { config: VEIL, onChange: (v) => { veil.style.opacity = v.o; } }).start({ o: 0 });
    startEntrance();
    scene?.beginRise();
    // Remove only when the *rendered* opacity is gone — never on a timer alone.
    let removed = false;
    const remove = () => { if (removed) return; removed = true; stopPoll(); veil.remove(); };
    const stopPoll = subscribe(() => { if (parseFloat(getComputedStyle(veil).opacity) <= 0.004) remove(); });
    setTimeout(remove, LIFT_TIMEOUT_MS);
  }, CLEAR_MS + PAUSE_MS);
};

/* ==========================================================================
   2 — THE HERO SCENE WRAPPER
   ========================================================================== */
export const COVERED_AFTER = 1.15;
export const heroSection = $("#hero");
export const heroWrap = $("#hero-canvas-wrap");
export const heroCanvas = $("#hero-canvas");
export const fitBox = $("#hero-fit");
export const coarseQ = mq("(hover: none) and (pointer: coarse)");
export let scene = null;

export const heroFallback = () => {
  heroWrap.style.display = "none";
  const fb = $("#hero-fallback");
  if (fb.classList.contains("on")) return;
  fb.classList.add("on");
  const lines = document.createElement("img");
  lines.className = "fb-lines";
  lines.alt = "";
  loadImg(lines, "hero/ui/backdrop-lines.svg");
  const person = document.createElement("img");
  person.className = "fb-person";
  person.alt = "";
  loadImg(person, "hero/scene/person-diffuse.webp");
  fb.append(lines, person);
  const placePerson = () => {
    const s = heroSection.getBoundingClientRect();
    if (fitBox.offsetParent !== null) {
      const b = fitBox.getBoundingClientRect();
      person.style.top = `${b.top - s.top}px`;
      person.style.height = `${b.height}px`;
      person.style.bottom = "auto";
    } else {
      person.style.top = "";
      person.style.height = "";
      person.style.bottom = "";
    }
  };
  placePerson();
  onResize(placePerson);
};

try {
  scene = new HeroScene(heroCanvas);
} catch (error) {
  console.error(error);
  scene = null;
}

if (!scene) {
  heroFallback();
  loaderReady();
} else {
  scene.onReady = loaderReady;
  scene.onError = (error) => {
    reportAssetError(error?.url ?? String(error?.message ?? error));
    scene = null;
    heroFallback();
    loaderReady();
  };

  const applyFit = () => {
    if (!scene) return;
    const s = heroSection.getBoundingClientRect();
    const boxShown = fitBox.offsetParent !== null;
    const b = boxShown ? fitBox.getBoundingClientRect() : null;
    scene.setParams({
      ...DEFAULT_PARAMS,
      ...(b ? fitSubjectToBox(DEFAULT_PARAMS, { top: b.top - s.top, height: b.height }, heroWrap.clientHeight) : null),
      ...(mq("(max-width: 1023px)").matches ? { bgRevealOpacity: 0 } : null),
      ...(mq("(hover: none)").matches ? { autoSweepAmount: 0.76 } : null),
      ...(mq("(max-width: 639px)").matches ? { sweepRadius: 0.95, sweepWarp: 0.18, autoSweepAmount: 0.55 } : null),
      ...(scene.tier.reveal ? null : { autoSweepAmount: 0 }),
    });
  };

  const onPointer = (e) => {
    scene?.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };
  let pointerBound = false;
  const bindPointer = (on) => {
    if (on && !pointerBound) window.addEventListener("pointermove", onPointer, { passive: true });
    if (!on && pointerBound) window.removeEventListener("pointermove", onPointer);
    pointerBound = on;
  };
  bindPointer(scene.tier.pointerEnabled);

  let lastW = heroWrap.clientWidth;
  let lastCoarse = coarseQ.matches;
  scene.resize(heroWrap.clientWidth, heroWrap.clientHeight);
  applyFit();

  let roQueued = false;
  const onContainer = () => {
    if (!scene) return;
    const w = heroWrap.clientWidth;
    const h = heroWrap.clientHeight;
    const coarse = coarseQ.matches;
    const widthChanged = w !== lastW;
    const classChanged = coarse !== lastCoarse;
    if (!widthChanged && !classChanged && coarse) return; // the iOS URL bar
    if (widthChanged || classChanged) {
      const tier = scene.retune();
      bindPointer(tier.pointerEnabled);
    }
    lastW = w;
    lastCoarse = coarse;
    scene.resize(w, h);
    applyFit();
  };
  new ResizeObserver(() => {
    if (roQueued) return;
    roQueued = true;
    requestAnimationFrame(() => { roQueued = false; onContainer(); });
  }).observe(heroWrap);
  coarseQ.addEventListener("change", onContainer);

  // Hero is sticky — its rect never leaves the viewport, so the scroll read is the gate.
  let heroVisible = true;
  let heroFrames = 10;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; heroFrames = 10; }).observe(heroSection);
  subscribe((time) => {
    if (!scene) return;
    if (document.hidden) return;
    if (window.scrollY > window.innerHeight * COVERED_AFTER) return;
    if (!heroVisible && --heroFrames <= 0) return;
    scene.update(time);
  }, () => scene?.tier.frameInterval ?? 0);
}
