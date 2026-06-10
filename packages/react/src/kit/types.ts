/** Shared types + tiny helpers for the Latent component kit. */

/** Epistemic tone — colour always carries epistemic meaning, never decoration. */
export type Tone = "grounded" | "hypothesis" | "open" | "inflection" | "refuted" | "neutral";

/** The tone class sets the local --t / --t-dim / --t-line vars used by toned components. */
export function toneClass(tone: Tone = "neutral"): string {
  return `lk-t-${tone}`;
}

/** Join class names, dropping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
