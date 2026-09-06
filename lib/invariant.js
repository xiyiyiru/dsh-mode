import { MODE_NAMES } from "./index.js";
//#region lib/types/invariant.js
/** Package-owned invariant companion for `@mycel/dsh-mode`. @module @xiyiyiru/dsh-mode/invariant */
const PACKAGE_NAME = "@xiyiyiru/dsh-mode";
/** Cordis companion plugin name. */
const name = "mycel-mode-invariant";
/** Service required before the companion can reserve package ownership. */
const inject = ["invariants"];
/**
* Validate one `mycel/mode` event before it reaches the durable log. The tool
* schema already rejects unknown modes at the registry boundary; this checks
* events loaded from or appended to a store (fork imports, hand-written logs).
*/
function validateEvent(event, fail) {
	if (event.type !== "mycel/mode") return;
	const mode = event.data.mode;
	if (typeof mode !== "string" || !MODE_NAMES.includes(mode)) fail(`mycel/mode carries invalid mode ${JSON.stringify(mode)}; expected one of ${MODE_NAMES.join(", ")}`);
}
/** Install validation for loaded and newly appended mycel mode state. */
const install = Object.assign((ctx, fail) => {
	const seed = (session) => {
		for (const event of session.snapshotEvents()) validateEvent(event, fail);
	};
	for (const session of ctx.sessions.list()) seed(session);
	ctx.on("session/created", (session) => {
		seed(session);
	}, { global: true });
	ctx.on("internal/dispatch", (_mode, eventName, args) => {
		if (eventName !== "session/event") return;
		const [, event] = args;
		validateEvent(event, fail);
	}, { global: true });
}, { inject: ["sessions"] });
/**
* Register this package's invariant companion.
* @param ctx - Cordis context carrying the invariant service.
* @returns the installed registration's disposer after setup succeeds.
*/
const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
//#endregion
export { apply, inject, name };
