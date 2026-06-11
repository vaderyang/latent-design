/**
 * The Grounding Contract, tested from both sides:
 *   • every gold example must pass,
 *   • every negative fixture must be rejected (one per hard constraint),
 *   • --exec must actually distinguish a true verifiable claim from a false one.
 */
import { describe, expect, test } from "bun:test";
import { Glob } from "bun";
import { reExecProvenance, validateCognitiveState } from "../src/index.ts";

const ROOT = new URL("../../", import.meta.url).pathname;

async function collect(pattern: string): Promise<string[]> {
  const out: string[] = [];
  for await (const f of new Glob(pattern).scan(ROOT)) out.push(f);
  return out.sort();
}

async function load(rel: string): Promise<unknown> {
  return JSON.parse(await Bun.file(ROOT + rel).text());
}

describe("gold examples", async () => {
  const files = await collect("examples/**/*.json");
  test("there are gold examples", () => expect(files.length).toBeGreaterThan(0));
  for (const f of files) {
    test(`${f} passes the contract`, async () => {
      const res = validateCognitiveState(await load(f));
      expect(res.issues).toEqual([]);
      expect(res.ok).toBe(true);
    });
  }
});

describe("negative fixtures — one per hard constraint", async () => {
  const files = await collect("validator/fixtures/negative/*.json");
  test("there are negative fixtures", () => expect(files.length).toBeGreaterThan(0));
  for (const f of files) {
    test(`${f} is rejected`, async () => {
      const res = validateCognitiveState(await load(f));
      expect(res.ok).toBe(false);
      expect(res.issues.length).toBeGreaterThan(0);
    });
  }
});

describe("--exec re-execution makes 'verifiable' mean something", () => {
  test("a true verifiable claim re-executes cleanly", async () => {
    const res = validateCognitiveState(await load("validator/fixtures/exec/reexec-passes.json"));
    expect(res.ok).toBe(true);
    const runs = await reExecProvenance(res.data!, { cwd: ROOT });
    expect(runs.length).toBeGreaterThan(0);
    expect(runs.every((r) => r.ok)).toBe(true);
  });

  test("a confabulated 'verifiable' claim is exposed on re-execution", async () => {
    const res = validateCognitiveState(await load("validator/fixtures/exec/reexec-fails.json"));
    expect(res.ok).toBe(true); // contract-valid — structure alone cannot catch it
    const runs = await reExecProvenance(res.data!, { cwd: ROOT });
    expect(runs.some((r) => !r.ok)).toBe(true);
  });
});
