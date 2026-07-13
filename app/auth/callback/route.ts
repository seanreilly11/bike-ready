import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_NEXT_PATHS = ["/learn", "/review", "/test", "/checkout"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
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
      // The session cookies were just written during the code exchange - the
      // incoming request header predates them. Rebuild the header from the
      // mutated cookie store so /api/checkout sees the fresh session.
      const cookieStore = await cookies();
      const cookieHeader = cookieStore
        .getAll()
        .map(({ name, value }) => `${name}=${value}`)
        .join("; ");
      const res = await fetch(`${origin}/api/checkout`, {
        method: "POST",
        headers: { cookie: cookieHeader },
      });
      if (!res.ok) {
        return NextResponse.redirect(
          new URL("/learn?error=checkout_failed", request.url),
        );
      }
      const { url } = (await res.json()) as { url?: string };
      // No url means alreadyPremium - nothing to pay for
      return NextResponse.redirect(url ?? new URL("/learn", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
