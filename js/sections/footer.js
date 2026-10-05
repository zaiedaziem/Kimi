// 5 — Keep pushing forward.
import { $, $$, px, ROW, rise, fade, splitText, srOnly, buildHead, forward, scrub } from "../engine.js";

/* ==========================================================================
   6 — KEEP PUSHING FORWARD (footer)
   ========================================================================== */
export const footer = $("#footer");
{
  const head = buildHead($("#ft-title"));
  const logo = fade($("#ft-logo"));
  const NAV = [["driver", "/driver"], ["season", "/season"], ["journal", "/journal"], ["next race", "/next-race"], ["store", "/store"]];
  const nav = $("#ft-nav");
  const navRuns = NAV.map(([label, href]) => {
    const a = document.createElement("a");
    a.href = href;
    a.className = "hover-accent";
    const run = splitText(label, { by: "letters", stagger: 22, config: ROW, gap: "0.2em", className: "te-nowrap" });
    a.append(srOnly(label), run.el);
    a.insertAdjacentHTML("beforeend", `<svg class="ft-arrow" viewBox="0 0 13.71 10.71" aria-hidden="true"><path d="M0 5.35H13M8 10.35L13 5.35L8 0.35"/></svg>`);
    nav.appendChild(a);
    return run;
  });
  const NAV_DELAY = 260, NAV_STAGGER = 80, FOOT_DELAY = 640;
  const foot = $$(".ft-foot", footer).map((el) => rise(el, { y: 0.75 }));
  forward(footer, () => {
    head.in();
    logo.in(120);
    navRuns.forEach((r, i) => r.in(NAV_DELAY + i * NAV_STAGGER));
    foot.forEach((f, i) => f.in(FOOT_DELAY + i * 80));
  }, () => {
    head.out(); logo.out(); navRuns.forEach((r) => r.out()); foot.forEach((f) => f.out());
  }, { rootMargin: "0% 0% -20% 0%" });

  const ftMove = $("#ft-move");
  scrub(footer, "top_bottom", "bottom_bottom", (v) => { ftMove.style.top = px(60 * (1 - v)); });
}
