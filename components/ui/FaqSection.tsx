import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/types";

/**
 * Visible FAQ list, each answer collapsed into an accordion. Pair with
 * `faqPageJsonLd(items)` from the same array - Google drops FAQPage markup
 * whose answers are not rendered on the page.
 *
 * Native <details>/<summary> rather than useState: no client bundle, works
 * without JS, and crawlers read collapsed <details> content normally. The
 * first item starts open so the section does not read as an empty list.
 */
export default function FaqSection({
  items,
  heading = "Common questions",
  id = "faq-heading",
}: {
  items: FaqItem[];
  heading?: string;
  id?: string;
}) {
  return (
    <section
      className="mt-12 pt-8 border-t border-stone-200 animate-fade-up"
      aria-labelledby={id}
    >
      <h2 id={id} className="font-display font-bold text-stone-900 text-lg mb-4">
        {heading}
      </h2>
      <div className="flex flex-col gap-2">
        {items.map((faq, i) => (
          <details
            key={faq.q}
            open={i === 0}
            className="group bg-white border border-stone-200 rounded-xl open:border-stone-300 transition-colors duration-150"
          >
            <summary
              className={[
                // Safari ignores list-none on summary; kill its marker too.
                "flex items-center justify-between gap-3 cursor-pointer",
                "list-none [&::-webkit-details-marker]:hidden",
                "px-4 py-3 rounded-xl",
                "font-display font-semibold text-stone-900 text-sm",
                "hover:text-orange transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
              ].join(" ")}
            >
              {faq.q}
              <ChevronDown
                size={16}
                aria-hidden="true"
                className="shrink-0 text-stone-400 transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <p className="px-4 pb-3 text-stone-600 text-sm leading-relaxed">
              {faq.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
