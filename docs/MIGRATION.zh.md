[English](MIGRATION.md) · **中文**

# 把现有 agentic UI 迁移到 Latent · 潜

你已有一个 agent 和一个渲染它工具调用的 UI。Latent 倒置这个层级：agent 的、锚定证据的*理解*占据主舞台，工具流退到边缘。本指南是从前者到后者的可操作路径。可运行的完整版本是 **`examples/adapter/adapt.ts`**——请对照阅读。

## 0. 诚实的二分

每次迁移都恰好分两半，把它们混为一谈正是 reasoning theater 溜回来的方式：

- **机械的**（确定性代码）：trace 里的工具调用 → `toolCalls[]`；工具结果和用户的原话 → `observablePrimitives[]`。一个 adapter 约 40 行就能做完。
- **认知的**（解析模型）：哪些 claim 是 *grounded*、什么被*假设*过又被*推翻*、*拐点*发生在哪、什么诚实地保持 *open*。没有任何 adapter 能从 trace 里机械地导出理解——这个判断恰恰就是设计语言要渲染的东西。

## 1. 提取 scaffold

把你的 trace 走一遍（见示例中的 `extractScaffold`）：

| trace 里的 | 变成 | id 约定 |
|---|---|---|
| 一次工具调用 | `ToolCall { id, fn, args }` | 沿用 trace 自己的 id |
| 一个工具结果 | `ObservablePrimitive { kind: "tool-result" }` | `op:<toolCallId>` |
| 用户的请求 | `ObservablePrimitive { kind: "user-statement" }` | `op:user-msg` |

一切认识论内容最终都要解析回这些 id——全部声明出来。

## 2. 解析认知

把 trace + scaffold 的 id 清单 + `schema/cognitive-state.schema.json` 交给解析模型（更强的模型，或 agent 本身在运行结束时自解析）。示例中的 `PARSE_PROMPT` 是起步提示词。它陈述的规则不是风格建议——validator 会机械执行：

- grounded ⇒ evidence pin 到已声明 primitive **且** provenance 可解析；
- hypothesis ⇒ 具体的可证伪条件；
- 考虑过又否决的 ⇒ `refuted` 节点，绝不删除；
- `verifiable` provenance ⇒ 真实的 `reExecCmd`（只在重执行确实可能时声称——`latent-validate --exec` 会真的去跑）；
- `latentLevel` 与实际做过的认识论工作成比例。

## 3. 过门

```bash
bun run validate your-instance.json          # Grounding Contract
bun validator/src/cli.ts --exec your.json    # + 真正重跑 verifiable provenance
```

像本仓库的 `bun run check` 接进 CI 那样接进你的管线：过不了门的实例永远到不了 UI。

## 4. 渲染——三种采纳深度

1. **零散采纳（仅 kit）。** 保留你的布局，先采纳词汇。`@latent/react/kit` 与 schema 解耦：`<EpistemicCard>`、`<StateDot>`、`<Provenance>`、`<CertaintyPill>`…… 渲染 schema 数据有唯一的标准绑定：`<NodeCard node={n} />`（以及 `fromSchema` 里的 `toEvidenceItems` / `toProvenanceProps` / `toConfidenceProps`）。
2. **理解面。** 把 `<UnderstandingPanel state={...} />`（或按 `latentLevel` 自动伸缩的 `<ProportionalView>`）放到原来工具流的位置，把工具流降级为 `<ActivityStream>`。
3. **整个应用（App Attention Grammar）。** 用五区布局（`@latent/react/app` + `<ZoneLayout>`）：Stage 放理解，Artifact 放工作产物，Activity/Context 退后，Intervene 常在。参考 `/apps/vibe-ide`、`/apps/gen-studio`、`/apps/minutes`。

## 5. 流起来——理解是形成的，不是出现的

对实时 agent，不要攒一个最终态：随理解形成而 emit **StreamingEvents**（`stream.init`、`primitive.add`、`toolcall.add`、`node.add`、`node.evidence`、`node.ground`、`node.refute`、`phase`、`outcome.settle`——`@latent/schema`）。客户端：

```tsx
const stream = useLatentStream((emit) => subscribeToYourAgent(emit));
// stream.state 即目前为止形成的理解——直接渲染
```

`validateStream` 对*凝定后*的流执行完整契约（形成中的状态豁免）。预录回放用 `stateToEvents(state)` 把任何罐头实例转成同一套事件词汇——demo 是特例，你的实时 agent 才是一般情形。

## 6. 需要守住的诚实边界

- **asserted vs verifiable** 是承重的：只把 `--exec` 能重新确立的标成 `verifiable`；一切自报的保持 `asserted`，UI 会如实降权。纯 API 模型的自报一律按 `asserted` 处理。
- validator 只拒绝*结构性*的表演。契约合法的实例仍可能杜撰；重执行（`--exec`）和你自己的 ground truth 是补救手段。其余缺口如何收口，见 `docs/training/` 的研究议程。
