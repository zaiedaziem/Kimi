// Entry point. Module order is evaluation order — the same order the page was written in.
import "./assets.js";
import { resizers } from "./engine.js";
import "./stack.js";
import "./sections/hero.js";
import "./effects/chequered-dissolve.js";
import "./effects/contours.js";
import "./sections/season.js";
import "./sections/timeline.js";
import "./sections/paddock.js";
import "./sections/extras.js";
import "./sections/footer.js";
import "./nav.js";

/* Fonts change metrics: re-layout once they land. */
document.fonts?.ready.then(() => { for (const fn of resizers) fn(); });
