/**
 * Generates packages/tokens/tokens.json from the typed token source.
 * Run via: bun packages/tokens/scripts/gen-tokens-json.ts
 * The JSON is a committed artifact referenced by the Claude Code skill and docs.
 */
import { epistemic, depth, ink, type, motion, layout, flatTokens } from "../src/index.ts";

const out = {
  $comment:
    "Generated from @latent/tokens/src/index.ts — do not edit by hand. Color encodes epistemic state.",
  epistemic: Object.fromEntries(
    Object.entries(epistemic).map(([k, v]) => [k, { base: v.base, dim: v.dim, line: v.line, note: v.note }]),
  ),
  depth,
  ink,
  type,
  motion: Object.fromEntries(
    Object.entries(motion).map(([k, v]) => [k, { keyframes: v.keyframes, dur: v.dur, easing: v.easing, means: v.means }]),
  ),
  layout,
  flat: flatTokens,
};

const path = new URL("../tokens.json", import.meta.url);
await Bun.write(path, JSON.stringify(out, null, 2) + "\n");
console.log(`✓ wrote ${Object.keys(flatTokens).length} flat tokens → packages/tokens/tokens.json`);
