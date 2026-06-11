/** Live playback — latent is a PROCESS, not a one-shot output.
 *
 *  Two hooks, one mechanism:
 *
 *  `useLatentStream` consumes a stream of StreamingEvents — live (a subscribe
 *  function fed by a real agent) or prerecorded (an event array with `at`
 *  offsets) — and folds them through @latent/schema's reducer into the
 *  currently-forming CognitiveState.
 *
 *  `useLatentClock` is the prerecorded special case for canned demos: it
 *  turns a CognitiveState's `steps` into a pure clock-driven playback where
 *  everything (visible nodes, current phase, tool-call stream, settledness)
 *  derives from one number. `stateToEvents` (schema) is the bridge proving
 *  the equivalence: canned steps ARE a prerecorded event stream.
 *
 *  Pacing comes from @latent/tokens `playback` — the single source of timing.
 *  Playback starts when the surface scrolls into view; prefers-reduced-motion
 *  lands on the settled end state. */
import { useEffect, useRef, useState } from "react";
import type { CognitiveState, StreamingEvent } from "@latent/schema";
import { applyEvent } from "@latent/schema";
import { playback } from "@latent/tokens";
import { useStrings } from "./i18n.ts";

export interface PlaybackOpts {
  /** ms per narrative phase; defaults to tokens `playback.stepMs` */
  stepMs?: number;
  /** settle beat after the last phase, ms; defaults to tokens `playback.tailMs` */
  tailMs?: number;
}

/** The control surface shared by clock and stream playback (what LiveControls needs). */
export interface PlaybackControls {
  playing: boolean;
  done: boolean;
  toggle: () => void;
  replay: () => void;
  skip: () => void;
}

export interface LatentClock extends PlaybackControls {
  /** attach to the surface's root so playback starts in view */
  ref: (el: HTMLElement | null) => void;
  /** index of the current phase (clamped) */
  stepIdx: number;
  /** node ids revealed so far (undefined once done = show all) */
  visibleNodeIds: string[] | undefined;
  /** tool calls revealed so far */
  toolCallCount: number;
}

/** Start-in-view + reduced-motion plumbing shared by both hooks. */
function useViewportStart(live: boolean, reduce: boolean) {
  const [playing, setPlaying] = useState(false);
  const el = useRef<HTMLElement | null>(null);
  const started = useRef(false);

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

  return { playing, setPlaying, el, started };
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------- the clock */

export function useLatentClock(state: CognitiveState, enabled: boolean, opts: PlaybackOpts = {}): LatentClock {
  const stepDur = (opts.stepMs ?? playback.stepMs) / 1000;
  const tail = (opts.tailMs ?? playback.tailMs) / 1000;
  const steps = state.steps ?? [];
  const total = steps.length * stepDur + tail;
  const live = enabled && steps.length > 0;

  const reduce = prefersReducedMotion();
  const [clock, setClock] = useState(() => (!live || reduce ? total : 0));
  const { playing, setPlaying, el, started } = useViewportStart(live, reduce);

  const done = clock >= total;
  useEffect(() => {
    if (!playing || done) return;
    const id = setInterval(() => setClock((c) => Math.min(total, c + 0.1)), 100);
    return () => clearInterval(id);
  }, [playing, done, total]);

  const revealed = Math.min(steps.length, Math.floor(clock / stepDur) + 1);
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

/* ------------------------------------------------------------ the stream */

/**
 * A stream source: either a prerecorded event array (scheduled by their `at`
 * offsets — e.g. the output of `stateToEvents`), or a live subscribe function
 * that an agent backend feeds; it may return an unsubscribe cleanup.
 */
export type LatentStreamSource =
  | StreamingEvent[]
  | ((emit: (e: StreamingEvent) => void) => (() => void) | void);

export interface LatentStream extends PlaybackControls {
  /** attach to the surface's root so prerecorded playback starts in view */
  ref: (el: HTMLElement | null) => void;
  /** the understanding as formed so far (null before stream.init) */
  state: CognitiveState | null;
  /** current narrative phase, if any `phase` events have arrived */
  phase: { label: string; hint: string } | null;
  /** reducer rejection of an incoherent event, if any */
  error: string | null;
}

/**
 * Consume a stream of understanding-forming events. Prerecorded sources get
 * the full transport (pause/replay/skip, start-in-view, reduced-motion lands
 * settled); live sources accumulate as events arrive — transport is inert.
 */
export function useLatentStream(source: LatentStreamSource, opts: PlaybackOpts = {}): LatentStream {
  const prerecorded = Array.isArray(source);
  const tailMs = opts.tailMs ?? playback.tailMs;
  const endMs = prerecorded ? Math.max(0, ...source.map((e) => e.at ?? 0)) + tailMs : Infinity;

  const reduce = prefersReducedMotion();
  const [clockMs, setClockMs] = useState(() => (prerecorded && reduce ? endMs : 0));
  const { playing, setPlaying, el, started } = useViewportStart(prerecorded, reduce);
  const [liveEvents, setLiveEvents] = useState<StreamingEvent[]>([]);

  // live subscription
  useEffect(() => {
    if (prerecorded) return;
    const unsub = (source as Exclude<LatentStreamSource, StreamingEvent[]>)(
      (e) => setLiveEvents((evs) => [...evs, e]),
    );
    return () => { if (typeof unsub === "function") unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prerecorded]);

  // prerecorded transport
  const done = prerecorded ? clockMs >= endMs : false;
  useEffect(() => {
    if (!prerecorded || !playing || done) return;
    const id = setInterval(() => setClockMs((c) => Math.min(endMs, c + 100)), 100);
    return () => clearInterval(id);
  }, [prerecorded, playing, done, endMs]);

  // fold events incrementally — never re-reduce the applied prefix
  const folded = useRef<{
    idx: number;
    state: CognitiveState | null;
    phase: LatentStream["phase"];
    error: string | null;
  }>({ idx: 0, state: null, phase: null, error: null });
  const events = prerecorded
    ? (source as StreamingEvent[]).filter((e) => (e.at ?? 0) <= clockMs)
    : liveEvents;
  if (events.length < folded.current.idx)
    folded.current = { idx: 0, state: null, phase: null, error: null }; // replay
  while (folded.current.idx < events.length) {
    const e = events[folded.current.idx]!;
    try {
      folded.current.state = applyEvent(folded.current.state, e);
      if (e.type === "phase") folded.current.phase = { label: e.label, hint: e.hint };
    } catch (err) {
      // skip the incoherent event, keep forming
      folded.current.error ??= err instanceof Error ? err.message : String(err);
    }
    folded.current.idx++;
  }

  const settledLive = !prerecorded && folded.current.state?.outcome != null;
  return {
    ref: (n) => (el.current = n),
    state: folded.current.state,
    phase: folded.current.phase,
    error: folded.current.error,
    playing: prerecorded ? playing && !done : !settledLive,
    done: prerecorded ? done : settledLive,
    toggle: () => prerecorded && setPlaying((p) => !p),
    replay: () => {
      if (!prerecorded) return;
      started.current = true;
      setClockMs(0);
      setPlaying(true);
    },
    skip: () => prerecorded && setClockMs(endMs),
  };
}

/** The small live-status cluster: pulsing dot · current phase · ⏸/↻/⏭. */
export function LiveControls({ clockState, label }: { clockState: PlaybackControls; label?: string }) {
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
