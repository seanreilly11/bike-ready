import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Imprint",
  description: "Legal information about the operator of CycleDutch.",
  alternates: { canonical: "/imprint" },
};

export default function ImprintPage() {
  return (
    <>
      <h1 className="font-display font-bold text-2xl text-stone-900 mb-10">
        Imprint
      </h1>

      {/* Operator */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Operator
        </h2>
        <address className="not-italic text-sm text-stone-600 leading-relaxed space-y-0.5">
          <p>Dovedale Development</p>
          <p>Eenmanszaak (sole proprietorship)</p>
          <p>Wolbrantskerkweg 187A</p>
          <p>1069 CL Amsterdam</p>
          <p>Netherlands</p>
        </address>
      </section>

      {/* Registration */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Registration
        </h2>
        <dl className="space-y-1.5">
          {[
            {
              term: "KvK (Chamber of Commerce)",
              detail: "42110285",
            },
            {
              term: "BTW (VAT)",
              detail: "Exempt under KOR small business scheme",
            },
          ].map((item) => (
            <div key={item.term} className="flex gap-2 text-sm">
              <dt className="text-stone-900 font-semibold shrink-0">
                {item.term}:
              </dt>
              <dd className="text-stone-600">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Contact */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Contact
        </h2>
        <dl className="space-y-1.5">
          {[
            { term: "Email", detail: "dovedaledev@gmail.com" },
            {
              term: "Response time",
              detail: "Within 5 business days",
            },
          ].map((item) => (
            <div key={item.term} className="flex gap-2 text-sm">
              <dt className="text-stone-900 font-semibold shrink-0">
                {item.term}:
              </dt>
              <dd className="text-stone-600">{item.detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Responsible for content */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Responsible for content
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          Dovedale Development (address as above)
        </p>
      </section>

      {/* Dispute resolution */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Dispute resolution
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          The European Commission provides an online dispute resolution platform
          for consumer disputes:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            className="text-orange hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            ec.europa.eu/consumers/odr
          </a>
          . We are not obliged to participate in dispute resolution proceedings
          before a consumer arbitration board, but we are willing to seek an
          out-of-court settlement in the event of a dispute.
        </p>
      </section>

      {/* Liability for content */}
      <section className="mb-8">
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Liability for content
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          The content of CycleDutch has been compiled with care. However, we
          cannot guarantee the accuracy, completeness, or currency of the
          content. CycleDutch provides educational content for informational
          purposes. For definitive legal information about Dutch traffic law,
          consult official government sources or a qualified legal professional.
        </p>
      </section>

      {/* Copyright */}
      <section>
        <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
          Copyright
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed">
          All content published on CycleDutch is subject to Dutch and
          international copyright law. Any use, reproduction, or distribution of
          content without the express written permission of Dovedale Development
          is prohibited.
        </p>
      </section>
    </>
  );
}
