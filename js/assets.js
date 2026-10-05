// Asset base URL, the visible failure banner, and <img>/mask loading.
import { $$ } from "./engine.js";

export const ASSET_BASE_URL = "https://storage.getlayers.ai/assets/kimi-04a9449ab2";
export const asset = (path) => `${ASSET_BASE_URL}/${path}`;

/* A failed asset load must be visible. */
export class AssetError extends Error {
  constructor(url) { super(`Failed to load ${url}`); this.url = url; }
}
export const reported = new Set();
export const reportAssetError = (url) => {
  if (reported.has(url)) return;
  reported.add(url);
  const line = document.createElement("div");
  line.textContent = `Asset failed to load: ${url}`;
  document.getElementById("asset-errors").appendChild(line);
  console.error(`[asset] failed: ${url}`);
};

/* ---------- assets on <img> and masks ---------- */
export const loadImg = (img, path) => {
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  const url = asset(path);
  img.addEventListener("error", () => reportAssetError(url), { once: true });
  img.src = url;
};
$$("img[data-src]").forEach((img) => loadImg(img, img.dataset.src));
export const maskAsset = (prop, path) => {
  const url = asset(path);
  document.documentElement.style.setProperty(prop, `url("${url}")`);
  const probe = new Image();
  probe.crossOrigin = "anonymous";
  probe.onerror = () => reportAssetError(url);
  probe.src = url;
};
maskAsset("--helmet-mask", "hero/ui/helmet-mask.png");
maskAsset("--logo-mask", "footer/logo-mask.png");
