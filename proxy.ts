import { NextRequest, NextResponse } from "next/server";
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
    supabaseResponse.cookies.set(abCookie, newHeroVariant, {
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
