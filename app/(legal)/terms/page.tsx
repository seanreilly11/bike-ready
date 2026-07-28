import type { Metadata } from "next";
import { APP_PRICE } from "@/data/constants";
import { FREE_PER_MODULE } from "@/types";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using CycleDutch.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <h1 className="font-display font-bold text-2xl text-stone-900 mb-2">
        Terms of service
      </h1>
      <p className="text-xs text-stone-400 font-mono mb-10">
        Last updated: May 2026 · Applies to cycledutch.com
      </p>

      {/* Parties */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Parties
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          These terms govern your use of CycleDutch, operated by Sean Reilly
          (KvK: 42110285), referred to as &quot;we&quot;, &quot;us&quot;, or
          &quot;CycleDutch&quot;. By using CycleDutch you agree to these terms.
        </p>
      </section>

      {/* The product */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          The product
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          CycleDutch is a digital cycling education course designed for expats
          learning to cycle in the Netherlands. The course consists of modules
          containing questions, feedback, and educational content about Dutch
          cycling rules.
        </p>
        <p className="text-sm text-stone-600 leading-relaxed">
          CycleDutch provides educational content for informational purposes
          only. While we make every effort to ensure accuracy, we cannot
          guarantee that the content reflects the most current version of Dutch
          traffic law. Do not rely solely on CycleDutch for legal compliance -
          always consult official sources (RVV 1990, CROW guidelines) for
          definitive legal information.
        </p>
      </section>

      {/* Free access */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Free access
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          The Fundamentals module is available free of charge without an
          account. Free users may also access a limited preview of each paid
          module (currently {FREE_PER_MODULE} questions per module). No payment
          or account is required to access free content.
        </p>
      </section>

      {/* Premium access and payment */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Premium access and payment
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          CycleDutch Premium unlocks the full course for a one-time payment of{" "}
          {APP_PRICE} (inclusive of any applicable taxes). Premium access is
          tied to your account (email address) and does not expire. Payment is
          processed by Paddle, our Merchant of Record. We accept major credit
          and debit cards.
        </p>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          Where we describe Premium as one-time, lifetime, or yours to keep
          forever, we mean that we place no time limit on your access and will
          never convert it into a subscription. We cannot guarantee access
          beyond the life of the service itself: if we discontinue CycleDutch,
          we will tell Premium users by email in advance.
        </p>
        <p className="text-sm text-stone-600 leading-relaxed">
          By completing a purchase you confirm that you are at least 18 years
          old, or that you have obtained the consent of a parent or guardian.
        </p>
      </section>

      {/* Refunds */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Refunds
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          CycleDutch Premium is sold through Paddle, our Merchant of Record.
          Paddle is the seller for your purchase, so Paddle&apos;s terms of sale
          apply alongside these terms. Any statutory consumer rights you have —
          including the right of withdrawal for digital content under EU law —
          are handled by Paddle as part of its checkout, and nothing in these
          terms limits those rights.
        </p>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          On top of that, we offer our own refund policy. If you have not
          accessed any premium content, email dovedaledev@gmail.com within 14
          days of purchase with your purchase confirmation and we will refund
          you in full. Refunds are issued through Paddle and usually reach you
          within 10 business days.
        </p>
        <p className="text-sm text-stone-600 leading-relaxed">
          If you have accessed premium content and believe there is a genuine
          technical fault that prevented you from using the product as
          described, contact us and we will review your case individually.
        </p>
      </section>

      {/* Your account */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Your account
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          You are responsible for maintaining the security of your account. Your
          account is personal and may not be shared or transferred. We reserve
          the right to suspend or terminate accounts that breach these terms.
        </p>
      </section>

      {/* Intellectual property */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Intellectual property
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          All content on CycleDutch - including question text, feedback,
          illustrations, and interface design - is owned by Sean Reilly and
          protected by copyright. You may not copy, reproduce, distribute, or
          create derivative works from our content without written permission.
        </p>
      </section>

      {/* Limitation of liability */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Limitation of liability
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          CycleDutch provides educational content on a best-efforts basis. To
          the fullest extent permitted by law, we exclude liability for:
        </p>
        <ul className="space-y-2 mb-4 pl-4 border-l-2 border-stone-200">
          {[
            "Any inaccuracy in the educational content",
            "Any loss or damage arising from reliance on CycleDutch content",
            "Service interruptions, data loss, or technical failures",
            "Any indirect, consequential, or incidental losses",
          ].map((item) => (
            <li key={item} className="text-sm text-stone-600 leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          Our total liability to you in connection with these terms shall not
          exceed the amount you paid for CycleDutch Premium ({APP_PRICE}).
        </p>
        <p className="text-sm text-stone-600 leading-relaxed">
          Nothing in these terms limits liability for fraud, death or personal
          injury caused by negligence, or any other liability that cannot be
          excluded under applicable law.
        </p>
      </section>

      {/* Governing law */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Governing law
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          These terms are governed by Dutch law. Any disputes shall be subject
          to the jurisdiction of the courts of the Netherlands. EU consumers
          retain the right to bring proceedings in the courts of their country
          of residence.
        </p>
      </section>

      {/* Changes to these terms */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Changes to these terms
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          We may update these terms. We will notify registered users of material
          changes by email at least 14 days before they take effect. Continued
          use after that date constitutes acceptance.
        </p>
      </section>

      {/* Contact */}
      <section>
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Contact
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          Questions about these terms: dovedaledev@gmail.com
        </p>
      </section>
    </>
  );
}
