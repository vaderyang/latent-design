/** Capture the README hero shot: from the "Invert the visual hierarchy" section
 *  down to (but not including) the Grounding Contract section.
 *  Run: bun site/scripts/shot-inversion.ts [url] [outfile] */
import { chromium } from "playwright";

const url = process.argv[2] ?? "https://latent-design.pages.dev/?theme=light&lang=en";
const out = process.argv[3] ?? "docs/assets/the-inversion.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1240, height: 1600 }, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle" });

// neutralize scroll-triggered fades + the fixed toggles, so the clip is clean
await page.addStyleTag({
  content: ".fade{opacity:1!important;transform:none!important} .chrome-toggles{display:none!important}",
});
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

const clip = await page.evaluate(() => {
  const sections = [...document.querySelectorAll("section")];
  const find = (text: string) => sections.find((s) => [...s.querySelectorAll("h2")].some((h) => h.textContent?.includes(text)));
  const start = find("Invert the visual hierarchy");
  const last = find("Three zones, one proportion"); // the section right before the Grounding Contract
  if (!start || !last) return null;
  const a = start.getBoundingClientRect();
  const b = last.getBoundingClientRect();
  const x = Math.max(0, a.left - 24);
  return { x, y: a.top + window.scrollY - 8, width: Math.min(window.innerWidth - x, a.width + 48), height: b.bottom - a.top - 4 };
});
if (!clip) {
  console.error("✗ could not locate the section boundaries");
  process.exit(1);
}

await page.screenshot({ path: out, clip, fullPage: true });
await browser.close();
console.log(`✓ wrote ${out} (${Math.round(clip.width)}×${Math.round(clip.height)} @2x)`);
