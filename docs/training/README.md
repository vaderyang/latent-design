# Latent · 潜 — 模型（训练）设计规范

> **设计语言 = 训练目标。** 如果「Latent is attentioned」要统辖所有应用，模型就必须被
> *训练* 去 emit 良构、校准、可证伪的认知态——诚实的置信、真实的可证伪条件、不表演。
> 这份规范定义模型应当学会产出的东西；UI 只是它的诚实读出。

## 1. Schema 即目标

模型的输出目标是一个合法的 `CognitiveState`（见 `schema/cognitive-state.schema.json`，由 `schema/src/cognitive-state.ts` 生成）。它不是「附加的结构化摘要」，而是**主产物**：理解态是被 emit 的对象，自然语言叙述是它的投影。

顶层：`latentLevel · persona · task · observablePrimitives[] · toolCalls[] · nodes[] · outcome? · steps?`。节点为五态判别联合：`grounded / hypothesis / open / inflection / refuted`（编码认识论状态），外加正交的可选 `kind` 内容角色（decision / plan / requirement / option / tradeoff / answer / risk / observation / claim）。

**这是通用 emit 目标，不是诊断专用**：模型应学会在规划、写作、建议、代理操作、构建等任务里都 emit 良构的 CognitiveState——一个 `decision` 占据主舞台也必须 grounded/tentative/open，与诊断的 `claim` 同纪律。`examples/` 已含每个原型一份 gold 实例。

## 2. Reward shaping

分两层：**硬门（schema-validity gate）** + **塑形奖励**。

### 2.1 硬门（gate，违反即 0）
由 `@latent/validator` 机械执行——这正是它存在的意义：

- 输出必须通过 `CognitiveState` 校验。
- grounded claim 必须带可点开 provenance，且 provenance.steps 的 `toolCallId` / `primitives` 必须**可解析**到已声明的 toolCalls / observablePrimitives。
- hypothesis 必须带非空 `falsification`。
- open question 必须带非空 `needs`。
- `verifiable` provenance 必须带 `reExecCmd`。

> 这一层直接把 reasoning theater 挡在门外：悬空的、不落证据的断言无法获得任何奖励。

### 2.2 塑形奖励（shaped，门内择优）
- **校准置信**：`confidence.value` 与实际正确率的校准度（Brier / ECE）。优先 `source ∈ {logprob, self_consistency}`，惩罚一切 `self_report` 的过度自信。
- **有意义的 falsification**：可执行/可观测的反驳条件（非空话），最好能被自动判定。
- **provenance 可解析且充分**：每条 evidence pin 到真实 primitive；verifiable 的 `reExecCmd` 真能复算。
- **真实拐点**：`inflection` 只在内部置信度发生大幅迁移处出现（拐点是 latent 中最忠实的部分）；惩罚表演式「啊哈」。
- **诚实的 open question**：在确实未知处保留 open，惩罚「假装确定」。
- **比例**：`latentLevel` 与任务真实复杂度匹配；惩罚给琐碎任务硬塞假设板。

### 2.3 惩罚（anti-theater）
- 剧场语态（「让我深入分析这个复杂问题…」「正在仔细检查…」）。
- 删除式 refute（应沉降保留，不得从 nodes 中抹去考虑过的假设）。
- 无来源/无证据的「氛围」置信数字。

## 3. SFT 数据格式

成对样本 `(trace, CognitiveState)`：

- `trace` = 原始 agent 轨迹（工具调用 + 中间推理 + 最终答案）。
- `CognitiveState` = 该轨迹被解析/重写为合法实例（gold label）。

`examples/*.json` 即种子 gold 实例（TraceForge / 金融 / 研究 / coding / 日志），覆盖 low→high 全谱。数据合成流程建议：
1. 跑 agent 得 raw trace；
2. 用更强模型（或人工）把 trace 解析为 `CognitiveState`；
3. `bun run validate` 过门后入库；
4. 故意构造**负样本**（缺 falsification、悬空 provenance、删除式 refute、氛围置信）训练判别/惩罚信号。

## 4. verifiable vs asserted —— 决定一切的分叉

应用按 grounding 可验证性二分（来自 MISSION 的核心技术纲领）：

- **verifiable-grounded**：证据链可被**重新执行**验证（TraceForge 的 fault-injection / 可验证奖励、coding 的测试重跑、log-triage 的 openssl 重验）。这里 reward 可被机器复算——**这正是你 fault-injection / verifiable-rewards 基建的资产**。
- **asserted-grounded**：只能自报（部分金融关联、软任务）。reward 受限于自报忠实性，UI/label 必须如实降权。

> 你的应用组合会沿这条线分叉，UI 必须差异化标注，模型也应学会**诚实地标注自己 grounding 的类型**。

## 5. 忠实性 caveats（务必内化）

- **渲染出来的 latent ≠ 真实的 latent。** verbalized 推理常是事后合理化；一个完美自洽的解释可能完全是杜撰。
- 因此：在**自有模型**上，置信应尽量从 logprob / self-consistency 导出，拐点从激活空间探针导出——比纯 API 自报忠实得多。该设计语言**在你自己的蒸馏边缘模型上渲染得更真**，这是与边缘部署论点的非显然协同。
- Grounding Contract 降低但不消除 reasoning theater；残差是后端问题（machine-verifiable grounding），不是 UI 问题。

## 6. 与 Lab 衔接

- schema 与 validator 可直接被训练/评测管线引用：`import { CognitiveState } from "@latent/schema"` / `import { validateCognitiveState } from "@latent/validator"`。
- 评测建议指标：schema-pass-rate、falsification 覆盖率、provenance 可解析率、置信校准（ECE/Brier）、拐点忠实度（与内部不确定性迁移的相关性）、比例匹配率。
