import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_NEXT_PATHS = ["/learn", "/review", "/test", "/checkout"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/learn";
  const next = ALLOWED_NEXT_PATHS.includes(rawNext) ? rawNext : "/learn";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/learn?auth_error=1", request.url));
    }

    if (next === "/checkout") {
      // Overlay checkout is client-side - there is no server URL to redirect to.
      // Land on /learn with a flag the client uses to open the Paddle overlay
      // once the session is active.
      return NextResponse.redirect(new URL("/learn?checkout=1", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
