[English](README.md) · **中文**

# Latent · 潜 — 模型训练：研究议程

> **设计语言 = 训练目标**是论点；这份文档是通往它的*研究议程*——不是一个可直接开跑的
> 训练程序。其中只有一层在今天是机械成立的（硬门），其余都是提案，各自的开放问题在下文
> 如实点名。如果「Latent is attentioned」要统辖所有应用，模型终将需要被*训练*去 emit
> 良构、校准、可证伪的认知态；UI 只是它的诚实读出。

## 0. 现状：哪些是真的，哪些是提案

| 层 | 状态 | 所在 |
|---|---|---|
| Schema 作为 emit 目标（`CognitiveState`） | **已落地** | `schema/src/cognitive-state.ts` |
| 硬门：结构性契约，机械执行 | **已落地** | `@latent/validator`（`bun run validate`） |
| 硬门负样本（每条硬约束一个） | **已落地**（种子集） | `validator/fixtures/negative/` |
| verifiable provenance 的真实重执行 | **已落地**（opt-in） | `latent-validate --exec` |
| 塑形奖励（校准、falsification 质量……） | **提案** —— 无任何实现 | §3 |
| 评测指标（ECE/Brier、拐点忠实度……） | **提案** —— 没有代码在计算它们 | §7 |
| SFT 数据管线（trace → gold，规模化） | **提案** —— 仅有草图；`examples/` 是约 22 份种子实例，不是语料库 | §4 |
| 可学习的 `latentLevel` / `Provenance.mode` | **开放问题** —— 目前两者都由管线/人设定，没有学习信号 | §6 |

诚实的总结：**门是程序，奖励是议程。**

## 1. Schema 即目标

模型的输出目标是一个合法的 `CognitiveState`（见 `schema/cognitive-state.schema.json`，由 `schema/src/cognitive-state.ts` 生成）。它不是「附加的结构化摘要」，而是**主产物**：理解态是被 emit 的对象，自然语言叙述是它的投影。

顶层：`latentLevel · persona · task · observablePrimitives[] · toolCalls[] · nodes[] · outcome? · steps?`。节点为五态判别联合：`grounded / hypothesis / open / inflection / refuted`（编码认识论状态），外加正交的可选 `kind` 内容角色（decision / plan / requirement / option / tradeoff / answer / risk / observation / claim）。

**这是通用 emit 目标，不是诊断专用**：模型应学会在规划、写作、建议、代理操作、构建等任务里都 emit 良构的 CognitiveState——一个 `decision` 占据主舞台也必须 grounded/tentative/open，与诊断的 `claim` 同纪律。`examples/` 已含每个原型一份 gold 实例。

## 2. 硬门 —— 唯一机械成立的一层

今天即由 `@latent/validator` 执行，违反即拒：

- 输出必须通过 `CognitiveState` 校验。
- grounded claim 必须带可点开 provenance，且 provenance.steps 的 `toolCallId` / `primitives` 必须**可解析**到已声明的 toolCalls / observablePrimitives。
- hypothesis 必须带非空 `falsification`；open question 必须带非空 `needs`。
- `verifiable` provenance 必须带 `reExecCmd`——而 `latent-validate --exec` 会**真的重新执行它**，这是唯一让「verifiable」名副其实的检查。
- 所有可引用 id 必须唯一；outcome 不得指向已沉降（refuted）节点。

`validator/fixtures/negative/` 每条硬约束配一个被拒实例——即 §4 所要求的负样本语料的种子。

> 这一层把 reasoning theater 的*结构性*形态挡在门外：悬空的、不落证据的断言无法获得任何奖励。**它做不到的是语义验证**：任何散文都能充当 `falsification`，`confidence.source` 是自报的，（不开 `--exec` 时）任何字符串都能充当 `reExecCmd`。模型完全可以 emit 结构合法的表演。补上这个缺口，正是下面的研究纲领。

## 3. Reward shaping —— *提案*

门内择优。以下信号今天没有任何一个有实现，每条都附带点名的开放问题。

- **校准置信**：`confidence.value` 与实际正确率的校准度（Brier / ECE）。优先 `source ∈ {logprob, self_consistency}`，惩罚 `self_report` 的过度自信。*开放问题：校准需要逐 claim 的事后 ground truth——对 verifiable-grounded 可行（重跑检查即可），对 asserted-grounded 则是循环论证（要人来裁定的恰是被打分的东西）。*
- **有意义的 falsification**：可执行/可观测的反驳条件，最好能被自动判定。*开放问题：没有任何已定义的程序能区分真正可执行的条件与貌似有理的散文；LLM-judge 基线未经验证。*
- **provenance 可解析且充分**：每条 evidence pin 到真实 primitive（已是硬门），verifiable 的 `reExecCmd` 真能复算（`--exec` 已存在；把它接进奖励回路还没有）。
- **真实拐点**：`inflection` 只在内部置信度发生大幅迁移处出现；惩罚表演式「啊哈」。*开放问题：需要白盒访问（激活探针、logprob 轨迹）——对纯 API 模型无定义；即便对自有模型，检测程序也尚不存在。*
- **诚实的 open question**：在确实未知处保留 open，惩罚「假装确定」。*开放问题：「确实未知」的 ground truth 无定义。*
- **比例**：`latentLevel` 与任务真实复杂度匹配。*开放问题：今天 `latentLevel` 是被撰写的，不是被预测的——见 §6。*

anti-theater 惩罚（剧场语态、删除式 refute、氛围置信数字）同样是「已规定、未实现」；删除式 refute 只有拿到完整轨迹才可检测，单实例无从判断。

## 4. SFT 数据 —— *管线是提案，数据只有种子*

成对样本 `(trace, CognitiveState)`：原始 agent 轨迹及其解析出的合法实例（gold label）。建议的合成回路——

1. 跑 agent 得 raw trace；
2. 用更强模型（或人工）把 trace 解析为 `CognitiveState`；
3. `bun run validate` 过门后入库；
4. 故意构造**负样本**（缺 falsification、悬空 provenance、删除式 refute、氛围置信）训练判别/惩罚信号——`validator/fixtures/negative/` 即种子分类法。

——是草图，不是工具链。已有的：`examples/` 里约 22 份手写 gold 实例 + 负样本 fixtures。一个真实程序还需要：数千对样本、自动化 trace 解析器（`examples/adapter/` 是第一个机械步骤）、gold 解析的标注者间一致性、以及独立的评测集。这些都还不存在。

## 5. verifiable vs asserted —— 决定一切的分叉

应用按 grounding 可验证性二分（来自 MISSION 的核心技术纲领）：

- **verifiable-grounded**：证据链可被**重新执行**验证（TraceForge 的 fault-injection / 可验证奖励、coding 的测试重跑、log-triage 的 openssl 重验）。这里 reward 可被机器复算——这正是 fault-injection / verifiable-rewards 基建的资产，`--exec` 是它最小的演示。
- **asserted-grounded**：只能自报（部分金融关联、软任务）。reward 受限于自报忠实性，UI/label 必须如实降权。

> 应用组合会沿这条线分叉，UI 必须差异化标注，模型也应学会**诚实地标注自己 grounding 的类型**——这本身就是开放问题：今天 `Provenance.mode` 由管线指定，没有任何训练信号教模型自我归类（错误自称「verifiable」的实例可以被 `--exec` 机器拆穿，这提示了奖励的设计方向，但它还没有被造出来）。

## 6. 开放问题：比例与 mode 是被撰写的，不是被学会的

哲学把两个字段当作*模型的判断*，而在现存的每一份实例里它们都是*管线的输入*：`latentLevel`（琐碎任务该不该配假设板？）和 `Provenance.mode`。在「对模型自己选择的这两个字段按任务 ground truth 打分」的奖励存在之前，「模型学会比例感」只是愿景。最小的第一个实验：固定任务、变化 `latentLevel`，让人（或带已验证 rubric 的 judge 模型）对界面排序——这就产出了比例感的第一批偏好数据。

## 7. 忠实性 caveats（务必内化）

- **渲染出来的 latent ≠ 真实的 latent。** verbalized 推理常是事后合理化；一个完美自洽的解释可能完全是杜撰。
- 因此：在**自有模型**上，置信应尽量从 logprob / self-consistency 导出，拐点从激活空间探针导出——比纯 API 自报忠实得多。该设计语言**在自有蒸馏边缘模型上渲染得更真**，这是与边缘部署论点的非显然协同。对纯 API 模型，拐点忠实度奖励不可达；诚实的退路是把所有 API 自报一律按 `asserted` 处理。
- Grounding Contract 降低但不消除 reasoning theater；残差是后端问题（machine-verifiable grounding），不是 UI 问题。

## 8. 与 Lab 衔接

- schema 与 validator 今天即可被训练/评测管线直接引用：`import { CognitiveState } from "@latent/schema"` / `import { validateCognitiveState, reExecProvenance } from "@latent/validator"`。
- 提议的评测指标——**目前均未实现**：schema-pass-rate 与 provenance 可解析率（validator 现成可算，是最容易先造的）、置信校准（ECE/Brier，需 ground-truth 基建）、falsification 覆盖率与质量（需裁定程序）、拐点忠实度（需白盒访问）、比例匹配率（需 §6 的偏好数据）。
- 务实的构建顺序：pass-rate 类指标 → 基于 `--exec` 的 verifiable-grounded 奖励 → 仅对 verifiable claim 做校准 → 其余。
