import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apply } from '../src/index.ts'

interface RegisteredSection {
  name: string
  order: number
  text: string | ((context: unknown) => string)
}

/** Capture section registrations from a stub registrant context. */
function registeredSections(): RegisteredSection[] {
  const sections: RegisteredSection[] = []
  apply({
    systemPrompt: { section: (s: RegisteredSection) => sections.push(s) },
    tools: { register: () => {} },
  } as unknown as Parameters<typeof apply>[0])
  return sections
}

/** Minimal shape of a registered tool the execute path needs. */
interface RegisteredTool {
  name: string
  execute(args: unknown, exec: unknown): Promise<unknown>
}

/** Capture tool registrations from a stub registrant context. */
function registeredTools(): RegisteredTool[] {
  const tools: RegisteredTool[] = []
  apply({
    systemPrompt: { section: () => {} },
    tools: { register: (t: RegisteredTool) => { tools.push(t) } },
  } as unknown as Parameters<typeof apply>[0])
  return tools
}

test('mycel:core-behavior is the only mode-owned system-prompt section', () => {
  const sections = registeredSections()
  const byName = new Map(sections.map(s => [s.name, s]))
  const core = byName.get('mycel:core-behavior')
  assert.ok(core !== undefined, 'core-behavior section registered')
  assert.equal(typeof core.text, 'string', 'core-behavior section is static')
  assert.equal(byName.has('mycel:mode'), false, 'mode does not register a system-prompt section')
})

// ── 五模式（2026-09-03 v6：引导式重写——方法论随切换注入引导本阶段，非硬性清单） ──

import {
  CORE_BEHAVIOR, DEFAULT_MODE, MODES, MODE_NAMES, SWITCH_MODE_DESCRIPTION,
} from '../src/index.ts'

test('五模式齐备：base 为默认态，switch_mode 枚举含 base', () => {
  assert.deepEqual([...MODE_NAMES], ['base', 'planner', 'analyst', 'explorer', 'executor'])
  assert.equal(DEFAULT_MODE, 'base')
  for (const name of MODE_NAMES) assert.ok(MODES[name] !== undefined, `${name} spec present`)
})

test('execute 无状态：无 agent 也直接返回方法论，不写任何事件（rc.6 起）', async () => {
  const tool = registeredTools().find(t => t.name === 'switch_mode')
  assert.ok(tool !== undefined, 'switch_mode registered')
  // exec 不带 agent——旧版在这里抛"requires a calling agent"，新版必须纯返回
  const result = await tool.execute({ mode: 'planner' }, {}) as { mode: string; mindset: string }
  assert.equal(result.mode, 'planner')
  assert.equal(result.mindset, MODES.planner.mindset)
  const repeated = await tool.execute({ mode: 'planner' }, {}) as { mindset: string }
  assert.equal(repeated.mindset, MODES.planner.mindset, '重复切换幂等重读')
})

// ── v6 引导式准则：默认直给 + 例外协议（改半个字即红） ──

test('v6 准则在场：默认直给在前，协议靠后（整句断言）', () => {
  // 5 原则逐条
  assert.ok(CORE_BEHAVIOR.includes('答案浮出来之前,方案都是猜想'), '①根因先问')
  assert.ok(CORE_BEHAVIOR.includes('同一工具连败 2 次即停'), '①2次即停亮线')
  assert.ok(CORE_BEHAVIOR.includes('声称完成必附实际命令与输出'), '③证据具体性')
  assert.ok(CORE_BEHAVIOR.includes('没测过的边界等于没完成'), '③环节亮线')
  assert.ok(CORE_BEHAVIOR.includes('声明「假设:xxx(依据 yyy)」'), '④假设声明')
  assert.ok(CORE_BEHAVIOR.includes('记附带发现,收尾时提出,不顺手修'), '④附带发现')
  assert.ok(CORE_BEHAVIOR.includes('结论先行,改动报告带路径+行号'), '⑤结论先行')
  assert.ok(CORE_BEHAVIOR.includes('简单问题直接回答,不设仪式'), '⑤默认直给（v6 灵魂句）')
  assert.ok(CORE_BEHAVIOR.includes('方法论随切换注入,引导本阶段工作,不是硬性清单'), '⑤引导定位')
  assert.ok(CORE_BEHAVIOR.includes('立即用工具做掉'), '⑥回合完备（v7 zcode 对比落地）')
  assert.ok(CORE_BEHAVIOR.includes('之后不再调工具'), '⑥最终消息承载一切')
  assert.ok(CORE_BEHAVIOR.includes('原样重试即失格'), '⑥denied≠error')
  assert.ok(CORE_BEHAVIOR.includes('不因会话长而提前收尾'), '⑥压缩继续性（2026-09-03 zcode 原文二轮）')
  assert.ok(CORE_BEHAVIOR.includes('权衡给推荐裁决'), '⑤推荐裁决（2026-09-03 zcode 原文二轮）')
  // mindset 关键句（v6）
  assert.ok(MODES.base.mindset.includes('直接回答、直接干活,不设仪式'), 'base 默认姿态')
  assert.ok(MODES.base.mindset.includes('拿不准选更重的那侧'), 'base 取重棘轮')
  assert.ok(MODES.planner.mindset.includes('执行者拿到后无需再做任何决策'), 'planner 首句')
  assert.ok(MODES.planner.mindset.includes('口头确认不构成执行批准'), 'planner 批准语义')
  assert.ok(MODES.planner.mindset.includes('答不上来说明分析没做完'), 'planner 出口自检')
  assert.ok(MODES.analyst.mindset.includes('[证据不足] 标注缺口'), 'analyst 三级标注')
  assert.ok(MODES.analyst.mindset.includes('产出物是分析的收据'), 'analyst 产出物收据')
  assert.ok(MODES.explorer.mindset.includes('长文本先落地再解析'), 'explorer 长文本落地')
  assert.ok(MODES.explorer.mindset.includes('切片挖矿是失败模式,立即停'), 'explorer 切片挖矿')
  assert.ok(MODES.executor.mindset.includes('指定的做法不擅自换成「更好的」'), 'executor 执行忠实')
  assert.ok(MODES.executor.mindset.includes('原有行为、接口、输出不变'), 'executor 加新不破旧')
  assert.ok(MODES.executor.mindset.includes('写后读回确认改动'), 'executor 写后读回')
  // 工具描述：引导定位 + 幂等重读
  assert.ok(SWITCH_MODE_DESCRIPTION.includes('是引导不是清单'), '描述引导定位')
  assert.ok(SWITCH_MODE_DESCRIPTION.includes('幂等'), '描述幂等重读')
  assert.ok(SWITCH_MODE_DESCRIPTION.includes('简单问答直接答'), '描述默认豁免')
  assert.ok(!SWITCH_MODE_DESCRIPTION.includes('Switch the working mode'), '英文长段不得回流')
})

test('v6 防棘轮：仪式性旧句与黑话不得回流', () => {
  const all = [CORE_BEHAVIOR, SWITCH_MODE_DESCRIPTION, ...Object.values(MODES).map(m => m.mindset)].join('\n')
  for (const gone of [
    '说出口让用户可当场纠正',          // base 分类承诺（v6 删：分类内化，不说出口）
    '先锁再切',                        // 顺序硬规则（v6 删：顺序不是规则）
    '当发现',                          // 否定式失败模式句式（v6 删）
    '座位', '落座', '亮牌', '分诊',    // 黑话（v6 删：换平实词）
    '处理规则住在座位里',              // v5 总纲
    '立任务质疑前提,不是再试一次',     // v5 质疑前提尾巴
    '自信≠证据,上次运行≠证据,他人回报≠证据',  // v5 证据三不等式
    '只问三种:确认、选择、缺信息',     // v5 三种提问
    '问出决策性问题,或交付完整结果',   // v5 两种收尾
  ]) {
    assert.ok(!all.includes(gone), `旧句不得回流: ${gone}`)
  }
  // 密度预算（v7 2026-09-03 zcode 对比：回合完备进 core，800→950、5→6 原则）
  assert.ok(CORE_BEHAVIOR.length <= 950, `core 密度预算 ≤950 字符（实际 ${CORE_BEHAVIOR.length}）`)
  assert.equal(CORE_BEHAVIOR.split('- **').length - 1, 6, 'core 恰好 6 原则')
  for (const m of Object.values(MODES)) {
    assert.ok(!m.mindset.includes('当发现'), `${m.name} mindset 无否定式句式`)
  }
})
