[English](README.md) · **中文**

# Latent · 潜 — An Agentic Design Language

> **Latent is attentioned.** 注意力跟随理解，而非活动。
> Attention follows understanding, not activity.

现有 agentic 界面把注意力花在渲染工具调用上——但工具调用是认知的*剧场*，不是认知本身。
**潛** 把视觉层级倒过来：agent 不断演化、被证据锚定的「理解态」占据主舞台；动作退为外围、可审计的 provenance。

[![The Inversion — 把视觉层级倒过来；三个区域，一种比例](docs/assets/the-inversion.png)](https://latent-design.pages.dev)

<p align="center"><a href="https://latent-design.pages.dev"><b>latent-design.pages.dev</b></a> — 在线站点 · demos · <a href="https://latent-design.pages.dev/kit/">组件套件</a></p>

这个仓库把该设计语言做成一份**成熟交付物**，由一份 canonical schema 作为脊梁，串起四条应用线：
产品设计、模型（训练）设计、agentic-coding 指引、含多场景 demo 的推介网站。

## 仓库结构

```
packages/tokens/   @latent/tokens     设计 token：色彩(认识论状态)·字体(三声音)·动效(浮现/凝定/沉降/拐点)
packages/react/    @latent/react      ~15 个 schema 驱动的 React 组件
schema/            @latent/schema     ★脊梁：Zod CognitiveState 契约 → 生成 JSON Schema
validator/         @latent/validator  latent-validate CLI，机械执行 Grounding Contract
site/              Astro 推介站 + 5 个场景 demo + 比例条带
skills/            latent-design/SKILL.md — 给 Claude Code 的设计语言 skill
docs/product/      产品设计规范（设计师/PM）
docs/training/      模型训练规范（schema=训练目标 · reward shaping · SFT · verifiable/asserted）
examples/          每个 demo 一份校验过的 CognitiveState 实例
DESIGN_LANGUAGE.html  原始自演示单页（tokens/组件/TraceForge 的真相源）
MISSION.md            战略综述（论点、风险、技术纲领）
```

## 脊梁：一份 schema，四个消费者

`CognitiveState`（`schema/src/cognitive-state.ts`，v0.2）同时：(a) 描述模型应 emit 的输出、(b) 类型化并驱动 React 组件、(c) 被 validator 校验、(d) 被 skill 引用。
Grounding Contract 的纪律被编码为**硬约束**——grounded 必带可溯源 provenance、hypothesis 必带 falsification、verifiable provenance 必带可重执行命令、所有 evidence/provenance 引用必须解析——因此 validator 能**机械地拒绝 reasoning theater**。

**通用而非诊断专用**：节点有两条正交轴——`state`（认识论状态：grounded/hypothesis/open/inflection/refuted，编码颜色）与 `kind`（内容角色：decision / plan / requirement / option / tradeoff / answer / risk / observation / claim，编码标签）。于是同一契约跨各种 agent 成立：一个**决策**或**需求理解**占据主舞台，同样必须 grounded、或 tentative（带可证伪条件）、或诚实 open。

**三套主题**：`<html data-theme="dark|light|kami">` 切换 dark（深海蓝）/ light（冷纸）/ kami（暖羊皮纸 + 靛蓝，Kami 风格）。组件只引用语义 token，主题是纯值替换。站点右上角可切换、`?theme=` 可分享。

## 快速开始（bun）

```bash
bun install
bun run gen           # 生成 cognitive-state.schema.json + tokens.json
bun run validate "examples/**/*.json"   # 跑契约校验（应全过）
bun run dev           # 本地预览推介站 (astro dev)
bun run build         # gen + 构建静态站点到 site/dist/
bun run preview       # 预览构建产物（纯静态）
```

部署：`site/dist/` 为纯静态，可经 staging caddy 暴露到 `https://<name>.staging.netis.com`（见 `register_staging` skill）。

## 6 个应用 demo（跨 agent 原型 × latent 复杂度）

| Demo | 原型 | latent | 看点 |
|---|---|---|---|
| `/demos/traceforge` | 诊断 / 根因 | 高 | hypotheses → 拐点 → grounded 根因；verifiable 溯源 |
| `/demos/planning` | 规划 / 决策 | 高 | decision / plan / tradeoff / risk 角色；约束驱动 |
| `/demos/writing` | 写作 / 生成 | 中 | requirement 锚定原话；结构 decision；风格 option |
| `/demos/advisory` | 助手 / 建议 | 中 | answer + 显式假设 + tradeoff + 诚实 risk |
| `/demos/action` | 代理操作 / ambient | 高 | 替你做的可审计 decision；高风险项暂停等你拍板 |
| `/demos/rad-app` | RAD / 全栈 App | 高 | requirement → 架构 decision（smoke 可重跑）→ plan/option/risk |

## 应用层：App Attention Grammar（宏观）

设计语言不止组件——三区模型放大到**整个 App**：五个注意力区域（**① Stage 理解 · ② Artifact 工件 · Activity 活动 · Context 导航 · ③ Intervene 干预**），权重 `Stage > Artifact > {Context, Activity}`。宏观倒置：别家把工具调用流放主舞台，潛 把「理解」放上去。`@latent/react/app` 提供 zone 角色样式，App 用 `grid-template-areas` 自排，Stage 放 `<UnderstandingPanel>`。两个参考实现：

| App | 地址 | 看点 |
|---|---|---|
| 潛 IDE · Vibe Coding | `/apps/vibe-ide` | 侧栏的工具调用流 → agent 对「要建什么」的理解；代码居中、终端退下 |
| 潛 Studio · Image/Video 生成 | `/apps/gen-studio` | 渲染队列从主位挪开 → agent 对创作意图的理解；画布居中、队列退侧 |

## 进一步

- 设计师/PM → `docs/product/README.zh.md`
- 训练/Lab → `docs/training/README.zh.md`
- 用 AI 写 Latent UI → `skills/latent-design/SKILL.md`
- 哲学与战略 → `MISSION.zh.md`

v0.1 · 潛龍在淵 · for Netis.
