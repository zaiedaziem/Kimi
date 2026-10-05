// The sticky stack — the covered block recedes and darkens.
import { $, $$, mq, onResize } from "./engine.js";

/* ==========================================================================
   THE STICKY STACK
   ========================================================================== */
export const RECEDE_SCALE = 0.9;
export const RECEDE_SHADE = 0.55;
export const stackLayers = [...$$("[data-layer]"), $("[data-layer-last]")];
export const pinned = $$("[data-layer]").map((layer, i) => ({
  inner: $(".layer-inner", layer),
  shade: $(".layer-shade", layer),
  next: stackLayers[i + 1],
}));
export const phoneQ = mq("(max-width: 639px)");
export const applyRecede = () => {
  const view = window.innerHeight || 1;
  const shrink = phoneQ.matches ? 0 : 1 - RECEDE_SCALE;
  for (const { inner, shade, next } of pinned) {
    const p = Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / view));
    inner.style.transform = p > 0 && shrink > 0 ? `scale(${1 - shrink * p})` : "";
    inner.style.willChange = p > 0 && shrink > 0 ? "transform" : "";
    shade.style.opacity = `${RECEDE_SHADE * p}`;
    inner.style.visibility = p >= 1 ? "hidden" : "visible";
  }
};
export let recedeQueued = false;
window.addEventListener("scroll", () => {
  if (recedeQueued) return;
  recedeQueued = true;
  requestAnimationFrame(() => { recedeQueued = false; applyRecede(); });
}, { passive: true });
onResize(applyRecede);
applyRecede();
export const covered = (el) => el.closest(".layer-inner")?.style.visibility === "hidden";
