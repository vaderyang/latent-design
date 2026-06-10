/** Colour-vision-deficiency audit for the three Latent themes.
 *  Simulates protanopia / deuteranopia / tritanopia (Machado 2009, severity 1.0)
 *  plus achromatopsia (luminance only), then measures pairwise CIELAB ΔE between
 *  the epistemic hues of each theme, and WCAG contrast vs the theme background.
 *  Run: bun site/scripts/cvd-audit.ts */

type RGB = [number, number, number];

// The SHIPPED palette (packages/tokens/tokens.css) — keep in sync; this script
// is the regression check that no epistemic pair collapses under CVD.
// Lightness-separated open/inflection + light-theme hypo/refuted split were
// chosen so every chromatic-CVD pair stays ΔE≥15 (achromatopsia is mitigated
// by the language's non-colour redundancy instead).
const THEMES: Record<string, { bg: string; colors: Record<string, string> }> = {
  dark: {
    bg: "#0C1119",
    colors: { grounded: "#E7B45C", hypothesis: "#54C7C0", open: "#8F79C2", inflection: "#82A7F2", refuted: "#5C6B7A" },
  },
  light: {
    bg: "#F4F7FB",
    colors: { grounded: "#8A5E0E", hypothesis: "#0A6661", open: "#5B47A6", inflection: "#4E7BE0", refuted: "#75818F" },
  },
  kami: {
    bg: "#F5EEDB",
    colors: { grounded: "#8A5D10", hypothesis: "#235B5E", open: "#5E4A88", inflection: "#4D74C9", refuted: "#7A7360" },
  },
};

// Machado et al. 2009, severity 1.0 (applied in linear RGB)
const SIM: Record<string, number[][]> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

const hex = (s: string): RGB => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const lin = (c: number) => {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
};
const delin = (x: number) => {
  const v = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(1, v)) * 255;
};

function simulate(rgb: RGB, kind: string): RGB {
  const l: number[] = rgb.map(lin);
  if (kind === "achromatopsia") {
    const y = 0.2126 * l[0]! + 0.7152 * l[1]! + 0.0722 * l[2]!;
    return [delin(y), delin(y), delin(y)] as RGB;
  }
  if (kind === "none") return rgb;
  const m = SIM[kind]!;
  const out = m.map((row) => row[0]! * l[0]! + row[1]! * l[1]! + row[2]! * l[2]!);
  return [delin(out[0]!), delin(out[1]!), delin(out[2]!)] as RGB;
}

// sRGB → CIELAB (D65)
function lab(rgb: RGB): [number, number, number] {
  const [r, g, b] = rgb.map(lin) as [number, number, number];
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(X), f(Y), f(Z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
const dE = (a: RGB, b: RGB) => {
  const [l1, a1, b1] = lab(a);
  const [l2, a2, b2] = lab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
};
const lum = (rgb: RGB) => {
  const [r, g, b] = rgb.map(lin) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: RGB, b: RGB) => {
  const [hi, lo] = [Math.max(lum(a), lum(b)), Math.min(lum(a), lum(b))];
  return (hi + 0.05) / (lo + 0.05);
};

const KINDS = ["none", "protanopia", "deuteranopia", "tritanopia", "achromatopsia"];
let warnings = 0;

for (const [theme, { bg, colors }] of Object.entries(THEMES)) {
  console.log(`\n━━ ${theme.toUpperCase()} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  const names = Object.keys(colors);
  for (const kind of KINDS) {
    const sim: Record<string, RGB> = {};
    for (const n of names) sim[n] = simulate(hex(colors[n]!), kind);
    const bgSim = simulate(hex(bg), kind);
    const pairs: string[] = [];
    for (let i = 0; i < names.length; i++)
      for (let j = i + 1; j < names.length; j++) {
        const d = dE(sim[names[i]!]!, sim[names[j]!]!);
        if (d < 20) {
          const flag = d < 12 ? "✗✗" : "⚠";
          pairs.push(`${flag} ${names[i]}↔${names[j]} ΔE=${d.toFixed(0)}`);
          warnings++;
        }
      }
    const lowContrast = names
      .map((n) => [n, contrast(sim[n]!, bgSim)] as const)
      .filter(([, c]) => c < 3)
      .map(([n, c]) => `${n} vs bg ${c.toFixed(1)}:1`);
    const label = kind.padEnd(14);
    if (pairs.length === 0 && lowContrast.length === 0) {
      console.log(`  ${label} ✓ all pairs ΔE≥20, all ≥3:1 on bg`);
    } else {
      console.log(`  ${label} ${[...pairs, ...lowContrast.map((s) => `△ ${s}`)].join(" · ")}`);
    }
  }
}

console.log(`\n${warnings} pair-warning(s) total. ΔE<20 = hard to tell apart at small sizes; ΔE<12 = effectively identical.`);
console.log("Non-colour redundancy in the language: kind/state badge text, refuted = dashed border + strikethrough,");
console.log("open = italic, inflection = ↻ prefix + position. Colour is never the only channel.");
