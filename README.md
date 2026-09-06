# @xiyiyiru/dsh-mode

Working modes for [dsh](https://github.com/deepseek-ai/deepseek-harness) agents: a `switch_mode` tool that delivers a phase-appropriate methodology **at the moment of the switch** — not standing law in the system prompt.

> [中文 README](./README.zh.md)
>
> 给 dsh agent 的工作模式：`switch_mode` 工具在切换瞬间把对应阶段的方法论作为普通工具结果交付——方法论注入在切换点，引导接下来的阶段，而不是常驻系统提示词的教条。

## Why

Agents waste turns when they apply one posture to every task: planning a one-line answer, or improvising a multi-step refactor. Mode guidance fixes the *phase mismatch* — but only if it arrives exactly when the work style changes, and stops pretending to be permanent rules. Standing prompt-law has the opposite failure: it dilutes into wallpaper the model stops reading.

This plugin makes switching cheap (one tool call), explicit (logged as a session event), and non-sticky (the system prompt never changes because of a switch).

## The five modes

| mode | when to switch in | one-line charter |
|---|---|---|
| `base` | default; the entry sentinel | answer directly, no ritual — but judge whether a switch is warranted first |
| `planner` | goal needs a decision-complete plan | the executor who receives the plan makes **zero** further decisions |
| `analyst` | judgment, root-cause, impact assessment | facts referee: gather evidence, state facts and impact, fix nothing, recommend nothing |
| `explorer` | unfamiliar code, read-only reconnaissance | produce structure + responsibilities + key paths; touch nothing |
| `executor` | plan is approved, only hands remain | follow the plan exactly; surface its holes instead of silently improving them |

`base` is the default posture before any switch — there is no mode-less vacuum. Its mindset is mostly a *triage rule*: multi-tool-call task, artifact changes, or an error to diagnose → switch; one-line answer → answer.

Each mode's full methodology (mindset) is returned verbatim as the `switch_mode` tool result — see `MODES` in the API below. Highlights of what each mindset enforces:

- **planner** — distinguish goal-input from plan-input (plan gets two rounds of "why" before completion); every list item independently verifiable; no acceptance criterion means no plan; recommended ruling first, alternatives one-line; oral confirmation is not execution approval.
- **analyst** — reproduce and bisect before conclusions; root cause at "this line, when this condition holds" granularity, never "probably config"; every claim tagged `[已确认] direct evidence / [合理推断] cross-inference / [证据不足] gap stated`.
- **explorer** — breadth-first for unknown trees, depth-first for known targets; long documents land in files before parsing; the same long text re-sliced repeatedly is a failure mode — stop.
- **executor** — check blast radius before touching; look before deleting/overwriting; reversible small ambiguities proceed with a one-line ruling recorded, irreversible ones stop and report; verify after every atomic action, not at the end.

## What a switch does (and does not do)

- ✅ returns the mode's methodology as the ordinary tool result — visible in exactly the phase it guides
- ✅ logs a `mycel/mode` session event (last one wins) — survives compaction and resume
- ✅ idempotent re-switch: after compaction, switching to the *same* mode re-reads its methodology — that is the recovery path
- ❌ does not modify the system prompt, ever
- ❌ is not re-injected on retreat or on any later turn
- ❌ carries no snapshot into other tools' frames (decoupled from the state plugin's task stack since 2026-09-03)

## Core behavior section

The plugin's only system-prompt contribution is one static section (`mycel:core-behavior`, order 10 — right after persona): the mode-independent working principles (root cause before action, honesty about uncertainty, scope discipline, conclusions first, reply completeness). It never changes with switches; the five modes are the *variable* layer on top of that fixed floor.

## Install

```bash
dsh plugin --profile <name> add @xiyiyiru/dsh-mode
```

Peer dependencies (`@deepseek-ai/cordis`, `dsh-agent`, `dsh-session`, `dsh-tools`, `dsh-system-prompt`) resolve from your dsh installation automatically — no manual setup.

## API

```ts
import {
  MODES, CORE_BEHAVIOR, MODE_NAMES, DEFAULT_MODE,
  SWITCH_MODE, SWITCH_MODE_DESCRIPTION,
  effectiveMode, foldMode,
  type ModeName, type ModeSpec,
} from '@xiyiyiru/dsh-mode'
```

| export | what it is |
|---|---|
| `MODES` | the five `ModeSpec`s — `name`, `mindset` (the methodology text), `triggerScenario` |
| `CORE_BEHAVIOR` | the static core-principles section text |
| `MODE_NAMES` / `DEFAULT_MODE` | the tool's enum values / `'base'` |
| `SWITCH_MODE` / `SWITCH_MODE_DESCRIPTION` | the tool's name and model-facing description |
| `foldMode(events)` | fold a session log: the mode in force, or `undefined` before the first switch |
| `effectiveMode(events)` | `foldMode(events) ?? 'base'` — never undefined |

Session event: `mycel/mode` `{ mode: ModeName }` — log-only, non-surface, whole-value replace.

## Design notes

- **Guidance, not checklist**: each mindset steers judgment; it explicitly says "取舍,不必逐条对照" (use judgment, don't tick boxes).
- **Injection at the switch point** is the whole point: the methodology is read when the phase begins, costs nothing before or after.
- **Decoupled**: no dependency on other mycel plugins; pairs well with (but does not require) `@xiyiyiru/dsh-state`'s task stack — the stack restores your task, the re-switch restores your methodology.

## License

MIT
