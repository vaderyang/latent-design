/** StreamingDemo — how the Latent language handles LLM streaming.
 *
 *  The lesson is the layout itself: the RAW stream (tokens / tool calls) flows
 *  fast in the peripheral activity strip, while the UNDERSTANDING forms on the
 *  primary plane through meaningful, animated commits — not a token river.
 *
 *  Motion vocabulary doubles as streaming dynamics:
 *    Surface (a lead appears) · Sink (one is dropped) · Pulse (a change of mind)
 *    · Settle (the answer resolves from a "forming" placeholder).
 *
 *  In production these events arrive from a stream (node.add / confidence.update
 *  / refute / inflection / outcome.settle). Here they're a scripted choreography
 *  so the dynamics are visible. Respects prefers-reduced-motion. */
import { useEffect, useRef, useState } from "react";

type Lead = { id: string; text: string; sunk?: boolean; sinkNote?: string };

const ACTIVITY = [
  "alert_ingest · P99 12ms→340ms",
  "topology_resolve · 6 hops · 3 backends",
  "pcap_slice · 18.2GB → 2.1M pkt",
  "dns_check · resp <2ms · 0 retrans",
  "align_timestamps · PCAP ⟷ safepoint.log",
  "connpool_probe · backlog 12→53",
  "query_safepoint · STW 280ms × 7",
  "retrans_align · 滞后于延迟尖峰",
];

export default function StreamingDemo() {
  const [status, setStatus] = useState("正在理解你的问题…");
  const [done, setDone] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [inflect, setInflect] = useState<string | null>(null);
  const [answer, setAnswer] = useState<{ text: string; cert: string } | null>(null);
  const [act, setAct] = useState<string[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const k = reduce ? 0.5 : 1;
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms * k));

    // reset
    setStatus("正在理解你的问题…");
    setDone(false);
    setLeads([]);
    setInflect(null);
    setAnswer(null);
    setAct([]);

    // raw stream (peripheral) — fast, ephemeral
    ACTIVITY.forEach((line, i) => at(250 + i * 360, () => setAct((a) => [...a, line].slice(-5))));

    // understanding — meaningful commits
    at(700, () => setLeads([{ id: "a", text: "可能是上游 DNS 解析抖动" }]));
    at(1300, () => setLeads((l) => [...l, { id: "b", text: "也可能是目标网段 TCP 重传" }]));
    at(2200, () =>
      setLeads((l) => l.map((x) => (x.id === "a" ? { ...x, sunk: true, sinkNote: "排除：DNS 响应 <2ms、零重传" } : x))),
    );
    at(3000, () => {
      setStatus("我改了主意…");
      setInflect("重传滞后于延迟尖峰 → 它是症状，不是病因。注意力转向应用层。");
    });
    at(3900, () => {
      setLeads((l) => l.filter((x) => x.id !== "b"));
      setAnswer({ text: "根因：instance-7 的 GC 长停顿，引发连接池排队。", cert: "比较确定" });
      setStatus("已得出判断");
      setDone(true);
    });

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [runId]);

  return (
    <div className="stream">
      {/* answer slot — reserved up top, "forming" until it settles */}
      <div className="stream-answer-wrap">
        <div className="p-label">
          我的判断{answer && <span className="certainty firm"><span className="cdot" />{answer.cert}</span>}
        </div>
        {answer ? (
          <div className="stream-answer settle-in">{answer.text}</div>
        ) : (
          <div className="stream-answer forming">
            <span className="shimmer">正在判断你的问题，先别急着信我…</span>
          </div>
        )}
      </div>

      {/* the understanding forming */}
      <div className="stream-think">
        <div className="p-label">
          <span className={`sdot ${done ? "done" : "live"}`} /> {status}
        </div>
        {leads.map((l) => (
          <div key={l.id} className={`lead surface-in${l.sunk ? " sunk" : ""}`}>
            {l.text}
            {l.sinkNote && <span className="sink-note"> — {l.sinkNote}</span>}
          </div>
        ))}
        {inflect && (
          <div className="lead inflect pulse-in">
            <b>我改了主意：</b>
            {inflect}
          </div>
        )}
      </div>

      {/* RAW stream — peripheral, fast, ephemeral */}
      <div className="stream-raw">
        <div className="zhead">· 原始流 · token / 工具调用（外围 · 转瞬即逝）</div>
        <div className="raw-lines">
          {act.map((line, i) => (
            <div key={i} className="raw-line" style={{ opacity: 0.4 + (i / act.length) * 0.6 }}>
              {line}
            </div>
          ))}
          {!done && <span className="cursor" />}
        </div>
      </div>

      <button className="ibtn" onClick={() => setRunId((n) => n + 1)} style={{ marginTop: 16 }}>
        ↻ 重放
      </button>
    </div>
  );
}
