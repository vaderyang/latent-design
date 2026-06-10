/** Live component gallery — renders the real @latent/react components so the
 *  landing page is itself a self-test of the library + schema. */
import {
  InflectionMarker,
  GroundedClaimCard,
  HypothesisCard,
  RefutedCard,
  OpenQuestionCard,
  ActivityStream,
  useLang,
} from "@latent/react";
import type {
  Inflection,
  GroundedClaim,
  Hypothesis,
  Refuted,
  OpenQuestion,
  ToolCall,
} from "@latent/schema";

export default function Gallery() {
  const zh = useLang() === "zh";

  const inflection: Inflection = {
    id: "g:inflect",
    state: "inflection",
    title: zh ? "重判" : "Reassessment",
    inflectKind: "refutation",
    from: zh ? "网络层假设（重传）" : "network-layer hypothesis (retransmits)",
    to: zh ? "应用层根因（GC 停顿）" : "application-layer root cause (GC pause)",
    rationale: zh
      ? "对齐时间戳后，重传滞后于延迟尖峰 — 重传是症状，不是病因。"
      : "After aligning timestamps, retransmits lag the latency spike — retransmits are a symptom, not the cause.",
    affects: [],
  };

  // a grounded DECISION — shows the orthogonal `kind` axis (role) on top of state (color)
  const decision: GroundedClaim = {
    id: "g:decision",
    state: "grounded",
    kind: "decision",
    title: zh
      ? "技术栈定为 Bun + Hono + SQLite，3 角色 RBAC"
      : "Stack set to Bun + Hono + SQLite, 3-role RBAC",
    confidence: { value: 0.8, source: "self_consistency" },
    evidence: [
      {
        id: "d1",
        label: zh ? "约束：轻量、可一键部署、离线优先" : "Constraints: lightweight, one-click deploy, offline-first",
        primitives: ["op:constraint"],
        polarity: "supports",
      },
      {
        id: "d2",
        label: zh ? "smoke：/health 启动通过" : "smoke: /health passes on startup",
        primitives: ["op:smoke"],
        polarity: "supports",
      },
    ],
    provenance: {
      mode: "verifiable",
      reExecCmd: "bun run dev && curl -fsS localhost:3000/health",
      steps: [
        {
          toolCallId: "tc:smoke",
          observed: zh ? "服务启动、/health 200" : "service up, /health 200",
          primitives: ["op:smoke"],
        },
      ],
    },
  };

  const grounded: GroundedClaim = {
    id: "g:grounded",
    state: "grounded",
    layer: "conclusion",
    title: zh
      ? "下游 instance-7 的 GC 长停顿，引发连接池排队"
      : "Long GC pause on downstream instance-7 backs up the connection pool",
    confidence: { value: 0.89, source: "self_consistency" },
    evidence: [
      {
        id: "e1",
        label: zh ? "延迟尖峰 ⟷ safepoint 窗口对齐" : "latency spike ⟷ safepoint window aligned",
        primitives: ["op:pcap"],
        polarity: "supports",
      },
      {
        id: "e2",
        label: zh ? "RTT inflation 仅见于该后端" : "RTT inflation seen only on this backend",
        primitives: ["op:rtt"],
        polarity: "supports",
      },
      {
        id: "e3",
        label: zh ? "连接池 backlog +340%" : "connection pool backlog +340%",
        primitives: ["op:pool"],
        polarity: "supports",
      },
    ],
    provenance: {
      mode: "verifiable",
      reExecCmd: "traceforge replay --assert root_cause=gc_pause@instance-7",
      steps: [
        { toolCallId: "tc:safepoint", observed: "STW 280ms × 7, aligned", primitives: ["op:log"] },
        { toolCallId: "tc:pool", observed: "backlog 12→53 @ instance-7", primitives: ["op:pool"] },
      ],
    },
  };

  const hypothesis: Hypothesis = {
    id: "g:hypo",
    state: "hypothesis",
    layer: "symptom",
    title: zh ? "目标网段 0.3% TCP 重传导致超时" : "0.3% TCP retransmits on the target subnet cause timeouts",
    confidence: { value: 0.34, source: "self_report" },
    evidence: [],
    falsification: zh
      ? "若重传尖峰在时间上领先延迟尖峰，则升级为病因；目前观测到滞后 → 判定为症状，已降级。"
      : "If the retransmit spike leads the latency spike in time, promote to cause; currently observed to lag → judged a symptom, demoted.",
  };

  const refuted: Refuted = {
    id: "g:refuted",
    state: "refuted",
    layer: "hypothesis",
    title: zh ? "上游 DNS 解析抖动" : "Upstream DNS resolution jitter",
    reason: zh
      ? "PCAP 显示 DNS 响应 <2ms、零重传。被推翻但保留可审计，未删除。"
      : "PCAP shows DNS responses <2ms with zero retransmits. Refuted but kept auditable, not deleted.",
    formerConfidence: 0.42,
  };

  const open: OpenQuestion = {
    id: "g:open",
    state: "open",
    layer: "hypothesis",
    title: zh ? "为何唯独 instance-7？" : "Why instance-7 alone?",
    needs: zh
      ? "是否该实例承载了某热点大客户的流量倾斜？需 query 路由权重 + 客户分片表。"
      : "Is this instance carrying skewed traffic from a hot, large customer? Need to query routing weights + the customer shard table.",
  };

  const toolCalls: ToolCall[] = [
    { id: "t1", ts: "12:04:09", fn: "alert_ingest", summary: "P99 12ms→340ms, core-pay", producedPrimitives: [] },
    {
      id: "t2",
      ts: "12:04:18",
      fn: "topology_resolve",
      summary: zh ? "6 hops, 3 微服务后端" : "6 hops, 3 microservice backends",
      producedPrimitives: [],
    },
    { id: "t3", ts: "12:04:31", fn: "pcap_slice", summary: "18.2GB → 2.1M pkt", producedPrimitives: [] },
    { id: "t4", ts: "12:04:44", fn: "dns_check", summary: "resp <2ms, 0 retrans", producedPrimitives: [] },
    { id: "t5", ts: "12:04:58", fn: "align_timestamps", summary: "PCAP⟷safepoint.log", producedPrimitives: [] },
    { id: "t6", ts: "12:05:12", fn: "connpool_probe", summary: "backlog 12→53", producedPrimitives: [] },
  ];

  return (
    <div className="comp-shell">
      <InflectionMarker node={inflection} />
      <GroundedClaimCard node={grounded} />
      <GroundedClaimCard node={decision} />
      <HypothesisCard node={hypothesis} />
      <RefutedCard node={refuted} />
      <OpenQuestionCard node={open} />
      <ActivityStream toolCalls={toolCalls} />
    </div>
  );
}
