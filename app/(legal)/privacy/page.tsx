import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How CycleDutch collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <h1 className="font-display font-bold text-2xl text-stone-900 mb-2">
        Privacy policy
      </h1>
      <p className="text-xs text-stone-400 font-mono mb-10">
        Last updated: July 2026 · Applies to cycledutch.com
      </p>

      {/* Who we are */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Who we are
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          CycleDutch is operated by Sean Reilly, a sole proprietorship
          (eenmanszaak) registered in the Netherlands with KvK number 42110285.
          Our registered address is [YOUR ADDRESS]. You can contact us at
          seanreilly123@hotmail.com.
        </p>
      </section>

      {/* What personal data we collect */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-4">
          What personal data we collect
        </h2>

        <h3 className="font-display font-semibold text-base text-stone-900 mb-2">
          Account data
        </h3>
        <p className="text-sm text-stone-600 leading-relaxed mb-5">
          When you create an account we collect your email address. This is the
          only piece of personal information you provide directly. We use
          Supabase to manage authentication. We do not collect your name, phone
          number, or any other personal details unless you contact us directly.
        </p>

        <h3 className="font-display font-semibold text-base text-stone-900 mb-2">
          Usage data
        </h3>
        <p className="text-sm text-stone-600 leading-relaxed mb-5">
          We collect anonymous analytics about how you use CycleDutch - which
          modules you open, how many questions you answer, and whether you
          complete modules. This data is anonymised before collection and cannot
          be traced back to you as an individual. We use PostHog for analytics.
        </p>

        <h3 className="font-display font-semibold text-base text-stone-900 mb-2">
          Payment data
        </h3>
        <p className="text-sm text-stone-600 leading-relaxed mb-5">
          If you purchase CycleDutch Premium, your payment is processed by
          Stripe. We do not store your card number, bank details, or any full
          payment information. Stripe shares with us only: confirmation that
          payment was successful, the Stripe customer ID, and the payment intent
          ID. See Stripe&apos;s privacy policy at{" "}
          <a
            href="https://stripe.com/privacy"
            className="text-orange hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            stripe.com/privacy
          </a>
          .
        </p>

        <h3 className="font-display font-semibold text-base text-stone-900 mb-2">
          Technical data
        </h3>
        <p className="text-sm text-stone-600 leading-relaxed">
          Our hosting infrastructure (Vercel) may log IP addresses and request
          metadata for security purposes. These logs are retained for a maximum
          of 30 days and are not used for profiling or tracking.
        </p>
      </section>

      {/* Why we use your data */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-4">
          Why we use your data
        </h2>
        <div className="overflow-x-auto rounded-xl border border-stone-200 mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100 text-left">
                <th className="font-display font-semibold text-stone-900 px-4 py-3">
                  Data
                </th>
                <th className="font-display font-semibold text-stone-900 px-4 py-3">
                  Purpose
                </th>
                <th className="font-display font-semibold text-stone-900 px-4 py-3 whitespace-nowrap">
                  Legal basis
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              <tr>
                <td className="px-4 py-3 text-stone-600 align-top">
                  Email address
                </td>
                <td className="px-4 py-3 text-stone-600 align-top">
                  Account authentication (magic link sign-in), service
                  communications
                </td>
                <td className="px-4 py-3 text-stone-600 align-top whitespace-nowrap">
                  Contract performance
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-stone-600 align-top">
                  Progress data
                </td>
                <td className="px-4 py-3 text-stone-600 align-top">
                  Saving and displaying your course progress across sessions
                </td>
                <td className="px-4 py-3 text-stone-600 align-top whitespace-nowrap">
                  Contract performance
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-stone-600 align-top">
                  Payment confirmation
                </td>
                <td className="px-4 py-3 text-stone-600 align-top">
                  Granting and verifying premium access
                </td>
                <td className="px-4 py-3 text-stone-600 align-top whitespace-nowrap">
                  Contract performance
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-stone-600 align-top">
                  Anonymous analytics
                </td>
                <td className="px-4 py-3 text-stone-600 align-top">
                  Understanding how the app is used so we can improve it
                </td>
                <td className="px-4 py-3 text-stone-600 align-top whitespace-nowrap">
                  Legitimate interest
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-stone-600 leading-relaxed">
          We do not use your data for advertising, profiling, or any purpose not
          listed above.
        </p>
      </section>

      {/* Third-party services */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Third-party services
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          CycleDutch uses the following third-party services that may process
          personal data:
        </p>
        <ul className="space-y-3 mb-4">
          {[
            {
              name: "Supabase",
              href: "https://supabase.com",
              label: "supabase.com",
              detail:
                "Authentication and database hosting. Data is stored in the EU. Supabase processes your email address and progress data on our behalf.",
            },
            {
              name: "Stripe",
              href: "https://stripe.com",
              label: "stripe.com",
              detail:
                "Payment processing. Stripe is an independent data controller for payment data. See Stripe’s privacy policy.",
            },
            {
              name: "PostHog",
              href: "https://posthog.com",
              label: "posthog.com",
              detail:
                "Product analytics. We use PostHog in anonymised mode. No personally identifiable information is sent to PostHog.",
            },
            {
              name: "Vercel",
              href: "https://vercel.com",
              label: "vercel.com",
              detail:
                "Hosting infrastructure. Vercel may log request metadata for security purposes.",
            },
          ].map((s) => (
            <li
              key={s.name}
              className="text-sm text-stone-600 leading-relaxed pl-4 border-l-2 border-stone-200"
            >
              <a
                href={s.href}
                className="font-semibold text-stone-900 hover:text-orange transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.name} ({s.label})
              </a>{" "}
              - {s.detail}
            </li>
          ))}
        </ul>
        <p className="text-sm text-stone-600 leading-relaxed">
          We have Data Processing Agreements in place with Supabase, PostHog,
          and Vercel where required under GDPR.
        </p>
      </section>

      {/* Data retention */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Data retention
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          We retain your account and progress data for as long as your account
          is active. If you request account deletion, we will delete your email
          address and progress data within 30 days. Payment records (Stripe
          customer ID and payment confirmation) are retained for 7 years for
          legal and tax purposes.
        </p>
      </section>

      {/* Account deletion */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Account deletion
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          There is currently no in-app way to delete your account. To have your
          account and all associated data deleted, email{" "}
          <a
            href="mailto:seanreilly123@hotmail.com"
            className="text-orange hover:underline"
          >
            seanreilly123@hotmail.com
          </a>{" "}
          from the email address linked to your account. We will delete your
          account, progress, and badges within 30 days and confirm by reply.
          Payment records are retained as described under Data retention.
        </p>
      </section>

      {/* Your rights under GDPR */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Your rights under GDPR
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          As a resident of the European Economic Area you have the following
          rights:
        </p>
        <ul className="space-y-2 mb-4">
          {[
            {
              right: "Access",
              detail: "request a copy of the personal data we hold about you",
            },
            {
              right: "Correction",
              detail: "request correction of inaccurate data",
            },
            {
              right: "Deletion",
              detail: "request deletion of your account and associated data",
            },
            {
              right: "Portability",
              detail: "request your data in a machine-readable format",
            },
            {
              right: "Objection",
              detail: "object to processing based on legitimate interest",
            },
            {
              right: "Restriction",
              detail: "request that we restrict processing of your data",
            },
          ].map((item) => (
            <li
              key={item.right}
              className="text-sm text-stone-600 leading-relaxed flex gap-2"
            >
              <span className="font-semibold text-stone-900 shrink-0">
                {item.right}
              </span>
              <span>- {item.detail}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-stone-600 leading-relaxed">
          To exercise any of these rights, email us at
          seanreilly123@hotmail.com. We will respond within 30 days. You also
          have the right to lodge a complaint with the Dutch Data Protection
          Authority (Autoriteit Persoonsgegevens) at{" "}
          <a
            href="https://autoriteitpersoonsgegevens.nl"
            className="text-orange hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            autoriteitpersoonsgegevens.nl
          </a>
          .
        </p>
      </section>

      {/* Changes to this policy */}
      <section>
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Changes to this policy
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          We may update this privacy policy from time to time. We will notify
          registered users of material changes by email. The date at the top of
          this page reflects when it was last updated.
        </p>
      </section>
    </>
  );
}
