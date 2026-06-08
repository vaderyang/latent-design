/**
 * @latent/tokens — the design tokens of Latent · 潜, as typed values.
 *
 * These mirror tokens.css (the authoritative CSS custom-property block lifted
 * from DESIGN_LANGUAGE.html). Color encodes an epistemic state; type splits into
 * three voices; motion narrates depth (surface / settle / sink / pulse).
 *
 * Consumed by: docs tables, the skill's tokens.json, and any programmatic use.
 * The CSS variables in tokens.css remain the source of truth for rendering.
 */

/** Bathymetric depth — elevation = rising toward the surface. */
export const depth = {
  d900: "#080B11",
  d850: "#0A0E15",
  d800: "#0C1119",
  d700: "#101824",
  d600: "#15202E",
  d550: "#1A2735",
  d500: "#1F2E3F",
  line: "rgba(126,158,190,.12)",
  line2: "rgba(126,158,190,.20)",
} as const;

/** Ink — cognitive text, recessive to luminous. */
export const ink = {
  i100: "#ECF1F7",
  i200: "#CBD6E2",
  i300: "#A6B4C4",
  i400: "#8B99AC",
  i500: "#74859A",
  i600: "#5C6E82",
} as const;

/**
 * Epistemic palette — each hue is a cognitive state, not a decoration.
 * `dim` = fill, `line` = border, base = text/accent.
 */
export const epistemic = {
  grounded: { base: "#E7B45C", dim: "rgba(231,180,92,.15)", line: "rgba(231,180,92,.40)", note: "已锚定 · 高置信" },
  hypothesis: { base: "#54C7C0", dim: "rgba(84,199,192,.13)", line: "rgba(84,199,192,.38)", note: "在押 · 探查中" },
  open: { base: "#9C8CCB", dim: "rgba(156,140,203,.13)", line: "rgba(156,140,203,.35)", note: "未决 · 诚实未知" },
  inflection: { base: "#6E93DD", dim: "rgba(110,147,221,.16)", line: "rgba(110,147,221,.45)", note: "改主意/啊哈 · 提示色（值得注意，非错误）" },
  refuted: { base: "#5C6B7A", dim: "rgba(92,107,122,.10)", line: "rgba(126,158,190,.12)", note: "已沉降 · 被推翻（保留可审计）" },
  activity: { base: "#6E7C8E", dim: "rgba(76,90,105,.18)", line: "rgba(126,158,190,.12)", note: "工具/动作 · 刻意低调" },
} as const;

/** Maps an EpistemicState (schema) to its epistemic palette key. */
export const stateColor = {
  grounded: "grounded",
  hypothesis: "hypothesis",
  open: "open",
  inflection: "inflection",
  refuted: "refuted",
} as const;

/**
 * Three voices. Cognition speaks in serif (it should look deliberated);
 * evidence reads in mono (it should look like verifiable instrument output).
 */
export const type = {
  voice: "'Fraunces','Noto Serif SC',Georgia,'Songti SC',serif",
  ui: "'Hanken Grotesk','Noto Sans SC',system-ui,-apple-system,sans-serif",
  mono: "'IBM Plex Mono','Noto Sans Mono',ui-monospace,monospace",
} as const;

/**
 * Motion narrates epistemic-state transitions — never mere decoration.
 * Keyframe bodies live in @latent/react styles; these record the contract.
 */
export const motion = {
  surface: { keyframes: "surface", dur: "3.2s", easing: "ease-in-out", means: "新理解从深处浮现，由模糊转清晰（出现 = 浮向水面）" },
  settle: { keyframes: "settle", dur: "3s", easing: "ease-in-out", means: "假设积累证据、提升为结论：字距收紧，青转金" },
  sink: { keyframes: "sink", dur: "3.2s", easing: "ease-in-out", means: "被推翻的假设下沉、去饱和、折叠——但不删除（可审计）" },
  pulse: { keyframes: "pulse", dur: "2.6s", easing: "ease-in-out", means: "改主意/啊哈拐点短促闪一下蓝光（提示色，值得注意非错误）——latent 中最忠实的部分" },
  surfaceIn: { keyframes: "surfaceIn", dur: ".5s", easing: "cubic-bezier(.2,.7,.2,1)", means: "新内容入场（理解态步进）" },
} as const;

/** Layout. */
export const layout = { maxWidth: "1080px" } as const;

/**
 * A flat token map (dot-namespaced keys) for machine-readable consumers
 * (the skill's tokens.json, docs reference tables). Kept in lockstep with the
 * structured exports above.
 */
export const flatTokens: Record<string, string> = {
  "depth.d900": depth.d900, "depth.d850": depth.d850, "depth.d800": depth.d800,
  "depth.d700": depth.d700, "depth.d600": depth.d600, "depth.d550": depth.d550,
  "depth.d500": depth.d500, "depth.line": depth.line, "depth.line2": depth.line2,
  "ink.100": ink.i100, "ink.200": ink.i200, "ink.300": ink.i300,
  "ink.400": ink.i400, "ink.500": ink.i500, "ink.600": ink.i600,
  "epistemic.grounded": epistemic.grounded.base,
  "epistemic.hypothesis": epistemic.hypothesis.base,
  "epistemic.open": epistemic.open.base,
  "epistemic.inflection": epistemic.inflection.base,
  "epistemic.refuted": epistemic.refuted.base,
  "epistemic.activity": epistemic.activity.base,
  "type.voice": type.voice, "type.ui": type.ui, "type.mono": type.mono,
  "layout.maxWidth": layout.maxWidth,
};

export type EpistemicKey = keyof typeof epistemic;
