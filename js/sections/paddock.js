// 4 — From the paddock: report, panels, calendar strip.
import { $, px, SVG_NS, easeOutQuad, REVEAL, FIGURE, COPY_FAST, NAME, rise, fade, drawIn, textInto, buildHead, forward, inViewLoop, scrub } from "../engine.js";
import { loadImg } from "../assets.js";

/* ==========================================================================
   5 — FROM THE PADDOCK
   ========================================================================== */
export const paddock = $("#paddock");
{
  const head = buildHead($("#pd-title"), { stopColor: "var(--accent)" });
  forward($("#pd-title"), () => head.in(), () => head.out());

  const report = textInto($("#pd-report"), "A composed drive through a difficult weekend secured another podium — and kept Kimi at the top of the championship.", { by: "words", stagger: 30, config: COPY_FAST, gap: "0.22em" });
  const cta = rise($("#pd-cta"), { y: 0.75 });
  forward($("#pd-report"), () => { report.in(2 * 130 + 90); cta.in(2 * 130 + 260); }, () => { report.out(); cta.out(); });

  const pdMove = $("#pd-move");
  scrub(paddock, "top_bottom", "bottom_top", (v) => { pdMove.style.top = px(-48 * v); });

  /* The two panels. */
  const u = (n) => `calc(var(--u) * ${n})`;
  const columnRight = `calc(2.2222cqw + ${u(12)})`;
  const columnLeft = `calc(100% - ${columnRight} - ${u(193)})`;
  const FRAME_RIGHT = "calc(100% - 2.2222cqw)";
  const FRAME_LEFT = `calc(100% - 2.2222cqw - ${u(193)} - ${u(25)})`;
  const bracketSet = ({ left, right, top, bottom, size = u(10), stretch = "0px", color = null }) => {
    const set = document.createElement("div");
    set.className = "brk-set";
    if (color) set.style.color = color;
    const sp = "var(--bracket-spread, 0px)";
    const corners = [
      { l: `calc(${left} - ${sp})`, t: `calc(${top} - ${sp})`, r: 270 },
      { l: `calc(${right} - ${size} + ${sp})`, t: `calc(${top} - ${sp})`, r: 0 },
      { l: `calc(${right} - ${size} + ${sp})`, t: `calc(${bottom} - ${size} + ${sp} + ${stretch})`, r: 90 },
      { l: `calc(${left} - ${sp})`, t: `calc(${bottom} - ${size} + ${sp} + ${stretch})`, r: 180 },
    ];
    for (const c of corners) {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "brk");
      svg.setAttribute("viewBox", "0 0 10.5 10.5");
      svg.setAttribute("aria-hidden", "true");
      svg.style.left = c.l;
      svg.style.top = c.t;
      svg.style.width = size;
      svg.style.height = size;
      svg.style.transform = `rotate(${c.r}deg)`;
      svg.innerHTML = `<path d="M0 0.5H10V10.5"/>`;
      set.appendChild(svg);
    }
    return set;
  };
  const panels = $("#pd-panels");
  const meetFrame = bracketSet({
    left: `var(--meet-frame-left, ${FRAME_LEFT})`, right: `var(--meet-frame-right, ${FRAME_RIGHT})`,
    top: `var(--meet-frame-top, ${u(32)})`, bottom: `var(--meet-frame-bottom, ${u(105)})`,
  });
  const meet = document.createElement("div");
  meet.className = "pd-meet";
  meet.style.left = `var(--meet-left, ${columnLeft})`;
  meet.style.top = `var(--meet-top, ${u(43)})`;
  meet.innerHTML = `<b>hungarian gp</b><span>silverstone</span><span>july 12, 2026</span>`;
  const statsDrop = "var(--stats-drop, 0px)";
  const statsFrame = bracketSet({
    left: `var(--stats-frame-left, ${FRAME_LEFT})`, right: `var(--stats-frame-right, ${FRAME_RIGHT})`,
    top: `calc(${u(137)} + ${statsDrop} + var(--stats-frame-drop, 0px))`, bottom: `calc(${u(535)} + ${statsDrop})`,
    stretch: "var(--stats-stretch, 0px)",
  });
  const stats = document.createElement("div");
  stats.className = "pd-stats";
  stats.style.left = `var(--stats-left, calc(100% - ${columnRight} - ${u(193)}))`;
  stats.style.top = `calc(${u(147)} + ${statsDrop})`;
  const STAT_ROWS = [
    { icon: "flag", label: "last result", figure: "P4" },
    { icon: "bars", label: "points gained", figure: "+12" },
    { icon: "trophy", label: "championship", figure: "P1" },
    { icon: "gauge", label: "points", figure: "118" },
  ];
  const statAnims = [];
  STAT_ROWS.forEach((s, i) => {
    let ruleAnim = null;
    if (i > 0) {
      const ruleEl = document.createElement("div");
      ruleEl.className = "pd-rule";
      stats.appendChild(ruleEl);
      ruleAnim = drawIn(ruleEl);
    }
    const row = document.createElement("div");
    row.className = "pd-stat";
    row.innerHTML = `<img alt="" aria-hidden="true"><div><div class="lbl">${s.label}</div><div class="fig"></div></div>`;
    loadImg($("img", row), `paddock/icon-${s.icon}.svg`);
    const fig = textInto($(".fig", row), s.figure, { by: "letters", stagger: 24, config: FIGURE });
    stats.appendChild(row);
    statAnims.push({ rule: ruleAnim, row: rise(row, { y: 0.75 }), fig });
  });
  panels.append(meetFrame, meet, statsFrame, stats);
  const MEET_DELAY = 320, STATS_DELAY = 460, ROW_STAGGER = 90;
  const meetFrameFade = fade(meetFrame);
  const meetRise = rise(meet, { y: 0.75 });
  const statsFrameFade = fade(statsFrame);
  forward(meet, () => {
    meetFrameFade.in(MEET_DELAY);
    meetRise.in(410);
    statsFrameFade.in(STATS_DELAY);
    statAnims.forEach((a, i) => {
      const at = STATS_DELAY + i * ROW_STAGGER;
      a.rule?.in(at);
      a.row.in(at + 40);
      a.fig.in(at + 120);
    });
  }, () => {
    meetFrameFade.out(); meetRise.out(); statsFrameFade.out();
    statAnims.forEach((a) => { a.rule?.out(); a.row.out(); a.fig.out(); });
  });

  /* The calendar strip. */
  const CARD_DELAY = 560, CARD_STAGGER = 90, PULSE_MS = 3200, PULSE_REACH = 3.4, CRAWL_MS = 5200, BRACKET_SPREAD = 5;
  const cal = $("#cal");
  const spread = (x) => `calc(50% + ${px(x - 720)} * var(--cal-spread, 1))`;
  const LINKS = [{ x: 416, width: 126 }, { x: 580, width: 128 }, { x: 743, width: 136 }, { x: 914, width: 124 }];
  const ROUNDS = [
    { round: "round 11", name: "austrian gp", date: "29 jun", x: 347, w: 100, marker: "p6" },
    { round: "round 12", name: "british gp", date: "12 jul", x: 511, w: 100, marker: "p4" },
    { round: "round 13", name: "belgian gp", date: "27 jul", x: 675, w: 100, marker: "live" },
    { round: "round 14", name: "hungarian gp", date: "03 aug", x: 839, w: 114, marker: "ring" },
    { round: "round 15", name: "dutch gp", date: "31 aug", x: 1017, w: 76, marker: "ring" },
  ];
  const LIVE_INDEX = 2;
  const drop = "var(--cal-mark-drop, 0px)";
  const linkEls = LINKS.map((l, i) => {
    const el = document.createElement("div");
    el.className = "cal-link";
    el.setAttribute("aria-hidden", "true");
    el.style.left = spread(l.x);
    el.style.width = `calc(${px(l.width)} * var(--cal-spread, 1))`;
    el.style.top = `calc(${px(131.5)} + ${drop})`;
    el.style.backgroundImage = `repeating-linear-gradient(to right, var(--foreground-on-dark-muted) 0 ${px(7)}, transparent ${px(7)} ${px(11.45)})`;
    cal.appendChild(el);
    return { el, dir: i < LIVE_INDEX ? 1 : -1, anim: drawIn(el, { config: REVEAL }) };
  });
  const cards = ROUNDS.map((r, i) => {
    const card = document.createElement("div");
    card.className = `cal-card${r.marker === "live" ? " live" : ""}${i < 2 ? " early" : ""}`;
    card.style.left = `calc(${spread(r.x + r.w / 2)} - ${px(r.w / 2)})`;
    card.style.top = `calc(${px(43)} + var(--cal-card-drop, 0px))`;
    card.style.width = `var(--cal-card-w, ${px(r.w)})`;
    card.innerHTML = `<span class="round"></span><span class="name"></span><span class="date"></span>`;
    $(".round", card).textContent = r.round;
    $(".name", card).textContent = r.name;
    $(".date", card).textContent = r.date;
    cal.appendChild(card);
    const markEl = document.createElement("div");
    markEl.className = "cal-mark";
    markEl.setAttribute("aria-hidden", "true");
    markEl.style.left = spread(r.x + r.w / 2);
    markEl.style.top = `calc(${px(126)} + ${drop})`;
    markEl.style.height = px(11);
    markEl.style.transform = "translateX(-50%)";
    if (r.marker === "live") {
      markEl.innerHTML = `<svg viewBox="0 0 11 11"><circle class="cal-pulse" cx="5.5" cy="5.5" r="5.5" fill="none" stroke-width="1" vector-effect="non-scaling-stroke" style="stroke:var(--accent)" opacity="0"/><circle cx="5.5" cy="5.5" r="5.5" style="fill:var(--accent)"/></svg>`;
    } else if (r.marker === "ring") {
      markEl.innerHTML = `<svg viewBox="0 0 11 11"><circle cx="5.5" cy="5.5" r="5" fill="none" stroke-width="1" vector-effect="non-scaling-stroke" style="stroke:var(--foreground-on-dark)"/></svg>`;
    } else {
      markEl.innerHTML = `<span class="res">${r.marker}</span>`;
    }
    cal.appendChild(markEl);
    return {
      card,
      rise: rise(card, { y: 0.5 }),
      name: rise($(".name", card), { y: 0.3, unit: "em", config: NAME }),
      mark: fade(markEl),
    };
  });
  const liveSet = bracketSet({
    left: spread(669), right: spread(781),
    top: `calc(${px(32)} + var(--bracket-drop, 0px))`, bottom: `calc(${px(113)} + var(--bracket-drop, 0px))`,
    size: px(10), stretch: "var(--live-stretch, 0px)", color: "var(--accent)",
  });
  liveSet.classList.add("cal-live");
  liveSet.style.opacity = "";
  cal.appendChild(liveSet);
  const liveFade = fade(liveSet);
  const liveCard = cards[LIVE_INDEX].card;
  liveCard.addEventListener("mouseenter", () => cal.style.setProperty("--bracket-spread", px(BRACKET_SPREAD)));
  liveCard.addEventListener("mouseleave", () => cal.style.removeProperty("--bracket-spread"));

  forward(cal, () => {
    linkEls.forEach((l, i) => l.anim.in(CARD_DELAY + i * CARD_STAGGER));
    cards.forEach((c, i) => {
      const at = CARD_DELAY + i * CARD_STAGGER;
      c.rise.in(at);
      c.name.in(at + 110);
      c.mark.in(at + 60);
    });
    liveFade.in(CARD_DELAY + 5 * CARD_STAGGER);
  }, null, { rootMargin: "0% 0% -20% 0%", once: true });

  // Crawling connectors and the live pulse, paused off screen.
  const pulse = $(".cal-pulse", cal);
  const start = performance.now();
  inViewLoop(cal, () => {
    const now = performance.now() - start;
    const crawl = (now % CRAWL_MS) / CRAWL_MS;
    const period = (paddock.clientWidth * 11.45) / 1440;
    for (const l of linkEls) l.el.style.backgroundPositionX = `${l.dir * crawl * period}px`;
    const v = easeOutQuad((now % PULSE_MS) / PULSE_MS);
    pulse.setAttribute("r", `${5.5 + v * 5.5 * PULSE_REACH}`);
    pulse.setAttribute("opacity", `${0.5 * (1 - v) * (1 - v)}`);
  });
}
