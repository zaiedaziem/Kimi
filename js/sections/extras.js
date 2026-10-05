// Next race, Store, Garage — the blocks behind the nav links the design spec
// left as routes. Same reveal vocabulary as the rest of the page: the masthead
// word by word, then everything marked [data-rise] rising in order, figures
// resolving letter by letter.
import { $, $$, REVEAL, FIGURE, rise, textInto, buildHead, forward } from "../engine.js";
import { PLATE_OUTLINE } from "../data/timeline.js";

const STAGGER = 70;
const HEAD_LEAD = 2 * 130 + 90; // after the masthead's second line, as the other blocks do

const block = (id, { stopColor } = {}) => {
  const section = $(`#${id}`);
  const head = buildHead($(".xsec-head", section), stopColor ? { stopColor } : undefined);
  const rises = $$("[data-rise]", section).map((el) => rise(el, { y: 0.75, config: REVEAL }));
  const figures = $$("[data-fig]", section).map((el) =>
    textInto(el, el.dataset.fig, { by: "letters", stagger: 26, config: FIGURE }));

  forward(section, () => {
    head.in();
    rises.forEach((r, i) => r.in(HEAD_LEAD + i * STAGGER));
    figures.forEach((f, i) => f.in(HEAD_LEAD + 200 + i * 90));
  }, () => {
    head.out();
    rises.forEach((r) => r.out());
    figures.forEach((f) => f.out());
  }, { rootMargin: "0% 0% -20% 0%" });
};

block("next-race");
block("store", { stopColor: "var(--accent)" });
block("garage");

// The garage photo wears the timeline's stepped plate outline.
$("#gr-outline").setAttribute("d", PLATE_OUTLINE);
