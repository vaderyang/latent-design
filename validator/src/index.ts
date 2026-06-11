/** @latent/validator — programmatic API. */
import { CognitiveState } from "@latent/schema";

export interface ValidationResult {
  ok: boolean;
  issues: { path: string; message: string }[];
  /** the parsed instance when ok — lets callers (e.g. --exec) reuse the parse */
  data?: CognitiveState;
}

/** Validate a parsed value against the CognitiveState contract. */
export function validateCognitiveState(value: unknown): ValidationResult {
  const r = CognitiveState.safeParse(value);
  if (r.success) return { ok: true, issues: [], data: r.data };
  return {
    ok: false,
    issues: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  };
}

export interface ReExecResult {
  nodeId: string;
  cmd: string;
  ok: boolean;
  exitCode: number | null;
  /** trailing output, for the report */
  tail: string;
}

/** Collect every verifiable provenance in an instance: (nodeId, reExecCmd). */
export function collectReExecCmds(state: CognitiveState): { nodeId: string; cmd: string }[] {
  const out: { nodeId: string; cmd: string }[] = [];
  for (const n of state.nodes) {
    const prov = n.state === "grounded" || n.state === "hypothesis" ? n.provenance : undefined;
    if (prov?.mode === "verifiable" && prov.reExecCmd) out.push({ nodeId: n.id, cmd: prov.reExecCmd });
  }
  return out;
}

/**
 * Actually re-execute every verifiable provenance command — the only check
 * that makes "verifiable" mean something. Each command runs through the
 * shell with a timeout; success = exit 0.
 */
export async function reExecProvenance(
  state: CognitiveState,
  opts: { cwd?: string; timeoutMs?: number } = {},
): Promise<ReExecResult[]> {
  const { cwd = process.cwd(), timeoutMs = 30_000 } = opts;
  const results: ReExecResult[] = [];
  for (const { nodeId, cmd } of collectReExecCmds(state)) {
    const proc = Bun.spawn(["sh", "-c", cmd], { cwd, stdout: "pipe", stderr: "pipe" });
    const timer = setTimeout(() => proc.kill(), timeoutMs);
    let exitCode: number | null = null;
    let tail = "";
    try {
      exitCode = await proc.exited;
      const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
      tail = (out + err).trim().split("\n").slice(-3).join("\n");
    } catch (e) {
      tail = String(e);
    } finally {
      clearTimeout(timer);
    }
    results.push({ nodeId, cmd, ok: exitCode === 0, exitCode, tail });
  }
  return results;
}
