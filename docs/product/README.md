# Latent · 潜 — 产品设计规范

> 给设计师 / PM。本规范是把「Latent is attentioned」落到具体界面决策的手册。
> tokens / 组件的真相源在代码里（`packages/tokens`、`packages/react`）与自演示站点（`site/`），本文解释**为什么**这样设计，以及接入时的红线。

## 1. 论点与倒置

现有 agentic 界面几乎都是 **tool-call-rooted**：UI 的生成源头是工具输出，推理被压成动作旁边的一行小字、一个事后辩护（先动作、后解释）。潛 把层级**倒过来**：

- **理解态（latent）= 主舞台。** agent 对问题不断演化、被证据锚定的理解占据主注意力。
- **动作（tool calls）= 外围。** 退为可调取、可审计的 provenance 一行。

视觉权重的分配是**硬约束**，不是布局偏好。

## 2. 三区注意力模型

| 区 | 角色 | 寿命 | 视觉权重 |
|---|---|---|---|
| ① Understanding Surface | 持续被改写的「问题状态」 | 持久（可回访） | 主体 |
| ② Activity Stream | 工具调用流 | 短暂 | 外围、默认收起、永远可展开 |
| ③ Intervention Rail | 人类干预（质疑/约束/采纳） | 常驻 | 一等特性，非边缘情况 |

「新证据进来 → 理解态变化」——那个**变化**（假设被提升/推翻）才是有意义的事件，也正是 ambient/后台 agent 时代用户「回来查看」的对象。

## 2.5 用户故事与交互模型（降低认知负担）

一块抽象的认知板会让人不解「谁在这里做什么」。因此每个界面都由一个 **userStory** 框住：**谁 · 触发 · 目标 · 你在这里看到什么 · 你在这里可做什么**。

**目标用户是「领域很懂、但 AI 是小白」的人**（医生、分析师、设计师…）。因此默认呈现必须是**人话**，不是认知机制：

- **三档读法**（右上角切换，默认「简明」）：
  - **简明** `<PlainView>` —— 像同事说话：**你的问题 → 我的判断（词级确定度）→ 我为什么这么看（依据可折叠）→ 我中途改了主意 → 还不确定/需要你定 → 我排除了 → 你可以做什么**。无置信数字、无 grounded/provenance 等内行词、无 mono 仪表感；靠留白与层级承重，不靠边框/徽标。
  - **详细** —— 认知板（颜色=状态、置信、证据、溯源），给想看机制的 power user。
  - **开发者** —— 原始 tool-call trace，给 builder/审计。
- **置信度用词不用数字**：比较确定 / 大致确定 / 倾向认为 / 还在判断 / 待确认。内行概念一律翻译成人话（grounded→「比较确定」、provenance→「我是怎么确认的」、verifiable→「这条可以复核」、refuted→「我考虑过但排除了」）。

交互模型必须摆正——否则界面会反直觉：

- **用户到达 → 读理解 → 干预。** 用户打开界面时看到的是 agent 的*当前理解*，因此**结论先行**（outcome 置顶），再展开支撑它的理解。
- **agent 自己推进，用户不"驱动"思考。** 真实的用户动作是右侧干预栏（采纳 / 提异议 / 补约束）。
- **「回放形成过程」是可选的演示/审查手段，不是主操作。** 早期把"推进"做成主按钮是错的——它暗示用户要一步步催 agent 思考。回放被降级、明确标注"演示用"。

## 3. Grounding Contract（脊梁）

渲染出来的 latent **≠** 真实的 latent；链式推理常是事后合理化，做得越漂亮越危险。因此**只有可证伪、被证据锚定的认知才配占据主注意力**。任何进入主舞台的元素必须是以下合法形态之一：

| 形态 | 颜色 | 必须携带 |
|---|---|---|
| **Grounded Claim** 已锚定结论 | 金 amber `#E7B45C` | 指向 evidence / observable primitives 的**可点开溯源** |
| **Hypothesis** 在押假设 | 青 aqua `#54C7C0` | **置信度 + 「什么证据会改变它」** |
| **Open Question** 诚实未知 | 靛 indigo `#9C8CCB` | **待查项 / 解决它需要什么** |
| **Inflection** 认知拐点 | 珊瑚 `#F0795F` | from → to + 理由（研究证实拐点是 latent 中最忠实的部分） |
| **Refuted** 已沉降 | 灰蓝 `#5C6B7A` | 沉降理由（**保留可审计，不删除**） |

这正是五层诊断本体论（Observable Primitives → Evidence → Symptoms → Hypotheses → Conclusions）：上层是台前主体，但每一个都必须有一根线**栓回**下层可观测原语。

## 4. Foundations

- **色彩 = 认识论状态**（不是装饰）。看到金色就知道「已锚定」，看到珊瑚色就知道「模型刚改了主意」。完整 token 见 `packages/tokens/tokens.json`。
- **字体 = 三种声音**。Voice（认知，衬线 Fraunces/Noto Serif）— 思考应显得被斟酌过；UI（功能，Hanken/Noto Sans）— 清晰退后；Evidence（仪器，IBM Plex Mono）— 可核验的读数。
- **动效 = 深度的语言**。Surface 浮现（新理解升起）/ Settle 凝定（青转金）/ Sink 沉降（被推翻者下沉但不删）/ Pulse 拐点（珊瑚闪现）。运动讲述状态迁移，从不只是装饰。

## 5. 组件目录

由 `@latent/react` 实时渲染，props 即 `@latent/schema` 子类型：
`<UnderstandingSurface>` · `<GroundedClaimCard>` · `<HypothesisCard>` · `<OpenQuestionCard>` · `<RefutedCard>` · `<InflectionMarker>` · `<ConfidenceMeter>` · `<EvidenceChips>` · `<ProvenanceView>` · `<ActivityStream>` · `<InterventionRail>` · `<PersonaToggle>` · `<ProportionalView>` · `<TraceView>` · `<Scenario>`。

## 6. 比例原则

理解态体量随**问题的认识论复杂度**伸缩：

- **Low**（格式化、改写、单步检索）→ 一行 grounded 结论 + provenance，无假设板。
- **Mid**（起草、对比、规划）→ 2–3 个 grounded 论点 + 1 个 open，轻量。
- **High**（诊断、研究、合规调查）→ 完整假设板 + 拐点 + 沉降 + 溯源。

别给「改写一句话」摆一块假设板（见反模式）。

## 7. 两种人格

- **Operator 视图**（latent 主导，默认）→ 服务终端用户。
- **Trace 视图**（tool-call 主导）→ 服务调试与审计。

一个 toggle 化解「透明派 vs 认知优先」的张力，而非二选一。

## 8. 七原则（速记）

1. 注意力跟随理解，而非活动。
2. 主舞台只接纳可证伪的认知。
3. 浮现拐点，沉降叙述。
4. 弱化 ≠ 隐藏（provenance 永远可调、可重建）。
5. 不确定性是一等内容。
6. 理解态持久，活动短暂。
7. 两种人格，两种视图。

## 9. 信任校准：verifiable vs asserted

provenance 必须标注 `mode`：

- **verifiable** — 证据链可被重新执行验证（携带 `reExecCmd`）。TraceForge / coding / log-triage 属此。
- **asserted** — 仅自报、不可廉价重执行（金融合规的设备图关联属此）。

UI 必须差异化标注，让用户据此校准信任。asserted 结论应触发人工复核。

## 10. 采纳红线（会悄悄重建剧场）

- 把 CoT 原文直接灌进主舞台（未经契约过滤）。
- 用 spinner/进度条制造「在忙」假象。
- 把置信度做成无依据的「氛围数字」。
- 为了「干净」删除被推翻的假设。
- 给低 latent 任务硬套假设板。
- 把 provenance 折成无法调取的死链。

## 11. 通用化：内容角色（kind）、适用原型与主题

**这是一套通用语言，不是诊断专用。** 节点有两条正交轴：

- `state`（认识论状态，**编码颜色**）：grounded / hypothesis / open / inflection / refuted。
- `kind`（内容角色，**编码标签**）：observation / claim / decision / plan / requirement / option / tradeoff / answer / risk。

Grounding Contract 跨原型成立：一个**决策**或一个**需求理解**占据主舞台，同样必须 grounded（挂在准则/证据/用户原话上）、或标为 tentative（带可证伪条件）、或留作诚实 open。上文「五层诊断本体论」只是诊断这一个域的 grounding ladder；其它原型有各自的 ladder 或不需要。

| 原型 | 主要 kind | latent |
|---|---|---|
| 诊断 / 根因 | claim | 高 |
| 规划 / 决策 | decision · plan · tradeoff · risk | 高 |
| 写作 / 生成 | requirement · option · decision | 中 |
| 助手 / 建议 | answer · risk · tradeoff | 中 |
| 代理操作 / ambient | decision(动作) · plan(待批) · risk | 高 |
| RAD / 全栈 App | requirement · decision · plan · option · risk | 高 |

**主题**：`<html data-theme="dark|light|kami">` 切换 dark（深海蓝）/ light（冷纸）/ kami（暖羊皮纸 + 靛蓝）。颜色仍编码认识论状态，三套主题只是同名语义 token 的值替换；组件不得硬编码 hex。

## 12. 应用层：App Attention Grammar（宏观）

设计语言不止于组件——它把三区模型**放大到整个 App**。每个 agentic 产品由五个注意力区域组成，视觉权重是硬规则：

| 区域 | 角色 | 注意力权重 |
|---|---|---|
| **① Stage · 理解** | agent 不断演化、被证据锚定的理解（用 `<UnderstandingPanel>`） | 主舞台 · 最高 · 最亮 |
| **② Artifact · 工件** | 在造/在操作的对象：代码 · 画布 · 视频 · 文档 · 数据 | 同台 · 中性 |
| **· Activity · 活动** | 工具调用 / 渲染任务 / 终端 | 外围 · 可审计 · 可收起 |
| **· Context · 导航** | 文件 / 历史 | 退后 |
| **③ Intervene · 干预** | 人类操作 | 一等 · 随时可达 |

权重次序：**Stage > Artifact > { Context, Activity }**；Intervention 永远可达。

**宏观的倒置**：现有 agentic 产品常把 Activity（工具调用流）放在本该是 Stage 的位置——这套语法把「理解」搬上主舞台，把活动降到外围。

**怎么用**：`@latent/react/app` 提供 zone 角色样式（`.zone-stage / .zone-artifact / .zone-activity / .zone-context / .zone-intervene` + `.app-frame / .app-topbar`）；每个 App 自己用 `grid-template-areas` 排这五个区，Stage 区放 `<UnderstandingPanel state={…}/>`。两个参考实现：`/apps/vibe-ide`（Vibe Coding IDE）、`/apps/gen-studio`（Image/Video 生成）。

## 13. 流式（LLM streaming）下的动效

核心：**流式呈现「理解的形成」，不是 token 的河流。** 见 `/demos/streaming`。

- **原始流退外围**：raw token / 工具调用在 Activity 区快速流动、转瞬即逝、可审计；主舞台（理解）按**有意义的提交**更新，不逐字抖动。
- **动效词汇即流式动态**：Surface（新判断浮现）· Sink（假设被推翻下沉）· Pulse（"改主意"拐点闪现）· Settle（答案从占位凝定）。
- **答案位占位先行**：未出结论时「我的判断」是占位槽（微光"正在判断…"），提交时 Settle 填入。生命周期 `thinking → forming → settled / revising`。
- **流事件而非 raw text**：推荐流式补丁 `node.add / confidence.update / refute / inflection / outcome.settle`，天然映射 UI 迁移，并能区分"暂定"与"已提交"——别把会被推翻的中间态过早渲染成"比较确定"（呼应 Grounding Contract）。
- **稳，不抖**：按语义单元防抖更新、预留空间防回流（CLS）、尊重 `prefers-reduced-motion`。原始流可以快，理解要稳。

## 接入 checklist

- [ ] agent 输出先建模为 `CognitiveState` 实例。
- [ ] `bun run validate` 通过（契约成立）。
- [ ] latentLevel 诚实选择，`<ProportionalView>` 自动伸缩。
- [ ] 颜色/字体只取自 tokens。
- [ ] 每个 hypothesis 带 falsification；每个 grounded 带可点开 provenance。
- [ ] provenance 标注 verifiable / asserted。
- [ ] refuted 沉降而非删除。
