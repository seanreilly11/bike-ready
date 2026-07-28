import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "./lib/supabase/server";
import {
  HERO_COPY_TEST,
  HERO_COPY_VARIANTS,
  abCookieName,
  isHeroCopyVariant,
} from "./lib/abTest";

const AB_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function proxy(request: NextRequest) {
  // Assign the hero-copy A/B variant before building the response so the server
  // renders the correct copy in the initial HTML (no control→variant flash).
  // Only assign when there's no valid bucket yet - stable per user after that.
  const abCookie = abCookieName(HERO_COPY_TEST);
  const newHeroVariant = isHeroCopyVariant(request.cookies.get(abCookie)?.value)
    ? null
    : HERO_COPY_VARIANTS[
        Math.floor(Math.random() * HERO_COPY_VARIANTS.length)
      ];
  if (newHeroVariant) {
    // Visible to this render's server component via the forwarded request.
    request.cookies.set(abCookie, newHeroVariant);
  }

  const supabaseResponse = NextResponse.next({ request });

  if (newHeroVariant) {
    // Persist to the browser for subsequent requests.
    //
    // This MUST go through next/headers cookies(), not
    // supabaseResponse.cookies. Next's proxy adapter collects every cookie
    // mutated through that store and finishes the request with
    // `response.headers.set('set-cookie', ...)` - a set, not an append. Any
    // cookie written straight onto the response is silently dropped the moment
    // Supabase's setAll refreshes the session through the same store, because
    // only cookies mutated via the store are in the serialized list. Routing
    // both writes through one channel is what keeps them both on the response.
    const cookieStore = await cookies();
    cookieStore.set(abCookie, newHeroVariant, {
      path: "/",
      maxAge: AB_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  const supabase = await createClient();

  // Refresh the session - must not be removed.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
