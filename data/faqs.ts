import type { FaqItem } from "@/types";

/**
 * Landing-page FAQ. Rendered visibly by `FaqSection` and emitted as FAQPage
 * JSON-LD from the same array.
 *
 * Every factual answer must be defensible from the question bank or RVV 1990 -
 * these are consumer-facing claims, same bar as `data/constants.ts`. No price
 * claims here: the copy is static but the offer is behind PREMIUM_ENABLED.
 */
export const LANDING_FAQS: FaqItem[] = [
  {
    q: "Do I need an account to start?",
    a: "No. You can start answering questions straight away and your progress is kept in your browser. Signing in later saves that progress to your account so it survives a new device or a cleared browser.",
  },
  {
    q: "Is CycleDutch an official Dutch cycling licence or exam?",
    a: "No. There is no cycling licence in the Netherlands, and CycleDutch is not affiliated with any Dutch authority. It is a preparation course: the questions and explanations are based on Dutch traffic law (RVV 1990) so you know the rules before your first ride.",
  },
  {
    q: "How long does it take?",
    a: "Most people work through a module in a few minutes. There are seven modules plus a final test, so the whole course is comfortably a single sitting - and you can stop and come back, since your place is saved.",
  },
  {
    q: "Do I need a helmet to cycle in the Netherlands?",
    a: "No. There is no legal helmet requirement and most Dutch cyclists do not wear one. The exception is speed pedelecs (fast e-bikes up to 45km/h), whose riders must wear an approved helmet.",
  },
  {
    q: "I already cycle in my own country. Is this still useful?",
    a: "That is exactly who it is built for. The riding is not the hard part - the priority rules, road markings, and the sheer density of other cyclists are. CycleDutch targets the rules that differ from what you already know.",
  },
];
