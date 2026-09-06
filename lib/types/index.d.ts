/**
 * mycel working modes: a `switch_mode` tool whose selection is logged per agent
 * (`mycel/mode`, last one wins) and whose selected methodology is returned as
 * the ordinary tool result — guidance injected at the moment of the switch for
 * the phase ahead, not standing law: it is not repeated, not re-injected on
 * retreat, and the system prompt never changes because of a switch. The
 * mode-independent core-behavior section is the only mode-owned system-prompt
 * contribution. Fully decoupled from @mycel/dsh-state since 2026-09-03: the
 * focus stack no longer snapshots or restores the seat — re-switching the same
 * mode (idempotent) is the recovery path after compaction.
 *
 * @module @xiyiyiru/dsh-mode
 */
import type { Context } from '@deepseek-ai/cordis';
import type { SessionEvent } from '@deepseek-ai/dsh-session';
/** The five working modes a session can hold. */
export type ModeName = 'base' | 'planner' | 'analyst' | 'explorer' | 'executor';
/** The mode a session renders before its first switch: the plain default posture. */
export declare const DEFAULT_MODE: ModeName;
/** One working mode: its methodology text and when to choose it. */
export interface ModeSpec {
    /** Unique mode name accepted by the `switch_mode` tool. */
    readonly name: ModeName;
    /** The methodology returned as the ordinary `switch_mode` tool result. */
    readonly mindset: string;
    /** One-phrase scenario naming when this mode fits. */
    readonly triggerScenario: string;
}
declare module '@deepseek-ai/dsh-session/types' {
    interface SessionEventMap {
        /**
         * Which working mode is in force from this point on: log-only,
         * non-surface, whole-value replace. The last `mycel/mode` wins; a log
         * with none renders {@link DEFAULT_MODE} through {@link effectiveMode}.
         * @param data.mode - the selected {@link ModeName}.
         */
        'mycel/mode': {
            mode: ModeName;
        };
    }
}
/** The model-facing mode tool's name. */
export declare const SWITCH_MODE = "switch_mode";
/**
 * The mode tool's model-facing description: when to switch and what a switch
 * delivers. Static text — part of the tool surface, never injected per-request.
 */
export declare const SWITCH_MODE_DESCRIPTION: string;
/** Shared values that hold in every mode (defaults first, protocol as the exception). */
export declare const CORE_BEHAVIOR = "## \u5DE5\u4F5C\u51C6\u5219\n\n- **\u5148\u95EE\u6839\u56E0**:\u52A8\u624B\u524D\u95EE\u6839\u672C\u539F\u56E0\u662F\u4EC0\u4E48\u2014\u2014\u7B54\u6848\u6D6E\u51FA\u6765\u4E4B\u524D,\u65B9\u6848\u90FD\u662F\u731C\u60F3\u3002\u4E0D\u7528 --force \u6216\u8DF3\u8FC7\u68C0\u67E5\u7ED5\u8FC7\u5B89\u5168\u673A\u5236;\u540C\u4E00\u5DE5\u5177\u8FDE\u8D25 2 \u6B21\u5373\u505C\u3002\n- **\u8BDA\u5B9E\u4E0E\u9A8C\u8BC1**:\u4E0D\u786E\u5B9A\u5C31\u8BF4\u4E0D\u786E\u5B9A,\u5931\u8D25\u5C31\u8BF4\u5931\u8D25;\u58F0\u79F0\u5B8C\u6210\u5FC5\u9644\u5B9E\u9645\u547D\u4EE4\u4E0E\u8F93\u51FA\u3002\u5BA3\u5E03\u5B8C\u6210\u524D\u9010\u9879\u6838\u5BF9\u9700\u6C42,\u6CA1\u6D4B\u8FC7\u7684\u8FB9\u754C\u7B49\u4E8E\u6CA1\u5B8C\u6210\u3002\n- **\u8303\u56F4\u4E0E\u4E0D\u5939\u5E26**:\u53EA\u505A\u88AB\u660E\u786E\u8981\u6C42\u7684\u4E8B;\u81EA\u5DF1\u7684\u8865\u5145\u663E\u5F0F\u6807\u6CE8\u300C\u5EFA\u8BAE\u300D;\u66FF\u7528\u6237\u505A\u7684\u7406\u89E3\u9009\u62E9\u58F0\u660E\u300C\u5047\u8BBE:xxx(\u4F9D\u636E yyy)\u300D;\u5468\u8FB9\u95EE\u9898\u8BB0\u9644\u5E26\u53D1\u73B0,\u6536\u5C3E\u65F6\u63D0\u51FA,\u4E0D\u987A\u624B\u4FEE\u3002\n- **\u6C9F\u901A**:\u7ED3\u8BBA\u5148\u884C,\u6539\u52A8\u62A5\u544A\u5E26\u8DEF\u5F84+\u884C\u53F7\u3002\n- **\u9ED8\u8BA4\u76F4\u7ED9,\u534F\u8BAE\u9760\u540E**:\u7B80\u5355\u95EE\u9898\u76F4\u63A5\u56DE\u7B54,\u4E0D\u8BBE\u4EEA\u5F0F;\u6743\u8861\u7ED9\u63A8\u8350\u88C1\u51B3,\u4E0D\u51FA\u9009\u9879\u7EFC\u8FF0,\u4E0D\u91CD\u5F00\u7528\u6237\u5DF2\u5B9A\u7684\u51B3\u7B56;\u591A\u6B65\u4EFB\u52A1\u5148 focus_task \u9501\u8FB9\u754C(focus_task \u7BA1\u4EFB\u52A1\u8303\u56F4,switch_mode \u7BA1\u5DE5\u4F5C\u6253\u6CD5,\u4E24\u8005\u6B63\u4EA4,\u522B\u6DF7\u7528),\u6253\u6CD5\u53D8\u4E86\u624D\u7528 switch_mode \u6362\u65B9\u6CD5\u8BBA\u2014\u2014\u65B9\u6CD5\u8BBA\u968F\u5207\u6362\u6CE8\u5165,\u5F15\u5BFC\u672C\u9636\u6BB5\u5DE5\u4F5C,\u4E0D\u662F\u786C\u6027\u6E05\u5355\u3002\n- **\u56DE\u5408\u5B8C\u5907**:\u7ED3\u675F\u56DE\u5408\u524D\u68C0\u67E5\u6700\u540E\u4E00\u6BB5\u2014\u2014\u662F\u8BA1\u5212\u3001\u63D0\u95EE\u3001\u5F85\u529E\u6216\u672A\u5151\u73B0\u7684\u627F\u8BFA(\u300C\u6211\u5C06\u2026\u300D),\u7ACB\u5373\u7528\u5DE5\u5177\u505A\u6389;\u7ED3\u8BBA\u4E0E\u4EA4\u4ED8\u7269\u843D\u5728\u6700\u540E\u4E00\u6761\u6D88\u606F\u91CC,\u4E4B\u540E\u4E0D\u518D\u8C03\u5DE5\u5177\u3002\u5DE5\u5177\u8C03\u7528\u88AB\u7528\u6237\u62D2\u7EDD\u2192\u6362\u65B9\u6848\u518D\u8BD5,\u539F\u6837\u91CD\u8BD5\u5373\u5931\u683C\u3002\u4E0A\u4E0B\u6587\u538B\u7F29\u4F1A\u81EA\u52A8\u6458\u8981\u7EED\u7A97,\u4E0D\u56E0\u4F1A\u8BDD\u957F\u800C\u63D0\u524D\u6536\u5C3E\u3002";
/** The five built-in modes (base is the plain default posture; the rest are phase methodologies). */
export declare const MODES: Readonly<Record<ModeName, ModeSpec>>;
/** All mode names, as the parameter enum of the `switch_mode` tool. */
export declare const MODE_NAMES: readonly ModeName[];
/**
 * The mode in force after the first `end` events. The last `mycel/mode` wins;
 * a prefix with none is mode-less.
 * @param events - the session log or any prefix of it.
 * @param end - fold `events[0, end)`; defaults to the whole log.
 * @returns the mode in force, or `undefined` before the first switch.
 */
export declare function foldMode(events: readonly SessionEvent[], end?: number): ModeName | undefined;
/**
 * The mode a session renders: its folded switch history, or {@link DEFAULT_MODE}
 * before the first switch. There is no mode-less vacuum — every request lives
 * inside some methodology (base is the default posture until a switch happens).
 * @param events - the session log or any prefix of it.
 * @returns the effective mode, never `undefined`.
 */
export declare function effectiveMode(events: readonly SessionEvent[]): ModeName;
/**
 * Register the static `mycel:core-behavior` prompt section and the
 * `switch_mode` tool on the calling context. A mode's methodology is delivered
 * once, as the switch's ordinary tool result, and guides the phase ahead; it
 * never enters the system prompt.
 * @param ctx - registrant context carrying the prompt and tool registries.
 */
export declare function apply(ctx: Context): void;
/** Cordis function-plugin name. */
export declare const name = "mycel-mode";
/** Services required before the plugin can register its section and tool. */
export declare const inject: string[];
