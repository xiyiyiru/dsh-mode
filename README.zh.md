# @xiyiyiru/dsh-mode

[dsh](https://github.com/deepseek-ai/deepseek-harness) agent 的工作模式：`switch_mode` 工具在切换瞬间把对应阶段的方法论作为普通工具结果交付——方法论注入在切换点，引导接下来的阶段，而不是常驻系统提示词的教条。

> English README: [README.md](./README.md)

## 为什么

agent 对所有任务用同一种姿态是浪费：一句话的答案也煞有介事地规划，多步的重构却靠即兴发挥。模式引导治的是「阶段错配」——但前提是方法论恰好在工作方式变化的那一刻到位，并且不冒充永久规则。常驻提示词的教条有反向的失败模式：它稀释成模型不再阅读的墙纸。

本插件让切换变得便宜（一次工具调用）、显式（记为会话事件）、不粘滞（系统提示词永不因切换而改变）。

## 五个模式

| 模式 | 何时切入 | 一句话章程 |
|---|---|---|
| `base` | 默认；入口哨兵 | 直接回答、不设仪式——但先判断要不要切 |
| `planner` | 目标需要决策完备的方案 | 执行者拿到方案后**零**决策 |
| `analyst` | 下判断、定位根因、评估影响面 | 事实裁判：取证、陈述事实与影响，不修不建议 |
| `explorer` | 陌生代码、只读侦察 | 产出结构 + 职责 + 关键路径；不落笔 |
| `executor` | 方案已批、只差动手 | 严格按方案执行；方案有洞就摆出来，不默默改好 |

`base` 是首次切换前的默认姿态——不存在无模式真空。它的方法论核心是**分诊规则**：任务超过一次工具往返、要改产出物、输入里有报错待诊断 → 切；一句话能答 → 直接答。

每个模式的完整方法论（mindset）作为 `switch_mode` 的工具结果**原文返回**——见 API 里的 `MODES`。各方法论强制执行的要点：

- **planner**——先分辨输入是目标还是方案（方案先连问两层为什么再谈补全）；条目单行、可独立判定完成；缺验收标准即缺方案；推荐裁决先行、候选项一行带差距；口头确认不构成执行批准。
- **analyst**——先复现缩范围再下结论；根因追到「这一行代码、这个条件为真时触发」的粒度，不停在「大概是配置问题」；结论逐条标注 [已确认] 直接证据 / [合理推断] 交叉推断 / [证据不足] 缺口明示。
- **explorer**——陌生库广度优先、已知目标深度优先；长文档先落地文件再解析；同一份长文本反复切片挖矿是失败模式，立即停。
- **executor**——动手前先查牵连面；删除/覆盖前先看目标；可逆的小歧义照做并记一行裁决（决定—理由—代价），不可逆的停下来报告；每改完一个原子动作就跑一次校验，不攒到最后。

## 切换做什么（和不做什么）

- ✅ 把该模式的方法论作为普通工具结果返回——恰好出现在它引导的阶段里
- ✅ 记一条 `mycel/mode` 会话事件（最后一条生效）——抗压缩、跨 resume 存活
- ✅ 幂等重切换：压缩之后切到**同一个**模式即可重读方法论——这就是恢复路径
- ❌ 永不修改系统提示词
- ❌ 不在回退或后续任何回合被重复注入
- ❌ 不携带快照进其他工具的帧（2026-09-03 起与 state 插件的任务栈解耦）

## 核心行为段

本插件对系统提示词的唯一贡献是一个静态段（`mycel:core-behavior`，order 10——紧随人设之后）：模式无关的工作准则（先问根因、诚实标注不确定性、范围纪律、结论先行、回合完备）。它不随切换变化；五个模式是这块固定地板之上的**可变层**。

## 安装

```bash
dsh plugin --profile <name> add @xiyiyiru/dsh-mode
```

peer 依赖（`@deepseek-ai/cordis`、`dsh-agent`、`dsh-session`、`dsh-tools`、`dsh-system-prompt`）自动从你的 dsh 安装解析——无需手动配置。

## API

```ts
import {
  MODES, CORE_BEHAVIOR, MODE_NAMES, DEFAULT_MODE,
  SWITCH_MODE, SWITCH_MODE_DESCRIPTION,
  effectiveMode, foldMode,
  type ModeName, type ModeSpec,
} from '@xiyiyiru/dsh-mode'
```

| 导出 | 是什么 |
|---|---|
| `MODES` | 五个 `ModeSpec`——`name`、`mindset`（方法论原文）、`triggerScenario` |
| `CORE_BEHAVIOR` | 静态核心准则段文本 |
| `MODE_NAMES` / `DEFAULT_MODE` | 工具的枚举值 / `'base'` |
| `SWITCH_MODE` / `SWITCH_MODE_DESCRIPTION` | 工具名与面向模型描述 |
| `foldMode(events)` | 折叠会话日志：当前生效的模式，首次切换前为 `undefined` |
| `effectiveMode(events)` | `foldMode(events) ?? 'base'`——永不返回 undefined |

会话事件：`mycel/mode` `{ mode: ModeName }`——仅记日志、非表面、整体替换语义。

## 设计说明

- **引导，不是清单**：每个方法论都在引导判断，明说「取舍，不必逐条对照」。
- **切换点注入就是全部意义**：方法论在阶段开始时被读到，之前之后零成本。
- **解耦**：不依赖任何其他 mycel 插件；与 `@xiyiyiru/dsh-state` 的任务栈可配可不配——栈恢复你的任务，重切换恢复你的方法论。

## 许可

MIT
