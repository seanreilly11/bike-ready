import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "What cookies CycleDutch uses and why.",
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <>
      <h1 className="font-display font-bold text-2xl text-stone-900 mb-2">
        Cookie policy
      </h1>
      <p className="text-xs text-stone-400 font-mono mb-10">
        Last updated: May 2026 · Applies to cycledutch.com
      </p>

      {/* What are cookies */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          What are cookies
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          Cookies are small text files stored on your device when you visit a
          website. We use cookies and similar local storage technologies to make
          CycleDutch work and to understand how it is used.
        </p>
      </section>

      {/* Cookies we use */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-5">
          Cookies we use
        </h2>

        {/* Strictly necessary */}
        <h3 className="font-display font-semibold text-base text-stone-900 mb-3">
          Strictly necessary{" "}
          <span className="text-xs font-mono font-normal text-stone-400 ml-1">
            no consent required
          </span>
        </h3>
        <div className="overflow-x-auto rounded-xl border border-stone-200 mb-7">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100 text-left">
                <th className="font-display font-semibold text-stone-900 px-4 py-3 whitespace-nowrap">
                  Cookie
                </th>
                <th className="font-display font-semibold text-stone-900 px-4 py-3">
                  Purpose
                </th>
                <th className="font-display font-semibold text-stone-900 px-4 py-3 whitespace-nowrap">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              <tr>
                <td className="px-4 py-3 text-stone-600 align-top font-mono text-xs">
                  sb-[project]-auth-token
                </td>
                <td className="px-4 py-3 text-stone-600 align-top">
                  Supabase authentication session. Keeps you logged in between
                  visits.
                </td>
                <td className="px-4 py-3 text-stone-600 align-top whitespace-nowrap">
                  Until sign-out or 7 days
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-stone-600 align-top font-mono text-xs">
                  progress
                </td>
                <td className="px-4 py-3 text-stone-600 align-top">
                  Stores your question progress in localStorage before you
                  create an account.{" "}
                  <span className="text-stone-400">
                    Not a cookie - localStorage data.
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600 align-top whitespace-nowrap">
                  Until account created or cleared
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-stone-600 align-top font-mono text-xs">
                  onboarding_done
                </td>
                <td className="px-4 py-3 text-stone-600 align-top">
                  Remembers whether you have completed the onboarding overlay.{" "}
                  <span className="text-stone-400">
                    Not a cookie - localStorage data.
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600 align-top whitespace-nowrap">
                  Permanent (localStorage)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Analytics */}
        <h3 className="font-display font-semibold text-base text-stone-900 mb-3">
          Analytics{" "}
          <span className="text-xs font-mono font-normal text-stone-400 ml-1">
            requires consent
          </span>
        </h3>
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100 text-left">
                <th className="font-display font-semibold text-stone-900 px-4 py-3 whitespace-nowrap">
                  Cookie
                </th>
                <th className="font-display font-semibold text-stone-900 px-4 py-3">
                  Purpose
                </th>
                <th className="font-display font-semibold text-stone-900 px-4 py-3 whitespace-nowrap">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              <tr>
                <td className="px-4 py-3 text-stone-600 align-top font-mono text-xs">
                  ph_[project]_posthog
                </td>
                <td className="px-4 py-3 text-stone-600 align-top">
                  PostHog analytics. Tracks anonymised usage patterns - which
                  modules are opened, question completion rates. No personally
                  identifiable data is collected.
                </td>
                <td className="px-4 py-3 text-stone-600 align-top whitespace-nowrap">
                  1 year
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-stone-600 align-top font-mono text-xs">
                  posthog_anonymous_id
                </td>
                <td className="px-4 py-3 text-stone-600 align-top">
                  Anonymous identifier used by PostHog before account creation.
                  Cannot be linked to a real identity.
                </td>
                <td className="px-4 py-3 text-stone-600 align-top whitespace-nowrap">
                  1 year
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Cookie consent */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Cookie consent
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          Strictly necessary cookies are set automatically as they are required
          for the app to function. Analytics cookies are only set after you give
          consent via the cookie banner shown on your first visit.
        </p>
        <p className="text-sm text-stone-600 leading-relaxed">
          You can withdraw consent at any time by clicking &quot;Cookie
          settings&quot; in the footer. Withdrawing consent will stop PostHog
          from collecting new data. It will not delete data already collected.
        </p>
      </section>

      {/* Managing cookies in your browser */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Managing cookies in your browser
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          You can delete or block cookies through your browser settings. Note
          that blocking strictly necessary cookies will prevent you from staying
          logged in. Instructions for major browsers:
        </p>
        <ul className="space-y-2 pl-4 border-l-2 border-stone-200">
          {[
            {
              browser: "Chrome",
              path: "Settings → Privacy and Security → Cookies",
            },
            {
              browser: "Firefox",
              path: "Settings → Privacy and Security → Cookies and Site Data",
            },
            {
              browser: "Safari",
              path: "Settings → Privacy → Manage Website Data",
            },
          ].map((item) => (
            <li
              key={item.browser}
              className="text-sm text-stone-600 leading-relaxed"
            >
              <span className="font-semibold text-stone-900">
                {item.browser}:
              </span>{" "}
              {item.path}
            </li>
          ))}
        </ul>
      </section>

      {/* Third-party cookies */}
      <section>
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Third-party cookies
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          We do not allow third-party advertisers to set cookies on CycleDutch.
          The only third-party cookies are from PostHog (analytics) and Stripe
          (payment processing - only set on the checkout page).
        </p>
      </section>
    </>
  );
}
