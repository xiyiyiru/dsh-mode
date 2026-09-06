/** Package-owned invariant companion for `@mycel/dsh-mode`. @module @xiyiyiru/dsh-mode/invariant */

import type { Context } from '@deepseek-ai/cordis'
import type { Session, SessionEvent } from '@deepseek-ai/dsh-session'
import type { InvariantFailure, InvariantInstaller } from '@deepseek-ai/dsh-invariants'
import { MODE_NAMES } from './index.ts'

const PACKAGE_NAME = '@xiyiyiru/dsh-mode'

/** Cordis companion plugin name. */
export const name = 'mycel-mode-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * Validate one `mycel/mode` event before it reaches the durable log. The tool
 * schema already rejects unknown modes at the registry boundary; this checks
 * events loaded from or appended to a store (fork imports, hand-written logs).
 */
function validateEvent(event: SessionEvent, fail: InvariantFailure): void {
  if (event.type !== 'mycel/mode') return
  const mode = (event.data as { mode?: unknown }).mode
  if (typeof mode !== 'string' || !MODE_NAMES.includes(mode as never)) {
    fail(`mycel/mode carries invalid mode ${JSON.stringify(mode)}; expected one of ${MODE_NAMES.join(', ')}`)
  }
}

/** Install validation for loaded and newly appended mycel mode state. */
const install: InvariantInstaller = Object.assign((ctx: Context, fail: InvariantFailure) => {
  const seed = (session: Session): void => {
    for (const event of session.snapshotEvents()) validateEvent(event, fail)
  }
  for (const session of ctx.sessions.list()) seed(session)
  ctx.on('session/created', (session) => { seed(session) }, { global: true })
  ctx.on('internal/dispatch', (_mode, eventName, args) => {
    if (eventName !== 'session/event') return
    const [, event] = args as [Session, SessionEvent]
    validateEvent(event, fail)
  }, { global: true })
}, { inject: ['sessions'] })

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
