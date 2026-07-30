// Machine-readable halves of the price, for schema.org Offer and Paddle. Keep
// APP_PRICE (the display string) in step with them.
export const APP_PRICE_AMOUNT = "9.99";
export const APP_CURRENCY = "EUR";

export const APP_PRICE = "€9.99";

// Trust line shown in the hero and GateModal. Deliberately a claim about the
// source of the content, not about how many people use it: a user-count claim
// we cannot evidence is a misleading commercial practice under NL/EU consumer
// law. Keep any replacement verifiable from the product itself - 41 questions
// in data/questions.json cite RVV 1990 directly.
export const TRUST_LINE = "Based on Dutch traffic law (RVV 1990)";

// Price anchor: a real Dutch red-light fine for cyclists dwarfs the course
// price, so we show it next to APP_PRICE (never a cost in isolation).
// Verified current 2026-07-28. Tariffs are re-indexed annually - re-check
// against the OM tariff list each year, misleading-advertising risk in NL/EU.
export const RED_LIGHT_FINE = "€160";
