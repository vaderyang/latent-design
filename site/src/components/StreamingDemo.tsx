/** StreamingDemo — how the Latent language handles LLM streaming.
 *
 *  The lesson is the layout itself: the RAW stream (tokens / tool calls) flows
 *  fast in the peripheral activity strip, while the UNDERSTANDING forms on the
 *  primary plane through meaningful, animated commits — not a token river.
 *
 *  This surface is driven by the REAL event pipeline: a prerecorded
 *  StreamingEvent[] (the exact vocabulary a live agent emits — node.add /
 *  node.refute / phase / outcome.settle …) folded through @latent/schema's
 *  reducer by useLatentStream. Everything rendered derives from stream.state;
 *  in production you pass a live subscribe function instead of the array.
 *  Respects prefers-reduced-motion (lands settled). */
import { useEffect, useMemo, useRef } from "react";
import { useLang, useLatentStream } from "@latent/react";
import type { StreamingEvent } from "@latent/schema";

/* The prerecorded stream — bilingual; telemetry stays mono/untranslated.
   Exported so the build can hold it to the Grounding Contract (validateStream). */
export function buildEvents(zh: boolean): StreamingEvent[] {
  const t = zh
    ? {
        task: "P99 12ms→340ms — 为什么？",
        thinking: "正在理解你的问题…",
        changed: "我改了主意…",
        done: "已得出判断",
        leadA: "可能是上游 DNS 解析抖动",
        falsifyA: "DNS 响应时延正常、无重传，即可排除",
        leadB: "也可能是目标网段 TCP 重传",
        falsifyB: "若重传滞后于延迟尖峰，则它是症状而非病因",
        sinkA: "排除：DNS 响应 <2ms、零重传",
        sinkB: "重传滞后于延迟尖峰——是症状，不是病因",
        inflectFrom: "网络层假设",
        inflectTo: "应用层（GC / 连接池）",
        inflectWhy: "重传滞后于延迟尖峰 → 它是症状，不是病因。注意力转向应用层。",
        answer: "根因：instance-7 的 GC 长停顿，引发连接池排队。",
        evStw: "STW 280ms × 7 与尖峰窗口对齐",
        evBacklog: "连接池积压 12→53",
        outcome: "根因：instance-7 的 GC 长停顿，引发连接池排队。",
      }
    : {
        task: "P99 12ms→340ms — why?",
        thinking: "Reading your question…",
        changed: "I changed my mind…",
        done: "Reached a read",
        leadA: "Could be upstream DNS resolution jitter",
        falsifyA: "Normal DNS response times with zero retransmits would rule this out",
        leadB: "Could also be TCP retransmits on the target subnet",
        falsifyB: "If retransmits lag the latency spike, they are a symptom, not the cause",
        sinkA: "Ruled out: DNS responses <2ms, zero retransmits",
        sinkB: "Retransmits lag the latency spike — a symptom, not the cause",
        inflectFrom: "network-layer hypotheses",
        inflectTo: "the application layer (GC / connection pool)",
        inflectWhy: "Retransmits lag the latency spike → they're a symptom, not the cause. Attention shifts to the application layer.",
        answer: "Root cause: a long GC pause on instance-7 backs up the connection pool.",
        evStw: "STW 280ms × 7 aligned with the spike window",
        evBacklog: "connection-pool backlog 12→53",
        outcome: "Root cause: a long GC pause on instance-7 backs up the connection pool.",
      };

  const telemetry: [string, string][] = [
    ["alert_ingest", "P99 12ms→340ms"],
    ["topology_resolve", "6 hops · 3 backends"],
    ["pcap_slice", "18.2GB → 2.1M pkt"],
    ["dns_check", "resp <2ms · 0 retrans"],
    ["align_timestamps", "PCAP ⟷ safepoint.log"],
    ["connpool_probe", "backlog 12→53"],
    ["query_safepoint", "STW 280ms × 7"],
    ["retrans_align", zh ? "滞后于延迟尖峰" : "lags the latency spike"],
  ];

  const events: StreamingEvent[] = [
    { type: "stream.init", at: 0, schemaVersion: "0.2", latentLevel: "mid", persona: "operator", task: { title: t.task } },
    { type: "phase", at: 0, label: t.thinking, hint: "", visibleNodeIds: [] },
    { type: "primitive.add", at: 0, primitive: { id: "op:stw", kind: "tool-result", label: "STW 280ms × 7" } },
    { type: "primitive.add", at: 0, primitive: { id: "op:backlog", kind: "tool-result", label: "backlog 12→53" } },
    ...telemetry.map<StreamingEvent>(([fn, summary], i) => ({
      type: "toolcall.add",
      at: 250 + i * 360,
      call: { id: `tc:${i}`, ts: "—", fn, summary, producedPrimitives: [] },
    })),
    {
      type: "node.add",
      at: 700,
      node: { id: "n:dns", title: t.leadA, state: "hypothesis", confidence: { value: 0.45, source: "self_report" }, evidence: [], falsification: t.falsifyA },
    },
    {
      type: "node.add",
      at: 1300,
      node: { id: "n:tcp", title: t.leadB, state: "hypothesis", confidence: { value: 0.5, source: "self_report" }, evidence: [], falsification: t.falsifyB },
    },
    { type: "node.refute", at: 2200, nodeId: "n:dns", reason: t.sinkA },
    { type: "phase", at: 3000, label: t.changed, hint: "" },
    {
      type: "node.add",
      at: 3000,
      node: {
        id: "n:turn",
        title: t.inflectWhy,
        state: "inflection",
        inflectKind: "refutation",
        from: t.inflectFrom,
        to: t.inflectTo,
        rationale: t.inflectWhy,
        affects: ["n:tcp"],
      },
    },
    { type: "node.refute", at: 3400, nodeId: "n:tcp", reason: t.sinkB },
    {
      type: "node.add",
      at: 3900,
      node: {
        id: "n:gc",
        title: t.answer,
        state: "grounded",
        confidence: { value: 0.86, source: "self_consistency" },
        evidence: [
          { id: "e:stw", label: t.evStw, primitives: ["op:stw"], polarity: "supports" },
          { id: "e:backlog", label: t.evBacklog, primitives: ["op:backlog"], polarity: "supports" },
        ],
        provenance: {
          mode: "asserted",
          steps: [
            { toolCallId: "tc:6", observed: "STW 280ms × 7", primitives: ["op:stw"] },
            { toolCallId: "tc:5", observed: "backlog 12→53", primitives: ["op:backlog"] },
          ],
        },
      },
    },
    { type: "phase", at: 3900, label: t.done, hint: "" },
    { type: "outcome.settle", at: 3900, outcome: { nodeId: "n:gc", text: t.outcome } },
  ];
  return events;
}

export default function StreamingDemo() {
  const zh = useLang() === "zh";
  const t = zh
    ? { cert: "比较确定", label: "我的判断", forming: "正在判断你的问题，先别急着信我…", inflectPrefix: "我改了主意：", rawHead: "· 原始流 · token / 工具调用（外围 · 转瞬即逝）", replay: "↻ 重放" }
    : { cert: "fairly sure", label: "My read", forming: "Still working out your question — don't take my word yet…", inflectPrefix: "I changed my mind: ", rawHead: "· raw stream · tokens / tool calls (peripheral · ephemeral)", replay: "↻ Replay" };

  const events = useMemo(() => buildEvents(zh), [zh]);
  const stream = useLatentStream(events);

  // a language toggle swaps the prerecorded stream — replay it in the new language
  const firstLang = useRef(true);
  useEffect(() => {
    if (firstLang.current) {
      firstLang.current = false;
      return;
    }
    stream.replay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zh]);

  const s = stream.state;
  const nodes = s?.nodes ?? [];
  const leads = nodes.filter((n) => n.state === "hypothesis" || n.state === "refuted");
  const inflect = nodes.find((n) => n.state === "inflection");
  const answer = s?.outcome ?? null;
  const rawLines = (s?.toolCalls ?? []).slice(-5).map((c) => `${c.fn} · ${c.summary ?? ""}`);
  const done = answer != null;

  return (
    <div className="stream" ref={stream.ref}>
      {/* answer slot — reserved up top, "forming" until it settles */}
      <div className="stream-answer-wrap">
        <div className="p-label">
          {t.label}
          {answer && (
            <span className="certainty firm">
              <span className="cdot" />
              {t.cert}
            </span>
          )}
        </div>
        {answer ? (
          <div className="stream-answer settle-in">{answer.text}</div>
        ) : (
          <div className="stream-answer forming">
            <span className="shimmer">{t.forming}</span>
          </div>
        )}
      </div>

      {/* the understanding forming — straight from the reduced stream state */}
      <div className="stream-think">
        <div className="p-label">
          <span className={`sdot ${done ? "done" : "live"}`} /> {stream.phase?.label ?? ""}
        </div>
        {leads.map((n) => (
          <div key={n.id} className={`lead surface-in${n.state === "refuted" ? " sunk" : ""}`}>
            {n.title}
            {n.state === "refuted" && <span className="sink-note"> — {n.reason}</span>}
          </div>
        ))}
        {inflect && inflect.state === "inflection" && (
          <div className="lead inflect pulse-in">
            <b>{t.inflectPrefix}</b>
            {inflect.rationale}
          </div>
        )}
      </div>

      {/* RAW stream — peripheral, fast, ephemeral */}
      <div className="stream-raw">
        <div className="zhead">{t.rawHead}</div>
        <div className="raw-lines">
          {rawLines.map((line, i) => (
            <div key={i} className="raw-line" style={{ opacity: 0.4 + (i / Math.max(1, rawLines.length)) * 0.6 }}>
              {line}
            </div>
          ))}
          {!done && <span className="cursor" />}
        </div>
      </div>

      <button className="ibtn" onClick={stream.replay} style={{ marginTop: 16 }}>
        {t.replay}
      </button>
    </div>
  );
}
