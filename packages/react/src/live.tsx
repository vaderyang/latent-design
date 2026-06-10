/** Live playback — latent is a PROCESS, not a one-shot output.
 *
 *  `useLatentClock` turns a CognitiveState's `steps` into a pure clock-driven
 *  playback: everything (visible nodes, current phase, tool-call stream,
 *  whether the outcome has settled) derives from one number. Pause / replay /
 *  skip are clock operations. Playback starts when the surface scrolls into
 *  view; prefers-reduced-motion lands on the settled end state. */
import { useEffect, useRef, useState } from "react";
import type { CognitiveState } from "@latent/schema";
import { useStrings } from "./i18n.ts";

const STEP_DUR = 3.4; // seconds per phase
const TAIL = 1.1; // settle beat after the last phase

export interface LatentClock {
  /** attach to the surface's root so playback starts in view */
  ref: (el: HTMLElement | null) => void;
  playing: boolean;
  done: boolean;
  /** index of the current phase (clamped) */
  stepIdx: number;
  /** node ids revealed so far (undefined once done = show all) */
  visibleNodeIds: string[] | undefined;
  /** tool calls revealed so far */
  toolCallCount: number;
  toggle: () => void;
  replay: () => void;
  skip: () => void;
}

export function useLatentClock(state: CognitiveState, enabled: boolean): LatentClock {
  const steps = state.steps ?? [];
  const total = steps.length * STEP_DUR + TAIL;
  const live = enabled && steps.length > 0;

  const reduce =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [clock, setClock] = useState(() => (!live || reduce ? total : 0));
  const [playing, setPlaying] = useState(false);
  const el = useRef<HTMLElement | null>(null);
  const started = useRef(false);

  // start once scrolled into view
  useEffect(() => {
    if (!live || reduce || started.current) return;
    const node = el.current;
    if (!node) {
      setPlaying(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          started.current = true;
          setPlaying(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [live, reduce]);

  const done = clock >= total;
  useEffect(() => {
    if (!playing || done) return;
    const id = setInterval(() => setClock((c) => Math.min(total, c + 0.1)), 100);
    return () => clearInterval(id);
  }, [playing, done, total]);

  const revealed = Math.min(steps.length, Math.floor(clock / STEP_DUR) + 1);
  const stepIdx = Math.max(0, revealed - 1);
  const visibleNodeIds = done
    ? undefined
    : [...new Set(steps.slice(0, revealed).flatMap((s) => s.visibleNodeIds ?? []))];
  const toolCallCount = done
    ? state.toolCalls.length
    : Math.ceil((clock / total) * state.toolCalls.length);

  return {
    ref: (n) => (el.current = n),
    playing: playing && !done,
    done,
    stepIdx,
    visibleNodeIds,
    toolCallCount,
    toggle: () => setPlaying((p) => !p),
    replay: () => {
      started.current = true;
      setClock(0);
      setPlaying(true);
    },
    skip: () => setClock(total),
  };
}

/** The small live-status cluster: pulsing dot · current phase · ⏸/↻/⏭. */
export function LiveControls({ clockState, label }: { clockState: LatentClock; label?: string }) {
  const t = useStrings();
  const { playing, done, toggle, replay, skip } = clockState;
  return (
    <span className={`live-ctl${done ? " done" : ""}`}>
      <span className="ldot" />
      <span className="llab">{done ? t.live.settled : label ?? t.live.forming}</span>
      {!done && (
        <button type="button" onClick={toggle} title={playing ? t.live.pause : t.live.play}>
          {playing ? "⏸" : "▶"}
        </button>
      )}
      <button type="button" onClick={replay} title={t.live.replay}>↻</button>
      {!done && (
        <button type="button" onClick={skip} title={t.live.skip}>⏭</button>
      )}
    </span>
  );
}
