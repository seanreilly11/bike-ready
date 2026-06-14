// Feature flags.
//
// Opt-in semantics: a flag is ON only when its env var is exactly "true".
// Unset, "false", "0", or any typo keeps it OFF. NEXT_PUBLIC_* so the same
// value is read on the server (route gating) and inlined into the client
// bundle (hiding UI). Inlined at build time — flipping a flag needs a rebuild.
const flag = (value: string | undefined) => value === "true";

export const PREMIUM_ENABLED = flag(process.env.NEXT_PUBLIC_PREMIUM_ENABLED);
export const TEST_ENABLED = flag(process.env.NEXT_PUBLIC_TEST_ENABLED);
