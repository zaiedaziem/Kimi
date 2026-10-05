// 3 — From karts to F1: rows, parallax, rail.
import { $, REDUCED, px, onResize, YEAR, COPY, YEAR_SETTLE, TRIGGER, Spring, rise, textInto, buildHead, forward, scrub } from "../engine.js";
import { loadImg } from "../assets.js";
import { TIMELINE, ROW_HEIGHT, PLATE_WIDTH, PARALLAX, MARK_RISE, MARK_SIZE, MARK_SIZE_NARROW, RAIL_SOLID, RAIL_GAP, RAIL_DASH, PLATE_OUTLINE, PLATE_CLIP } from "../data/timeline.js";

/* ==========================================================================
   4 — FROM KARTS TO F1 (timeline)
   ========================================================================== */
$("#plate-clip-path").setAttribute("d", PLATE_CLIP);
export const tlWrap = $("#tl-wrap");
export const tlSection = $("#timeline");
{
  const head = buildHead($("#tl-title"));
  forward($("#tl-title"), () => head.in(), () => head.out());

  const YEAR_RESTING = 0.4;
  const YEAR_HOLD = 2200;
  const rowsEls = [];

  TIMELINE.forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = `tl-row ${entry.frame} ${index % 2 ? "odd" : "even"}`;
    row.style.height = px(ROW_HEIGHT[entry.frame]);
    const plateTravel = PARALLAX.plate[entry.frame];

    // Layer 1: the plate and its year, riding the plate's parallax.
    const plateLayer = document.createElement("div");
    plateLayer.className = "tl-layer";
    const plateMove = document.createElement("div");
    plateMove.className = "tl-move";
    const plate = document.createElement("div");
    plate.className = `tl-plate ${entry.frame}`;
    plate.style.width = px(PLATE_WIDTH[entry.frame]);
    if (entry.frame === "side") plate.style[entry.align] = "var(--gutter)";
    plate.innerHTML = `
      <div class="plate-fill"><div class="plate-slot"><img alt=""></div></div>
      <svg class="plate-outline" viewBox="0 0 710.995 462.995" preserveAspectRatio="none" aria-hidden="true">
        <path d="${PLATE_OUTLINE}" fill="none" stroke-width="1" vector-effect="non-scaling-stroke" style="stroke:var(--timeline-outline)"/>
      </svg>`;
    const img = $("img", plate);
    img.alt = entry.alt;
    loadImg(img, `timeline/${entry.year}.webp`);
    const yearBox = document.createElement("div");
    yearBox.className = "tl-yearbox";
    const year = document.createElement("div");
    year.className = "tl-year";
    const yearRun = textInto(year, entry.year, { by: "letters", stagger: 26, config: YEAR });
    year.classList.add("te");
    year.style.columnGap = "0";
    yearBox.appendChild(year);
    plateMove.append(plate, yearBox);
    plateLayer.appendChild(plateMove);
    row.appendChild(plateLayer);

    // Layer 2: the copy, nearest the reader.
    let copyRise = null;
    if (entry.lead) {
      const copyLayer = document.createElement("div");
      copyLayer.className = "tl-layer";
      const copyMove = document.createElement("div");
      copyMove.className = "tl-move";
      const p = document.createElement("p");
      p.className = "tl-copy";
      p.style.width = `min(max(${px(entry.copyWidth)}, var(--copy-min-w, 0px)), var(--copy-max-w, 100vw))`;
      p.innerHTML = `<b></b> <span></span>`;
      $("b", p).textContent = entry.lead;
      $("span", p).textContent = entry.rest;
      copyMove.appendChild(p);
      copyLayer.appendChild(copyMove);
      row.appendChild(copyLayer);
      copyRise = rise(p, { y: 0.75, config: COPY });
      scrub(row, "top_bottom", "bottom_top", (v) => { copyMove.style.top = px(PARALLAX.copy * (1 - 2 * v)); });
    }

    tlWrap.appendChild(row);
    rowsEls.push(row);

    scrub(row, "top_bottom", "bottom_top", (v) => { plateMove.style.top = px(plateTravel * (1 - 2 * v)); });
    const slot = $(".plate-slot", plate);
    scrub(plate, "top_bottom", "top_center", (v) => { slot.style.top = `${-10 + 10 * v}%`; });

    // Entrance when the row enters view (once).
    const yearSettle = new Spring({ o: 1 }, { config: YEAR_SETTLE, onChange: (v) => { year.style.opacity = v.o; } });
    forward(row, () => {
      yearRun.in(0);
      copyRise?.in(220);
      if (entry.frame === "centre") yearSettle.start({ o: YEAR_RESTING }, { delay: YEAR_HOLD });
    }, null, { rootMargin: "0% 0% -25% 0%", once: true });

    // Hover dims every other row.
    if (!REDUCED) {
      plate.addEventListener("mouseenter", () => { row.classList.add("hot"); tlWrap.classList.add("dimming"); });
      plate.addEventListener("mouseleave", () => { row.classList.remove("hot"); tlWrap.classList.remove("dimming"); });
    }
  });

  // The rail.
  const rail = $("#tl-rail");
  rail.innerHTML = `<svg aria-hidden="true">
      <line class="r-solid" x1="8" x2="8" y1="0" y2="${RAIL_SOLID}" stroke-width="1" style="stroke:var(--timeline-rail)"/>
      <line class="r-dash" x1="8" x2="8" y1="${RAIL_SOLID + RAIL_GAP}" stroke-width="1" stroke-dasharray="${RAIL_DASH} ${RAIL_DASH}" style="stroke:var(--timeline-rail)"/>
      <rect class="r-run" x="7.5" y="0" width="1" height="0" style="fill:var(--foreground-on-dark)"/>
      <rect class="r-mark" style="fill:var(--foreground-on-dark)"/>
    </svg>`;
  const railSvg = $("svg", rail);
  const runRect = $(".r-run", rail);
  const mark = $(".r-mark", rail);
  const dash = $(".r-dash", rail);
  let rest = 1;
  let railP = 0;
  const drawRail = () => {
    const run = railP * rest;
    runRect.setAttribute("height", `${Math.max(0, run)}`);
    mark.setAttribute("transform", `translate(8 ${run}) rotate(${(run / rest) * 1800})`);
  };
  const layoutRail = () => {
    const unit = tlSection.clientWidth / 1440 || 1;
    const viewH = rail.clientHeight / unit;
    railSvg.setAttribute("viewBox", `0 0 16 ${viewH}`);
    const last = rowsEls[rowsEls.length - 1];
    const origin = rail.offsetTop / unit;
    rest = (last.offsetTop + last.offsetHeight / 2) / unit - MARK_RISE - origin;
    dash.setAttribute("y2", `${rest}`);
    const size = window.innerWidth < 1024 ? MARK_SIZE_NARROW : MARK_SIZE;
    mark.setAttribute("x", `${-size / 2}`);
    mark.setAttribute("y", `${-size / 2}`);
    mark.setAttribute("width", `${size}`);
    mark.setAttribute("height", `${size}`);
    drawRail();
  };
  layoutRail();
  onResize(layoutRail);
  scrub(rail, "top_center", "bottom_bottom", (p) => { railP = p; drawRail(); }, { smooth: TRIGGER });
}
