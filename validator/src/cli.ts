#!/usr/bin/env bun
/**
 * latent-validate — validate CognitiveState JSON instances against the
 * Grounding Contract.
 *
 *   bun validator/src/cli.ts examples/traceforge.json
 *   bun validator/src/cli.ts "examples/*.json"      # quote to let the CLI glob
 *   bun run validate examples/*.json                # shell expands the glob
 *   bun validator/src/cli.ts --exec corpus/*.json   # also RE-EXECUTE every
 *                                                   # verifiable reExecCmd
 *
 * Exit codes:
 *   0  all files pass
 *   1  contract violation(s) (valid JSON, failed the Grounding Contract or --exec)
 *   2  no files matched
 *   3  structural error(s) — unreadable / invalid JSON
 */
import { Glob } from "bun";
import { reExecProvenance, validateCognitiveState } from "./index.ts";

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

const argv = Bun.argv.slice(2);
const exec = argv.includes("--exec");
const files = await expand(argv.filter((a) => !a.startsWith("--")));
if (files.length === 0) {
  console.error(C.amber("no files matched."));
  process.exit(2);
}

let contractFailures = 0;
let structuralFailures = 0;
console.log(C.bold(`\n  Latent · Grounding Contract validator${exec ? "  (--exec: re-running verifiable provenance)" : ""}\n`));

for (const file of files) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await Bun.file(file).text());
  } catch (e) {
    structuralFailures++;
    console.log(`  ${C.red("✗")} ${file} ${C.dim("— invalid JSON")}`);
    console.log(`      ${C.red(String(e))}`);
    continue;
  }

  const res = validateCognitiveState(parsed);
  if (!res.ok) {
    contractFailures++;
    console.log(`  ${C.red("✗")} ${file} ${C.dim(`— ${res.issues.length} contract violation(s)`)}`);
    for (const i of res.issues) {
      console.log(`      ${C.amber(i.path || "(root)")}  ${i.message}`);
    }
    continue;
  }

  if (!exec) {
    console.log(`  ${C.green("✓")} ${file}`);
    continue;
  }

  const runs = await reExecProvenance(res.data!);
  const failed = runs.filter((r) => !r.ok);
  if (failed.length === 0) {
    console.log(`  ${C.green("✓")} ${file} ${C.dim(`— ${runs.length} verifiable command(s) re-executed`)}`);
  } else {
    contractFailures++;
    console.log(`  ${C.red("✗")} ${file} ${C.dim(`— ${failed.length}/${runs.length} reExecCmd(s) failed`)}`);
    for (const r of failed) {
      console.log(`      ${C.amber(r.nodeId)}  ${C.dim("$")} ${r.cmd} ${C.red(`(exit ${r.exitCode})`)}`);
      if (r.tail) console.log(C.dim(r.tail.split("\n").map((l) => `        ${l}`).join("\n")));
    }
  }
}

const total = files.length;
const failures = contractFailures + structuralFailures;
const passed = total - failures;
console.log(
  `\n  ${failures === 0 ? C.green(`${passed}/${total} pass`) : C.red(`${failures}/${total} fail`)}` +
    C.dim("  · only falsifiable, evidence-anchored cognition is admitted.\n"),
);
process.exit(structuralFailures > 0 ? 3 : contractFailures > 0 ? 1 : 0);
