import { createBrowserClient } from "@supabase/ssr";

// Opt-in auth tracing for debugging hangs: run
//   localStorage.setItem("sb_auth_debug", "1")
// then reload. auth-js logs every lock acquire/release, session load, token
// refresh and state-change notification, so a stalled call shows up as the
// point the log stops. The client is a singleton, so the flag is only read on
// first creation - it must be set before the reload, not after.
function authDebugEnabled(): boolean {
    if (typeof window === "undefined") return false;
    try {
        return window.localStorage.getItem("sb_auth_debug") === "1";
    } catch {
        return false;
    }
}

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        { auth: { debug: authDebugEnabled() } },
    );
}
