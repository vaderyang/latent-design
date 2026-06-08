/** @latent/validator — programmatic API. */
import { CognitiveState } from "@latent/schema";

export interface ValidationResult {
  ok: boolean;
  issues: { path: string; message: string }[];
}

/** Validate a parsed value against the CognitiveState contract. */
export function validateCognitiveState(value: unknown): ValidationResult {
  const r = CognitiveState.safeParse(value);
  if (r.success) return { ok: true, issues: [] };
  return {
    ok: false,
    issues: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  };
}
