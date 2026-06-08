/**
 * Generates schema/cognitive-state.schema.json from the Zod source.
 * Run via: bun schema/scripts/gen-json-schema.ts
 *
 * The JSON Schema is a committed artifact referenced by the Claude Code skill
 * and the training docs. Note: Zod .refine/.superRefine cross-field constraints
 * do NOT translate to JSON Schema — those are enforced at runtime by the
 * validator. The JSON Schema captures the structural contract.
 */
import { zodToJsonSchema } from "zod-to-json-schema";
import { CognitiveState } from "../src/cognitive-state.ts";

const jsonSchema = zodToJsonSchema(CognitiveState, {
  name: "CognitiveState",
  $refStrategy: "root",
});

const path = new URL("../cognitive-state.schema.json", import.meta.url);
await Bun.write(path, JSON.stringify(jsonSchema, null, 2) + "\n");
console.log("✓ wrote schema/cognitive-state.schema.json");
console.log("  (cross-field Grounding-Contract constraints are enforced at runtime by @latent/validator)");
