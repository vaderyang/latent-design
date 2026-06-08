#!/usr/bin/env bun
/**
 * latent-validate — validate CognitiveState JSON instances against the
 * Grounding Contract. Exits non-zero if any file fails.
 *
 *   bun validator/src/cli.ts examples/traceforge.json
 *   bun validator/src/cli.ts "examples/*.json"      # quote to let the CLI glob
 *   bun run validate examples/*.json                # shell expands the glob
 */
import { Glob } from "bun";
import { validateCognitiveState } from "./index.ts";

const C = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  amber: (s: string) => `\x1b[33m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

async function expand(args: string[]): Promise<string[]> {
  if (args.length === 0) args = ["examples/**/*.json"];
  const out = new Set<string>();
  for (const a of args) {
    if (a.includes("*")) {
      const g = new Glob(a);
      for await (const f of g.scan(".")) out.add(f);
    } else {
      out.add(a);
    }
  }
  return [...out].sort();
}

const files = await expand(Bun.argv.slice(2));
if (files.length === 0) {
  console.error(C.amber("no files matched."));
  process.exit(2);
}

let failures = 0;
console.log(C.bold(`\n  Latent · Grounding Contract validator\n`));

for (const file of files) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await Bun.file(file).text());
  } catch (e) {
    failures++;
    console.log(`  ${C.red("✗")} ${file} ${C.dim("— invalid JSON")}`);
    console.log(`      ${C.red(String(e))}`);
    continue;
  }

  const res = validateCognitiveState(parsed);
  if (res.ok) {
    console.log(`  ${C.green("✓")} ${file}`);
  } else {
    failures++;
    console.log(`  ${C.red("✗")} ${file} ${C.dim(`— ${res.issues.length} contract violation(s)`)}`);
    for (const i of res.issues) {
      console.log(`      ${C.amber(i.path || "(root)")}  ${i.message}`);
    }
  }
}

const total = files.length;
const passed = total - failures;
console.log(
  `\n  ${failures === 0 ? C.green(`${passed}/${total} pass`) : C.red(`${failures}/${total} fail`)}` +
    C.dim("  · only falsifiable, evidence-anchored cognition is admitted.\n"),
);
process.exit(failures === 0 ? 0 : 1);
