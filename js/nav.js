// In-page navigation. Every nav link (masthead, menu sheet, footer) points at a
// block's id; this scrolls there through Lenis.
//
// The first three blocks are sticky, so a pinned block's rect is where it is
// *stuck*, not where it starts. Its scroll position is worked out from the
// stack instead: the stack's top plus the heights of the layers before it.
import { lenis, REDUCED } from "./engine.js";

const scrollTargetOf = (el) => {
  if (el.id === "hero") return 0;
  const layer = el.closest("[data-layer]");
  if (layer) {
    const stack = layer.parentElement;
    let y = stack.getBoundingClientRect().top + window.scrollY;
    for (let s = stack.firstElementChild; s && s !== layer; s = s.nextElementSibling) y += s.offsetHeight;
    return y;
  }
  return el.getBoundingClientRect().top + window.scrollY;
};

document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute("href");
  if (id.length < 2) return;
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  // Let the menu sheet finish closing (it re-enables Lenis) before scrolling.
  requestAnimationFrame(() => {
    const y = scrollTargetOf(target);
    if (lenis) lenis.scrollTo(y, { duration: 1.6 });
    else window.scrollTo({ top: y, behavior: REDUCED ? "auto" : "smooth" });
    history.replaceState(null, "", id);
  });
});
